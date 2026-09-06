/**
 * ApeIsland 权威服务端（微信云开发 · 云函数形态）
 *
 * 为什么是云函数：AppID 绑定的微信侧云开发环境（cloud1-…）不向腾讯云 CAM 暴露，
 * 云托管容器无法通过 CLI 部署；云函数是该类环境中可稳定部署的服务端形态，
 * 且客户端通过 wx.cloud.callFunction 走微信私有链路（无需配置服务器域名）。
 *
 * 协议：客户端传 { path, method, body, headers, idempotencyKey }，
 * 本函数复用服务端 routes 做内部分发（与测试用 InProcessTransport 同一套匹配规则）。
 */
// 运行期配置：config.local.js 由构建器从环境变量生成（位于 gitignore 的 build/ 下，不入库）。
// 云函数无法用 CLI 设置环境变量，故以随包配置文件的方式注入 AppID/AppSecret/签名密钥。
try {
  const local = require('./config.local.js');
  for (const [k, v] of Object.entries(local)) if (process.env[k] === undefined) process.env[k] = String(v);
} catch { /* 未生成配置时回落纯环境变量 */ }

// wx-server-sdk 为**可选**依赖：本函数只用 cloud.init 声明环境，派发逻辑是纯 Node。
// 原因：--remote-npm-install 会排除 node_modules（导致 @ape/server 丢失），
// 不带它则云端不安装任何依赖。将其降级为 try/catch 后，两种部署模式都能运行。
try {
  const cloud = require('wx-server-sdk');
  cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
} catch {
  // 云函数运行时已注入环境信息，缺少 SDK 不影响本函数的路由派发
}

let cached = null;
function getApp() {
  if (cached) return cached;
  // 服务端编译产物放在 node_modules/@ape/server 下：
  // 云函数部署只打包函数自身目录，因此不能引用同级的 ../../dist；
  // 而 DevTools 扫描 cloudfunctionRoot 时会跳过 node_modules，从而消除"非小程序结构"警告。
  let GameApp;
  try {
    GameApp = require('@ape/server/dist/server/src/app.js').GameApp;
  } catch (e) {
    // 回退：若部署产物的 node_modules 被裁剪，仍尝试函数内 dist 形态
    GameApp = require('./dist/server/src/app.js').GameApp;
  }
  const profile = process.env.APP_PROFILE === 'full-clone' ? 'full-clone' : 'wechat-release';
  cached = {
    app: new GameApp({
      profile,
      secret: process.env.APP_SECRET,
      persistPath: process.env.APP_DATA_DIR ? require('path').join(process.env.APP_DATA_DIR, 'store.json') : null,
    }),
  };
  cached.routes = cached.app.routes();
  return cached;
}

function dispatch(routes, path, method, body, headers) {
  const [pathname, query] = String(path || '').split('?');
  const pp = pathname.split('/').filter(Boolean);
  for (const r of routes) {
    if (r.method !== method) continue;
    const cp = r.pattern.split('/').filter(Boolean);
    if (cp.length !== pp.length) continue;
    const params = {};
    let ok = true;
    for (let i = 0; i < cp.length; i++) {
      if (cp[i].startsWith(':')) params[cp[i].slice(1)] = decodeURIComponent(pp[i]);
      else if (cp[i] !== pp[i]) { ok = false; break; }
    }
    if (ok) {
      const out = {};
      const ctx = {
        req: { headers: { authorization: (headers && headers.authorization) || '' } },
        res: {}, method, path: pathname, params,
        query: new URLSearchParams(query || ''), body: body || {},
        status() {}, json(data) { out.data = data; },
      };
      return Promise.resolve(r.handler(ctx)).then(() => out.data);
    }
  }
  return Promise.resolve({ ok: false, code: 'NOT_FOUND', message: `no route ${method} ${pathname}` });
}

exports.main = async (event) => {
  const { path, method = 'GET', body, headers, idempotencyKey } = event || {};
  if (!path) return { ok: false, code: 'BAD_REQUEST', message: 'missing path' };
  try {
    const { routes } = getApp();
    const data = await dispatch(routes, path, method, body, headers);
    return { ok: true, statusCode: 200, data, idempotencyKey: idempotencyKey || null };
  } catch (e) {
    console.error('[ape_api] dispatch failed', path, method, e);
    return { ok: false, statusCode: 500, code: 'FUNCTION_ERROR', message: String((e && e.message) || e) };
  }
};
