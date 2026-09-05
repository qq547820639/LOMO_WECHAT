"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Store = void 0;
/**
 * 服务端内存存储（可 JSON 快照持久化）。
 * Auth Gateway / Player / Session / Rank / Mail / Market / Telemetry。
 */
const ledger_1 = require("../../shared/src/ledger");
class Store {
    constructor(txnIdGen, persistPath) {
        this.data = {
            players: {}, openIdIndex: {}, sessions: {}, mails: [], listings: {}, ranks: {}, history: {}, telemetry: [], inviteTokens: {}, audit: [],
        };
        this.cards = [];
        this.persistPath = null;
        this.dirty = false;
        this.ledger = new ledger_1.Ledger(txnIdGen);
        this.persistPath = persistPath !== null && persistPath !== void 0 ? persistPath : null;
        if (this.persistPath)
            this.tryRestore();
    }
    setCards(cards) { this.cards = cards; }
    // ---- players ----
    player(playerId) { return this.data.players[playerId]; }
    ensurePlayer(openId, nick, now) {
        const existing = this.data.openIdIndex[openId];
        if (existing && this.data.players[existing])
            return { player: this.data.players[existing], isNew: false };
        let playerId = '';
        do {
            playerId = 'p_' + Math.random().toString(36).slice(2, 10);
        } while (this.data.players[playerId]);
        const player = {
            playerId, openId, nick, level: 1, xp: 0, counters: {}, timestamps: {}, inventory: {}, createdAt: now,
        };
        this.data.players[playerId] = player;
        this.data.openIdIndex[openId] = playerId;
        this.touch();
        return { player, isNew: true };
    }
    // ---- sessions ----
    createSession(playerId, featureId, seed, mechanicId, now = Date.now()) {
        const sessionId = 's_' + Math.random().toString(36).slice(2, 14);
        const rec = { sessionId, playerId, featureId, mechanicId, seed, createdAt: now, updatedAt: now, clientSeq: 0, serverSeq: 0, data: {}, finished: false };
        this.data.sessions[sessionId] = rec;
        this.touch();
        return rec;
    }
    session(id) { return this.data.sessions[id]; }
    // ---- ranks ----
    rankScore(board, playerId) { var _a, _b; return (_b = (_a = this.data.ranks[board]) === null || _a === void 0 ? void 0 : _a[playerId]) !== null && _b !== void 0 ? _b : 0; }
    rankAdd(board, playerId, delta) {
        var _a;
        if (!this.data.ranks[board])
            this.data.ranks[board] = {};
        const cur = (_a = this.data.ranks[board][playerId]) !== null && _a !== void 0 ? _a : 0;
        const next = cur + delta;
        this.data.ranks[board][playerId] = next;
        this.touch();
        return next;
    }
    rankTop(board, limit) {
        const m = this.data.ranks[board] || {};
        return Object.entries(m).map(([playerId, score]) => ({ playerId, score })).sort((a, b) => b.score - a.score).slice(0, limit);
    }
    // ---- history ----
    pushHistory(playerId, featureId, summary, rewards) {
        if (!this.data.history[playerId])
            this.data.history[playerId] = [];
        this.data.history[playerId].push({ id: 'h_' + Math.random().toString(36).slice(2, 12), featureId, summary, createdAt: Date.now(), rewards });
        if (this.data.history[playerId].length > 500)
            this.data.history[playerId].shift();
        this.touch();
    }
    history(playerId, featureId, limit = 50) {
        const list = (this.data.history[playerId] || []).filter((h) => !featureId || h.featureId === featureId);
        return list.slice(-limit).reverse();
    }
    // ---- mails ----
    sendMail(mail) {
        const rec = { ...mail, mailId: 'm_' + Math.random().toString(36).slice(2, 12), claimed: false, read: false, createdAt: Date.now() };
        this.data.mails.push(rec);
        this.touch();
        return rec;
    }
    mails(playerId) { return this.data.mails.filter((m) => m.playerId === playerId).sort((a, b) => b.createdAt - a.createdAt); }
    // ---- audit ----
    audit(playerId, kind, detail) {
        this.data.audit.push({ at: Date.now(), playerId, kind, detail });
        if (this.data.audit.length > 2000)
            this.data.audit.shift();
    }
    telemetry(name, props) {
        this.data.telemetry.push({ name, at: Date.now(), props });
        if (this.data.telemetry.length > 5000)
            this.data.telemetry.shift();
    }
    touch() { this.dirty = true; }
    /** 防抖落盘 */
    maybePersist(force = false) {
        if (!this.persistPath || (!this.dirty && !force))
            return;
        try {
            const fs = require('node:fs');
            const snapshot = JSON.stringify({ ...this.data, _ledger: this.ledger.dump() });
            fs.writeFileSync(this.persistPath, snapshot);
            this.dirty = false;
        }
        catch { /* 持久化失败不阻塞游戏 */ }
    }
    tryRestore() {
        try {
            const fs = require('node:fs');
            if (!fs.existsSync(this.persistPath))
                return;
            const raw = JSON.parse(fs.readFileSync(this.persistPath, 'utf8'));
            const { _ledger, ...data } = raw;
            this.data = { ...this.data, ...data };
            if (_ledger)
                this.ledger.restore(_ledger);
        }
        catch { /* 损坏快照按新档处理 */ }
    }
}
exports.Store = Store;
