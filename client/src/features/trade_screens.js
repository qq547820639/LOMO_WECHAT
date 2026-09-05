"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolicyScreen = exports.WalletScreen = exports.AgentScreen = exports.MallScreen = exports.AuctionScreen = exports.MarketScreen = void 0;
exports.registerTradeScreens = registerTradeScreens;
/**
 * 交易生态屏幕（沙盒）+ 商业 + 钱包/结算沙盒桥。
 * FULL: 市场挂单/购买/竞拍/订单/店长 全链路（TEST_CREDIT 沙盒）。
 * RELEASE: 相关路由被服务端三层关闭，页面显示合规替代说明。
 */
const base_1 = require("./base");
const router_1 = require("../core/router");
const theme_1 = require("../core/theme");
const registry_1 = require("./registry");
// ---------------- 市场（挂单/购买） ----------------
class MarketScreen extends base_1.ApiScreen {
    constructor(featureId = 'p2pTrade', title = '交易市场') {
        super(featureId, title);
        this.route = '/market';
        this.listPrice = 50;
    }
    fetchState() {
        return this.app.api.get('/v1/market/listings');
    }
    render() {
        var _a, _b, _c;
        const ui = this.app.ui;
        const top = 64;
        if (this.renderStatus(ui, top))
            return;
        const st = this.state;
        let y = top + 6;
        ui.panel({ x: 12, y, w: ui.w - 24, h: 56 }, theme_1.THEME.panel2);
        ui.text('沙盒市场：卡牌/宝石/金沙 挂单流通（TEST_CREDIT 结算）', 24, y + 20, { size: 11, color: theme_1.THEME.gold });
        ui.text('RELEASE 下本页面及其 API 被三层关闭，转 NPC 兑换', 24, y + 38, { size: 10, color: theme_1.THEME.textDim });
        y += 64;
        // 我的可售物品快捷挂单
        const cards = ((_b = (_a = this.app.player) === null || _a === void 0 ? void 0 : _a.inventory) !== null && _b !== void 0 ? _b : []);
        const sellable = Object.entries(cards).filter(([k, v]) => k.startsWith('card_') && v.qty > 0);
        if (sellable.length) {
            ui.text('挂单我的卡牌', 16, y + 12, { size: 12, color: theme_1.THEME.textDim });
            y += 16;
            const s = sellable[0];
            ui.panel({ x: 12, y, w: ui.w - 24, h: 44 }, theme_1.THEME.panel);
            ui.text(`${s[0]} ×${s[1].qty}`, 24, y + 26, { size: 11 });
            ui.button({ x: ui.w - 170, y: y + 5, w: 70, h: 32 }, `挂${this.listPrice}`, () => this.postList({ templateId: s[0], qty: 1, unitPrice: this.listPrice }), { size: 10, color: theme_1.THEME.gold });
            ui.button({ x: ui.w - 94, y: y + 5, w: 70, h: 32 }, `挂${this.listPrice * 2}`, () => this.postList({ templateId: s[0], qty: 1, unitPrice: this.listPrice * 2 }), { size: 10, color: theme_1.THEME.gold });
            y += 52;
        }
        ui.text('在售挂单', 16, y + 12, { size: 12, color: theme_1.THEME.textDim });
        y += 16;
        const listings = (_c = st.listings) !== null && _c !== void 0 ? _c : [];
        if (!listings.length)
            ui.text('市场空空，去挂一单吧', 24, y + 14, { size: 11, color: theme_1.THEME.textDim });
        listings.slice(0, 8).forEach((l) => {
            var _a, _b;
            ui.panel({ x: 12, y, w: ui.w - 24, h: 44 }, theme_1.THEME.panel);
            const name = (_b = (_a = l.templateId) !== null && _a !== void 0 ? _a : l.assetId) !== null && _b !== void 0 ? _b : '?';
            ui.text(`${l.sellerNick}: ${name} ×${l.qty}`, 24, y + 18, { size: 11 });
            ui.text(`${l.kind === 'auction' ? '竞拍 ' : ''}${(0, theme_1.fmtNum)(l.unitPrice)} 沙盒币${l.kind === 'auction' && l.topBid ? ` (顶价 ${(0, theme_1.fmtNum)(l.topBid)})` : ''}`, 24, y + 34, { size: 10, color: theme_1.THEME.gold });
            ui.button({ x: ui.w - 92, y: y + 5, w: 78, h: 34 }, l.kind === 'auction' ? '出价' : '购买', () => {
                var _a;
                if (l.kind === 'auction')
                    this.app.api.post('/v1/market/bid', { listingId: l.listingId, bid: Math.ceil(((_a = l.topBid) !== null && _a !== void 0 ? _a : l.unitPrice) * 1.1) }).then((r) => this.app.handleGameResponse(r)).then(() => this.onEnter());
                else
                    this.app.api.post('/v1/market/buy', { listingId: l.listingId }).then((r) => this.app.handleGameResponse(r)).then(() => this.onEnter());
            }, { size: 12, color: theme_1.THEME.accent });
            y += 50;
        });
    }
    async postList(body) {
        const r = await this.app.api.post('/v1/market/list', body);
        this.app.handleGameResponse(r);
        await this.onEnter();
    }
}
exports.MarketScreen = MarketScreen;
// ---------------- 竞拍（数字藏品拍卖，沙盒） ----------------
class AuctionScreen extends MarketScreen {
    constructor() {
        super('digitalTrade', '数字竞拍');
        this.route = '/digitalTrade';
    }
}
exports.AuctionScreen = AuctionScreen;
// ---------------- 商城/订单（mock 支付合同） ----------------
class MallScreen extends base_1.ApiScreen {
    constructor() {
        super('mall', '商城 / 订单');
        this.route = '/mall';
    }
    fetchState() {
        return this.app.api.get('/v1/mall/goods');
    }
    render() {
        var _a;
        const ui = this.app.ui;
        const top = 64;
        if (this.renderStatus(ui, top))
            return;
        const st = this.state;
        let y = top + 6;
        ui.panel({ x: 12, y, w: ui.w - 24, h: 48 }, theme_1.THEME.panel2);
        ui.text('mock 支付合同：正式版需平台支付回调后幂等发货', 24, y + 20, { size: 10, color: theme_1.THEME.gold });
        ui.text('RELEASE: 实物商城拆独立小程序，此处仅虚拟商品', 24, y + 36, { size: 10, color: theme_1.THEME.textDim });
        y += 56;
        for (const g of (_a = st.goods) !== null && _a !== void 0 ? _a : []) {
            ui.panel({ x: 12, y, w: ui.w - 24, h: 48 }, theme_1.THEME.panel);
            ui.text(g.title, 24, y + 19, { size: 12, bold: true });
            ui.text(g.kind === 'physical' ? '实物（沙盒）' : g.kind === 'claim' ? '提货券' : '虚拟', 24, y + 36, { size: 10, color: theme_1.THEME.textDim });
            ui.text(`${g.priceCoin ? g.priceCoin + ' 金币' : ''}${g.priceIntegral ? ' ' + g.priceIntegral + ' 积分' : ''}`, ui.w - 130, y + 19, { size: 11, color: theme_1.THEME.gold });
            ui.button({ x: ui.w - 92, y: y + 7, w: 78, h: 34 }, '购买', () => this.buy(g.goodsId), { size: 12, color: theme_1.THEME.accent });
            y += 54;
        }
    }
    async buy(goodsId) {
        var _a, _b, _c;
        const r = await this.app.api.post('/v1/mall/order', { goodsId });
        this.app.handleGameResponse(r);
        if (r.ok)
            this.app.showModal('下单成功', [(_a = r.note) !== null && _a !== void 0 ? _a : '', `订单号 ${(_b = r.order) === null || _b === void 0 ? void 0 : _b.orderId}`, ((_c = r.order) === null || _c === void 0 ? void 0 : _c.status) === 'DONE' ? '虚拟商品已发放' : '实物订单已进入履约状态（沙盒）']);
    }
}
exports.MallScreen = MallScreen;
// ---------------- 店长/代理（沙盒模型） ----------------
class AgentScreen extends base_1.ApiScreen {
    constructor() {
        super('agent', '店长 / 代理');
        this.route = '/agent';
    }
    fetchState() {
        return this.app.api.get('/v1/agent/summary');
    }
    render() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        const ui = this.app.ui;
        const top = 64;
        if (this.renderStatus(ui, top))
            return;
        const st = this.state;
        let y = top + 6;
        ui.panel({ x: 12, y, w: ui.w - 24, h: 100 }, theme_1.THEME.panel);
        ui.text(`代理等级 Lv.${(_a = st.level) !== null && _a !== void 0 ? _a : 1}`, 24, y + 22, { size: 14, bold: true, color: theme_1.THEME.gold });
        ui.text(`销售订单 ${(_c = (_b = st.sales) === null || _b === void 0 ? void 0 : _b.orders) !== null && _c !== void 0 ? _c : 0} · 营收 ${(0, theme_1.fmtNum)((_e = (_d = st.sales) === null || _d === void 0 ? void 0 : _d.revenueTestCredit) !== null && _e !== void 0 ? _e : 0)} 沙盒币`, 24, y + 44, { size: 11 });
        ui.text(`佣金比例 ${((_g = (_f = st.commission) === null || _f === void 0 ? void 0 : _f.rate) !== null && _g !== void 0 ? _g : 0.05 * 100).toFixed(0)}% · 已结 ${(0, theme_1.fmtNum)((_j = (_h = st.commission) === null || _h === void 0 ? void 0 : _h.paidTestCredit) !== null && _j !== void 0 ? _j : 0)}`, 24, y + 62, { size: 11 });
        ui.text((_k = st.notice) !== null && _k !== void 0 ? _k : '', 24, y + 84, { size: 10, color: theme_1.THEME.red });
        y += 110;
        ui.text('RELEASE: 代理/保证金/分销提现体系默认关闭，需独立合法业务方案后评估', 16, y, { size: 10, color: theme_1.THEME.textDim });
    }
}
exports.AgentScreen = AgentScreen;
// ---------------- 钱包 / 结算沙盒桥 ----------------
class WalletScreen extends base_1.ApiScreen {
    constructor() {
        super('walletCash', '钱包 / 资产');
        this.route = '/walletCash';
        this.sandboxBalance = null;
    }
    onEnter() {
        return this.run(async () => {
            await this.refreshBalances();
        });
    }
    async refreshBalances() {
        const [ledger, sandbox] = await Promise.all([
            this.app.api.get('/v1/economy/ledger?limit=15'),
            this.app.api.post('/v1/settlement/balance').catch(() => null),
        ]);
        this.state = { ledger: ledger.ok ? ledger.entries : [], invariants: ledger.ok ? ledger.invariants : null };
        this.sandboxBalance = (sandbox === null || sandbox === void 0 ? void 0 : sandbox.ok) ? sandbox.displayAmount : null;
    }
    render() {
        var _a, _b, _c, _d;
        const ui = this.app.ui;
        const top = 64;
        if (!this.app.player) {
            ui.textCenter('加载中…', ui.w / 2, top + 40, { size: 12 });
            return;
        }
        const p = this.app.player;
        let y = top + 6;
        ui.panel({ x: 12, y, w: ui.w - 24, h: 96 }, theme_1.THEME.panel);
        ui.text('资产总览（服务器权威账本）', 24, y + 20, { size: 12, bold: true });
        const b = (_a = p.balances) !== null && _a !== void 0 ? _a : {};
        const keys = Object.keys(b).filter((k) => (this.app.profile === 'full-clone' ? true : !['TEST_CREDIT', 'RED_PACKET_PROGRESS'].includes(k)));
        keys.slice(0, 12).forEach((k, i) => {
            const col = i % 3, row = Math.floor(i / 3);
            ui.text(`${k.slice(0, 6)}`, 24 + col * 116, y + 44 + row * 18, { size: 9, color: theme_1.THEME.textDim });
            ui.text((0, theme_1.fmtNum)(b[k]), 24 + col * 116, y + 56 + row * 18, { size: 11, color: theme_1.THEME.gold });
        });
        y += 104;
        if (this.sandboxBalance) {
            ui.panel({ x: 12, y, w: ui.w - 24, h: 66 }, theme_1.THEME.panel2);
            ui.text(`结算账户（沙盒桥）: ${this.sandboxBalance}`, 24, y + 22, { size: 12, color: theme_1.THEME.gold });
            ui.text('UI_CLONE_TEST_ONLY：提现界面 1:1 复刻但永不实际兑付', 24, y + 44, { size: 10, color: theme_1.THEME.red });
            y += 76;
            ui.button({ x: 12, y, w: ui.w - 24, h: 44 }, '申请提现（沙盒预览）', async () => {
                const r = await this.app.api.post('/v1/settlement/withdrawal-preview', { amount: '888.00' });
                if (r.ok)
                    this.app.showModal('提现预览（沙盒桥）', [`手续费 ${r.fee}`, `到账 ${r.arrival}`, r.notice]);
            }, { color: theme_1.THEME.accent });
            y += 54;
        }
        // 账本流水
        ui.text('账本流水（最近）', 16, y + 12, { size: 12, color: theme_1.THEME.textDim });
        y += 18;
        ((_c = (_b = this.state) === null || _b === void 0 ? void 0 : _b.ledger) !== null && _c !== void 0 ? _c : []).slice(0, 10).forEach((e) => {
            ui.text(`${e.assetType} ${e.delta > 0 ? '+' : ''}${e.delta}`, 16, y, { size: 10, color: e.delta > 0 ? theme_1.THEME.green : theme_1.THEME.red });
            ui.text(`${e.sourceType}`, 130, y, { size: 10, color: theme_1.THEME.textDim });
            ui.text(`= ${e.balanceAfter}`, ui.w - 80, y, { size: 10 });
            y += 17;
        });
        if ((_d = this.state) === null || _d === void 0 ? void 0 : _d.invariants) {
            ui.text(`账本校验: ${this.state.invariants.ok ? '✓ 连续性正常' : '✗ ' + this.state.invariants.errors[0]}`, 16, y + 6, { size: 10, color: this.state.invariants.ok ? theme_1.THEME.green : theme_1.THEME.red });
        }
    }
}
exports.WalletScreen = WalletScreen;
// ---------------- 政策说明页（cut/defer 族诚实呈现） ----------------
class PolicyScreen extends router_1.Screen {
    constructor(featureId) {
        var _a, _b;
        super();
        this.featureId = featureId;
        this.meta = (_a = require('../../../shared/src/gen/data.gen').FEATURES.find((f) => f.id === featureId)) !== null && _a !== void 0 ? _a : {};
        this.title = (_b = this.meta.title) !== null && _b !== void 0 ? _b : featureId;
        this.route = '/' + featureId;
    }
    render() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const ui = this.app.ui;
        const top = 64;
        const release = (_a = this.meta.release) !== null && _a !== void 0 ? _a : 'cut';
        const colors = { keep: theme_1.THEME.green, defer: theme_1.THEME.gold, cut: theme_1.THEME.red };
        let y = top + 10;
        ui.panel({ x: 12, y, w: ui.w - 24, h: 64 }, theme_1.THEME.panel);
        ui.text(`发布策略: ${release.toUpperCase()}`, 24, y + 24, { size: 15, bold: true, color: (_b = colors[release]) !== null && _b !== void 0 ? _b : theme_1.THEME.text });
        ui.text(`风险等级: ${(_c = this.meta.risk) !== null && _c !== void 0 ? _c : 'review'}`, 24, y + 46, { size: 11, color: theme_1.THEME.textDim });
        y += 74;
        ui.panel({ x: 12, y, w: ui.w - 24, h: 76 }, theme_1.THEME.panel2);
        ui.text('说明', 24, y + 20, { size: 12, bold: true });
        const lines = wrap((_d = this.meta.notes) !== null && _d !== void 0 ? _d : '该模块保留产品模型与页面映射，按发布策略裁剪。', 24);
        lines.slice(0, 3).forEach((l, i) => ui.text(l, 24, y + 40 + i * 16, { size: 11 }));
        y += 86;
        ui.panel({ x: 12, y, w: ui.w - 24, h: 20 + ((_f = (_e = this.meta.evidence) === null || _e === void 0 ? void 0 : _e.length) !== null && _f !== void 0 ? _f : 0) * 18 }, theme_1.THEME.panel);
        ui.text('APK 原始证据', 24, y + 18, { size: 12, bold: true });
        ((_g = this.meta.evidence) !== null && _g !== void 0 ? _g : []).slice(0, 4).forEach((e, i) => {
            ui.text(`· ${e}`.slice(0, 38), 24, y + 36 + i * 18, { size: 10, color: theme_1.THEME.textDim });
        });
        y += 30 + ((_j = (_h = this.meta.evidence) === null || _h === void 0 ? void 0 : _h.length) !== null && _j !== void 0 ? _j : 0) * 18;
        if (release === 'defer') {
            ui.text('FULL CLONE 下相关沙盒玩法可从对应生态入口体验。', 16, y + 6, { size: 10, color: theme_1.THEME.gold });
        }
        else {
            ui.text('RELEASE 永久关闭；FULL CLONE 仅保留数据模型/页面映射（sandbox-only）。', 16, y + 6, { size: 10, color: theme_1.THEME.red });
        }
    }
}
exports.PolicyScreen = PolicyScreen;
function wrap(text, maxChars) {
    const out = [];
    for (let i = 0; i < text.length; i += maxChars)
        out.push(text.slice(i, i + maxChars));
    return out;
}
function registerTradeScreens() {
    (0, registry_1.registerRoute)('p2pTrade', () => new MarketScreen('p2pTrade', '交易市场'));
    (0, registry_1.registerRoute)('market', () => new MarketScreen('market', '交易市场'));
    (0, registry_1.registerRoute)('digitalTrade', () => new AuctionScreen());
    (0, registry_1.registerRoute)('mall', () => new MallScreen());
    (0, registry_1.registerRoute)('moonEvent', () => new PolicyScreen('moonEvent'));
    (0, registry_1.registerRoute)('agent', () => new AgentScreen());
    (0, registry_1.registerRoute)('walletCash', () => new WalletScreen());
    (0, registry_1.registerRoute)('redPacket', () => new PolicyScreen('redPacket'));
    (0, registry_1.registerRoute)('warcraftFinance', () => new PolicyScreen('warcraftFinance'));
    (0, registry_1.registerRoute)('digitalLottery', () => new PolicyScreen('digitalLottery'));
    (0, registry_1.registerRoute)('physicalPrize', () => new PolicyScreen('physicalPrize'));
    (0, registry_1.registerRoute)('betting', () => new PolicyScreen('betting'));
    (0, registry_1.registerRoute)('creator', () => new PolicyScreen('creator'));
    (0, registry_1.registerRoute)('apeHundred', () => new PolicyScreen('apeHundred'));
    (0, registry_1.registerRoute)('customerService', () => new PolicyScreen('customerService'));
    (0, registry_1.registerRoute)('superLink', () => new PolicyScreen('superLink'));
    (0, registry_1.registerRoute)('hundred', () => new PolicyScreen('apeHundred'));
}
