"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileScreen = exports.SocialScreen = exports.MailScreen = exports.RankScreen = exports.RecordsScreen = void 0;
exports.registerSocialScreens = registerSocialScreens;
/**
 * 我的/社交屏幕：记录中心 / 排行 / 邮件 / 好友邀请 / 设置 / 实名状态。
 */
const base_1 = require("./base");
const router_1 = require("../core/router");
const theme_1 = require("../core/theme");
const registry_1 = require("./registry");
// ---------------- 记录中心 ----------------
class RecordsScreen extends base_1.ApiScreen {
    constructor() {
        super('records', '记录中心');
        this.route = '/records';
        this.featureFilter = '';
    }
    fetchState() {
        return this.app.api.get('/v1/history' + (this.featureFilter ? `?featureId=${this.featureFilter}` : ''));
    }
    render() {
        var _a, _b;
        const ui = this.app.ui;
        const top = 64;
        if (this.renderStatus(ui, top))
            return;
        let y = top + 6;
        const filters = [['', '全部'], ['battleRoyal', '大逃杀'], ['undertown', '地下城'], ['arena', '竞技场'], ['goldMine', '黄金矿场'], ['market', '交易']];
        const fw = (ui.w - 24 - 5 * 4) / 6;
        filters.forEach(([id, label], i) => {
            ui.button({ x: 12 + i * (fw + 4), y, w: fw, h: 30 }, label, () => { this.featureFilter = id; this.onEnter(); }, { size: 10, color: this.featureFilter === id ? theme_1.THEME.accent : theme_1.THEME.panel2 });
        });
        y += 40;
        const rows = (_b = (_a = this.state) === null || _a === void 0 ? void 0 : _a.rows) !== null && _b !== void 0 ? _b : [];
        if (!rows.length)
            ui.text('暂无记录，去玩一局吧', 24, y + 14, { size: 11, color: theme_1.THEME.textDim });
        rows.slice(0, 14).forEach((r) => {
            ui.text(`[${r.featureId}]`.slice(0, 14), 16, y, { size: 10, color: theme_1.THEME.accent2 });
            ui.text(r.summary.slice(0, 26), 100, y, { size: 10 });
            y += 17;
        });
    }
}
exports.RecordsScreen = RecordsScreen;
// ---------------- 排行榜 ----------------
class RankScreen extends router_1.Screen {
    constructor() {
        super(...arguments);
        this.route = '/rank';
        this.title = '排行榜';
        this.board = 'seasonScore';
        this.data = null;
    }
    onEnter() { return this.load(async () => { this.data = await this.app.api.get('/v1/rank/' + this.board); }); }
    async load(fn) { try {
        await fn();
    }
    catch (e) {
        this.error = String((e === null || e === void 0 ? void 0 : e.message) || e);
    } }
    render() {
        var _a, _b;
        const ui = this.app.ui;
        const top = 64;
        let y = top + 6;
        const boards = [['seasonScore', '赛季积分'], ['arenaPower', '竞技场'], ['undertownDepth', '地下城深度'], ['monkeyKingContribution', '炸猴王贡献'], ['robberyScore', '争夺积分'], ['brSurvival', '大逃杀幸存']];
        const bw = (ui.w - 24 - 5 * 4) / 6;
        boards.forEach(([id, label], i) => {
            ui.button({ x: 12 + i * (bw + 4), y, w: bw, h: 30 }, label, () => { this.board = id; this.onEnter(); }, { size: 9, color: this.board === id ? theme_1.THEME.accent : theme_1.THEME.panel2 });
        });
        y += 40;
        if (this.error) {
            ui.textCenter('加载失败', ui.w / 2, y + 20, { size: 12, color: theme_1.THEME.red });
            return;
        }
        const rows = (_b = (_a = this.data) === null || _a === void 0 ? void 0 : _a.rows) !== null && _b !== void 0 ? _b : [];
        rows.slice(0, 15).forEach((r, i) => {
            var _a;
            const medal = (_a = ['🥇', '🥈', '🥉'][i]) !== null && _a !== void 0 ? _a : `${i + 1}.`;
            ui.panel({ x: 12, y, w: ui.w - 24, h: 30 }, r.isSelf ? theme_1.THEME.panel2 : i % 2 ? theme_1.THEME.bg2 : theme_1.THEME.panel);
            ui.text(`${medal}`, 20, y + 20, { size: 12 });
            ui.text(r.nick, 56, y + 20, { size: 12, color: r.isSelf ? theme_1.THEME.gold : theme_1.THEME.text });
            ui.text(String(r.score), ui.w - 40, y + 20, { size: 12, color: theme_1.THEME.green });
            y += 33;
        });
        if (!rows.length)
            ui.textCenter('暂无数据', ui.w / 2, y + 20, { size: 12, color: theme_1.THEME.textDim });
    }
}
exports.RankScreen = RankScreen;
// ---------------- 邮件 ----------------
class MailScreen extends base_1.ApiScreen {
    constructor() {
        super('mail', '邮件');
        this.route = '/mail';
    }
    fetchState() {
        return this.app.api.get('/v1/mail');
    }
    render() {
        var _a, _b;
        const ui = this.app.ui;
        const top = 64;
        if (this.renderStatus(ui, top))
            return;
        let y = top + 6;
        const mails = (_b = (_a = this.state) === null || _a === void 0 ? void 0 : _a.mails) !== null && _b !== void 0 ? _b : [];
        if (!mails.length)
            ui.text('暂无邮件', 24, y + 14, { size: 12, color: theme_1.THEME.textDim });
        mails.slice(0, 10).forEach((m) => {
            var _a;
            ui.panel({ x: 12, y, w: ui.w - 24, h: 56 }, theme_1.THEME.panel);
            ui.text(m.title, 24, y + 19, { size: 12, bold: true, color: m.claimed ? theme_1.THEME.textDim : theme_1.THEME.gold });
            ui.text(m.body.slice(0, 32), 24, y + 36, { size: 10, color: theme_1.THEME.textDim });
            ui.text((_a = m.rewards) === null || _a === void 0 ? void 0 : _a.map((r) => `${r.assetId}+${r.delta}`).join(' '), 24, y + 50, { size: 9, color: theme_1.THEME.green });
            if (!m.claimed)
                ui.button({ x: ui.w - 90, y: y + 10, w: 74, h: 34 }, '领取', () => this.claim(m.mailId), { size: 11, color: theme_1.THEME.accent });
            else
                ui.text('已领取', ui.w - 84, y + 28, { size: 10, color: theme_1.THEME.textDim });
            y += 62;
        });
    }
    async claim(mailId) {
        const r = await this.app.api.post('/v1/mail/claim', { mailId });
        this.app.handleGameResponse(r);
        await this.onEnter();
    }
}
exports.MailScreen = MailScreen;
// ---------------- 好友 / 邀请 ----------------
class SocialScreen extends base_1.ApiScreen {
    constructor() {
        super('social', '好友 / 邀请');
        this.route = '/social';
        this.inviteToken = null;
    }
    fetchState() {
        return this.app.api.get('/v1/social/friends');
    }
    render() {
        var _a, _b;
        const ui = this.app.ui;
        const top = 64;
        if (this.renderStatus(ui, top))
            return;
        let y = top + 6;
        ui.panel({ x: 12, y, w: ui.w - 24, h: 92 }, theme_1.THEME.panel);
        ui.text('邀请裂变（Section 37 合规改造）', 24, y + 20, { size: 13, bold: true });
        ui.text('deep link → 微信分享卡片 + scene 参数 + 服务器邀请 token', 24, y + 40, { size: 10, color: theme_1.THEME.textDim });
        ui.text('防刷: 一码一用 / 不可自邀 / 奖励服务端幂等发放', 24, y + 58, { size: 10, color: theme_1.THEME.textDim });
        if (this.inviteToken)
            ui.text(`我的邀请码: ${this.inviteToken}`, 24, y + 76, { size: 11, color: theme_1.THEME.gold });
        y += 100;
        const bw = (ui.w - 24 - 8) / 2;
        ui.button({ x: 12, y, w: bw, h: 42 }, '生成邀请码', async () => {
            const r = await this.app.api.post('/v1/social/invite/token');
            if (r.ok) {
                this.inviteToken = r.token;
                this.app.showToast('邀请码已生成');
            }
        }, { color: theme_1.THEME.gold });
        ui.button({ x: 12 + bw + 8, y, w: bw, h: 42 }, '分享到微信', () => {
            this.app.platform.share({ title: '一起来玩 LOMO 小游戏！', query: this.inviteToken ? `invite=${this.inviteToken}` : '' });
        }, { color: theme_1.THEME.accent2 });
        y += 52;
        ui.text('好友列表（NPC 同服玩家）', 16, y + 12, { size: 12, color: theme_1.THEME.textDim });
        y += 16;
        for (const f of (_b = (_a = this.state) === null || _a === void 0 ? void 0 : _a.friends) !== null && _b !== void 0 ? _b : []) {
            ui.panel({ x: 12, y, w: ui.w - 24, h: 32 }, theme_1.THEME.panel);
            ui.text(f.nick, 24, y + 20, { size: 11 });
            ui.text(`Lv.${f.level}`, ui.w - 70, y + 20, { size: 10, color: theme_1.THEME.textDim });
            y += 36;
        }
    }
}
exports.SocialScreen = SocialScreen;
// ---------------- 设置 / 实名 ----------------
class ProfileScreen extends router_1.Screen {
    constructor() {
        super(...arguments);
        this.route = '/profile';
        this.title = '设置';
    }
    render() {
        var _a, _b, _c, _d, _e;
        const ui = this.app.ui;
        const top = 64;
        const p = this.app.player;
        let y = top + 6;
        ui.panel({ x: 12, y, w: ui.w - 24, h: 66 }, theme_1.THEME.panel);
        ui.text(`${(_a = p === null || p === void 0 ? void 0 : p.nick) !== null && _a !== void 0 ? _a : '…'} · Lv.${(_b = p === null || p === void 0 ? void 0 : p.level) !== null && _b !== void 0 ? _b : '?'}`, 24, y + 24, { size: 14, bold: true });
        ui.text(`玩家ID ${(_c = p === null || p === void 0 ? void 0 : p.playerId) !== null && _c !== void 0 ? _c : '-'}`, 24, y + 46, { size: 10, color: theme_1.THEME.textDim });
        y += 76;
        const rows = [
            ['登录方式', 'wx.login → 服务端 OpenID → token', 'session_key 不落客户端'],
            ['实名/防沉迷', ((_d = this.app.antiAddiction) === null || _d === void 0 ? void 0 : _d.realNameVerified) ? '已实名（成年）' : '未实名', ((_e = this.app.antiAddiction) === null || _e === void 0 ? void 0 : _e.message) || '接入国家防沉迷体系后由服务端判定'],
            ['音效', this.app.audioManager.sfxOn ? '开' : '关', 'BGM/SFX 统一管理'],
            ['发布配置', this.app.profile, this.app.profile === 'full-clone' ? '沙盒结算，禁真钱闭环' : '现金类能力已三层关闭'],
            ['隐私', '最小必要', '详见 PRIVACY_DATA_MAP.md'],
        ];
        for (const [k, v, note] of rows) {
            ui.panel({ x: 12, y, w: ui.w - 24, h: 52 }, theme_1.THEME.panel);
            ui.text(k, 24, y + 19, { size: 12, bold: true });
            ui.text(v.slice(0, 34), 24, y + 37, { size: 10, color: theme_1.THEME.textDim });
            ui.text(note.slice(0, 22), ui.w - 180, y + 37, { size: 9, color: theme_1.THEME.textDim });
            y += 58;
        }
        y += 4;
        ui.button({ x: 12, y, w: (ui.w - 30) / 2, h: 40 }, this.app.audioManager.bgmOn ? '关闭音乐' : '开启音乐', () => {
            const on = !this.app.audioManager.bgmOn;
            this.app.audioManager.setMute(!on);
            if (on)
                this.app.audioManager.playBgm('home');
        }, { size: 12 });
        ui.button({ x: 12 + (ui.w - 30) / 2 + 6, y, w: (ui.w - 30) / 2, h: 40 }, '清空本地缓存', () => {
            this.app.platform.storageSet('lomo.client.cache', null);
            this.app.showToast('本地缓存已清（服务端数据不受影响）');
        }, { size: 12 });
    }
}
exports.ProfileScreen = ProfileScreen;
function registerSocialScreens() {
    (0, registry_1.registerRoute)('records', () => new RecordsScreen());
    (0, registry_1.registerRoute)('rank', () => new RankScreen());
    (0, registry_1.registerRoute)('mail', () => new MailScreen());
    (0, registry_1.registerRoute)('social', () => new SocialScreen());
    (0, registry_1.registerRoute)('profile', () => new ProfileScreen());
    (0, registry_1.registerRoute)('realName', () => new ProfileScreen());
}
