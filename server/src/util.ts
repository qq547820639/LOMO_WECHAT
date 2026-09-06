/**
 * 服务端工具（无 node 原生依赖，可在微信小游戏进程内运行）。
 */
let seq = 0;
export function randomId(len = 16): string {
  seq = (seq + 1) % 0xffff;
  let s = `${Date.now().toString(36)}${seq.toString(36)}${Math.floor(Math.random() * 1e9).toString(36)}`;
  while (s.length < len) s += Math.floor(Math.random() * 1e9).toString(36);
  return s.slice(0, len);
}

/** HMAC-SHA256（lazy require node:crypto；wx 进程内模式不会调用） */
export function hmac(secret: string, data: string): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createHmac } = require('node:crypto');
    return createHmac('sha256', secret).update(data).digest('hex');
  } catch {
    // 纯 JS 回退（非加密安全，仅离线演示用）
    let h1 = 0xdeadbeef ^ secret.length, h2 = 0x41c6ce57;
    const input = secret + ':' + data;
    for (let i = 0; i < input.length; i++) {
      const ch = input.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
  }
}

export function safeEqual(left: string, right: string): boolean {
  try {
    const { timingSafeEqual } = require('node:crypto');
    const a = Buffer.from(left);
    const b = Buffer.from(right);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    if (left.length !== right.length) return false;
    let diff = 0;
    for (let i = 0; i < left.length; i++) diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
    return diff === 0;
  }
}
