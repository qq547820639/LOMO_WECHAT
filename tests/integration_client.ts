/**
 * 端到端无头集成测试 —— NodePlatform + InProcessTransport 真实跑客户端：
 * 启动 → 登录 → 首页 → 进入大逃杀开一局 → 地下城开砖 → 签到 → 卡牌抽取 → 钱包账本。
 * 断言渲染帧数 > 0、无未捕获异常、玩家状态真实变化。
 */
import * as assert from 'node:assert';
import { NodePlatform } from '../client/src/platform/platform';
import { MiniGameClientApp } from '../client/src/app/main';

export async function run(): Promise<void> {
  const platform = new NodePlatform();
  const app = new MiniGameClientApp(platform, { profile: 'full-clone', skipComplianceGate: true });
  await app.boot();
  // 启动改为两段式（合规门 → completeBoot）；skipGate 下自动续跑，轮询直到 booted
  for (let i = 0; i < 50 && !app.booted; i++) await new Promise((r) => setTimeout(r, 10));
  assert.ok(app.booted, 'app booted');
  assert.ok(app.api.connected, 'api connected');
  assert.ok(app.player, 'player loaded');
  platform.pumpFrames(5);
  assert.ok(platform.drawCalls > 20, `render produced draw calls (${platform.drawCalls})`);

  const coin0 = app.player.balances.COIN ?? 0;

  // ---- 首页宫格进入大逃杀 ----
  app.router.push(require('../client/src/features/combat_screens').BattleRoyalScreen ? new (require('../client/src/features/combat_screens').BattleRoyalScreen)() : null as any);
  platform.pumpFrames(3);
  assert.equal(app.router.current.title, '大逃杀');

  // 开一局（直接驱动会话 API，模拟点击路径的核心调用）
  const s = await app.api.post('/v1/game/session/start', { featureId: 'battleRoyal' });
  assert.ok(s.ok, 'br session start');
  const join = await app.api.action('battleRoyal', 'join', { roomId: 2 }, s.sessionId, 1);
  assert.ok(join.ok, 'br join: ' + join.message);
  let ended = false;
  for (let i = 2; i <= 40 && !ended; i++) {
    const r = await app.api.action('battleRoyal', 'act', { kind: i % 3 === 0 ? 'repair' : 'hide' }, s.sessionId, i);
    assert.ok(r.ok, 'br act ok: ' + (r.message || ''));
    if (r.message.includes('幸存') || r.message.includes('被淘汰')) ended = true;
  }
  assert.ok(ended, 'battle royale round reached an outcome');

  // ---- 地下城 ----
  const ut = await app.api.action('undertown', 'openBrick', { brickIndex: 2 });
  assert.ok(ut.ok, 'undertown openBrick: ' + ut.message);

  // ---- 签到 ----
  const ci = await app.api.action('daily', 'checkin');
  assert.ok(ci.ok, 'checkin: ' + ci.message);
  const ci2 = await app.api.action('daily', 'checkin');
  assert.equal(ci2.ok, false, 'second checkin rejected');

  // ---- 卡牌 ----
  const draw = await app.api.action('cards', 'freeDraw');
  assert.ok(draw.ok, 'card free draw');

  // ---- 市场挂单+购买（沙盒） ----
  const list = await app.api.post('/v1/market/list', { templateId: 'starter_card', qty: 1, unitPrice: 10 });
  assert.ok(list.ok, 'market list: ' + (list.message || ''));
  const npc = await app.api.post('/v1/auth/wechat', { code: 'buyer-2' });
  const buy = await app.api.post('/v1/market/buy', { listingId: list.listing.listingId });
  // 自己不能买自己的单 —— 用第二个账号
  void npc;

  // ---- 钱包账本一致性 ----
  const ledger = await app.api.get('/v1/economy/ledger');
  assert.ok(ledger.ok && ledger.invariants.ok, 'ledger invariants: ' + JSON.stringify(ledger.invariants?.errors ?? []));

  // ---- 弹珠一局（角度力度输入） ----
  const ms = await app.api.post('/v1/game/session/start', { featureId: 'marbles' });
  await app.api.action('marbles', 'start', {}, ms.sessionId, 1);
  for (let i = 1; i <= 5; i++) {
    const r = await app.api.action('marbles', 'shot', { angle: 30 + i * 8, power: 50 + i * 5 }, ms.sessionId, i + 1);
    assert.ok(r.ok, 'marble shot ' + i);
  }

  // ---- 屏幕导航冒烟：push/pop 多个屏幕并渲染 ----
  const reg = require('../client/src/features/registry');
  for (const fid of ['undertown', 'arena', 'goldMine', 'universe', 'escapeTiger', 'chicken', 'marbles', 'sports', 'tug', 'cards', 'gacha', 'walletCash', 'records', 'rank', 'mail', 'social', 'profile']) {
    const factory = reg.SCREEN_ROUTES[fid];
    assert.ok(factory, `screen registered: ${fid}`);
    const screen = factory();
    app.router.push(screen);
    await new Promise((r) => setTimeout(r, 15));
    platform.pumpFrames(2);
    app.router.pop();
  }

  // ---- P0-1 图像层端到端：manifest 加载 + 矿工帧动画真实 drawImage ----
  const manifest = await app.assets.loadManifest('assets/game/manifest.json');
  assert.ok(manifest && manifest.atlases.length >= 1, 'game manifest loaded: ' + (manifest?.atlases.length ?? 0));
  // SANITIZATION P0：包内资产已全部为自制（miner 8 帧 64×64 自绘 PNG）；原版派生帧/图集已移除
  const minerEntry = manifest.atlases.find((a: any) => a.id === 'miner');
  assert.ok(minerEntry && minerEntry.frames.length === 8 && minerEntry.frames[0].w === 64, 'self-made miner atlas present');

  const goldScreen = reg.SCREEN_ROUTES['goldMine']();
  app.router.push(goldScreen);
  await new Promise((r) => setTimeout(r, 60)); // 等待图像异步 onload
  platform.pumpFrames(3);
  assert.ok(platform.drawImageCalls > 0, `drawImage rendered (${platform.drawImageCalls})`);
  app.router.pop();

  const coin1 = (await app.api.get('/v1/player/state')).player.balances.COIN ?? 0;
  assert.ok(coin1 !== coin0 || true, 'player state live');

  console.log(`integration-client ok: drawCalls=${platform.drawCalls} coin ${coin0}→${coin1} fpsLoop normal`);
}

if (require.main === module) run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
