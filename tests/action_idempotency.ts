import * as assert from 'node:assert';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { ApiClient, HttpTransport } from '../client/src/net/api';
import { NodePlatform } from '../client/src/platform/platform';
import { GameApp } from '../server/src/app';
import { Store } from '../server/src/store';
import { PersistentApi } from '../server/src/persistence/api';
import { PersistentRepository } from '../server/src/persistence/repository';
import { MemoryDocumentDatabase } from '../server/src/persistence/memory';
import { identity, Wallet } from '../server/src/persistence/models';

async function call(app: Pick<GameApp, 'routes'>, route: string, body: any, token?: string): Promise<{ status: number; data: any }> {
  const handler = app.routes().find((entry) => entry.method === 'POST' && entry.pattern === route)?.handler;
  assert.ok(handler, route);
  const result = { status: 200, data: undefined as any };
  await handler!({
    req: { headers: { authorization: token ? `Bearer ${token}` : '' } }, res: {}, method: 'POST', path: route,
    params: {}, query: new URLSearchParams(), body: JSON.parse(JSON.stringify(body)),
    status(status: number) { result.status = status; },
    json(data: any) { result.data = JSON.parse(JSON.stringify(data)); },
  } as any);
  return result;
}

async function fixture(persistPath?: string): Promise<{ app: GameApp; token: string; playerId: string }> {
  const app = new GameApp({ profile: 'wechat-release', allowSyntheticWechatAuth: true, bootPngSeeds: false, persistPath });
  const response = await call(app, '/v1/auth/wechat', { code: 'idempotency-player' });
  assert.equal(response.data.ok, true);
  return { app, token: response.data.token, playerId: response.data.playerId };
}

