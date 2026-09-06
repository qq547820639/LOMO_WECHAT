import * as assert from 'node:assert';
import { GameApp } from '../server/src/app';
import { NodePlatform } from '../client/src/platform/platform';
import { PersistentApi } from '../server/src/persistence/api';
import { PersistentRepository } from '../server/src/persistence/repository';
import { MemoryDocumentDatabase } from '../server/src/persistence/memory';
import { EscapeTigerScreen } from '../client/src/features/minigame_screens';

async function call(app: Pick<GameApp, 'routes'>, method: 'GET' | 'POST', route: string, body: any = {}, token?: string): Promise<{ status: number; data: any }> {
  const [pathname, queryString] = route.split('?');
  const handler = app.routes().find((entry) => entry.method === method && entry.pattern === pathname)?.handler;
  assert.ok(handler, `${method} ${route}`);
  const result = { status: 200, data: undefined as any };
  await handler!({
    req: { headers: { authorization: token ? `Bearer ${token}` : '' } }, res: {}, method, path: route,
    params: {}, query: new URLSearchParams(queryString || ''), body: JSON.parse(JSON.stringify(body)),
    status(status: number) { result.status = status; },
    json(data: any) { result.data = JSON.parse(JSON.stringify(data)); },
  } as any);
  return result;
}

async function fixture(): Promise<{ app: GameApp; token: string; playerId: string }> {
  const app = new GameApp({ profile: 'wechat-release', allowSyntheticWechatAuth: true, bootPngSeeds: false });
  const login = await call(app, 'POST', '/v1/auth/wechat', { code: 'rewarded-ad-player' });
  assert.equal(login.data.ok, true);
  return { app, token: login.data.token, playerId: login.data.playerId };
}

