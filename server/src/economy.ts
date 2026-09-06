/**
 * EconomyOps —— 游戏处理器使用的经济操作门面。
 * 所有资产变动强制经过 Ledger（服务器权威）；Release 档禁止对禁改资产产生正向 delta。
 */
import { AssetId, roundToPrecision } from '../../shared/src/assets';
import { RELEASE_FORBIDDEN_ASSETS } from '../../shared/src/config';
import { RewardDto } from '../../shared/src/protocol';
import { Store, PlayerRecord } from './store';

export class EconomyOps {
  collected: RewardDto[] = [];

  constructor(private store: Store, private profile: 'full-clone' | 'wechat-release') {}

  private guard(assetId: AssetId, delta: number): void {
    if (this.profile === 'wechat-release' && delta > 0 && (RELEASE_FORBIDDEN_ASSETS as string[]).includes(assetId)) {
      throw new Error(`RELEASE_FORBIDDEN_ASSET: ${assetId} 不得在 wechat-release 下发放`);
    }
  }

  balance(playerId: string, assetId: AssetId): number { return this.store.ledger.balanceOf(playerId, assetId); }

  balances(playerId: string): Partial<Record<AssetId, number>> { return this.store.ledger.balancesOf(playerId); }

  grant(playerId: string, assetId: AssetId, delta: number, sourceType: string, sourceId: string, idempotencyKey?: string): RewardDto {
    if (delta <= 0) throw new Error('grant requires positive delta, use spend');
    this.guard(assetId, delta);
    const v = roundToPrecision(delta, assetId);
    const e = this.store.ledger.apply({ playerId, assetType: assetId, delta: v, sourceType, sourceId, idempotencyKey });
    const dto = { assetId, delta: e.delta };
    this.collected.push(dto);
    this.store.touch();
    return dto;
  }

  spend(playerId: string, assetId: AssetId, delta: number, sourceType: string, sourceId: string, idempotencyKey?: string): RewardDto {
    if (delta <= 0) throw new Error('spend requires positive delta');
    const e = this.store.ledger.apply({ playerId, assetType: assetId, delta: -roundToPrecision(delta, assetId), sourceType, sourceId, idempotencyKey });
    const dto = { assetId, delta: e.delta };
    this.collected.push(dto);
    this.store.touch();
    return dto;
  }

  payFrom(player: PlayerRecord, cost: Partial<Record<AssetId, number>>, sourceType: string, sourceId: string): boolean {
    for (const [k, v] of Object.entries(cost)) {
      const need = Math.max(0, Math.floor(v || 0));
      if (need <= 0) continue;
      if (this.balance(player.playerId, k as AssetId) < need) return false;
    }
    for (const [k, v] of Object.entries(cost)) {
      const need = Math.max(0, Math.floor(v || 0));
      if (need > 0) this.spend(player.playerId, k as AssetId, need, sourceType, sourceId);
    }
    return true;
  }

  addItems(playerId: string, templateId: string, qty = 1, attrs?: Record<string, number | string | boolean>): void {
    if (templateId === '__proto__' || templateId === 'constructor' || templateId === 'prototype') throw new Error('invalid template id');
    const inv = this.store.player(playerId)!.inventory;
    const cur = Object.prototype.hasOwnProperty.call(inv, templateId) ? inv[templateId] : { qty: 0, lockedQty: 0 };
    inv[templateId] = { ...cur, qty: cur.qty + Math.max(0, Math.floor(qty)), attrs: attrs ?? cur.attrs };
    this.store.touch();
  }

  takeItems(playerId: string, templateId: string, qty = 1): boolean {
    if (!Number.isSafeInteger(qty) || qty <= 0 || templateId === '__proto__' || templateId === 'constructor' || templateId === 'prototype') return false;
    const inv = this.store.player(playerId)!.inventory;
    const cur = Object.prototype.hasOwnProperty.call(inv, templateId) ? inv[templateId] : undefined;
    if (!cur || cur.qty < qty) return false;
    cur.qty -= qty;
    if (cur.qty === 0 && cur.lockedQty === 0) delete inv[templateId];
    this.store.touch();
    return true;
  }

  itemCount(playerId: string, templateId: string): number {
    const inv = this.store.player(playerId)!.inventory;
    return Object.prototype.hasOwnProperty.call(inv, templateId) ? inv[templateId].qty : 0;
  }

  /** 体力按时间回复（timestamp based），返回回复后的当前体力 */
  regenEnergy(player: PlayerRecord, now: number, max: number, regenMinutes: number): number {
    const last = player.timestamps['energyRegenAt'] ?? now;
    const minutes = Math.floor((now - last) / 60000);
    if (minutes > 0) {
      const gain = Math.floor(minutes / Math.max(1, regenMinutes));
      if (gain > 0) {
        const cur = this.balance(player.playerId, 'ENERGY');
        const target = Math.min(max, cur + gain);
        const actual = target - cur;
        if (actual > 0) this.store.ledger.apply({ playerId: player.playerId, assetType: 'ENERGY', delta: actual, sourceType: 'time', sourceId: 'regen', createdAt: now });
        player.timestamps['energyRegenAt'] = now;
        this.store.touch();
      }
    }
    return this.balance(player.playerId, 'ENERGY');
  }

  drainCollected(): RewardDto[] { const c = this.collected; this.collected = []; return c; }
}

export { roundToPrecision };
