export class Rng {
  private state: number;
  constructor(seed = 0x6d2b79f5) { this.state = seed >>> 0 || 1; }
  next(): number {
    let x = this.state;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    this.state = x >>> 0;
    return this.state / 0xffffffff;
  }
  int(min: number, max: number): number { return Math.floor(this.next() * (max - min + 1)) + min; }
  pick<T>(items: T[]): T { return items[Math.min(items.length - 1, Math.floor(this.next() * items.length))]; }
  weighted<T>(items: Array<{value:T, weight:number}>): T {
    const total = items.reduce((s, i) => s + Math.max(0, i.weight), 0);
    let r = this.next() * total;
    for (const item of items) { r -= Math.max(0, item.weight); if (r <= 0) return item.value; }
    return items[items.length - 1].value;
  }
}
