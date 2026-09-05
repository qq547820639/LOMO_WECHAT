export interface RoomState { id: number; stake: number; doorHp: number; players: string[]; }
export interface BattleRoyalConfig { roomCount: number; feeRate: number; baseDoorHp: number; killerDamage: number; daggerLossRatio: number; }
export interface BattleRoyalResult { killedRoomId: number; fee: number; distributable: number; roomPayouts: Record<number, number>; daggerMinted: number; }

// Reconstructs the legacy room/killer loop with non-redeemable sandbox units only.
export function settleVirtualRound(rooms: RoomState[], killedRoomId: number, cfg: BattleRoyalConfig): BattleRoyalResult {
  const total = rooms.reduce((s,r)=>s+r.stake,0);
  const fee = total * cfg.feeRate;
  const killed = rooms.find(r=>r.id===killedRoomId);
  if (!killed) throw new Error('killed room missing');
  const killedPool = killed.stake;
  const survivors = rooms.filter(r=>r.id!==killedRoomId);
  const survivorStake = survivors.reduce((s,r)=>s+r.stake,0);
  const redistributable = Math.max(0, killedPool - fee);
  const roomPayouts: Record<number, number> = {};
  for (const r of survivors) roomPayouts[r.id] = survivorStake > 0 ? redistributable * r.stake / survivorStake : 0;
  roomPayouts[killedRoomId] = 0;
  return { killedRoomId, fee, distributable: redistributable, roomPayouts, daggerMinted: killedPool * cfg.daggerLossRatio };
}