export async function run(): Promise<void> {
  const { app, token, playerId } = await fixture();
  const bootstrap = await call(app, 'GET', '/v1/config/bootstrap');
  assert.equal(bootstrap.data.ok, true);
  assert.equal(bootstrap.data.rewardedAds.enabled, true);
  assert.equal(bootstrap.data.rewardedAds.dailyCap, 6);
  assert.ok(bootstrap.data.rewardedAds.slots.revive_escape.adUnitId);

  const issued = await call(app, 'POST', '/v1/ads/rewarded/issue', { slot: 'bonus_chest', idempotencyKey: 'bonus-issue-1' }, token);
  assert.equal(issued.data.ok, true);
  assert.equal(issued.data.slot, 'bonus_chest');
  assert.equal(issued.data.state, 'issued');
  assert.ok(issued.data.adId && issued.data.claimToken);
  assert.deepEqual(issued.data.reward, { kind: 'grant', rewards: [{ assetId: 'COIN', delta: 30 }] });
  assert.deepEqual(await call(app, 'POST', '/v1/ads/rewarded/issue', { slot: 'bonus_chest', idempotencyKey: 'bonus-issue-1' }, token), issued, 'issue retries replay the same ad credential');
  const conflictIssue = await call(app, 'POST', '/v1/ads/rewarded/issue', { slot: 'energy_refill', idempotencyKey: 'bonus-issue-1' }, token);
  assert.equal(conflictIssue.status, 409);
  assert.equal(conflictIssue.data.code, 'IDEMPOTENCY_CONFLICT');

  const started = await call(app, 'POST', '/v1/ads/rewarded/start', { adId: issued.data.adId, claimToken: issued.data.claimToken }, token);
  assert.equal(started.data.ok, true);
  assert.equal(started.data.state, 'playing');

  const before = app.store.ledger.balanceOf(playerId, 'COIN');
  const claimed = await call(app, 'POST', '/v1/ads/rewarded/claim', { adId: issued.data.adId, claimToken: issued.data.claimToken, completed: true, receipt: 'node-mock-complete' }, token);
  assert.equal(claimed.data.ok, true);
  assert.equal(claimed.data.state, 'granted');
  assert.equal(claimed.data.settlementId, issued.data.adId);
  assert.deepEqual(claimed.data.rewards, [{ assetId: 'COIN', delta: 30 }]);
  assert.equal(app.store.ledger.balanceOf(playerId, 'COIN'), before + 30);
  assert.deepEqual(await call(app, 'POST', '/v1/ads/rewarded/claim', { adId: issued.data.adId, claimToken: issued.data.claimToken, completed: true, receipt: 'node-mock-complete' }, token), claimed, 'claim is idempotent');
  assert.equal(app.store.ledger.balanceOf(playerId, 'COIN'), before + 30, 'duplicate claim does not grant again');

  const incomplete = await call(app, 'POST', '/v1/ads/rewarded/issue', { slot: 'energy_refill' }, token);
  assert.equal(incomplete.data.ok, true);
  const issuedDirectClaim = await call(app, 'POST', '/v1/ads/rewarded/claim', { adId: incomplete.data.adId, claimToken: incomplete.data.claimToken, completed: true, receipt: 'node-mock-complete' }, token);
  assert.equal(issuedDirectClaim.status, 400);
  assert.equal(issuedDirectClaim.data.code, 'BAD_REQUEST');
  const startedEnergy = await call(app, 'POST', '/v1/ads/rewarded/start', { adId: incomplete.data.adId, claimToken: incomplete.data.claimToken }, token);
  const rejected = await call(app, 'POST', '/v1/ads/rewarded/claim', { adId: incomplete.data.adId, claimToken: incomplete.data.claimToken, completed: false }, token);
  assert.equal(rejected.status, 400);
  assert.equal(rejected.data.code, 'BAD_REQUEST');
  const malformedReceipt = await call(app, 'POST', '/v1/ads/rewarded/claim', { adId: incomplete.data.adId, claimToken: incomplete.data.claimToken, completed: true, receipt: '   ' }, token);
  assert.equal(malformedReceipt.status, 400);
  assert.equal((await call(app, 'POST', '/v1/ads/rewarded/claim', { adId: incomplete.data.adId, claimToken: incomplete.data.claimToken, completed: true, receipt: 'node-mock-complete' }, token)).data.ok, true);

  const staleIssue = await call(app, 'POST', '/v1/ads/rewarded/issue', { slot: 'free_entry', idempotencyKey: 'stale-free-entry' }, token);
  assert.equal(staleIssue.data.ok, true);
  app.store.rewardedAd(playerId, staleIssue.data.adId)!.expiresAt = Date.now() - 1;
  const refreshedIssue = await call(app, 'POST', '/v1/ads/rewarded/issue', { slot: 'free_entry' }, token);
  assert.equal(refreshedIssue.data.ok, true, 'expired issued credential does not block a new issue');
  assert.notEqual(refreshedIssue.data.adId, staleIssue.data.adId);
  app.store.rewardedAd(playerId, refreshedIssue.data.adId)!.state = 'expired';

  const invalidSlot = await call(app, 'POST', '/v1/ads/rewarded/issue', { slot: 'cash_wallet' }, token);
  assert.equal(invalidSlot.status, 400);
  const forged = await call(app, 'POST', '/v1/ads/rewarded/claim', { adId: 'unknown', claimToken: 'unknown', completed: true, receipt: 'node-mock-complete' }, token);
  assert.equal(forged.status, 404);

  const session = await call(app, 'POST', '/v1/game/session/start', { featureId: 'escapeTiger' }, token);
  const revive = await call(app, 'POST', '/v1/ads/rewarded/issue', { slot: 'revive_escape', sessionId: session.data.sessionId }, token);
  assert.equal(revive.data.ok, true);
  const duplicateRevive = await call(app, 'POST', '/v1/ads/rewarded/issue', { slot: 'revive_escape', sessionId: session.data.sessionId }, token);
  assert.equal(duplicateRevive.status, 409);
  assert.equal(duplicateRevive.data.code, 'RATE_LIMITED');
  const failedSession = await call(app, 'POST', '/v1/game/session/start', { featureId: 'escapeTiger' }, token);
  const failedRecord = app.store.session(failedSession.data.sessionId)!;
  failedRecord.data = { step: 5, tigerDist: 0, alive: false, finished: true, obstacles: [-1, -1, -1, -1, -1, 1] };
  failedRecord.finished = true;
  const failedRevive = await call(app, 'POST', '/v1/ads/rewarded/issue', { slot: 'revive_escape', sessionId: failedRecord.sessionId }, token);
  assert.equal(failedRevive.data.ok, true, 'failed escape session can issue revive ad');
  const startedRevive = await call(app, 'POST', '/v1/ads/rewarded/start', { adId: failedRevive.data.adId, claimToken: failedRevive.data.claimToken }, token);
  assert.equal(startedRevive.data.state, 'playing');
  const revived = await call(app, 'POST', '/v1/ads/rewarded/claim', { adId: failedRevive.data.adId, claimToken: failedRevive.data.claimToken, completed: true, receipt: 'node-mock-complete' }, token);
  assert.equal(revived.data.entitlement, 'revive_escape');
  assert.equal(failedRecord.finished, false);
  assert.equal((failedRecord.data as any).tigerDist, 3);

  const retryFixture = await fixture();
  const retryApp = retryFixture.app;
  const retryToken = retryFixture.token;
  const retryPlayerId = retryFixture.playerId;
  const energyBeforeEmptySession = retryApp.store.ledger.balanceOf(retryPlayerId, 'ENERGY');
  if (energyBeforeEmptySession > 0) retryApp.store.ledger.apply({ playerId: retryPlayerId, assetType: 'ENERGY', delta: -energyBeforeEmptySession, sourceType: 'test', sourceId: 'empty-session' });
  const noEnergySession = await call(retryApp, 'POST', '/v1/game/session/start', { featureId: 'escapeTiger' }, retryToken);
  const noEnergyStart = await call(retryApp, 'POST', '/v1/game/action', { featureId: 'escapeTiger', actionId: 'start', sessionId: noEnergySession.data.sessionId, clientSeq: 1, payload: { animal: 'monkey' }, idempotencyKey: 'empty-session-start' }, retryToken);
  assert.equal(noEnergyStart.data.ok, false);
  assert.equal(retryApp.store.session(noEnergySession.data.sessionId)!.finished, true, 'failed no-energy session is closed immediately');
  const freeEntry = await call(retryApp, 'POST', '/v1/ads/rewarded/issue', { slot: 'free_entry' }, retryToken);
  const freeEntryStart = await call(retryApp, 'POST', '/v1/ads/rewarded/start', { adId: freeEntry.data.adId, claimToken: freeEntry.data.claimToken }, retryToken);
  assert.equal(freeEntryStart.data.state, 'playing');
  const freeEntryClaim = await call(retryApp, 'POST', '/v1/ads/rewarded/claim', { adId: freeEntry.data.adId, claimToken: freeEntry.data.claimToken, completed: true, receipt: 'node-mock-complete' }, retryToken);
  assert.equal(freeEntryClaim.data.ok, true);
  const retrySession = await call(retryApp, 'POST', '/v1/game/session/start', { featureId: 'escapeTiger' }, retryToken);
  const retryStart = await call(retryApp, 'POST', '/v1/game/action', { featureId: 'escapeTiger', actionId: 'start', sessionId: retrySession.data.sessionId, clientSeq: 1, payload: { animal: 'monkey' }, idempotencyKey: 'free-entry-retry-start' }, retryToken);
  assert.equal(retryStart.data.ok, true);
  const escapedState = await call(retryApp, 'GET', '/v1/game/state?featureId=escapeTiger', {}, retryToken);
  assert.equal(escapedState.data.ok, true);
  assert.ok(Array.isArray(escapedState.data.state.active.obstacles), 'free-entry retry exposes initialized escape state');

  const platform = new NodePlatform();
  const ad = platform.createRewardedAd('adunit-test');
  const shown = await ad.show();
  assert.equal(shown.isEnded, true);
  assert.equal(platform.rewardedAdsShown[0], 'adunit-test');
  platform.enqueueRewardedAdResult({ isEnded: false });
  assert.equal((await ad.show()).isEnded, false);

  const previousWx = (globalThis as any).wx;
  const wxCloseCallbacks: Array<(result: any) => void> = [];
  (globalThis as any).wx = {
    createRewardedVideoAd: () => ({
      onClose(cb: (result: any) => void) { wxCloseCallbacks.push(cb); },
      offClose() {},
      show() { wxCloseCallbacks[0]?.({ isEnded: true, receipt: 'wx-platform-receipt' }); return Promise.resolve(); },
      load() { return Promise.resolve(); },
    }),
  };
  const wxAd = new (require('../client/src/platform/platform').WxPlatform)().createRewardedAd('wx-adunit');
  assert.deepEqual(await wxAd.show(), { isEnded: true, receipt: 'wx-platform-receipt' });
  (globalThis as any).wx = {
    createRewardedVideoAd: () => ({
      onClose(cb: (result: any) => void) { cb({ isEnded: true }); },
      offClose() {},
      show() { return Promise.resolve(); },
    }),
  };
  const wxGenerated = new (require('../client/src/platform/platform').WxPlatform)().createRewardedAd('wx-adunit-generated');
  const generatedClose = await wxGenerated.show();
  assert.equal(generatedClose.isEnded, true);
  assert.match(generatedClose.receipt || '', /^wx-rewarded-complete-/);
  (globalThis as any).wx = previousWx;

  let destroyed = false;
  const escapeScreen = new EscapeTigerScreen();
  escapeScreen.app = {
    api: {
      issueRewardedAd: async () => ({ ok: true, adId: 'cleanup-ad', claimToken: 'cleanup-token', adUnitId: 'cleanup-unit' }),
      startRewardedAd: async () => ({ ok: true }),
      claimRewardedAd: async () => ({ ok: true }),
    },
    platform: { createRewardedAd: () => ({ load: async () => { throw new Error('load failed'); }, show: async () => ({ isEnded: true }), destroy: () => { destroyed = true; } }) },
    showToast() {},
  } as any;
  assert.equal(await (escapeScreen as any).watchRewarded('free_entry'), false);
  assert.equal(destroyed, true, 'escape rewarded ad is destroyed when load/show fails');

  const database = new MemoryDocumentDatabase();
  const repository = new PersistentRepository(database);
  const persistentApp = new GameApp({ profile: 'wechat-release', bootPngSeeds: false, wechatCodeExchange: async () => ({ openid: 'persistent-rewarded-player' }) });
  const persistent = new PersistentApi(persistentApp, repository, 'wx0123456789abcdef');
  const persistentLogin = await call(persistent as any, 'POST', '/v1/auth/wechat', { code: 'persistent-rewarded' });
  const persistentIssue = await call(persistent as any, 'POST', '/v1/ads/rewarded/issue', { slot: 'bonus_chest', idempotencyKey: 'persistent-ad-issue' }, persistentLogin.data.token);
  assert.equal(persistentIssue.data.ok, true);
  const persistentStart = await call(persistent as any, 'POST', '/v1/ads/rewarded/start', { adId: persistentIssue.data.adId, claimToken: persistentIssue.data.claimToken, idempotencyKey: 'persistent-ad-start' }, persistentLogin.data.token);
  assert.equal(persistentStart.data.state, 'playing');
  const persistentClaim = await call(persistent as any, 'POST', '/v1/ads/rewarded/claim', { adId: persistentIssue.data.adId, claimToken: persistentIssue.data.claimToken, completed: true, receipt: 'persistent-mock', idempotencyKey: 'persistent-ad-claim' }, persistentLogin.data.token);
  assert.equal(persistentClaim.data.ok, true);
  const restartedApp = new GameApp({ profile: 'wechat-release', bootPngSeeds: false, wechatCodeExchange: async () => ({ openid: 'persistent-rewarded-player' }) });
  const restarted = new PersistentApi(restartedApp, repository, 'wx0123456789abcdef');
  const replayAfterRestart = await call(restarted as any, 'POST', '/v1/ads/rewarded/claim', { adId: persistentIssue.data.adId, claimToken: persistentIssue.data.claimToken, completed: true, receipt: 'persistent-mock', idempotencyKey: 'persistent-ad-claim-retry' }, persistentLogin.data.token);
  assert.deepEqual(replayAfterRestart.data, persistentClaim.data, 'rewarded claim survives persistent repository restart');
  console.log('ad-rewarded ok: issue/start/claim, fixed rewards, idempotency, incomplete/forged requests, slot/session caps and Node mock');
}

if (require.main === module) run().catch((error) => { console.error(error); process.exitCode = 1; });
