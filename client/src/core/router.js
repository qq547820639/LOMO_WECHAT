"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Router = exports.Screen = void 0;
class Screen {
    constructor() {
        this.params = {};
        this.loading = false;
        this.error = null;
        this.route = '';
        this.title = '';
    }
    /** 进入屏幕时加载远程状态；实现用 this.app.api */
    onEnter() { }
    onExit() { }
    /** 定时刷新（毫秒）；返回 0 表示不轮询 */
    pollMs() { return 0; }
    async run(action) {
        this.loading = true;
        try {
            await action();
            this.error = null;
        }
        catch (e) {
            this.error = String((e === null || e === void 0 ? void 0 : e.message) || e);
        }
        finally {
            this.loading = false;
        }
    }
}
exports.Screen = Screen;
class Router {
    constructor(app) {
        this.app = app;
        this.stack = [];
        this.currentTab = 'games';
        this.tabs = {};
        this.pollTimer = null;
    }
    registerTab(tab, screen) {
        screen.app = this.app;
        this.tabs[tab] = screen;
    }
    get current() {
        var _a;
        if (this.stack.length)
            return this.stack[this.stack.length - 1];
        const t = (_a = this.tabs[this.currentTab]) !== null && _a !== void 0 ? _a : Object.values(this.tabs)[0];
        if (!t)
            throw new Error('no screens registered');
        return t;
    }
    switchTab(tab) {
        while (this.stack.length)
            this.pop(true);
        this.currentTab = tab;
        this.setupPoll();
    }
    push(screen, params = {}) {
        screen.app = this.app;
        screen.params = params;
        this.stack.push(screen);
        Promise.resolve(screen.onEnter()).catch((e) => { screen.error = String((e === null || e === void 0 ? void 0 : e.message) || e); });
        this.setupPoll();
        this.app.audioManager.playSfx('nav');
    }
    pop(silent = false) {
        const top = this.stack.pop();
        if (top)
            top.onExit();
        if (!silent)
            this.setupPoll();
    }
    setupPoll() {
        var _a;
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
        const cur = this.current;
        const ms = (_a = cur === null || cur === void 0 ? void 0 : cur.pollMs()) !== null && _a !== void 0 ? _a : 0;
        if (ms > 0) {
            this.pollTimer = setInterval(() => {
                Promise.resolve(cur.onEnter()).catch(() => { });
            }, ms);
        }
    }
    dispose() {
        if (this.pollTimer)
            clearInterval(this.pollTimer);
        while (this.stack.length)
            this.pop(true);
    }
}
exports.Router = Router;
