import assert from 'node:assert/strict';
import { GameApp } from '../server/src/app';
import { matchRoute } from '../server/src/http';
import { FEATURES_GAMES } from '../server/src/games';
import { PersistentApi } from '../server/src/persistence/api';
import { MemoryDocumentDatabase } from '../server/src/persistence/memory';
import { PersistentRepository } from '../server/src/persistence/repository';
import { CommandStore, identity } from '../server/src/persistence/models';

async function run(): Promise<void> {
  const database = new MemoryDocumentDatabase();
  const repository = new PersistentRepository(database);
  const emptyRoster = new CommandStore(Date.now(), 'training-roster');
  assert.equal(emptyRoster.opponents('alice').length, 8);
  assert(emptyRoster.opponents('alice').every((player) => player.nick.includes('NPC')));
  emptyRoster.data.players.bob = { playerId: 'bob', openId: 'bob', nick: 'Bob', level: 3, xp: 0, inventory: {}, counters: {}, timestamps: {}, createdAt: 0 };
  emptyRoster.candidateIds = ['bob'];
  assert.deepEqual(emptyRoster.opponents('alice').map((player) => player.playerId), ['bob']);
  const create = () => new PersistentApi(new GameApp({ profile: 'wechat-release', bootPngSeeds: false, secret: 'persistence-integration-test-secret-32', wechatCodeExchange: async (code) => ({ openid: `openid_${code}` }) }), repository, 'wx0123456789abcdef').routes();
  const first = create(), second = create();
  const legacyToken = new GameApp({ profile: 'wechat-release', bootPngSeeds: false, secret: 'persistence-integration-test-secret-32' }).issueToken('legacy_missing_player');
  const request = async (routes: ReturnType<typeof create>, method: string, path: string, body?: any, token?: string): Promise<{ status: number; body: any }> => {
    const url = new URL(path, 'http://localhost');
    const found = matchRoute(routes, method, url.pathname)!;
    let status = 200;
    let response: any;
    await found.handler({ req: { headers: token ? { authorization: `Bearer ${token}` } : {}, socket: { remoteAddress: 'test-peer' } }, res: {}, method, path: url.pathname, params: found.params, query: url.searchParams, body,
      status: (value) => { status = value; }, json: (value) => { response = value; } });
    return { status, body: response };
  };
  const logins = await Promise.all(Array.from({ length: 20 }, (_unused, index) => request(index % 2 ? first : second, 'POST', '/v1/auth/wechat', { code: 'alice' })));
  assert(logins.every((response) => response.body.ok));
  assert.equal(new Set(logins.map((response) => response.body.playerId)).size, 1);
  assert.equal(logins.filter((response) => response.body.isNew).length, 1);
  const alice = logins[0].body;
  const missingActor = await request(first, 'GET', '/v1/player/state', undefined, legacyToken);
  assert.equal(missingActor.status, 401);
  assert.equal(missingActor.body.code, 'AUTH_REQUIRED');
  const bob = (await request(second, 'POST', '/v1/auth/wechat', { code: 'bob' })).body;
  assert.equal(database.snapshot().filter((entry) => entry.kind === 'ledger' && entry.owner === alice.playerId).length, 3);
  assert.equal(database.snapshot().filter((entry) => entry.kind === 'mail' && entry.owner === alice.playerId).length, 1);

  const action = { featureId: 'daily', actionId: 'checkin', idempotencyKey: 'checkin-once' };
  const repeated = await Promise.all(Array.from({ length: 20 }, (_unused, index) => request(index % 2 ? first : second, 'POST', '/v1/game/action', action, alice.token)));
  assert(repeated.every((response) => response.body.ok));
  assert(repeated.every((response) => JSON.stringify(response) === JSON.stringify(repeated[0])));
  const mismatch = await request(second, 'POST', '/v1/game/action', { ...action, actionId: 'claimTask', payload: { taskId: 'mine' } }, alice.token);
  assert.equal(mismatch.status, 409);
  assert.equal(mismatch.body.code, 'IDEMPOTENCY_CONFLICT');
  let state = (await request(second, 'GET', '/v1/player/state', undefined, alice.token)).body.player;
  assert.equal(state.balances.COIN, 512);

  const mail = (await request(first, 'GET', '/v1/mail', undefined, alice.token)).body.mails[0];
  const claims = await Promise.all(Array.from({ length: 20 }, () => request(second, 'POST', '/v1/mail/claim', { mailId: mail.mailId, idempotencyKey: 'claim-mail' }, alice.token)));
  assert(claims.every((response) => response.body.ok));
  assert.equal((await request(first, 'GET', '/v1/player/state', undefined, alice.token)).body.player.balances.COIN, 612);

  const invite = (await request(first, 'POST', '/v1/social/invite/token', { idempotencyKey: 'invite-once' }, alice.token)).body;
  const accepts = await Promise.all(Array.from({ length: 20 }, () => request(second, 'POST', '/v1/social/invite/accept', { token: invite.token, idempotencyKey: 'accept-once' }, bob.token)));
  assert(accepts.every((response) => response.body.ok));
  assert.equal((await request(first, 'GET', '/v1/player/state', undefined, alice.token)).body.player.balances.COIN, 662);
  assert.equal((await request(first, 'GET', '/v1/player/state', undefined, bob.token)).body.player.balances.COIN, 530);

  const starts = await Promise.all(Array.from({ length: 20 }, (_unused, index) => request(index % 2 ? first : second, 'POST', '/v1/game/session/start', { featureId: 'battleRoyal', idempotencyKey: `start-${index}` }, alice.token)));
  assert(starts.every((response) => response.body.ok));
  assert.equal(new Set(starts.map((response) => response.body.sessionId)).size, 1);
  assert.equal(database.snapshot().filter((entry) => entry.kind === 'session' && entry.owner === alice.playerId).length, 1);

  const beforeFailure = await repository.auditLedger(alice.playerId);
  assert(beforeFailure.ok);
  const originalAction = FEATURES_GAMES.daily.actions.qaFailure;
  FEATURES_GAMES.daily.actions.qaFailure = (ctx) => {
    ctx.econ.spend(ctx.playerId, 'COIN', 7, 'qa', 'rollback');
    ctx.econ.addItems(ctx.playerId, 'qa_item', 3);
    ctx.player.counters.qa = 99;
    throw new Error('injected after mutation');
  };
  try {
    const failure = await request(first, 'POST', '/v1/game/action', { featureId: 'daily', actionId: 'qaFailure', idempotencyKey: 'exception' }, alice.token);
    assert.equal(failure.status, 500);
    state = (await request(second, 'GET', '/v1/player/state', undefined, alice.token)).body.player;
    assert.equal(state.balances.COIN, 662);
    assert.equal(state.counters.qa, undefined);
    assert(!state.inventory.some((item: any) => item.templateId === 'qa_item'));
    assert.deepEqual(await repository.auditLedger(alice.playerId), beforeFailure);
  } finally {
    if (originalAction) FEATURES_GAMES.daily.actions.qaFailure = originalAction;
    else delete FEATURES_GAMES.daily.actions.qaFailure;
  }

  database.failWriteAt = 3;
  const failedWrite = await request(first, 'POST', '/v1/game/action', { featureId: 'goldMine', actionId: 'dig', idempotencyKey: 'atomic-write' }, alice.token);
  database.failWriteAt = 0;
  assert.equal(failedWrite.status, 503);
  assert.deepEqual(await repository.auditLedger(alice.playerId), beforeFailure);
  const retriedWrite = await request(second, 'POST', '/v1/game/action', { featureId: 'goldMine', actionId: 'dig', idempotencyKey: 'atomic-write' }, alice.token);
  assert(retriedWrite.body.ok);

  let lost = false;
  database.afterCommit = (documents) => { if (!lost && documents.some((entry) => entry.kind === 'receipt')) { lost = true; throw new Error('response lost after commit'); } };
  const lostResponse = await request(first, 'POST', '/v1/game/action', { featureId: 'goldMine', actionId: 'dig', idempotencyKey: 'lost-response' }, bob.token);
  database.afterCommit = undefined;
  assert.equal(lostResponse.status, 503);
  const restart = create();
  const recovered = await request(restart, 'POST', '/v1/game/action', { featureId: 'goldMine', actionId: 'dig', idempotencyKey: 'lost-response' }, bob.token);
  assert(recovered.body.ok);
  assert.equal(database.snapshot().filter((entry) => entry.kind === 'ledger' && entry.owner === bob.playerId && (entry.payload as any).sourceType === 'goldMine').length, 1);

  const spent = await Promise.all(Array.from({ length: 20 }, (_unused, index) => request(index % 2 ? first : second, 'POST', '/v1/game/action', { featureId: 'monkeyFight', actionId: 'fight', idempotencyKey: `spend-${index}` }, bob.token)));
  assert(spent.some((response) => response.body.ok));
  assert(spent.some((response) => !response.body.ok));
  const bobState = (await request(second, 'GET', '/v1/player/state', undefined, bob.token)).body.player;
  assert(bobState.balances.ENERGY >= 0);
  assert((await repository.auditLedger(bob.playerId)).ok);
  assert((await repository.auditLedger(alice.playerId)).ok);
  let cursor: number | null = null;
  const sequences: number[] = [];
  do {
    const page: any = (await request(second, 'GET', `/v1/economy/ledger?limit=2${cursor === null ? '' : `&cursor=${cursor}`}`, undefined, bob.token)).body;
    sequences.push(...page.entries.map((entry: any) => entry.seq));
    cursor = page.nextCursor;
  } while (cursor !== null);
  assert.equal(sequences.length, (await repository.auditLedger(bob.playerId)).entries);
  assert.equal(new Set(sequences).size, sequences.length);
  const attempts: Array<{ time: number; generated: string; opponents: string[] }> = [];
  const aliceDocument = (await database.get(identity('player', alice.playerId)))!;
  const fixedCommand = { actor: bob.playerId, now: Math.floor(Date.now() / 86400000) * 86400000 + 43200000, entropy: 'original-entropy', commandId: 'fixed-time-and-seed', fingerprint: 'fixed-body', mutating: true, candidates: [aliceDocument] };
  const applyFixedCommand = async (store: CommandStore) => {
    attempts.push({ time: store.commandTime, generated: store.newId('sample'), opponents: store.opponents(bob.playerId).map((player) => player.playerId) });
    store.ledger.apply({ playerId: bob.playerId, assetType: 'COIN', delta: 1, sourceType: 'test', sourceId: 'fixed-command' });
    return { status: 200, body: { ok: true } };
  };
  database.failWriteAt = 2;
  await assert.rejects(repository.execute(fixedCommand, applyFixedCommand));
  database.failWriteAt = 0;
  assert.equal((await repository.execute({ ...fixedCommand, now: fixedCommand.now + 60000, entropy: 'different-entropy-after-restart', candidates: [] }, applyFixedCommand)).body.ok, true);
  assert.deepEqual(attempts[0], attempts[1]);
  assert((await repository.auditLedger(bob.playerId)).ok);
  const expiredCommand = { ...fixedCommand, commandId: 'expired-intent' };
  database.failWriteAt = 2;
  await assert.rejects(repository.execute(expiredCommand, applyFixedCommand));
  database.failWriteAt = 0;
  assert.equal((await repository.execute({ ...expiredCommand, now: fixedCommand.now + 300001 }, applyFixedCommand)).body.code, 'COMMAND_EXPIRED');
  const midnightCommand = { ...fixedCommand, commandId: 'utc-midnight-intent', now: Math.floor(fixedCommand.now / 86400000) * 86400000 + 86340000 };
  const midnightBaseline = await repository.auditLedger(bob.playerId);
  database.failWriteAt = 2;
  await assert.rejects(repository.execute(midnightCommand, applyFixedCommand));
  database.failWriteAt = 0;
  assert.deepEqual(await repository.auditLedger(bob.playerId), midnightBaseline);
  const midnightSnapshot = database.snapshot();
  const midnightAttempts = attempts.length;
  const midnightRetry = await repository.execute({ ...midnightCommand, now: midnightCommand.now + 120000 }, applyFixedCommand);
  assert.equal(midnightRetry.status, 409);
  assert.equal(midnightRetry.body.code, 'COMMAND_EXPIRED');
  assert.equal(attempts.length, midnightAttempts);
  assert.deepEqual(database.snapshot(), midnightSnapshot);
  assert.deepEqual(await repository.auditLedger(bob.playerId), midnightBaseline);
  const oldClock = { ...fixedCommand, commandId: 'stale-clock' };
  const updateClock = async (store: CommandStore) => {
    store.player(bob.playerId)!.timestamps['qa.at'] = store.commandTime;
    store.ledger.apply({ playerId: bob.playerId, assetType: 'COIN', delta: 1, sourceType: 'test', sourceId: 'stale-clock' });
    return { status: 200, body: { ok: true } };
  };
  database.failWriteAt = 2;
  await assert.rejects(repository.execute(oldClock, updateClock));
  database.failWriteAt = 0;
  assert((await repository.execute({ ...oldClock, commandId: 'newer-clock', now: oldClock.now + 1000 }, updateClock)).body.ok);
  const clockBaseline = await repository.auditLedger(bob.playerId);
  assert.equal((await repository.execute({ ...oldClock, now: oldClock.now + 2000 }, updateClock)).body.code, 'COMMAND_SUPERSEDED');
  assert.deepEqual(await repository.auditLedger(bob.playerId), clockBaseline);
  database.available = false;
  await assert.rejects(repository.ready());
  assert.equal((await request(first, 'GET', '/v1/player/state', undefined, alice.token)).status, 503);
  database.available = true;
  assert.equal((await database.get(identity('player', alice.playerId)))?.kind, 'player');
  assert(database.conflicts > 0);
  assert(database.maxOperations <= 90);
  assert(database.snapshot().every((entry) => Buffer.byteLength(JSON.stringify(entry)) < 128 * 1024));
  console.log(`persistence ok: two instances, 20-way identities/commands/slots, atomic invites/mail/rollback, lost commit response, restart, paginated ledger, fail-closed; peak ${database.maxOperations} ops`);
}

if (require.main === module) run().catch((error) => { console.error(error); process.exitCode = 1; });
