"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FEATURES = exports.HomeHub = void 0;
/**
 * 五大 Tab 枢纽（Section 17：潮玩 / 猿宇宙 / 游戏 / 交易 / 我的）。
 * 内容按 data.gen FEATURES 生成；每项显示标题 + 发布策略标签；点击进入对应玩法页。
 * 首页(home tab 内容)增加签到/任务/邮件/公告入口与大逃杀等核心入口快捷方式。
 */
const router_1 = require("../core/router");
const theme_1 = require("../core/theme");
const registry_1 = require("./registry");
const data_gen_1 = require("../../../shared/src/gen/data.gen");
Object.defineProperty(exports, "FEATURES", { enumerable: true, get: function () { return data_gen_1.FEATURES; } });
class HomeHub extends router_1.Screen {
    constructor(tab) {
        var _a;
        super();
        this.homeData = null;
        this.announcements = [
            '全量复刻版：680 页面路由已映射，567 个一方业务页面全部建立迁移状态',
            '大逃杀 · 地下城 · 竞技场 · 矿场 · 宇宙探索 全部服务端权威结算',
            'WECHAT RELEASE：现金钱包/提现/下注/现金红包/竞拍已三层关闭',
        ];
        this.tab = tab;
        this.route = '/' + tab;
        this.title = (_a = { chaowan: '潮玩', ape: '猿宇宙', games: '游戏', trade: '交易', mine: '我的' }[tab]) !== null && _a !== void 0 ? _a : tab;
    }
    onEnter() {
        if (this.tab === 'mine') {
            return this.run(async () => {
                const [daily, mails] = await Promise.all([this.app.api.action('daily', 'noop').catch(() => null), this.app.api.get('/v1/mail')]);
                this.homeData = { mails: (mails === null || mails === void 0 ? void 0 : mails.ok) ? mails.mails : [] };
            });
        }
        return Promise.resolve();
    }
    pollMs() { return this.tab === 'mine' ? 30000 : 0; }
    render() {
        var _a, _b;
        const ui = this.app.ui;
        const top = 64;
        const bottom = this.app.ui.h - 54;
        const feats = (0, registry_1.featuresForTab)(this.tab, this.app.profile);
        let y = top + 8;
        if (this.tab === 'mine') {
            // 用户卡
            ui.panel({ x: 12, y, w: ui.w - 24, h: 84 }, theme_1.THEME.panel);
            const p = this.app.player;
            if (p) {
                ui.text(`${p.nick}`, 24, y + 24, { size: 16, bold: true });
                ui.text(`Lv.${p.level} · ${p.xp}/${p.xpToNext} XP`, 24, y + 44, { size: 12, color: theme_1.THEME.textDim });
                const bal = p.balances || {};
                ui.text(`金币 ${(0, theme_1.fmtNum)(bal.COIN)} · 体力 ${(0, theme_1.fmtNum)(bal.ENERGY)} · 宝石 ${(0, theme_1.fmtNum)(bal.GEMSTONE)}`, 24, y + 64, { size: 12, color: theme_1.THEME.gold });
            }
            const entries = [
                ['每日签到', 'daily', () => (0, registry_1.openFeature)(this.app, 'daily')],
                ['记录中心', 'records', () => registry_1.SCREEN_ROUTES['records'] ? this.app.router.push(registry_1.SCREEN_ROUTES['records']()) : 0],
                ['排行榜', 'rank', () => this.app.router.push(registry_1.SCREEN_ROUTES['rank']())],
                ['邮件', 'mail', () => this.app.router.push(registry_1.SCREEN_ROUTES['mail']())],
                ['好友/邀请', 'social', () => (0, registry_1.openFeature)(this.app, 'social')],
                ['设置', 'profile', () => this.app.router.push(registry_1.SCREEN_ROUTES['profile']())],
            ];
            const cw = (ui.w - 24 - 12) / 3;
            entries.forEach(([label, id, onTap], i) => {
                const ex = 12 + (i % 3) * (cw + 6);
                const ey = y + 94 + Math.floor(i / 3) * 52;
                ui.button({ x: ex, y: ey, w: cw, h: 46 }, label, onTap, { color: theme_1.THEME.panel2 });
            });
            y += 94 + Math.ceil(entries.length / 3) * 52 + 8;
        }
        if (this.tab === 'games') {
            // 快捷入口：核心玩法
            ui.panel({ x: 12, y, w: ui.w - 24, h: 52 }, theme_1.THEME.panel2);
            ui.text('核心玩法 · 服务端权威结算 · 单局短平快', 24, y + 20, { size: 12, color: theme_1.THEME.textDim });
            ui.text('大逃杀 / 地下城 / 竞技场 / Boss / 弹珠 / 虎口逃生', 24, y + 38, { size: 11, color: theme_1.THEME.gold });
            y += 60;
        }
        if (this.tab === 'trade') {
            ui.panel({ x: 12, y, w: ui.w - 24, h: 52 }, theme_1.THEME.panel2);
            const sandbox = this.app.profile === 'full-clone';
            ui.text(sandbox ? 'FULL CLONE：完整交易生态 UI（沙盒资产 TEST_CREDIT）' : 'RELEASE：交易生态已按合规三层关闭', 24, y + 20, { size: 11, color: sandbox ? theme_1.THEME.gold : theme_1.THEME.red });
            ui.text(sandbox ? '市场 / 寄售 / 竞拍 / 订单 / 店长 全链路可操作' : '原交易玩法转为 NPC 兑换与赛季积分', 24, y + 38, { size: 11, color: theme_1.THEME.textDim });
            y += 60;
        }
        if (this.tab === 'chaowan') {
            ui.panel({ x: 12, y, w: ui.w - 24, h: 52 }, theme_1.THEME.panel2);
            ui.text('潮玩生态：卡牌收集 / 合成 / 盲盒 / 图鉴 / 商城', 24, y + 20, { size: 12, color: theme_1.THEME.textDim });
            ui.text('付费随机链路已切断，全部为免费产出与固定兑换', 24, y + 38, { size: 11, color: theme_1.THEME.green });
            y += 60;
        }
        if (this.tab === 'ape') {
            ui.panel({ x: 12, y, w: ui.w - 24, h: 52 }, theme_1.THEME.panel2);
            ui.text('猿宇宙：矿场生产 / 宝石金沙 / 扭蛋养成 / 地下城 / 宇宙', 24, y + 20, { size: 12, color: theme_1.THEME.textDim });
            y += 60;
        }
        // 功能族列表
        const rowH = 52;
        for (const f of feats) {
            const policyColor = f.release === 'keep' ? theme_1.THEME.green : f.release === 'defer' ? theme_1.THEME.gold : theme_1.THEME.red;
            const policyLabel = (_a = { keep: '上线', defer: '延后', cut: '仅生态保留' }[f.release]) !== null && _a !== void 0 ? _a : f.release;
            if (f.release === 'cut' && this.app.profile === 'wechat-release')
                continue;
            ui.panel({ x: 12, y, w: ui.w - 24, h: rowH - 6 }, theme_1.THEME.panel);
            ui.text(f.title, 24, y + 22, { size: 14, bold: true });
            ui.text(f.notes.slice(0, 34), 24, y + 39, { size: 10, color: theme_1.THEME.textDim });
            ui.text(policyLabel, ui.w - 66, y + 22, { size: 11, color: policyColor, bold: true });
            ui.text('›', ui.w - 30, y + 24, { size: 16, color: theme_1.THEME.textDim });
            const ff = f;
            ui.hits.push({ x: 12, y: y - 3, w: ui.w - 24, h: rowH, onTap: () => { this.app.telemetry('feature_enter', { feature: ff.id }); (0, registry_1.openFeature)(this.app, ff.id); }, id: 'f-' + ff.id });
            y += rowH;
        }
        if (this.tab === 'mine') {
            ui.text('版本: LOMO 4.3.7 → 微信小游戏迁移 · ' + this.app.profile, 16, y + 10, { size: 10, color: theme_1.THEME.textDim });
            ui.text('证据等级: 结构 MATCHED / 数值 INFERRED(RemoteConfig)', 16, y + 26, { size: 10, color: theme_1.THEME.textDim });
        }
        this.app.ui.scrollOffsets['hub-' + this.tab] = (_b = this.app.ui.scrollOffsets['hub-' + this.tab]) !== null && _b !== void 0 ? _b : 0;
    }
}
exports.HomeHub = HomeHub;
