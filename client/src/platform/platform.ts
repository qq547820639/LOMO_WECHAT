/**
 * 平台适配层（Section 41）—— wx.* 不散落玩法代码，全部经此抽象。
 * WxPlatform: 微信小游戏真机/开发者工具。
 * NodePlatform: 单测/进程内 mock（无 wx）。
 */
declare const GameGlobal: any;

declare global { interface Window { wx?: any } }

export interface ImageLike {
  src: string;
  width: number;
  height: number;
  onload: (() => void) | null;
  onerror: ((e?: unknown) => void) | null;
  destroy?(): void;
}

/** 隐私授权设置（微信官方 getPrivacySetting 口径） */
export interface PrivacySetting {
  needAuthorization: boolean;
  privacyContractName: string;
  supported: boolean;
}

export interface RewardedAdCloseResult { isEnded: boolean; receipt?: string }
export interface RewardedAdLike {
  load(): Promise<void>;
  show(): Promise<RewardedAdCloseResult>;
  destroy(): void;
}

export interface PlatformAdapter {
  readonly kind: 'wx' | 'node';
  createCanvas(): any;
  /** 图像加载（P0-1 图像层）：src 为包内相对路径或 CDN URL */
  createImage(): ImageLike;
  /** 读包内文本文件（如 assets/game/manifest.json）；不可用返回 null */
  readTextFile(path: string): string | null;
  /** 隐私授权：官方 getPrivacySetting；平台不支持时 supported=false */
  getPrivacySetting(): Promise<PrivacySetting>;
  /** 隐私授权弹窗（官方 requirePrivacyAuthorize）；resolve=同意 */
  requirePrivacyAuthorize(): Promise<boolean>;
  exitMiniProgram(): void;
  getWindowSize(): { w: number; h: number; dpr: number; topInset?: number; bottomInset?: number };
  onFrame(cb: () => void): void;
  onTouchStart(cb: (x: number, y: number) => void): void;
  onTouchEnd(cb: (x: number, y: number) => void): void;
  onTouchMove(cb: (x: number, y: number) => void): void;
  storageGet(key: string): any;
  storageSet(key: string, v: any): void;
  loginCode(): Promise<string | null>;
  createRewardedAd(adUnitId: string): RewardedAdLike;
  httpRequest(opts: { url: string; method: string; data?: any; header?: Record<string, string>; timeout?: number }): Promise<{ statusCode: number; data: any }>;
  /**
   * 云开发调用（仅云托管/云函数需要）：小游戏必须走 wx.cloud.callContainer，否则 wx.request 会被网关 401
   *  - cloudEnv：云开发环境 ID（与 wx.cloud.init 的 env 一致）
   *  - cloudService：CloudBase Run 服务名（X-WX-SERVICE 头）
   *  基础库 ≥ 2.13.1
   */
  callContainer(opts: { path: string; method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; data?: any; header?: Record<string, string>; timeout?: number }): Promise<{ statusCode: number; data: any }>;
  /**
   * 云函数调用：服务端以云函数形态承载时（微信侧云开发环境无法用云托管容器），
   * 客户端通过 wx.cloud.callFunction 走微信私有链路 —— 无需配置服务器域名。
   */
  callFunction(name: string, args: Record<string, any>): Promise<any>;
  showShareMenu?(): void;
  share(opts: { title: string; query?: string }): void;
  vibrate(short: boolean): void;
  audio(src: string, loop: boolean, volume: number): { play(): void; stop(): void; destroy(): void; setVolume(v: number): void };
  systemInfo(): Record<string, any>;
  onHide(cb: () => void): void;
  onShow(cb: () => void): void;
  getLaunchQuery(): Record<string, any>;
  exitToForegroundNow(): boolean;
}

