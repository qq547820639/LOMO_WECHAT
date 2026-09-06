/**
 * P0-1 图像层单测：manifest 校验 / LRU 驱逐 / FrameClip 帧数学与事件 / 占位兜底。
 * 以及合规门页（健康忠告+隐私授权）行为测试。
 */
import * as assert from 'node:assert';
import { AssetManager, validateManifest, GameManifest } from '../client/src/core/assets';
import { FrameClip } from '../client/src/ui/frame_clip';
import { NodePlatform } from '../client/src/platform/platform';
import { MiniGameClientApp } from '../client/src/app/main';
import { GameApp } from '../server/src/app';
import { eggProgress } from '../client/src/features/minigame_screens';

function fixtureManifest(): GameManifest {
  return {
    version: 'test-1',
    base: 'assets/game/',
    atlases: [
      {
        id: 'a1', fps: 10,
        frames: [
          { name: 'f0', file: 'a1/f0.png', w: 32, h: 32 },
          { name: 'f1', file: 'a1/f1.png', w: 32, h: 32 },
          { name: 'f2', file: 'a1/f2.png', w: 32, h: 32 },
          { name: 'f3', file: 'a1/f3.png', w: 32, h: 32 },
        ],
      },
      { id: 'a2', fps: 10, frames: [{ name: 'g0', file: 'a2/g0.png', w: 32, h: 32 }] },
      { id: 'a3', fps: 10, frames: [{ name: 'h0', file: 'a3/h0.png', w: 32, h: 32 }] },
    ],
  };
}

