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
  getWindowSize(): { w: number; h: number; dpr: number };
  onFrame(cb: () => void): void;
  onTouchStart(cb: (x: number, y: number) => void): void;
  onTouchEnd(cb: (x: number, y: number) => void): void;
  onTouchMove(cb: (x: number, y: number) => void): void;
  storageGet(key: string): any;
  storageSet(key: string, v: any): void;
  loginCode(): Promise<string | null>;
  httpRequest(opts: { url: string; method: string; data?: any; header?: Record<string, string>; timeout?: number }): Promise<{ statusCode: number; data: any }>;
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
  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    this.wx = (globalThis as any).wx || (typeof GameGlobal !== 'undefined' ? (GameGlobal as any).wx : null);
    if (!this.wx) throw new Error('wx not available');
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
    return new Promise((resolve) => {
      if (!this.wx.getPrivacySetting) return resolve({ needAuthorization: false, privacyContractName: '', supported: false });
      this.wx.getPrivacySetting({
        success: (r: any) => resolve({ needAuthorization: !!r.needAuthorization, privacyContractName: r.privacyContractName || '《隐私保护指引》', supported: true }),
        fail: () => resolve({ needAuthorization: false, privacyContractName: '', supported: false }),
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
  getWindowSize(): { w: number; h: number; dpr: number } {
    try {
      const s = this.wx.getSystemInfoSync();
      return { w: s.windowWidth, h: s.windowHeight, dpr: s.pixelRatio || 2 };
    } catch { return { w: 375, h: 667, dpr: 2 }; }
  }
  onFrame(cb: () => void): void {
    const wx = this.wx;
    const loop = () => { cb(); wx.requestAnimationFrame(loop); };
    wx.requestAnimationFrame(loop);
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
  async httpRequest(opts: any): Promise<{ statusCode: number; data: any }> { throw new Error('NodePlatform 无网络'); }
  share(): void {}
  vibrate(): void {}
  audio() { return { play() {}, stop() {}, destroy() {}, setVolume() {} }; }
  systemInfo(): Record<string, any> { return { platform: 'node-test' }; }
  onHide(): void {}
  onShow(): void {}
  getLaunchQuery(): Record<string, any> { return this.launchQuery; }
  launchQuery: Record<string, any> = {};
  exitToForegroundNow(): boolean { return false; }
}
