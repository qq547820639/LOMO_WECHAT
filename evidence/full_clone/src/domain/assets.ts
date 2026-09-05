export type AssetCode =
  | 'GEMSTONE' | 'MEDAL' | 'NDTU' | 'WORLD_COIN' | 'APE_STONE'
  | 'SAND' | 'GOLD' | 'DAGGER' | 'BADGE' | 'INTEGRAL'
  | 'APE_CARD' | 'PLANET_CARD' | 'FLASH_CARD' | 'TICKET'
  | 'RED_PACKET_PROGRESS' | 'TEST_CREDIT';

export interface AssetBalance { code: AssetCode; available: number; locked: number; }
export interface LedgerEntry {
  id: string; code: AssetCode; delta: number; balanceAfter: number;
  reason: string; refType?: string; refId?: string; createdAt: number;
}

export interface InventoryItem {
  id: string; type: 'CARD'|'PART'|'PROP'|'DAGGER'|'PHYSICAL_CLAIM'|'PUZZLE'|'BADGE';
  templateId: string; qty: number; lockedQty: number; attrs?: Record<string, number|string|boolean>;
}

export interface RemoteEconomyConfig {
  version: string;
  feeRates: Record<string, number>;
  exchangeRates: Record<string, number>;
  miningPlans: Record<string, { cost: number; durationSec: number; yieldTotal: number; asset: AssetCode }>;
  featureFlags: Record<string, boolean>;
}
