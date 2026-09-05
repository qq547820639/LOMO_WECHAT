export type Currency = 'coin'|'energy'|'gem'|'medal'|'ticket'|'cardDust'|'ore';
export interface PlayerState {
  version: number;
  playerId: string;
  level: number;
  xp: number;
  currencies: Record<Currency, number>;
  inventory: Record<string, number>;
  flags: Record<string, boolean>;
  counters: Record<string, number>;
  timestamps: Record<string, number>;
  lastRoute: string;
}
export const initialState = (): PlayerState => ({
  version: 1,
  playerId: 'local-' + Math.floor(Math.random()*1e9),
  level: 1,
  xp: 0,
  currencies: { coin: 500, energy: 30, gem: 0, medal: 0, ticket: 5, cardDust: 0, ore: 0 },
  inventory: { starter_card: 1, free_box_key: 3 },
  flags: {}, counters: {}, timestamps: {}, lastRoute: 'home'
});
export const xpForLevel = (level: number) => 100 + (level - 1) * 40;
export function grantXp(s: PlayerState, amount: number): string[] {
  const events: string[] = []; s.xp += Math.max(0, Math.floor(amount));
  while (s.xp >= xpForLevel(s.level)) { s.xp -= xpForLevel(s.level); s.level++; s.currencies.energy += 5; events.push(`升级到 Lv.${s.level}`); }
  return events;
}
