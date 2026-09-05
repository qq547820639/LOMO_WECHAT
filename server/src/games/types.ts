/**
 * 游戏处理器契约 —— 所有玩法服务端逻辑的唯一入口形式。
 * 每个玩法文件导出 FeatureGame，由 server/src/games/index.ts 聚合注册。
 *
 * 规则：
 *  - 服务端权威：一切奖励/扣费通过 ctx.econ（走 Ledger），禁止直接改余额。
 *  - 确定性：随机必须用 ctx.rng（来自 session seed 派生），禁止 Math.random()。
 *  - 未知原参数：ctx.num('battleRoyal.baseDoorHp', fallback) 从 tuning 读取，绝不硬编码原值。
 *  - Release 档：现金敏感动作会被网关拦截（FEATURE_DISABLED）；沙盒动作照常可用。
 */
import { Rng } from '../../../shared/src/rng';
import { TuningConfig, BuildProfile } from '../../../shared/src/config';
import { RewardDto } from '../../../shared/src/protocol';
import { Store, PlayerRecord, SessionRecord } from '../store';
import { EconomyOps } from '../economy';

export interface GameCtx {
  playerId: string;
  player: PlayerRecord;
  payload: Record<string, unknown>;
  now: number;
  tuning: TuningConfig;
  profile: BuildProfile;
  rng: Rng;
  session?: SessionRecord;
  econ: EconomyOps;
  store: Store;
  /** 读 tuning 数值：num('battleRoyal.baseDoorHp', 100) */
  num: (path: string, fallback: number) => number;
  /** 读 tuning 数组 [a,b] 并取随机整数 */
  numRange: (path: string, rng: Rng, fallback: [number, number]) => number;
}

export interface GameResult {
  ok: boolean;
  message: string;
  rewards?: RewardDto[];
  items?: { templateId: string; qty: number; attrs?: Record<string, unknown> }[];
  /** 玩法自有状态（客户端渲染用） */
  state?: unknown;
  counters?: Record<string, number>;
  replayToken?: string;
  /** 排行榜上报 */
  rank?: { board: string; score: number };
  /** 历史记录摘要（写入 history/记录中心） */
  history?: string;
  /** 客户端表现层提示（音效/动画标记） */
  fx?: string[];
}

export type GameHandler = (ctx: GameCtx) => GameResult;

export interface ReadCtx {
  playerId: string;
  player: PlayerRecord;
  now: number;
  tuning: TuningConfig;
  profile: BuildProfile;
  store: Store;
  econ: EconomyOps;
  num: (path: string, fallback: number) => number;
}

export interface FeatureGame {
  id: string;
  /** GET /v1/game/state?featureId= 的状态读取器 */
  readState?: (ctx: ReadCtx) => unknown;
  actions: Record<string, GameHandler>;
}

export const ok = (message: string, extra: Partial<GameResult> = {}): GameResult => ({ ok: true, message, ...extra });
export const fail = (message: string): GameResult => ({ ok: false, message });
