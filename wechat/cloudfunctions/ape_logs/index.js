/**
 * ape_logs 云函数 —— 客户端错误日志直读通道
 *
 * 工作模式：
 *   - write: 客户端通过 wx.cloud.callFunction 上报日志（console.error / unhandledrejection / fatal）
 *           写入云开发数据库集合 client_logs（每条 = { at, kind, msg, stack, ctx }）
 *   - read:  开发侧用 tcb/invokecloudfunction 调本函数 {op:'read'} 读取最近 N 条
 *
 * 设计要点：
 *   - wx-server-sdk 是**可选**依赖（云函数可能不带 node_modules）；
 *     不在时仍能记录到内存（最近 50 条），read 返回内存日志
 *   - 数据库集合若不存在则不抛错（首次写入时自动创建），
 *     确保开发早期 / 离线 / 异常环境下日志不丢
 */
let sdk: any = null;
let db: any = null;
try {
  sdk = require('wx-server-sdk');
  try { sdk.init({ env: sdk.DYNAMIC_CURRENT_ENV }); } catch { /* ignore */ }
  try { db = sdk.database(); } catch { /* db may be unavailable */ }
} catch { /* wx-server-sdk not installed; fall back to in-memory */ }

// 内存日志（最近 50 条）：SDK 缺失或 DB 写入失败时兜底
const memLog: Array<{ at: number; kind: string; msg: string; stack?: string; ctx?: any }> = [];
const MEM_LIMIT = 50;

async function persist(entry: typeof memLog[number]): Promise<void> {
  if (db) {
    try {
      const col = db.collection('client_logs');
      const r = await col.add({ data: entry });
      // wx-server-sdk v2 returns { _id } or throws
      if (r && (r._id || r.id)) return;
    } catch { /* fall through to memory */ }
  }
  memLog.push(entry);
  if (memLog.length > MEM_LIMIT) memLog.splice(0, memLog.length - MEM_LIMIT);
}

async function readEntries(limit: number): Promise<any[]> {
  if (db) {
    try {
      const col = db.collection('client_logs');
      const orderBy = (db.command || (db as any).command).desc;
      const res = await col.orderBy('at', 'desc').limit(limit).get();
      const list = (res && res.data) || [];
      if (list.length) return list;
    } catch { /* fall through */ }
  }
  return memLog.slice(-limit).reverse();
}

exports.main = async (event: any) => {
  const { op = 'write', kind = 'info', msg = '', stack, ctx, limit = 50 } = event || {};
  try {
    if (op === 'read') {
      const list = await readEntries(limit);
      return { ok: true, count: list.length, items: list };
    }
    if (op === 'clear') {
      if (db) { try { await db.collection('client_logs').where({ _id: { $exists: true } }).remove(); } catch { /* noop */ } }
      memLog.length = 0;
      return { ok: true, cleared: true };
    }
    // default: write
    const entry = { at: Date.now(), kind: String(kind).slice(0, 32), msg: String(msg).slice(0, 1024), stack: stack ? String(stack).slice(0, 2048) : undefined, ctx: ctx || undefined };
    await persist(entry);
    return { ok: true, logged: true };
  } catch (e: any) {
    return { ok: false, code: 'LOG_ERR', message: e?.message || String(e) };
  }
};