export class WxPlatform implements PlatformAdapter {
  readonly kind = 'wx' as const;
  private wx: any;
  private cloudEnv: string | null;
  private cloudService: string | null;
  /** 环境共享模式：资源方 AppID（env 归属另一个小程序时使用）；为空=本小程序已关联的 env（直连） */
  private cloudResourceAppid: string | null;
  private cloudInstance: any = null;
  private cloudInitPromise: Promise<any> | null = null;
  constructor(opts?: { cloudEnv?: string; cloudService?: string; cloudResourceAppid?: string }) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    this.wx = (globalThis as any).wx || (typeof GameGlobal !== 'undefined' ? (GameGlobal as any).wx : null);
    if (!this.wx) throw new Error('wx not available');
    this.cloudEnv = opts?.cloudEnv ?? null;
    this.cloudService = opts?.cloudService ?? null;
    this.cloudResourceAppid = opts?.cloudResourceAppid ?? null;
  }

  /**
   * 云实例获取（幂等）：
   *  - 无 resourceAppid：wx.cloud.init({env}) 后直接用 wx.cloud（环境已与该 AppID 关联，含「环境转换」后的腾讯云环境）
   *  - 有 resourceAppid：new wx.cloud.Cloud({resourceAppid, resourceEnv}) → init()（环境共享/跨主体资源方模式）
   * 任一路径失败都退回 wx.cloud，由 callContainer 报错暴露，不静默。
   */
  private ensureCloud(): Promise<any> {
    if (this.cloudInstance) return Promise.resolve(this.cloudInstance);
    const wx = this.wx;
    if (!wx?.cloud) return Promise.resolve(null);
    if (!this.cloudInitPromise) {
      this.cloudInitPromise = (async () => {
        try {
          if (this.cloudResourceAppid && wx.cloud.Cloud) {
            const c = new wx.cloud.Cloud({ resourceAppid: this.cloudResourceAppid, resourceEnv: this.cloudEnv ?? undefined });
            await c.init();
            this.cloudInstance = c;
          } else {
            wx.cloud.init?.({ env: this.cloudEnv ?? undefined });
            this.cloudInstance = wx.cloud;
          }
        } catch (e) {
          console.error('[ape] cloud init failed (85088 多为环境未与 AppID 关联)', e);
          this.cloudInstance = wx.cloud ?? null;
        }
        return this.cloudInstance;
      })();
    }
    return this.cloudInitPromise;
  }
  createCanvas(): any {
    const c = this.wx.createCanvas();
    return c;
  }
  createImage(): ImageLike {
    const img = this.wx.createImage();
    return img as ImageLike;
  }
  readTextFile(path: string): string | null {
    try {
      const fsm = this.wx.getFileSystemManager?.();
      return fsm ? fsm.readFileSync(path, 'utf8') : null;
    } catch {
      return null;
    }
  }
  async getPrivacySetting(): Promise<PrivacySetting> {
    return new Promise((resolve, reject) => {
      if (!this.wx.getPrivacySetting) return resolve({ needAuthorization: false, privacyContractName: '', supported: false });
      this.wx.getPrivacySetting({
        success: (r: any) => resolve({ needAuthorization: !!r.needAuthorization, privacyContractName: r.privacyContractName || '《隐私保护指引》', supported: true }),
        fail: () => reject(new Error('隐私设置获取失败')),
      });
    });
  }
  requirePrivacyAuthorize(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.wx.requirePrivacyAuthorize) return resolve(true); // 平台不支持=无强制要求
      this.wx.requirePrivacyAuthorize({ success: () => resolve(true), fail: () => resolve(false) });
    });
  }
  exitMiniProgram(): void {
    try { this.wx.exitMiniProgram?.(); } catch { /* 忽略 */ }
  }
  getWindowSize(): { w: number; h: number; dpr: number; topInset?: number; bottomInset?: number } {
    try {
      const windowInfo = this.wx.getWindowInfo?.() ?? this.wx.getSystemInfoSync();
      let menuBottom = 0;
      try { menuBottom = this.wx.getMenuButtonBoundingClientRect?.()?.bottom ?? 0; } catch {}
      const safeTop = Math.max(windowInfo.safeArea?.top ?? 0, windowInfo.statusBarHeight ?? 0);
      const topInset = Number.isFinite(menuBottom) && menuBottom > safeTop ? menuBottom + 8 : safeTop + 40;
      return {
        w: windowInfo.windowWidth,
        h: windowInfo.windowHeight,
        dpr: windowInfo.pixelRatio || 2,
        topInset,
        bottomInset: Math.max(0, windowInfo.windowHeight - (windowInfo.safeArea?.bottom ?? windowInfo.windowHeight)),
      };
    } catch { return { w: 375, h: 667, dpr: 2 }; }
  }
  onFrame(cb: () => void): void {
    const runtime = globalThis as any;
    const gameRuntime = typeof GameGlobal !== 'undefined' ? GameGlobal : null;
    const owner = [runtime, gameRuntime, this.wx].find((candidate) => typeof candidate?.requestAnimationFrame === 'function');
    let raf: ((callback: () => void) => void) | null = owner ? owner.requestAnimationFrame.bind(owner) : null;
    const schedule = (): void => {
      if (raf) {
        try { raf(tick); return; }
        catch (error) { raf = null; console.warn('[ape] requestAnimationFrame unavailable, using timer', error); }
      }
      setTimeout(tick, 16);
    };
    const tick = (): void => {
      try { cb(); } catch (error) { console.error('[ape] frame error', error); }
      schedule();
    };
    schedule();
  }
  onTouchStart(cb: (x: number, y: number) => void): void { this.wx.onTouchStart((e: any) => { const t = e.touches?.[0]; if (t) cb(t.clientX, t.clientY); }); }
  onTouchEnd(cb: (x: number, y: number) => void): void { this.wx.onTouchEnd((e: any) => { const t = e.changedTouches?.[0]; if (t) cb(t.clientX, t.clientY); }); }
  onTouchMove(cb: (x: number, y: number) => void): void { this.wx.onTouchMove((e: any) => { const t = e.touches?.[0]; if (t) cb(t.clientX, t.clientY); }); }
  storageGet(key: string): any { try { return this.wx.getStorageSync(key); } catch { return null; } }
  storageSet(key: string, v: any): void { try { this.wx.setStorageSync(key, v); } catch { /* 忽略 */ } }
  loginCode(): Promise<string | null> {
    return new Promise((resolve) => {
      if (!this.wx.login) return resolve(null);
      this.wx.login({ success: (r: any) => resolve(r.code || null), fail: () => resolve(null) });
    });
  }
  createRewardedAd(adUnitId: string): RewardedAdLike {
    const ad = this.wx.createRewardedVideoAd?.({ adUnitId });
    if (!ad) return { load: async () => undefined, show: async () => ({ isEnded: false }), destroy: () => undefined };
    return {
      load: async () => { await Promise.resolve(ad.load?.()); },
      show: () => new Promise((resolve) => {
        let settled = false;
        const finish = (result: any) => {
          if (settled) return;
          settled = true;
          if (typeof ad.offClose === 'function') ad.offClose(finish);
          const isEnded = !!result?.isEnded;
          const receipt = typeof result?.receipt === 'string' && result.receipt.trim()
            ? result.receipt.trim()
            : typeof result?.transactionId === 'string' && result.transactionId.trim()
              ? result.transactionId.trim()
              : isEnded ? `wx-rewarded-complete-${Date.now()}-${Math.random().toString(36).slice(2, 10)}` : undefined;
          resolve({ isEnded, ...(receipt ? { receipt } : {}) });
        };
        if (typeof ad.onClose === 'function') ad.onClose(finish);
        Promise.resolve(ad.show?.()).then((result: any) => { if (typeof ad.onClose !== 'function') finish(result); }).catch(() => finish({ isEnded: false }));
      }),
      destroy: () => { try { ad.destroy?.(); } catch { /* 忽略 */ } },
    };
  }
  httpRequest(opts: { url: string; method: string; data?: any; header?: Record<string, string>; timeout?: number }): Promise<{ statusCode: number; data: any }> {
    return new Promise((resolve, reject) => {
      this.wx.request({
        url: opts.url, method: opts.method, data: opts.data, header: opts.header, timeout: opts.timeout ?? 10000,
        success: (r: any) => resolve({ statusCode: r.statusCode, data: r.data }),
        fail: (e: any) => reject(new Error(e?.errMsg || 'request fail')),
      });
    });
  }
  share(opts: { title: string; query?: string }): void {
    try { this.wx.shareAppMessage?.({ title: opts.title, query: opts.query }); } catch { /* 忽略 */ }
  }
  async callContainer(opts: { path: string; method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; data?: any; header?: Record<string, string>; timeout?: number }): Promise<{ statusCode: number; data: any }> {
    // 有 cloudEnv+cloudService → 走 wx.cloud.callContainer（小程序/小游戏调用 CloudBase Run 的标准方式）
    if (this.cloudEnv && this.cloudService) {
      const cloud = await this.ensureCloud();
      if (cloud?.callContainer) {
        return new Promise((resolve, reject) => {
          cloud.callContainer({
            config: { env: this.cloudEnv },
            path: opts.path,
            method: opts.method ?? 'GET',
            data: opts.data,
            header: { 'X-WX-SERVICE': this.cloudService, ...(opts.header ?? {}) },
            timeout: opts.timeout ?? 10000,
            success: (r: any) => resolve({ statusCode: r.statusCode, data: r.data }),
            fail: (e: any) => reject(new Error(e?.errMsg || e?.message || 'callContainer fail')),
          });
        });
      }
      console.error('[ape] wx.cloud.callContainer unavailable — 环境未与 AppID 关联（85088）时会出现');
    }
    // 兜底：无 cloud 配置时退回 wx.request（仅限非 CloudBase 的服务端 URL）
    return this.httpRequest({ url: opts.path, method: opts.method ?? 'GET', data: opts.data, header: opts.header, timeout: opts.timeout });
  }
  callFunction(name: string, args: Record<string, any>): Promise<any> {
    if (!this.wx?.cloud?.callFunction) return Promise.reject(new Error('wx.cloud.callFunction unavailable'));
    return new Promise((resolve, reject) => {
      this.wx.cloud.callFunction({
        name,
        data: args,
        success: (r: any) => resolve(r?.result),
        fail: (e: any) => reject(new Error(e?.errMsg || 'callFunction fail')),
      });
    });
  }
  vibrate(short: boolean): void { try { short ? this.wx.vibrateShort?.() : this.wx.vibrateLong?.(); } catch { /* 忽略 */ } }
  audio(src: string, loop: boolean, volume: number) {
    try {
      const a = this.wx.createInnerAudioContext();
      a.src = src; a.loop = loop; a.volume = volume;
      return { play: () => a.play(), stop: () => a.stop(), destroy: () => a.destroy(), setVolume: (v: number) => { a.volume = v; } };
    } catch {
      return { play() {}, stop() {}, destroy() {}, setVolume() {} };
    }
  }
  systemInfo(): Record<string, any> { try { return this.wx.getSystemInfoSync() || {}; } catch { return {}; } }
  onHide(cb: () => void): void { this.wx.onHide(cb); }
  onShow(cb: () => void): void { this.wx.onShow(cb); }
  getLaunchQuery(): Record<string, any> {
    try {
      const opts = this.wx.getLaunchOptionsSync?.() || {};
      return this.parseQuery(opts.query || opts.referrerInfo || {});
    } catch { return {}; }
  }
  exitToForegroundNow(): boolean { return false; }
  private parseQuery(q: any): Record<string, any> {
    const out: Record<string, any> = {};
    if (typeof q === 'string') { for (const kv of q.split('&')) { const [k, v] = kv.split('='); if (k) out[k] = decodeURIComponent(v || ''); } }
    else if (q && typeof q === 'object') out['invite'] = q.invite;
    return out;
  }
}

