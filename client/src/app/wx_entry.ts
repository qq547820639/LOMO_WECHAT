/**
 * 微信小游戏入口 —— game.js 调用 start({profile, serverUrl})。
 * 使用 WxPlatform（真机/开发者工具），连接 HttpTransport 或进程内 GameApp。
 */
import { WxPlatform } from '../platform/platform';
import { MiniGameClientApp } from './main';

export function start(opts: { profile: 'full-clone' | 'wechat-release'; serverUrl?: string }): void {
  const platform = new WxPlatform();
  const app = new MiniGameClientApp(platform, opts);
  app.boot().catch((e) => {
    // 启动失败兜底画面
    try {
      const ctx = platform.createCanvas().getContext('2d');
      ctx.fillStyle = '#0f1220';
      ctx.fillRect(0, 0, 375, 667);
      ctx.fillStyle = '#f87171';
      ctx.font = '14px sans-serif';
      ctx.fillText('启动失败: ' + String(e?.message || e).slice(0, 40), 20, 100);
    } catch { /* ignore */ }
  });
}
