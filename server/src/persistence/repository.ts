import { AssetId, roundToPrecision } from '../../../shared/src/assets';
import { LedgerEntry } from '../../../shared/src/ledger';
import { PlayerRecord, SessionRecord } from '../store';
import { clone, DocumentDatabase, DocumentTransaction, PersistedDocument, PersistenceError } from './database';
import { CommandReceipt, CommandResponse, CommandStore, document, FeatureShard, identity, PlayerCore, RANK_BOARDS, SCHEMA_VERSION, SHARDS, splitPlayer, Wallet } from './models';

export interface CommandSpec {
  actor: string;
  openId?: string;
  identityKey?: string;
  now: number;
  entropy: string;
  commandId?: string;
  fingerprint: string;
  mutating: boolean;
  featureId?: string;
  sessionId?: string;
  mailId?: string;
  inviteToken?: string;
  candidates?: Array<Pick<PersistedDocument, '_id' | 'owner'>>;
  views?: PersistedDocument[];
}

interface LoadedPlayer { core: PlayerCore; wallet: Wallet }
interface CommandIntent { fingerprint: string; now: number; entropy: string; candidates: Array<Pick<PersistedDocument, '_id' | 'owner'>> }

export class PersistentRepository {
  constructor(readonly database: DocumentDatabase) {}
  ready(): Promise<void> { return this.database.ready(); }

