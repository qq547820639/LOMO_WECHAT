import * as assert from 'node:assert';
import { MiniGameClientApp } from '../client/src/app/main';
import { AssetManager } from '../client/src/core/assets';
import { Screen } from '../client/src/core/router';
import { BattleRoyalScreen, registerCombatScreens } from '../client/src/features/combat_screens';
import { SCREEN_ROUTES } from '../client/src/features/registry';
import { ApiClient, InProcessTransport } from '../client/src/net/api';
import { NodePlatform } from '../client/src/platform/platform';
import { UI } from '../client/src/ui/widgets';
import { GameApp } from '../server/src/app';

function deferred(): { promise: Promise<void>; release: () => void } {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => { release = resolve; });
  return { promise, release };
}

async function fixture(): Promise<{ app: MiniGameClientApp; server: GameApp }> {
  const platform = new NodePlatform();
  const app = new MiniGameClientApp(platform, { profile: 'wechat-release' });
  const transport = new InProcessTransport('wechat-release');
  app.api = new ApiClient(transport);
  app.ui = new UI(platform.createCanvas().getContext('2d'), 375, 812);
  app.assets = new AssetManager(platform);
  await app.api.login('combat-test');
  await app.refreshPlayer();
  return { app, server: transport.appInstance };
}

async function enter(app: MiniGameClientApp, screen: Screen): Promise<void> {
  screen.app = app;
  await screen.onEnter();
}

function button(screen: Screen, id: string): () => Promise<void> {
  screen.app.ui.beginFrame();
  screen.render();
  const hit = (screen.app.ui as UI).hits.find((candidate) => candidate.id === id);
  assert.ok(hit, `interactive button ${id}`);
  return async () => { await hit!.onTap(); };
}

function assertDisabled(screen: Screen, id: string): void {
  screen.app.ui.beginFrame();
  screen.render();
  assert.equal((screen.app.ui as UI).hits.some((candidate) => candidate.id === id), false);
}

export async function run(): Promise<void> {
  const priorNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'test';
  try {
    const { app, server } = await fixture();
    const battle = new BattleRoyalScreen();
    await enter(app, battle);
    const join = button(battle, 'br-join');
    const requestGate = deferred();
    const originalPost = app.api.post.bind(app.api);
    let starts = 0;
    app.api.post = async (route, body) => {
      if (route === '/v1/game/session/start') { starts++; await requestGate.promise; }
      return originalPost(route, body);
    };
    const firstJoin = join();
    await join();
    assertDisabled(battle, 'br-join');
    requestGate.release();
    await firstJoin;
    await Promise.resolve();
    assert.equal(starts, 1, 'rapid taps start one session');
    assert.equal(Object.keys(server.store.data.sessions).length, 1);
    assert.equal(server.store.ledger.balanceOf(app.api.playerId!, 'COIN'), 450);
    assert.equal(app.player.balances.COIN, 450, 'button response refreshes the HUD after the 50-coin entry fee');

    const insufficient = await fixture();
    const retryBattle = new BattleRoyalScreen();
    insufficient.server.store.ledger.applyBatch(insufficient.app.api.playerId!, [{ assetType: 'COIN', delta: -500, sourceType: 'test', sourceId: 'empty-wallet' }]);
    await insufficient.app.refreshPlayer();
    await enter(insufficient.app, retryBattle);
    await button(retryBattle, 'br-join')();
    assert.ok(insufficient.app.toast?.text.includes('金币不足'));
    assert.equal(Object.keys(insufficient.server.store.data.sessions).length, 1);
    insufficient.server.store.ledger.applyBatch(insufficient.app.api.playerId!, [{ assetType: 'COIN', delta: 100, sourceType: 'test', sourceId: 'refill-wallet' }]);
    await button(retryBattle, 'br-join')();
    assert.equal(insufficient.app.player.balances.COIN, 50, 'failed join can reuse its pending session after funds recover');
    assert.equal(Object.keys(insufficient.server.store.data.sessions).length, 1, 'retry never creates a competing empty session');

    for (const lostAt of ['start', 'join', 'join-error-result'] as const) {
      const lost = await fixture();
      const lostBattle = new BattleRoyalScreen();
      await enter(lost.app, lostBattle);
      const post = lost.app.api.post.bind(lost.app.api);
      let discarded = false;
      let sessionRequests = 0;
      let joinRequests = 0;
      lost.app.api.post = async (route, body) => {
        if (route === '/v1/game/session/start') sessionRequests++;
        if (route === '/v1/game/action' && body.actionId === 'join') joinRequests++;
        const response = await post(route, body);
        if (!discarded && ((lostAt === 'start' && route === '/v1/game/session/start') || (lostAt !== 'start' && route === '/v1/game/action' && body.actionId === 'join'))) {
          discarded = true;
          if (lostAt === 'join-error-result') return { ok: false, code: 'SERVER_ERROR', message: 'response lost' };
          throw new Error('response lost');
        }
        return response;
      };
      await button(lostBattle, 'br-join')();
      assert.equal(lost.app.toast?.text, 'response lost');
      if (lostAt !== 'join-error-result') await button(lostBattle, 'br-join')();
      assert.equal(sessionRequests, 1, `lost ${lostAt} response recovers server state before creating another session`);
      assert.equal(joinRequests, 1, `lost ${lostAt} response cannot charge the entry fee again`);
      assert.equal(lost.app.player.balances.COIN, 450);
    }

    registerCombatScreens();
    for (const featureId of ['arena', 'monkeyFight']) {
      const duel = await fixture();
      const screen = SCREEN_ROUTES[featureId]();
      await enter(duel.app, screen);
      const fight = button(screen, 'duel-fight');
      const action = duel.app.api.action.bind(duel.app.api);
      const fightGate = deferred();
      let actionCalls = 0;
      duel.app.api.action = async (...args) => { actionCalls++; assert.equal(args[0], featureId); await fightGate.promise; return action(...args); };
      const firstFight = fight();
      await fight();
      assertDisabled(screen, 'duel-fight');
      fightGate.release();
      await firstFight;
      assert.equal(actionCalls, 1, `${featureId} challenge suppresses duplicate taps`);
      assert.equal(duel.app.player.balances.ENERGY, 27, `${featureId} challenge updates the energy HUD`);
      assert.equal(duel.app.player.balances.COIN, duel.server.store.ledger.balanceOf(duel.app.api.playerId!, 'COIN'));
      assert.equal(duel.server.store.history(duel.app.api.playerId!, featureId, 10).length, 1, 'challenge is recorded under its own feature');

      duel.app.api.action = async () => { throw new Error('temporary challenge failure'); };
      await button(screen, 'duel-fight')();
      assert.equal(duel.app.toast?.text, 'temporary challenge failure');
      duel.app.api.action = action;
      await button(screen, 'duel-fight')();
      assert.equal(duel.app.player.balances.ENERGY, 24, 'challenge becomes retryable after an exception');
    }
    console.log('client-combat ok: real button fee/HUD sync, duplicate suppression, pending-session retry, lost-response recovery, correct duel routing');
  } finally {
    if (priorNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = priorNodeEnv;
  }
}

if (require.main === module) run().then(() => process.exit(0)).catch((error) => { console.error(error); process.exit(1); });
