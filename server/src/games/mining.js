"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.multiplePit = exports.goldMine = exports.apeMine = void 0;
/**
 * Wave 3 —— 生产经济：猿岛矿场（私矿/好友矿/多矿坑）/ 黄金矿场 / 多人矿坑。
 * 证据: 原版对应页清单见研究归档（ROUTE_PARITY_680，不随包分发）。
 * 经济: 矿坑定时产出 → 领取走 Ledger；黄金矿场挖矿→精炼→（Release: NPC 兑换 / Full: 沙盒交易）。
 */
const types_1 = require("./types");
// ---------------- 猿岛矿场 ----------------
exports.apeMine = {
    id: 'apeMine',
    readState: (ctx) => {
        const pitCount = ctx.num('apeMine.pitCount', 4);
        const pits = Array.from({ length: pitCount }, (_, i) => {
            var _a, _b;
            const unlocked = ((_a = ctx.player.counters['mine.unlocked']) !== null && _a !== void 0 ? _a : 1) > i;
            const readyAt = (_b = ctx.player.timestamps[`mine.pit${i}.readyAt`]) !== null && _b !== void 0 ? _b : 0;
            return {
                idx: i + 1, unlocked,
                working: unlocked && readyAt > 0,
                ready: unlocked && readyAt > 0 && ctx.now >= readyAt,
                readyInSeconds: readyAt > 0 ? Math.max(0, Math.ceil((readyAt - ctx.now) / 1000)) : 0,
                durationMinutes: ctx.num('apeMine.pitDurationMinutes', 60),
            };
        });
        return {
            pits,
            friendMineBonus: ctx.num('apeMine.friendMineBonus', 0.1),
            unlockPitCostGem: ctx.num('apeMine.unlockPitCostGem', [0, 20, 60, 150]) || undefined,
            gemstone: ctx.store.ledger.balanceOf(ctx.playerId, 'GEMSTONE'),
            sand: ctx.store.ledger.balanceOf(ctx.playerId, 'SAND'),
            history: ctx.store.history(ctx.playerId, 'apeMine', 20),
        };
    },
    actions: {
        /** 开采一个矿坑（进入生产倒计时） */
        startPit: (ctx) => {
            var _a, _b;
            const idx = Math.max(1, Math.floor(Number(ctx.payload.pitIdx) || 1));
            const unlocked = ((_a = ctx.player.counters['mine.unlocked']) !== null && _a !== void 0 ? _a : 1) >= idx;
            if (!unlocked)
                return (0, types_1.fail)('矿坑未解锁');
            const key = `mine.pit${idx - 1}.readyAt`;
            if (((_b = ctx.player.timestamps[key]) !== null && _b !== void 0 ? _b : 0) > 0)
                return (0, types_1.fail)('该矿坑已在生产中');
            const withFriend = !!ctx.payload.withFriend;
            const durationMs = ctx.num('apeMine.pitDurationMinutes', 60) * 60000 * (withFriend ? 0.8 : 1);
            ctx.player.timestamps[key] = ctx.now + durationMs;
            ctx.player.timestamps[`mine.pit${idx - 1}.friend`] = withFriend ? 1 : 0;
            return (0, types_1.ok)(`${idx} 号矿坑开始生产${withFriend ? '（好友协助，时间 -20%）' : ''}`, { state: { idx, readyAt: ctx.player.timestamps[key] } });
        },
        /** 收取矿坑产出（服务器按 readyAt 结算，产出 = 区间随机 + 好友加成） */
        claimPit: (ctx) => {
            var _a;
            const idx = Math.max(1, Math.floor(Number(ctx.payload.pitIdx) || 1));
            const key = `mine.pit${idx - 1}.readyAt`;
            const readyAt = (_a = ctx.player.timestamps[key]) !== null && _a !== void 0 ? _a : 0;
            if (!readyAt)
                return (0, types_1.fail)('该矿坑没有在生产');
            if (ctx.now < readyAt)
                return (0, types_1.fail)(`还需 ${Math.ceil((readyAt - ctx.now) / 60000)} 分钟`);
            const withFriend = ctx.player.timestamps[`mine.pit${idx - 1}.friend`] === 1;
            const gem = ctx.numRange('apeMine.pitYieldGemRange', ctx.rng, [2, 6]);
            const sand = ctx.rng.int(2, 8);
            const bonus = withFriend ? 1 + ctx.num('apeMine.friendMineBonus', 0.1) : 1;
            const gemOut = Math.max(1, Math.floor(gem * bonus));
            ctx.econ.grant(ctx.playerId, 'GEMSTONE', gemOut, 'apeMine', `pit${idx}`);
            ctx.econ.grant(ctx.playerId, 'SAND', Math.floor(sand * bonus), 'apeMine', `pit${idx}`);
            ctx.player.timestamps[key] = 0;
            ctx.store.pushHistory(ctx.playerId, 'apeMine', `${idx} 号矿坑产出 宝石×${gemOut} 金沙×${Math.floor(sand * bonus)}`, [{ assetId: 'GEMSTONE', delta: gemOut }]);
            return (0, types_1.ok)(`${idx} 号矿坑收获：宝石 +${gemOut}，金沙 +${Math.floor(sand * bonus)}${withFriend ? '（含好友加成）' : ''}`, {
                rewards: [{ assetId: 'GEMSTONE', delta: gemOut }, { assetId: 'SAND', delta: Math.floor(sand * bonus) }], history: `矿坑${idx}收获`, fx: ['mineClaim'],
            });
        },
        /** 解锁新矿坑（宝石消耗） */
        unlockPit: (ctx) => {
            var _a;
            const costs = [0, 20, 60, 150];
            const next = ((_a = ctx.player.counters['mine.unlocked']) !== null && _a !== void 0 ? _a : 1) + 1;
            if (next > costs.length)
                return (0, types_1.fail)('矿坑已全部解锁');
            const cost = costs[next - 1];
            if (!ctx.econ.payFrom(ctx.player, { GEMSTONE: cost }, 'apeMine.unlock', `pit${next}`))
                return (0, types_1.fail)(`宝石不足（需要 ${cost}）`);
            ctx.player.counters['mine.unlocked'] = next;
            return (0, types_1.ok)(`${next} 号矿坑已解锁`);
        },
    },
};
// ---------------- 黄金矿场 ----------------
exports.goldMine = {
    id: 'goldMine',
    readState: (ctx) => {
        var _a;
        return ({
            stamina: (_a = ctx.player.counters['gold.stamina']) !== null && _a !== void 0 ? _a : ctx.num('goldMine.minerStamina', 100),
            maxStamina: ctx.num('goldMine.minerStamina', 100),
            ore: ctx.store.ledger.balanceOf(ctx.playerId, 'ORE'),
            gold: ctx.store.ledger.balanceOf(ctx.playerId, 'GOLD'),
            cycleSeconds: ctx.num('goldMine.cycleSeconds', 45),
            npcExchangeRate: ctx.num('warcraft.exchangeRateOreToApeStone', 10),
            history: ctx.store.history(ctx.playerId, 'goldMine', 20),
            tradeMode: ctx.profile === 'wechat-release' ? 'npc-exchange' : 'sandbox-market',
        });
    },
    actions: {
        /** 挖矿一周期（真实循环：矿工移动→挖掘→产出矿石） */
        dig: (ctx) => {
            var _a, _b;
            const stamina = (_a = ctx.player.counters['gold.stamina']) !== null && _a !== void 0 ? _a : ctx.num('goldMine.minerStamina', 100);
            if (stamina < 10)
                return (0, types_1.fail)('矿工体力不足，等待恢复（每 5 分钟 +5）');
            const last = (_b = ctx.player.timestamps['gold.staminaAt']) !== null && _b !== void 0 ? _b : ctx.now;
            const regained = Math.floor((ctx.now - last) / 300000) * 5;
            const cur = Math.min(ctx.num('goldMine.minerStamina', 100), stamina + Math.max(0, regained));
            if (cur < 10)
                return (0, types_1.fail)('矿工体力不足');
            ctx.player.counters['gold.stamina'] = cur - 10;
            ctx.player.timestamps['gold.staminaAt'] = ctx.now;
            const ore = ctx.numRange('goldMine.orePerCycle', ctx.rng, [4, 9]);
            ctx.econ.grant(ctx.playerId, 'ORE', ore, 'goldMine', 'dig');
            return (0, types_1.ok)(`矿工挖掘完成，矿石 +${ore}（矿工体力 ${cur - 10}/100）`, { rewards: [{ assetId: 'ORE', delta: ore }], fx: ['dig'] });
        },
        /** 精炼：矿石 → 黄金 */
        refine: (ctx) => {
            const cost = ctx.num('goldMine.refineGoldOreCost', 20);
            if (ctx.store.ledger.balanceOf(ctx.playerId, 'ORE') < cost)
                return (0, types_1.fail)(`矿石不足（精炼需 ${cost}）`);
            ctx.econ.spend(ctx.playerId, 'ORE', cost, 'goldMine.refine', 'refine');
            const gold = ctx.numRange('goldMine.refineGoldOut', ctx.rng, [1, 3]);
            ctx.econ.grant(ctx.playerId, 'GOLD', gold, 'goldMine', 'refine');
            ctx.store.pushHistory(ctx.playerId, 'goldMine', `精炼 ${cost} 矿石 → 黄金 ×${gold}`, [{ assetId: 'GOLD', delta: gold }]);
            return (0, types_1.ok)(`精炼完成，黄金 +${gold}`, { rewards: [{ assetId: 'GOLD', delta: gold }], fx: ['refine'] });
        },
        /** 矿石交易：Release=NPC 兑换（矿石→猿石）；Full=挂入沙盒市场的引导 */
        tradeOre: (ctx) => {
            const rate = ctx.num('warcraft.exchangeRateOreToApeStone', 10);
            const qty = Math.max(1, Math.floor(Number(ctx.payload.qty) || 1));
            const need = rate * qty;
            if (ctx.store.ledger.balanceOf(ctx.playerId, 'ORE') < need)
                return (0, types_1.fail)(`矿石不足（兑换 ${qty} 猿石需 ${need}）`);
            ctx.econ.spend(ctx.playerId, 'ORE', need, 'goldMine.npcExchange', 'exchange');
            ctx.econ.grant(ctx.playerId, 'APE_STONE', qty, 'goldMine.npcExchange', 'exchange');
            return (0, types_1.ok)(`NPC 兑换成功：矿石 -${need} → 猿石 +${qty}`, { rewards: [{ assetId: 'APE_STONE', delta: qty }], fx: ['npcExchange'] });
        },
    },
};
// ---------------- 多人矿坑 ----------------
exports.multiplePit = {
    id: 'multiplePit',
    readState: (ctx) => {
        const round = Math.floor(ctx.now / (ctx.num('multiplePit.durationMinutes', 30) * 60000));
        const joined = ctx.player.counters[`mpit.round${round}`] === 1;
        return {
            round, joined,
            players: ctx.num('multiplePit.players', 5),
            durationMinutes: ctx.num('multiplePit.durationMinutes', 30),
            endsInSeconds: Math.max(0, Math.ceil(((round + 1) * ctx.num('multiplePit.durationMinutes', 30) * 60000 - ctx.now) / 1000)),
            grandPrizeLog: ctx.store.history(ctx.playerId, 'multiplePit', 10),
            seasonPoolTop: ctx.store.rankTop('seasonScore', 5).map((r, i) => { var _a, _b; return ({ rank: i + 1, nick: (_b = (_a = ctx.store.player(r.playerId)) === null || _a === void 0 ? void 0 : _a.nick) !== null && _b !== void 0 ? _b : r.playerId, score: r.score }); }),
        };
    },
    actions: {
        /** 参与本轮多人矿坑（30 分钟一轮，NPC 同采，结算时按产量瓜分 + 大奖抽取） */
        join: (ctx) => {
            const round = Math.floor(ctx.now / (ctx.num('multiplePit.durationMinutes', 30) * 60000));
            if (ctx.player.counters[`mpit.round${round}`])
                return (0, types_1.fail)('本轮已参与，等待结算');
            const cost = ctx.num('energy.mineCost', 2);
            if (!ctx.econ.payFrom(ctx.player, { ENERGY: cost }, 'multiplePit.join', `round${round}`))
                return (0, types_1.fail)('体力不足');
            ctx.player.counters[`mpit.round${round}`] = 1;
            ctx.player.timestamps['mpit.roundStart'] = ctx.now;
            return (0, types_1.ok)(`已加入第 ${round} 轮多人矿坑（${ctx.num('multiplePit.players', 5)} 人同采），本轮结束时结算`, { state: { round } });
        },
        /** 结算本轮（时间到后可领） */
        settle: (ctx) => {
            const durMs = ctx.num('multiplePit.durationMinutes', 30) * 60000;
            const round = Math.floor(ctx.now / durMs);
            const prevRound = round - 1;
            if (!ctx.player.counters[`mpit.round${prevRound}`])
                return (0, types_1.fail)('没有可结算的轮次');
            if (ctx.now < (round * durMs))
                return (0, types_1.fail)(`本轮还在进行，上轮将在 ${Math.ceil((round * durMs - ctx.now) / 60000)} 分钟后可结算`);
            ctx.player.counters[`mpit.round${prevRound}`] = 0;
            const yield_ = ctx.numRange('multiplePit.yieldPerPlayer', ctx.rng, [20, 60]);
            const grand = ctx.rng.int(1, ctx.num('multiplePit.players', 5)) === 1;
            ctx.econ.grant(ctx.playerId, 'COIN', yield_, 'multiplePit', `round${prevRound}`);
            ctx.econ.grant(ctx.playerId, 'SEASON_SCORE', 10, 'multiplePit', `round${prevRound}`);
            let msg = `第 ${prevRound} 轮结算：产出金币 +${yield_}，赛季积分 +10`;
            const rewards = [{ assetId: 'COIN', delta: yield_ }, { assetId: 'SEASON_SCORE', delta: 10 }];
            if (grand) {
                ctx.econ.grant(ctx.playerId, 'GEMSTONE', 8, 'multiplePit', 'grandPrize');
                rewards.push({ assetId: 'GEMSTONE', delta: 8 });
                msg += '；你是本轮 GrandPrize 幸运矿工！宝石 +8';
                ctx.store.pushHistory(ctx.playerId, 'multiplePit', `第 ${prevRound} 轮获得 GrandPrize！`, rewards);
            }
            else {
                ctx.store.pushHistory(ctx.playerId, 'multiplePit', `第 ${prevRound} 轮正常结算 +${yield_}`, rewards);
            }
            return (0, types_1.ok)(msg, { rewards, rank: { board: 'seasonScore', score: 10 }, fx: grand ? ['grandPrize'] : ['settle'] });
        },
    },
};
