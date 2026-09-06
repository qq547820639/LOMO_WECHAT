/**
 * LOMO 客户端主壳 —— 引擎循环 / 登录 / HUD / 五大 Tab / 弹窗 Toast / 遥测。
 * 立即模式渲染：每帧 current screen.render()；HUD/Tab 由壳绘制。
 */
import { PlatformAdapter } from '../platform/platform';
import { ApiClient, InProcessTransport, HttpTransport } from '../net/api';
import { UI } from '../ui/widgets';
import { Router, Screen } from '../core/router';
import { THEME, fmtNum } from '../core/theme';
import { AudioManager } from '../audio/audio';
import { BRAND } from '../../../shared/src/brand';
import { AssetManager } from '../core/assets';
import { configureCanvas } from '../ui/canvas';
import { RELEASE_LAUNCH_NAVIGATION } from '../../../shared/src/registry';

const FULL_TABS: Array<{ id: string; label: string; color: string }> = [
  { id: 'chaowan', label: '藏品', color: THEME.accent },
  { id: 'ape', label: '猿岛', color: THEME.purple },
  { id: 'games', label: '游戏', color: THEME.accent2 },
  { id: 'trade', label: '交易', color: THEME.gold },
  { id: 'mine', label: '我的', color: THEME.green },
];

const RELEASE_TAB_COLORS: Record<string, string> = {
  home: THEME.accent,
  games: THEME.accent2,
  chaowan: THEME.purple,
  mine: THEME.green,
};

export function tabsForProfile(profile: 'full-clone' | 'wechat-release'): Array<{ id: string; label: string; color: string }> {
  if (profile === 'full-clone') return FULL_TABS;
  return RELEASE_LAUNCH_NAVIGATION.tabs.map((tab) => ({ id: tab.targetTab, label: tab.label, color: RELEASE_TAB_COLORS[tab.targetTab] ?? THEME.accent }));
}

export class MiniGameClientApp {
  platform: PlatformAdapter;
  api: ApiClient;
  ui!: UI;
  router!: Router;
  audioManager: AudioManager;
  profile: 'full-clone' | 'wechat-release';
  canvas: any;
  player: any = null;
  antiAddiction: any = null;
  toast: { text: string; until: number } | null = null;
  overlay: { clip: any; until: number } | null = null;
  private lastLevel = 0;
  modal: { title: string; lines: string[]; actions: { label: string; onTap: () => void; color?: string }[] } | null = null;
  booted = false;
  private booting = false;
  private bootAttemptId = 0;
  private bootWatchdog: ReturnType<typeof setTimeout> | null = null;
  private privacySyncing = false;
  assets!: import('../core/assets').AssetManager;
  frameDt = 16.7;
  private lastFrameAt = Date.now();
  fps = 0;
  private fpsCount = 0;
  private fpsAt = Date.now();
  private lastTouchStart: [number, number] | null = null;
  private telemetryBuf: any[] = [];
  private dragTrack: { id: string; startY: number } | null = null;
  skipGate = false;
  /** 致命错误：每帧重绘错误画面（小游戏无 DOM，必须自绘才可见） */
  fatal: string | null = null;