export class NodePlatform implements PlatformAdapter {
  readonly kind = 'node' as const;
  drawCalls = 0;
  drawImageCalls = 0;
  taps: Array<[number, number]> = [];
  frameCbs: Array<() => void> = [];
  private store: Record<string, any> = {};
  createCanvas(): any {
    const self = this;
    const calls = { count: 0 };
    return {
      width: 375, height: 667,
      getContext: () => new Proxy({ measureText: (t: string) => ({ width: t.length * 7 }) }, {
        get(target: any, prop: string) {
          if (prop in target) return target[prop];
          return (...args: any[]) => { self.drawCalls++; if (prop === 'drawImage') self.drawImageCalls++; return undefined; };
        },
        set() { return true; },
      }),
      __calls: calls,
    };
  }
  getWindowSize(): { w: number; h: number; dpr: number } { return { w: 375, h: 667, dpr: 1 }; }
  images: any[] = [];
  createImage(): ImageLike {
    const img: ImageLike = { src: '', width: 64, height: 64, onload: null, onerror: null };
    this.images.push(img);
    // 模拟异步解码成功
    Promise.resolve().then(() => img.onload?.());
    return img;
  }
  readTextFile(path: string): string | null {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fs = require('node:fs');
      if (fs.existsSync(path)) return fs.readFileSync(path, 'utf8');
      // 测试镜像：包内 assets/game/ 路径映射到仓库 game-assets/（manifest 由构建生成并入库）
      if (path.startsWith('assets/game/')) {
        const rel = path.slice('assets/game/'.length);
        const mirrored = `${process.cwd()}/game-assets/${rel}`;
        if (fs.existsSync(mirrored)) return fs.readFileSync(mirrored, 'utf8');
      }
      return null;
    } catch {
      return null;
    }
  }
  privacyNeedAuth = false;
  privacyAgreed: boolean | null = null;
  async getPrivacySetting(): Promise<PrivacySetting> {
    return { needAuthorization: this.privacyNeedAuth, privacyContractName: '《猿岛隐私保护指引》(mock)', supported: true };
  }
  async requirePrivacyAuthorize(): Promise<boolean> {
    this.privacyAgreed = true;
    return true;
  }
  exitMiniProgram(): void { this.exited = true; }
  exited = false;
  onFrame(cb: () => void): void { this.frameCbs.push(cb); }
  pumpFrames(n = 1): void { for (let i = 0; i < n; i++) this.frameCbs.forEach((f) => f()); }
  tap(x: number, y: number): void {
    this.taps.push([x, y]);
    this.__tapStartCb?.(x, y);
    this.__tapCb?.(x, y);
  }
  onTouchStart(cb: (x: number, y: number) => void): void { this.__tapStartCb = cb; }
  onTouchEnd(cb: (x: number, y: number) => void): void { this.__tapCb = cb; }
  __tapStartCb: ((x: number, y: number) => void) | null = null;
  __tapCb: ((x: number, y: number) => void) | null = null;
  onTouchMove(cb: (x: number, y: number) => void): void { /* 测试可选 */ }
  storageGet(key: string): any { return this.store[key] ?? null; }
  storageSet(key: string, v: any): void { this.store[key] = v; }
  async loginCode(): Promise<string | null> { return 'test-code'; }
  rewardedAdsShown: string[] = [];
  private rewardedAdQueue: RewardedAdCloseResult[] = [];
  enqueueRewardedAdResult(result: RewardedAdCloseResult): void { this.rewardedAdQueue.push(result); }
  createRewardedAd(adUnitId: string): RewardedAdLike {
    return {
      load: async () => undefined,
      show: async () => { this.rewardedAdsShown.push(adUnitId); return this.rewardedAdQueue.shift() || { isEnded: true, receipt: 'node-mock-complete' }; },
      destroy: () => undefined,
    };
  }
  async httpRequest(opts: any): Promise<{ statusCode: number; data: any }> { throw new Error('NodePlatform 无网络'); }
  share(): void {}
  vibrate(): void {}
  callContainer(): Promise<any> { throw new Error('NodePlatform.callContainer: tests 应使用 InProcessTransport 或直接 HttpTransport.callContainer 兜底'); }
  callFunction(): Promise<any> { throw new Error('NodePlatform.callFunction: tests 应使用 InProcessTransport（云函数形态仅在微信运行时可用）'); }
  audio() { return { play() {}, stop() {}, destroy() {}, setVolume() {} }; }
  systemInfo(): Record<string, any> { return { platform: 'node-test' }; }
  onHide(): void {}
  onShow(): void {}
  getLaunchQuery(): Record<string, any> { return this.launchQuery; }
  launchQuery: Record<string, any> = {};
  exitToForegroundNow(): boolean { return false; }
}
