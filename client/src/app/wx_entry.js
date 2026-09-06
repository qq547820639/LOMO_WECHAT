"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = start;
/**
 * 微信小游戏入口 —— game.js 调用 start({profile, serverUrl})。
 * 使用 WxPlatform（真机/开发者工具）连接 HttpTransport；进程内 GameApp 仅由 Node standalone 验收显式启用。
 */
const platform_1 = require("../platform/platform");
const main_1 = require("./main");
function start(opts) {
    let platform = null;
    try {
        platform = new platform_1.WxPlatform();
        const app = new main_1.MiniGameClientApp(platform, opts);
        app.boot().catch((e) => renderFailure(platform, e));
    }
    catch (e) {
        if (platform)
            renderFailure(platform, e);
        else
            throw e;
    }
}
function renderFailure(platform, e) {
    // 启动失败兜底画面
    try {
        const ctx = platform.createCanvas().getContext('2d');
        ctx.fillStyle = '#0f1220';
        ctx.fillRect(0, 0, 375, 667);
        ctx.fillStyle = '#f87171';
        ctx.font = '14px sans-serif';
        const err = e;
        ctx.fillText('启动失败: ' + String((err === null || err === void 0 ? void 0 : err.message) || e).slice(0, 40), 20, 100);
    }
    catch { /* ignore */ }
}
