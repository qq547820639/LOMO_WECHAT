"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roundToPrecision = exports.EconomyOps = void 0;
/**
 * EconomyOps —— 游戏处理器使用的经济操作门面。
 * 所有资产变动强制经过 Ledger（服务器权威）；Release 档禁止对禁改资产产生正向 delta。
 */
const assets_1 = require("../../shared/src/assets");
Object.defineProperty(exports, "roundToPrecision", { enumerable: true, get: function () { return assets_1.roundToPrecision; } });
const config_1 = require("../../shared/src/config");
class EconomyOps {
    constructor(store, profile) {
        this.store = store;
        this.profile = profile;
        this.collected = [];
    }
    guard(assetId, delta) {
        if (this.profile === 'wechat-release' && delta > 0 && config_1.RELEASE_FORBIDDEN_ASSETS.includes(assetId)) {
            throw new Error(`RELEASE_FORBIDDEN_ASSET: ${assetId} 不得在 wechat-release 下发放`);
        }
    }
    balance(playerId, assetId) { return this.store.ledger.balanceOf(playerId, assetId); }
    balances(playerId) { return this.store.ledger.balancesOf(playerId); }
    grant(playerId, assetId, delta, sourceType, sourceId, idempotencyKey) {
        if (delta <= 0)
            throw new Error('grant requires positive delta, use spend');
        this.guard(assetId, delta);
        const v = (0, assets_1.roundToPrecision)(delta, assetId);
        const e = this.store.ledger.apply({ playerId, assetType: assetId, delta: v, sourceType, sourceId, idempotencyKey });
        const dto = { assetId, delta: e.delta };
        this.collected.push(dto);
        this.store.touch();
        return dto;
    }
    spend(playerId, assetId, delta, sourceType, sourceId, idempotencyKey) {
        if (delta <= 0)
            throw new Error('spend requires positive delta');
        const e = this.store.ledger.apply({ playerId, assetType: assetId, delta: -(0, assets_1.roundToPrecision)(delta, assetId), sourceType, sourceId, idempotencyKey });
        const dto = { assetId, delta: e.delta };
        this.collected.push(dto);
        this.store.touch();
        return dto;
    }
    payFrom(player, cost, sourceType, sourceId) {
        for (const [k, v] of Object.entries(cost)) {
            const need = Math.max(0, Math.floor(v || 0));
            if (need <= 0)
                continue;
            if (this.balance(player.playerId, k) < need)
                return false;
        }
        for (const [k, v] of Object.entries(cost)) {
            const need = Math.max(0, Math.floor(v || 0));
            if (need > 0)
                this.spend(player.playerId, k, need, sourceType, sourceId);
        }
        return true;
    }
    addItems(playerId, templateId, qty = 1, attrs) {
        if (templateId === '__proto__' || templateId === 'constructor' || templateId === 'prototype')
            throw new Error('invalid template id');
        const inv = this.store.player(playerId).inventory;
        const cur = Object.prototype.hasOwnProperty.call(inv, templateId) ? inv[templateId] : { qty: 0, lockedQty: 0 };
        inv[templateId] = { ...cur, qty: cur.qty + Math.max(0, Math.floor(qty)), attrs: attrs !== null && attrs !== void 0 ? attrs : cur.attrs };
        this.store.touch();
    }
    takeItems(playerId, templateId, qty = 1) {
        if (!Number.isSafeInteger(qty) || qty <= 0 || templateId === '__proto__' || templateId === 'constructor' || templateId === 'prototype')
            return false;
        const inv = this.store.player(playerId).inventory;
        const cur = Object.prototype.hasOwnProperty.call(inv, templateId) ? inv[templateId] : undefined;
        if (!cur || cur.qty < qty)
            return false;
        cur.qty -= qty;
        if (cur.qty === 0 && cur.lockedQty === 0)
            delete inv[templateId];
        this.store.touch();
        return true;
    }
    itemCount(playerId, templateId) {
        const inv = this.store.player(playerId).inventory;
        return Object.prototype.hasOwnProperty.call(inv, templateId) ? inv[templateId].qty : 0;
    }
    /** 体力按时间回复（timestamp based），返回回复后的当前体力 */
    regenEnergy(player, now, max, regenMinutes) {
        var _a;
        const last = (_a = player.timestamps['energyRegenAt']) !== null && _a !== void 0 ? _a : now;
        const minutes = Math.floor((now - last) / 60000);
        if (minutes > 0) {
            const gain = Math.floor(minutes / Math.max(1, regenMinutes));
            if (gain > 0) {
                const cur = this.balance(player.playerId, 'ENERGY');
                const target = Math.min(max, cur + gain);
                const actual = target - cur;
                if (actual > 0)
                    this.store.ledger.apply({ playerId: player.playerId, assetType: 'ENERGY', delta: actual, sourceType: 'time', sourceId: 'regen', createdAt: now });
                player.timestamps['energyRegenAt'] = now;
                this.store.touch();
            }
        }
        return this.balance(player.playerId, 'ENERGY');
    }
    drainCollected() { const c = this.collected; this.collected = []; return c; }
}
exports.EconomyOps = EconomyOps;
