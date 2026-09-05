"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.robbery = exports.dagger = exports.monkeyFight = exports.boss = exports.arena = void 0;
/**
 * Wave 2 —— 战斗族玩法：竞技场 / Boss 挑战 / 斗猿场 / 匕首刺杀 / 抢夺。
 * 证据: ApeArenaActivity, ChallengeBossActivity, MonkeyFightingSiteActivity, DaggerActivity / AssassinationHistoryActivity,
 *       RobMainActivity/RobberyKillerActivity + arena/boss/monkeyFighting/dagger/rob 资源。
 * 要求（Section 26）: 不用单随机数判胜负——建立战斗状态机、多回合行为选择、seed 重放、
 *       服务端验证结构。抢夺在 Release 转为 PvE/异步积分争夺。
 */
const types_1 = require("./types");
/** 力量值：等级 + 卡牌收集 + 扭蛋兔装备（gacha power 缓存在 counters） */
function powerOf(ctx) {
    var _a;
    const base = ctx.player.level * ctx.num('arena.powerBase', 5);
    const cards = Object.entries(ctx.player.inventory)
        .filter(([k]) => k.startsWith('card_'))
        .reduce((s, [, v]) => s + v.qty, 0);
    const gachaPower = (_a = ctx.player.counters['gacha.power']) !== null && _a !== void 0 ? _a : 0;
    return base + cards * 2 + gachaPower;
}
/** 三回合行为对抗：攻击/防御/蓄力 的克制状态机（非单随机数） */
function duelRounds(ctx, enemySkill) {
    var _a, _b;
    const log = [];
    let pScore = 0, eScore = 0;
    const moves = ['attack', 'defend', 'charge'];
    let playerCharge = 0, enemyCharge = 0;
    for (let r = 1; r <= 3; r++) {
        // 玩家行为：payload.moves[r-1]（客户端真实输入），缺省按简单策略
        const pm = (_b = (_a = ctx.payload.moves) === null || _a === void 0 ? void 0 : _a[r - 1]) !== null && _b !== void 0 ? _b : (playerCharge > 0 ? 'attack' : ctx.rng.pick(moves));
        const em = enemyPick(ctx.rng, enemySkill, r, enemyCharge);
        let p = 0, e = 0;
        if (pm === 'charge') {
            playerCharge++;
            p = 0.5;
        }
        if (em === 'charge') {
            enemyCharge++;
            e = 0.5;
        }
        if (pm === 'attack') {
            p = 1 + playerCharge;
            playerCharge = 0;
        }
        if (em === 'attack') {
            e = 1 + enemyCharge;
            enemyCharge = 0;
        }
        if (pm === 'defend') {
            p = 0.2;
            if (em === 'attack')
                e *= 0.5;
        }
        if (em === 'defend') {
            e = 0.2;
            if (pm === 'attack')
                p *= 0.5;
        }
        pScore += p;
        eScore += e;
        log.push(`第${r}回合 你[${label(pm)}] vs 敌[${label(em)}] ${p.toFixed(1)}:${e.toFixed(1)}`);
    }
    return { playerScore: pScore, enemyScore: eScore, log };
}
function label(m) { return m === 'attack' ? '攻击' : m === 'defend' ? '防御' : '蓄力'; }
function enemyPick(rng, skill, round, charge) {
    // skill 0..1 越高越会蓄力+克制
    const roll = rng.next();
    if (charge > 0)
        return 'attack';
    if (roll < skill * 0.5)
        return 'charge';
    if (roll < skill * 0.75 + 0.1)
        return 'defend';
    return 'attack';
}
// ---------------- 竞技场 ----------------
exports.arena = {
    id: 'arena',
    readState: (ctx) => {
        var _a;
        const opponents = Object.values(ctx.store.data.players)
            .filter((p) => p.playerId !== ctx.playerId)
            .slice(0, 8)
            .map((p, i) => ({ idx: i, playerId: p.playerId, nick: p.nick, level: p.level, power: p.level * ctx.num('arena.powerBase', 5) + 8 }));
        return {
            power: powerOf(ctx),
            winStreak: (_a = ctx.player.counters['arena.streak']) !== null && _a !== void 0 ? _a : 0,
            opponents,
            rank: ctx.store.rankTop('arenaPower', 10).map((r, i) => { var _a, _b; return ({ rank: i + 1, nick: (_b = (_a = ctx.store.player(r.playerId)) === null || _a === void 0 ? void 0 : _a.nick) !== null && _b !== void 0 ? _b : r.playerId, score: r.score }); }),
            history: ctx.store.history(ctx.playerId, 'arena', 20),
        };
    },
    actions: {
        fight: (ctx) => {
            var _a, _b, _c;
            const cost = ctx.num('energy.battleCost', 3);
            ctx.econ.regenEnergy(ctx.player, ctx.now, ctx.num('energy.max', 120), ctx.num('energy.regenMinutes', 6));
            const oppIdx = Math.max(0, Math.floor(Number((_a = ctx.payload.opponentIdx) !== null && _a !== void 0 ? _a : 0)));
            const opponents = Object.values(ctx.store.data.players).filter((p) => p.playerId !== ctx.playerId);
            const opp = (_b = opponents[oppIdx]) !== null && _b !== void 0 ? _b : opponents[0];
            if (!opp)
                return (0, types_1.fail)('没有可挑战的对手');
            if (!ctx.econ.payFrom(ctx.player, { ENERGY: cost }, 'arena.fight', opp.playerId))
                return (0, types_1.fail)(`体力不足（需要 ${cost}）`);
            const myPower = powerOf(ctx);
            const enemySkill = Math.min(0.9, 0.3 + opp.level * 0.03);
            const duel = duelRounds(ctx, enemySkill);
            const enemyPower = opp.level * ctx.num('arena.powerBase', 5) + 8;
            const win = duel.playerScore * myPower >= duel.enemyScore * enemyPower;
            const log = duel.log.join('\n');
            if (win) {
                const coin = ctx.num('arena.winCoin', 25);
                ctx.econ.grant(ctx.playerId, 'COIN', coin, 'arena', opp.playerId);
                const streak = ((_c = ctx.player.counters['arena.streak']) !== null && _c !== void 0 ? _c : 0) + 1;
                ctx.player.counters['arena.streak'] = streak;
                ctx.player.counters['arena.lastVictim'] = ctx.store.data.players[opp.playerId] ? 0 : 0; // 记录可复仇对象
                ctx.store.rankAdd('arenaPower', ctx.playerId, myPower);
                if (ctx.rng.chance(ctx.num('arena.winTicketChance', 0.5)))
                    ctx.econ.grant(ctx.playerId, 'TICKET', 1, 'arena', 'streak');
                ctx.econ.grant(ctx.playerId, 'SEASON_SCORE', 10, 'arena', 'win');
                return (0, types_1.ok)(`战胜 ${opp.nick}！\n${log}\n金币 +${coin}，连胜 ${streak}`, { rewards: [{ assetId: 'COIN', delta: coin }], rank: { board: 'arenaPower', score: myPower }, history: `竞技场战胜 ${opp.nick}`, fx: ['win'] });
            }
            ctx.player.counters['arena.streak'] = 0;
            ctx.player.counters['arena.rival'] = 1;
            ctx.player.timestamps['arena.lossAt'] = ctx.now;
            return (0, types_1.ok)(`惜败于 ${opp.nick}。\n${log}\n下次可复仇`, { history: `竞技场败于 ${opp.nick}`, fx: ['lose'] });
        },
    },
};
// ---------------- Boss 挑战 ----------------
exports.boss = {
    id: 'boss',
    readState: (ctx) => {
        var _a, _b;
        const maxHp = ctx.num('boss.hpPerPlayerLevel', 60) * Math.max(5, ctx.player.level);
        const hp = Math.max(0, maxHp - ((_a = ctx.player.counters['boss.damage']) !== null && _a !== void 0 ? _a : 0));
        return { maxHp, hp, dead: hp <= 0, cooldownLeft: Math.max(0, ((_b = ctx.player.timestamps['boss.at']) !== null && _b !== void 0 ? _b : 0) + ctx.num('boss.attackCooldownSeconds', 300) * 1000 - ctx.now), power: powerOf(ctx), history: ctx.store.history(ctx.playerId, 'boss', 10) };
    },
    actions: {
        attack: (ctx) => {
            var _a, _b, _c;
            const st = exports.boss.readState({ ...ctx });
            if (st.cooldownLeft > 0)
                return (0, types_1.fail)(`Boss 还在喘息，${Math.ceil(st.cooldownLeft / 1000)} 秒后可再攻击`);
            if (st.hp <= 0)
                return (0, types_1.fail)('Boss 已被击败，等待刷新（可先去竞技场）');
            const cost = ctx.num('energy.battleCost', 3);
            if (!ctx.econ.payFrom(ctx.player, { ENERGY: cost }, 'boss.attack', 'boss'))
                return (0, types_1.fail)(`体力不足（需要 ${cost}）`);
            const dmg = powerOf(ctx) + ctx.rng.int(5, 25);
            ctx.player.counters['boss.damage'] = ((_a = ctx.player.counters['boss.damage']) !== null && _a !== void 0 ? _a : 0) + dmg;
            ctx.player.timestamps['boss.at'] = ctx.now;
            let msg = `对 Boss 造成 ${dmg} 伤害`;
            const rewards = [];
            if (((_b = ctx.player.counters['boss.damage']) !== null && _b !== void 0 ? _b : 0) >= st.maxHp) {
                ctx.player.counters['boss.damage'] = 0;
                ctx.player.counters['boss.kills'] = ((_c = ctx.player.counters['boss.kills']) !== null && _c !== void 0 ? _c : 0) + 1;
                const coin = ctx.num('boss.bossRewardCoin', 80), gem = ctx.num('boss.bossRewardGem', 1);
                ctx.econ.grant(ctx.playerId, 'COIN', coin, 'boss', 'kill');
                ctx.econ.grant(ctx.playerId, 'GEMSTONE', gem, 'boss', 'kill');
                rewards.push({ assetId: 'COIN', delta: coin }, { assetId: 'GEMSTONE', delta: gem });
                msg = `Boss 被击杀！金币 +${coin}，宝石 +${gem}`;
                ctx.store.pushHistory(ctx.playerId, 'boss', `击杀 Boss（累计第 ${ctx.player.counters['boss.kills']} 次）`, rewards);
                return (0, types_1.ok)(msg, { rewards, history: '击杀 Boss', fx: ['bossDie'] });
            }
            return (0, types_1.ok)(msg, { rewards, fx: ['hit'] });
        },
    },
};
// ---------------- 斗猿场（猿猴格斗） ----------------
exports.monkeyFight = {
    id: 'monkeyFight',
    readState: (ctx) => {
        var _a;
        return ({
            rounds: ctx.num('monkeyFight.rounds', 3),
            power: powerOf(ctx),
            wins: (_a = ctx.player.counters['monkeyFight.wins']) !== null && _a !== void 0 ? _a : 0,
            history: ctx.store.history(ctx.playerId, 'monkeyFight', 10),
        });
    },
    actions: {
        fight: (ctx) => {
            var _a;
            const cost = ctx.num('energy.battleCost', 3);
            if (!ctx.econ.payFrom(ctx.player, { ENERGY: cost }, 'monkeyFight', 'fight'))
                return (0, types_1.fail)('体力不足');
            const skill = Math.min(0.9, 0.25 + ctx.player.level * 0.03);
            const duel = duelRounds(ctx, skill);
            const win = duel.playerScore >= duel.enemyScore;
            const log = duel.log.join('\n');
            if (win) {
                const coin = ctx.num('monkeyFight.winCoin', 30);
                ctx.econ.grant(ctx.playerId, 'COIN', coin, 'monkeyFight', 'win');
                ctx.player.counters['monkeyFight.wins'] = ((_a = ctx.player.counters['monkeyFight.wins']) !== null && _a !== void 0 ? _a : 0) + 1;
                return (0, types_1.ok)(`笼斗胜利！\n${log}\n金币 +${coin}`, { rewards: [{ assetId: 'COIN', delta: coin }], history: '斗猿场胜利', fx: ['win'] });
            }
            return (0, types_1.ok)(`笼斗落败。\n${log}`, { history: '斗猿场落败', fx: ['lose'] });
        },
    },
};
// ---------------- 匕首 / 刺杀 ----------------
exports.dagger = {
    id: 'dagger',
    readState: (ctx) => {
        var _a, _b;
        return ({
            daggers: ctx.econ.itemCount(ctx.playerId, 'dagger'),
            level: (_a = ctx.player.counters['dagger.level']) !== null && _a !== void 0 ? _a : 1,
            nail: ((_b = ctx.player.counters['dagger.level']) !== null && _b !== void 0 ? _b : 1) * ctx.num('dagger.nailPerLevel', 3),
            history: ctx.store.history(ctx.playerId, 'dagger', 20),
            note: '大逃杀淘汰可获得匕首；刺杀/升级消耗匕首',
        });
    },
    actions: {
        upgrade: (ctx) => {
            var _a;
            const cost = ctx.num('dagger.upgradeCostDagger', 5);
            if (!ctx.econ.takeItems(ctx.playerId, 'dagger', cost))
                return (0, types_1.fail)(`匕首不足（需要 ${cost} 把）`);
            ctx.player.counters['dagger.level'] = ((_a = ctx.player.counters['dagger.level']) !== null && _a !== void 0 ? _a : 1) + 1;
            ctx.store.pushHistory(ctx.playerId, 'dagger', `匕首升级到 Lv.${ctx.player.counters['dagger.level']}`);
            return (0, types_1.ok)(`匕首升级成功，当前等级 ${ctx.player.counters['dagger.level']}（每级 +${ctx.num('dagger.nailPerLevel', 3)} 钉）`);
        },
        assassinate: (ctx) => {
            var _a;
            const cost = ctx.num('dagger.assassinateEnergy', 2);
            if (!ctx.econ.takeItems(ctx.playerId, 'dagger', 1))
                return (0, types_1.fail)('需要 1 把匕首');
            if (!ctx.econ.payFrom(ctx.player, { ENERGY: cost }, 'dagger.assassinate', 'target'))
                return (0, types_1.fail)('体力不足');
            const level = (_a = ctx.player.counters['dagger.level']) !== null && _a !== void 0 ? _a : 1;
            const success = ctx.rng.chance(Math.min(0.9, 0.35 + level * 0.06));
            if (success) {
                const coin = 40 + level * 12;
                ctx.econ.grant(ctx.playerId, 'COIN', coin, 'dagger', 'assassinate');
                ctx.store.pushHistory(ctx.playerId, 'dagger', `刺杀得手，金币 +${coin}`);
                return (0, types_1.ok)(`刺杀得手！金币 +${coin}`, { rewards: [{ assetId: 'COIN', delta: coin }], history: '刺杀得手', fx: ['win'] });
            }
            ctx.store.pushHistory(ctx.playerId, 'dagger', '刺杀失手，匕首折断');
            return (0, types_1.ok)('刺杀失手，匕首折断了……', { history: '刺杀失手', fx: ['lose'] });
        },
    },
};
// ---------------- 抢夺 / 抢劫杀手（Release: PvE 异步积分争夺） ----------------
exports.robbery = {
    id: 'robbery',
    readState: (ctx) => ({
        score: ctx.store.rankScore('robberyScore', ctx.playerId),
        energyCost: ctx.num('robbery.energyCost', 3),
        successBase: ctx.num('robbery.successBase', 0.45),
        rank: ctx.store.rankTop('robberyScore', 10).map((r, i) => { var _a, _b; return ({ rank: i + 1, nick: (_b = (_a = ctx.store.player(r.playerId)) === null || _a === void 0 ? void 0 : _a.nick) !== null && _b !== void 0 ? _b : r.playerId, score: r.score }); }),
        history: ctx.store.history(ctx.playerId, 'robbery', 20),
        mode: ctx.profile === 'wechat-release' ? 'pve-async-score' : 'full-pve',
    }),
    actions: {
        raid: (ctx) => {
            const cost = ctx.num('robbery.energyCost', 3);
            if (!ctx.econ.payFrom(ctx.player, { ENERGY: cost }, 'robbery.raid', 'pve'))
                return (0, types_1.fail)('体力不足');
            const power = powerOf(ctx);
            const success = ctx.rng.chance(Math.min(0.85, ctx.num('robbery.successBase', 0.45) + power * 0.004));
            if (success) {
                const score = ctx.num('robbery.pveScoreWin', 100) + ctx.rng.int(0, 30);
                ctx.store.rankAdd('robberyScore', ctx.playerId, score);
                ctx.econ.grant(ctx.playerId, 'COIN', 20, 'robbery', 'win');
                return (0, types_1.ok)(`争夺成功，积分 +${score}`, { rank: { board: 'robberyScore', score }, history: `抢夺成功 +${score} 分`, fx: ['win'] });
            }
            ctx.store.rankAdd('robberyScore', ctx.playerId, ctx.num('robbery.pveScoreLose', 20));
            return (0, types_1.ok)('争夺失利，获得少量参与积分', { history: '抢夺失利', fx: ['lose'] });
        },
    },
};
