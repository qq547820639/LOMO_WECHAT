"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonkeyKingScreen = exports.TugScreen = exports.SportsScreen = exports.MarblesScreen = exports.ChickenScreen = exports.EscapeTigerScreen = void 0;
exports.eggProgress = eggProgress;
exports.registerMinigameScreens = registerMinigameScreens;
/**
 * 小游戏屏幕：虎口逃生 / 今晚吃鸡 / 弹珠 / 运动会 / 拔河 / 炸猴王。
 * 全部为真实输入驱动：车道选择 / 时机防守 / 角度力度 / 反应窗口 / 节奏鼓点 / 投弹档位。
 */
const base_1 = require("./base");
const theme_1 = require("../core/theme");
const registry_1 = require("./registry");
function eggProgress(readyAt, now = Date.now(), durationMs = 30000) {
    if (!(readyAt > 0))
        return 0;
    if (readyAt <= now)
        return 1;
    const duration = durationMs > 0 ? durationMs : 30000;
    return Math.max(0, Math.min(1, 1 - (readyAt - now) / duration));
}
// ---------------- 虎口逃生（三车道跑酷） ----------------
class EscapeTigerScreen extends base_1.ApiScreen {
    runnerFor(animal) {
        try {
            return new (require('../ui/frame_clip').FrameClip)(this.app.assets, this.app.assets.resolveSlotId(`escape_animal__${animal}`), 'launch', { loop: true, fitHeight: 52 });
        }
        catch {
            return null;
        }
    }
    constructor() {
        super('escapeTiger', '虎口逃生');
        this.route = '/escapeTiger';
        this.sessionId = null;
        this.animal = 'monkey';
        this.lastMsg = '';
        this.runnerClip = null;
        this.tigerClip = null;
    }
    async fetchState() {
        var _a, _b;
        const r = await this.app.api.gameState('escapeTiger');
        if (r.ok)
            this.sessionId = (_b = (_a = r.state) === null || _a === void 0 ? void 0 : _a.sessionId) !== null && _b !== void 0 ? _b : null;
        return r;
    }
    render() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
        const ui = this.app.ui;
        const top = 64;
        if (this.renderStatus(ui, top))
            return;
        const st = this.state;
        let y = top + 6;
        if (!this.sessionId) {
            ui.panel({ x: 12, y, w: ui.w - 24, h: 56 }, theme_1.THEME.panel);
            ui.text('猛虎在身后！选择一只动物开始逃亡', 24, y + 20, { size: 13, bold: true });
            ui.text(`每局 ${st.stepsPerRun} 步 · 选车道躲障碍 · 护盾/无敌/加速 · 最佳金币 ${st.best}`, 24, y + 40, { size: 10, color: theme_1.THEME.textDim });
            y += 64;
            const aw = (ui.w - 24 - 5 * 5) / 6;
            ((_a = st.animals) !== null && _a !== void 0 ? _a : []).forEach((a, i) => {
                var _a;
                ui.button({ x: 12 + i * (aw + 5), y, w: aw, h: 40 }, (_a = { cow: '牛', dog: '狗', fox: '狐', monkey: '猴', pig: '猪', raccoon: '浣' }[a]) !== null && _a !== void 0 ? _a : a, () => { this.animal = a; }, { color: this.animal === a ? theme_1.THEME.accent : theme_1.THEME.panel2, size: 14 });
            });
            y += 50;
            if (!this.runnerClip || ((_b = this.runnerClip.state) === null || _b === void 0 ? void 0 : _b.failed)) {
                this.runnerClip = this.runnerFor(this.animal);
            }
            (_c = this.runnerClip) === null || _c === void 0 ? void 0 : _c.draw(ui, ui.w / 2, y + 24, this.app.frameDt);
            ui.button({ x: 12, y, w: ui.w - 24, h: 46 }, '开始逃亡（体力 -1）', async () => {
                const s = await this.app.api.post('/v1/game/session/start', { featureId: 'escapeTiger' });
                if (!s.ok) {
                    this.app.showToast(s.message);
                    return;
                }
                const r = await this.app.api.action('escapeTiger', 'start', { animal: this.animal }, s.sessionId, 1);
                if (r.ok) {
                    this.sessionId = s.sessionId;
                    this.lastMsg = r.message;
                }
                else
                    this.app.showToast(r.message);
                await this.onEnter();
            }, { color: theme_1.THEME.accent });
            y += 56;
        }
        else {
            const data = (_d = st.active) !== null && _d !== void 0 ? _d : {};
            // v3 跑道视觉：虎在身后追 + 三车道 + 跑者动物 + 障碍闪红
            ui.panel({ x: 12, y, w: ui.w - 24, h: 176 }, theme_1.THEME.panel);
            const trackTop = y + 8, trackH = 150;
            // 三车道底
            const laneW = (ui.w - 24) / 3;
            const tc = this.app.ui.ctx;
            for (let li = 0; li < 3; li++) {
                tc.fillStyle = li === ((_e = data.lane) !== null && _e !== void 0 ? _e : 1) ? theme_1.THEME.panel2 : theme_1.THEME.bg2;
                tc.fillRect(12 + li * laneW, trackTop, laneW, trackH);
                tc.strokeStyle = theme_1.THEME.line;
                tc.strokeRect(12 + li * laneW, trackTop, laneW, trackH);
            }
            // 虎（追击者，距离越近越靠右）
            const dist = Math.max(0, (_f = data.tigerDist) !== null && _f !== void 0 ? _f : 6);
            if (!this.tigerClip) {
                try {
                    this.tigerClip = new (require('../ui/frame_clip').FrameClip)(this.app.assets, this.app.assets.resolveSlotId('escape_animal__tiger'), 'launch', { loop: true, fitHeight: 54 });
                    this.tigerClip.play();
                }
                catch {
                    this.tigerClip = null;
                }
            }
            const tigerX = 20 + (dist / 6) * (ui.w - 110);
            (_g = this.tigerClip) === null || _g === void 0 ? void 0 : _g.draw(ui, tigerX, trackTop + trackH * 0.32, this.app.frameDt);
            ui.text('虎', tigerX, trackTop + trackH * 0.62, { size: 11, color: theme_1.THEME.red });
            // 跑者动物（我的位置：当前车道）
            if (!this.runnerClip || ((_h = this.runnerClip.state) === null || _h === void 0 ? void 0 : _h.failed))
                this.runnerClip = this.runnerFor(this.animal);
            const laneCx = 12 + ((_j = data.lane) !== null && _j !== void 0 ? _j : 1) * laneW + laneW / 2;
            (_k = this.runnerClip) === null || _k === void 0 ? void 0 : _k.draw(ui, laneCx, trackTop + trackH * 0.68, this.app.frameDt);
            // 进度/距离/Buff
            ui.text(`第 ${(_l = data.step) !== null && _l !== void 0 ? _l : 0} / ${st.stepsPerRun} 步`, 24, trackTop + trackH + 6, { size: 12, bold: true });
            ui.progress(110, trackTop + trackH + 6, ui.w - 190, 8, ((_m = data.step) !== null && _m !== void 0 ? _m : 0) / st.stepsPerRun, theme_1.THEME.accent2);
            ui.text(`虎距 ${Math.max(0, Math.ceil(dist))}`, ui.w - 70, trackTop + trackH + 6, { size: 11, color: dist < 3 ? theme_1.THEME.red : theme_1.THEME.green });
            ui.text(`Buff: ${((_o = data.buffs) !== null && _o !== void 0 ? _o : []).join(', ') || '无'}`, 24, trackTop + trackH + 20, { size: 9, color: theme_1.THEME.purple });
            y += 186;
            // 三车道选择
            ui.text('选择车道（躲开障碍！）', 16, y + 12, { size: 12, color: theme_1.THEME.textDim });
            y += 18;
            const lw = (ui.w - 24 - 12) / 3;
            ['左', '中', '右'].forEach((lane, i) => {
                var _a;
                ui.button({ x: 12 + i * (lw + 6), y, w: lw, h: 64 }, ['左', '中', '右'][i], () => this.act('step', { lane: i }, this.sessionId), { color: i === ((_a = data.lane) !== null && _a !== void 0 ? _a : 1) ? theme_1.THEME.accent2 : theme_1.THEME.panel2, size: 20 });
            });
            y += 72;
            ui.text(this.lastMsg || '虎口还差 6 步', 16, y + 8, { size: 11, color: theme_1.THEME.text });
            y += 22;
            ui.button({ x: 12, y, w: ui.w - 24, h: 36 }, '放弃（按进度结算）', () => this.act('abort', {}, this.sessionId), { size: 12, color: theme_1.THEME.bg2 });
            y += 44;
        }
        ui.text(`最佳: ${(_p = st.best) !== null && _p !== void 0 ? _p : 0} 金币 · 记录: ${((_s = (_r = (_q = st.history) === null || _q === void 0 ? void 0 : _q[0]) === null || _r === void 0 ? void 0 : _r.summary) !== null && _s !== void 0 ? _s : '暂无').slice(0, 28)}`, 16, y + 8, { size: 10, color: theme_1.THEME.textDim });
    }
    async act(actionId, payload, sessionId) {
        const r = await this.app.api.action('escapeTiger', actionId, payload, sessionId, Date.now() % 1e6);
        this.app.handleGameResponse(r);
        if (r.ok) {
            this.lastMsg = r.message;
            if (r.ok && (r.message.includes('逃离') || r.message.includes('绳断') || actionId === 'abort'))
                this.sessionId = null;
        }
        await this.onEnter();
        return r;
    }
}
exports.EscapeTigerScreen = EscapeTigerScreen;
// ---------------- 今晚吃鸡 ----------------
class ChickenScreen extends base_1.ApiScreen {
    constructor() {
        super('chicken', '今晚吃鸡');
        this.route = '/chicken';
        this.chickenClip = null;
    }
    pollMs() { return 3000; }
    render() {
        var _a, _b, _c, _d, _e, _f, _g;
        const ui = this.app.ui;
        const top = 64;
        if (this.renderStatus(ui, top))
            return;
        const st = this.state;
        let y = top + 6;
        // 鸡窝
        ui.panel({ x: 12, y, w: ui.w - 24, h: 96 }, theme_1.THEME.panel);
        const eggReady = st.eggReady;
        const eggPending = ((_a = st.eggReadyAt) !== null && _a !== void 0 ? _a : 0) > 0 && !eggReady;
        if (!this.chickenClip) {
            try {
                this.chickenClip = new (require('../ui/frame_clip').FrameClip)(this.app.assets, this.app.assets.resolveSlotId('chicken__'), 'launch', { loop: true, fitHeight: 40 });
                this.chickenClip.play();
            }
            catch {
                this.chickenClip = null;
            }
        }
        (_b = this.chickenClip) === null || _b === void 0 ? void 0 : _b.draw(ui, ui.w - 52, y + 30, this.app.frameDt);
        ui.textCenter(eggReady ? '🥚 蛋已成熟！' : eggPending ? '🥚 孵化中…' : '🐔 鸡窝空空', ui.w / 2, y + 30, { size: 15, bold: true, color: eggReady ? theme_1.THEME.gold : theme_1.THEME.text });
        if (eggPending) {
            ui.progress(28, y + 46, ui.w - 56, 8, eggProgress(st.eggReadyAt, Date.now(), (_c = st.eggDurationMs) !== null && _c !== void 0 ? _c : 30000), theme_1.THEME.gold);
        }
        const thiefWarn = ((_d = st.thiefWarningAt) !== null && _d !== void 0 ? _d : 0) > 0;
        ui.textCenter(thiefWarn ? '⚠ 偷鸡者来袭！赶紧布防！' : `收获 ${st.eggsCollected} · 防守 ${st.guarded} · 被偷 ${st.stolen}`, ui.w / 2, y + 76, { size: 11, color: thiefWarn ? theme_1.THEME.red : theme_1.THEME.textDim });
        y += 106;
        const bw = (ui.w - 24 - 12) / 3;
        ui.button({ x: 12, y, w: bw, h: 46 }, `喂养(-${10})`, () => this.act('feed'), { color: theme_1.THEME.gold, disabled: eggPending || eggReady });
        ui.button({ x: 12 + bw + 6, y, w: bw, h: 46 }, '布防(-8)', () => this.act('guard'), { color: theme_1.THEME.accent2, disabled: !thiefWarn });
        ui.button({ x: 12 + (bw + 6) * 2, y, w: bw, h: 46 }, '收蛋', () => this.act('collect'), { color: theme_1.THEME.green, disabled: !eggReady });
        y += 56;
        ui.text('喂养 → 孵化 30s → 收蛋；偷鸡者中途来袭需布防', 16, y + 8, { size: 10, color: theme_1.THEME.textDim });
        ui.text('记录: ' + ((_g = (_f = (_e = st.log) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.summary) !== null && _g !== void 0 ? _g : '暂无').slice(0, 32), 16, y + 24, { size: 10, color: theme_1.THEME.textDim });
    }
}
exports.ChickenScreen = ChickenScreen;
// ---------------- 弹珠（角度+力度） ----------------
class MarblesScreen extends base_1.ApiScreen {
    constructor() {
        super('marbles', '弹珠');
        this.route = '/marbles';
        this.sessionId = null;
        this.angle = 45;
        this.power = 60;
        this.launchClip = null;
        this.launchVisible = false;
    }
    onEnter() {
        // SANITIZATION P0-2 处置：发射特效 = 自绘 6 帧图集（fx_launch）；图集缺失时降级程序化绘制
        if (!this.launchClip && this.app.assets) {
            this.launchClip = new (require('../ui/frame_clip').FrameClip)(this.app.assets, 'fx_launch', 'launch', { loop: false, fitHeight: 56 });
        }
        return super.onEnter();
    }
    onExit() { this.launchClip = null; this.launchVisible = false; }
    async fetchState() {
        var _a, _b;
        const r = await this.app.api.gameState('marbles');
        if (r.ok)
            this.sessionId = (_b = (_a = r.state) === null || _a === void 0 ? void 0 : _a.sessionId) !== null && _b !== void 0 ? _b : null;
        return r;
    }
    render() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
        const ui = this.app.ui;
        const top = 64;
        if (this.renderStatus(ui, top))
            return;
        const st = this.state;
        let y = top + 6;
        const active = st.active;
        if (!this.sessionId || !active) {
            ui.panel({ x: 12, y, w: ui.w - 24, h: 56 }, theme_1.THEME.panel);
            ui.text('物理弹珠：调整角度与力度击打摆锤得分', 24, y + 20, { size: 13, bold: true });
            ui.text(`每局 ${(_a = st.shotsPerRun) !== null && _a !== void 0 ? _a : st.shotsPerRound} 发 · 目标 ${st.targetScore} 分达标得奖券 · 最佳 ${st.best}`, 24, y + 40, { size: 10, color: theme_1.THEME.textDim });
            y += 64;
            ui.button({ x: 12, y, w: ui.w - 24, h: 46 }, '开新一局（体力 -1）', async () => {
                const s = await this.app.api.post('/v1/game/session/start', { featureId: 'marbles' });
                if (!s.ok) {
                    this.app.showToast(s.message);
                    return;
                }
                const r = await this.app.api.action('marbles', 'start', {}, s.sessionId, 1);
                if (r.ok)
                    this.sessionId = s.sessionId;
                this.app.showToast(r.message);
                await this.onEnter();
            }, { color: theme_1.THEME.accent });
            y += 56;
        }
        else {
            const d = active;
            // 场地渲染
            ui.panel({ x: 12, y, w: ui.w - 24, h: 170 }, theme_1.THEME.panel);
            // 发射点
            const ox = 30, oy = y + 140;
            this.app.ui.ctx.fillStyle = theme_1.THEME.gold;
            this.app.ui.ctx.fillRect(ox - 4, oy - 4, 8, 8);
            // 摆锤（服务端下发）
            for (const peg of (_b = d.pegs) !== null && _b !== void 0 ? _b : []) {
                const pc = this.app.ui.ctx;
                pc.fillStyle = theme_1.THEME.purple;
                pc.beginPath();
                pc.arc(ox + ((_c = peg.x) !== null && _c !== void 0 ? _c : 0) * 0.85, oy - ((_d = peg.y) !== null && _d !== void 0 ? _d : 0) * 0.3, ((_e = peg.r) !== null && _e !== void 0 ? _e : 10) / 1.6, 0, Math.PI * 2);
                pc.fill();
                pc.fillStyle = theme_1.THEME.accent;
                pc.beginPath();
                pc.arc(ox + ((_f = peg.x) !== null && _f !== void 0 ? _f : 0) * 0.85 - 2, oy - ((_g = peg.y) !== null && _g !== void 0 ? _g : 0) * 0.3 - 2, ((_h = peg.r) !== null && _h !== void 0 ? _h : 10) / 5, 0, Math.PI * 2);
                pc.fill();
            }
            // 发射特效（自制美术）：待机静帧，发射时播放一遍；图集加载失败自动降级程序化
            if (this.launchClip && 'state' in this.launchClip && this.launchClip.state.failed) {
                this.launchClip = new (require('../ui/procedural_clips').LaunchPulse)();
            }
            if (this.launchClip) {
                this.launchClip.draw(ui, ox + 60, oy - 30, this.launchVisible ? this.app.frameDt : 0);
                if (this.launchClip.state.finished)
                    this.launchVisible = false;
            }
            // 射程预览线
            const range = (this.power * Math.sin((2 * this.angle * Math.PI) / 180)) / 2.2;
            this.app.ui.ctx.strokeStyle = theme_1.THEME.accent2;
            this.app.ui.ctx.beginPath();
            this.app.ui.ctx.moveTo(ox, oy);
            this.app.ui.ctx.lineTo(ox + range * 0.85, oy - 40);
            this.app.ui.ctx.stroke();
            ui.text(`射程≈${Math.floor(range)} · 得分 ${(_j = d.score) !== null && _j !== void 0 ? _j : 0}`, 20, y + 158, { size: 10, color: theme_1.THEME.textDim });
            y += 178;
            // 角度/力度
            ui.text(`角度 ${this.angle}°`, 16, y + 12, { size: 11 });
            this.hSlider(ui, 90, y, 180, this.angle, 10, 85, (v) => { this.angle = v; });
            ui.text(`${this.angle}°`, ui.w - 50, y + 12, { size: 11, color: theme_1.THEME.accent2 });
            y += 30;
            ui.text(`力度 ${this.power}`, 16, y + 12, { size: 11 });
            this.hSlider(ui, 90, y, 180, this.power, 30, 100, (v) => { this.power = v; });
            ui.text(`${this.power}`, ui.w - 50, y + 12, { size: 11, color: theme_1.THEME.gold });
            y += 32;
            const bw = (ui.w - 24 - 8) / 2;
            ui.button({ x: 12, y, w: bw, h: 44 }, `发射（剩 ${st.shotsPerRound - ((_k = d.shot) !== null && _k !== void 0 ? _k : 0)}）`, () => {
                if (this.launchClip) {
                    this.launchClip.reset();
                    this.launchClip.play();
                    this.launchVisible = true;
                }
                void this.act('shot', { angle: this.angle, power: this.power }, this.sessionId);
            }, { color: theme_1.THEME.accent });
            ui.button({ x: 12 + bw + 8, y, w: bw, h: 44 }, '结束本局', () => { this.sessionId = null; this.onEnter(); }, { color: theme_1.THEME.bg2, size: 12 });
            y += 54;
        }
        ui.text(`最佳 ${(_l = st.best) !== null && _l !== void 0 ? _l : 0} · 记录: ${((_p = (_o = (_m = st.history) === null || _m === void 0 ? void 0 : _m[0]) === null || _o === void 0 ? void 0 : _o.summary) !== null && _p !== void 0 ? _p : '暂无').slice(0, 26)}`, 16, y + 8, { size: 10, color: theme_1.THEME.textDim });
    }
    hSlider(ui, x, y, w, value, min, max, onChange) {
        ui.progress(x, y + 6, w, 6, (value - min) / (max - min), theme_1.THEME.accent2);
        const steps = 8;
        const sw = w / steps;
        for (let i = 0; i <= steps; i++) {
            const v = Math.round(min + ((max - min) * i) / steps);
            ui.hits.push({ x: x + i * sw - sw / 2, y, w: sw, h: 20, onTap: () => onChange(v), id: 'sl' + x + i });
        }
    }
    async act(actionId, payload, sessionId) {
        const r = await this.app.api.action('marbles', actionId, payload, sessionId, Date.now() % 1e6);
        this.app.handleGameResponse(r);
        if (r.ok && r.state) { /* 保留会话状态 */ }
        await this.onEnter();
        return r;
    }
}
exports.MarblesScreen = MarblesScreen;
// ---------------- 运动会（反应时机） ----------------
class SportsScreen extends base_1.ApiScreen {
    constructor() {
        super('sports', '运动会');
        this.route = '/sports';
        this.sessionId = null;
        this.roundStartAt = 0;
        this.runnerClip = null;
    }
    async fetchState() {
        var _a, _b;
        const r = await this.app.api.gameState('sports');
        if (r.ok)
            this.sessionId = (_b = (_a = r.state) === null || _a === void 0 ? void 0 : _a.sessionId) !== null && _b !== void 0 ? _b : null;
        return r;
    }
    render() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const ui = this.app.ui;
        const top = 64;
        if (this.renderStatus(ui, top))
            return;
        const st = this.state;
        let y = top + 6;
        if (!this.sessionId) {
            ui.panel({ x: 12, y, w: ui.w - 24, h: 56 }, theme_1.THEME.panel);
            ui.text('反应挑战：发令枪响越快按，分越高（抢跑无效）', 24, y + 20, { size: 13, bold: true });
            ui.text(`${st.rounds} 轮 · 有效窗口 ${st.tapWindowMs}ms · 最佳 ${st.best}`, 24, y + 40, { size: 10, color: theme_1.THEME.textDim });
            y += 64;
            ui.button({ x: 12, y, w: ui.w - 24, h: 46 }, '入场（体力 -1）', async () => {
                const s = await this.app.api.post('/v1/game/session/start', { featureId: 'sports' });
                if (!s.ok) {
                    this.app.showToast(s.message);
                    return;
                }
                const r = await this.app.api.action('sports', 'start', {}, s.sessionId, 1);
                if (r.ok) {
                    this.sessionId = s.sessionId;
                    this.roundStartAt = Date.now();
                }
                this.app.showToast(r.message);
                await this.onEnter();
            }, { color: theme_1.THEME.accent });
            y += 56;
        }
        else {
            const d = (_a = st.active) !== null && _a !== void 0 ? _a : {};
            const gunTimes = (_b = d.gunTimes) !== null && _b !== void 0 ? _b : [];
            const round = (_c = d.round) !== null && _c !== void 0 ? _c : 0;
            ui.panel({ x: 12, y, w: ui.w - 24, h: 110 }, theme_1.THEME.panel);
            ui.textCenter(`第 ${Math.min(round + 1, gunTimes.length)} / ${gunTimes.length} 轮`, ui.w / 2, y + 26, { size: 15, bold: true });
            ui.textCenter('看到 GO 就点！（按你看到的时机点击）', ui.w / 2, y + 50, { size: 11, color: theme_1.THEME.textDim });
            ui.text(`当前得分 ${(_d = d.score) !== null && _d !== void 0 ? _d : 0}`, 24, y + 76, { size: 12, color: theme_1.THEME.gold });
            const nextGun = gunTimes[round];
            if (nextGun != null)
                ui.text(`发令: +${(nextGun / 1000).toFixed(1)}s`, ui.w - 90, y + 76, { size: 11, color: theme_1.THEME.textDim });
            y += 120;
            if (!this.runnerClip) {
                try {
                    this.runnerClip = new (require('../ui/frame_clip').FrameClip)(this.app.assets, this.app.assets.resolveSlotId('sport__'), 'launch', { loop: true, fitHeight: 46 });
                    this.runnerClip.play();
                }
                catch {
                    this.runnerClip = null;
                }
            }
            (_e = this.runnerClip) === null || _e === void 0 ? void 0 : _e.draw(ui, ui.w / 2, y + 34, this.app.frameDt);
            ui.button({ x: 12, y, w: ui.w - 24, h: 70 }, 'GO！（点击反应）', () => {
                var _a;
                const reaction = Date.now() - this.roundStartAt - ((_a = gunTimes[round]) !== null && _a !== void 0 ? _a : 0);
                this.act('react', { reactionMs: Math.max(80, reaction) }, this.sessionId).then(() => { this.roundStartAt = Date.now(); });
            }, { color: theme_1.THEME.accent2, size: 20 });
            y += 80;
            ui.button({ x: 12, y, w: ui.w - 24, h: 34 }, '放弃本场', () => { this.sessionId = null; this.onEnter(); }, { size: 12, color: theme_1.THEME.bg2 });
            y += 42;
        }
        ui.text(`最佳 ${(_f = st.best) !== null && _f !== void 0 ? _f : 0} · 记录: ${((_j = (_h = (_g = st.history) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.summary) !== null && _j !== void 0 ? _j : '暂无')}`, 16, y + 8, { size: 10, color: theme_1.THEME.textDim });
    }
}
exports.SportsScreen = SportsScreen;
// ---------------- 拔河（节奏） ----------------
class TugScreen extends base_1.ApiScreen {
    constructor() {
        super('tug', '拔河');
        this.route = '/tug';
        this.sessionId = null;
        this.beatStart = 0;
        this.tugClip = null;
    }
    async fetchState() {
        var _a, _b;
        const r = await this.app.api.gameState('tug');
        if (r.ok)
            this.sessionId = (_b = (_a = r.state) === null || _a === void 0 ? void 0 : _a.sessionId) !== null && _b !== void 0 ? _b : null;
        return r;
    }
    render() {
        var _a, _b, _c, _d;
        const ui = this.app.ui;
        const top = 64;
        if (this.renderStatus(ui, top))
            return;
        const st = this.state;
        let y = top + 6;
        if (!this.sessionId) {
            ui.panel({ x: 12, y, w: ui.w - 24, h: 56 }, theme_1.THEME.panel);
            ui.text('跟着鼓点节奏拉绳：窗口内完美，乱拉被反拽', 24, y + 20, { size: 13, bold: true });
            ui.text(`体力 -${st.pullEnergy} · 完美窗口 ${st.rhythmWindowMs}ms · 胜场 ${st.wins}`, 24, y + 40, { size: 10, color: theme_1.THEME.textDim });
            y += 64;
            ui.button({ x: 12, y, w: ui.w - 24, h: 46 }, '开始比赛', async () => {
                const s = await this.app.api.post('/v1/game/session/start', { featureId: 'tug' });
                if (!s.ok) {
                    this.app.showToast(s.message);
                    return;
                }
                const r = await this.app.api.action('tug', 'start', {}, s.sessionId, 1);
                if (r.ok) {
                    this.sessionId = s.sessionId;
                    this.beatStart = Date.now();
                }
                this.app.showToast(r.message);
                await this.onEnter();
            }, { color: theme_1.THEME.accent });
            y += 56;
        }
        else {
            const d = (_a = st.active) !== null && _a !== void 0 ? _a : {};
            const rope = (_b = d.rope) !== null && _b !== void 0 ? _b : 0;
            ui.panel({ x: 12, y, w: ui.w - 24, h: 90 }, theme_1.THEME.panel);
            ui.textCenter(rope >= 20 ? '占优！' : rope <= -20 ? '吃紧！' : '胶着', ui.w / 2, y + 22, { size: 14, bold: true, color: rope >= 20 ? theme_1.THEME.green : rope <= -20 ? theme_1.THEME.red : theme_1.THEME.text });
            // 绳子
            const mid = ui.w / 2;
            const pos = mid + Math.max(-130, Math.min(130, rope * 2));
            this.app.ui.ctx.fillStyle = theme_1.THEME.gold;
            this.app.ui.ctx.fillRect(20, y + 40, ui.w - 40, 5);
            this.app.ui.ctx.fillStyle = theme_1.THEME.accent;
            this.app.ui.ctx.fillRect(pos - 6, y + 32, 12, 20);
            if (!this.tugClip) {
                try {
                    this.tugClip = new (require('../ui/frame_clip').FrameClip)(this.app.assets, this.app.assets.resolveSlotId('tug__'), 'launch', { loop: true, fitHeight: 44 });
                    this.tugClip.play();
                }
                catch {
                    this.tugClip = null;
                }
            }
            (_c = this.tugClip) === null || _c === void 0 ? void 0 : _c.draw(ui, ui.w / 2, y + 66, this.app.frameDt);
            ui.text(`节拍 ${(_d = d.beatIdx) !== null && _d !== void 0 ? _d : 0}/10`, 24, y + 76, { size: 11, color: theme_1.THEME.textDim });
            y += 100;
            ui.button({ x: 12, y, w: ui.w - 24, h: 70 }, '拉！！', () => {
                var _a, _b, _c;
                const offset = Math.abs(Date.now() - this.beatStart - ((_c = (_a = d.beats) === null || _a === void 0 ? void 0 : _a[(_b = d.beatIdx) !== null && _b !== void 0 ? _b : 0]) !== null && _c !== void 0 ? _c : 0));
                this.act('pull', { offsetMs: offset }, this.sessionId).then(() => { this.beatStart = Date.now(); });
            }, { color: theme_1.THEME.accent, size: 22 });
            y += 80;
            ui.button({ x: 12, y, w: ui.w - 24, h: 34 }, '认输', () => { this.sessionId = null; this.onEnter(); }, { size: 12, color: theme_1.THEME.bg2 });
            y += 42;
        }
    }
}
exports.TugScreen = TugScreen;
// ---------------- 炸猴王 ----------------
class MonkeyKingScreen extends base_1.ApiScreen {
    constructor() {
        super('rocksMonkeyKing', '炸猴王');
        this.route = '/monkeyKing';
    }
    render() {
        var _a, _b, _c, _d, _e, _f, _g;
        const ui = this.app.ui;
        const top = 64;
        if (this.renderStatus(ui, top))
            return;
        const st = this.state;
        let y = top + 6;
        ui.panel({ x: 12, y, w: ui.w - 24, h: 68 }, theme_1.THEME.panel);
        ui.text(`我的贡献 ${st.myContribution} · 赛季积分/弹 ${st.seasonScorePerBomb}`, 24, y + 20, { size: 12, bold: true });
        ui.text('现金奖池已改赛季积分池（不与充值/提现挂钩）', 24, y + 40, { size: 10, color: theme_1.THEME.gold });
        ui.text(`炸弹单价: 1发 ${(_a = st.bombCost) === null || _a === void 0 ? void 0 : _a.one} · 10发 ${(_b = st.bombCost) === null || _b === void 0 ? void 0 : _b.ten} · 100发 ${(_c = st.bombCost) === null || _c === void 0 ? void 0 : _c.hundred} 金币`, 24, y + 56, { size: 10, color: theme_1.THEME.textDim });
        y += 78;
        const tiers = [['one', '投 1 发', 'bombOne'], ['ten', '连投 10 发', 'bombTen'], ['hundred', '狂轰 100 发', 'bombHundred']];
        const bw = (ui.w - 24 - 12) / 3;
        tiers.forEach(([tier, label], i) => {
            ui.button({ x: 12 + i * (bw + 6), y, w: bw, h: 60 }, label, () => this.act('bomb', { tier }), { color: i === 2 ? theme_1.THEME.accent : i === 1 ? theme_1.THEME.purple : theme_1.THEME.accent2, size: 12 });
        });
        y += 70;
        if ((_d = st.rank) === null || _d === void 0 ? void 0 : _d.length) {
            ui.panel({ x: 12, y, w: ui.w - 24, h: 24 + st.rank.length * 17 }, theme_1.THEME.panel);
            ui.text('贡献榜', 24, y + 16, { size: 11, bold: true, color: theme_1.THEME.purple });
            st.rank.slice(0, 6).forEach((r, i) => {
                ui.text(`${i + 1}. ${r.nick}`, 24, y + 34 + i * 17, { size: 10 });
                ui.text(String(r.score), ui.w - 40, y + 34 + i * 17, { size: 10, color: theme_1.THEME.gold });
            });
            y += 30 + st.rank.length * 17;
        }
        ui.text('记录: ' + ((_g = (_f = (_e = st.history) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.summary) !== null && _g !== void 0 ? _g : '暂无'), 16, y + 8, { size: 10, color: theme_1.THEME.textDim });
    }
}
exports.MonkeyKingScreen = MonkeyKingScreen;
function registerMinigameScreens() {
    (0, registry_1.registerRoute)('escapeTiger', () => new EscapeTigerScreen());
    (0, registry_1.registerRoute)('chicken', () => new ChickenScreen());
    (0, registry_1.registerRoute)('marbles', () => new MarblesScreen());
    (0, registry_1.registerRoute)('sports', () => new SportsScreen());
    (0, registry_1.registerRoute)('tug', () => new TugScreen());
    (0, registry_1.registerRoute)('monkeyKing', () => new MonkeyKingScreen());
}
