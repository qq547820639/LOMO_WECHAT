"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RELEASE_LOCKED_FLAGS = exports.RELEASE_FORBIDDEN_ASSETS = exports.CASH_SENSITIVE_FEATURES = void 0;
exports.featureEnabledInProfile = featureEnabledInProfile;
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
