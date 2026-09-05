"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodePlatform = exports.WxPlatform = void 0;
class WxPlatform {
    constructor() {
        this.kind = 'wx';
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        this.wx = globalThis.wx || (typeof GameGlobal !== 'undefined' ? GameGlobal.wx : null);
        if (!this.wx)
            throw new Error('wx not available');
    }
    createCanvas() {
        const c = this.wx.createCanvas();
        return c;
    }
    getWindowSize() {
        try {
            const s = this.wx.getSystemInfoSync();
            return { w: s.windowWidth, h: s.windowHeight, dpr: s.pixelRatio || 2 };
        }
        catch {
            return { w: 375, h: 667, dpr: 2 };
        }
    }
    onFrame(cb) {
        const wx = this.wx;
        const loop = () => { cb(); wx.requestAnimationFrame(loop); };
        wx.requestAnimationFrame(loop);
    }
    onTouchStart(cb) { this.wx.onTouchStart((e) => { var _a; const t = (_a = e.touches) === null || _a === void 0 ? void 0 : _a[0]; if (t)
        cb(t.clientX, t.clientY); }); }
    onTouchEnd(cb) { this.wx.onTouchEnd((e) => { var _a; const t = (_a = e.changedTouches) === null || _a === void 0 ? void 0 : _a[0]; if (t)
        cb(t.clientX, t.clientY); }); }
    onTouchMove(cb) { this.wx.onTouchMove((e) => { var _a; const t = (_a = e.touches) === null || _a === void 0 ? void 0 : _a[0]; if (t)
        cb(t.clientX, t.clientY); }); }
    storageGet(key) { try {
        return this.wx.getStorageSync(key);
    }
    catch {
        return null;
    } }
    storageSet(key, v) { try {
        this.wx.setStorageSync(key, v);
    }
    catch { /* 忽略 */ } }
    loginCode() {
        return new Promise((resolve) => {
            if (!this.wx.login)
                return resolve('offline-code');
            this.wx.login({ success: (r) => resolve(r.code || 'offline-code'), fail: () => resolve('offline-code') });
        });
    }
    httpRequest(opts) {
        return new Promise((resolve, reject) => {
            var _a;
            this.wx.request({
                url: opts.url, method: opts.method, data: opts.data, header: opts.header, timeout: (_a = opts.timeout) !== null && _a !== void 0 ? _a : 10000,
                success: (r) => resolve({ statusCode: r.statusCode, data: r.data }),
                fail: (e) => reject(new Error((e === null || e === void 0 ? void 0 : e.errMsg) || 'request fail')),
            });
        });
    }
    share(opts) {
        var _a, _b;
        try {
            (_b = (_a = this.wx).shareAppMessage) === null || _b === void 0 ? void 0 : _b.call(_a, { title: opts.title, query: opts.query });
        }
        catch { /* 忽略 */ }
    }
    vibrate(short) { var _a, _b, _c, _d; try {
        short ? (_b = (_a = this.wx).vibrateShort) === null || _b === void 0 ? void 0 : _b.call(_a) : (_d = (_c = this.wx).vibrateLong) === null || _d === void 0 ? void 0 : _d.call(_c);
    }
    catch { /* 忽略 */ } }
    audio(src, loop, volume) {
        try {
            const a = this.wx.createInnerAudioContext();
            a.src = src;
            a.loop = loop;
            a.volume = volume;
            return { play: () => a.play(), stop: () => a.stop(), destroy: () => a.destroy(), setVolume: (v) => { a.volume = v; } };
        }
        catch {
            return { play() { }, stop() { }, destroy() { }, setVolume() { } };
        }
    }
    systemInfo() { try {
        return this.wx.getSystemInfoSync() || {};
    }
    catch {
        return {};
    } }
    onHide(cb) { this.wx.onHide(cb); }
    onShow(cb) { this.wx.onShow(cb); }
    getLaunchQuery() {
        var _a, _b;
        try {
            const opts = ((_b = (_a = this.wx).getLaunchOptionsSync) === null || _b === void 0 ? void 0 : _b.call(_a)) || {};
            return this.parseQuery(opts.query || opts.referrerInfo || {});
        }
        catch {
            return {};
        }
    }
    exitToForegroundNow() { return false; }
    parseQuery(q) {
        const out = {};
        if (typeof q === 'string') {
            for (const kv of q.split('&')) {
                const [k, v] = kv.split('=');
                if (k)
                    out[k] = decodeURIComponent(v || '');
            }
        }
        else if (q && typeof q === 'object')
            out['invite'] = q.invite;
        return out;
    }
}
exports.WxPlatform = WxPlatform;
class NodePlatform {
    constructor() {
        this.kind = 'node';
        this.drawCalls = 0;
        this.taps = [];
        this.frameCbs = [];
        this.store = {};
        this.__tapCb = null;
        this.launchQuery = {};
    }
    createCanvas() {
        const self = this;
        const calls = { count: 0 };
        return {
            width: 375, height: 667,
            getContext: () => new Proxy({ measureText: (t) => ({ width: t.length * 7 }) }, {
                get(target, prop) {
                    if (prop in target)
                        return target[prop];
                    return (...args) => { self.drawCalls++; if (prop === 'fillRect' || prop === 'fillText')
                        return; return undefined; };
                },
                set() { return true; },
            }),
            __calls: calls,
        };
    }
    getWindowSize() { return { w: 375, h: 667, dpr: 1 }; }
    onFrame(cb) { this.frameCbs.push(cb); }
    pumpFrames(n = 1) { for (let i = 0; i < n; i++)
        this.frameCbs.forEach((f) => f()); }
    tap(x, y) { this.taps.push([x, y]); }
    onTouchStart(cb) { }
    onTouchEnd(cb) { this.__tapCb = cb; }
    onTouchMove(cb) { }
    storageGet(key) { var _a; return (_a = this.store[key]) !== null && _a !== void 0 ? _a : null; }
    storageSet(key, v) { this.store[key] = v; }
    async loginCode() { return 'test-code'; }
    async httpRequest(opts) { throw new Error('NodePlatform 无网络'); }
    share() { }
    vibrate() { }
    audio() { return { play() { }, stop() { }, destroy() { }, setVolume() { } }; }
    systemInfo() { return { platform: 'node-test' }; }
    onHide() { }
    onShow() { }
    getLaunchQuery() { return this.launchQuery; }
    exitToForegroundNow() { return false; }
}
exports.NodePlatform = NodePlatform;