  async execute(spec: CommandSpec, run: (store: CommandStore) => Promise<CommandResponse>): Promise<CommandResponse> {
    const receivedAt = spec.now;
    if (spec.mutating && spec.commandId) {
      const admitted = await this.database.transaction(async (transaction) => {
        const receipt = await transaction.get(identity('receipt', `${spec.actor}:${spec.commandId}`));
        if (receipt) return { receipt: receipt.payload as CommandReceipt };
        const intentId = identity('intent', `${spec.actor}:${spec.commandId}`);
        const previous = await transaction.get(intentId);
        if (previous) return { intent: previous.payload as CommandIntent };
        const intent: CommandIntent = { fingerprint: spec.fingerprint, now: spec.now, entropy: spec.entropy, candidates: (spec.candidates || []).map(({ _id, owner }) => ({ _id, owner })) };
        await transaction.set(document('intent', spec.actor, `${spec.actor}:${spec.commandId}`, intent, spec.now));
        return { intent };
      });
      const fingerprint = admitted.receipt?.fingerprint ?? admitted.intent!.fingerprint;
      if (fingerprint !== spec.fingerprint) return { status: 409, body: { ok: false, code: 'IDEMPOTENCY_CONFLICT', message: '请求标识已用于其他操作' } };
      if (admitted.receipt) return clone(admitted.receipt.response);
      if (spec.now - admitted.intent!.now > 300000 || Math.floor(spec.now / 86400000) !== Math.floor(admitted.intent!.now / 86400000)) {
        return { status: 409, body: { ok: false, code: 'COMMAND_EXPIRED', message: '操作等待时间过长，请重新操作', retryable: false } };
      }
      spec = { ...spec, now: admitted.intent!.now, entropy: admitted.intent!.entropy, candidates: admitted.intent!.candidates };
    }
    return this.database.transaction(async (transaction) => {
      const receiptId = spec.commandId ? identity('receipt', `${spec.actor}:${spec.commandId}`) : undefined;
      if (receiptId) {
        const receiptDocument = await transaction.get(receiptId);
        if (receiptDocument) {
          const receipt = receiptDocument.payload as CommandReceipt;
          return receipt.fingerprint === spec.fingerprint ? clone(receipt.response) : { status: 409, body: { ok: false, code: 'IDEMPOTENCY_CONFLICT', message: '请求标识已用于其他操作' } };
        }
      }
      const store = new CommandStore(spec.now, spec.entropy, spec.actor);
      const before = new Map<string, PersistedDocument>();
      const players = new Map<string, LoadedPlayer>();
      const get = async (id: string): Promise<PersistedDocument | null> => {
        if (before.has(id)) return before.get(id)!;
        const found = await transaction.get(id);
        if (found) before.set(id, found);
        return found;
      };
      const loadPlayer = async (playerId: string, allowMissing = false): Promise<void> => {
        if (players.has(playerId)) return;
        const coreDocument = await get(identity('player', playerId));
        if (!coreDocument) {
          if (allowMissing) return;
          throw new PersistenceError('PERSISTENCE_CORRUPT', 'Referenced player is missing');
        }
        const core = coreDocument.payload as PlayerCore;
        if (core.schema !== SCHEMA_VERSION || core.playerId !== playerId || !Number.isSafeInteger(core.revision)) throw new PersistenceError('PERSISTENCE_CORRUPT', 'Unsupported player schema');
        const walletDocument = await get(identity('wallet', playerId));
        if (!walletDocument) throw new PersistenceError('PERSISTENCE_CORRUPT', 'Player wallet is missing');
        const wallet = walletDocument.payload as Wallet;
        if (!Number.isSafeInteger(wallet.seq) || wallet.seq < 0) throw new PersistenceError('PERSISTENCE_CORRUPT', 'Invalid wallet sequence');
        const { revision: _revision, schema: _schema, nonce, sequences: _sequences, ...playerCore } = core;
        const player: PlayerRecord = { ...clone(playerCore), counters: {}, timestamps: {}, inventory: {} };
        for (let index = 0; index < SHARDS; index++) {
          const feature = await get(identity('features', `${playerId}:${index}`));
          const inventory = await get(identity('inventory', `${playerId}:${index}`));
          if (!feature || !inventory) throw new PersistenceError('PERSISTENCE_CORRUPT', 'Player partition is missing');
          const state = feature.payload as FeatureShard;
          Object.assign(player.counters, clone(state.counters));
          Object.assign(player.timestamps, clone(state.timestamps));
          Object.assign(player.inventory, clone(inventory.payload));
        }
        store.data.players[playerId] = player;
        store.data.openIdIndex[player.openId] = playerId;
        if (nonce) store.data.actionNonces[playerId] = clone(nonce);
        players.set(playerId, { core: clone(core), wallet: clone(wallet) });
      };
      let identityDocument: PersistedDocument | null = null;
      if (spec.identityKey) {
        identityDocument = await get(identity('identity', spec.identityKey));
        if (identityDocument && (identityDocument.payload as { playerId: string }).playerId !== spec.actor) throw new PersistenceError('PERSISTENCE_CORRUPT', 'Identity mapping is inconsistent');
      }
      await loadPlayer(spec.actor, true);
      if (spec.openId && identityDocument && !players.has(spec.actor)) throw new PersistenceError('PERSISTENCE_CORRUPT', 'Identity points to a missing player');
      if (!spec.openId && !players.has(spec.actor)) return { status: 401, body: { ok: false, code: 'AUTH_REQUIRED', message: '账号不存在，请重新登录' } };
      if (spec.inviteToken) {
        const inviteDocument = await get(identity('invite', spec.inviteToken));
        if (inviteDocument) {
          const invite = clone(inviteDocument.payload) as { inviterId: string; createdAt: number; usedBy?: string };
          store.data.inviteTokens[spec.inviteToken] = invite;
          await loadPlayer(invite.inviterId);
        }
      }
      store.ledger.loadWallets(Object.fromEntries(Array.from(players).map(([playerId, loaded]) => [playerId, loaded.wallet.balances])));
      for (const board of RANK_BOARDS) {
        const rank = await get(identity('rank', `${spec.actor}:${board}`));
        if (rank) store.data.ranks[board] = { [spec.actor]: rank.score };
      }
      let featureId = spec.featureId;
      if (spec.sessionId) {
        const sessionDocument = await get(identity('session', spec.sessionId));
        if (sessionDocument && sessionDocument.owner === spec.actor) {
          const session = clone(sessionDocument.payload) as SessionRecord;
          store.data.sessions[session.sessionId] = session;
          featureId ??= session.featureId;
        }
      }
      if (featureId) {
        const slot = await get(identity('slot', `${spec.actor}:${featureId}`));
        const activeId = (slot?.payload as { sessionId?: string } | undefined)?.sessionId;
        if (activeId) {
          const active = await get(identity('session', activeId));
          if (!active || active.owner !== spec.actor) throw new PersistenceError('PERSISTENCE_CORRUPT', 'Session slot is inconsistent');
          store.data.sessions[activeId] = clone(active.payload) as SessionRecord;
        }
      }
      if (spec.mailId) {
        const mail = await get(identity('mail', spec.mailId));
        if (mail?.owner === spec.actor) store.data.mails.push(clone(mail.payload) as any);
      }
      for (const candidate of spec.candidates || []) {
        if (candidate.owner === spec.actor) continue;
        const current = await get(candidate._id);
        if (current?.kind === 'player') {
          const core = current.payload as PlayerCore;
          store.data.players[core.playerId] = { ...clone(core), inventory: {}, counters: {}, timestamps: {} };
          store.candidateIds.push(core.playerId);
        }
      }
      for (const view of spec.views || []) this.addView(store, view, spec.actor);
      let response = clone(await run(store));
      if (!spec.mutating || response.status >= 500) return response;
      if (response.body?.ok === true && Array.from(before.values()).some((entry) => {
        if (entry.kind !== 'features') return false;
        const previous = (entry.payload as FeatureShard).timestamps;
        const next = store.player(entry.owner)?.timestamps || {};
        return Object.entries(previous).some(([key, value]) => value <= receivedAt && next[key] > 0 && next[key] < value);
      })) response = { status: 409, body: { ok: false, code: 'COMMAND_SUPERSEDED', message: '进度已更新，请重新操作', retryable: false } };
      const successful = response.status < 400 && response.body?.ok === true;
      if (successful) await this.commit(transaction, before, players, store, spec);
      else {
        for (const [playerId, loaded] of players) {
          await transaction.set(document('player', playerId, playerId, { ...loaded.core, revision: loaded.core.revision + 1 }, loaded.core.createdAt));
        }
      }
      if (receiptId) await transaction.set({ ...document('receipt', spec.actor, `${spec.actor}:${spec.commandId}`, { fingerprint: spec.fingerprint, response, now: spec.now } as CommandReceipt, spec.now), _id: receiptId });
      return response;
    });
  }