  /**
   * 画致命错误画面 —— **必须画在启动时创建的主 canvas 上**。
   * 小游戏中再次调用 wx.createCanvas() 得到的是**离屏画布**，画上去用户永远看不到
   * （这正是此前启动失败表现为「黑屏」的原因）。
   */
  renderFatal(msg: string): void {
    this.fatal = msg;
    try {
      if (this.ui) {
        const u = this.ui;
        u.ctx.fillStyle = '#0f1220';
        u.ctx.fillRect(0, 0, u.w, u.h);
        u.ctx.fillStyle = '#f87171';
        u.text('启动失败', 20, 110, { size: 16, bold: true });
        u.ctx.fillStyle = '#e5e7eb';
        const lines = String(msg).match(/.{1,26}/g) || [String(msg)];
        lines.slice(0, 6).forEach((l, i) => u.text(l, 20, 150 + i * 20, { size: 11 }));
        u.ctx.fillStyle = '#9ca3af';
        u.text('请退出后重新进入；若持续出现请反馈此信息', 20, 160 + lines.slice(0, 6).length * 20, { size: 10 });
        return;
      }
      // 兜底：UI 尚未建立时直接用裸 ctx 画（离屏画布不可见，但至少不抛错）
      const ctx = this.canvas?.getContext?.('2d');
      if (!ctx) return;
      ctx.fillStyle = '#0f1220';
      ctx.fillRect(0, 0, this.canvas.width || 375, this.canvas.height || 667);
      ctx.fillStyle = '#f87171';
      ctx.font = '16px sans-serif';
      ctx.fillText('启动失败', 20, 110);
      ctx.fillStyle = '#e5e7eb';
      ctx.font = '12px sans-serif';
      String(msg).match(/.{1,26}/g)?.slice(0, 6).forEach((l, i) => ctx.fillText(l, 20, 150 + i * 20));
    } catch { /* 绘制失败也不再抛出 */ }
  }

  /** 启动看门狗：卡住超过 20s 直接把状态画出来 —— 杜绝「黑屏无信息」 */
  private startBootWatchdog(): void {
    this.stopBootWatchdog();
    this.bootWatchdog = setTimeout(() => {
      this.bootWatchdog = null;
      if (!this.booting || this.booted) return;
      this.bootAttemptId++;
      this.api.invalidateSession();
      this.booting = false;
      this.recoverBoot('连接超时，请检查网络后重试');
    }, 20000);
  }

  private stopBootWatchdog(): void {
    if (this.bootWatchdog) clearTimeout(this.bootWatchdog);
    this.bootWatchdog = null;
  }

  private recoverBoot(message: string): void {
    this.booted = false;
    this.fatal = null;
    const gate = this.router.stack.find((screen) => screen.route === '/compliance-gate') as any;
    if (gate) gate.resetForRetry();
    else this.router.push(new (require('../features/compliance_gate').ComplianceGateScreen)(() => { void this.completeBoot(); }));
    const notice = /超时|timeout/i.test(message) ? '连接超时，请稍后重试。' : '暂时无法连接游戏服务，请稍后重试。';
    this.showModal('暂时无法进入游戏', [notice, '请检查网络连接。'], [
      { label: '重试', onTap: () => { void this.completeBoot(); }, color: THEME.accent2 },
      { label: '稍后再试', onTap: () => {} },
    ]);
  }

  constructor(platform: PlatformAdapter, opts: { profile: 'full-clone' | 'wechat-release'; serverUrl?: string; cloudService?: string; cloudFn?: string; standalone?: boolean; skipComplianceGate?: boolean }) {
    this.skipGate = !!opts.skipComplianceGate;
    this.platform = platform;
    this.profile = opts.profile;
    const standalone = opts.standalone ?? platform.kind === 'node';
    if (!opts.serverUrl && !opts.cloudFn && platform.kind === 'wx' && !standalone) {
      throw new Error('APP_SERVER_URL or APP_CLOUD_FN is required for WeChat runtime; standalone is Node/test only');
    }
    // 传输层优先级：云函数形态（微信侧环境）> HTTP 服务 > 进程内（仅测试）
    const transport = opts.cloudFn
      ? new (require('../net/api').CloudFunctionTransport)(platform, opts.cloudFn)
      : opts.serverUrl
        ? new HttpTransport(platform, opts.serverUrl, { cloudService: opts.cloudService })
        : new InProcessTransport(opts.profile);
    this.api = new ApiClient(transport);
    this.audioManager = new AudioManager(platform);
  }

