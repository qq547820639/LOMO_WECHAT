"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomeLobbyScreen = void 0;
/**
 * 主城大厅（home）—— 原产品一级循环入口：公告 / 签到 / 核心玩法宫格 / 全部功能索引。
 */
const base_1 = require("./base");
const theme_1 = require("../core/theme");
const registry_1 = require("./registry");
const registry_2 = require("./registry");
const data_gen_1 = require("../../../shared/src/gen/data.gen");
const brand_1 = require("../../../shared/src/brand");
class HomeLobbyScreen extends base_1.ApiScreen {
    constructor() {
        super('home', brand_1.BRAND.homeTitle);
        this.route = '/home';
        this.minerClip = null;
    }
    onEnter() {
        // P0-1 图像层常驻展示位：真实 APK 矿工帧序列（缺图时自动占位）
        if (!this.minerClip && this.app.assets) {
            const clip = new (require('../ui/frame_clip').FrameClip)(this.app.assets, 'miner', 'idle', { fitHeight: 40, placeholderColor: theme_1.THEME.gold });
            clip.play();
            this.minerClip = clip;
        }
        return super.onEnter();
    }
    onExit() { this.minerClip = null; }
    render() {
        var _a, _b, _c, _d;
        const ui = this.app.ui;
        const top = 64;
        let y = top + 6;
        // 公告
        ui.panel({ x: 12, y, w: ui.w - 24, h: 46 }, theme_1.THEME.panel2);
        ui.text('📢 ' + brand_1.BRAND.announcements[0], 24, y + 19, { size: 10, color: theme_1.THEME.gold });
        ui.text(brand_1.BRAND.announcements[1], 24, y + 34, { size: 9, color: theme_1.THEME.textDim });
        (_a = this.minerClip) === null || _a === void 0 ? void 0 : _a.draw(ui, ui.w - 44, y + 23, this.app.frameDt);
        y += 54;
        // 核心宫格（两行）
        const core = [
            ['battleRoyal', '大逃杀', theme_1.THEME.accent],
            ['undertown', '地下城', theme_1.THEME.purple],
            ['arena', '竞技场', theme_1.THEME.accent2],
            ['apeMine', '矿场', theme_1.THEME.gold],
            ['cards', '卡牌', theme_1.THEME.green],
            ['daily', '签到', theme_1.THEME.accent],
        ];
        const cw = (ui.w - 24 - 2 * 8) / 3;
        core.forEach(([id, label, color], i) => {
            const cx = 12 + (i % 3) * (cw + 8);
            const cy = y + Math.floor(i / 3) * 62;
            ui.panel({ x: cx, y: cy, w: cw, h: 56 }, theme_1.THEME.panel);
            ui.textCenter(label, cx + cw / 2, cy + 26, { size: 14, bold: true, color });
            ui.textCenter('进入 ›', cx + cw / 2, cy + 44, { size: 9, color: theme_1.THEME.textDim });
            ui.hits.push({ x: cx, y: cy, w: cw, h: 56, onTap: () => (0, registry_2.openFeature)(this.app, id), id: 'core-' + id });
        });
        y += 62 * 2 + 8;
        // 生态入口（全部 keep/defer 族）
        ui.text('全部功能', 16, y + 12, { size: 13, bold: true });
        y += 18;
        const list = data_gen_1.FEATURES.filter((f) => this.app.profile === 'full-clone' || f.release !== 'cut');
        const rw = (ui.w - 24 - 3 * 6) / 4;
        list.forEach((f, i) => {
            const rx = 12 + (i % 4) * (rw + 6);
            const ry = y + Math.floor(i / 4) * 44;
            ui.button({ x: rx, y: ry, w: rw, h: 38 }, f.title.slice(0, 4), () => (0, registry_2.openFeature)(this.app, f.id), { size: 10, color: f.release === 'keep' ? theme_1.THEME.panel2 : theme_1.THEME.bg2 });
        });
        y += Math.ceil(list.length / 4) * 44 + 8;
        const p = this.app.player;
        if (p) {
            ui.text(`今日循环: 金币 ${(0, theme_1.fmtNum)((_b = p.balances) === null || _b === void 0 ? void 0 : _b.COIN)} · 体力 ${(0, theme_1.fmtNum)((_c = p.balances) === null || _c === void 0 ? void 0 : _c.ENERGY)} · 奖券 ${(0, theme_1.fmtNum)((_d = p.balances) === null || _d === void 0 ? void 0 : _d.TICKET)}`, 16, y, { size: 10, color: theme_1.THEME.textDim });
        }
    }
}
exports.HomeLobbyScreen = HomeLobbyScreen;
(0, registry_1.registerRoute)('home', () => new HomeLobbyScreen());