  private addView(store: CommandStore, view: PersistedDocument, playerId: string): void {
    if (view.kind === 'rank') {
      if (!store.data.ranks[view.board]) store.data.ranks[view.board] = {};
      if (view.owner !== playerId) store.data.ranks[view.board][view.owner] = view.score;
      const display = view.payload as { nick?: string; level?: number };
      if (!store.player(view.owner)) store.data.players[view.owner] = { playerId: view.owner, openId: '', nick: display.nick || view.owner, level: display.level || 1, xp: 0, createdAt: 0, inventory: {}, counters: {}, timestamps: {} };
    } else if (view.kind === 'history' && view.owner === playerId) {
      if (!store.data.history[playerId]) store.data.history[playerId] = [];
      store.data.history[playerId].unshift(clone(view.payload) as any);
    }
  }

  private async commit(transaction: DocumentTransaction, before: Map<string, PersistedDocument>, players: Map<string, LoadedPlayer>, store: CommandStore, spec: CommandSpec): Promise<void> {
    const changed = async (next: PersistedDocument): Promise<void> => {
      const prior = before.get(next._id);
      if (!prior || JSON.stringify(prior.payload) !== JSON.stringify(next.payload) || prior.score !== next.score) await transaction.set(next);
    };
    const ledger = store.ledger.dump();
    const owners = new Set([...players.keys(), spec.actor]);
    for (const owner of owners) {
      const player = store.player(owner);
      if (!player) throw new PersistenceError('PERSISTENCE_CORRUPT', 'Command removed player');
      const loaded = players.get(owner);
      const sequences = clone(loaded?.core.sequences || { history: 0, mail: 0 });
      for (const mail of store.data.mails.filter((entry) => entry.playerId === owner)) {
        const previous = before.get(identity('mail', mail.mailId));
        await changed(document('mail', owner, mail.mailId, mail, mail.createdAt, previous?.seq || ++sequences.mail));
      }
      for (const row of store.data.history[owner] || []) {
        if ((spec.views || []).some((view) => view.kind === 'history' && (view.payload as any).id === row.id)) continue;
        await transaction.set(document('history', owner, row.id, row, row.createdAt, ++sequences.history, row.featureId));
      }
      for (const partition of splitPlayer(player, (loaded?.core.revision || 0) + 1, store.data.actionNonces[owner] || null, spec.now, sequences)) await changed(partition);
      let sequence = loaded?.wallet.seq || 0;
      const entries = ledger.entries.filter((entry) => entry.playerId === owner);
      for (const entry of entries) await transaction.set(document('ledger', owner, entry.txnId, entry, spec.now, ++sequence, entry.assetType));
      if (!loaded || entries.length) await changed(document('wallet', owner, owner, { balances: ledger.balances[owner] || {}, seq: sequence } as Wallet, spec.now));
      const valid = store.ledger.validateInvariants(owner);
      if (!valid.ok) throw new PersistenceError('PERSISTENCE_CORRUPT', 'Command ledger invariant failed');
      for (const board of RANK_BOARDS) {
        const score = store.data.ranks[board]?.[owner];
        if (score !== undefined) await changed(document('rank', owner, `${owner}:${board}`, { nick: player.nick, level: player.level }, spec.now, 0, board, score));
      }
    }
    if (spec.identityKey) await changed(document('identity', spec.actor, spec.identityKey, { playerId: spec.actor }, spec.now));
    const slots = new Map<string, SessionRecord | null>();
    for (const session of Object.values(store.data.sessions)) {
      if (session.playerId !== spec.actor) throw new PersistenceError('PERSISTENCE_CORRUPT', 'Cross-player session mutation');
      await changed(document('session', session.playerId, session.sessionId, session, session.createdAt));
      const key = `${session.playerId}:${session.featureId}`;
      if (!session.finished) {
        if (slots.get(key)) throw new PersistenceError('PERSISTENCE_CORRUPT', 'Multiple active sessions');
        slots.set(key, session);
      } else if (!slots.has(key)) slots.set(key, null);
    }
    for (const [key, active] of slots) await changed(document('slot', spec.actor, key, { sessionId: active?.sessionId || null }, spec.now));
    for (const [token, invite] of Object.entries(store.data.inviteTokens)) await changed(document('invite', invite.inviterId, token, invite, invite.createdAt));
    if (store.data.telemetry.length > 20 || store.data.audit.length > 10) throw new PersistenceError('PERSISTENCE_LIMIT', 'Event batch exceeds transaction limit');
    for (const event of store.data.telemetry) await transaction.set(document('telemetry', spec.actor, store.newId('event'), event, event.at));
    for (const event of store.data.audit) await transaction.set(document('audit', event.playerId, store.newId('audit'), event, event.at));
    for (const [id, previous] of before) {
      if (previous.kind === 'invite' && !Object.keys(store.data.inviteTokens).some((token) => identity('invite', token) === id)) await transaction.remove(id);
    }
  }

