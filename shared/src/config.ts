/**
 * Section 20/61 RemoteConfig 与双发布 Profile。
 * 所有无法从加固 APK 确定的原正式服参数全部走 RemoteConfig；
 * FULL 与 RELEASE 不得混淆，至少三层关闭：Client Feature Flag / Server Capability / API authorization。
 */
import { AssetId } from './assets';

export type BuildProfile = 'full-clone' | 'wechat-release';

export interface LaunchNavigationTab {
  id: string;
  label: string;
  targetTab: string;
}

export interface LaunchNavigation {
  tabs: LaunchNavigationTab[];
  defaultTab: string;
}

/** 发布安全开关（configs/*.json 同构） */
export interface ReleaseProfile {
  profile: BuildProfile;
  purpose?: string;
  warning?: string;
  navigation?: LaunchNavigation;
  trainingFeatures?: string[];
  coreFeatures?: string[];
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

/** 可审计、版本化的自有运营默认参数。原服参数未知不影响本配置上线。 */
export interface TuningConfig {
  schemaVersion?: string;
  status?: 'OWNED_LAUNCH_DEFAULTS';
  provenance?: 'CLEAN_ROOM_PRODUCT_DEFAULTS';
  effectiveFrom?: string;
  owner?: string;
  progression: { levelXpBase: number; levelXpStep: number; levelUpEnergy: number };
  energy: { initial: number; max: number; regenMinutes: number; battleCost: number; mineCost: number; exploreCost: number; minigameCost: number };
  economy: { initialCoin: number; initialTicket: number; mineCoinRange: [number, number]; refineOreCost: number; refineCoin: number };
  [feature: string]: unknown;
}

const REQUIRED_TUNING_PATHS = [
  ['progression', 'levelXpBase'], ['progression', 'levelXpStep'], ['progression', 'levelUpEnergy'],
  ['energy', 'initial'], ['energy', 'max'], ['energy', 'regenMinutes'],
  ['economy', 'initialCoin'], ['economy', 'initialTicket'], ['economy', 'refineOreCost'], ['economy', 'refineCoin'],
] as const;

export class TuningConfigError extends Error {
  constructor(message: string) { super(`invalid tuning config: ${message}`); this.name = 'TuningConfigError'; }
}

export function validateTuningConfig(value: unknown): TuningConfig {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TuningConfigError('root must be an object');
  const candidate = value as Record<string, unknown>;
  if (candidate.status !== 'OWNED_LAUNCH_DEFAULTS') throw new TuningConfigError('status must be OWNED_LAUNCH_DEFAULTS');
  if (candidate.provenance !== 'CLEAN_ROOM_PRODUCT_DEFAULTS') throw new TuningConfigError('provenance must be CLEAN_ROOM_PRODUCT_DEFAULTS');
  if (typeof candidate.schemaVersion !== 'string' || !candidate.schemaVersion) throw new TuningConfigError('schemaVersion is required');
  if (typeof candidate.effectiveFrom !== 'string' || Number.isNaN(Date.parse(candidate.effectiveFrom))) throw new TuningConfigError('effectiveFrom must be an ISO date');
  if (typeof candidate.owner !== 'string' || !candidate.owner.trim()) throw new TuningConfigError('owner is required');
  for (const path of REQUIRED_TUNING_PATHS) {
    let node: unknown = candidate;
    for (const segment of path) node = node && typeof node === 'object' ? (node as Record<string, unknown>)[segment] : undefined;
    if (typeof node !== 'number' || !Number.isFinite(node) || node < 0) throw new TuningConfigError(`${path.join('.')} must be a finite non-negative number`);
  }
  const walk = (node: unknown, path: string): void => {
    if (typeof node === 'number') {
      if (!Number.isFinite(node) || node < 0) throw new TuningConfigError(`${path} must be finite and non-negative`);
      return;
    }
    if (Array.isArray(node)) {
      if (node.length === 2 && node.every((item) => typeof item === 'number')) {
        const [low, high] = node as number[];
        if (!Number.isFinite(low) || !Number.isFinite(high) || low < 0 || high < low) throw new TuningConfigError(`${path} must be an ascending non-negative range`);
      }
      node.forEach((item, index) => walk(item, `${path}[${index}]`));
      return;
    }
    if (node && typeof node === 'object') for (const [key, child] of Object.entries(node)) walk(child, path ? `${path}.${key}` : key);
  };
  walk(candidate, 'tuning');
  const progression = candidate.progression as TuningConfig['progression'];
  const energy = candidate.energy as TuningConfig['energy'];
  if (progression.levelXpBase <= 0 || progression.levelXpStep < 0) throw new TuningConfigError('progression XP values are out of range');
  if (energy.max < energy.initial) throw new TuningConfigError('energy.max must be >= energy.initial');
  return candidate as TuningConfig;
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
  rewardedAds: RewardedAdsConfig;
}

export type RewardedAdSlot = 'revive_escape' | 'double_settlement' | 'energy_refill' | 'free_entry' | 'bonus_chest';
export interface RewardedAdSlotConfig {
  enabled: boolean;
  adUnitId: string;
  dailyCap: number;
  minIntervalMs: number;
}
export interface RewardedAdsConfig {
  enabled: boolean;
  dailyCap: number;
  hourlyCap: number;
  ttlMs: number;
  slots: Record<RewardedAdSlot, RewardedAdSlotConfig>;
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
