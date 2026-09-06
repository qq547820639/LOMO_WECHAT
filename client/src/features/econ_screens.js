"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyScreen = exports.BoxScreen = exports.CardsScreen = exports.GachaScreen = exports.WarcraftScreen = exports.UniverseScreen = exports.MultiplePitScreen = exports.GoldMineScreen = exports.ApeMineScreen = exports.ApeOverviewScreen = void 0;
exports.registerEconScreens = registerEconScreens;
/**
 * 生产/养成屏幕：猿岛矿场 / 黄金矿场 / 多人矿坑 / 宇宙 / 魔兽 / 萌宠扭蛋 / 卡牌 / 盲盒 / 每日。
 */
const base_1 = require("./base");
const router_1 = require("../core/router");
const theme_1 = require("../core/theme");
const registry_1 = require("./registry");
// ---------------- 猿岛总览 ----------------
class ApeOverviewScreen extends router_1.Screen {
    constructor() {
        super(...arguments);
        this.route = '/ape';
        this.title = '猿岛总览';
        this.minerClip = null;
    }
    onEnter() {
        if (!this.minerClip && this.app.assets) {
            const clip = new (require('../ui/frame_clip').FrameClip)(this.app.assets, 'miner', 'idle', { fitHeight: 86, placeholderColor: theme_1.THEME.gold });
            clip.play();
            this.minerClip = clip;
        }
    }
    onExit() { this.minerClip = null; }
    render() {
        var _a, _b, _c, _d;
        const ui = this.app.ui;
        const top = 64;
        const p = this.app.player;
        let y = top + 6;
        ui.panel({ x: 12, y, w: ui.w - 24, h: 116 }, theme_1.THEME.panel);
        (_a = this.minerClip) === null || _a === void 0 ? void 0 : _a.draw(ui, ui.w - 62, y + 52, this.app.frameDt);
        ui.text('猿岛基地', 24, y + 25, { size: 18, bold: true, color: theme_1.THEME.gold });
        ui.text(`${(_b = p === null || p === void 0 ? void 0 : p.nick) !== null && _b !== void 0 ? _b : '玩家'} · Lv.${(_c = p === null || p === void 0 ? void 0 : p.level) !== null && _c !== void 0 ? _c : 1}`, 24, y + 49, { size: 12, color: theme_1.THEME.text });
        const b = (_d = p === null || p === void 0 ? void 0 : p.balances) !== null && _d !== void 0 ? _d : {};
        ui.text(`宝石 ${(0, theme_1.fmtNum)(b.GEMSTONE)} · 金沙 ${(0, theme_1.fmtNum)(b.SAND)} · 猿石 ${(0, theme_1.fmtNum)(b.APE_STONE)}`, 24, y + 70, { size: 11, color: theme_1.THEME.textDim });
        ui.text('从生产、探索到养成，所有成长资源在此汇合', 24, y + 92, { size: 10, color: theme_1.THEME.textDim });
        y += 128;
        const entries = [
            ['apeMine', '猿岛矿场', '定时生产宝石与金沙'],
            ['goldMine', '黄金矿场', '挖矿、精炼与 NPC 兑换'],
            ['gacha', '萌宠扭蛋', '收集部件并提升战力'],
            ['universe', '宇宙探索', '探索星球与升级飞艇'],
            ['undertown', '地下城', '逐层破砖获取宝石'],
        ];
        entries.forEach(([id, label, note], i) => {
            const h = 58;
            ui.panel({ x: 12, y, w: ui.w - 24, h: h - 6 }, theme_1.THEME.panel2);
            ui.text(label, 24, y + 22, { size: 14, bold: true });
            ui.text(note, 24, y + 41, { size: 10, color: theme_1.THEME.textDim });
            ui.text('进入 ›', ui.w - 66, y + 31, { size: 10, color: theme_1.THEME.accent2 });
            ui.hits.push({ x: 12, y, w: ui.w - 24, h: h - 6, onTap: () => (0, registry_1.openFeature)(this.app, id), id: `ape-${id}` });
            y += h;
        });
    }
}
exports.ApeOverviewScreen = ApeOverviewScreen;
// ---------------- 猿岛矿场 ----------------
class ApeMineScreen extends base_1.ApiScreen {
    constructor() {
        super('apeMine', '猿岛矿场');
        this.route = '/apeMine';
    }
    pollMs() { return 5000; }
    render() {
        var _a, _b, _c;
        const ui = this.app.ui;
        const top = 64;
        if (this.renderStatus(ui, top))
            return;
        const st = this.state;
        let y = top + 6;
        ui.panel({ x: 12, y, w: ui.w - 24, h: 52 }, theme_1.THEME.panel);
        ui.text(`宝石 ${(0, theme_1.fmtNum)(st.gemstone)} · 金沙 ${(0, theme_1.fmtNum)(st.sand)} · 好友矿加成 +${(st.friendMineBonus * 100).toFixed(0)}%`, 24, y + 20, { size: 12, bold: true });
        ui.text('矿坑定时产出宝石+金沙；开采时勾选好友矿可加速 20%', 24, y + 40, { size: 10, color: theme_1.THEME.textDim });
        y += 60;
        st.pits.forEach((pit) => {
            var _a;
            ui.panel({ x: 12, y, w: ui.w - 24, h: 62 }, pit.unlocked ? theme_1.THEME.panel : theme_1.THEME.bg2);
            ui.text(`${pit.idx} 号矿坑${pit.unlocked ? '' : '（未解锁）'}`, 24, y + 20, { size: 13, bold: !pit.unlocked ? false : true, color: pit.unlocked ? theme_1.THEME.text : theme_1.THEME.disabled });
            if (!pit.unlocked) {
                const cost = (_a = [0, 20, 60, 150][pit.idx - 1]) !== null && _a !== void 0 ? _a : 999;
                ui.button({ x: ui.w - 130, y: y + 12, w: 104, h: 36 }, `解锁(${cost}宝石)`, () => this.act('unlockPit', { pitIdx: pit.idx }), { size: 11, color: theme_1.THEME.gold });
            }
            else if (pit.ready) {
                ui.text('产出可收取！', 24, y + 40, { size: 11, color: theme_1.THEME.green });
                ui.button({ x: ui.w - 130, y: y + 12, w: 104, h: 36 }, '收取', () => this.act('claimPit', { pitIdx: pit.idx }), { color: theme_1.THEME.green });
            }
            else if (pit.working) {
                ui.text(`生产中 · 剩 ${(0, theme_1.fmtTime)(pit.readyInSeconds * 1000)}`, 24, y + 40, { size: 11, color: theme_1.THEME.gold });
                ui.progress(24, y + 52, ui.w - 170, 5, 1 - pit.readyInSeconds / (pit.durationMinutes * 60), theme_1.THEME.purple);
            }
            else {
                ui.text(`空闲 · 单次 ${pit.durationMinutes} 分钟`, 24, y + 40, { size: 11, color: theme_1.THEME.textDim });
                ui.button({ x: ui.w - 210, y: y + 12, w: 90, h: 36 }, '开采', () => this.act('startPit', { pitIdx: pit.idx }), { size: 11, color: theme_1.THEME.accent2 });
                ui.button({ x: ui.w - 114, y: y + 12, w: 90, h: 36 }, '好友矿', () => this.act('startPit', { pitIdx: pit.idx, withFriend: true }), { size: 11, color: theme_1.THEME.purple });
            }
            y += 68;
        });
        ui.text('记录: ' + ((_c = (_b = (_a = st.history) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.summary) !== null && _c !== void 0 ? _c : '暂无'), 16, y + 8, { size: 10, color: theme_1.THEME.textDim });
    }
}
exports.ApeMineScreen = ApeMineScreen;
// ---------------- 黄金矿场 ----------------
class GoldMineScreen extends base_1.ApiScreen {
    constructor() {
        super('goldMine', '黄金矿场');
        this.route = '/goldMine';
        this.minerClip = null;
        this.bgClip = null;
    }
    onEnter() {
        if (!this.bgClip && this.app.assets) {
            try {
                this.bgClip = new (require('../ui/frame_clip').FrameClip)(this.app.assets, 'pag__bg_starship', 'launch', { loop: true, fitHeight: 60 });
                this.bgClip.play();
            }
            catch {
                this.bgClip = null;
            }
        }
        // P0-1 demo：真实 APK 矿工帧序列（game-assets/miner，构建期入包 assets/game/）
        if (!this.minerClip && this.app.assets) {
            const clip = new (require('../ui/frame_clip').FrameClip)(this.app.assets, 'miner', 'idle', { fitHeight: 64, placeholderColor: theme_1.THEME.gold });
            clip.play();
            this.minerClip = clip;
        }
        return super.onEnter();
    }
    onExit() {
        this.minerClip = null; // 屏幕 pop 即释放引用（图集本身由 AssetManager LRU 管理）
    }
    render() {
        var _a, _b, _c, _d;
        const ui = this.app.ui;
        const top = 64;
        if (this.renderStatus(ui, top))
            return;
        const st = this.state;
        let y = top + 6;
        ui.panel({ x: 12, y, w: ui.w - 24, h: 66 }, theme_1.THEME.panel);
        ui.text(`矿石 ${(0, theme_1.fmtNum)(st.ore)} · 黄金 ${(0, theme_1.fmtNum)(st.gold)}`, 24, y + 20, { size: 13, bold: true, color: theme_1.THEME.gold });
        ui.progress(24, y + 34, ui.w - 48, 8, st.stamina / st.maxStamina, theme_1.THEME.green);
        ui.text(`矿工体力 ${st.stamina}/${st.maxStamina} · 交易模式: ${st.tradeMode === 'npc-exchange' ? 'NPC 兑换' : '沙盒市场'}`, 24, y + 56, { size: 10, color: theme_1.THEME.textDim });
        // 矿工帧动画（P0-1 图像层验证位；缺图时为占位块）
        (_a = this.minerClip) === null || _a === void 0 ? void 0 : _a.draw(ui, ui.w - 52, y + 30, this.app.frameDt);
        y += 76;
        const bw = (ui.w - 24 - 12) / 3;
        ui.button({ x: 12, y, w: bw, h: 46 }, '挖矿(-10体力)', () => this.act('dig'), { color: theme_1.THEME.gold });
        ui.button({ x: 12 + bw + 6, y, w: bw, h: 46 }, `精炼(${st.npcExchangeRate * 2}矿→金)`, () => this.act('refine'), { color: theme_1.THEME.accent2 });
        ui.button({ x: 12 + (bw + 6) * 2, y, w: bw, h: 46 }, '兑猿石 x1', () => this.act('tradeOre', { qty: 1 }), { color: theme_1.THEME.purple });
        y += 56;
        ui.text('挖掘→精炼成黄金；矿石可按 10:1 兑换猿石', 16, y + 8, { size: 10, color: theme_1.THEME.textDim });
        ui.text('记录: ' + ((_d = (_c = (_b = st.history) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.summary) !== null && _d !== void 0 ? _d : '暂无').slice(0, 34), 16, y + 24, { size: 10, color: theme_1.THEME.textDim });
    }
}
exports.GoldMineScreen = GoldMineScreen;
// ---------------- 多人矿坑 ----------------
class MultiplePitScreen extends base_1.ApiScreen {
    constructor() {
        super('multiplePit', '多人矿坑');
        this.route = '/multiplePit';
    }
    pollMs() { return 5000; }
    render() {
        var _a, _b, _c;
        const ui = this.app.ui;
        const top = 64;
        if (this.renderStatus(ui, top))
            return;
        const st = this.state;
        let y = top + 6;
        ui.panel({ x: 12, y, w: ui.w - 24, h: 72 }, theme_1.THEME.panel);
        ui.text(`第 ${st.round} 轮 · ${st.players} 人同采 · 剩 ${(0, theme_1.fmtTime)(st.endsInSeconds * 1000)}`, 24, y + 20, { size: 13, bold: true });
        ui.text(st.joined ? '已参与本轮，等结算领产出' : '参与后本轮结束统一结算（概率 GrandPrize 宝石大奖）', 24, y + 40, { size: 10, color: st.joined ? theme_1.THEME.green : theme_1.THEME.textDim });
        ui.text('RELEASE: GrandPrize 已改固定赛季奖励（defer）', 24, y + 58, { size: 9, color: theme_1.THEME.gold });
        y += 82;
        ui.button({ x: 12, y, w: (ui.w - 30) / 2, h: 46 }, '参与本轮', () => this.act('join'), { color: theme_1.THEME.accent, disabled: st.joined });
        ui.button({ x: 12 + (ui.w - 30) / 2 + 6, y, w: (ui.w - 30) / 2, h: 46 }, '结算上一轮', () => this.act('settle'), { color: theme_1.THEME.green });
        y += 56;
        ui.text('大奖日志: ' + ((_c = (_b = (_a = st.grandPrizeLog) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.summary) !== null && _c !== void 0 ? _c : '暂无').slice(0, 32), 16, y + 8, { size: 10, color: theme_1.THEME.textDim });
    }
}
exports.MultiplePitScreen = MultiplePitScreen;
// ---------------- 宇宙探索 ----------------
class UniverseScreen extends base_1.ApiScreen {
    constructor(featureId = 'universe', title = '宇宙探索') {
        super(featureId, title);
        this.bgClip = null;
    }
    onEnter() {
        if (!this.bgClip && this.app.assets) {
            try {
                this.bgClip = new (require('../ui/frame_clip').FrameClip)(this.app.assets, 'pag__airship', 'launch', { loop: true, fitHeight: 60 });
                this.bgClip.play();
            }
            catch {
                this.bgClip = null;
            }
        }
        return super.onEnter();
    }
    onExit() { this.bgClip = null; }
    render() {
        var _a, _b;
        const ui = this.app.ui;
        const top = 64;
        if (this.renderStatus(ui, top))
            return;
        const st = this.state;
        let y = top + 6;
        ui.panel({ x: 12, y, w: ui.w - 24, h: 80 }, theme_1.THEME.panel);
        (_a = this.bgClip) === null || _a === void 0 ? void 0 : _a.draw(ui, ui.w - 52, y + 34, this.app.frameDt);
        ui.text(`飞船 Lv.${st.shipLevel} · 已探索 ${st.planetsVisited} 星球 · 星尘 ${(0, theme_1.fmtNum)(st.stardust)}`, 24, y + 20, { size: 13, bold: true, color: theme_1.THEME.purple });
        ui.text(`飞船每级探索收益 +10% · 升级需 ${st.upgradeCost} 金币`, 24, y + 40, { size: 10, color: theme_1.THEME.textDim });
        ui.text(`神殿契约: ${st.contractAvailable ? '今日可领' : '今日已完成'}`, 24, y + 60, { size: 11, color: st.contractAvailable ? theme_1.THEME.green : theme_1.THEME.textDim });
        y += 90;
        const bw = (ui.w - 24 - 12) / 3;
        ui.button({ x: 12, y, w: bw, h: 46 }, '探索(-4体力)', () => this.act('explore'), { color: theme_1.THEME.purple });
        ui.button({ x: 12 + bw + 6, y, w: bw, h: 46 }, `升飞船(${st.upgradeCost})`, () => this.act('upgradeShip'), { color: theme_1.THEME.accent2 });
        ui.button({ x: 12 + (bw + 6) * 2, y, w: bw, h: 46 }, '神殿契约', () => this.act('contract'), { color: theme_1.THEME.gold, disabled: !st.contractAvailable });
        y += 56;
        ((_b = st.exploreLog) !== null && _b !== void 0 ? _b : []).slice(0, 5).forEach((h, i) => {
            ui.text(`· ${h.summary}`.slice(0, 40), 16, y + i * 17, { size: 10, color: theme_1.THEME.textDim });
        });
    }
}
exports.UniverseScreen = UniverseScreen;
// ---------------- 猿石魔兽 ----------------
class WarcraftScreen extends base_1.ApiScreen {
    constructor() {
        super('warcraft', '猿石魔兽');
        this.route = '/warcraft';
    }
    render() {
        var _a, _b, _c;
        const ui = this.app.ui;
        const top = 64;
        if (this.renderStatus(ui, top))
            return;
        const st = this.state;
        let y = top + 6;
        ui.panel({ x: 12, y, w: ui.w - 24, h: 66 }, theme_1.THEME.panel);
        ui.text(`猿石 ${(0, theme_1.fmtNum)(st.apeStone)} · 累计召唤 ${st.extracted}`, 24, y + 20, { size: 13, bold: true });
        ui.text(`召唤消耗 ${st.extractCost} 猿石 → 产出矿石 1-4`, 24, y + 40, { size: 10, color: theme_1.THEME.textDim });
        ui.text('原提现/兑换资金链已切除（warcraftFinance cut）', 24, y + 56, { size: 9, color: theme_1.THEME.red });
        y += 76;
        ui.button({ x: 12, y, w: ui.w - 24, h: 46 }, '召唤魔兽', () => this.act('extract'), { color: theme_1.THEME.purple, disabled: st.apeStone < st.extractCost });
        y += 56;
        ui.text('记录: ' + ((_c = (_b = (_a = st.history) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.summary) !== null && _c !== void 0 ? _c : '暂无'), 16, y + 8, { size: 10, color: theme_1.THEME.textDim });
    }
}
exports.WarcraftScreen = WarcraftScreen;
// ---------------- 萌宠扭蛋 ----------------
class GachaScreen extends base_1.ApiScreen {
    constructor() {
        super('gacha', '萌宠扭蛋');
        this.route = '/gacha';
        this.partClips = [];
    }
    onEnter() {
        if (!this.partClips.length && this.app.assets) {
            const slots = ['strengthen__ear_left', 'strengthen__ear_right', 'strengthen__eye_nose', 'strengthen__hand_left'];
            this.partClips = slots.map((sid, i) => {
                try {
                    const clip = new (require('../ui/frame_clip').FrameClip)(this.app.assets, sid, 'launch', { loop: true, fitHeight: 44 });
                    clip.play();
                    return { clip, x: 40 + i * 80 };
                }
                catch {
                    return null;
                }
            }).filter(Boolean);
        }
        return super.onEnter();
    }
    onExit() { this.partClips = []; }
    render() {
        var _a, _b;
        const ui = this.app.ui;
        const top = 64;
        if (this.renderStatus(ui, top))
            return;
        const st = this.state;
        let y = top + 6;
        ui.panel({ x: 12, y, w: ui.w - 24, h: 66 }, theme_1.THEME.panel);
        this.partClips.forEach((pc) => pc.clip.draw(ui, pc.x, y + 36, this.app.frameDt));
        ui.text(`总战力 ${st.power} · 已开蛋 ${st.eggsOpened} · 单蛋 ${st.eggCostCoin} 金币`, 24, y + 20, { size: 13, bold: true, color: theme_1.THEME.accent });
        ui.text(`部位战力: ${Object.entries((_a = st.equipped) !== null && _a !== void 0 ? _a : {}).filter(([, v]) => v).map(([k]) => k).join('/') || '未穿戴'}`, 24, y + 40, { size: 10, color: theme_1.THEME.textDim });
        y += 76;
        const bw = (ui.w - 24 - 12) / 3;
        ui.button({ x: 12, y, w: bw, h: 46 }, '普通蛋(金币)', () => this.act('openEgg', { eggType: 'normal' }), { color: theme_1.THEME.accent });
        ui.button({ x: 12 + bw + 6, y, w: bw, h: 46 }, '勋章蛋(5勋章)', () => this.act('openEgg', { eggType: 'medal' }), { color: theme_1.THEME.purple });
        ui.button({ x: 12 + (bw + 6) * 2, y, w: bw, h: 46 }, '岩石蛋(20猿石)', () => this.act('openEgg', { eggType: 'rock' }), { color: theme_1.THEME.gold });
        y += 56;
        // 背包部件
        ui.text('背包部件（点击穿戴，低战自动分解）', 16, y + 12, { size: 12, color: theme_1.THEME.textDim });
        y += 18;
        const parts = (_b = st.inventory) !== null && _b !== void 0 ? _b : [];
        if (!parts.length)
            ui.text('暂无部件，先开个蛋吧', 24, y + 14, { size: 11, color: theme_1.THEME.textDim });
        parts.slice(0, 8).forEach((p) => {
            ui.panel({ x: 12, y, w: ui.w - 24, h: 34 }, theme_1.THEME.panel);
            const attrs = this.app.ui;
            ui.text(p.part.replace('part_', ' ').toUpperCase() + ` ×${p.qty}`, 24, y + 21, { size: 11 });
            ui.button({ x: ui.w - 92, y: y + 3, w: 76, h: 28 }, '穿戴', () => this.act('equip', { partId: p.part }), { size: 11, color: theme_1.THEME.green });
            y += 38;
        });
    }
}
exports.GachaScreen = GachaScreen;
// ---------------- 卡牌 ----------------
class CardsScreen extends base_1.ApiScreen {
    constructor(featureId = 'cards', title = '卡牌收集与合成') {
        super(featureId, title);
        this.cardsAtlas = null;
    }
    onEnter() {
        if (!this.cardsAtlas && this.app.assets) {
            void this.app.assets.getAtlas('cards').then((a) => { this.cardsAtlas = a; });
        }
        return super.onEnter();
    }
    render() {
        var _a;
        const ui = this.app.ui;
        const top = 64;
        if (this.renderStatus(ui, top))
            return;
        const st = this.state;
        let y = top + 6;
        ui.panel({ x: 12, y, w: ui.w - 24, h: 52 }, theme_1.THEME.panel);
        ui.text(`收藏 ${st.ownedCount} 张 · 积分粉尘 ${(0, theme_1.fmtNum)(st.dust)} · 合成需 ${st.synthNeed} 同名`, 24, y + 20, { size: 12, bold: true });
        ui.text('免费掉落 + 粉尘兑换产出；付费随机抽取已切断', 24, y + 40, { size: 10, color: theme_1.THEME.green });
        y += 60;
        const bw = (ui.w - 24 - 12) / 3;
        ui.button({ x: 12, y, w: bw, h: 42 }, '免费掉落(-1体)', () => this.act('freeDraw'), { color: theme_1.THEME.accent2, size: 11 });
        ui.button({ x: 12 + bw + 6, y, w: bw, h: 42 }, `粉尘合成(${(_a = st.dustSynthCost) !== null && _a !== void 0 ? _a : 30})`, () => this.act('dustSynth'), { color: theme_1.THEME.purple, size: 11 });
        ui.button({ x: 12 + (bw + 6) * 2, y, w: bw, h: 42 }, '一键合成', () => this.act('synth', {}), { color: theme_1.THEME.gold, size: 11 });
        y += 52;
        // 收藏网格
        const cols = 3;
        const cw = (ui.w - 24 - (cols - 1) * 6) / cols;
        st.collection.forEach((c, i) => {
            var _a, _b, _c;
            const cx = 12 + (i % cols) * (cw + 6);
            const cy = y + Math.floor(i / cols) * 66;
            const owned = c.owned > 0;
            ui.panel({ x: cx, y: cy, w: cw, h: 60 }, owned ? theme_1.THEME.panel : theme_1.THEME.bg2);
            if (owned && ((_b = (_a = this.cardsAtlas) === null || _a === void 0 ? void 0 : _a.frameImages) === null || _b === void 0 ? void 0 : _b.get(c.templateId))) {
                const img = this.cardsAtlas.frameImages.get(c.templateId);
                ui.image(img, cx + 2, cy + 2, cw - 4, 56);
                const cc = ui.ctx;
                cc.fillStyle = 'rgba(10,12,24,0.72)';
                cc.fillRect(cx + 2, cy + 12, cw - 4, 46);
            }
            const rarityColor = (_c = { N: theme_1.THEME.textDim, R: theme_1.THEME.accent2, SR: theme_1.THEME.purple, SSR: theme_1.THEME.gold }[c.rarity]) !== null && _c !== void 0 ? _c : theme_1.THEME.text;
            ui.textCenter(owned ? c.name : '???', cx + cw / 2, cy + 18, { size: 10, bold: true, color: owned ? rarityColor : theme_1.THEME.disabled });
            ui.textCenter(`${c.rarity}·战力${c.power}`, cx + cw / 2, cy + 32, { size: 9, color: theme_1.THEME.textDim });
            ui.textCenter(owned ? `持有 ${c.owned}${c.plus ? '+' + c.plus : ''}` : '未获得', cx + cw / 2, cy + 46, { size: 9, color: owned ? theme_1.THEME.green : theme_1.THEME.disabled });
            if (owned) {
                ui.hits.push({ x: cx, y: cy, w: cw, h: 60, onTap: () => {
                        this.app.showModal(c.name, [`稀有度 ${c.rarity} · 战力 ${c.power}`, `类型 ${c.cardType} · 持有 ${c.owned} 张`], [
                            { label: `合成${c.owned >= st.synthNeed ? '' : '(不足)'}`, onTap: () => this.act('synth', { templateId: c.templateId }) },
                            { label: '拆分', onTap: () => { void this.act('split', { templateId: c.templateId }).then(() => this.app.playOverlay('pag__card_split', 1200)); } },
                        ]);
                    }, id: 'card' + i });
            }
        });
        y += Math.ceil(st.collection.length / cols) * 66 + 8;
        ui.text('图鉴进度是长线收集核心；闪卡/星球卡同构', 16, y, { size: 10, color: theme_1.THEME.textDim });
    }
}
exports.CardsScreen = CardsScreen;
// ---------------- 盲盒 ----------------
class BoxScreen extends base_1.ApiScreen {
    constructor(featureId = 'box', title = '盲盒 / 福袋') { super(featureId, title); }
    render() {
        var _a;
        const ui = this.app.ui;
        const top = 64;
        if (this.renderStatus(ui, top))
            return;
        const st = this.state;
        let y = top + 6;
        ui.panel({ x: 12, y, w: ui.w - 24, h: 66 }, theme_1.THEME.panel);
        ui.text(`免费钥匙 ×${st.keys} · 已开 ${st.opened}`, 24, y + 20, { size: 13, bold: true, color: theme_1.THEME.gold });
        ui.text('免费钥匙开箱：金币 70% / 宝石 20% / 卡牌 10%', 24, y + 40, { size: 10, color: theme_1.THEME.textDim });
        ui.text('付费随机获利链路已切断；RELEASE 下此玩法为任务钥匙制', 24, y + 56, { size: 9, color: theme_1.THEME.green });
        y += 76;
        const bw = (ui.w - 24 - 8) / 2;
        ui.button({ x: 12, y, w: bw, h: 48 }, '开箱（1 钥匙）', () => { void this.act('openFree').then(() => this.app.playOverlay('pag__luckybag', 1300)); }, { color: theme_1.THEME.gold, disabled: st.keys < 1 });
        ui.button({ x: 12 + bw + 8, y, w: bw, h: 48 }, '做任务得钥匙(-4体)', () => this.act('earnKey'), { color: theme_1.THEME.accent2 });
        y += 58;
        ((_a = st.history) !== null && _a !== void 0 ? _a : []).slice(0, 6).forEach((h, i) => {
            ui.text(`· ${h.summary}`.slice(0, 40), 16, y + i * 17, { size: 10, color: theme_1.THEME.textDim });
        });
    }
}
exports.BoxScreen = BoxScreen;
// ---------------- 每日签到/任务 ----------------
class DailyScreen extends base_1.ApiScreen {
    constructor(featureId = 'daily', title = '每日签到与任务') { super(featureId, title); }
    render() {
        var _a;
        const ui = this.app.ui;
        const top = 64;
        if (this.renderStatus(ui, top))
            return;
        const st = this.state;
        let y = top + 6;
        ui.panel({ x: 12, y, w: ui.w - 24, h: 60 }, theme_1.THEME.panel);
        ui.text(st.checkedToday ? '今日已签到 ✓' : '今日未签到', 24, y + 22, { size: 14, bold: true, color: st.checkedToday ? theme_1.THEME.green : theme_1.THEME.gold });
        ui.text(`连续签到 ${st.streak} 天（每 7 天里程碑奖券 +2）`, 24, y + 42, { size: 11, color: theme_1.THEME.textDim });
        y += 70;
        ui.button({ x: 12, y, w: ui.w - 24, h: 46 }, st.checkedToday ? '已签到' : '签到', () => { void this.act('checkin').then(() => this.app.playOverlay('pag__pag_levelup', 1300)); }, { color: theme_1.THEME.accent, disabled: st.checkedToday });
        y += 58;
        ui.text('每日任务', 16, y + 12, { size: 13, bold: true });
        y += 20;
        (_a = st.tasks) === null || _a === void 0 ? void 0 : _a.forEach((t) => {
            var _a, _b;
            ui.panel({ x: 12, y, w: ui.w - 24, h: 40 }, theme_1.THEME.panel);
            ui.text(t.label, 24, y + 24, { size: 12 });
            const reward = (_b = (_a = st.taskRewards) === null || _a === void 0 ? void 0 : _a[t.id]) !== null && _b !== void 0 ? _b : 15;
            ui.text(`${t.done === 2 ? '已领' : t.done ? '可领' : '未完成'} +${reward}金币`, ui.w - 130, y + 24, { size: 11, color: t.done === 2 ? theme_1.THEME.textDim : t.done ? theme_1.THEME.green : theme_1.THEME.textDim });
            ui.button({ x: ui.w - 90, y: y + 5, w: 74, h: 30 }, t.done === 2 ? '已完成' : '领取', () => this.act('claimTask', { taskId: t.id }), { size: 11, disabled: t.done !== 1, color: theme_1.THEME.green });
            y += 46;
        });
    }
}
exports.DailyScreen = DailyScreen;
function registerEconScreens() {
    (0, registry_1.registerRoute)('ape', () => new ApeOverviewScreen());
    (0, registry_1.registerRoute)('apeMine', () => new ApeMineScreen());
    (0, registry_1.registerRoute)('goldMine', () => new GoldMineScreen());
    (0, registry_1.registerRoute)('multiplePit', () => new MultiplePitScreen());
    (0, registry_1.registerRoute)('universe', () => new UniverseScreen());
    (0, registry_1.registerRoute)('airship', () => new UniverseScreen('airship', '飞艇运输'));
    (0, registry_1.registerRoute)('warcraft', () => new WarcraftScreen());
    (0, registry_1.registerRoute)('gacha', () => new GachaScreen());
    (0, registry_1.registerRoute)('cards', () => new CardsScreen());
    (0, registry_1.registerRoute)('flashCard', () => new CardsScreen('flashCard', '闪卡卡柜'));
    (0, registry_1.registerRoute)('digitalGallery', () => new CardsScreen('digitalGallery', '数字图鉴'));
    (0, registry_1.registerRoute)('box', () => new BoxScreen());
    (0, registry_1.registerRoute)('luckyBag', () => new BoxScreen('luckyBag', '幸运袋'));
    (0, registry_1.registerRoute)('daily', () => new DailyScreen());
    (0, registry_1.registerRoute)('punchIn', () => new DailyScreen('punchIn', '打卡挑战'));
}
