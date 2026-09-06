/**
 * Section 19 统一 Economy Ledger —— 服务器权威账本模型。
 * 所有游戏奖励/扣费/矿场产出/邮件补偿/广告奖励/商店购买/合成/分解/活动/任务统一经过账本。
 * 禁止重要资产由客户端直接修改。
 */
import { ASSET_CATALOG, AssetId, roundToPrecision } from './assets';

export interface LedgerEntry {
  txnId: string;
  playerId: string;
  assetType: AssetId;
  delta: number;
  balanceBefore: number;
  balanceAfter: number;
  sourceType: string;
  sourceId: string;
  idempotencyKey: string | null;
  createdAt: number;
  metadata?: Record<string, unknown>;
}

export class LedgerError extends Error {
  constructor(public code: 'IDEMPOTENT_REPLAY' | 'INSUFFICIENT_BALANCE' | 'UNKNOWN_ASSET' | 'INVALID_DELTA', msg: string) {
    super(msg);
  }
}

export class Ledger {
  private entries: LedgerEntry[] = [];
  private balances: Map<string, Map<AssetId, number>> = new Map();
  private idemKeys: Map<string, LedgerEntry> = new Map();

  constructor(private txnIdGen: () => string) {}

  balanceOf(playerId: string, assetId: AssetId): number {
    return this.balances.get(playerId)?.get(assetId) ?? 0;
  }

  balancesOf(playerId: string): Partial<Record<AssetId, number>> {
    const out: Partial<Record<AssetId, number>> = {};
    const m = this.balances.get(playerId);
    if (m) for (const [k, v] of m) out[k] = roundToPrecision(v, k);
    return out;
  }

  entriesOf(playerId: string, limit = 100, assetType?: AssetId): LedgerEntry[] {
    const list = this.entries.filter((e) => e.playerId === playerId && (!assetType || e.assetType === assetType));
    return list.slice(-limit).reverse();
  }

  /**
   * 记一笔资产变动。delta 可为负（扣减，要求余额充足）。
   * idempotencyKey 命中已存在记录时直接返回原记录（幂等重放），不再变动余额。
   */
  apply(params: {
    playerId: string;
    assetType: AssetId;
    delta: number;
    sourceType: string;
    sourceId: string;
    idempotencyKey?: string | null;
    createdAt?: number;
    metadata?: Record<string, unknown>;
  }): LedgerEntry {
    const { playerId, assetType, delta, sourceType, sourceId } = params;
    if (!ASSET_CATALOG[assetType]) throw new LedgerError('UNKNOWN_ASSET', `unknown asset: ${assetType}`);
    if (!Number.isFinite(delta) || delta === 0) throw new LedgerError('INVALID_DELTA', `delta must be non-zero finite: ${delta}`);
    if (params.idempotencyKey) {
      const k = `${playerId}:${params.idempotencyKey}`;
      const prior = this.idemKeys.get(k);
      if (prior) return prior;
    }
    const before = roundToPrecision(this.balanceOf(playerId, assetType), assetType);
    const after = roundToPrecision(before + delta, assetType);
    if (after < 0) throw new LedgerError('INSUFFICIENT_BALANCE', `${assetType} balance ${before} < needed ${-delta}`);
    const entry: LedgerEntry = {
      txnId: this.txnIdGen(),
      playerId,
      assetType,
      delta: roundToPrecision(delta, assetType),
      balanceBefore: before,
      balanceAfter: after,
      sourceType,
      sourceId,
      idempotencyKey: params.idempotencyKey ?? null,
      createdAt: params.createdAt ?? Date.now(),
      metadata: params.metadata,
    };
    if (!this.balances.has(playerId)) this.balances.set(playerId, new Map());
    this.balances.get(playerId)!.set(assetType, after);
    this.entries.push(entry);
    if (params.idempotencyKey) this.idemKeys.set(`${playerId}:${params.idempotencyKey}`, entry);
    return entry;
  }

  /** 多资产原子操作：任一失败则全部不落账。 */
  applyBatch(playerId: string, ops: Array<{ assetType: AssetId; delta: number; sourceType: string; sourceId: string }>, idempotencyKey?: string): LedgerEntry[] {
    const staged: Array<{ assetType: AssetId; projected: number }> = [];
    const projected = new Map<AssetId, number>();
    for (const op of ops) {
      if (!ASSET_CATALOG[op.assetType]) throw new LedgerError('UNKNOWN_ASSET', `unknown asset: ${op.assetType}`);
      if (!Number.isFinite(op.delta) || op.delta === 0) throw new LedgerError('INVALID_DELTA', `delta must be non-zero finite: ${op.delta}`);
      const base = projected.get(op.assetType) ?? this.balanceOf(playerId, op.assetType);
      const next = roundToPrecision(base + op.delta, op.assetType);
      if (next < 0) throw new LedgerError('INSUFFICIENT_BALANCE', `batch: ${op.assetType} ${base} < ${-op.delta}`);
      projected.set(op.assetType, next);
      staged.push({ assetType: op.assetType, projected: next });
    }
    const out: LedgerEntry[] = [];
    for (const [index, op] of ops.entries()) {
      out.push(this.apply({ playerId, ...op, idempotencyKey: idempotencyKey ? `${idempotencyKey}:${index}:${op.assetType}` : null }));
    }
    return out;
  }

  /** 经济不变量校验：每条 entry 的 balanceAfter == balanceBefore + delta，且与最终余额链一致。 */
  validateInvariants(playerId: string): { ok: boolean; errors: string[] } {
    const errors: string[] = [];
    const running = new Map<AssetId, number>();
    for (const e of this.entries.filter((x) => x.playerId === playerId)) {
      const base = running.get(e.assetType) ?? 0;
      if (Math.abs(e.balanceBefore - base) > 1e-9) errors.push(`continuity break at ${e.txnId}: before=${e.balanceBefore} expected=${base}`);
      if (Math.abs(e.balanceAfter - (e.balanceBefore + e.delta)) > 1e-9) errors.push(`arithmetic break at ${e.txnId}`);
      if (e.balanceAfter < 0) errors.push(`negative balance at ${e.txnId}`);
      running.set(e.assetType, e.balanceAfter);
    }
    for (const [k, v] of running) {
      const final = this.balanceOf(playerId, k);
      if (Math.abs(final - v) > 1e-9) errors.push(`final mismatch ${k}: ${final} != ${v}`);
    }
    return { ok: errors.length === 0, errors };
  }

  /** 序列化（持久化/测试断言用） */
  dump(): { entries: LedgerEntry[]; balances: Record<string, Record<string, number>> } {
    const balances: Record<string, Record<string, number>> = {};
    for (const [pid, m] of this.balances) {
      balances[pid] = {};
      for (const [k, v] of m) balances[pid][k] = v;
    }
    return { entries: this.entries, balances };
  }

  restore(dump: { entries: LedgerEntry[]; balances: Record<string, Record<string, number>> }): void {
    this.entries = dump.entries;
    this.balances = new Map();
    this.idemKeys = new Map();
    for (const [pid, m] of Object.entries(dump.balances)) {
      const mm = new Map();
      for (const [k, v] of Object.entries(m)) mm.set(k as AssetId, v);
      this.balances.set(pid, mm);
    }
    for (const e of this.entries) {
      if (e.idempotencyKey) this.idemKeys.set(`${e.playerId}:${e.idempotencyKey}`, e);
    }
  }
}
