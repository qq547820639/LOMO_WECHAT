"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.daily = exports.box = exports.gacha = exports.cards = void 0;
exports.markDailyTask = markDailyTask;
/**
 * Wave 1/5 —— 收集与成长：卡牌合成 / 扭蛋兔养成 / 盲盒福袋 / 每日签到任务。
 * 证据: SynthesisCardActivity / MyCardLibraryActivity / ApeComposeCardActivity / ApeSplitCardActivity、normal_egg / medal_egg / rock_egg / dress_*、
 *       OpenBoxActivity / TreasureBoxActivity / LuckyBagActivity（免费钥匙链路）。
 * 合规: 付费随机抽取关闭；全部为免费产出/任务钥匙链路；概率走 RemoteConfig。
 */
const types_1 = require("./types");
const card_data_1 = require("./card_data");
// ---------------- 卡牌（收集/合成/拆分/图鉴） ----------------
exports.cards = {
    id: 'cards',
    readState: (ctx) => {
        const owned = Object.entries(ctx.player.inventory).filter(([k, v]) => k.startsWith('card_') && v.qty > 0);
        return {
            collection: card_data_1.CARD_TEMPLATES.map((t) => ({
                ...t, owned: ctx.econ.itemCount(ctx.playerId, t.templateId), plus: ctx.econ.itemCount(ctx.playerId, `${t.templateId}_plus`),
            })),
            ownedCount: owned.reduce((s, [, v]) => s + v.qty, 0),
            dust: ctx.store.ledger.balanceOf(ctx.playerId, 'INTEGRAL'),
            synthNeed: ctx.num('cards.synthDuplicateCount', 3),
            splitDustRate: ctx.num('cards.splitDustRate', 0.34),
        };
    },
    actions: {
        /** 免费掉落卡牌（任务/玩法产出链路，非付费抽取） */
        freeDraw: (ctx) => {
            const cost = ctx.num('energy.minigameCost', 1);
            if (!ctx.econ.payFrom(ctx.player, { ENERGY: cost }, 'cards.freeDraw', 'drop'))
                return (0, types_1.fail)('体力不足');
            const t = drawCard(ctx.rng);
            ctx.econ.addItems(ctx.playerId, t.templateId, 1);
            ctx.econ.grant(ctx.playerId, 'INTEGRAL', 2, 'cards', 'freeDraw');
            return (0, types_1.ok)(`获得卡牌「${t.name}」(${t.rarity})，积分 +2`, { items: [{ templateId: t.templateId, qty: 1 }], fx: ['cardDrop'] });
        },
        /** 3 张同名 → 合成 _plus（3 duplicate → synthesis） */
        synth: (ctx) => {
            var _a, _b;
            const need = ctx.num('cards.synthDuplicateCount', 3);
            const templateId = String(ctx.payload.templateId || '');
            const candidates = templateId ? [templateId] : Object.keys(ctx.player.inventory).filter((k) => k.startsWith('card_') && !k.endsWith('_plus') && ctx.econ.itemCount(ctx.playerId, k) >= need);
            const target = candidates.find((k) => ctx.econ.itemCount(ctx.playerId, k) >= need);
            if (!target)
                return (0, types_1.fail)(`需要任意同名卡 ${need} 张`);
            ctx.econ.takeItems(ctx.playerId, target, need);
            ctx.econ.addItems(ctx.playerId, `${target}_plus`, 1);
            const t = card_data_1.CARD_TEMPLATES.find((x) => x.templateId === target);
            ctx.store.pushHistory(ctx.playerId, 'cards', `合成成功：${(_a = t === null || t === void 0 ? void 0 : t.name) !== null && _a !== void 0 ? _a : target} ×${need} → +1 强化`, [{ assetId: 'INTEGRAL', delta: 0 }]);
            return (0, types_1.ok)(`合成成功：${(_b = t === null || t === void 0 ? void 0 : t.name) !== null && _b !== void 0 ? _b : target} ×${need} → 强化卡 ×1`, { items: [{ templateId: `${target}_plus`, qty: 1 }], fx: ['synth'] });
        },
        /** 拆分：卡牌 → 积分粉尘 */
        split: (ctx) => {
            var _a, _b;
            const templateId = String(ctx.payload.templateId || '');
            if (!templateId || !ctx.econ.takeItems(ctx.playerId, templateId, 1))
                return (0, types_1.fail)('没有可拆分的卡牌');
            const t = card_data_1.CARD_TEMPLATES.find((x) => x.templateId === templateId);
            const dust = Math.max(1, Math.floor(((_a = t === null || t === void 0 ? void 0 : t.power) !== null && _a !== void 0 ? _a : 5) * ctx.num('cards.splitDustRate', 0.34)));
            ctx.econ.grant(ctx.playerId, 'INTEGRAL', dust, 'cards', 'split');
            return (0, types_1.ok)(`拆分「${(_b = t === null || t === void 0 ? void 0 : t.name) !== null && _b !== void 0 ? _b : templateId}」获得积分 +${dust}`, { rewards: [{ assetId: 'INTEGRAL', delta: dust }] });
        },
        /** 粉尘合成：积分 → 随机卡（非付费随机，纯游戏内资源兑换） */
        dustSynth: (ctx) => {
            const cost = ctx.num('cards.dustSynthCost', 30);
            if (ctx.store.ledger.balanceOf(ctx.playerId, 'INTEGRAL') < cost)
                return (0, types_1.fail)(`积分不足（需要 ${cost}）`);
            ctx.econ.spend(ctx.playerId, 'INTEGRAL', cost, 'cards', 'dustSynth');
            const t = drawCard(ctx.rng);
            ctx.econ.addItems(ctx.playerId, t.templateId, 1);
            return (0, types_1.ok)(`积分合成获得「${t.name}」(${t.rarity})`, { items: [{ templateId: t.templateId, qty: 1 }], fx: ['synth'] });
        },
    },
};
function drawCard(rng) {
    const t = rng.weighted(card_data_1.CARD_TEMPLATES.map((c) => ({ value: c, weight: c.rarity === 'N' ? 60 : c.rarity === 'R' ? 27 : c.rarity === 'SR' ? 10 : 3 })));
    return t;
}
// ---------------- 扭蛋兔（normal_egg/medal_egg/rock_egg + dress_* + strengthen） ----------------
exports.gacha = {
    id: 'gacha',
    readState: (ctx) => {
        var _a, _b;
        return ({
            eggCostCoin: ctx.num('gachaRabbit.eggCostCoin', 100),
            partSlots: ctx.num('gachaRabbit.partSlots', ['ears']) || ['ears', 'head', 'body', 'hands', 'feet', 'pants'],
            equipped: Object.fromEntries(['ears', 'head', 'body', 'hands', 'feet', 'pants'].map((s) => { var _a; return [s, (_a = ctx.player.counters[`gacha.${s}`]) !== null && _a !== void 0 ? _a : 0]; })),
            power: (_a = ctx.player.counters['gacha.power']) !== null && _a !== void 0 ? _a : 0,
            eggsOpened: (_b = ctx.player.counters['gacha.opened']) !== null && _b !== void 0 ? _b : 0,
            inventory: Object.entries(ctx.player.inventory).filter(([k, v]) => k.startsWith('part_') && v.qty > 0).map(([k, v]) => ({ part: k, qty: v.qty })),
            history: ctx.store.history(ctx.playerId, 'gacha', 10),
        });
    },
    actions: {
        /** 开蛋：三种蛋（普通/勋章/岩石）随机部位装备 */
        openEgg: (ctx) => {
            var _a;
            const eggType = String(ctx.payload.eggType || 'normal');
            const costs = {
                normal: { COIN: ctx.num('gachaRabbit.eggCostCoin', 100) },
                medal: { MEDAL: 5 },
                rock: { APE_STONE: 20 },
            };
            const cost = costs[eggType];
            if (!cost)
                return (0, types_1.fail)('eggType 必须是 normal/medal/rock');
            if (!ctx.econ.payFrom(ctx.player, cost, 'gacha.openEgg', eggType))
                return (0, types_1.fail)('开蛋资源不足');
            const slot = ctx.rng.pick(['ears', 'head', 'body', 'hands', 'feet', 'pants']);
            const rarity = eggType === 'rock' ? ctx.rng.weighted([{ value: 'R', weight: 50 }, { value: 'SR', weight: 35 }, { value: 'SSR', weight: 15 }])
                : eggType === 'medal' ? ctx.rng.weighted([{ value: 'N', weight: 30 }, { value: 'R', weight: 45 }, { value: 'SR', weight: 25 }])
                    : ctx.rng.weighted([{ value: 'N', weight: 65 }, { value: 'R', weight: 30 }, { value: 'SR', weight: 5 }]);
            const powers = { N: 5, R: 12, SR: 25, SSR: 50 };
            const partId = `part_${slot}_${rarity}`;
            ctx.econ.addItems(ctx.playerId, partId, 1, { slot, rarity, power: powers[rarity] });
            ctx.player.counters['gacha.opened'] = ((_a = ctx.player.counters['gacha.opened']) !== null && _a !== void 0 ? _a : 0) + 1;
            return (0, types_1.ok)(`开出 ${eggType === 'normal' ? '普通' : eggType === 'medal' ? '勋章' : '岩石'}蛋：${slot} 部位 ${rarity} 装备（战力 +${powers[rarity]}）`, {
                items: [{ templateId: partId, qty: 1, attrs: { slot, rarity, power: powers[rarity] } }], fx: ['eggOpen'],
            });
        },
        /** 穿戴：高战力替换，低战力自动分解 */
        equip: (ctx) => {
            var _a, _b, _c;
            const partId = String(ctx.payload.partId || '');
            const entry = ctx.player.inventory[partId];
            if (!entry || !partId.startsWith('part_'))
                return (0, types_1.fail)('没有该装备');
            const slot = String((_a = entry.attrs) === null || _a === void 0 ? void 0 : _a.slot);
            const power = Number((_b = entry.attrs) === null || _b === void 0 ? void 0 : _b.power) || 0;
            const curPower = (_c = ctx.player.counters[`gacha.${slot}.power`]) !== null && _c !== void 0 ? _c : 0;
            if (power < curPower) {
                // 低战力自动分解为积分
                ctx.econ.takeItems(ctx.playerId, partId, 1);
                ctx.econ.grant(ctx.playerId, 'INTEGRAL', 5, 'gacha', 'decompose');
                return (0, types_1.ok)(`新装备战力更低，已自动分解为积分 +5`);
            }
            ctx.player.counters[`gacha.${slot}.power`] = power;
            ctx.player.counters[`gacha.${slot}`] = 1;
            ctx.player.counters['gacha.power'] = Object.keys(ctx.player.counters).filter((k) => k.endsWith('.power') && k.startsWith('gacha.') && k !== 'gacha.power').reduce((s, k) => { var _a; return s + Number((_a = ctx.player.counters[k]) !== null && _a !== void 0 ? _a : 0); }, 0);
            return (0, types_1.ok)(`已穿戴 ${partId}（${slot} 战力 ${power}，总战力 ${ctx.player.counters['gacha.power']}）`, { fx: ['equip'] });
        },
    },
};
// ---------------- 盲盒/福袋（免费钥匙链路；付费随机已切断） ----------------
exports.box = {
    id: 'box',
    readState: (ctx) => {
        var _a;
        return ({
            keys: ctx.econ.itemCount(ctx.playerId, 'free_box_key'),
            weights: ctx.num('box.freeKeyWeights', { coin: 70 }) || { coin: 70, gem: 20, card: 10 },
            opened: (_a = ctx.player.counters['box.opened']) !== null && _a !== void 0 ? _a : 0,
            history: ctx.store.history(ctx.playerId, 'box', 10),
            note: 'Release 策略: 免费任务钥匙开箱，纯虚拟不可兑换奖励；付费随机获利链路已切断',
        });
    },
    actions: {
        openFree: (ctx) => {
            var _a;
            if (!ctx.econ.takeItems(ctx.playerId, 'free_box_key', 1))
                return (0, types_1.fail)('没有免费钥匙（完成任务可获得）');
            const reward = ctx.rng.weighted([{ value: 'coin', weight: 70 }, { value: 'gem', weight: 20 }, { value: 'card', weight: 10 }]);
            ctx.player.counters['box.opened'] = ((_a = ctx.player.counters['box.opened']) !== null && _a !== void 0 ? _a : 0) + 1;
            if (reward === 'coin') {
                const n = ctx.rng.int(30, 80);
                ctx.econ.grant(ctx.playerId, 'COIN', n, 'box', 'openFree');
                return (0, types_1.ok)(`宝箱开启：金币 +${n}`, { rewards: [{ assetId: 'COIN', delta: n }], fx: ['boxOpen'] });
            }
            if (reward === 'gem') {
                const n = ctx.rng.int(1, 3);
                ctx.econ.grant(ctx.playerId, 'GEMSTONE', n, 'box', 'openFree');
                return (0, types_1.ok)(`宝箱开启：宝石 +${n}`, { rewards: [{ assetId: 'GEMSTONE', delta: n }], fx: ['boxOpen'] });
            }
            const t = drawCard(ctx.rng);
            ctx.econ.addItems(ctx.playerId, t.templateId, 1);
            return (0, types_1.ok)(`宝箱开启：卡牌「${t.name}」(${t.rarity})`, { items: [{ templateId: t.templateId, qty: 1 }], fx: ['boxOpen', 'cardDrop'] });
        },
        /** 完成任务得钥匙（能量消耗任务链路） */
        earnKey: (ctx) => {
            const cost = ctx.num('box.keyEarnEnergyCost', 4);
            if (!ctx.econ.payFrom(ctx.player, { ENERGY: cost }, 'box.earnKey', 'task'))
                return (0, types_1.fail)('体力不足');
            ctx.econ.addItems(ctx.playerId, 'free_box_key', 1);
            return (0, types_1.ok)('任务完成，免费钥匙 +1', { fx: ['keyGain'] });
        },
    },
};
// ---------------- 每日签到/任务 ----------------
exports.daily = {
    id: 'daily',
    readState: (ctx) => {
        var _a;
        const day = Math.floor(ctx.now / 86400000);
        return {
            checkedToday: ctx.player.counters['daily.day'] === day,
            streak: (_a = ctx.player.counters['daily.streak']) !== null && _a !== void 0 ? _a : 0,
            tasks: [
                { id: 'mine', label: '挖矿 1 次', done: !!ctx.player.counters[`daily.task.mine.${day}`] },
                { id: 'game', label: '完成 1 局小游戏', done: !!ctx.player.counters[`daily.task.game.${day}`] },
                { id: 'card', label: '收集 1 张卡牌', done: !!ctx.player.counters[`daily.task.card.${day}`] },
            ],
            taskRewards: { mine: 15, game: 25, card: 15 },
        };
    },
    actions: {
        checkin: (ctx) => {
            var _a;
            const day = Math.floor(ctx.now / 86400000);
            if (ctx.player.counters['daily.day'] === day)
                return (0, types_1.fail)('今天已签到');
            const yesterday = ctx.player.counters['daily.lastDay'] === day - 1;
            const streak = yesterday ? ((_a = ctx.player.counters['daily.streak']) !== null && _a !== void 0 ? _a : 0) + 1 : 1;
            ctx.player.counters['daily.day'] = day;
            ctx.player.counters['daily.lastDay'] = day;
            ctx.player.counters['daily.streak'] = streak;
            const coin = ctx.num('daily.checkinCoinBase', 10) + Math.min(ctx.num('daily.checkinStreakMax', 20), streak * ctx.num('daily.checkinStreakStep', 2));
            ctx.econ.grant(ctx.playerId, 'COIN', coin, 'daily', 'checkin');
            if (streak % 7 === 0)
                ctx.econ.grant(ctx.playerId, 'TICKET', 2, 'daily', 'streak7');
            ctx.store.pushHistory(ctx.playerId, 'daily', `签到（连续 ${streak} 天）`, [{ assetId: 'COIN', delta: coin }]);
            return (0, types_1.ok)(`签到成功，连续 ${streak} 天，金币 +${coin}${streak % 7 === 0 ? '，7 天里程碑奖券 +2' : ''}`, { rewards: [{ assetId: 'COIN', delta: coin }], fx: ['checkin'] });
        },
        /** 任务奖励领取（任务完成标记由各玩法 action 写入） */
        claimTask: (ctx) => {
            const day = Math.floor(ctx.now / 86400000);
            const taskId = String(ctx.payload.taskId || '');
            const rewards = { mine: 15, game: 25, card: 15 };
            if (!rewards[taskId])
                return (0, types_1.fail)('未知任务');
            if (ctx.player.counters[`daily.task.${taskId}.${day}`] === 2)
                return (0, types_1.fail)('该任务奖励已领取');
            if (!ctx.player.counters[`daily.task.${taskId}.${day}`])
                return (0, types_1.fail)('任务还未完成');
            ctx.player.counters[`daily.task.${taskId}.${day}`] = 2;
            const coin = rewards[taskId];
            ctx.econ.grant(ctx.playerId, 'COIN', coin, 'daily', `task:${taskId}`);
            return (0, types_1.ok)(`任务奖励：金币 +${coin}`, { rewards: [{ assetId: 'COIN', delta: coin }] });
        },
    },
};
/** 各玩法调用：写入每日任务完成标记 */
function markDailyTask(ctx, task) {
    const day = Math.floor(Date.now() / 86400000);
    if (!ctx.player.counters[`daily.task.${task}.${day}`])
        ctx.player.counters[`daily.task.${task}.${day}`] = 1;
}
