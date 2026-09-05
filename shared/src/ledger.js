"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ledger = exports.LedgerError = void 0;
/**
 * Section 19 统一 Economy Ledger —— 服务器权威账本模型。
 * 所有游戏奖励/扣费/矿场产出/邮件补偿/广告奖励/商店购买/合成/分解/活动/任务统一经过账本。
 * 禁止重要资产由客户端直接修改。
 */
const assets_1 = require("./assets");
class LedgerError extends Error {
    constructor(code, msg) {
        super(msg);
        this.code = code;
    }
}
exports.LedgerError = LedgerError;
class Ledger {
    constructor(txnIdGen) {
        this.txnIdGen = txnIdGen;
        this.entries = [];
        this.balances = new Map();
        this.idemKeys = new Map();
    }
    balanceOf(playerId, assetId) {
        var _a, _b;
        return (_b = (_a = this.balances.get(playerId)) === null || _a === void 0 ? void 0 : _a.get(assetId)) !== null && _b !== void 0 ? _b : 0;
    }
    balancesOf(playerId) {
        const out = {};
        const m = this.balances.get(playerId);
        if (m)
            for (const [k, v] of m)
                out[k] = (0, assets_1.roundToPrecision)(v, k);
        return out;
    }
    entriesOf(playerId, limit = 100, assetType) {
        const list = this.entries.filter((e) => e.playerId === playerId && (!assetType || e.assetType === assetType));
        return list.slice(-limit).reverse();
    }
    /**
     * 记一笔资产变动。delta 可为负（扣减，要求余额充足）。
     * idempotencyKey 命中已存在记录时直接返回原记录（幂等重放），不再变动余额。
     */
    apply(params) {
        var _a, _b;
        const { playerId, assetType, delta, sourceType, sourceId } = params;
        if (!Number.isFinite(delta) || delta === 0)
            throw new LedgerError('INVALID_DELTA', `delta must be non-zero finite: ${delta}`);
        if (params.idempotencyKey) {
            const k = `${playerId}:${params.idempotencyKey}`;
            const prior = this.idemKeys.get(k);
            if (prior)
                return prior;
        }
        const before = (0, assets_1.roundToPrecision)(this.balanceOf(playerId, assetType), assetType);
        const after = (0, assets_1.roundToPrecision)(before + delta, assetType);
        if (after < 0)
            throw new LedgerError('INSUFFICIENT_BALANCE', `${assetType} balance ${before} < needed ${-delta}`);
        const entry = {
            txnId: this.txnIdGen(),
            playerId,
            assetType,
            delta: (0, assets_1.roundToPrecision)(delta, assetType),
            balanceBefore: before,
            balanceAfter: after,
            sourceType,
            sourceId,
            idempotencyKey: (_a = params.idempotencyKey) !== null && _a !== void 0 ? _a : null,
            createdAt: (_b = params.createdAt) !== null && _b !== void 0 ? _b : Date.now(),
            metadata: params.metadata,
        };
        if (!this.balances.has(playerId))
            this.balances.set(playerId, new Map());
        this.balances.get(playerId).set(assetType, after);
        this.entries.push(entry);
        if (params.idempotencyKey)
            this.idemKeys.set(`${playerId}:${params.idempotencyKey}`, entry);
        return entry;
    }
    /** 多资产原子操作：任一失败则全部不落账。 */
    applyBatch(playerId, ops, idempotencyKey) {
        var _a;
        const staged = [];
        const projected = new Map();
        for (const op of ops) {
            const base = (_a = projected.get(op.assetType)) !== null && _a !== void 0 ? _a : this.balanceOf(playerId, op.assetType);
            const next = (0, assets_1.roundToPrecision)(base + op.delta, op.assetType);
            if (next < 0)
                throw new LedgerError('INSUFFICIENT_BALANCE', `batch: ${op.assetType} ${base} < ${-op.delta}`);
            projected.set(op.assetType, next);
            staged.push({ assetType: op.assetType, projected: next });
        }
        const out = [];
        for (const op of ops) {
            out.push(this.apply({ playerId, ...op, idempotencyKey: idempotencyKey ? `${idempotencyKey}:${op.assetType}` : null }));
        }
        return out;
    }
    /** 经济不变量校验：每条 entry 的 balanceAfter == balanceBefore + delta，且与最终余额链一致。 */
    validateInvariants(playerId) {
        var _a;
        const errors = [];
        const running = new Map();
        for (const e of this.entries.filter((x) => x.playerId === playerId)) {
            const base = (_a = running.get(e.assetType)) !== null && _a !== void 0 ? _a : 0;
            if (Math.abs(e.balanceBefore - base) > 1e-9)
                errors.push(`continuity break at ${e.txnId}: before=${e.balanceBefore} expected=${base}`);
            if (Math.abs(e.balanceAfter - (e.balanceBefore + e.delta)) > 1e-9)
                errors.push(`arithmetic break at ${e.txnId}`);
            if (e.balanceAfter < 0)
                errors.push(`negative balance at ${e.txnId}`);
            running.set(e.assetType, e.balanceAfter);
        }
        for (const [k, v] of running) {
            const final = this.balanceOf(playerId, k);
            if (Math.abs(final - v) > 1e-9)
                errors.push(`final mismatch ${k}: ${final} != ${v}`);
        }
        return { ok: errors.length === 0, errors };
    }
    /** 序列化（持久化/测试断言用） */
    dump() {
        const balances = {};
        for (const [pid, m] of this.balances) {
            balances[pid] = {};
            for (const [k, v] of m)
                balances[pid][k] = v;
        }
        return { entries: this.entries, balances };
    }
    restore(dump) {
        this.entries = dump.entries;
        this.balances = new Map();
        this.idemKeys = new Map();
        for (const [pid, m] of Object.entries(dump.balances)) {
            const mm = new Map();
            for (const [k, v] of Object.entries(m))
                mm.set(k, v);
            this.balances.set(pid, mm);
        }
        for (const e of this.entries) {
            if (e.idempotencyKey)
                this.idemKeys.set(`${e.playerId}:${e.idempotencyKey}`, e);
        }
    }
}
exports.Ledger = Ledger;
