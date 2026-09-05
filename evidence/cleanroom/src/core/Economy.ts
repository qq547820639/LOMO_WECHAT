import { Currency, PlayerState } from './State';
export class Economy {
  constructor(private s: PlayerState) {}
  canPay(cost: Partial<Record<Currency, number>>): boolean {
    return Object.entries(cost).every(([k,v]) => this.s.currencies[k as Currency] >= (v || 0));
  }
  pay(cost: Partial<Record<Currency, number>>): boolean {
    if (!this.canPay(cost)) return false;
    for (const [k,v] of Object.entries(cost)) this.s.currencies[k as Currency] -= Math.max(0, Math.floor(v || 0));
    return true;
  }
  add(reward: Partial<Record<Currency, number>>): void {
    for (const [k,v] of Object.entries(reward)) this.s.currencies[k as Currency] += Math.max(0, Math.floor(v || 0));
  }
  addItem(id: string, n=1): void { this.s.inventory[id] = (this.s.inventory[id] || 0) + Math.max(0, Math.floor(n)); }
  takeItem(id: string, n=1): boolean { if ((this.s.inventory[id]||0)<n) return false; this.s.inventory[id]-=n; return true; }
}