  async boot(): Promise<void> {
    const size = this.platform.getWindowSize();
    this.canvas = this.platform.createCanvas();
    const layout = configureCanvas(this.canvas, size);
    this.ui = new UI(layout.ctx, layout.w, layout.h);
    // 渲染循环尽早注册：后续任何启动步骤抛错，错误画面都能被画出来（而不是黑屏）
    this.platform.onFrame(() => this.frame());
    this.router = new Router(this);
    registerAllScreens(this);
    this.router.switchTab(this.profile === 'wechat-release' ? RELEASE_LAUNCH_NAVIGATION.defaultTab : 'games');

    const inputScale = layout.inputScale;

    this.platform.onTouchStart((x, y) => {
      const logicalY = (y - layout.inputOffsetY) / inputScale;
      if (logicalY < 0 || logicalY > this.ui.h) { this.lastTouchStart = null; return; }
      this.lastTouchStart = [x / inputScale, logicalY];
      const currentRoute = this.router.current?.route ?? '';
      this.dragTrack = currentRoute.startsWith('/') && !this.router.stack.length
        ? { id: 'hub-' + currentRoute.slice(1), startY: logicalY }
        : null;
    });
    this.platform.onTouchMove((x, y) => {
      if (this.lastTouchStart && this.dragTrack) {
        const logicalY = (y - layout.inputOffsetY) / inputScale;
        this.ui.handleDrag(this.dragTrack.id, this.dragTrack.startY, logicalY);
        this.dragTrack.startY = logicalY;
      }
    });
    this.platform.onTouchEnd((x, y) => {
      const lx = x / inputScale, ly = (y - layout.inputOffsetY) / inputScale;
      const start = this.lastTouchStart;
      this.lastTouchStart = null;
      this.dragTrack = null;
      if (!start || ly < 0 || ly > this.ui.h) return;
      if (start && Math.abs(start[1] - ly) > 24) return; // 视为滚动
      this.audioManager.playSfx('click');
      this.ui.onTap(lx, ly);
    });
    this.platform.onHide(() => { this.audioManager.onAppHide(); this.telemetry('app_hide'); });
    // onShow 必须自愈：服务端重启/缩容会丢内存态，旧 token 请求必然失败，
    // 未捕获的 rejection 会让渲染循环静默停止（表现为「退出再进黑屏」）
    this.platform.onShow(() => {
      try { this.audioManager.onAppShow(); } catch { /* 音频不可用时忽略 */ }
      if (!this.booted) return;
      this.refreshPlayer().then(() => this.syncPrivacyConsent()).catch((e) => {
        console.error('[ape] onShow refreshPlayer failed', e);
        this.showToast('数据刷新失败，正在重新登录…');
        this.booted = false;
        void this.completeBoot();
      });
    });

    // 游戏资源 manifest（P0-1）：包内 assets/game/manifest.json；失败静默走占位
    this.assets = new (require('../core/assets').AssetManager)(this.platform);
    this.assets.loadManifest().then((m: unknown) => { if (m) this.telemetry('asset_manifest', { version: (m as any).version }); }).catch(() => {});

    // 启动流程：合规门（健康游戏忠告+隐私授权）→ completeBoot
    // 注意：渲染循环已在此前注册，本段任何抛错都会经由 app.renderFatal 显示在主画布上
    const { ComplianceGateScreen } = require('../features/compliance_gate');
    const gate = new ComplianceGateScreen(() => { void this.completeBoot(); });
    if (this.skipGate) {
      void this.completeBoot();
    } else {
      this.router.push(gate);
    }
  }