  async auditLedger(playerId: string): Promise<{ ok: boolean; errors: string[]; entries: number; stable: boolean }> {
    const start = await this.database.get(identity('wallet', playerId));
    if (!start) throw new PersistenceError('PERSISTENCE_CORRUPT', 'Wallet is missing');
    const wallet = start.payload as Wallet;
    const balances: Partial<Record<AssetId, number>> = {};
    const errors: string[] = [];
    let sequence = 0;
    while (sequence < wallet.seq) {
      const page = await this.database.query({ kind: 'ledger', owner: playerId, after: sequence, order: 'seq', direction: 'asc', limit: Math.min(200, wallet.seq - sequence) });
      if (!page.length) { errors.push('Missing ledger page'); break; }
      for (const row of page) {
        const entry = row.payload as LedgerEntry;
        if (row.seq !== sequence + 1) errors.push(`Sequence gap at ${row.seq}`);
        if (entry.balanceBefore !== (balances[entry.assetType] || 0) || entry.balanceAfter !== roundToPrecision(entry.balanceBefore + entry.delta, entry.assetType) || entry.balanceAfter < 0) errors.push(`Invalid balance chain at ${row.seq}`);
        balances[entry.assetType] = entry.balanceAfter;
        sequence = row.seq;
      }
    }
    for (const [asset, balance] of Object.entries(wallet.balances)) if ((balances[asset as AssetId] || 0) !== balance) errors.push(`Wallet mismatch: ${asset}`);
    const end = await this.database.get(identity('wallet', playerId));
    const stable = JSON.stringify(start.payload) === JSON.stringify(end?.payload);
    if (!stable) errors.push('Wallet changed during audit; retry on a stable snapshot');
    return { ok: errors.length === 0, errors, entries: sequence, stable };
  }
}
