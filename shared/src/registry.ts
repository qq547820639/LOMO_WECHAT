/**
 * 数据注册表类型 —— data/*.json 与 shared/src/gen/data.gen.ts 共同遵守。
 * 680 Activity 每一个都必须有迁移状态，不允许 UNKNOWN/TODO 而无说明。
 */
import { FeaturePolicy } from './config';

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