  /** 合规门通过后的正式启动：登录 → bootstrap → 首页 */
  private async completeBoot(): Promise<void> {
    if (this.booted || this.booting) return;
    this.booting = true;
    this.fatal = null;
    const attemptId = ++this.bootAttemptId;
    const sessionGeneration = this.api.beginSession();
    this.startBootWatchdog();
    try {
    await this.api.connect(this.profile, sessionGeneration);
    if (attemptId !== this.bootAttemptId) return;
    const launchQuery = this.platform.getLaunchQuery();
    const code = await this.platform.loginCode();
    if (attemptId !== this.bootAttemptId) return;
    if (!code) throw new Error('微信登录失败，请重试');
    const auth = await this.api.login(code, sessionGeneration);
    if (attemptId !== this.bootAttemptId) return;
    this.antiAddiction = auth.antiAddiction;
    await this.refreshPlayer(attemptId);
    if (attemptId !== this.bootAttemptId) return;
    this.booted = true;
    this.stopBootWatchdog();
    void this.syncPrivacyConsent();
    this.telemetry('launch', { profile: this.profile, isNew: auth.isNew });
    // 清掉合规门，回主城
    while (this.router.stack.length) this.router.pop(true);
    const { SCREEN_ROUTES } = require('../features/registry');
    if (this.profile === 'wechat-release') this.router.switchTab(RELEASE_LAUNCH_NAVIGATION.defaultTab);
    else if (SCREEN_ROUTES['home']) this.router.push(SCREEN_ROUTES['home']());
    this.audioManager.playBgm('home');
    // 邀请进游（Section 37：share query → server token）
    if (launchQuery.invite) {
      const r = await this.api.post('/v1/social/invite/accept', { token: launchQuery.invite });
      if (r.ok) this.showToast('邀请奖励到账：金币 +30');
    }
    } catch (e) {
      if (attemptId !== this.bootAttemptId) return;
      // 启动完成段失败：回退到合规门重试路径（不静默吞掉状态）
      const err: any = e;
      const msg = String(err?.message || e);
      console.error('[ape] completeBoot failed', err);
      this.recoverBoot(msg);
    } finally {
      if (attemptId === this.bootAttemptId) {
        this.booting = false;
        this.stopBootWatchdog();
      }
    }
  }

  private async syncPrivacyConsent(): Promise<void> {
    if (!this.booted || !this.api.token || this.privacySyncing) return;
    const consent = this.platform.storageGet('app.privacy.consent.pending');
    if (!consent?.agree) return;
    const attemptId = this.bootAttemptId;
    this.privacySyncing = true;
    try {
      const result = await this.api.post('/v1/compliance/privacy-consent', consent);
      if (result.ok && attemptId === this.bootAttemptId) this.platform.storageSet('app.privacy.consent.pending', null);
    } finally { this.privacySyncing = false; }
  }

  async refreshPlayer(attemptId = this.bootAttemptId): Promise<void> {
    const res = await this.api.get('/v1/player/state');
    if (attemptId !== this.bootAttemptId) return;
    if (!res.ok || !res.player) throw new Error(res.message || '玩家数据加载失败');
    if (res.ok) {
      if (this.lastLevel && res.player.level > this.lastLevel) {
        this.audioManager.playSfx('levelup');
        this.showToast(`升级到 Lv.${res.player.level}！`);
      }
      this.lastLevel = res.player.level;
      this.player = res.player;
    }
  }

  showToast(text: string): void { this.toast = { text, until: Date.now() + 2600 }; }

  showModal(title: string, lines: string[], actions: { label: string; onTap: () => void; color?: string }[] = []): void {
    this.modal = { title, lines, actions };
    // modal 按钮注册在 frame 渲染时进行；onTap 后关闭
    this.pendingModalActions = actions;
  }
  private pendingModalActions: { label: string; onTap: () => void }[] = [];

