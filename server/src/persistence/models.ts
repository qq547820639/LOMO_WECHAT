import { createHash } from 'node:crypto';
import { PlayerRecord, SessionRecord, Store, MailRecord } from '../store';
import { AssetId } from '../../../shared/src/assets';
import { Ledger } from '../../../shared/src/ledger';
import { clone, PersistedDocument, PersistenceError } from './database';

export const SHARDS = 4;
export const SCHEMA_VERSION = 1;
export const RANK_BOARDS = ['seasonScore', 'undertownDepth', 'arenaPower', 'robberyScore', 'monkeyKingContribution', 'brSurvival'];

export function identity(kind: string, ...parts: string[]): string {
  return `${kind}_${createHash('sha256').update(JSON.stringify(parts)).digest('hex').slice(0, 48)}`;
}

export function shard(key: string): number { return createHash('sha256').update(key).digest()[0] % SHARDS; }

export function document(kind: string, owner: string, key: string, payload: unknown, now: number, seq = 0, board = '', score = 0): PersistedDocument {
  return { _id: identity(kind, key), kind, owner, seq, createdAt: now, board, score, payload: clone(payload) };
}

export interface PlayerCore extends Omit<PlayerRecord, 'inventory' | 'counters' | 'timestamps'> { revision: number; schema: number; nonce: { seed: string; sequence: number } | null; sequences: { history: number; mail: number } }
export interface Wallet { balances: Record<string, number>; seq: number }
export interface FeatureShard { counters: Record<string, number>; timestamps: Record<string, number> }
export interface CommandResponse { status: number; body: any }
export interface CommandReceipt { fingerprint: string; response: CommandResponse; now: number }

export function splitPlayer(player: PlayerRecord, revision: number, nonce: PlayerCore['nonce'], now: number, sequences: PlayerCore['sequences']): PersistedDocument[] {
  const { inventory, counters, timestamps, ...core } = player;
  const featureShards: FeatureShard[] = Array.from({ length: SHARDS }, () => ({ counters: {}, timestamps: {} }));
  const inventoryShards: PlayerRecord['inventory'][] = Array.from({ length: SHARDS }, () => ({}));
  const day = Math.floor(now / 86400000);
  for (const [key, value] of Object.entries(counters)) {
    const match = /^daily\.task\.[^.]+\.(\d+)$/.exec(key);
    if (!match || Number(match[1]) >= day - 7) featureShards[shard(key)].counters[key] = value;
  }
  for (const [key, value] of Object.entries(timestamps)) featureShards[shard(key)].timestamps[key] = value;
  for (const [key, value] of Object.entries(inventory)) inventoryShards[shard(key)][key] = value;
  if (Object.keys(inventory).length > 1024 || featureShards.reduce((count, state) => count + Object.keys(state.counters).length, 0) > 2048 || Object.keys(timestamps).length > 512) throw new PersistenceError('PERSISTENCE_LIMIT', 'Player state exceeds supported capacity');
  return [
    document('player', player.playerId, player.playerId, { ...core, revision, schema: SCHEMA_VERSION, nonce, sequences } as PlayerCore, player.createdAt),
    ...featureShards.map((payload, index) => document('features', player.playerId, `${player.playerId}:${index}`, payload, now)),
    ...inventoryShards.map((payload, index) => document('inventory', player.playerId, `${player.playerId}:${index}`, payload, now)),
  ];
}

export class CommandStore extends Store {
  private idSequence = 0;
  candidateIds: string[] = [];
  constructor(readonly commandTime: number, private entropy: string, private identityPlayer?: string) {
    super(() => 'unused');
    this.ledger = new Ledger(() => this.newId('txn'), () => commandTime);
  }
  newId(kind: string): string { return `${kind}_${createHash('sha256').update(`${this.entropy}:${++this.idSequence}:${kind}`).digest('hex').slice(0, 24)}`; }
  override opponents(playerId: string): PlayerRecord[] {
    const players = this.candidateIds.filter((id) => id !== playerId).map((id) => this.data.players[id]).filter(Boolean).slice(0, 8);
    if (players.length) return players;
    return Array.from({ length: 8 }, (_unused, index) => ({ playerId: `training_npc_${index + 1}`, openId: '', nick: `训练对手 ${index + 1}（NPC）`, level: 1 + index, xp: 0, createdAt: 0, counters: {}, timestamps: {}, inventory: {} }));
  }
  override ensurePlayer(openId: string, nick: string, now: number): { player: PlayerRecord; isNew: boolean } {
    const existing = this.data.openIdIndex[openId];
    if (existing && this.data.players[existing]) return { player: this.data.players[existing], isNew: false };
    const playerId = this.identityPlayer || this.newId('p');
    const player: PlayerRecord = { playerId, openId, nick, level: 1, xp: 0, counters: {}, timestamps: {}, inventory: {}, createdAt: now };
    this.data.players[playerId] = player;
    this.data.openIdIndex[openId] = playerId;
    return { player, isNew: true };
  }
  override createSession(playerId: string, featureId: string, seed: string, mechanicId?: string): SessionRecord {
    const active = Object.values(this.data.sessions).find((session) => session.playerId === playerId && session.featureId === featureId && !session.finished);
    if (active) return active;
    const session: SessionRecord = { sessionId: this.newId('s'), playerId, featureId, seed, mechanicId, createdAt: this.commandTime, updatedAt: this.commandTime, clientSeq: 0, serverSeq: 0, data: {}, finished: false };
    this.data.sessions[session.sessionId] = session;
    return session;
  }
  override nextActionNonce(playerId: string): string {
    const previous = this.data.actionNonces[playerId];
    this.data.actionNonces[playerId] = { seed: previous?.seed || this.newId('nonce'), sequence: (previous?.sequence || 0) + 1 };
    return `${this.entropy}:${playerId}:action`;
  }
  override pushHistory(playerId: string, featureId: string, summary: string, rewards?: { assetId: AssetId; delta: number }[]): void {
    if (!this.data.history[playerId]) this.data.history[playerId] = [];
    this.data.history[playerId].push({ id: this.newId('h'), featureId, summary, createdAt: this.commandTime, rewards });
  }
  override sendMail(mail: Omit<MailRecord, 'mailId' | 'claimed' | 'read' | 'createdAt'>): MailRecord {
    const record: MailRecord = { ...mail, mailId: this.newId('m'), claimed: false, read: false, createdAt: this.commandTime };
    this.data.mails.push(record);
    return record;
  }
  override audit(playerId: string, kind: string, detail?: unknown): void { this.data.audit.push({ at: this.commandTime, playerId, kind, detail }); }
  override telemetry(name: string, props?: Record<string, unknown>): void { this.data.telemetry.push({ name, at: this.commandTime, props }); }
}
