/**
 * ape_logs 云函数 —— 客户端错误日志直读通道（纯 JS，云函数不做 TS 编译）
 *
 *   - write: 客户端 wx.cloud.callFunction 上报日志，写入云数据库集合 client_logs
 *   - read:  开发侧 tcb/invokecloudfunction {op:'read'} 读最近 N 条
 *   - wx-server-sdk 可选：缺失时记内存（最近 50 条兜底）
 */
let db = null;
try {
  const sdk = require('wx-server-sdk');
  try { sdk.init({ env: sdk.DYNAMIC_CURRENT_ENV }); } catch (e) { /* ignore */ }
  try { db = sdk.database(); } catch (e) { /* db unavailable */ }
} catch (e) { /* wx-server-sdk not installed */ }

const memLog = [];
const MEM_LIMIT = 50;

async function persist(entry) {
  if (db) {
    try {
      const r = await db.collection('client_logs').add({ data: entry });
      if (r && (r._id || r.id)) return;
    } catch (e) { /* fall through to memory */ }
  }
  memLog.push(entry);
  if (memLog.length > MEM_LIMIT) memLog.splice(0, memLog.length - MEM_LIMIT);
}

async function readEntries(limit) {
  if (db) {
    try {
      const res = await db.collection('client_logs').orderBy('at', 'desc').limit(limit).get();
      const list = (res && res.data) || [];
      if (list.length) return list;
    } catch (e) { /* fall through */ }
  }
  return memLog.slice(-limit).reverse();
}

exports.main = async (event) => {
  const opts = event || {};
  const op = opts.op || 'write';
  const limit = opts.limit || 50;
  try {
    if (op === 'read') {
      const list = await readEntries(limit);
      return { ok: true, count: list.length, items: list };
    }
    if (op === 'clear') {
      if (db) { try { await db.collection('client_logs').where({ _id: db.command.exists(true) }).remove(); } catch (e) { /* noop */ } }
      memLog.length = 0;
      return { ok: true, cleared: true };
    }
    const entry = {
      at: Date.now(),
      kind: String(opts.kind || 'info').slice(0, 32),
      msg: String(opts.msg || '').slice(0, 1024),
      stack: opts.stack ? String(opts.stack).slice(0, 2048) : undefined,
      ctx: opts.ctx || undefined,
    };
    await persist(entry);
    return { ok: true, logged: true };
  } catch (e) {
    return { ok: false, code: 'LOG_ERR', message: String((e && e.message) || e) };
  }
};
