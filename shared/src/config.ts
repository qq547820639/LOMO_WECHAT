/**
 * Section 20/61 RemoteConfig 与双发布 Profile。
 * 所有无法从加固 APK 确定的原正式服参数全部走 RemoteConfig；
 * FULL 与 RELEASE 不得混淆，至少三层关闭：Client Feature Flag / Server Capability / API authorization。
 */
import { AssetId } from './assets';

export type BuildProfile = 'full-clone' | 'wechat-release';

/** 发布安全开关（configs/*.json 同构） */
export interface ReleaseProfile {
  profile: BuildProfile;
  purpose?: string;
  warning?: string;
  allowCashWallet: boolean;
  allowWithdrawal: boolean;
  allowBetting: boolean;
  allowPaidRandomLoot: boolean;
  allowP2PTrade: boolean;
  allowDigitalAuction: boolean;
  allowAgentDistribution: boolean;
  allowPhysicalPrizeFulfillment: boolean;
  allowCashRedPacket: boolean;
  allowRewardedAds?: boolean;
  allowFixedPriceVirtualItems?: boolean;
  serverAuthoritativeEconomy?: boolean;
  antiAddictionRequired?: boolean;
  sandboxOnly?: boolean;
  sandboxSettlementNotice?: string;
}

/** 服务端功能策略：来自 44 族注册表 + 现金敏感性 */
export type FeaturePolicy = 'keep' | 'defer' | 'cut' | 'sandbox';

/** tuning-baseline.json 同构（INFERRED_NOT_ORIGINAL） */
export interface TuningConfig {
  status?: string;
  progression: { levelXpBase: number; levelXpStep: number; levelUpEnergy: number };
  energy: { initial: number; max: number; regenMinutes: number; battleCost: number; mineCost: number; exploreCost: number; minigameCost: number };
  economy: { initialCoin: number; initialTicket: number; mineCoinRange: [number, number]; refineOreCost: number; refineCoin: number };
  [feature: string]: unknown;
}

export interface RemoteConfig {
  version: string;
  signedAt: number;
  signature: string | null;
  profile: BuildProfile;
  tuning: TuningConfig;
  routesEnabled: Record<string, boolean>;
  featurePolicies: Record<string, FeaturePolicy>;
  numeric: Record<string, number>;
  json: Record<string, unknown>;
}

/** 默认对现金敏感功能族的策略（与 44 族注册表一致；数据层可覆盖） */
export const CASH_SENSITIVE_FEATURES: Record<string, FeaturePolicy> = {
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
export const RELEASE_FORBIDDEN_ASSETS: AssetId[] = ['TEST_CREDIT', 'RED_PACKET_PROGRESS'];

/** 高风险 RemoteConfig 键：release 配置下服务端拒绝远程开启 */
export const RELEASE_LOCKED_FLAGS = [
  'allowCashWallet', 'allowWithdrawal', 'allowBetting', 'allowPaidRandomLoot',
  'allowP2PTrade', 'allowDigitalAuction', 'allowAgentDistribution', 'allowCashRedPacket',
];

export function featureEnabledInProfile(policy: FeaturePolicy | undefined, profile: BuildProfile): boolean {
  if (policy === 'keep') return true;
  if (profile === 'full-clone') return policy !== 'cut' || true; // full clone 保留全部生态页面（含 cut 族仅路由/数据边界）
  if (policy === 'sandbox') return false;
  if (policy === 'defer' || policy === 'cut') return false;
  return false;
}
