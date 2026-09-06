"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachCommerceRoutes = attachCommerceRoutes;
/**
 * 商业生态扩展路由 —— market/consignment/auction（沙盒）、mall 订单(mock)、
 * settlement 沙盒桥（提现 UI 专用）、agent 店长（沙盒数据模型）。
 *
 * 合规边界：
 *  - wechat-release 下这些路由整体 403 FEATURE_DISABLED（三层关闭的服务端层）。
 *  - full-clone 下可用，但结算资产一律 TEST_CREDIT 沙盒，无任何真实资金语义。
 */
const util_1 = require("./util");
const economy_1 = require("./economy");
function attachCommerceRoutes(app, routes) {
    const own = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key) ? obj[key] : undefined;
    const authed = (ctx) => { var _a; return app.verifyToken(String(ctx.req.headers['authorization'] || '').replace(/^Bearer\s+/i, '') || (typeof ((_a = ctx.body) === null || _a === void 0 ? void 0 : _a.token) === 'string' ? ctx.body.token : undefined)); };
    const guard = (ctx) => {
        const playerId = authed(ctx);
        if (!playerId) {
            ctx.status(401);
            ctx.json({ ok: false, code: 'AUTH_REQUIRED', message: '缺少有效 token' });
            return null;
        }
        return playerId;
    };
    /** Release 档一刀切：商业生态默认全关（commerceEnabled 开关可按模块细化） */
    const commerceAllowed = (ctx, feature) => {
        if (app.profile === 'wechat-release' && !app.featureAllowed(feature)) {
            ctx.status(403);
            ctx.json({ ok: false, code: 'FEATURE_DISABLED', message: `${feature} 在 wechat-release 配置下永久关闭`, detail: { policy: app.policyOf(feature) } });
            return false;
        }
        return true;
    };
    // ================= Market / Consignment / Auction（沙盒） =================
    const listingDto = (l) => {
        var _a, _b;
        return ({
            listingId: l.listingId, sellerId: l.sellerId, sellerNick: (_b = (_a = app.store.player(l.sellerId)) === null || _a === void 0 ? void 0 : _a.nick) !== null && _b !== void 0 ? _b : l.sellerId,
            assetId: l.assetId, templateId: l.templateId, qty: l.qty, unitPrice: l.unitPrice,
            kind: l.kind, createdAt: l.createdAt, expiresAt: l.expiresAt, topBid: l.topBid, closed: !!l.closed,
        });
    };
    const expireListing = (l) => {
        if (l.closed)
            return;
        const econ = new economy_1.EconomyOps(app.store, app.profile);
        if (l.topBidder && l.topBid)
            econ.grant(l.topBidder, 'TEST_CREDIT', l.topBid, 'auction.expire.refund', l.listingId, `expire-refund:${l.listingId}`);
        if (l.templateId)
            econ.addItems(l.sellerId, l.templateId, l.qty);
        else if (l.assetId)
            econ.grant(l.sellerId, l.assetId, l.qty, 'market.expire.refund', l.listingId, `expire-asset:${l.listingId}`);
        l.closed = true;
        app.store.audit(l.sellerId, 'market.expire', { listingId: l.listingId });
    };
    routes.push({
        method: 'GET', pattern: '/v1/market/listings', handler: (ctx) => {
            const playerId = guard(ctx);
            if (!playerId)
                return;
            if (!commerceAllowed(ctx, 'p2pTrade'))
                return;
            const kind = ctx.query.get('kind');
            const list = Object.values(app.store.data.listings)
                .filter((l) => {
                if (!l.closed && l.expiresAt <= Date.now())
                    expireListing(l);
                return !l.closed && (!kind || l.kind === kind);
            })
                .sort((a, b) => b.createdAt - a.createdAt)
                .slice(0, 80)
                .map(listingDto);
            // 播种沙盒挂单
            ctx.json({ ok: true, listings: list, currency: 'TEST_CREDIT', sandbox: true });
        },
    }, {
        method: 'POST', pattern: '/v1/market/list', handler: (ctx) => {
            var _a, _b;
            const playerId = guard(ctx);
            if (!playerId)
                return;
            if (!commerceAllowed(ctx, 'p2pTrade'))
                return;
            const { assetId, templateId, qty, unitPrice, kind } = ctx.body || {};
            const q = qty === undefined ? 1 : Number(qty);
            const price = Number(unitPrice);
            if (!Number.isSafeInteger(q) || q < 1 || !Number.isSafeInteger(price) || price < 1) {
                ctx.status(400);
                ctx.json({ ok: false, code: 'BAD_REQUEST', message: 'qty/unitPrice 必须为正整数' });
                return;
            }
            const k = String(kind || 'market');
            if (k !== 'market' && k !== 'consignment' && k !== 'auction') {
                ctx.status(400);
                ctx.json({ ok: false, code: 'BAD_REQUEST', message: 'kind 必须是 market/consignment/auction' });
                return;
            }
            const econ = new economy_1.EconomyOps(app.store, app.profile);
            if (templateId) {
                const template = String(templateId);
                if (template === '__proto__' || template === 'constructor' || template === 'prototype' || !econ.takeItems(playerId, template, q)) {
                    ctx.status(409);
                    ctx.json({ ok: false, code: 'INSUFFICIENT', message: '物品数量不足' });
                    return;
                }
            }
            else if (assetId) {
                try {
                    econ.spend(playerId, assetId, q, 'market.list', 'lock');
                }
                catch {
                    ctx.status(409);
                    ctx.json({ ok: false, code: 'INSUFFICIENT', message: '资产余额不足' });
                    return;
                }
            }
            else {
                ctx.status(400);
                ctx.json({ ok: false, code: 'BAD_REQUEST', message: 'assetId/templateId required' });
                return;
            }
            const days = (_b = (_a = app.tuning.market) === null || _a === void 0 ? void 0 : _a.consignmentMaxDays) !== null && _b !== void 0 ? _b : 7;
            const l = {
                listingId: (0, util_1.randomId)(12), sellerId: playerId, assetId, templateId: templateId ? String(templateId) : undefined,
                qty: q, unitPrice: price, kind: k,
                createdAt: Date.now(), expiresAt: Date.now() + (k === 'auction' ? 86400000 : days * 86400000),
            };
            app.store.data.listings[l.listingId] = l;
            app.store.audit(playerId, 'market.list', { listingId: l.listingId });
            ctx.json({ ok: true, listing: listingDto(l) });
        },
    }, {
        method: 'POST', pattern: '/v1/market/buy', handler: (ctx) => {
            var _a, _b;
            const playerId = guard(ctx);
            if (!playerId)
                return;
            if (!commerceAllowed(ctx, 'p2pTrade'))
                return;
            const { listingId } = ctx.body || {};
            const l = own(app.store.data.listings, String(listingId || ''));
            if (!l || l.closed) {
                ctx.status(404);
                ctx.json({ ok: false, code: 'NOT_FOUND', message: '挂单不存在或已成交' });
                return;
            }
            if (l.expiresAt <= Date.now()) {
                expireListing(l);
                ctx.status(410);
                ctx.json({ ok: false, code: 'NOT_FOUND', message: '挂单已过期' });
                return;
            }
            if (l.sellerId === playerId) {
                ctx.status(400);
                ctx.json({ ok: false, code: 'BAD_REQUEST', message: '不能购买自己的挂单' });
                return;
            }
            const econ = new economy_1.EconomyOps(app.store, app.profile);
            const feeRate = (_b = (_a = app.tuning.market) === null || _a === void 0 ? void 0 : _a.feeRate) !== null && _b !== void 0 ? _b : 0.05;
            try {
                econ.spend(playerId, 'TEST_CREDIT', l.unitPrice * l.qty, 'market.buy', l.listingId, `buy:${l.listingId}`);
            }
            catch {
                ctx.status(409);
                ctx.json({ ok: false, code: 'INSUFFICIENT', message: '沙盒余额不足（TEST_CREDIT）' });
                return;
            }
            const payout = Math.floor(l.unitPrice * l.qty * (1 - feeRate));
            econ.grant(l.sellerId, 'TEST_CREDIT', payout, 'market.sell', l.listingId, `sell:${l.listingId}`);
            if (l.templateId)
                econ.addItems(playerId, l.templateId, l.qty);
            else if (l.assetId)
                econ.grant(playerId, l.assetId, l.qty, 'market.buy', l.listingId);
            l.closed = true;
            app.store.pushHistory(playerId, 'market', `购入挂单 ${l.listingId}，支出沙盒币 ${l.unitPrice * l.qty}`);
            app.store.pushHistory(l.sellerId, 'market', `售出挂单 ${l.listingId}，收入沙盒币 ${payout}（手续费 ${(feeRate * 100).toFixed(0)}%）`);
            ctx.json({ ok: true, message: '成交（沙盒）', fee: l.unitPrice * l.qty - payout });
        },
    }, {
        method: 'POST', pattern: '/v1/market/bid', handler: (ctx) => {
            var _a, _b, _c;
            const playerId = guard(ctx);
            if (!playerId)
                return;
            if (!commerceAllowed(ctx, 'digitalTrade'))
                return;
            const { listingId, bid } = ctx.body || {};
            const l = own(app.store.data.listings, String(listingId || ''));
            if (!l || l.closed || l.kind !== 'auction') {
                ctx.status(404);
                ctx.json({ ok: false, code: 'NOT_FOUND', message: '竞拍单不存在' });
                return;
            }
            if (l.expiresAt <= Date.now()) {
                expireListing(l);
                ctx.status(410);
                ctx.json({ ok: false, code: 'NOT_FOUND', message: '竞拍已结束' });
                return;
            }
            if (l.sellerId === playerId) {
                ctx.status(400);
                ctx.json({ ok: false, code: 'BAD_REQUEST', message: '卖家不能竞拍自己的挂单' });
                return;
            }
            const min = Math.ceil(((_a = l.topBid) !== null && _a !== void 0 ? _a : l.unitPrice) * (1 + ((_c = (_b = app.tuning.market) === null || _b === void 0 ? void 0 : _b.auctionMinIncrement) !== null && _c !== void 0 ? _c : 0.05)));
            const v = Math.floor(Number(bid) || 0);
            if (l.topBidder === playerId && l.topBid === v) {
                ctx.json({ ok: true, message: `出价成功（沙盒）：${v}`, topBid: v });
                return;
            }
            if (v < min) {
                ctx.status(400);
                ctx.json({ ok: false, code: 'BAD_REQUEST', message: `出价需 ≥ ${min}` });
                return;
            }
            const econ = new economy_1.EconomyOps(app.store, app.profile);
            try {
                econ.spend(playerId, 'TEST_CREDIT', v, 'auction.bid', l.listingId, `bid:${l.listingId}:${v}`);
            }
            catch {
                ctx.status(409);
                ctx.json({ ok: false, code: 'INSUFFICIENT', message: '沙盒余额不足' });
                return;
            }
            // 退还前一出价者
            if (l.topBidder)
                econ.grant(l.topBidder, 'TEST_CREDIT', l.topBid, 'auction.refund', l.listingId, `refund:${l.listingId}:${l.topBid}`);
            l.topBid = v;
            l.topBidder = playerId;
            ctx.json({ ok: true, message: `出价成功（沙盒）：${v}`, topBid: v });
        },
    }, {
        method: 'POST', pattern: '/v1/market/settle-auction', handler: (ctx) => {
            var _a, _b;
            const playerId = guard(ctx);
            if (!playerId)
                return;
            if (!commerceAllowed(ctx, 'digitalTrade'))
                return;
            const { listingId } = ctx.body || {};
            const l = own(app.store.data.listings, String(listingId || ''));
            if (!l || l.closed || l.kind !== 'auction') {
                ctx.status(404);
                ctx.json({ ok: false, code: 'NOT_FOUND', message: '竞拍单不存在' });
                return;
            }
            if (l.sellerId !== playerId) {
                ctx.status(403);
                ctx.json({ ok: false, code: 'AUTH_REQUIRED', message: '仅卖家可结算' });
                return;
            }
            if (l.expiresAt > Date.now()) {
                ctx.status(409);
                ctx.json({ ok: false, code: 'BAD_REQUEST', message: '竞拍尚未结束' });
                return;
            }
            const econ = new economy_1.EconomyOps(app.store, app.profile);
            if (l.topBidder && l.topBid) {
                const payout = Math.floor(l.topBid * (1 - ((_b = (_a = app.tuning.market) === null || _a === void 0 ? void 0 : _a.feeRate) !== null && _b !== void 0 ? _b : 0.05)));
                econ.grant(l.sellerId, 'TEST_CREDIT', payout, 'auction.settle', l.listingId, `settle:${l.listingId}`);
                if (l.templateId)
                    econ.addItems(l.topBidder, l.templateId, l.qty);
                else if (l.assetId)
                    econ.grant(l.topBidder, l.assetId, l.qty, 'auction.win', l.listingId);
            }
            else if (l.templateId) {
                econ.addItems(l.sellerId, l.templateId, l.qty); // 流拍退还
            }
            else if (l.assetId) {
                econ.grant(l.sellerId, l.assetId, l.qty, 'auction.refund', l.listingId);
            }
            l.closed = true;
            ctx.json({ ok: true, message: l.topBidder ? '竞拍成交（沙盒）' : '流拍，物品已退还' });
        },
    });
    // ================= Mall（mock 订单流） =================
    const GOODS = [
        { goodsId: 'g_ape_card_pack', title: '猿卡补给包', priceCoin: 200, priceIntegral: 0, kind: 'virtual', stock: 999 },
        { goodsId: 'g_gem_bundle', title: '宝石小袋', priceCoin: 150, priceIntegral: 0, kind: 'virtual', stock: 999 },
        { goodsId: 'g_toy_figure', title: '手办模型（实物·沙盒）', priceCoin: 0, priceIntegral: 500, kind: 'physical', stock: 20 },
        { goodsId: 'g_claim_ticket', title: '提货券（沙盒）', priceCoin: 0, priceIntegral: 300, kind: 'claim', stock: 50 },
    ];
    routes.push({
        method: 'GET', pattern: '/v1/mall/goods', handler: (ctx) => {
            const playerId = guard(ctx);
            if (!playerId)
                return;
            if (!commerceAllowed(ctx, 'mall'))
                return;
            ctx.json({ ok: true, goods: GOODS, paymentAdapter: 'mock', sandbox: true });
        },
    }, {
        method: 'POST', pattern: '/v1/mall/order', handler: (ctx) => {
            const playerId = guard(ctx);
            if (!playerId)
                return;
            if (!commerceAllowed(ctx, 'mall'))
                return;
            const goods = GOODS.find((g) => { var _a; return g.goodsId === ((_a = ctx.body) === null || _a === void 0 ? void 0 : _a.goodsId); });
            if (!goods) {
                ctx.status(404);
                ctx.json({ ok: false, code: 'NOT_FOUND', message: '商品不存在' });
                return;
            }
            const econ = new economy_1.EconomyOps(app.store, app.profile);
            const cost = {};
            if (goods.priceCoin)
                cost.COIN = goods.priceCoin;
            if (goods.priceIntegral)
                cost.INTEGRAL = goods.priceIntegral;
            if (!econ.payFrom(app.store.player(playerId), cost, 'mall.order', goods.goodsId)) {
                ctx.status(409);
                ctx.json({ ok: false, code: 'INSUFFICIENT', message: '余额不足' });
                return;
            }
            const orderId = 'o_' + (0, util_1.randomId)(12);
            // 正式支付流：此处应为服务端创建平台订单 → 支付回调 → 幂等发货。
            // mock 合同：直接标记 PAID 并幂等发货，订单/物流状态机与正式一致。
            if (goods.kind === 'virtual') {
                if (goods.goodsId === 'g_ape_card_pack')
                    econ.addItems(playerId, 'card_' + (1 + Math.floor(Math.random() * 8)), 1);
                if (goods.goodsId === 'g_gem_bundle')
                    econ.grant(playerId, 'GEMSTONE', 5, 'mall', goods.goodsId, `order:${orderId}`);
            }
            const order = { orderId, goodsId: goods.goodsId, status: goods.kind === 'virtual' ? 'DONE' : 'PAID', createdAt: Date.now() };
            app.store.data.audit.push({ at: Date.now(), playerId, kind: 'mall.order', detail: order });
            app.store.pushHistory(playerId, 'mall', `订单 ${orderId}：${goods.title}`);
            ctx.json({ ok: true, order, note: 'mock 支付合同：正式版需平台支付回调后幂等发货' });
        },
    }, {
        method: 'GET', pattern: '/v1/mall/orders', handler: (ctx) => {
            const playerId = guard(ctx);
            if (!playerId)
                return;
            if (!commerceAllowed(ctx, 'mall'))
                return;
            const orders = app.store.data.audit.filter((a) => a.playerId === playerId && a.kind === 'mall.order').map((a) => a.detail.order);
            ctx.json({ ok: true, orders });
        },
    });
    // ================= Settlement 沙盒桥（提现/现金 UI 专用，Section 21/38） =================
    routes.push({
        method: 'GET', pattern: '/v1/settlement/balance', handler: (ctx) => {
            const playerId = guard(ctx);
            if (!playerId)
                return;
            if (!commerceAllowed(ctx, 'walletCash'))
                return;
            const bal = app.store.ledger.balanceOf(playerId, 'TEST_CREDIT');
            ctx.json({ ok: true, displayAmount: `${bal.toFixed(2)} (沙盒)`, currency: 'TEST_CREDIT', notice: '沙盒资产不可兑换、不可提现' });
        },
    }, {
        method: 'POST', pattern: '/v1/settlement/withdrawal-preview', handler: (ctx) => {
            var _a;
            const playerId = guard(ctx);
            if (!playerId)
                return;
            if (!commerceAllowed(ctx, 'walletCash'))
                return;
            const amount = String(((_a = ctx.body) === null || _a === void 0 ? void 0 : _a.amount) || '0');
            ctx.json({ ok: true, fee: '0.00', arrival: `${amount} (不会实际兑付)`, notice: '沙盒桥：仅用于 UI_CLONE_TEST_ONLY_SETTLEMENT_DISABLED 页面' });
        },
    });
    // ================= Agent 店长（沙盒数据模型） =================
    routes.push({
        method: 'GET', pattern: '/v1/agent/summary', handler: (ctx) => {
            const playerId = guard(ctx);
            if (!playerId)
                return;
            if (!commerceAllowed(ctx, 'agent'))
                return;
            // 沙盒代理模型：展示层级/库存/订单统计，全部 TEST_CREDIT 语义
            const invites = Object.values(app.store.data.inviteTokens).filter((t) => t.inviterId === playerId).length;
            ctx.json({
                ok: true, sandbox: true,
                level: 1 + Math.floor(invites / 3),
                stock: { g_ape_card_pack: 10, g_gem_bundle: 8 },
                sales: { orders: invites, revenueTestCredit: invites * 100 },
                commission: { rate: 0.05, paidTestCredit: invites * 5 },
                notice: '沙盒代理：仅演示产品模型，无保证金/分销提现语义',
            });
        },
    });
}
