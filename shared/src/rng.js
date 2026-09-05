"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rng = void 0;
/**
 * Section 46 RNG —— 可注入 seed 的确定性随机。
 * sfc32 算法（质量优于 xorshift32），支持 fork(nonce) 派生、重放。
 * 高价值资产（掉落/战斗/宝箱/PvE 结算）禁止直接使用 Math.random()。
 */
class Rng {
    constructor(seed = 0x6d2b79f5) {
        this.tag = String(seed);
        const h = typeof seed === 'string' ? Rng.hashString(seed) : seed >>> 0;
        // splitmix32 展开 4 个状态字
        let s = h || 0x9e3779b9;
        const next = () => {
            s = (s + 0x9e3779b9) >>> 0;
            let z = s;
            z = Math.imul(z ^ (z >>> 16), 0x21f0aaad) >>> 0;
            z = Math.imul(z ^ (z >>> 15), 0x735a2d97) >>> 0;
            return (z ^ (z >>> 15)) >>> 0;
        };
        this.a = next();
        this.b = next();
        this.c = next();
        this.d = next();
        if ((this.a | this.b | this.c | this.d) === 0)
            this.a = 1;
    }
    static hashString(str) {
        let h = 2166136261 >>> 0;
        for (let i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = Math.imul(h, 16777619) >>> 0;
        }
        return h >>> 0;
    }
    next() {
        const t = (this.a + this.b) >>> 0;
        this.a = this.b ^ (this.b >>> 9);
        this.b = (this.c + (this.c << 3)) >>> 0;
        this.c = (this.c << 21 | this.c >>> 11) >>> 0;
        this.d = (this.d + 1) >>> 0;
        const out = (t + this.d) >>> 0;
        this.c = (this.c + out) >>> 0;
        return out / 4294967296;
    }
    int(min, max) {
        if (max < min)
            [min, max] = [max, min];
        return Math.floor(this.next() * (max - min + 1)) + min;
    }
    float(min, max) {
        return min + this.next() * (max - min);
    }
    chance(p) {
        return this.next() < p;
    }
    pick(items) {
        return items[Math.min(items.length - 1, Math.floor(this.next() * items.length))];
    }
    weighted(items) {
        const total = items.reduce((s, i) => s + Math.max(0, i.weight), 0);
        if (total <= 0)
            return items[items.length - 1].value;
        let r = this.next() * total;
        for (const item of items) {
            r -= Math.max(0, item.weight);
            if (r <= 0)
                return item.value;
        }
        return items[items.length - 1].value;
    }
    shuffle(items) {
        const arr = items.slice();
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(this.next() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
    /** 派生子 RNG（纯函数式：由父种子标签 + nonce 决定，不消耗父状态，服务端按 serverSeq 派生可精确重放） */
    fork(nonce) {
        return new Rng(`${this.tag}#${nonce}`);
    }
    /** 导出内部状态用于 replay 存档 */
    snapshot() {
        return [this.a, this.b, this.c, this.d];
    }
}
exports.Rng = Rng;
