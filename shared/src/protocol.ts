/**
 * 客户端↔服务端协议契约（依据 cleanroom docs/BACKEND_CONTRACT.md 正式化并扩展）。
 * 所有玩法动作统一走 POST /v1/game/action（featureId + actionId + sessionId + payload）。
 * 服务端权威结算，客户端只做预测展示。
 */
import { AssetId, AssetBalance } from './assets';
import { BuildProfile, ReleaseProfile, TuningConfig, FeaturePolicy, RewardedAdsConfig, RewardedAdSlot } from './config';
export type { RewardedAdsConfig, RewardedAdSlot } from './config';

// ---------- 基础 ----------
export type ApiErrorCode =
  | 'FEATURE_DISABLED' | 'AUTH_REQUIRED' | 'BAD_REQUEST' | 'NOT_FOUND'
  | 'SESSION_STALE' | 'RATE_LIMITED' | 'INSUFFICIENT' | 'SERVER_ERROR' | 'COMPLIANCE_BLOCKED'
  | 'WECHAT_AUTH_FAILED' | 'INVITE_EXPIRED' | 'ADMIN_AUTH_REQUIRED'
  | 'IDEMPOTENCY_REQUIRED' | 'IDEMPOTENCY_CONFLICT' | 'COMMAND_EXPIRED' | 'COMMAND_SUPERSEDED'
  | 'PERSISTENCE_UNAVAILABLE' | 'PERSISTENCE_LIMIT' | 'PERSISTENCE_CORRUPT';
export interface ApiError {
  ok: false;
  code: ApiErrorCode;
  message: string;
  detail?: unknown;
  retryable?: boolean;
}
export type ApiResult<T> = ({ ok: true } & T) | ApiError;

export interface AntiAddictionStatus {
  realNameVerified: boolean;
  isMinor: boolean;
  playableNow: boolean;
  remainingMinutesToday: number | null;
  message: string;
}

// ---------- Auth ----------
export interface AuthWechatRequest { code: string; clientVersion?: string }
export interface AuthWechatResponse {
  token: string;
  playerId: string;
  profile: BuildProfile;
  configVersion: string;
  antiAddiction: AntiAddictionStatus;
  isNew: boolean;
}

// ---------- Bootstrap ----------
export interface ConfigBootstrap {
  configVersion: string;
  profile: BuildProfile;
  serverTime: number;
  tuning: TuningConfig;
  featurePolicies: Record<string, FeaturePolicy>;
  routesEnabled: Record<string, boolean>;
  release: ReleaseProfile;
  assetManifestVersion: string;
  rewardedAds: RewardedAdsConfig;
}

/** 首发激励广告合同：广告只兑换固定软货币、体力或一次性玩法权益。 */
export type RewardedAdState = 'issued' | 'playing' | 'verified' | 'granted' | 'expired';
export interface RewardedAdGrant {
  kind: 'grant';
  rewards: RewardDto[];
}
export interface RewardedAdMultiplier {
  kind: 'multiplier';
  multiplier: 2;
  settlementId: string;
}
export interface RewardedAdEntitlement {
  kind: 'entitlement';
  entitlement: 'revive_escape' | 'free_entry';
}
export type RewardedAdReward = RewardedAdGrant | RewardedAdMultiplier | RewardedAdEntitlement;
export interface RewardedAdIssueRequest { slot: RewardedAdSlot; sessionId?: string; settlementId?: string; idempotencyKey?: string }
export interface RewardedAdIssueResponse {
  ok: true;
  adId: string;
  claimToken: string;
  slot: RewardedAdSlot;
  adUnitId: string;
  state: 'issued';
  issuedAt: number;
  expiresAt: number;
  reward: RewardedAdReward;
}
export interface RewardedAdStartRequest { adId: string; claimToken: string }
export interface RewardedAdClaimRequest { adId: string; claimToken: string; completed: boolean; receipt?: string }
export interface RewardedAdClaimResponse {
  ok: true;
  adId: string;
  settlementId: string;
  state: 'granted';
  rewards?: RewardDto[];
  multiplier?: 2;
  entitlement?: 'revive_escape' | 'free_entry';
}

// ---------- Player ----------
export interface PlayerStateDto {
  playerId: string;
  nick: string;
  level: number;
  xp: number;
  xpToNext: number;
  balances: Partial<Record<AssetId, number>>;
  inventory: InventoryItemDto[];
  counters: Record<string, number>;
  timestamps: Record<string, number>;
  createdAt: number;
}

export interface InventoryItemDto {
  itemId: string;
  templateId: string;
  qty: number;
  lockedQty: number;
  attrs?: Record<string, number | string | boolean>;
}

// ---------- Game sessions ----------
export interface SessionStartRequest { featureId: string; mechanicId?: string; idempotencyKey?: string }
export interface SessionStartResponse { sessionId: string; seed: string; serverTime: number; state?: unknown }

export interface GameActionRequest {
  featureId: string;
  actionId: string;
  sessionId?: string;
  clientSeq?: number;
  payload?: Record<string, unknown>;
  idempotencyKey?: string;
}
export interface RewardDto { assetId: AssetId; delta: number }
export interface GameActionResponse {
  ok: true;
  message: string;
  serverSeq: number;
  rewards?: RewardDto[];
  items?: { templateId: string; qty: number; attrs?: Record<string, unknown> }[];
  state?: unknown;
  counters?: Record<string, number>;
  replayToken?: string;
  rngTrace?: string[];
}

export interface GameStateRequest { featureId: string; sessionId?: string }
export interface GameReadResponse { ok: true; state: unknown; serverTime: number }

// ---------- 排行 / 历史 ----------
export interface RankRow { rank: number; playerId: string; nick: string; score: number; isSelf?: boolean }
export interface HistoryRow { id: string; featureId: string; summary: string; createdAt: number; rewards?: RewardDto[] }

// ---------- 邮件 / 社交 ----------
export interface MailDto { mailId: string; title: string; body: string; rewards: RewardDto[]; claimed: boolean; createdAt: number }
export interface FriendDto { playerId: string; nick: string; level: number; lastActiveAt: number }

// ---------- 商城 / 订单（mock contract） ----------
export interface MallGoodsDto { goodsId: string; title: string; priceCoin: number; priceIntegral: number; kind: 'virtual' | 'physical' | 'claim'; stock: number }
export interface MallOrderDto { orderId: string; goodsId: string; status: 'CREATED' | 'PAID' | 'SHIPPED' | 'DONE' | 'CANCELLED'; createdAt: number; logistics?: { company: string; no: string } }

// ---------- 市场寄售/竞拍（沙盒契约，full-clone only） ----------
export interface MarketListingDto { listingId: string; sellerId: string; assetId?: AssetId; templateId?: string; qty: number; unitPrice: number; createdAt: number; kind: 'market' | 'consignment' | 'auction'; expiresAt?: number; topBid?: number }
export interface SettlementPreview { displayAmount: string; note: string }
export interface WithdrawalSandboxResponse { fee: string; arrival: string; notice: string }

// ---------- Telemetry ----------
export interface TelemetryEvent { name: string; at?: number; props?: Record<string, unknown> }
