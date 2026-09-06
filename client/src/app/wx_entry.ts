/**
 * 微信小游戏入口 —— game.js 调用 start({profile, serverUrl})。
 * 使用 WxPlatform（真机/开发者工具）连接 HttpTransport；进程内 GameApp 仅由 Node standalone 验收显式启用。
 */
import { WxPlatform } from '../platform/platform';
import { MiniGameClientApp } from './main';

export function start(opts: { profile: 'full-clone' | 'wechat-release'; serverUrl?: string; cloudEnv?: string; cloudService?: string; cloudResourceAppid?: string; standalone?: boolean }): void {
  let platform: WxPlatform | null = null;
  let app: any = null;
  try {
    // 环境共享模式（有 resourceAppid）由 WxPlatform 负责 init，此处跳过默认 wx.cloud.init
    if (!opts.cloudResourceAppid) initCloud(opts.cloudEnv);
    // CloudBase Run 服务名（X-WX-SERVICE 头）：小游戏必须走 wx.cloud.callContainer
    platform = new WxPlatform({ cloudEnv: opts.cloudEnv, cloudService: opts.cloudService, cloudResourceAppid: opts.cloudResourceAppid });
    app = new MiniGameClientApp(platform, opts);
    app.boot().catch((e: unknown) => fail(platform!, app, e));
  } catch (e) {
    fail(platform, app, e);
  }
}

/** 启动失败：优先画在主画布（app.renderFatal），并输出到控制台；应用未建成时才退回离屏兜底 */
function fail(platform: WxPlatform | null, app: any, e: unknown): void {
  const msg = String((e as any)?.message || e);
  console.error('[ape] fatal', e);
  let drawn = false;
  try { app?.renderFatal?.(msg); drawn = !!app?.ui; } catch { /* 忽略 */ }
  if (!drawn && platform) renderFailure(platform, e);
}

/**
 * 云开发初始化（仅在微信运行时生效）：env 由构建期 APP_CLOUD_ENV 注入，仅含环境标识、不含密钥。
 * Node 验收/mock 环境无 wx.cloud → 直接跳过，客户端继续走包内 boot pack + 远端 CDN 资源。
 */
function initCloud(env?: string): void {
  try {
    const g: any = globalThis as any;
    if (!env || !g.wx || !g.wx.cloud) return;
    g.wx.cloud.init({ env });
  } catch { /* 云开发不可用时不影响启动 */ }
}

function renderFailure(platform: WxPlatform, e: unknown): void {
    // 启动失败兜底画面
    try {
      const ctx = platform.createCanvas().getContext('2d');
      ctx.fillStyle = '#0f1220';
      ctx.fillRect(0, 0, 375, 667);
      ctx.fillStyle = '#f87171';
      ctx.font = '14px sans-serif';
      const err: any = e;
      ctx.fillText('启动失败: ' + String(err?.message || e).slice(0, 40), 20, 100);
    } catch { /* ignore */ }
}
