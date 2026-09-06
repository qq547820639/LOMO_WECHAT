"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiClient = exports.InProcessTransport = exports.HttpTransport = void 0;
const config_1 = require("../../../shared/src/config");
class HttpTransport {
    constructor(platform, baseUrl, timeout = 10000) {
        this.platform = platform;
        this.timeout = timeout;
        this.baseUrl = baseUrl.replace(/\/+$/, '');
    }
    async request(path, method, body, headers) {
        let lastErr = null;
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                const res = await this.platform.httpRequest({
                    url: this.baseUrl + path, method, data: body, header: { 'content-type': 'application/json', ...(headers || {}) }, timeout: this.timeout,
                });
                if (res.statusCode >= 500 && attempt < 2) {
                    await sleep(300 * (attempt + 1));
                    continue;
                }
                return res.data;
            }
            catch (err) {
                lastErr = err;
                await sleep(300 * (attempt + 1));
            }
        }
        throw lastErr !== null && lastErr !== void 0 ? lastErr : new Error('network fail');
    }
}
exports.HttpTransport = HttpTransport;
/** 进程内 Transport：require 编译产物 server/src/app.js（仅 standalone/测试用，微信真机固定使用 HTTP） */
class InProcessTransport {
    constructor(profile) {
        // 延迟 require：仅在 standalone 模式加载（app.ts 不依赖 node:http/fs 顶层）
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { GameApp } = require('../../../server/src/app');
        this.app = new GameApp({ profile });
        this.routes = this.app.routes();
    }
    get appInstance() { return this.app; }
    request(path, method, body, headers) {
        return new Promise((resolve, reject) => {
            const [pathname, query] = path.split('?');
            let found = null;
            const pp = pathname.split('/').filter(Boolean);
            for (const r of this.routes) {
                if (r.method !== method)
                    continue;
                const cp = r.pattern.split('/').filter(Boolean);
                if (cp.length !== pp.length)
                    continue;
                const params = {};
                let ok = true;
                for (let i = 0; i < cp.length; i++) {
                    if (cp[i].startsWith(':'))
                        params[cp[i].slice(1)] = decodeURIComponent(pp[i]);
                    else if (cp[i] !== pp[i]) {
                        ok = false;
                        break;
                    }
                }
                if (ok) {
                    found = { handler: r.handler, params };
                    break;
                }
            }
            if (!found)
                return reject(new Error('no route ' + path));
            const out = {};
            const ctx = {
                req: { headers: { authorization: (headers === null || headers === void 0 ? void 0 : headers.authorization) || '' } },
                res: {}, method, path: pathname, params: found.params,
                query: new URLSearchParams(query || ''), body: body || {},
                status() { }, json(data) { out.data = data; },
            };
            try {
                Promise.resolve(found.handler(ctx)).then(() => resolve(out.data)).catch(reject);
            }
            catch (err) {
                reject(err);
            }
        });
    }
}
exports.InProcessTransport = InProcessTransport;
class ApiClient {
    constructor(transport) {
        this.transport = transport;
        this.token = null;
        this.playerId = null;
        this.bootstrap = null;
        this.connected = false;
    }
    headers() {
        return this.token ? { authorization: `Bearer ${this.token}` } : {};
    }
    async connect(profile) {
        var _a, _b;
        this.bootstrap = await this.request('/v1/config/bootstrap', 'GET');
        if (!this.bootstrap || this.bootstrap.ok === false)
            throw new Error(((_a = this.bootstrap) === null || _a === void 0 ? void 0 : _a.message) || 'bootstrap failed');
        if (this.bootstrap.profile !== profile || ((_b = this.bootstrap.release) === null || _b === void 0 ? void 0 : _b.profile) !== profile) {
            throw new Error(`server profile mismatch: expected ${profile}`);
        }
        if (profile === 'wechat-release') {
            const unsafe = config_1.RELEASE_LOCKED_FLAGS.filter((key) => { var _a; return ((_a = this.bootstrap.release) === null || _a === void 0 ? void 0 : _a[key]) === true; });
            if (unsafe.length)
                throw new Error(`release server enables locked capabilities: ${unsafe.join(',')}`);
        }
        this.connected = true;
    }
    async login(code) {
        const res = await this.request('/v1/auth/wechat', 'POST', { code });
        if (!res.ok)
            throw new Error(res.message || 'login failed');
        this.token = res.token;
        this.playerId = res.playerId;
        return { playerId: res.playerId, isNew: res.isNew, antiAddiction: res.antiAddiction };
    }
    get(path) { return this.request(path, 'GET', undefined, this.headers()); }
    post(path, body) { return this.request(path, 'POST', body, this.headers()); }
    async request(path, method, body, headers) {
        try {
            return await this.transport.request(path, method, body, headers);
        }
        catch (err) {
            const apiErr = { ok: false, code: 'SERVER_ERROR', message: `网络异常：${(err === null || err === void 0 ? void 0 : err.message) || err}` };
            return apiErr;
        }
    }
    /** 玩法动作便捷封装 */
    async action(featureId, actionId, payload, sessionId, clientSeq) {
        return this.post('/v1/game/action', { featureId, actionId, payload, sessionId, clientSeq });
    }
    async gameState(featureId) {
        return this.get(`/v1/game/state?featureId=${encodeURIComponent(featureId)}`);
    }
}
exports.ApiClient = ApiClient;
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