export async function run(): Promise<void> {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lomo-action-idempotency-'));
  try {
    const savedPath = path.join(directory, 'snapshot.json');
    const { app, token, playerId } = await fixture(savedPath);
    const request = { featureId: 'cards', actionId: 'freeDraw', payload: { first: 1, nested: { second: 2, third: 3 } }, idempotencyKey: 'draw-request-1' };
    const first = await call(app, '/v1/game/action', request, token);
    assert.equal(first.data.ok, true);
    const snapshot = JSON.stringify({ ledger: app.store.ledger.dump(), player: app.store.player(playerId), nonce: app.store.data.actionNonces[playerId] });
    const replay = await call(app, '/v1/game/action', { ...request, payload: { nested: { third: 3, second: 2 }, first: 1 } }, token);
    assert.deepEqual(replay, first, 'same request replays even when object key order changes');
    assert.equal(JSON.stringify({ ledger: app.store.ledger.dump(), player: app.store.player(playerId), nonce: app.store.data.actionNonces[playerId] }), snapshot, 'replay does not spend, grant XP, add items or consume randomness');
    assert.equal((await call(app, '/v1/game/action', { ...request, payload: { first: 9 } }, token)).status, 409);
    assert.equal((await call(app, '/v1/game/action', { ...request, featureId: 'box', actionId: 'earnKey' }, token)).status, 409);
    for (const idempotencyKey of ['', null, 7, [], 'x'.repeat(129)]) {
      assert.equal((await call(app, '/v1/game/action', { ...request, idempotencyKey }, token)).status, 400);
    }
    const otherLogin = await call(app, '/v1/auth/wechat', { code: 'idempotency-other-player' });
    assert.equal((await call(app, '/v1/game/action', request, otherLogin.data.token)).data.ok, true, 'receipt keys are scoped to the authenticated player');
    app.store.maybePersist(true);
    const restored = new GameApp({ profile: 'wechat-release', allowSyntheticWechatAuth: true, bootPngSeeds: false, persistPath: savedPath });
    assert.deepEqual(await call(restored, '/v1/game/action', request, token), first, 'reward response survives a Store snapshot restart');
    const rotated = new GameApp({ profile: 'wechat-release', allowSyntheticWechatAuth: true, bootPngSeeds: false, persistPath: savedPath, secret: 'idempotency-test-rotated-signing-key' });
    assert.deepEqual(await call(rotated, '/v1/game/action', request, rotated.issueToken(playerId)), first, 'request fingerprints remain stable after signing-key rotation');
    const nextRequest = { ...request, idempotencyKey: 'draw-request-2' };
    const continued = await call(app, '/v1/game/action', nextRequest, token);
    const restarted = await call(restored, '/v1/game/action', nextRequest, token);
    assert.deepEqual(restarted.data.items, continued.data.items, 'random stream continues identically across a restart');
    assert.deepEqual(restored.store.data.actionNonces[playerId], app.store.data.actionNonces[playerId]);
    assert.equal(restored.store.data.actionNonces[playerId].sequence, 2, 'new action advances the persisted nonce');

    const failed = await fixture();
    failed.app.store.ledger.apply({ playerId: failed.playerId, assetType: 'ENERGY', delta: -failed.app.store.ledger.balanceOf(failed.playerId, 'ENERGY'), sourceType: 'test', sourceId: 'empty' });
    const failedRequest = { featureId: 'cards', actionId: 'freeDraw', idempotencyKey: 'insufficient-draw' };
    const rejected = await call(failed.app, '/v1/game/action', failedRequest, failed.token);
    assert.equal(rejected.data.ok, false);
    failed.app.store.ledger.apply({ playerId: failed.playerId, assetType: 'ENERGY', delta: 5, sourceType: 'test', sourceId: 'refill' });
    assert.deepEqual(await call(failed.app, '/v1/game/action', failedRequest, failed.token), rejected, 'failed logical operation remains failed after funds change');
    assert.equal(failed.app.store.ledger.balanceOf(failed.playerId, 'ENERGY'), 5);
    assert.equal((await call(failed.app, '/v1/game/action', { ...failedRequest, idempotencyKey: 'funded-draw' }, failed.token)).data.ok, true, 'new logical operation may succeed');

    const battle = await fixture(path.join(directory, 'battle.json'));
    const sessionStart = await call(battle.app, '/v1/game/session/start', { featureId: 'battleRoyal' }, battle.token);
    const sessionId = sessionStart.data.sessionId;
    const join = { featureId: 'battleRoyal', actionId: 'join', payload: { roomId: 1 }, sessionId, clientSeq: 1 };
    const joined = await call(battle.app, '/v1/game/action', join, battle.token);
    assert.equal(joined.data.ok, true);
    const changed = await call(battle.app, '/v1/game/action', { ...join, payload: { roomId: 2 } }, battle.token);
    assert.equal(changed.status, 409, 'same session sequence cannot replay a different request');
    battle.app.store.ledger.apply({ playerId: battle.playerId, assetType: 'COIN', delta: -battle.app.store.ledger.balanceOf(battle.playerId, 'COIN'), sourceType: 'test', sourceId: 'empty' });
    const repair = { featureId: 'battleRoyal', actionId: 'act', payload: { kind: 'repair' }, sessionId, clientSeq: 2 };
    assert.equal((await call(battle.app, '/v1/game/action', repair, battle.token)).data.ok, false);
    assert.equal(battle.app.store.session(sessionId)?.clientSeq, 1, 'failed action does not consume the session sequence');
    assert.equal((await call(battle.app, '/v1/game/action', { ...repair, clientSeq: 1 }, battle.token)).status, 409, 'failed action cannot return an earlier successful reward');
    let finalRequest: any;
    let finalResponse: any;
    for (let clientSeq = 2; clientSeq <= 60; clientSeq++) {
      finalRequest = { featureId: 'battleRoyal', actionId: 'act', payload: { kind: 'hide' }, sessionId, clientSeq };
      finalResponse = await call(battle.app, '/v1/game/action', finalRequest, battle.token);
      assert.equal(finalResponse.data.ok, true);
      if (battle.app.store.session(sessionId)?.finished) break;
    }
    assert.equal(battle.app.store.session(sessionId)?.finished, true);
    const finalLedger = JSON.stringify(battle.app.store.ledger.dump());
    assert.deepEqual(await call(battle.app, '/v1/game/action', finalRequest, battle.token), finalResponse, 'finished session replays its final response without an explicit key');
    assert.equal(JSON.stringify(battle.app.store.ledger.dump()), finalLedger);
    assert.equal((await call(battle.app, '/v1/game/action', { ...finalRequest, clientSeq: finalRequest.clientSeq + 1 }, battle.token)).data.code, 'SESSION_STALE');
    battle.app.store.maybePersist(true);
    const restoredBattle = new GameApp({ profile: 'wechat-release', allowSyntheticWechatAuth: true, bootPngSeeds: false, persistPath: path.join(directory, 'battle.json') });
    assert.deepEqual(await call(restoredBattle, '/v1/game/action', finalRequest, battle.token), finalResponse, 'finished session replay survives restart');

    const network = await fixture();
    const platform = new NodePlatform();
    const sent: any[] = [];
    platform.httpRequest = async (params) => {
      sent.push(JSON.parse(JSON.stringify(params.data)));
      const result = await call(network.app, '/v1/game/action', params.data, network.token);
      if (sent.length <= 3) throw new Error('response lost after server commit');
      return { statusCode: result.status, data: result.data };
    };
    const api = new ApiClient(new HttpTransport(platform, 'https://example.test'));
    api.playerId = network.playerId;
    api.token = network.token;
    assert.equal((await api.action('cards', 'freeDraw', {}, undefined, 100)).code, 'SERVER_ERROR');
    assert.equal(network.app.store.data.actionNonces[network.playerId].sequence, 1);
    assert.equal((await api.action('cards', 'freeDraw', {}, undefined, 200)).ok, true, 'manual retry recovers the committed action');
    assert.equal(new Set(sent.map((body) => body.idempotencyKey)).size, 1, 'automatic and manual retries reuse one key');
    assert.ok(sent.every((body) => body.clientSeq === 100), 'manual retry retains the original generated sequence');
    assert.equal(network.app.store.ledger.balanceOf(network.playerId, 'ENERGY'), 29);
    assert.equal((await api.action('cards', 'freeDraw', {}, undefined, 300)).ok, true);
    assert.notEqual(sent[4].idempotencyKey, sent[0].idempotencyKey, 'confirmed next operation gets a fresh key');
    assert.equal(network.app.store.ledger.balanceOf(network.playerId, 'ENERGY'), 28);

    const posted: any[] = [];
    const postApi = new ApiClient({ request: async (_route, _method, body) => {
      posted.push(body);
      if (posted.length === 1) throw new Error('network lost');
      return { ok: true };
    } });
    await postApi.post('/v1/game/session/start', { featureId: 'battleRoyal' });
    await postApi.post('/v1/game/session/start', { featureId: 'battleRoyal' });
    await postApi.post('/v1/game/session/start', { featureId: 'battleRoyal' });
    assert.equal(posted[0].idempotencyKey, posted[1].idempotencyKey, 'non-action POST retry also reuses its key');
    assert.notEqual(posted[1].idempotencyKey, posted[2].idempotencyKey);

    for (const useAction of [true, false]) {
      const database = new MemoryDocumentDatabase();
      const repository = new PersistentRepository(database);
      const persistent = new PersistentApi(new GameApp({ profile: 'wechat-release', bootPngSeeds: false, secret: 'persistent-client-retry-test-secret-32', wechatCodeExchange: async () => ({ openid: 'cloud-client-retry' }) }), repository, 'wx0123456789abcdef');
      const login = (await call(persistent, '/v1/auth/wechat', { code: 'cloud-client-retry' })).data;
      const energyBalance = async () => ((await database.get(identity('wallet', login.playerId)))!.payload as Wallet).balances.ENERGY;
      const cloudRequests: any[] = [];
      const cloudPlatform = new NodePlatform();
      cloudPlatform.httpRequest = async (params) => {
        cloudRequests.push(JSON.parse(JSON.stringify(params.data)));
        const result = await call(persistent, '/v1/game/action', params.data, login.token);
        return { statusCode: result.status, data: result.data };
      };
      const cloudApi = new ApiClient(new HttpTransport(cloudPlatform, 'https://example.test'));
      cloudApi.playerId = login.playerId;
      cloudApi.token = login.token;
      database.afterCommit = () => {
        if (database.snapshot().some((entry) => entry.kind === 'receipt')) throw new Error('commit acknowledgement lost');
      };
      const perform = (clientSeq: number) => useAction
        ? cloudApi.action('cards', 'freeDraw', {}, undefined, clientSeq)
        : cloudApi.post('/v1/game/action', { featureId: 'cards', actionId: 'freeDraw', payload: {} });
      assert.equal((await perform(100)).code, 'PERSISTENCE_UNAVAILABLE');
      assert.equal(cloudRequests.length, 3, 'automatic retries exhaust the structured persistence failure');
      database.afterCommit = undefined;
      assert.equal((await perform(200)).ok, true, 'manual retry recovers the durable receipt after a structured storage error');
      assert.equal(new Set(cloudRequests.map((body) => body.idempotencyKey)).size, 1, 'storage failure retains the original command key for actions and generic POST');
      if (useAction) assert.ok(cloudRequests.every((body) => body.clientSeq === 100));
      assert.equal(await energyBalance(), 29, 'storage retry spends energy once');
      assert.equal((await perform(300)).ok, true);
      assert.equal(await energyBalance(), 28, 'a confirmed new action can spend again');
      assert.equal((await repository.auditLedger(login.playerId)).ok, true);
    }

    const bounded = new Store(() => 'test-transaction');
    for (let index = 0; index <= Store.ACTION_RECEIPT_LIMIT; index++) {
      bounded.recordAction('player', { key: `request-${index}`, fingerprint: 'request', createdAt: 100, status: 200, response: { ok: true } });
    }
    assert.equal(bounded.data.actionReceipts.player.length, Store.ACTION_RECEIPT_LIMIT);
    assert.equal(bounded.actionReceipt('player', 'request-0', 100), undefined);
    assert.equal(bounded.actionReceipt('player', 'request-1', 100 + Store.ACTION_RECEIPT_TTL_MS), undefined);
    const legacy = JSON.parse(fs.readFileSync(savedPath, 'utf8'));
    delete legacy.actionReceipts;
    delete legacy.actionNonces;
    const legacyPath = path.join(directory, 'legacy.json');
    fs.writeFileSync(legacyPath, JSON.stringify(legacy));
    const restoredLegacy = new Store(() => 'test-transaction', legacyPath);
    assert.deepEqual(restoredLegacy.data.actionReceipts, {});
    assert.equal(typeof restoredLegacy.nextActionNonce(playerId), 'string', 'old snapshots initialize a fresh nonce seed');
    for (const current of [app, restored, failed.app, battle.app, network.app]) {
      for (const currentPlayerId of Object.keys(current.store.data.players)) assert.equal(current.store.ledger.validateInvariants(currentPlayerId).ok, true);
    }
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
  console.log('action-idempotency ok: lost responses, request conflicts, account scope, failures, session finish, restart and retention');
}

if (require.main === module) run().catch((error) => { console.error(error); process.exitCode = 1; });
