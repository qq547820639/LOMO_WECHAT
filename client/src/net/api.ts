/**
 * 网络层（Section 43）—— Transport 抽象 + 重试/超时/鉴权/错误码映射。
 *  - HttpTransport: wx.request → 正式参考服务端。
 *  - InProcessTransport: 直接调用 GameApp 路由（standalone 构建 / 测试），零网络。
 */
import { PlatformAdapter, RewardedAdCloseResult } from '../platform/platform';
import { ApiError } from '../../../shared/src/protocol';
import { RELEASE_LOCKED_FLAGS, RewardedAdSlot } from '../../../shared/src/config';

export interface Transport {
  request(path: string, method: 'GET' | 'POST', body?: any, headers?: Record<string, string>): Promise<any>;
}

export class HttpTransport implements Transport {
  private baseUrl: string;
  /**
   * 是否走 CloudBase Run（小游戏必须用 wx.cloud.callContainer，否则 wx.request 被网关 401）。
   * 判定：baseUrl 命中云开发域（默认 *.tcloudbase.com / *.tcb.qcloud.la），或 opts.cloudService 显式声明。
   */
  private cloudBacked: boolean;

  constructor(private platform: PlatformAdapter, baseUrl: string, opts?: { cloudService?: string }, private timeout = 10000) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.cloudBacked = !!opts?.cloudService || /(tcloudbase\.com|tcb\.qcloud\.la|run\.tcloudbase\.com)/.test(this.baseUrl);
  }
  async request(path: string, method: 'GET' | 'POST', body?: any, headers?: Record<string, string>): Promise<any> {
    // 路径（去掉 baseUrl 前缀，因为 callContainer 只接受相对路径）
    const relativePath = path.startsWith(this.baseUrl) ? path.slice(this.baseUrl.length) : path;
    let lastErr: any = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = this.cloudBacked
          ? await this.platform.callContainer({ path: relativePath, method, data: body, header: headers, timeout: this.timeout })
          : await this.platform.httpRequest({ url: this.baseUrl + path, method, data: body, header: { 'content-type': 'application/json', ...(headers || {}) }, timeout: this.timeout });
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

/** 进程内 Transport：require 编译产物 server/src/app.js（仅 standalone/测试用，微信真机固定使用 HTTP） */
export class InProcessTransport implements Transport {
  private app: any;
  private routes: any[];
  constructor(profile: 'full-clone' | 'wechat-release') {
    // 延迟 require：仅在 standalone 模式加载（app.ts 不依赖 node:http/fs 顶层）
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { GameApp } = require('../../../server/src/app');
    this.app = new GameApp({ profile, allowSyntheticWechatAuth: true });
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

function isFinalResponse(response: any): boolean {
  if (typeof response?.ok !== 'boolean') return false;
  if (response.ok || response.retryable === false) return true;
  return response.retryable !== true && !['SERVER_ERROR', 'PERSISTENCE_UNAVAILABLE', 'PERSISTENCE_LIMIT', 'PERSISTENCE_CORRUPT'].includes(response.code);
}

export class ApiClient {
  token: string | null = null;
  playerId: string | null = null;
  bootstrap: any = null;
  connected = false;
  private sessionGeneration = 0;
  private actionSequence = 0;
  private actionPrefix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  private pendingActions = new Map<string, { idempotencyKey: string; body: Record<string, unknown> }>();
  private pendingPosts = new Map<string, { idempotencyKey: string; body: Record<string, unknown> }>();
  constructor(private transport: Transport) {}

  private headers(): Record<string, string> {
    return this.token ? { authorization: `Bearer ${this.token}` } : {};
  }

  beginSession(): number { return ++this.sessionGeneration; }

  invalidateSession(): void { this.sessionGeneration++; }

  async connect(profile: 'full-clone' | 'wechat-release', generation = this.sessionGeneration): Promise<void> {
    const bootstrap = await this.request('/v1/config/bootstrap', 'GET') as any;
    if (generation !== this.sessionGeneration) throw new Error('STALE_SESSION');
    if (!bootstrap || bootstrap.ok === false) throw new Error(bootstrap?.message || 'bootstrap failed');
    if (bootstrap.profile !== profile || bootstrap.release?.profile !== profile) {
      throw new Error(`server profile mismatch: expected ${profile}`);
    }
    if (profile === 'wechat-release') {
      const unsafe = RELEASE_LOCKED_FLAGS.filter((key) => bootstrap.release?.[key] === true);
      if (unsafe.length) throw new Error(`release server enables locked capabilities: ${unsafe.join(',')}`);
    }
    this.bootstrap = bootstrap;
    this.connected = true;
  }

  async login(code: string, generation = this.sessionGeneration): Promise<{ playerId: string; isNew: boolean; antiAddiction: any }> {
    const res = await this.request('/v1/auth/wechat', 'POST', { code }) as any;
    if (generation !== this.sessionGeneration) throw new Error('STALE_SESSION');
    if (!res.ok) throw new Error(res.message || 'login failed');
    this.token = res.token;
    this.playerId = res.playerId;
    return { playerId: res.playerId, isNew: res.isNew, antiAddiction: res.antiAddiction };
  }

  get(path: string): Promise<any> { return this.request(path, 'GET', undefined, this.headers()); }
  async post(path: string, body?: any): Promise<any> {
    if (body?.idempotencyKey !== undefined) return this.request(path, 'POST', body, this.headers());
    const fingerprint = JSON.stringify([this.playerId || this.token, path, body ?? {}], (_key, value) => value && typeof value === 'object' && !Array.isArray(value)
      ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, value[key]])) : value);
    const pending = this.pendingPosts.get(fingerprint) ?? {
      idempotencyKey: `request-${this.actionPrefix}-${++this.actionSequence}`,
      body: JSON.parse(JSON.stringify(body ?? {})),
    };
    this.pendingPosts.set(fingerprint, pending);
    const response = await this.request(path, 'POST', { ...pending.body, idempotencyKey: pending.idempotencyKey }, this.headers());
    if (isFinalResponse(response) && this.pendingPosts.get(fingerprint) === pending) this.pendingPosts.delete(fingerprint);
    return response;
  }

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
    const fingerprint = JSON.stringify([this.playerId || this.token, { featureId, actionId, payload: payload ?? {}, sessionId }], (_key, value) => value && typeof value === 'object' && !Array.isArray(value)
      ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, value[key]])) : value);
    const pending = this.pendingActions.get(fingerprint) ?? {
      idempotencyKey: `action-${this.actionPrefix}-${++this.actionSequence}`,
      body: JSON.parse(JSON.stringify({ featureId, actionId, payload, sessionId, clientSeq })),
    };
    this.pendingActions.set(fingerprint, pending);
    const response = await this.post('/v1/game/action', { ...pending.body, idempotencyKey: pending.idempotencyKey });
    if (isFinalResponse(response) && this.pendingActions.get(fingerprint) === pending) this.pendingActions.delete(fingerprint);
    return response;
  }

  async gameState(featureId: string): Promise<any> {
    return this.get(`/v1/game/state?featureId=${encodeURIComponent(featureId)}`);
  }

  async issueRewardedAd(slot: RewardedAdSlot, context?: { sessionId?: string; settlementId?: string }): Promise<any> {
    return this.post('/v1/ads/rewarded/issue', { slot, ...(context || {}) });
  }

  async startRewardedAd(adId: string, claimToken: string): Promise<any> {
    return this.post('/v1/ads/rewarded/start', { adId, claimToken });
  }

  async claimRewardedAd(adId: string, claimToken: string, result: RewardedAdCloseResult | boolean, receipt?: string): Promise<any> {
    const completed = typeof result === 'boolean' ? result : result.isEnded;
    const closeReceipt = typeof result === 'boolean' ? receipt : result.receipt;
    return this.post('/v1/ads/rewarded/claim', { adId, claimToken, completed, ...(closeReceipt === undefined ? {} : { receipt: closeReceipt }) });
  }
}

function sleep(ms: number): Promise<void> { return new Promise((r) => setTimeout(r, ms)); }
