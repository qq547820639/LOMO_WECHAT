/**
 * 网络层（Section 43）—— Transport 抽象 + 重试/超时/鉴权/错误码映射。
 *  - HttpTransport: wx.request → 正式参考服务端。
 *  - InProcessTransport: 直接调用 GameApp 路由（standalone 构建 / 测试），零网络。
 */
import { PlatformAdapter } from '../platform/platform';
import { ApiError } from '../../../shared/src/protocol';

export interface Transport {
  request(path: string, method: 'GET' | 'POST', body?: any, headers?: Record<string, string>): Promise<any>;
}

export class HttpTransport implements Transport {
  constructor(private platform: PlatformAdapter, private baseUrl: string, private timeout = 10000) {}
  async request(path: string, method: 'GET' | 'POST', body?: any, headers?: Record<string, string>): Promise<any> {
    let lastErr: any = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await this.platform.httpRequest({
          url: this.baseUrl + path, method, data: body, header: { 'content-type': 'application/json', ...(headers || {}) }, timeout: this.timeout,
        });
        if (res.statusCode >= 500 && attempt < 2) { await sleep(300 * (attempt + 1)); continue; }
        return res.data;
      } catch (err) {
        lastErr = err;
        await sleep(300 * (attempt + 1));
      }
    }
    throw lastErr ?? new Error('network fail');
  }
}

/** 进程内 Transport：require 编译产物 server/src/app.js（standalone/测试用；wx 真机打包也包含它） */
export class InProcessTransport implements Transport {
  private app: any;
  private routes: any[];
  constructor(profile: 'full-clone' | 'wechat-release') {
    // 延迟 require：仅在 standalone 模式加载（app.ts 不依赖 node:http/fs 顶层）
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { GameApp } = require('../../../server/src/app');
    this.app = new GameApp({ profile });
    this.routes = this.app.routes();
  }
  get appInstance(): any { return this.app; }
  request(path: string, method: 'GET' | 'POST', body?: any, headers?: Record<string, string>): Promise<any> {
    return new Promise((resolve, reject) => {
      const [pathname, query] = path.split('?');
      let found: any = null;
      const pp = pathname!.split('/').filter(Boolean);
      for (const r of this.routes) {
        if (r.method !== method) continue;
        const cp = r.pattern.split('/').filter(Boolean);
        if (cp.length !== pp.length) continue;
        const params: Record<string, string> = {};
        let ok = true;
        for (let i = 0; i < cp.length; i++) {
          if (cp[i].startsWith(':')) params[cp[i].slice(1)] = decodeURIComponent(pp[i]);
          else if (cp[i] !== pp[i]) { ok = false; break; }
        }
        if (ok) { found = { handler: r.handler, params }; break; }
      }
      if (!found) return reject(new Error('no route ' + path));
      const out: any = {};
      const ctx = {
        req: { headers: { authorization: headers?.authorization || '' } },
        res: {}, method, path: pathname, params: found.params,
        query: new URLSearchParams(query || ''), body: body || {},
        status() {}, json(data: any) { out.data = data; },
      };
      try {
        Promise.resolve(found.handler(ctx)).then(() => resolve(out.data)).catch(reject);
      } catch (err) { reject(err); }
    });
  }
}

export type ApiHandler = (path: string, method: 'GET' | 'POST', body?: any) => Promise<any>;

export class ApiClient {
  token: string | null = null;
  playerId: string | null = null;
  bootstrap: any = null;
  connected = false;
  constructor(private transport: Transport) {}

  private headers(): Record<string, string> {
    return this.token ? { authorization: `Bearer ${this.token}` } : {};
  }

  async connect(profile: 'full-clone' | 'wechat-release'): Promise<void> {
    this.bootstrap = await this.request('/v1/config/bootstrap', 'GET') as any;
    this.connected = true;
  }

  async login(code: string): Promise<{ playerId: string; isNew: boolean; antiAddiction: any }> {
    const res = await this.request('/v1/auth/wechat', 'POST', { code }) as any;
    if (!res.ok) throw new Error(res.message || 'login failed');
    this.token = res.token;
    this.playerId = res.playerId;
    return { playerId: res.playerId, isNew: res.isNew, antiAddiction: res.antiAddiction };
  }

  get(path: string): Promise<any> { return this.request(path, 'GET', undefined, this.headers()); }
  post(path: string, body?: any): Promise<any> { return this.request(path, 'POST', body, this.headers()); }

  private async request(path: string, method: 'GET' | 'POST', body?: any, headers?: Record<string, string>): Promise<any> {
    try {
      return await this.transport.request(path, method, body, headers);
    } catch (err: any) {
      const apiErr: ApiError = { ok: false, code: 'SERVER_ERROR', message: `网络异常：${err?.message || err}` };
      return apiErr;
    }
  }

  /** 玩法动作便捷封装 */
  async action(featureId: string, actionId: string, payload?: Record<string, unknown>, sessionId?: string, clientSeq?: number): Promise<any> {
    return this.post('/v1/game/action', { featureId, actionId, payload, sessionId, clientSeq });
  }

  async gameState(featureId: string): Promise<any> {
    return this.get(`/v1/game/state?featureId=${encodeURIComponent(featureId)}`);
  }
}

function sleep(ms: number): Promise<void> { return new Promise((r) => setTimeout(r, ms)); }
