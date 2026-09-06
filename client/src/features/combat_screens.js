"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RobberyScreen = exports.DaggerScreen = exports.BossScreen = exports.UndertownScreen = exports.BattleRoyalScreen = void 0;
exports.registerCombatScreens = registerCombatScreens;
/**
 * 战斗族屏幕：大逃杀 / 地下城 / 竞技场 / Boss / 斗猿 / 猿兔 / 匕首 / 抢夺。
 * 全部真实交互：房间选择、修门/换房、砖块点选、三回合行为克制、时机输入。
 */
const base_1 = require("./base");
const theme_1 = require("../core/theme");
const registry_1 = require("./registry");
// ---------------- 大逃杀 ----------------
class BattleRoyalScreen extends base_1.ApiScreen {
    avatarFor() {
        var _a, _b, _c;
        const tone = (((_c = (_b = (_a = this.app.player) === null || _a === void 0 ? void 0 : _a.counters) === null || _b === void 0 ? void 0 : _b['arena.streak']) !== null && _c !== void 0 ? _c : 0) >= 3) ? 'gold' : 'normal';
        try {
            return new (require('../ui/frame_clip').FrameClip)(this.app.assets, `pag__battleRoyal__myself_idle_${tone}`, 'launch', { loop: true, fitHeight: 40 });
        }
        catch {
            return null;
        }
    }
    constructor() {
        super('battleRoyal', '大逃杀');
        this.route = '/battleRoyal';
        this.roomId = 2;
        this.sessionId = null;
        this.feed = [];
        this.avatarClip = null;
    }
    async fetchState() {
        var _a, _b, _c;
        const r = await this.app.api.gameState('battleRoyal');
        if (r.ok && ((_b = (_a = r.state) === null || _a === void 0 ? void 0 : _a.active) === null || _b === void 0 ? void 0 : _b.sessionId)) {
            this.sessionId = r.state.active.sessionId;
        }
        else if (r.ok && !((_c = r.state) === null || _c === void 0 ? void 0 : _c.active)) {
            this.sessionId = null;
        }
        return r;
    }
    render() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
        const ui = this.app.ui;
        const top = 64;
        if (this.renderStatus(ui, top))
            return;
        const st = this.state;
        let y = top + 6;
        if (!this.sessionId) {
            // 大厅：规则 + 房间选择
            ui.panel({ x: 12, y, w: ui.w - 24, h: 74 }, theme_1.THEME.panel);
            ui.text(`门票 ${st.lobby.entryCostCoin} 金币 · ${st.lobby.roomCount} 个房间 · 门耐久 ${st.lobby.baseDoorHp}`, 24, y + 20, { size: 12 });
            ui.text(`杀手每轮撞击门 · 门破房间淘汰 · 幸存按投入分池(手续费 ${(st.lobby.feeRate * 100).toFixed(0)}%)`, 24, y + 38, { size: 10, color: theme_1.THEME.textDim });
            ui.text(`败方房间按 ${(st.lobby.daggerLossRatio * 100).toFixed(0)}% 铸造匕首 · 赛季积分结算`, 24, y + 56, { size: 10, color: theme_1.THEME.textDim });
            y += 82;
            ui.text('选择你的房间（杀手来之前修门或换房）', 16, y + 14, { size: 12, color: theme_1.THEME.textDim });
            y += 22;
            const bw = (ui.w - 24 - 10) / 3;
            for (let i = 1; i <= st.lobby.roomCount; i++) {
                const bx = 12 + ((i - 1) % 3) * (bw + 5);
                const by = y + Math.floor((i - 1) / 3) * 56;
                const active = this.roomId === i;
                ui.button({ x: bx, y: by, w: bw, h: 48 }, `${i} 号房`, () => { this.roomId = i; }, {
                    color: active ? theme_1.THEME.accent : theme_1.THEME.panel2, size: 13,
                });
            }
            y += Math.ceil(st.lobby.roomCount / 3) * 56 + 8;
            ui.button({ x: 12, y, w: ui.w - 24, h: 46 }, `进入 ${this.roomId} 号房间（门票 ${st.lobby.entryCostCoin}）`, async () => {
                const s = await this.app.api.post('/v1/game/session/start', { featureId: 'battleRoyal' });
                if (!s.ok) {
                    this.app.showToast(s.message);
                    return;
                }
                const r = await this.app.api.action('battleRoyal', 'join', { roomId: this.roomId }, s.sessionId, 1);
                if (r.ok) {
                    this.sessionId = s.sessionId;
                    this.feed = [r.message];
                }
                else
                    this.app.showToast(r.message);
                await this.onEnter();
            }, { color: theme_1.THEME.accent });
            y += 56;
        }
        else {
            if (!this.avatarClip)
                this.avatarClip = this.avatarFor();
            (_a = this.avatarClip) === null || _a === void 0 ? void 0 : _a.draw(ui, 30, y + 26, this.app.frameDt);
            // 局内：房间门耐久 + 事件流 + 行动
            const data = (_b = st.active) === null || _b === void 0 ? void 0 : _b.data;
            const rooms = (_c = data === null || data === void 0 ? void 0 : data.rooms) !== null && _c !== void 0 ? _c : [];
            ui.panel({ x: 12, y, w: ui.w - 24, h: 30 }, theme_1.THEME.panel2);
            ui.text(`第 ${(_d = data === null || data === void 0 ? void 0 : data.round) !== null && _d !== void 0 ? _d : 0} 轮 · 你的房间 ${(_e = data === null || data === void 0 ? void 0 : data.playerRoom) !== null && _e !== void 0 ? _e : '-'} · 奖池 ${(0, theme_1.fmtNum)((_f = data === null || data === void 0 ? void 0 : data.pool) !== null && _f !== void 0 ? _f : 0)}`, 24, y + 20, { size: 12, bold: true, color: theme_1.THEME.gold });
            y += 38;
            const bw = (ui.w - 24 - 10) / 3;
            const bc = this.app.ui.ctx;
            rooms.forEach((room, i) => {
                var _a;
                const bx = 12 + (i % 3) * (bw + 5);
                const by = y + Math.floor(i / 3) * 58;
                const mine = room.id === (data === null || data === void 0 ? void 0 : data.playerRoom);
                ui.panel({ x: bx, y: by, w: bw, h: 52 }, room.alive ? theme_1.THEME.panel : theme_1.THEME.bg2);
                const doorW = 14, doorH = 34, dx = bx + 8, dy = by + 9;
                bc.fillStyle = room.alive ? (mine ? '#5a4632' : '#4a3a28') : '#2a2a30';
                bc.fillRect(dx, dy, doorW, doorH);
                bc.strokeStyle = mine ? theme_1.THEME.gold : theme_1.THEME.line;
                bc.strokeRect(dx, dy, doorW, doorH);
                if (room.alive) {
                    const hpR = Math.max(0, Math.min(1, room.doorHp / (room.maxDoorHp || 100)));
                    bc.fillStyle = hpR > 0.5 ? theme_1.THEME.green : hpR > 0.2 ? theme_1.THEME.gold : theme_1.THEME.red;
                    bc.fillRect(dx + doorW + 3, dy + doorH * (1 - hpR), 4, doorH * hpR);
                    bc.fillStyle = theme_1.THEME.gold;
                    bc.fillRect(dx + doorW - 4, dy + doorH / 2, 2, 2);
                }
                else {
                    ui.text('✝', dx + doorW / 2 - 4, dy + doorH / 2 + 4, { size: 12, color: theme_1.THEME.red });
                }
                ui.text(`${room.id}号${mine ? '(你)' : ''}`, bx + doorW + 16, by + 18, { size: 11, bold: mine, color: mine ? theme_1.THEME.gold : room.alive ? theme_1.THEME.text : theme_1.THEME.red });
                ui.text(`耐久 ${Math.max(0, room.doorHp)}`, bx + doorW + 16, by + 34, { size: 9, color: theme_1.THEME.textDim });
                ui.text(`×${((_a = room.players) !== null && _a !== void 0 ? _a : []).length}`, bx + doorW + 16, by + 46, { size: 9, color: theme_1.THEME.textDim });
            });
            y += Math.ceil(rooms.length / 3) * 58 + 6;
            const bw2 = (ui.w - 24 - 12) / 3;
            ui.button({ x: 12, y, w: bw2, h: 44 }, '修门(-10)', () => this.act('act', { kind: 'repair' }, this.sessionId), { color: theme_1.THEME.green });
            ui.button({ x: 12 + bw2 + 6, y, w: bw2, h: 44 }, '换房', () => {
                this.app.showModal('换房', ['输入目标房间（点下方按钮）'], [
                    { label: '1', onTap: () => this.act('act', { kind: 'move', target: 1 }, this.sessionId) },
                    { label: '2', onTap: () => this.act('act', { kind: 'move', target: 2 }, this.sessionId) },
                    { label: '3', onTap: () => this.act('act', { kind: 'move', target: 3 }, this.sessionId) },
                ]);
            }, { color: theme_1.THEME.accent2 });
            ui.button({ x: 12 + (bw2 + 6) * 2, y, w: bw2, h: 44 }, '躲避', () => this.act('act', { kind: 'hide' }, this.sessionId), { color: theme_1.THEME.panel2 });
            y += 54;
            // 事件流
            ui.panel({ x: 12, y, w: ui.w - 24, h: 84 }, theme_1.THEME.panel);
            const lastMsg = ((_g = this.state.lastMsg) !== null && _g !== void 0 ? _g : '');
            this.app.ui.text(lastMsg || '杀手在暗处窥伺……', 20, y + 20, { size: 11, color: theme_1.THEME.text });
            ui.text('提示: 修门恢复耐久；杀手目标保密，听音辨位', 20, y + 40, { size: 10, color: theme_1.THEME.textDim });
            ui.text(`历史: ${((_k = (_j = (_h = st.history) === null || _h === void 0 ? void 0 : _h[0]) === null || _j === void 0 ? void 0 : _j.summary) !== null && _k !== void 0 ? _k : '暂无').slice(0, 30)}`, 20, y + 62, { size: 10, color: theme_1.THEME.textDim });
            y += 92;
        }
        // 赛季榜
        ui.panel({ x: 12, y, w: ui.w - 24, h: Math.min(150, 24 + ((_m = (_l = st.rank) === null || _l === void 0 ? void 0 : _l.length) !== null && _m !== void 0 ? _m : 0) * 18) }, theme_1.THEME.panel);
        ui.text('赛季积分榜', 24, y + 18, { size: 12, bold: true, color: theme_1.THEME.purple });
        ((_o = st.rank) !== null && _o !== void 0 ? _o : []).slice(0, 6).forEach((r, i) => {
            ui.text(`${i + 1}. ${r.nick}`, 24, y + 38 + i * 17, { size: 11 });
            ui.text(String(r.score), ui.w - 40, y + 38 + i * 17, { size: 11, color: theme_1.THEME.gold });
        });
    }
    async act(actionId, payload, sessionId) {
        var _a;
        const r = await this.app.api.action('battleRoyal', actionId, payload, sessionId, Date.now() % 1e6);
        this.app.handleGameResponse(r);
        if (r.ok)
            this.state = { ...((_a = this.state) !== null && _a !== void 0 ? _a : {}), active: { sessionId, data: r.state }, lastMsg: r.message };
        else
            await this.onEnter();
        return r;
    }
}
exports.BattleRoyalScreen = BattleRoyalScreen;
// ---------------- 宝石地下城 ----------------
class UndertownScreen extends base_1.ApiScreen {
    constructor() {
        super('undertown', '宝石地下城');
        this.route = '/undertown';
    }
    render() {
        var _a, _b, _c, _d;
        const ui = this.app.ui;
        const top = 64;
        if (this.renderStatus(ui, top))
            return;
        const st = this.state;
        let y = top + 6;
        ui.panel({ x: 12, y, w: ui.w - 24, h: 52 }, theme_1.THEME.panel);
        ui.text(`第 ${st.floor} 层 · ${st.openedThisFloor}/${st.bricks} 块已开 · 最佳 ${st.bestFloor} 层`, 24, y + 20, { size: 13, bold: true });
        ui.text(`进场 ${st.entryTicketCost} 券/层 · 开砖 ${st.brickCostCoin} 金币/块 · 持券 ${st.ticket}`, 24, y + 40, { size: 10, color: theme_1.THEME.textDim });
        y += 60;
        // 砖块网格
        const cols = 6;
        const bw = (ui.w - 24 - (cols - 1) * 5) / cols;
        const openedSet = new Set((_a = st.openedIdx) !== null && _a !== void 0 ? _a : []);
        for (let i = 1; i <= st.bricks; i++) {
            const bx = 12 + ((i - 1) % cols) * (bw + 5);
            const by = y + Math.floor((i - 1) / cols) * 50;
            const idx = i;
            if (openedSet.has(i)) {
                ui.panel({ x: bx, y: by, w: bw, h: 44 }, theme_1.THEME.bg2);
                ui.textCenter('✓', bx + bw / 2, by + 26, { size: 14, color: theme_1.THEME.textDim });
            }
            else {
                ui.button({ x: bx, y: by, w: bw, h: 44 }, `${i}`, () => {
                    this.app.audioManager.playSfx('tick');
                    void this.act('openBrick', { brickIndex: idx }).then((r) => {
                        if (r.ok && (r.message.includes('解锁') || r.message.includes('保底')))
                            this.app.playOverlay('pag__ready_go__ready_go', 1300);
                    });
                }, { color: theme_1.THEME.panel2, size: 13 });
            }
        }
        y += Math.ceil(st.bricks / cols) * 50 + 6;
        const bw2 = (ui.w - 24 - 8) / 2;
        ui.button({ x: 12, y, w: bw2, h: 38 }, '概率详情', () => {
            const prob = st.prob;
            this.app.showModal(`第 ${prob.floor} 层概率（v${prob.version}）`, [
                `大奖砖: ${prob.grandPrizePerBrick}（${prob.grandPrizeRate}）`,
                '大奖: 宝石 2-5 · 普通: 金币小额',
                '证据: ' + prob.evidence.slice(0, 30) + '…',
            ]);
        }, { color: theme_1.THEME.accent2 });
        ui.button({ x: 12 + bw2 + 8, y, w: bw2, h: 38 }, '每日百强', () => {
            var _a;
            const rows = ((_a = st.rank) !== null && _a !== void 0 ? _a : []).map((r, i) => `${i + 1}. ${r.nick} 深度${r.score}`);
            this.app.showModal('地下城每日百强', rows.length ? rows.slice(0, 8) : ['暂无数据']);
        }, { color: theme_1.THEME.panel2 });
        y += 46;
        ui.text('记录: ' + ((_d = (_c = (_b = st.history) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.summary) !== null && _d !== void 0 ? _d : '暂无').slice(0, 36), 16, y + 8, { size: 10, color: theme_1.THEME.textDim });
    }
}
exports.UndertownScreen = UndertownScreen;
// ---------------- 竞技场 / Boss / 斗猿 / 猿兔（三回合克制对战） ----------------
const moveLabel = (m) => (m === 'attack' ? '攻击' : m === 'defend' ? '防御' : '蓄力');
class DuelArenaScreen extends base_1.ApiScreen {
    /** v3 对战场景：对峙→三回合突进（每次命中音）→ 结果 overlay */
    startCinematic() {
        if (this.cine)
            return;
        const me = (() => { try {
            return new (require('../ui/frame_clip').FrameClip)(this.app.assets, 'pag__battleRoyal__myself_idle_normal', 'launch', { loop: true, fitHeight: 56 });
        }
        catch {
            return null;
        } })();
        const foe = (() => { try {
            return new (require('../ui/frame_clip').FrameClip)(this.app.assets, 'pag__battleRoyal__killer_walk', 'launch', { loop: true, fitHeight: 56 });
        }
        catch {
            return null;
        } })();
        this.cine = { startAt: Date.now(), me, foe };
    }
    renderCinematic(ui, top) {
        var _a, _b;
        if (!this.cine)
            return false;
        const el = Date.now() - this.cine.startAt;
        const c = this.app.ui.ctx;
        c.fillStyle = theme_1.THEME.bg2;
        c.fillRect(12, top + 6, ui.w - 24, 120);
        c.strokeStyle = theme_1.THEME.line;
        c.strokeRect(12, top + 6, ui.w - 24, 120);
        // 突进：每 400ms 一次互冲（共 3 回合），2s 后收
        const round = Math.min(3, Math.floor(el / 400));
        const lunge = (el % 400) < 200 ? Math.min(1, (el % 400) / 200) : 0;
        const myX = 60 + lunge * 70, foeX = ui.w - 60 - lunge * 70;
        const gy = top + 88;
        (_a = this.cine.me) === null || _a === void 0 ? void 0 : _a.draw(ui, myX, gy, this.app.frameDt);
        (_b = this.cine.foe) === null || _b === void 0 ? void 0 : _b.draw(ui, foeX, gy, this.app.frameDt);
        if (lunge > 0.8) {
            this.app.audioManager.playSfx('hit');
            c.fillStyle = theme_1.THEME.gold;
            c.fillRect(ui.w / 2 - 14, gy - 40, 28, 3);
        }
        // 回合 pip（我方连招）
        for (let i = 0; i < 3; i++) {
            const played = i < round;
            const label = this.moveSeq[i] === 'attack' ? '攻' : this.moveSeq[i] === 'defend' ? '防' : this.moveSeq[i] === 'charge' ? '蓄' : '·';
            c.fillStyle = played ? theme_1.THEME.gold : theme_1.THEME.panel2;
            c.fillRect(16 + i * 20, top + 14, 16, 16);
            ui.text(played ? label : '·', 19 + i * 20, top + 26, { size: 11, bold: played, color: played ? theme_1.THEME.bg2 : theme_1.THEME.textDim });
        }
        ui.textCenter('VS', ui.w / 2, top + 30, { size: 16, bold: true, color: theme_1.THEME.accent });
        if (el > 2000) {
            this.cine = null;
        }
        return true;
    }
    constructor(featureId, title) {
        super(featureId, title);
        this.opponents = [];
        this.selIdx = 0;
        this.moveSeq = [];
        this.cine = null;
        this.title = title;
    }
    async fetchState() {
        var _a;
        const r = await this.app.api.gameState(this.featureId);
        if (r.ok && Array.isArray((_a = r.state) === null || _a === void 0 ? void 0 : _a.opponents)) {
            this.opponents = r.state.opponents;
        }
        return r;
    }
    render() {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const ui = this.app.ui;
        const top = 64;
        if (this.renderStatus(ui, top))
            return;
        if (this.renderCinematic(ui, top))
            return;
        const st = this.state;
        let y = top + 6;
        ui.panel({ x: 12, y, w: ui.w - 24, h: 48 }, theme_1.THEME.panel);
        ui.text(`我的战力 ${st.power} · 连胜 ${(_b = (_a = st.winStreak) !== null && _a !== void 0 ? _a : st.wins) !== null && _b !== void 0 ? _b : 0}`, 24, y + 20, { size: 13, bold: true });
        ui.text('三回合 行为克制：攻击>蓄力 / 防御克攻击 / 蓄力强化下一击', 24, y + 38, { size: 10, color: theme_1.THEME.textDim });
        y += 56;
        // 对手列表
        ui.text('选择对手', 16, y + 12, { size: 12, color: theme_1.THEME.textDim });
        y += 18;
        this.opponents.slice(0, 4).forEach((o, i) => {
            ui.panel({ x: 12, y, w: ui.w - 24, h: 34 }, this.selIdx === i ? theme_1.THEME.panel2 : theme_1.THEME.panel);
            ui.text(`${o.nick} Lv.${o.level} 战力${o.power}`, 24, y + 21, { size: 12 });
            if (this.selIdx === i)
                ui.text('✓', ui.w - 34, y + 22, { size: 14, color: theme_1.THEME.green });
            ui.hits.push({ x: 12, y, w: ui.w - 24, h: 36, onTap: () => { this.selIdx = i; }, id: 'opp' + i });
            y += 38;
        });
        y += 4;
        // 出招序列
        ui.text('连招（按顺序点选 3 招）', 16, y + 12, { size: 12, color: theme_1.THEME.textDim });
        y += 16;
        const mw = (ui.w - 24 - 16) / 4;
        ['attack', 'defend', 'charge', '清除'].forEach((m, i) => {
            const label = m === 'attack' ? '攻击' : m === 'defend' ? '防御' : m === 'charge' ? '蓄力' : '清空';
            ui.button({ x: 12 + i * (mw + 5), y, w: mw, h: 38 }, label, () => {
                if (m === '清除')
                    this.moveSeq = [];
                else if (this.moveSeq.length < 3)
                    this.moveSeq.push(m);
            }, { size: 12, color: m === 'attack' ? theme_1.THEME.accent : m === 'defend' ? theme_1.THEME.accent2 : theme_1.THEME.purple });
        });
        y += 44;
        ui.text('已选: ' + (this.moveSeq.map(moveLabel).join('→') || '（自动）'), 16, y + 12, { size: 11, color: theme_1.THEME.gold });
        y += 20;
        ui.button({ x: 12, y, w: ui.w - 24, h: 46 }, `挑战 ${(_d = (_c = this.opponents[this.selIdx]) === null || _c === void 0 ? void 0 : _c.nick) !== null && _d !== void 0 ? _d : '对手'}！`, () => {
            if (this.featureId === 'monkeyFight')
                this.app.playOverlay(this.app.assets.resolveSlotId('monkeyfighting__'), 1200);
            void this.app.api.action('arena', 'fight', { opponentIdx: this.selIdx, moves: this.moveSeq.slice() }).then((r) => {
                this.app.playOverlay(r.ok && r.message.includes('胜') ? 'arena__result_success' : 'pag__pag_levelup_fail', 1500);
                this.moveSeq = [];
                this.onEnter();
            });
        }, { color: theme_1.THEME.accent });
        y += 56;
        ui.text('记录: ' + ((_g = (_f = (_e = st.history) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.summary) !== null && _g !== void 0 ? _g : '暂无'), 16, y + 8, { size: 10, color: theme_1.THEME.textDim });
        y += 22;
        if ((_h = st.rank) === null || _h === void 0 ? void 0 : _h.length) {
            ui.panel({ x: 12, y, w: ui.w - 24, h: 24 + st.rank.length * 17 }, theme_1.THEME.panel);
            ui.text('战力榜', 24, y + 16, { size: 11, bold: true, color: theme_1.THEME.purple });
            st.rank.slice(0, 5).forEach((r, i) => {
                ui.text(`${i + 1}. ${r.nick}`, 24, y + 34 + i * 17, { size: 10 });
                ui.text(String(r.score), ui.w - 40, y + 34 + i * 17, { size: 10, color: theme_1.THEME.gold });
            });
        }
    }
}
class BossScreen extends base_1.ApiScreen {
    constructor() {
        super('boss', 'Boss 挑战');
        this.route = '/boss';
        this.bossClip = null;
    }
    onEnter() {
        if (!this.bossClip && this.app.assets) {
            try {
                this.bossClip = new (require('../ui/frame_clip').FrameClip)(this.app.assets, this.app.assets.resolveSlotId('challenge_boss__boss_circle'), 'launch', { loop: true, fitHeight: 84 });
                this.bossClip.play();
            }
            catch {
                this.bossClip = null;
            }
        }
        return super.onEnter();
    }
    onExit() { this.bossClip = null; }
    render() {
        var _a, _b, _c, _d, _e, _f, _g;
        const ui = this.app.ui;
        const top = 64;
        if (this.renderStatus(ui, top))
            return;
        const st = this.state;
        let y = top + 10;
        ui.panel({ x: 12, y, w: ui.w - 24, h: 108 }, theme_1.THEME.panel);
        if (this.bossClip && !st.dead)
            this.bossClip.draw(ui, ui.w / 2, y + 46, this.app.frameDt);
        ui.textCenter(st.dead ? 'Boss 已被击败（等待刷新）' : '远古猿王 Boss', ui.w / 2, y + 24, { size: 15, bold: true, color: theme_1.THEME.red });
        ui.progress(28, y + 40, ui.w - 56, 14, st.maxHp ? st.hp / st.maxHp : 0, st.hp / st.maxHp > 0.5 ? theme_1.THEME.green : theme_1.THEME.red);
        ui.textCenter(`${st.hp} / ${st.maxHp}`, ui.w / 2, y + 72, { size: 12, bold: true });
        const cd = (_a = st.cooldownLeft) !== null && _a !== void 0 ? _a : 0;
        ui.textCenter(cd > 0 ? `冷却 ${(0, theme_1.fmtTime)(cd)}` : `我的战力 ${st.power} · 可攻击`, ui.w / 2, y + 92, { size: 11, color: cd > 0 ? theme_1.THEME.textDim : theme_1.THEME.green });
        y += 118;
        ui.button({ x: 12, y, w: ui.w - 24, h: 48 }, cd > 0 ? `冷却中 ${(0, theme_1.fmtTime)(cd)}` : '全力一击！', () => this.act('attack'), { disabled: cd > 0 || st.dead, color: theme_1.THEME.accent });
        y += 58;
        ui.text(`累计击杀 ${(_d = (_c = (_b = this.app.player) === null || _b === void 0 ? void 0 : _b.counters) === null || _c === void 0 ? void 0 : _c['boss.kills']) !== null && _d !== void 0 ? _d : 0} · 记录: ${((_g = (_f = (_e = st.history) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.summary) !== null && _g !== void 0 ? _g : '暂无')}`, 16, y + 8, { size: 10, color: theme_1.THEME.textDim });
    }
}
exports.BossScreen = BossScreen;
// ---------------- 匕首 ----------------
class DaggerScreen extends base_1.ApiScreen {
    constructor() {
        super('dagger', '匕首 / 刺杀');
        this.route = '/dagger';
    }
    render() {
        var _a, _b, _c, _d;
        const ui = this.app.ui;
        const top = 64;
        if (this.renderStatus(ui, top))
            return;
        const st = this.state;
        let y = top + 6;
        ui.panel({ x: 12, y, w: ui.w - 24, h: 74 }, theme_1.THEME.panel);
        ui.text(`匕首 ×${st.daggers} · 等级 Lv.${st.level} · 钉 ${st.nail}`, 24, y + 22, { size: 13, bold: true, color: theme_1.THEME.gold });
        ui.text('大逃杀被淘汰获得匕首 → 升级/刺杀消耗（RELEASE 该玩法延后）', 24, y + 44, { size: 10, color: theme_1.THEME.textDim });
        ui.text(`最近: ${((_c = (_b = (_a = st.history) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.summary) !== null && _c !== void 0 ? _c : '暂无')}`, 24, y + 62, { size: 10, color: theme_1.THEME.textDim });
        y += 84;
        ui.button({ x: 12, y, w: (ui.w - 30) / 2, h: 46 }, `升级（${5} 把）`, () => this.act('upgrade'), { color: theme_1.THEME.accent2, disabled: st.daggers < 5 });
        ui.button({ x: 12 + (ui.w - 30) / 2 + 6, y, w: (ui.w - 30) / 2, h: 46 }, '刺杀（1 把+体力）', () => this.act('assassinate'), { color: theme_1.THEME.accent, disabled: st.daggers < 1 });
        y += 56;
        ((_d = st.history) !== null && _d !== void 0 ? _d : []).slice(0, 6).forEach((h, i) => {
            ui.text(`· ${h.summary}`.slice(0, 40), 16, y + i * 17, { size: 10, color: theme_1.THEME.textDim });
        });
    }
}
exports.DaggerScreen = DaggerScreen;
// ---------------- 抢夺（PvE 积分争夺） ----------------
class RobberyScreen extends base_1.ApiScreen {
    constructor() {
        super('robbery', '资源争夺');
        this.route = '/robbery';
    }
    render() {
        var _a;
        const ui = this.app.ui;
        const top = 64;
        if (this.renderStatus(ui, top))
            return;
        const st = this.state;
        let y = top + 6;
        ui.panel({ x: 12, y, w: ui.w - 24, h: 68 }, theme_1.THEME.panel);
        ui.text(`我的争夺积分 ${st.score} · 模式: ${st.mode === 'pve-async-score' ? 'PvE 异步积分' : '完整 PvE'}`, 24, y + 20, { size: 12, bold: true });
        ui.text(`体力消耗 ${st.energyCost} · 基础成功率 ${(st.successBase * 100).toFixed(0)}%（战力加成）`, 24, y + 40, { size: 10, color: theme_1.THEME.textDim });
        ui.text('原玩家间资产抢夺已改为 PvE 积分制（RELEASE 合规改造）', 24, y + 56, { size: 9, color: theme_1.THEME.gold });
        y += 78;
        ui.button({ x: 12, y, w: ui.w - 24, h: 46 }, '发起争夺', () => { void this.act('raid').then(() => this.app.playOverlay(this.app.assets.resolveSlotId('rob__du'), 1100)); }, { color: theme_1.THEME.accent });
        y += 56;
        if ((_a = st.rank) === null || _a === void 0 ? void 0 : _a.length) {
            ui.panel({ x: 12, y, w: ui.w - 24, h: 24 + st.rank.length * 17 }, theme_1.THEME.panel);
            ui.text('争夺榜', 24, y + 16, { size: 11, bold: true, color: theme_1.THEME.purple });
            st.rank.slice(0, 6).forEach((r, i) => {
                ui.text(`${i + 1}. ${r.nick}`, 24, y + 34 + i * 17, { size: 10 });
                ui.text(String(r.score), ui.w - 40, y + 34 + i * 17, { size: 10, color: theme_1.THEME.gold });
            });
        }
    }
}
exports.RobberyScreen = RobberyScreen;
function registerCombatScreens() {
    (0, registry_1.registerRoute)('battleRoyal', () => new BattleRoyalScreen());
    (0, registry_1.registerRoute)('undertown', () => new UndertownScreen());
    (0, registry_1.registerRoute)('arena', () => new DuelArenaScreen('arena', '竞技场'));
    (0, registry_1.registerRoute)('nxArena', () => new DuelArenaScreen('arena', 'NX 竞技'));
    (0, registry_1.registerRoute)('monkeyFight', () => new DuelArenaScreen('monkeyFight', '斗猿场'));
    (0, registry_1.registerRoute)('apeRabbit', () => new DuelArenaScreen('monkeyFight', '猿兔对战'));
    (0, registry_1.registerRoute)('beast', () => new DuelArenaScreen('arena', '动物挑战'));
    (0, registry_1.registerRoute)('boss', () => new BossScreen());
    (0, registry_1.registerRoute)('rocksMonkeyKing', () => new DuelArenaScreen('monkeyFight', '岩石猴王'));
    (0, registry_1.registerRoute)('dagger', () => new DaggerScreen());
    (0, registry_1.registerRoute)('robbery', () => new RobberyScreen());
}
