"use strict";
/**
 * 统一资产目录 —— Section 18 核心资产模型。
 * 每种资产必须完整定义语义，禁止把所有资产塞进 Record<string, number>。
 * 证据等级: 原始资产名单来自 APK 静态证据（full_clone docs/01 + cleanroom MIGRATION_REPORT），
 * precision/source/sink 为工程重建，标记 INFERRED。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_ASSET_IDS = exports.ASSET_CATALOG = void 0;
exports.roundToPrecision = roundToPrecision;
const def = (a) => a;
exports.ASSET_CATALOG = {
    GEMSTONE: def({
        assetId: 'GEMSTONE', displayName: '宝石', precision: 2, stackable: true,
        source: ['apeMine', 'arena', 'undertown', 'market', 'daily'], sink: ['gacha', 'exchange', 'upgrade', 'market'],
        tradeableInFullClone: true, tradeableInRelease: false, withdrawable: false,
        serverAuthoritative: true, expiration: null, ledgerCategory: 'currency',
        evidence: 'ApeMyGemstoneActivity / ApeGemstoneGiftActivity / gemstone 模块（APK Activity 证据）',
    }),
    MEDAL: def({
        assetId: 'MEDAL', displayName: '勋章', precision: 2, stackable: true,
        source: ['undertown', 'daily', 'arena'], sink: ['gacha', 'exchange', 'gem'],
        tradeableInFullClone: true, tradeableInRelease: false, withdrawable: false,
        serverAuthoritative: true, expiration: null, ledgerCategory: 'currency',
        evidence: 'Undertown 模块 Medal 相关 Activity（APK）',
    }),
    NDTU: def({
        assetId: 'NDTU', displayName: 'NDTU', precision: 4, stackable: true,
        source: ['universe', 'contract'], sink: ['ship', 'exchange'],
        tradeableInFullClone: true, tradeableInRelease: false, withdrawable: false,
        serverAuthoritative: true, expiration: null, ledgerCategory: 'currency',
        evidence: 'WizardNDTUPondActivity / universe 模块（APK）',
    }),
    WORLD_COIN: def({
        assetId: 'WORLD_COIN', displayName: '世界币', precision: 4, stackable: true,
        source: ['legacy'], sink: ['exchange'],
        tradeableInFullClone: true, tradeableInRelease: false, withdrawable: false,
        serverAuthoritative: true, expiration: null, ledgerCategory: 'currency',
        evidence: 'CoinActivity / CoinLogsActivity 等 world coin 钱包页面（APK）',
    }),
    APE_STONE: def({
        assetId: 'APE_STONE', displayName: '猿石', precision: 2, stackable: true,
        source: ['warcraft', 'exchange'], sink: ['warcraft', 'gacha', 'gem'],
        tradeableInFullClone: true, tradeableInRelease: false, withdrawable: false,
        serverAuthoritative: true, expiration: null, ledgerCategory: 'material',
        evidence: 'WarcraftExchangeLogActivity / 猿石模块（APK）',
    }),
    SAND: def({
        assetId: 'SAND', displayName: '金沙', precision: 2, stackable: true,
        source: ['apeMine', 'goldMine'], sink: ['exchange', 'production'],
        tradeableInFullClone: true, tradeableInRelease: false, withdrawable: false,
        serverAuthoritative: true, expiration: null, ledgerCategory: 'material',
        evidence: '金沙模块 Activity（APK 猿宇宙 94 页金沙×3）',
    }),
    GOLD: def({
        assetId: 'GOLD', displayName: '黄金', precision: 4, stackable: true,
        source: ['goldMine', 'refine'], sink: ['npcExchange', 'production'],
        tradeableInFullClone: true, tradeableInRelease: false, withdrawable: false,
        serverAuthoritative: true, expiration: null, ledgerCategory: 'material',
        evidence: 'GoldMineActivity / FineGoldActivity（APK 黄金矿场 17 页）',
    }),
    DAGGER: def({
        assetId: 'DAGGER', displayName: '匕首', precision: 0, stackable: true,
        source: ['battleRoyale'], sink: ['assassinate', 'upgrade', 'robbery'],
        tradeableInFullClone: true, tradeableInRelease: false, withdrawable: false,
        serverAuthoritative: true, expiration: null, ledgerCategory: 'item',
        evidence: 'MyDaggerActivity / DaggerNewActivity / battle royal 失败铸造匕首（公开玩法资料+资源）',
    }),
    BADGE: def({
        assetId: 'BADGE', displayName: '徽章', precision: 0, stackable: false,
        source: ['achievement', 'season'], sink: ['showcase'],
        tradeableInFullClone: true, tradeableInRelease: false, withdrawable: false,
        serverAuthoritative: true, expiration: null, ledgerCategory: 'item',
        evidence: 'badge 资产目录（full_clone assets.ts）',
    }),
    INTEGRAL: def({
        assetId: 'INTEGRAL', displayName: '积分', precision: 0, stackable: true,
        source: ['tasks', 'decompose', 'activity'], sink: ['mall', 'exchange'],
        tradeableInFullClone: false, tradeableInRelease: true, withdrawable: false,
        serverAuthoritative: true, expiration: 'P90D', ledgerCategory: 'progress',
        evidence: '积分体系（full_clone docs/01）',
    }),
    RED_PACKET_PROGRESS: def({
        assetId: 'RED_PACKET_PROGRESS', displayName: '红包进度', precision: 2, stackable: true,
        source: ['tasks', 'invite'], sink: ['cashRedPacket'],
        tradeableInFullClone: false, tradeableInRelease: false, withdrawable: false,
        serverAuthoritative: true, expiration: null, ledgerCategory: 'progress',
        evidence: 'RedPackageInfoActivity（APK）；Release 下禁用现金结算，仅保留进度语义',
    }),
    TICKET: def({
        assetId: 'TICKET', displayName: '奖券', precision: 0, stackable: true,
        source: ['undertown', 'arena', 'battleRoyale'], sink: ['undertown', 'lottery'],
        tradeableInFullClone: false, tradeableInRelease: true, withdrawable: false,
        serverAuthoritative: true, expiration: 'P30D', ledgerCategory: 'currency',
        evidence: 'TicketAllocationActivity / ProbDetailActivity（APK 地下城）',
    }),
    ENERGY: def({
        assetId: 'ENERGY', displayName: '体力', precision: 0, stackable: true,
        source: ['time', 'ads', 'levelUp'], sink: ['battle', 'mine', 'explore', 'minigame'],
        tradeableInFullClone: false, tradeableInRelease: true, withdrawable: false,
        serverAuthoritative: true, expiration: null, ledgerCategory: 'currency',
        evidence: '标准体力循环（cleanroom State/Economy）',
    }),
    COIN: def({
        assetId: 'COIN', displayName: '金币', precision: 0, stackable: true,
        source: ['minigame', 'mine', 'daily', 'tasks'], sink: ['upgrade', 'gacha', 'guard', 'feed'],
        tradeableInFullClone: false, tradeableInRelease: true, withdrawable: false,
        serverAuthoritative: true, expiration: null, ledgerCategory: 'currency',
        evidence: '软币循环（cleanroom tuning）',
    }),
    ORE: def({
        assetId: 'ORE', displayName: '矿石', precision: 0, stackable: true,
        source: ['goldMine', 'apeMine'], sink: ['refine', 'npcExchange'],
        tradeableInFullClone: true, tradeableInRelease: false, withdrawable: false,
        serverAuthoritative: true, expiration: null, ledgerCategory: 'material',
        evidence: 'MyMineralActivity / MineralRecordActivity（APK）',
    }),
    SEASON_SCORE: def({
        assetId: 'SEASON_SCORE', displayName: '赛季积分', precision: 0, stackable: true,
        source: ['battleRoyale', 'monkeyKing', 'arena', 'multiplePit'], sink: ['seasonReward'],
        tradeableInFullClone: false, tradeableInRelease: true, withdrawable: false,
        serverAuthoritative: true, expiration: 'P7D', ledgerCategory: 'progress',
        evidence: 'Release 替代现金奖池的赛季积分（LAUNCH_DECISION）',
    }),
    TEST_CREDIT: def({
        assetId: 'TEST_CREDIT', displayName: '沙盒测试币', precision: 2, stackable: true,
        source: ['sandboxFaucet'], sink: ['settlement-disabled-screens'],
        tradeableInFullClone: false, tradeableInRelease: false, withdrawable: false,
        serverAuthoritative: true, expiration: null, ledgerCategory: 'sandbox',
        evidence: 'UI_CLONE_TEST_ONLY_SETTLEMENT_DISABLED 十屏专用不可兑换资产（full_clone assets.ts）',
    }),
    APE_CARD: def({
        assetId: 'APE_CARD', displayName: '无聊猿卡', precision: 0, stackable: false,
        source: ['gacha', 'market', 'synthesis'], sink: ['market', 'synthesis', 'split', 'production'],
        tradeableInFullClone: true, tradeableInRelease: false, withdrawable: false,
        serverAuthoritative: true, expiration: null, ledgerCategory: 'item',
        evidence: 'ApeComposeCardActivity / ApeSplitCardActivity / 卡牌 94 页模块（APK）',
    }),
    PLANET_CARD: def({
        assetId: 'PLANET_CARD', displayName: '星球卡', precision: 0, stackable: false,
        source: ['gacha', 'market'], sink: ['market', 'collection'],
        tradeableInFullClone: true, tradeableInRelease: false, withdrawable: false,
        serverAuthoritative: true, expiration: null, ledgerCategory: 'item',
        evidence: '星球卡（full_clone docs/01）',
    }),
    FLASH_CARD: def({
        assetId: 'FLASH_CARD', displayName: '闪卡', precision: 0, stackable: false,
        source: ['gacha', 'market'], sink: ['market', 'collection'],
        tradeableInFullClone: true, tradeableInRelease: false, withdrawable: false,
        serverAuthoritative: true, expiration: null, ledgerCategory: 'item',
        evidence: 'FlashCardActivity / FlashcardTradeActivity（APK）',
    }),
};
exports.ALL_ASSET_IDS = Object.keys(exports.ASSET_CATALOG);
function roundToPrecision(v, assetId) {
    var _a, _b;
    const p = (_b = (_a = exports.ASSET_CATALOG[assetId]) === null || _a === void 0 ? void 0 : _a.precision) !== null && _b !== void 0 ? _b : 0;
    const f = Math.pow(10, p);
    return Math.round(v * f) / f;
}
