import * as assert from 'node:assert';
import { configureCanvas } from '../client/src/ui/canvas';
import { UI } from '../client/src/ui/widgets';
import { MiniGameClientApp } from '../client/src/app/main';
import { NodePlatform, WxPlatform } from '../client/src/platform/platform';
import { featuresForTab } from '../client/src/features/registry';
import { FEATURES } from '../shared/src/gen/data.gen';
import { ComplianceGateScreen } from '../client/src/features/compliance_gate';
import { ApiClient } from '../client/src/net/api';
import { HomeLobbyScreen } from '../client/src/features/home_lobby';
import { RELEASE_CORE_FEATURES } from '../shared/src/registry';

export async function run(): Promise<void> {
  let homeStateRequests = 0;
  const home = new HomeLobbyScreen();
  home.app = { player: { balances: { COIN: 500 } }, api: { gameState: async () => { homeStateRequests++; return { ok: false }; } } };
  await home.onEnter();
  assert.equal(homeStateRequests, 0, 'home uses loaded player without requesting a missing gameplay state');
  for (const dpr of [1, 2, 3]) {
    let appliedScale = 0;
    const context = { fillRect() {}, translate() {}, scale: (horizontal: number, vertical: number) => { assert.equal(horizontal, vertical); appliedScale = horizontal; } };
    const canvas = { width: 0, height: 0, getContext: () => context };
    const layout = configureCanvas(canvas, { w: 390, h: 844, dpr });
    assert.equal(layout.ctx, context);
    assert.equal(appliedScale, 390 / 375 * Math.min(dpr, 2));
    assert.equal(layout.inputScale, 390 / 375);
    assert.equal(canvas.height, 844 * Math.min(dpr, 2));
  }

  let fallbackPanel = false;
  new UI({ fillRect: () => { fallbackPanel = true; } } as any, 375, 667).panel({ x: 10, y: 10, w: 20, h: 20 });
  assert.equal(fallbackPanel, true);
  const modalPlatform = new NodePlatform();
  const modalUi = new UI(modalPlatform.createCanvas().getContext('2d'), 375, 667);
  let underlyingTap = false;
  modalUi.hits.push({ x: 0, y: 0, w: 100, h: 40, id: 'under-modal', onTap: () => { underlyingTap = true; } });
  modalUi.modal('提示', ['内容'], () => {});
  modalUi.onTap(20, 20);
  assert.equal(underlyingTap, false, 'modal blocks underlying hits');
  const privacyPlatform = new NodePlatform();
  privacyPlatform.privacyNeedAuth = true;
  let gatePasses = 0;
  let earlyConsentRequests = 0;
  const privacyGate = new ComplianceGateScreen(() => { gatePasses++; });
  privacyGate.app = {
    platform: privacyPlatform,
    showToast: () => {},
    showModal: () => {},
    telemetry: () => {},
    api: { post: async () => { earlyConsentRequests++; } },
  };
  privacyGate.onEnter();
  (privacyGate as any).pass();
  assert.equal(gatePasses, 0, 'privacy lookup must finish before entering');
  await Promise.resolve();
  (privacyGate as any).pass();
  assert.equal(gatePasses, 0, 'required privacy authorization cannot be bypassed');
  await (privacyGate as any).agreePrivacy();
  (privacyGate as any).pass();
  assert.equal(gatePasses, 1, 'authorized player can continue');
  assert.equal(earlyConsentRequests, 0, 'consent is not posted before authenticated login');
  assert.equal(privacyPlatform.storageGet('app.privacy.consent.pending').contract, '《猿岛隐私保护指引》(mock)');
  (privacyGate as any).declinePrivacy();
  assert.equal(earlyConsentRequests, 0, 'refusal does not call authenticated audit endpoint');
  let privacyChecks = 0;
  const retryGate = new ComplianceGateScreen(() => {});
  retryGate.app = { ...privacyGate.app, platform: {
    storageGet: () => null,
    getPrivacySetting: async () => { privacyChecks++; if (privacyChecks === 1) throw new Error('network'); return { needAuthorization: false, supported: true, privacyContractName: '' }; },
  } };
  retryGate.onEnter();
  await Promise.resolve();
  await Promise.resolve();
  (retryGate as any).pass();
  await Promise.resolve();
  assert.equal(privacyChecks, 2, 'failed privacy lookup can be retried in place');

  const loginResults = new Map<string, (response: any) => void>();
  const sessionApi = new ApiClient({ request: async (_path, _method, body) => new Promise((resolve) => { loginResults.set(body.code, resolve); }) });
  const oldGeneration = sessionApi.beginSession();
  const oldLogin = sessionApi.login('old', oldGeneration);
  const oldRejected = assert.rejects(oldLogin, /STALE_SESSION/);
  sessionApi.invalidateSession();
  const newGeneration = sessionApi.beginSession();
  const newLogin = sessionApi.login('new', newGeneration);
  loginResults.get('new')!({ ok: true, token: 'new-token', playerId: 'new-player' });
  await newLogin;
  loginResults.get('old')!({ ok: true, token: 'old-token', playerId: 'old-player' });
  await oldRejected;
  assert.equal(sessionApi.token, 'new-token', 'late login cannot overwrite new token');
  assert.equal(sessionApi.playerId, 'new-player', 'late login cannot overwrite new identity');
  for (const viewport of [{ w: 390, h: 844, dpr: 3, topInset: 84, bottomInset: 34 }, { w: 375, h: 568, dpr: 2, topInset: 84, bottomInset: 34 }]) {
    const safePlatform = new NodePlatform();
    safePlatform.getWindowSize = () => viewport;
    const safeApp = new MiniGameClientApp(safePlatform, { profile: 'full-clone' });
    await safeApp.boot();
    await Promise.resolve();
    let safePasses = 0;
    (safeApp as any).completeBoot = async () => { safePasses++; };
    safePlatform.pumpFrames();
    const entry = safeApp.ui.hits.find((hit) => hit.id.includes('进入游戏'));
    assert.ok(entry, `consent entry fits safe content height ${safeApp.ui.h}`);
    const inputScale = viewport.w / 375;
    safePlatform.tap((entry!.x + entry!.w / 2) * inputScale, (entry!.y + entry!.h / 2) * inputScale + viewport.topInset);
    assert.equal(safePasses, 1, 'safe-area offset preserves touch alignment');
    safeApp.router.dispose();
  }
  for (const profile of ['full-clone', 'wechat-release']) {
    const reachable = new Set(['chaowan', 'ape', 'games', 'trade', 'mine'].flatMap((tab) => featuresForTab(tab, profile).map((feature) => feature.id)));
    if (profile === 'full-clone') {
      for (const feature of FEATURES) assert.ok(reachable.has(feature.id), `${profile} tab reaches ${feature.id}`);
    } else {
      for (const featureId of RELEASE_CORE_FEATURES) assert.ok(reachable.has(featureId), `${profile} tab reaches ${featureId}`);
      for (const feature of FEATURES.filter((entry) => entry.release === 'cut' || entry.release === 'defer')) assert.ok(!reachable.has(feature.id), `${profile} hides ${feature.id}`);
    }
  }

  const originalTimeout = globalThis.setTimeout;
  const originalClear = globalThis.clearTimeout;
  const scheduled = new Map<number, { callback: () => void; delay: number }>();
  let nextTimer = 1;
  (globalThis as any).setTimeout = (callback: () => void, delay: number) => { const timer = nextTimer++; scheduled.set(timer, { callback, delay }); return timer; };
  (globalThis as any).clearTimeout = (timer: number) => { scheduled.delete(timer); };
  const runtime = globalThis as any;
  const originalWx = runtime.wx;
  const originalRaf = runtime.requestAnimationFrame;
  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    const platform = new NodePlatform();
    const app = new MiniGameClientApp(platform, { profile: 'full-clone' });
    await app.boot();
    await Promise.resolve();
    assert.equal([...scheduled.values()].some((timer) => timer.delay === 20000), false, 'waiting for consent has no startup deadline');
    platform.pumpFrames();
    assert.ok(app.ui.hits.every((hit) => !hit.id.startsWith('tab-') && hit.id !== '← 返回'), 'consent gate has no navigation bypass');
    let connectCalls = 0;
    let finishConnection!: () => void;
    app.api.connect = () => { connectCalls++; return new Promise<void>((resolve) => { finishConnection = resolve; }); };
    const pending = (app as any).completeBoot();
    await (app as any).completeBoot();
    assert.equal(connectCalls, 1, 'concurrent login attempts are suppressed');
    const deadline = [...scheduled.values()].find((timer) => timer.delay === 20000);
    assert.ok(deadline, 'network boot has startup deadline');
    deadline!.callback();
    assert.equal(app.fatal, null, 'timeout remains recoverable');
    assert.ok(app.modal?.actions.some((action) => action.label === '重试'));
    finishConnection();
    await pending;
    assert.equal(app.booted, false, 'late completion cannot replace retry gate');
    app.api.connect = async () => {};
    app.api.login = async () => ({ antiAddiction: { playableNow: true }, isNew: false }) as any;
    app.api.get = async () => ({ ok: true, player: { level: 1, balances: {}, xp: 0, xpToNext: 10 } }) as any;
    app.fatal = 'stale startup failure';
    await (app as any).completeBoot();
    assert.equal(app.booted, true, 'retry can complete');
    assert.equal(app.fatal, null, 'retry clears stale fatal state');
    assert.equal((app as any).bootWatchdog, null, 'success cancels watchdog');
    let finishOldRefresh!: (response: any) => void;
    app.api.get = async () => new Promise((resolve) => { finishOldRefresh = resolve; });
    const oldRefresh = app.refreshPlayer();
    (app as any).bootAttemptId++;
    app.player = { level: 5, balances: { COIN: 1234 } };
    finishOldRefresh({ ok: true, player: { level: 1, balances: { COIN: 1 } } });
    await oldRefresh;
    assert.equal(app.player.balances.COIN, 1234, 'late refresh cannot overwrite new player');
    let consentAuthorization = '';
    app.api = new ApiClient({ request: async (_path, _method, _body, headers) => { consentAuthorization = headers?.authorization ?? ''; return { ok: true }; } });
    app.api.token = 'authenticated-token';
    platform.storageSet('app.privacy.consent.pending', { agree: true, contract: '测试指引' });
    await (app as any).syncPrivacyConsent();
    assert.equal(consentAuthorization, 'Bearer authenticated-token', 'deferred consent uses authenticated token');
    assert.equal(platform.storageGet('app.privacy.consent.pending'), null, 'successful consent sync clears pending record');
    app.modal = null;
    for (const logicalHeight of [480, 568, 667, 812]) {
      app.ui.h = logicalHeight;
      platform.pumpFrames();
      const coreHits = app.ui.hits.filter((hit) => hit.id.startsWith('core-'));
      assert.equal(coreHits.length, 6, `all core entries fit height ${logicalHeight}`);
      assert.ok(coreHits.every((hit) => hit.y + hit.h < logicalHeight - 54));
    }
    app.router.dispose();

    scheduled.clear();
    let globalRafCalls = 0;
    let wxRafCalls = 0;
    let queuedFrame!: () => void;
    runtime.wx = { requestAnimationFrame: () => { wxRafCalls++; } };
    runtime.requestAnimationFrame = (callback: () => void) => { globalRafCalls++; if (globalRafCalls > 1) throw new Error('frame source unavailable'); queuedFrame = callback; };
    let frames = 0;
    new WxPlatform().onFrame(() => { frames++; });
    assert.equal(globalRafCalls, 1);
    assert.equal(wxRafCalls, 0);
    queuedFrame();
    assert.equal(frames, 1);
    const fallback = [...scheduled.values()].find((timer) => timer.delay === 16);
    assert.ok(fallback, 'later RAF failure switches to timer');
    fallback!.callback();
    assert.equal(globalRafCalls, 2, 'failed RAF is not retried every frame');
    assert.equal(frames, 2);
    runtime.wx = {
      getWindowInfo: () => ({ windowWidth: 390, windowHeight: 844, pixelRatio: 3, safeArea: { top: 47, bottom: 810 } }),
      getMenuButtonBoundingClientRect: () => ({ top: 44, bottom: 76 }),
    };
    const safeWindow = new WxPlatform().getWindowSize();
    assert.equal(safeWindow.topInset, 84);
    assert.equal(safeWindow.bottomInset, 34);
    runtime.wx.getMenuButtonBoundingClientRect = () => ({ top: 0, bottom: 0 });
    assert.equal(new WxPlatform().getWindowSize().topInset, 87, 'zero menu geometry reserves the capsule below the safe top');
    delete runtime.wx.getMenuButtonBoundingClientRect;
    assert.equal(new WxPlatform().getWindowSize().topInset, 87, 'missing menu API reserves the capsule below the safe top');
    runtime.wx.getWindowInfo = () => ({ windowWidth: 375, windowHeight: 667, pixelRatio: 2, statusBarHeight: 20 });
    assert.equal(new WxPlatform().getWindowSize().topInset, 60, 'legacy status bar supplies the capsule baseline');
  } finally {
    globalThis.setTimeout = originalTimeout;
    globalThis.clearTimeout = originalClear;
    runtime.wx = originalWx;
    runtime.requestAnimationFrame = originalRaf;
    console.warn = originalWarn;
  }
  console.log('client-runtime ok: native scale contract, feature reachability, consent timeout/retry, global RAF fallback');
}

if (require.main === module) run().then(() => process.exit(0)).catch((error) => { console.error(error); process.exit(1); });
