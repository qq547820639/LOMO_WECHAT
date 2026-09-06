"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RELEASE_LOCKED_FLAGS = exports.RELEASE_FORBIDDEN_ASSETS = exports.CASH_SENSITIVE_FEATURES = exports.TuningConfigError = void 0;
exports.validateTuningConfig = validateTuningConfig;
exports.featureEnabledInProfile = featureEnabledInProfile;
const REQUIRED_TUNING_PATHS = [
    ['progression', 'levelXpBase'], ['progression', 'levelXpStep'], ['progression', 'levelUpEnergy'],
    ['energy', 'initial'], ['energy', 'max'], ['energy', 'regenMinutes'],
    ['economy', 'initialCoin'], ['economy', 'initialTicket'], ['economy', 'refineOreCost'], ['economy', 'refineCoin'],
];
class TuningConfigError extends Error {
    constructor(message) { super(`invalid tuning config: ${message}`); this.name = 'TuningConfigError'; }
}
exports.TuningConfigError = TuningConfigError;
function validateTuningConfig(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        throw new TuningConfigError('root must be an object');
    const candidate = value;
    if (candidate.status !== 'OWNED_LAUNCH_DEFAULTS')
        throw new TuningConfigError('status must be OWNED_LAUNCH_DEFAULTS');
    if (candidate.provenance !== 'CLEAN_ROOM_PRODUCT_DEFAULTS')
        throw new TuningConfigError('provenance must be CLEAN_ROOM_PRODUCT_DEFAULTS');
    if (typeof candidate.schemaVersion !== 'string' || !candidate.schemaVersion)
        throw new TuningConfigError('schemaVersion is required');
    if (typeof candidate.effectiveFrom !== 'string' || Number.isNaN(Date.parse(candidate.effectiveFrom)))
        throw new TuningConfigError('effectiveFrom must be an ISO date');
    if (typeof candidate.owner !== 'string' || !candidate.owner.trim())
        throw new TuningConfigError('owner is required');
    for (const path of REQUIRED_TUNING_PATHS) {
        let node = candidate;
        for (const segment of path)
            node = node && typeof node === 'object' ? node[segment] : undefined;
        if (typeof node !== 'number' || !Number.isFinite(node) || node < 0)
            throw new TuningConfigError(`${path.join('.')} must be a finite non-negative number`);
    }
    const walk = (node, path) => {
        if (typeof node === 'number') {
            if (!Number.isFinite(node) || node < 0)
                throw new TuningConfigError(`${path} must be finite and non-negative`);
            return;
        }
        if (Array.isArray(node)) {
            if (node.length === 2 && node.every((item) => typeof item === 'number')) {
                const [low, high] = node;
                if (!Number.isFinite(low) || !Number.isFinite(high) || low < 0 || high < low)
                    throw new TuningConfigError(`${path} must be an ascending non-negative range`);
            }
            node.forEach((item, index) => walk(item, `${path}[${index}]`));
            return;
        }
        if (node && typeof node === 'object')
            for (const [key, child] of Object.entries(node))
                walk(child, path ? `${path}.${key}` : key);
    };
    walk(candidate, 'tuning');
    const progression = candidate.progression;
    const energy = candidate.energy;
    if (progression.levelXpBase <= 0 || progression.levelXpStep < 0)
        throw new TuningConfigError('progression XP values are out of range');
    if (energy.max < energy.initial)
        throw new TuningConfigError('energy.max must be >= energy.initial');
    return candidate;
}
/** 默认对现金敏感功能族的策略（与 44 族注册表一致；数据层可覆盖） */
exports.CASH_SENSITIVE_FEATURES = {
    walletCash: 'cut',
    betting: 'sandbox',
    redPacket: 'cut',
    p2pTrade: 'sandbox',
    agent: 'sandbox',
    digitalTrade: 'sandbox',
    digitalLottery: 'cut',
    physicalPrize: 'cut',
    warcraftFinance: 'cut',
    market: 'sandbox',
    auction: 'sandbox',
    mall: 'sandbox',
    moonEvent: 'cut',
    settlement: 'sandbox',
    luckyBag: 'defer',
    box: 'defer',
    dagger: 'defer',
    robbery: 'defer',
    multiplePit: 'defer',
    creator: 'defer',
    superLink: 'defer',
    social: 'defer',
    customerService: 'defer',
    digitalGallery: 'defer',
    apeHundred: 'defer',
};
/** Release 下被服务端/客户端同时禁止的资产（不得出现任何正向 delta） */
exports.RELEASE_FORBIDDEN_ASSETS = ['TEST_CREDIT', 'RED_PACKET_PROGRESS'];
/** 高风险 RemoteConfig 键：release 配置下服务端拒绝远程开启 */
exports.RELEASE_LOCKED_FLAGS = [
    'allowCashWallet', 'allowWithdrawal', 'allowBetting', 'allowPaidRandomLoot',
    'allowP2PTrade', 'allowDigitalAuction', 'allowAgentDistribution', 'allowCashRedPacket',
];
function featureEnabledInProfile(policy, profile) {
    if (policy === 'keep')
        return true;
    if (profile === 'full-clone')
        return policy !== 'cut' || true; // full clone 保留全部生态页面（含 cut 族仅路由/数据边界）
    if (policy === 'sandbox')
        return false;
    if (policy === 'defer' || policy === 'cut')
        return false;
    return false;
}