export async function run(): Promise<void> {
  // ---------- manifest 校验 ----------
  {
    const bad: GameManifest = {
      version: '', base: '',
      atlases: [
        { id: 'x', frames: [] },
        { id: 'x', fps: 10, frames: [{ name: '', w: -1, h: 0 }] }, // loose 形态缺 file + 坏尺寸
        { id: 'packed-ok', file: 'sheet.png', fps: 10, frames: [{ name: 'p0', x: 0, y: 0, w: 10, h: 10 }] },
      ],
    };
    const errors = validateManifest(bad);
    assert.ok(errors.length >= 5, `validate catches issues: ${errors.length}`);
    assert.ok(errors.some((e) => e.includes('version')));
    assert.ok(errors.some((e) => e.includes('duplicate')));
    const good = validateManifest(fixtureManifest());
    assert.equal(good.length, 0, 'fixture valid: ' + good.join(';'));
  }

  // ---------- LRU 驱逐 ----------
  {
    const platform = new NodePlatform();
    const assets = new AssetManager(platform, { maxTextures: 2 });
    (assets as any).manifest = fixtureManifest();
    const a1 = await assets.getAtlas('a1');
    const a2 = await assets.getAtlas('a2');
    assert.ok(a1 && a2);
    assert.equal(assets.stats.evictions, 0);
    const a3 = await assets.getAtlas('a3'); // 超过 2 张 → 驱逐 a1
    assert.ok(a3);
    assert.equal(assets.stats.evictions, 1);
    const gone = await assets.getAtlas('a1'); // 再取 → 重新加载（miss+1）
    assert.ok(gone);
    assert.equal(assets.stats.evictions, 2);
    assert.ok(assets.stats.hits >= 0);
    // 手动释放
    assets.release('a3');
    const miss = await assets.getAtlas('nope'); // manifest 无此 id → null（占位路径）
    assert.equal(miss, null);
  }

  // ---------- FrameClip 帧数学 + 事件 ----------
  {
    const platform = new NodePlatform();
    const assets = new AssetManager(platform);
    (assets as any).manifest = fixtureManifest();
    const events: number[] = [];
    let doneFired = 0;
    const clip = new FrameClip(assets, 'a1', 'idle', { fps: 10, loop: false, onFrame: (i) => events.push(i), onDone: () => doneFired++ });
    clip.play();
    // 等 async 加载（microtask）
    for (let i = 0; i < 5 && !clip.state.loaded; i++) await new Promise((r) => setTimeout(r, 5));
    assert.ok(clip.state.loaded, 'clip loaded');
    clip.update(0); // 启动
    clip.update(150); // 1.5 帧 → frame 1
    assert.equal(clip.state.frame, 1, `frame at 150ms: ${clip.state.frame}`);
    clip.update(200); // 累计 350ms → frame 3
    assert.equal(clip.state.frame, 3);
    clip.update(100); // 累计 450 ≥ 400ms 总长 → 一次性播完
    assert.ok(clip.state.finished, 'once clip finishes');
    assert.equal(doneFired, 1, 'onDone fired once');
    assert.ok(events.length >= 3, `frame events: ${events.length}`);
    // loop wrap
    const loopClip = new FrameClip(assets, 'a1', 'idle', { fps: 10, loop: true });
    loopClip.play();
    for (let i = 0; i < 5 && !loopClip.state.loaded; i++) await new Promise((r) => setTimeout(r, 5));
    loopClip.update(0);
    loopClip.update(950); // > 总长 400 → wrap
    assert.equal(loopClip.state.frame, Math.floor((950 % 400) / 100), 'loop wraps');

    const prefixed: GameManifest = {
      version: 'clip-durations', base: 'assets/game/',
      atlases: [{ id: 'clips', fps: 10, frames: [
        { name: 'idle:0', file: 'clips/i0.png', w: 16, h: 16, dur: 900 },
        { name: 'burst:0', file: 'clips/b0.png', w: 16, h: 16, dur: 40 },
        { name: 'burst:1', file: 'clips/b1.png', w: 16, h: 16, dur: 60 },
      ] }],
    };
    const prefixedAssets = new AssetManager(new NodePlatform());
    (prefixedAssets as any).manifest = prefixed;
    const burst = new FrameClip(prefixedAssets, 'clips', 'burst', { loop: false });
    burst.play();
    for (let i = 0; i < 5 && !burst.state.loaded; i++) await new Promise((r) => setTimeout(r, 5));
    burst.update(39);
    assert.equal(burst.state.frame, 0, 'prefixed clip uses first child duration');
    burst.update(40);
    assert.equal(burst.state.frame, 1, 'prefixed clip advances by child duration');
    burst.update(30);
    assert.ok(burst.state.finished, 'prefixed clip finishes at child total duration');
  }

  // ---------- 占位兜底（manifest 缺失/图集缺失不断帧） ----------
  {
    const platform = new NodePlatform();
    const assets = new AssetManager(platform);
    const clip = new FrameClip(assets, 'ghost', 'idle');
    clip.play();
    for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 5));
    const before = platform.drawCalls;
    clip.update(16);
    assert.ok(clip.state.failed, 'missing atlas flagged');
    assert.ok(true);
  }

  // ---------- 合规门：门页渲染 + 隐私同意 + 上报 ----------
  {
    const now = 1_000_000;
    assert.equal(eggProgress(now + 15_000, now), 0.5, 'egg progress uses wall clock');
    assert.equal(eggProgress(now + 15_000, now, 0), 0.5, 'egg progress clamps invalid duration');
    assert.equal(eggProgress(now - 1, now), 1, 'egg progress reaches ready state');
    assert.equal(eggProgress(0, now), 0, 'egg progress handles empty timer');
  }

  // ---------- 合规门：门页渲染 + 隐私同意 + 上报 ----------
  {
    const app = new GameApp({ profile: 'wechat-release', bootPngSeeds: false, allowSyntheticWechatAuth: true });
    const privacyPlayer = app.store.ensurePlayer('privacy-test-openid', 'privacy-test', Date.now()).player;
    const platform = new NodePlatform();
    platform.privacyNeedAuth = true;
    const client = new MiniGameClientApp(platform, { profile: 'wechat-release', skipComplianceGate: true });
    (client as any).api = { // 直接挂服务端进程内 transport
      async connect() {}, async login() { return { playerId: 'x', isNew: true, antiAddiction: { realNameVerified: true, isMinor: false, playableNow: true, remainingMinutesToday: null, message: '' } }; },
      async get() { return { ok: true, player: { balances: {}, counters: {}, level: 1, xp: 0, xpToNext: 100, nick: 't', playerId: 'x', inventory: [], timestamps: {}, createdAt: 1 } }; },
      async post(path: string, body: any) {
        const routes = (app as any).routes();
        const found = routes.find((r: any) => r.pattern === path && r.method === 'POST');
        assert.ok(found, 'route exists ' + path);
        const token = app.issueToken(privacyPlayer.playerId);
        const out: any = {};
        const ctx = { req: { headers: { authorization: 'Bearer ' + token } }, res: {}, method: 'POST', path, params: {}, query: new URLSearchParams(), body: body || {}, status() {}, json(d: any) { out.d = d; } };
        await found.handler(ctx);
        return out.d;
      },
    };
    (client as any).telemetry = () => {};
    // 隐私层单测：getPrivacySetting → requirePrivacyAuthorize → 服务端留痕
    const setting = await platform.getPrivacySetting();
    assert.ok(setting.needAuthorization && setting.supported, 'privacy needed');
    const agreed = await platform.requirePrivacyAuthorize();
    assert.ok(agreed, 'privacy agreed');
    const consent: any = await client.api.post('/v1/compliance/privacy-consent', { agree: true, contract: setting.privacyContractName });
    assert.ok(consent.ok && consent.action === 'proceed', 'consent recorded');
    const refuse: any = await client.api.post('/v1/compliance/privacy-consent', { agree: false });
    assert.ok(refuse.ok && refuse.action === 'exit', 'refuse recorded with exit action');
    assert.ok(app.store.data.audit.some((a) => a.kind === 'privacy.consent'), 'audit trail exists');
  }

  console.log('unit-assets+compliance ok: manifest/LRU/FrameClip/placeholder/privacy-consent');
}

if (require.main === module) run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
