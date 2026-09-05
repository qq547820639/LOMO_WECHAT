"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = start;
/**
 * 微信小游戏入口 —— game.js 调用 start({profile, serverUrl})。
 * 使用 WxPlatform（真机/开发者工具），连接 HttpTransport 或进程内 LomoApp。
 */
const platform_1 = require("../platform/platform");
const main_1 = require("./main");
function start(opts) {
    const platform = new platform_1.WxPlatform();
    const app = new main_1.LomoClientApp(platform, opts);
    app.boot().catch((e) => {
        // 启动失败兜底画面
        try {
            const ctx = platform.createCanvas().getContext('2d');
            ctx.fillStyle = '#0f1220';
            ctx.fillRect(0, 0, 375, 667);
            ctx.fillStyle = '#f87171';
            ctx.font = '14px sans-serif';
            ctx.fillText('启动失败: ' + String((e === null || e === void 0 ? void 0 : e.message) || e).slice(0, 40), 20, 100);
        }
        catch { /* ignore */ }
    });
}
