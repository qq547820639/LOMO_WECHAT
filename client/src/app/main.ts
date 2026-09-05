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

const TABS: Array<{ id: string; label: string; color: string }> = [
  { id: 'chaowan', label: '藏品', color: THEME.accent },
  { id: 'ape', label: '猿岛', color: THEME.purple },
  { id: 'games', label: '游戏', color: THEME.accent2 },
  { id: 'trade', label: '交易', color: THEME.gold },
  { id: 'mine', label: '我的', color: THEME.green },
];

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
  ambience: any = null;
  private lastLevel = 0;
  modal: { title: string; lines: string[]; actions: { label: string; onTap: () => void; color?: string }[] } | null = null;
  booted = false;
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

  constructor(platform: PlatformAdapter, opts: { profile: 'full-clone' | 'wechat-release'; serverUrl?: string; skipComplianceGate?: boolean }) {
    this.skipGate = !!opts.skipComplianceGate;
    this.platform = platform;
    this.profile = opts.profile;
    const transport = opts.serverUrl ? new HttpTransport(platform, opts.serverUrl) : new InProcessTransport(opts.profile);
    this.api = new ApiClient(transport);
    this.audioManager = new AudioManager(platform);
  }

  async boot(): Promise<void> {
    const size = this.platform.getWindowSize();
    this.canvas = this.platform.createCanvas();
    const scale = size.w / 375;
    this.canvas.width = 375 * scale * (size.dpr > 2 ? 2 : size.dpr);
    this.canvas.height = size.h / size.w * this.canvas.width;
    const ctx = this.canvas.getContext('2d');
    const dscale = this.canvas.width / 375;
    // 统一逻辑坐标缩放
    const scaledCtx = new Proxy(ctx, {
      get(target: any, prop: string) {
        if (prop === 'fillRect' || prop === 'strokeRect' || prop === 'clearRect') {
          return (x: number, y: number, w: number, h: number) => target[prop].call(target, x * dscale, y * dscale, w * dscale, h * dscale);
        }
        if (prop === 'fillText') {
          return (t: string, x: number, y: number) => target.fillText.call(target, t, x * dscale, y * dscale);
        }
        if (prop === 'drawImage') {
          // 目标坐标缩放；源矩形（前 4 参）保持图像像素原值
          return (img: any, ...rest: any[]) => {
            if (rest.length === 8) {
              const [sx, sy, sw, sh, dx, dy, dw, dh] = rest;
              return target.drawImage.call(target, img, sx, sy, sw, sh, dx * dscale, dy * dscale, dw * dscale, dh * dscale);
            }
            if (rest.length === 4) {
              const [dx, dy, dw, dh] = rest;
              return target.drawImage.call(target, img, dx * dscale, dy * dscale, dw * dscale, dh * dscale);
            }
            if (rest.length === 2) {
              const [dx, dy] = rest;
              return target.drawImage.call(target, img, dx * dscale, dy * dscale);
            }
            return target.drawImage.call(target, img, ...rest);
          };
        }
        if (prop === 'measureText') return (t: string) => target.measureText.call(target, t);
        const v = target[prop];
        return typeof v === 'function' ? v.bind(target) : v;
      },
      set(target: any, prop: string, value: any) { target[prop] = value; return true; },
    }) as any;
    const logicalH = Math.floor(this.canvas.height / dscale);
    this.ui = new UI(scaledCtx as any, 375, logicalH);
    this.router = new Router(this);
    registerAllScreens(this);
    this.router.switchTab('games');

    this.platform.onTouchStart((x, y) => { this.lastTouchStart = [x / dscale, y / dscale]; });
    this.platform.onTouchMove((x, y) => {
      if (this.lastTouchStart && this.dragTrack) this.ui.handleDrag(this.dragTrack.id, this.dragTrack.startY, y / dscale);
    });
    this.platform.onTouchEnd((x, y) => {
      const lx = x / dscale, ly = y / dscale;
      const start = this.lastTouchStart;
      this.lastTouchStart = null;
      this.dragTrack = null;
      if (start && Math.abs(start[1] - ly) > 24) return; // 视为滚动
      this.audioManager.playSfx('click');
      this.ui.onTap(lx, ly);
    });
    this.platform.onHide(() => { this.audioManager.onAppHide(); this.telemetry('app_hide'); });
    this.platform.onShow(() => { this.audioManager.onAppShow(); this.refreshPlayer(); });

    // 游戏资源 manifest（P0-1）：包内 assets/game/manifest.json；失败静默走占位
    this.assets = new (require('../core/assets').AssetManager)(this.platform);
    this.assets.loadManifest().then((m: unknown) => { if (m) this.telemetry('asset_manifest', { version: (m as any).version }); }).catch(() => {});

    this.platform.onFrame(() => this.frame());

    // 启动流程：合规门（健康游戏忠告+隐私授权）→ completeBoot
    const { ComplianceGateScreen } = require('../features/compliance_gate');
    const gate = new ComplianceGateScreen(() => { void this.completeBoot(); });
    if (this.skipGate) {
      void this.completeBoot();
    } else {
      this.router.push(gate);
      gate.onEnter();
    }
  }

  /** 合规门通过后的正式启动：登录 → bootstrap → 首页 */
  private async completeBoot(): Promise<void> {
    if (this.booted) return;
    try {
    await this.api.connect(this.profile);
    const launchQuery = this.platform.getLaunchQuery();
    const code = await this.platform.loginCode();
    const auth = await this.api.login(code || 'offline-code');
    this.antiAddiction = auth.antiAddiction;
    await this.refreshPlayer();
    this.booted = true;
    this.telemetry('launch', { profile: this.profile, isNew: auth.isNew });
    // 清掉合规门，回主城
    while (this.router.stack.length) this.router.pop(true);
    const { SCREEN_ROUTES } = require('../features/registry');
    if (SCREEN_ROUTES['home']) this.router.push(SCREEN_ROUTES['home']());
    this.audioManager.playBgm('home');
    // 邀请进游（Section 37：share query → server token）
    if (launchQuery.invite) {
      const r = await this.api.post('/v1/social/invite/accept', { token: launchQuery.invite });
      if (r.ok) this.showToast('邀请奖励到账：金币 +30');
    }
    } catch (e) {
      // 启动完成段失败：回退到合规门重试路径（不静默吞掉状态）
      const err: any = e;
      this.showToast('启动失败: ' + String(err?.message || e).slice(0, 20));
      this.booted = false;
    }
  }

  async refreshPlayer(): Promise<void> {
    const res = await this.api.get('/v1/player/state');
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
    this.refreshPlayer();
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
    if (!this.booted && !this.router.stack.length) {
      this.ui.textCenter(BRAND.loadingText, this.ui.w / 2, this.ui.h / 2, { size: 15, color: THEME.textDim });
      return;
    }
    const screen = this.router.current;
    // 屏幕内容区（HUD 之下、Tab 之上）
    const top = 64;
    const bottom = this.ui.h - 54;
    ctx.fillStyle = THEME.bg;
    ctx.fillRect(0, top, this.ui.w, bottom - top);
    this.ui.hits.length = 0;
    // HUD
    this.renderHud();
    // Tab 栏（先画，屏幕可覆盖注册自己的命中）
    this.renderTabBar(bottom);
    this.syncBgm();
    // 氛围窗：当前玩法家族的自制动画轮播（右下角，Tab 栏上方）
    if (!this.ambience) this.ambience = new (require('../ui/ambience').AmbienceWindow)();
    this.ambience.setFamily(this.router.current?.route ?? '/home');
    this.ambience.draw(this, this.ui, this.ui.w - 78, bottom - 76, 72, this.frameDt);
    // 屏幕渲染（内部自行避开 top/bottom）
    try { screen.render(); } catch (e: any) {
      this.ui.textCenter('页面异常: ' + String(e?.message || e).slice(0, 30), this.ui.w / 2, this.ui.h / 2, { size: 12, color: THEME.red });
    }
    // 屏幕返回按钮（非 tab 根）
    if (this.router.stack.length) {
      this.ui.button({ x: 10, y: 8, w: 52, h: 26 }, '← 返回', () => this.router.pop(), { size: 12 });
    }
    // 屏幕标题
    this.ui.textCenter(screen.title, this.ui.w / 2, 26, { size: 15, bold: true, color: THEME.text });
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
    ui.text(`Lv.${p.level}`, 10, 22, { size: 13, bold: true, color: THEME.gold });
    ui.progress(8, 28, 60, 4, p.xp / Math.max(1, p.xpToNext), THEME.purple);
    const b = p.balances || {};
    const chips: string[] = [`金币 ${fmtNum(b.COIN)}`, `体力 ${fmtNum(b.ENERGY)}`, `宝石 ${fmtNum(b.GEMSTONE)}`, `奖券 ${fmtNum(b.TICKET)}`];
    if (this.profile === 'full-clone' && b.TEST_CREDIT != null) chips.push(`沙盒币 ${fmtNum(b.TEST_CREDIT)}`);
    let x = 78;
    for (const chip of chips) {
      const w = ui.measure(chip, 11) + 12;
      if (x + w > ui.w) break;
      ctx.fillStyle = THEME.panel;
      ctx.fillRect(x, 8, w, 18);
      ui.text(chip, x + 6, 21, { size: 11, color: THEME.textDim });
      x += w + 6;
    }
    ui.text(`${BRAND.appName} · ${this.profile === 'full-clone' ? '研究沙盒' : '正式版'} · ${p.nick} · FPS ${this.fps}`, 78, 42, { size: 10, color: THEME.textDim });
    if (this.antiAddiction && !this.antiAddiction.playableNow) {
      ui.text('⏸ 防沉迷限制中', ui.w - 90, 42, { size: 10, color: THEME.red });
    }
  }

  private renderTabBar(top: number): void {
    const ui = this.ui;
    const ctx = ui.ctx;
    ctx.fillStyle = THEME.bg2;
    ctx.fillRect(0, top, ui.w, ui.h - top);
    ctx.strokeStyle = THEME.line;
    ctx.strokeRect(0, top, ui.w, ui.h - top);
    const tw = ui.w / TABS.length;
    TABS.forEach((t, i) => {
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
