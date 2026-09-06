/**
 * 数据注册表类型 —— data/*.json 与 shared/src/gen/data.gen.ts 共同遵守。
 * 680 Activity 每一个都必须有迁移状态，不允许 UNKNOWN/TODO 而无说明。
 */
import { FeaturePolicy } from './config';

/** 首发微信导航契约：四个入口映射到客户端内部 tab；full-clone 不受此裁剪影响。 */
export const RELEASE_LAUNCH_NAVIGATION = {
  tabs: [
    { id: 'home', label: '主城', targetTab: 'home' },
    { id: 'games', label: '游戏', targetTab: 'games' },
    { id: 'chaowan', label: '收藏', targetTab: 'chaowan' },
    { id: 'mine', label: '我的', targetTab: 'mine' },
  ],
  defaultTab: 'home',
} as const;

/** 首发核心短局按玩家学习顺序排列，避免游戏 Tab 退化为 40+ 项目录。 */
export const RELEASE_CORE_FEATURES = ['escapeTiger', 'marbles', 'undertown'] as const;

/** 尚未接入真人房间服务的玩法必须明确呈现为 Bot 训练场。 */
export const RELEASE_TRAINING_FEATURES = ['battleRoyal'] as const;

export type CloneMode =
  | 'CLONE_1_TO_1'
  | 'CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER'
  | 'UI_CLONE_TEST_ONLY_SETTLEMENT_DISABLED'
  | 'PLATFORM_ADAPTER';

export type MigrationStatus =
  | 'mapped' | 'implemented' | 'merged_intentionally' | 'deferred' | 'sandbox-only' | 'release-disabled' | 'platform-replaced' | 'not-applicable';

export interface LegacyRoute {
  legacyActivity: string;
  screenName: string;
  module: string;
  moduleName: string;
  feature: string;
  routeId: string;
  mode: CloneMode;
  targetLayer: 'game' | 'adapter';
  riskTags: string[];
  featureFamily: string;
  targetRoute: string;
  migrationStatus: MigrationStatus;
  releasePolicy: FeaturePolicy;
  note?: string;
}

export interface FeatureDef {
  id: string;
  title: string;
  family: string;
  evidence: string[];
  risk: 'safe' | 'review' | 'prohibited_for_release';
  release: 'keep' | 'defer' | 'cut';
  cashSensitive?: boolean;
  notes: string;
  actions: { id: string; label: string }[];
  /** 一级 Tab 归属（Section 17: 潮玩/猿宇宙/游戏/交易/我的） */
  tab?: 'chaowan' | 'ape' | 'games' | 'trade' | 'mine';
}

export interface CardTemplate {
  templateId: string;
  name: string;
  cardType: 'APE_CARD' | 'PLANET_CARD' | 'FLASH_CARD';
  rarity: 'N' | 'R' | 'SR' | 'SSR';
  power: number;
  production?: number;
}

export interface AssetManifestRow {
  path: string;
  sizeBytes: number;
  ext: string;
  group: string;
  topGroup: string;
  classification: 'converted' | 'mapped' | 'third-party' | 'ignored-intentionally' | 'unused' | 'pending';
  strategy?: string;
}

export interface FeatureScreenAggregate {
  moduleName: string;
  feature: string;
  screenCount: number;
}
