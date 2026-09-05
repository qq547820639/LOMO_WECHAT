"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LomoClientApp = void 0;
exports.wrapText = wrapText;
const api_1 = require("../net/api");
const widgets_1 = require("../ui/widgets");
const router_1 = require("../core/router");
const theme_1 = require("../core/theme");
const audio_1 = require("../audio/audio");
const TABS = [
    { id: 'chaowan', label: '潮玩', color: theme_1.THEME.accent },
    { id: 'ape', label: '猿宇宙', color: theme_1.THEME.purple },
    { id: 'games', label: '游戏', color: theme_1.THEME.accent2 },
    { id: 'trade', label: '交易', color: theme_1.THEME.gold },
    { id: 'mine', label: '我的', color: theme_1.THEME.green },
];
class LomoClientApp {
    constructor(platform, opts) {
        this.player = null;
        this.antiAddiction = null;
        this.toast = null;
        this.modal = null;
        this.booted = false;
        this.fps = 0;
        this.fpsCount = 0;
        this.fpsAt = Date.now();
        this.lastTouchStart = null;
        this.telemetryBuf = [];
        this.dragTrack = null;
        this.pendingModalActions = [];
        this.platform = platform;
        this.profile = opts.profile;
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
        const { SCREEN_ROUTES } = require('../features/registry');
        if (SCREEN_ROUTES['home'])
            this.router.push(SCREEN_ROUTES['home']());
        this.platform.onTouchStart((x, y) => { this.lastTouchStart = [x / dscale, y / dscale]; });
        this.platform.onTouchMove((x, y) => {
            if (this.lastTouchStart && this.dragTrack)
                this.ui.handleDrag(this.dragTrack.id, this.dragTrack.startY, y / dscale);
        });
        this.platform.onTouchEnd((x, y) => {
            const lx = x / dscale, ly = y / dscale;
            const start = this.lastTouchStart;
            this.lastTouchStart = null;
            this.dragTrack = null;
            if (start && Math.abs(start[1] - ly) > 24)
                return; // 视为滚动
            if (this.modal) { /* 弹窗层命中由 modal 按钮注册 */ }
            this.ui.onTap(lx, ly);
        });
        this.platform.onHide(() => { this.audioManager.onAppHide(); this.telemetry('app_hide'); });
        this.platform.onShow(() => { this.audioManager.onAppShow(); this.refreshPlayer(); });
        // 启动流程
        await this.api.connect(this.profile);
        const launchQuery = this.platform.getLaunchQuery();
        const code = await this.platform.loginCode();
        const auth = await this.api.login(code || 'offline-code');
        this.antiAddiction = auth.antiAddiction;
        await this.refreshPlayer();
        this.booted = true;
        this.telemetry('launch', { profile: this.profile, isNew: auth.isNew });
        // 邀请进游（Section 37：share query → server token）
        if (launchQuery.invite) {
            const r = await this.api.post('/v1/social/invite/accept', { token: launchQuery.invite });
            if (r.ok)
                this.showToast('邀请奖励到账：金币 +30');
        }
        this.platform.onFrame(() => this.frame());
        this.audioManager.playBgm('home');
    }
    async refreshPlayer() {
        const res = await this.api.get('/v1/player/state');
        if (res.ok)
            this.player = res.player;
    }
    showToast(text) { this.toast = { text, until: Date.now() + 2600 }; }
    showModal(title, lines, actions = []) {
        this.modal = { title, lines, actions };
        // modal 按钮注册在 frame 渲染时进行；onTap 后关闭
        this.pendingModalActions = actions;
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
        var _a, _b, _c, _d;
        if (r.ok === false) {
            this.showToast(r.message || '操作失败');
            this.audioManager.playSfx('fail');
            return false;
        }
        if (r.message)
            this.showToast(r.message);
        const hasReward = ((_b = (_a = r.rewards) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) > 0;
        if (hasReward)
            this.audioManager.playSfx('reward');
        if ((_c = r.fx) === null || _c === void 0 ? void 0 : _c.includes('win'))
            this.platform.vibrate(true);
        if ((_d = r.fx) === null || _d === void 0 ? void 0 : _d.includes('lose'))
            this.platform.vibrate(false);
        this.refreshPlayer();
        return true;
    }
    frame() {
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
        if (!this.booted) {
            this.ui.textCenter('LOMO 小游戏 · 正在启动…', this.ui.w / 2, this.ui.h / 2, { size: 15, color: theme_1.THEME.textDim });
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
        ui.text(`${this.profile === 'full-clone' ? 'FULL CLONE（沙盒）' : 'WECHAT RELEASE'} · ${p.nick} · FPS ${this.fps}`, 78, 42, { size: 10, color: theme_1.THEME.textDim });
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
exports.LomoClientApp = LomoClientApp;
function wrapText(text, maxChars) {
    const lines = [];
    for (let i = 0; i < text.length; i += maxChars)
        lines.push(text.slice(i, i + maxChars));
    return lines.length ? lines : [''];
}
/** 全部屏幕注册（由 features/registry.ts 提供，避免循环依赖） */
const registry_1 = require("../features/registry");
