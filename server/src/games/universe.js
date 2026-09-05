"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.warcraft = exports.universe = void 0;
/**
 * Wave 3 —— 宇宙探索 + 猿石魔兽。
 * 证据: 宇宙探索 23 页（ExplorePlanet/UpgradeUFO/Hero/Temple/Warehouse/Contract/WizardNDTUPond），
 *       猿石魔兽 2 页（WarcraftExchangeLog/WarcraftWithdrawLog）。
 */
const types_1 = require("./types");
exports.universe = {
    id: 'universe',
    readState: (ctx) => {
        var _a, _b, _c;
        const shipLv = (_a = ctx.player.counters['universe.shipLv']) !== null && _a !== void 0 ? _a : 0;
        return {
            shipLevel: shipLv,
            upgradeCost: ctx.num('universe.shipUpgradeBase', 80) + shipLv * ctx.num('universe.shipUpgradeStep', 40),
            planetsVisited: (_b = ctx.player.counters['universe.planets']) !== null && _b !== void 0 ? _b : 0,
            ndtu: ctx.store.ledger.balanceOf(ctx.playerId, 'NDTU'),
            contractAvailable: ((_c = ctx.player.timestamps['universe.contractAt']) !== null && _c !== void 0 ? _c : 0) + 86400000 < ctx.now,
            exploreLog: ctx.store.history(ctx.playerId, 'universe', 20),
        };
    },
    actions: {
        /** 探索星球：消耗体力，发现资源；探索计数驱动成长 */
        explore: (ctx) => {
            var _a, _b;
            const cost = ctx.num('universe.exploreEnergy', 4);
            ctx.econ.regenEnergy(ctx.player, ctx.now, ctx.num('energy.max', 120), ctx.num('energy.regenMinutes', 6));
            if (!ctx.econ.payFrom(ctx.player, { ENERGY: cost }, 'universe.explore', 'planet'))
                return (0, types_1.fail)('体力不足');
            const shipLv = (_a = ctx.player.counters['universe.shipLv']) !== null && _a !== void 0 ? _a : 0;
            const bonus = 1 + shipLv * 0.1;
            const coin = Math.floor(ctx.numRange('universe.exploreRewardCoin', ctx.rng, [8, 20]) * bonus);
            const ore = ctx.rng.int(1, 4);
            ctx.econ.grant(ctx.playerId, 'COIN', coin, 'universe', 'explore');
            ctx.econ.grant(ctx.playerId, 'ORE', ore, 'universe', 'explore');
            ctx.player.counters['universe.planets'] = ((_b = ctx.player.counters['universe.planets']) !== null && _b !== void 0 ? _b : 0) + 1;
            const planet = ctx.rng.pick(['绯红之星', '环带气态星', '猿眼卫星', '金沙小行星', '远古遗迹星']);
            ctx.store.pushHistory(ctx.playerId, 'universe', `探索 ${planet}：金币 +${coin}，矿石 +${ore}`, [{ assetId: 'COIN', delta: coin }]);
            return (0, types_1.ok)(`飞船抵达 ${planet}，金币 +${coin}，矿石 +${ore}（飞船 Lv.${shipLv} 加成生效）`, {
                rewards: [{ assetId: 'COIN', delta: coin }, { assetId: 'ORE', delta: ore }], history: `探索${planet}`, fx: ['explore'],
            });
        },
        /** 升级飞船 */
        upgradeShip: (ctx) => {
            var _a;
            const lv = (_a = ctx.player.counters['universe.shipLv']) !== null && _a !== void 0 ? _a : 0;
            const cost = ctx.num('universe.shipUpgradeBase', 80) + lv * ctx.num('universe.shipUpgradeStep', 40);
            if (!ctx.econ.payFrom(ctx.player, { COIN: cost }, 'universe.upgrade', `ship${lv + 1}`))
                return (0, types_1.fail)(`金币不足（需要 ${cost}）`);
            ctx.player.counters['universe.shipLv'] = lv + 1;
            return (0, types_1.ok)(`飞船升级到 Lv.${lv + 1}，探索收益 +10%`);
        },
        /** 每日神殿契约：NDTU 奖励 */
        contract: (ctx) => {
            var _a;
            if (((_a = ctx.player.timestamps['universe.contractAt']) !== null && _a !== void 0 ? _a : 0) + 86400000 >= ctx.now)
                return (0, types_1.fail)('今日契约已完成，明天再来');
            const ndtu = ctx.num('universe.contractRewardNdtu', 1);
            ctx.econ.grant(ctx.playerId, 'NDTU', ndtu, 'universe', 'contract');
            ctx.player.timestamps['universe.contractAt'] = ctx.now;
            ctx.store.pushHistory(ctx.playerId, 'universe', `神殿契约：NDTU +${ndtu}`, [{ assetId: 'NDTU', delta: ndtu }]);
            return (0, types_1.ok)(`神殿契约完成，NDTU +${ndtu}`, { rewards: [{ assetId: 'NDTU', delta: ndtu }] });
        },
    },
};
exports.warcraft = {
    id: 'warcraft',
    readState: (ctx) => {
        var _a;
        return ({
            apeStone: ctx.store.ledger.balanceOf(ctx.playerId, 'APE_STONE'),
            extractCost: ctx.num('warcraft.extractCostApeStone', 30),
            exchangeRate: ctx.num('warcraft.exchangeRateOreToApeStone', 10),
            extracted: (_a = ctx.player.counters['warcraft.extracted']) !== null && _a !== void 0 ? _a : 0,
            history: ctx.store.history(ctx.playerId, 'warcraft', 10),
            note: '原 Warcraft 提现链路已切除（warcraftFinance cut），仅保留猿石→召唤 extraction 玩法',
        });
    },
    actions: {
        /** 消耗猿石召唤魔兽/抽取奖励 */
        extract: (ctx) => {
            var _a;
            const cost = ctx.num('warcraft.extractCostApeStone', 30);
            if (ctx.store.ledger.balanceOf(ctx.playerId, 'APE_STONE') < cost)
                return (0, types_1.fail)(`猿石不足（需要 ${cost}）`);
            ctx.econ.spend(ctx.playerId, 'APE_STONE', cost, 'warcraft.extract', 'summon');
            const ore = ctx.numRange('warcraft.extractReward', ctx.rng, [1, 4]);
            ctx.econ.grant(ctx.playerId, 'ORE', ore, 'warcraft', 'summon');
            ctx.player.counters['warcraft.extracted'] = ((_a = ctx.player.counters['warcraft.extracted']) !== null && _a !== void 0 ? _a : 0) + 1;
            const beast = ctx.rng.pick(['岩甲兽', '金沙蜗', '猿面鹰', '晶背蜥']);
            return (0, types_1.ok)(`召唤出 ${beast}，产出矿石 +${ore}`, { rewards: [{ assetId: 'ORE', delta: ore }], fx: ['summon'] });
        },
    },
};
