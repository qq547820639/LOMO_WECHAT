"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiniGameClientApp = void 0;
exports.wrapText = wrapText;
const api_1 = require("../net/api");
const widgets_1 = require("../ui/widgets");
const router_1 = require("../core/router");
const theme_1 = require("../core/theme");
const audio_1 = require("../audio/audio");
const brand_1 = require("../../../shared/src/brand");
const TABS = [
    { id: 'chaowan', label: '藏品', color: theme_1.THEME.accent },
    { id: 'ape', label: '猿岛', color: theme_1.THEME.purple },
    { id: 'games', label: '游戏', color: theme_1.THEME.accent2 },
    { id: 'trade', label: '交易', color: theme_1.THEME.gold },
    { id: 'mine', label: '我的', color: theme_1.THEME.green },
];
class MiniGameClientApp {
    constructor(platform, opts) {
        var _a;
        this.player = null;
        this.antiAddiction = null;
        this.toast = null;
        this.overlay = null;
        this.ambience = null;
        this.lastLevel = 0;
        this.modal = null;
        this.booted = false;
        this.frameDt = 16.7;
        this.lastFrameAt = Date.now();
        this.fps = 0;
        this.fpsCount = 0;
        this.fpsAt = Date.now();
        this.lastTouchStart = null;
        this.telemetryBuf = [];
        this.dragTrack = null;
        this.skipGate = false;
        this.pendingModalActions = [];
        this.lastBgm = 'home';
        this.skipGate = !!opts.skipComplianceGate;
        this.platform = platform;
        this.profile = opts.profile;
        const standalone = (_a = opts.standalone) !== null && _a !== void 0 ? _a : platform.kind === 'node';
        if (!opts.serverUrl && platform.kind === 'wx' && !standalone) {
            throw new Error('APP_SERVER_URL is required for WeChat runtime; standalone is Node/test only');
        }
        const transport = opts.serverUrl ? new api_1.HttpTransport(platform, opts.serverUrl) : new api_1.InProcessTransport(opts.profile);
        this.api = new api_1.ApiClient(transport);
        this.audioManager = new audio_1.AudioManager(platform);
    }
    async boot() {
        const size = this.platform.getWindowSize();
        this.canvas = this.platform.createCanvas();
        const scale = size.w / 375;
        this.canvas.width = 375 * scale * (size.dpr > 2 ? 2 : size.dpr);
        this.canvas.height = size.h / size.w * this.canvas.width;
        const ctx = this.canvas.getContext('2d');
        const dscale = this.canvas.width / 375;
        // 统一逻辑坐标缩放
        const scaledCtx = new Proxy(ctx, {
            get(target, prop) {
                if (prop === 'fillRect' || prop === 'strokeRect' || prop === 'clearRect') {
                    return (x, y, w, h) => target[prop].call(target, x * dscale, y * dscale, w * dscale, h * dscale);
                }
                if (prop === 'fillText') {
                    return (t, x, y) => target.fillText.call(target, t, x * dscale, y * dscale);
                }
                if (prop === 'drawImage') {
                    // 目标坐标缩放；源矩形（前 4 参）保持图像像素原值
                    return (img, ...rest) => {
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
                if (prop === 'measureText')
                    return (t) => target.measureText.call(target, t);
                const v = target[prop];
                return typeof v === 'function' ? v.bind(target) : v;
            },
            set(target, prop, value) { target[prop] = value; return true; },
        });
        const logicalH = Math.floor(this.canvas.height / dscale);
        this.ui = new widgets_1.UI(scaledCtx, 375, logicalH);
        this.router = new router_1.Router(this);
        (0, registry_1.registerAllScreens)(this);
        this.router.switchTab('games');
        const inputScale = size.w / 375;
        this.platform.onTouchStart((x, y) => {
            var _a, _b;
            const logicalY = y / inputScale;
            this.lastTouchStart = [x / inputScale, logicalY];
            const currentRoute = (_b = (_a = this.router.current) === null || _a === void 0 ? void 0 : _a.route) !== null && _b !== void 0 ? _b : '';
            this.dragTrack = currentRoute.startsWith('/') && !this.router.stack.length
                ? { id: 'hub-' + currentRoute.slice(1), startY: logicalY }
                : null;
        });
        this.platform.onTouchMove((x, y) => {
            if (this.lastTouchStart && this.dragTrack)
                this.ui.handleDrag(this.dragTrack.id, this.dragTrack.startY, y / inputScale);
        });
        this.platform.onTouchEnd((x, y) => {
            const lx = x / inputScale, ly = y / inputScale;
            const start = this.lastTouchStart;
            this.lastTouchStart = null;
            this.dragTrack = null;
            if (start && Math.abs(start[1] - ly) > 24)
                return; // 视为滚动
            this.audioManager.playSfx('click');
            this.ui.onTap(lx, ly);
        });
        this.platform.onHide(() => { this.audioManager.onAppHide(); this.telemetry('app_hide'); });
        this.platform.onShow(() => { this.audioManager.onAppShow(); this.refreshPlayer(); });
        // 游戏资源 manifest（P0-1）：包内 assets/game/manifest.json；失败静默走占位
        this.assets = new (require('../core/assets').AssetManager)(this.platform);
        this.assets.loadManifest().then((m) => { if (m)
            this.telemetry('asset_manifest', { version: m.version }); }).catch(() => { });
        this.platform.onFrame(() => this.frame());
        // 启动流程：合规门（健康游戏忠告+隐私授权）→ completeBoot
        const { ComplianceGateScreen } = require('../features/compliance_gate');
        const gate = new ComplianceGateScreen(() => { void this.completeBoot(); });
        if (this.skipGate) {
            void this.completeBoot();
        }
        else {
            this.router.push(gate);
            gate.onEnter();
        }
    }
    /** 合规门通过后的正式启动：登录 → bootstrap → 首页 */
    async completeBoot() {
        var _a;
        if (this.booted)
            return;
        try {
            await this.api.connect(this.profile);
            const launchQuery = this.platform.getLaunchQuery();
            const code = await this.platform.loginCode();
            if (!code)
                throw new Error('微信登录失败，请重试');
            const auth = await this.api.login(code);
            this.antiAddiction = auth.antiAddiction;
            await this.refreshPlayer();
            this.booted = true;
            this.telemetry('launch', { profile: this.profile, isNew: auth.isNew });
            // 清掉合规门，回主城
            while (this.router.stack.length)
                this.router.pop(true);
            const { SCREEN_ROUTES } = require('../features/registry');
            if (SCREEN_ROUTES['home'])
                this.router.push(SCREEN_ROUTES['home']());
            this.audioManager.playBgm('home');
            // 邀请进游（Section 37：share query → server token）
            if (launchQuery.invite) {
                const r = await this.api.post('/v1/social/invite/accept', { token: launchQuery.invite });
                if (r.ok)
                    this.showToast('邀请奖励到账：金币 +30');
            }
        }
        catch (e) {
            // 启动完成段失败：回退到合规门重试路径（不静默吞掉状态）
            const err = e;
            this.showToast('启动失败: ' + String((err === null || err === void 0 ? void 0 : err.message) || e).slice(0, 20));
            this.booted = false;
            const gate = this.router.stack.find((screen) => screen.route === '/compliance-gate');
            (_a = gate === null || gate === void 0 ? void 0 : gate.resetForRetry) === null || _a === void 0 ? void 0 : _a.call(gate);
        }
    }
    async refreshPlayer() {
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
    showToast(text) { this.toast = { text, until: Date.now() + 2600 }; }
    showModal(title, lines, actions = []) {
        this.modal = { title, lines, actions };
        // modal 按钮注册在 frame 渲染时进行；onTap 后关闭
        this.pendingModalActions = actions;
    }
    /** 全屏动画 overlay（大演出槽位通用接线口）：一次性播放后自动关闭 */
    playOverlay(slotId, ms = 1600) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { FrameClip } = require('../ui/frame_clip');
            const clip = new FrameClip(this.assets, slotId, 'launch', { loop: false, fitHeight: Math.min(260, this.ui.h * 0.42) });
            clip.play();
            this.audioManager.playSfx('open');
            this.overlay = { clip, until: Date.now() + ms };
            this.telemetry('anim_overlay', { slot: slotId });
        }
        catch { /* 资产缺失静默跳过 */ }
    }
    telemetry(name, props) {
        this.telemetryBuf.push({ name, at: Date.now(), props });
        if (this.telemetryBuf.length >= 10)
            this.flushTelemetry();
    }
    flushTelemetry() {
        const events = this.telemetryBuf.splice(0, this.telemetryBuf.length);
        this.api.post('/v1/telemetry/events', { events }).catch(() => { });
    }
    /** 处理带奖励的玩法响应：toast + 刷新 */
    handleGameResponse(r) {
        var _a, _b, _c, _d, _e, _f;
        if (r.ok === false) {
            this.showToast(r.message || '操作失败');
            this.audioManager.playSfx('fail');
            return false;
        }
        if (r.message)
            this.showToast(r.message);
        const hasReward = ((_b = (_a = r.rewards) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) > 0;
        if (hasReward && ((_c = r.rewards) !== null && _c !== void 0 ? _c : []).some((x) => x.assetId === 'COIN'))
            this.audioManager.playSfx('coin');
        if (hasReward)
            this.audioManager.playSfx('reward');
        if ((_d = r.fx) === null || _d === void 0 ? void 0 : _d.includes('win')) {
            this.platform.vibrate(true);
            this.audioManager.playSfx('win');
        }
        if ((_e = r.fx) === null || _e === void 0 ? void 0 : _e.includes('lose')) {
            this.platform.vibrate(false);
            this.audioManager.playSfx('lose');
        }
        if ((_f = r.fx) === null || _f === void 0 ? void 0 : _f.includes('levelup'))
            this.audioManager.playSfx('levelup');
        this.refreshPlayer();
        return true;
    }
    frame() {
        var _a, _b;
        const nowMs = Date.now();
        this.frameDt = Math.max(4, Math.min(100, nowMs - this.lastFrameAt));
        this.lastFrameAt = nowMs;
        this.fpsCount++;
        const now = Date.now();
        if (now - this.fpsAt >= 1000) {
            this.fps = this.fpsCount;
            this.fpsCount = 0;
            this.fpsAt = now;
        }
        this.ui.beginFrame();
        const ctx = this.ui.ctx;
        ctx.fillStyle = theme_1.THEME.bg;
        ctx.fillRect(0, 0, this.ui.w, this.ui.h);
        if (!this.booted && !this.router.stack.length) {
            this.ui.textCenter(brand_1.BRAND.loadingText, this.ui.w / 2, this.ui.h / 2, { size: 15, color: theme_1.THEME.textDim });
            return;
        }
        const screen = this.router.current;
        // 屏幕内容区（HUD 之下、Tab 之上）
        const top = 64;
        const bottom = this.ui.h - 54;
        ctx.fillStyle = theme_1.THEME.bg;
        ctx.fillRect(0, top, this.ui.w, bottom - top);
        this.ui.hits.length = 0;
        // HUD
        this.renderHud();
        // Tab 栏（先画，屏幕可覆盖注册自己的命中）
        this.renderTabBar(bottom);
        this.syncBgm();
        // 屏幕渲染（内部自行避开 top/bottom）
        try {
            screen.render();
        }
        catch (e) {
            this.ui.textCenter('页面异常: ' + String((e === null || e === void 0 ? void 0 : e.message) || e).slice(0, 30), this.ui.w / 2, this.ui.h / 2, { size: 12, color: theme_1.THEME.red });
        }
        // 屏幕返回按钮（非 tab 根）
        if (this.router.stack.length) {
            this.ui.button({ x: 10, y: 8, w: 52, h: 26 }, '← 返回', () => this.router.pop(), { size: 12 });
        }
        // 屏幕标题
        this.ui.textCenter(screen.title, this.ui.w / 2, 26, { size: 15, bold: true, color: theme_1.THEME.text });
        // modal / toast 层
        if (this.modal) {
            const actions = this.modal.actions.length ? this.modal.actions : [{ label: '知道了', onTap: () => { this.modal = null; } }];
            this.ui.modal(this.modal.title, this.modal.lines, () => { this.modal = null; }, actions.map((a) => ({ ...a, onTap: () => { this.modal = null; a.onTap(); } })));
        }
        // 氛围窗：当前玩法家族的自制动画轮播（屏幕层之上、半透明，不挡命中）
        if (!this.ambience)
            this.ambience = new (require('../ui/ambience').AmbienceWindow)();
        this.ambience.setFamily((_b = (_a = this.router.current) === null || _a === void 0 ? void 0 : _a.route) !== null && _b !== void 0 ? _b : '/home');
        this.ambience.draw(this, this.ui, this.ui.w - 70, bottom - 66, 62, this.frameDt, 0.62);
        if (this.overlay) {
            const c2 = this.ui.ctx;
            c2.fillStyle = 'rgba(6,8,16,0.72)';
            c2.fillRect(0, top, this.ui.w, bottom - top);
            this.overlay.clip.draw(this.ui, this.ui.w / 2, (top + bottom) / 2, this.frameDt);
            if (now >= this.overlay.until || (this.overlay.clip.state && this.overlay.clip.state.finished))
                this.overlay = null;
        }
        if (this.toast && now < this.toast.until) {
            const lines = wrapText(this.toast.text, 32);
            const th = 20 + lines.length * 16;
            const r = { x: 16, y: bottom - th - 8, w: this.ui.w - 32, h: th };
            ctx.fillStyle = 'rgba(20,24,40,0.94)';
            ctx.fillRect(r.x, r.y, r.w, r.h);
            ctx.strokeStyle = theme_1.THEME.line;
            ctx.strokeRect(r.x, r.y, r.w, r.h);
            lines.forEach((l, i) => this.ui.text(l, r.x + 8, r.y + 18 + i * 16, { size: 12 }));
        }
        else if (this.toast)
            this.toast = null;
        if (screen.loading)
            this.ui.textCenter('加载中…', this.ui.w / 2, top + 24, { size: 11, color: theme_1.THEME.textDim });
    }
    bgmForRoute() {
        var _a, _b;
        const r = (_b = (_a = this.router.current) === null || _a === void 0 ? void 0 : _a.route) !== null && _b !== void 0 ? _b : '/home';
        return /battleRoyal|arena|boss|monkeyFight|dagger|robbery|nxArena|apeRabbit|beast/.test(r) ? 'battle' : 'home';
    }
    syncBgm() {
        const want = this.router.stack.length ? this.bgmForRoute() : 'home';
        if (this.lastBgm !== want) {
            this.lastBgm = want;
            this.audioManager.playBgm(want);
        }
    }
    renderHud() {
        const ui = this.ui;
        const ctx = ui.ctx;
        ctx.fillStyle = theme_1.THEME.bg2;
        ctx.fillRect(0, 0, ui.w, 64);
        ctx.strokeStyle = theme_1.THEME.line;
        ctx.strokeRect(0, 0, ui.w, 64);
        const p = this.player;
        if (!p)
            return;
        ui.text(`Lv.${p.level}`, 10, 22, { size: 13, bold: true, color: theme_1.THEME.gold });
        ui.progress(8, 28, 60, 4, p.xp / Math.max(1, p.xpToNext), theme_1.THEME.purple);
        const b = p.balances || {};
        const chips = [`金币 ${(0, theme_1.fmtNum)(b.COIN)}`, `体力 ${(0, theme_1.fmtNum)(b.ENERGY)}`, `宝石 ${(0, theme_1.fmtNum)(b.GEMSTONE)}`, `奖券 ${(0, theme_1.fmtNum)(b.TICKET)}`];
        if (this.profile === 'full-clone' && b.TEST_CREDIT != null)
            chips.push(`沙盒币 ${(0, theme_1.fmtNum)(b.TEST_CREDIT)}`);
        let x = 78;
        for (const chip of chips) {
            const w = ui.measure(chip, 11) + 12;
            if (x + w > ui.w)
                break;
            ctx.fillStyle = theme_1.THEME.panel;
            ctx.fillRect(x, 8, w, 18);
            ui.text(chip, x + 6, 21, { size: 11, color: theme_1.THEME.textDim });
            x += w + 6;
        }
        ui.text(`${brand_1.BRAND.appName} · ${this.profile === 'full-clone' ? '研究沙盒' : '正式版'} · ${p.nick} · FPS ${this.fps}`, 78, 42, { size: 10, color: theme_1.THEME.textDim });
        if (this.antiAddiction && !this.antiAddiction.playableNow) {
            ui.text('⏸ 防沉迷限制中', ui.w - 90, 42, { size: 10, color: theme_1.THEME.red });
        }
    }
    renderTabBar(top) {
        const ui = this.ui;
        const ctx = ui.ctx;
        ctx.fillStyle = theme_1.THEME.bg2;
        ctx.fillRect(0, top, ui.w, ui.h - top);
        ctx.strokeStyle = theme_1.THEME.line;
        ctx.strokeRect(0, top, ui.w, ui.h - top);
        const tw = ui.w / TABS.length;
        TABS.forEach((t, i) => {
            const active = this.router.currentTab === t.id && !this.router.stack.length;
            const x = i * tw;
            ui.textCenter(t.label, x + tw / 2, top + 32, { size: 14, bold: active, color: active ? t.color : theme_1.THEME.textDim });
            if (active) {
                ctx.fillStyle = t.color;
                ctx.fillRect(x + tw / 2 - 12, top + 38, 24, 3);
            }
            ui.hits.push({ x, y: top, w: tw, h: ui.h - top, onTap: () => { this.telemetry('feature_enter', { tab: t.id }); this.router.switchTab(t.id); }, id: 'tab-' + t.id });
        });
    }
}
exports.MiniGameClientApp = MiniGameClientApp;
function wrapText(text, maxChars) {
    const lines = [];
    for (let i = 0; i < text.length; i += maxChars)
        lines.push(text.slice(i, i + maxChars));
    return lines.length ? lines : [''];
}
/** 全部屏幕注册（由 features/registry.ts 提供，避免循环依赖） */
const registry_1 = require("../features/registry");
