"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.battleRoyale = void 0;
/**
 * Wave 2 —— 大逃杀（Battle Royal）服务端权威实现。
 * 原版证据: BattleRoyalActivity / NewBattleRoyalActivity / BettingHistoryActivity /
 *           assets/blockBattleRoyal/* / assets/pag/battleRoyal/* + 公开玩法资料。
 *
 * 还原循环: 多房间 → 玩家投入进入房间 → 倒计时内可修门/换房 → 杀手每轮攻击一扇门 →
 *           门破房间淘汰 → 幸存房间按投入比例分池 → 败方按比例铸造匕首。
 * 合规改造: 下注投入 → COIN 软币门票（release）/ TEST_CREDIT 沙盒（full-clone 亦用软币，沙盒币仅结算屏）；
 *           现金奖池 → 软币奖池 + 赛季积分；BettingHistory → 免费的历史记录。
 * 参数来自已校验的 tuning.battleRoyal 自有运营配置，版本由 RemoteConfig 管理。
 */
const types_1 = require("./types");
function newRooms(ctx, rng) {
    const roomCount = ctx.num('battleRoyal.roomCount', 6);
    const baseHp = ctx.num('battleRoyal.baseDoorHp', 100);
    const rooms = [];
    for (let i = 1; i <= roomCount; i++) {
        rooms.push({ id: i, doorHp: baseHp, maxDoorHp: baseHp, stake: 0, players: [], alive: true });
    }
    const state = { rooms, round: 0, eliminatedRooms: [], pool: 0, playerRoom: null, killerAt: rng.int(1, roomCount), finished: false };
    return state;
}
function seedNpcStakes(ctx, state, rng) {
    // NPC 竞争者投入，制造真实的分池竞争
    for (const room of state.rooms) {
        const n = rng.int(1, 4);
        for (let i = 0; i < n; i++) {
            const stake = ctx.num('battleRoyal.entryCostCoin', 50) * rng.int(1, 3);
            room.stake += stake;
            state.pool += stake;
            room.players.push(`npc_${rng.int(1000, 9999)}`);
        }
    }
}
/** 杀手行动一轮：攻击 killerAt 房间；未破则游走到下一目标 */
function killerTick(ctx, state, rng) {
    const dmg = ctx.num('battleRoyal.killerDamage', 18);
    const room = state.rooms.find((r) => r.id === state.killerAt && r.alive);
    if (room) {
        room.doorHp -= dmg;
        if (room.doorHp <= 0) {
            room.alive = false;
            state.eliminatedRooms.push(room.id);
            // 被淘汰房间的投入留在池中（幸存者最终分池）
            const alive = state.rooms.filter((r) => r.alive);
            state.killerAt = alive.length ? rng.pick(alive).id : room.id;
            return { broken: room.id };
        }
    }
    return { broken: null };
}
function settleIfDue(ctx, state, playerId) {
    if (state.finished)
        return true;
    const playerRoom = state.rooms.find((r) => r.id === state.playerRoom);
    const maxRounds = ctx.num('battleRoyal.maxRounds', 24);
    const alive = state.rooms.filter((r) => r.alive);
    if (playerRoom && !playerRoom.alive) {
        state.finished = true;
        state.outcome = 'eliminated';
        return true;
    }
    if (alive.length <= 1 || state.round >= maxRounds) {
        state.finished = true;
        state.outcome = 'survived';
        return true;
    }
    return false;
}
exports.battleRoyale = {
    id: 'battleRoyal',
    readState: (ctx) => {
        const lobby = {
            roomCount: ctx.num('battleRoyal.roomCount', 6),
            entryCostCoin: ctx.num('battleRoyal.entryCostCoin', 50),
            baseDoorHp: ctx.num('battleRoyal.baseDoorHp', 100),
            feeRate: ctx.num('battleRoyal.feeRate', 0.05),
            daggerLossRatio: ctx.num('battleRoyal.daggerLossRatio', 0.2),
        };
        const session = ctx.store.data.sessions[''];
        void session;
        const myActive = Object.values(ctx.store.data.sessions).find((s) => s.playerId === ctx.playerId && s.featureId === 'battleRoyal' && !s.finished);
        const active = myActive ? { sessionId: myActive.sessionId, data: sanitize(myActive.data) } : null;
        const history = ctx.store.history(ctx.playerId, 'battleRoyal', 20);
        const rank = ctx.store.rankTop('seasonScore', 10).map((r, i) => { var _a, _b; return ({ rank: i + 1, nick: (_b = (_a = ctx.store.player(r.playerId)) === null || _a === void 0 ? void 0 : _a.nick) !== null && _b !== void 0 ? _b : r.playerId, score: r.score }); });
        return { lobby, active, history, rank };
    },
    actions: {
        /** 加入房间：支付门票，播种 NPC 竞争 */
        join: (ctx) => {
            const existing = Object.values(ctx.store.data.sessions).find((s) => { var _a; return s.playerId === ctx.playerId && s.featureId === 'battleRoyal' && !s.finished && s.sessionId !== ((_a = ctx.session) === null || _a === void 0 ? void 0 : _a.sessionId); });
            if (existing)
                return (0, types_1.fail)('已有一场进行中的大逃杀，请先结算');
            const roomId = Math.max(1, Math.min(ctx.num('battleRoyal.roomCount', 6), Math.floor(Number(ctx.payload.roomId) || 1)));
            const entry = ctx.num('battleRoyal.entryCostCoin', 50);
            const st = newRooms(ctx, ctx.rng);
            seedNpcStakes(ctx, st, ctx.rng);
            const room = st.rooms.find((r) => r.id === roomId);
            if (!ctx.econ.payFrom(ctx.player, { COIN: entry }, 'battleRoyal.join', `room${roomId}`))
                return (0, types_1.fail)(`金币不足，需要门票 ${entry}`);
            room.stake += entry;
            st.pool += entry;
            room.players.push(ctx.playerId);
            st.playerRoom = roomId;
            ctx.session.data = st;
            ctx.session.finished = false;
            return (0, types_1.ok)(`已进入 ${roomId} 号房间，门票 ${entry} 金币。杀手正在逼近……`, { state: sanitize(st), counters: { round: 0 } });
        },
        /** 每轮行动：repair（修门）/ move（换房，一次）/ hide（躲避） */
        act: (ctx) => {
            var _a, _b;
            const state = ((_a = ctx.session) === null || _a === void 0 ? void 0 : _a.data) || null;
            if (!state || !Array.isArray(state.rooms) || state.finished)
                return (0, types_1.fail)('会话尚未加入房间，请先 join');
            const kind = String(ctx.payload.kind || 'hide');
            const my = state.rooms.find((r) => r.id === state.playerRoom);
            if (!my)
                return (0, types_1.fail)('会话数据异常，请重新 join');
            let msg = '';
            if (kind === 'repair') {
                const cost = 10;
                if (!ctx.econ.payFrom(ctx.player, { COIN: cost }, 'battleRoyal.repair', `r${state.round}`))
                    return (0, types_1.fail)('金币不足，无法修门');
                my.doorHp = Math.min(my.maxDoorHp + 20, my.doorHp + ctx.num('battleRoyal.repairAmount', 12));
                msg = `修门完成，门耐久 ${my.doorHp}`;
            }
            else if (kind === 'move') {
                if (state.moved)
                    return (0, types_1.fail)('本局已换过房间');
                const target = Math.max(1, Math.min(ctx.num('battleRoyal.roomCount', 6), Math.floor(Number(ctx.payload.target) || 1)));
                if (!((_b = state.rooms.find((r) => r.id === target)) === null || _b === void 0 ? void 0 : _b.alive))
                    return (0, types_1.fail)('目标房间已被淘汰');
                my.players = my.players.filter((p) => p !== ctx.playerId);
                my.stake -= ctx.num('battleRoyal.entryCostCoin', 50);
                const dest = state.rooms.find((r) => r.id === target);
                dest.stake += ctx.num('battleRoyal.entryCostCoin', 50);
                dest.players.push(ctx.playerId);
                state.playerRoom = target;
                state.moved = true;
                msg = `已转移到 ${target} 号房间`;
            }
            else {
                msg = '你屏住呼吸躲了起来……';
            }
            state.round++;
            const tick = killerTick(ctx, state, ctx.rng);
            const events = [msg];
            if (tick.broken)
                events.push(`杀手破门而入！${tick.broken} 号房间被淘汰`);
            else
                events.push(`杀手正在撞击 ${state.killerAt} 号房间的门`);
            if (settleIfDue(ctx, state, ctx.playerId)) {
                const result = settle(ctx, state);
                ctx.session.finished = true;
                return { ...result, state: sanitize(state), fx: tick.broken ? ['doorBreak'] : ['killerTick'] };
            }
            return (0, types_1.ok)(events.join('；'), { state: sanitize(state), counters: { round: state.round }, fx: tick.broken ? ['doorBreak'] : [] });
        },
        /** 查询对局（不消耗轮次） */
        peek: (ctx) => {
            var _a;
            const state = ((_a = ctx.session) === null || _a === void 0 ? void 0 : _a.data) || null;
            if (!state)
                return (0, types_1.fail)('没有进行中的对局');
            return (0, types_1.ok)(`第 ${state.round} 轮`, { state: sanitize(state) });
        },
    },
};
/** 结算：幸存分池 / 淘汰铸匕首 */
function settle(ctx, state) {
    const playerRoom = state.rooms.find((r) => r.id === state.playerRoom);
    const entry = ctx.num('battleRoyal.entryCostCoin', 50);
    const feeRate = ctx.num('battleRoyal.feeRate', 0.05);
    const daggerRatio = ctx.num('battleRoyal.daggerLossRatio', 0.2);
    if (state.outcome === 'eliminated') {
        // 败方：损失门票；按比例铸造匕首（RELEASE 下 dagger 玩法 defer，但匕首作为战利品道具仍可收集展示）
        const dagger = Math.max(1, Math.floor(entry * daggerRatio / 10));
        ctx.econ.addItems(ctx.playerId, 'dagger', dagger);
        ctx.econ.grant(ctx.playerId, 'SEASON_SCORE', 5, 'battleRoyal', 'eliminated');
        ctx.store.rankAdd('brSurvival', ctx.playerId, 0);
        return {
            ok: true, message: `${playerRoom.id} 号房间被攻破，你被淘汰。获得匕首 ×${dagger}（败者遗物）、赛季积分 +5`,
            items: [{ templateId: 'dagger', qty: dagger }], counters: { round: state.round, outcome: 0 },
            rank: { board: 'seasonScore', score: 5 }, history: `大逃杀：${state.round} 轮后被淘汰（原 ${playerRoom.id} 号房）`,
            rewards: [], fx: ['lose'],
        };
    }
    // 幸存：按本房投入占幸存池比例分池
    const alive = state.rooms.filter((r) => r.alive);
    const distributable = Math.floor(state.pool * (1 - feeRate));
    const myShare = Math.floor((playerRoom.stake / Math.max(1, alive.reduce((s, r) => s + r.stake, 0))) * distributable);
    const profit = myShare - entry;
    ctx.econ.grant(ctx.playerId, 'COIN', myShare, 'battleRoyal.settle', 'survive');
    ctx.econ.grant(ctx.playerId, 'SEASON_SCORE', 20, 'battleRoyal', 'survive');
    ctx.store.rankAdd('brSurvival', ctx.playerId, 1);
    return {
        ok: true, message: `幸存到最后一刻！${playerRoom.id} 号房间分得 ${myShare} 金币（投入 ${entry}，${profit >= 0 ? '净赚' : '净亏'} ${Math.abs(profit)}），赛季积分 +20`,
        rewards: [{ assetId: 'COIN', delta: myShare }, { assetId: 'SEASON_SCORE', delta: 20 }],
        counters: { round: state.round, outcome: 1 }, rank: { board: 'seasonScore', score: 20 },
        history: `大逃杀幸存：${state.round} 轮，分得 ${myShare} 金币`, fx: ['win'],
    };
}
/** 剥离杀手目标等私密信息后发给客户端（对空/进行中的 session 数据安全） */
function sanitize(state) {
    if (!state || !Array.isArray(state.rooms))
        return { rooms: [], round: 0, eliminatedRooms: [], pool: 0, playerRoom: null, killerAt: -1, finished: true };
    return { ...state, killerAt: -1, rooms: state.rooms.map((r) => ({ ...r, players: r.players.map((p) => (p.startsWith('npc_') ? 'npc' : p)) })) };
}
