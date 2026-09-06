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
    createImage() {
        const img = this.wx.createImage();
        return img;
    }
    readTextFile(path) {
        var _a, _b;
        try {
            const fsm = (_b = (_a = this.wx).getFileSystemManager) === null || _b === void 0 ? void 0 : _b.call(_a);
            return fsm ? fsm.readFileSync(path, 'utf8') : null;
        }
        catch {
            return null;
        }
    }
    async getPrivacySetting() {
        return new Promise((resolve) => {
            if (!this.wx.getPrivacySetting)
                return resolve({ needAuthorization: false, privacyContractName: '', supported: false });
            this.wx.getPrivacySetting({
                success: (r) => resolve({ needAuthorization: !!r.needAuthorization, privacyContractName: r.privacyContractName || '《隐私保护指引》', supported: true }),
                fail: () => resolve({ needAuthorization: false, privacyContractName: '', supported: false }),
            });
        });
    }
    requirePrivacyAuthorize() {
        return new Promise((resolve) => {
            if (!this.wx.requirePrivacyAuthorize)
                return resolve(true); // 平台不支持=无强制要求
            this.wx.requirePrivacyAuthorize({ success: () => resolve(true), fail: () => resolve(false) });
        });
    }
    exitMiniProgram() {
        var _a, _b;
        try {
            (_b = (_a = this.wx).exitMiniProgram) === null || _b === void 0 ? void 0 : _b.call(_a);
        }
        catch { /* 忽略 */ }
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
                return resolve(null);
            this.wx.login({ success: (r) => resolve(r.code || null), fail: () => resolve(null) });
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
        this.drawImageCalls = 0;
        this.taps = [];
        this.frameCbs = [];
        this.store = {};
        this.images = [];
        this.privacyNeedAuth = false;
        this.privacyAgreed = null;
        this.exited = false;
        this.__tapStartCb = null;
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
                    return (...args) => { self.drawCalls++; if (prop === 'drawImage')
                        self.drawImageCalls++; return undefined; };
                },
                set() { return true; },
            }),
            __calls: calls,
        };
    }
    getWindowSize() { return { w: 375, h: 667, dpr: 1 }; }
    createImage() {
        const img = { src: '', width: 64, height: 64, onload: null, onerror: null };
        this.images.push(img);
        // 模拟异步解码成功
        Promise.resolve().then(() => { var _a; return (_a = img.onload) === null || _a === void 0 ? void 0 : _a.call(img); });
        return img;
    }
    readTextFile(path) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const fs = require('node:fs');
            if (fs.existsSync(path))
                return fs.readFileSync(path, 'utf8');
            // 测试镜像：包内 assets/game/ 路径映射到仓库 game-assets/（manifest 由构建生成并入库）
            if (path.startsWith('assets/game/')) {
                const rel = path.slice('assets/game/'.length);
                const mirrored = `${process.cwd()}/game-assets/${rel}`;
                if (fs.existsSync(mirrored))
                    return fs.readFileSync(mirrored, 'utf8');
            }
            return null;
        }
        catch {
            return null;
        }
    }
    async getPrivacySetting() {
        return { needAuthorization: this.privacyNeedAuth, privacyContractName: '《猿岛隐私保护指引》(mock)', supported: true };
    }
    async requirePrivacyAuthorize() {
        this.privacyAgreed = true;
        return true;
    }
    exitMiniProgram() { this.exited = true; }
    onFrame(cb) { this.frameCbs.push(cb); }
    pumpFrames(n = 1) { for (let i = 0; i < n; i++)
        this.frameCbs.forEach((f) => f()); }
    tap(x, y) {
        var _a, _b;
        this.taps.push([x, y]);
        (_a = this.__tapStartCb) === null || _a === void 0 ? void 0 : _a.call(this, x, y);
        (_b = this.__tapCb) === null || _b === void 0 ? void 0 : _b.call(this, x, y);
    }
    onTouchStart(cb) { this.__tapStartCb = cb; }
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