  /** 全屏动画 overlay（大演出槽位通用接线口）：一次性播放后自动关闭 */
  playOverlay(slotId: string, ms = 1600): void {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { FrameClip } = require('../ui/frame_clip');
      const clip = new FrameClip(this.assets, slotId, 'launch', { loop: false, fitHeight: Math.min(260, this.ui.h * 0.42) });
      clip.play();
      this.audioManager.playSfx('open');
      this.overlay = { clip, until: Date.now() + ms };
      this.telemetry('anim_overlay', { slot: slotId });
    } catch { /* 资产缺失静默跳过 */ }
  }

  telemetry(name: string, props?: Record<string, unknown>): void {
    this.telemetryBuf.push({ name, at: Date.now(), props });
    if (this.telemetryBuf.length >= 10) this.flushTelemetry();
  }

  private flushTelemetry(): void {
    const events = this.telemetryBuf.splice(0, this.telemetryBuf.length);
    this.api.post('/v1/telemetry/events', { events }).catch(() => {});
  }

  /** 处理带奖励的玩法响应：toast + 刷新 */
  handleGameResponse(r: any): boolean {
    if (r.ok === false) { this.showToast(r.message || '操作失败'); this.audioManager.playSfx('fail'); return false; }
    if (r.message) this.showToast(r.message);
    const hasReward = (r.rewards?.length ?? 0) > 0;
    if (hasReward && (r.rewards ?? []).some((x: any) => x.assetId === 'COIN')) this.audioManager.playSfx('coin');
    if (hasReward) this.audioManager.playSfx('reward');
    if (r.fx?.includes('win')) { this.platform.vibrate(true); this.audioManager.playSfx('win'); }
    if (r.fx?.includes('lose')) { this.platform.vibrate(false); this.audioManager.playSfx('lose'); }
    if (r.fx?.includes('levelup')) this.audioManager.playSfx('levelup');
    void this.refreshPlayer().catch(() => this.showToast('奖励已结算，余额刷新失败，请稍后重试'));
    return true;
  }

  private frame(): void {
    const nowMs = Date.now();
    this.frameDt = Math.max(4, Math.min(100, nowMs - this.lastFrameAt));
    this.lastFrameAt = nowMs;
    this.fpsCount++;
    const now = Date.now();
    if (now - this.fpsAt >= 1000) { this.fps = this.fpsCount; this.fpsCount = 0; this.fpsAt = now; }
    this.ui.beginFrame();
    const ctx = this.ui.ctx;
    ctx.fillStyle = THEME.bg;
    ctx.fillRect(0, 0, this.ui.w, this.ui.h);
    // 致命错误常驻：每帧重绘，确保用户一定看得到（而不是黑屏）
    if (this.fatal) { this.renderFatal(this.fatal); return; }
    if (!this.booted && !this.router.stack.length) {
      this.ui.textCenter(BRAND.loadingText, this.ui.w / 2, this.ui.h / 2, { size: 15, color: THEME.textDim });
      return;
    }
    const screen = this.router.current;
    const gateVisible = screen.route === '/compliance-gate';
    // 屏幕内容区（HUD 之下、Tab 之上）
    const top = 64;
    const bottom = this.ui.h - (gateVisible ? 0 : 54);
    ctx.fillStyle = THEME.bg;
    ctx.fillRect(0, top, this.ui.w, bottom - top);
    this.ui.hits.length = 0;
    this.syncBgm();
    // 屏幕渲染（内部自行避开 top/bottom）
    try { screen.render(); } catch (e: any) {
      this.ui.textCenter('页面异常: ' + String(e?.message || e).slice(0, 30), this.ui.w / 2, this.ui.h / 2, { size: 12, color: THEME.red });
    }
    this.ui.hits = this.ui.hits.filter((hit) => hit.y >= top && hit.y + hit.h <= bottom);
    if (!gateVisible) {
      this.renderHud();
      this.renderTabBar(bottom);
    }
    if (this.router.stack.length && !gateVisible) {
      this.ui.button({ x: 10, y: 8, w: 52, h: 26 }, '← 返回', () => this.router.pop(), { size: 12 });
    }
    // 屏幕标题
    if (!gateVisible) this.ui.textCenter(screen.title.length > 13 ? screen.title.slice(0, 12) + '…' : screen.title, this.ui.w / 2, 26, { size: 15, bold: true, color: THEME.text });
    // modal / toast 层
    if (this.modal) {
      const actions = this.modal.actions.length ? this.modal.actions : [{ label: '知道了', onTap: () => { this.modal = null; } }];
      this.ui.modal(this.modal.title, this.modal.lines, () => { this.modal = null; }, actions.map((a) => ({ ...a, onTap: () => { this.modal = null; a.onTap(); } })));
    }
    if (this.overlay) {
      const c2 = this.ui.ctx;
      c2.fillStyle = 'rgba(6,8,16,0.72)';
      c2.fillRect(0, top, this.ui.w, bottom - top);
      this.overlay.clip.draw(this.ui, this.ui.w / 2, (top + bottom) / 2, this.frameDt);
      if (now >= this.overlay.until || (this.overlay.clip.state && this.overlay.clip.state.finished)) this.overlay = null;
    }
    if (this.toast && now < this.toast.until) {
      const lines = wrapText(this.toast.text, 32);
      const th = 20 + lines.length * 16;
      const r = { x: 16, y: bottom - th - 8, w: this.ui.w - 32, h: th };
      ctx.fillStyle = 'rgba(20,24,40,0.94)';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = THEME.line;
      ctx.strokeRect(r.x, r.y, r.w, r.h);
      lines.forEach((l, i) => this.ui.text(l, r.x + 8, r.y + 18 + i * 16, { size: 12 }));
    } else if (this.toast) this.toast = null;
    if (screen.loading) this.ui.textCenter('加载中…', this.ui.w / 2, top + 24, { size: 11, color: THEME.textDim });
  }

  private bgmForRoute(): string {
    const r = this.router.current?.route ?? '/home';
    return /battleRoyal|arena|boss|monkeyFight|dagger|robbery|nxArena|apeRabbit|beast/.test(r) ? 'battle' : 'home';
  }
  private lastBgm = 'home';
  private syncBgm(): void {
    const want = this.router.stack.length ? this.bgmForRoute() : 'home';
    if (this.lastBgm !== want) { this.lastBgm = want; this.audioManager.playBgm(want); }
  }

  private renderHud(): void {
    const ui = this.ui;
    const ctx = ui.ctx;
    ctx.fillStyle = THEME.bg2;
    ctx.fillRect(0, 0, ui.w, 64);
    ctx.strokeStyle = THEME.line;
    ctx.strokeRect(0, 0, ui.w, 64);
    const p = this.player;
    if (!p) return;
    const limited = this.antiAddiction && !this.antiAddiction.playableNow;
    ui.text(limited ? '休息中' : `Lv.${p.level}`, ui.w - 55, 23, { size: 12, bold: true, color: limited ? THEME.red : THEME.gold });
    ui.progress(ui.w - 55, 29, 42, 3, p.xp / Math.max(1, p.xpToNext), THEME.purple);
    const b = p.balances || {};
    const chips: string[] = [`金币 ${fmtNum(b.COIN)}`, `体力 ${fmtNum(b.ENERGY)}`, `宝石 ${fmtNum(b.GEMSTONE)}`, `奖券 ${fmtNum(b.TICKET)}`];
    if (this.profile === 'full-clone' && b.TEST_CREDIT != null) chips.push(`沙盒币 ${fmtNum(b.TEST_CREDIT)}`);
    let x = 12;
    for (const chip of chips) {
      const w = ui.measure(chip, 11) + 12;
      if (x + w > ui.w) break;
      ctx.fillStyle = THEME.panel;
      ctx.fillRect(x, 39, w, 18);
      ui.text(chip, x + 6, 52, { size: 11, color: THEME.textDim });
      x += w + 6;
    }
  }

  private renderTabBar(top: number): void {
    const ui = this.ui;
    const ctx = ui.ctx;
    ctx.fillStyle = THEME.bg2;
    ctx.fillRect(0, top, ui.w, ui.h - top);
    ctx.strokeStyle = THEME.line;
    ctx.strokeRect(0, top, ui.w, ui.h - top);
    const tabs = tabsForProfile(this.profile);
    const tw = ui.w / tabs.length;
    tabs.forEach((t, i) => {
      const active = this.router.currentTab === t.id && !this.router.stack.length;
      const x = i * tw;
      ui.textCenter(t.label, x + tw / 2, top + 32, { size: 14, bold: active, color: active ? t.color : THEME.textDim });
      if (active) { ctx.fillStyle = t.color; ctx.fillRect(x + tw / 2 - 12, top + 38, 24, 3); }
      ui.hits.push({ x, y: top, w: tw, h: ui.h - top, onTap: () => { this.telemetry('feature_enter', { tab: t.id }); this.router.switchTab(t.id); }, id: 'tab-' + t.id });
    });
  }
}

export function wrapText(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  for (let i = 0; i < text.length; i += maxChars) lines.push(text.slice(i, i + maxChars));
  return lines.length ? lines : [''];
}

/** 全部屏幕注册（由 features/registry.ts 提供，避免循环依赖） */
import { registerAllScreens } from '../features/registry';
