/**
 * HTTP 入口（node 独占；进程内模式请直接用 app.ts 的 GameApp / createInProcess）。
 * 启动: APP_PROFILE=wechat-release node dist/server/src/index.js
 */
import * as path from 'node:path';
import { rootPath } from '../../shared/src/paths';
import { makeServer } from './http';
import { GameApp, AppOptions } from './app';
import { CloudBaseDocumentDatabase } from './persistence/cloudbase';
import { PersistentRepository } from './persistence/repository';
import { PersistentApi } from './persistence/api';
export type { AppOptions } from './app';

export function validateRuntimeConfig(env: Record<string, string | undefined> = process.env): void {
  if (env.APP_PROFILE !== 'wechat-release' && env.NODE_ENV !== 'production') return;
  const invalid: string[] = [];
  if (!env.APP_SECRET || env.APP_SECRET.trim().length < 32 || env.APP_SECRET.includes('DO-NOT-USE-IN-PROD')) invalid.push('APP_SECRET');
  if (!/^wx[a-f0-9]{16}$/.test(env.APP_WX_APPID || '')) invalid.push('APP_WX_APPID');
  if (!env.APP_WX_APPSECRET || env.APP_WX_APPSECRET.trim().length < 32) invalid.push('APP_WX_APPSECRET');
  if (env.APP_PERSISTENCE !== 'cloudbase') invalid.push('APP_PERSISTENCE=cloudbase');
  if (!env.APP_CLOUD_ENV) invalid.push('APP_CLOUD_ENV');
  if (env.APP_ALLOW_ADMIN === '1' && (!env.APP_ADMIN_TOKEN || env.APP_ADMIN_TOKEN.trim().length < 32)) invalid.push('APP_ADMIN_TOKEN');
  if (invalid.length) throw new Error(`Missing or invalid runtime configuration: ${invalid.join(', ')}. Inject credentials through the Cloud Run environment.`);
}

export function createApp(opts: AppOptions = {}) {
  const app = new GameApp(opts);
  const routes = app.routes();
  const server = makeServer(routes);
  return { app, routes, server };
}

export async function createPersistentApp(repository: PersistentRepository, opts: AppOptions & { appId: string }) {
  await repository.ready();
  const app = new GameApp({ ...opts, persistPath: null, bootPngSeeds: false });
  const routes = new PersistentApi(app, repository, opts.appId).routes();
  const server = makeServer(routes);
  return { app, routes, server, repository };
}

export { GameApp };

if (require.main === module) {
  const start = async (): Promise<void> => {
    validateRuntimeConfig();
    const port = Number(process.env.PORT || 8787);
    const persistent = process.env.APP_PERSISTENCE === 'cloudbase';
    const application = persistent
      ? await createPersistentApp(new PersistentRepository(new CloudBaseDocumentDatabase({ env: process.env.APP_CLOUD_ENV || '', collection: process.env.APP_DB_COLLECTION || 'ape_game_state', region: process.env.APP_CLOUD_REGION || 'ap-shanghai' })), { appId: process.env.APP_WX_APPID || '', profile: 'wechat-release' })
      : createApp({ persistPath: process.env.APP_DATA_DIR ? path.join(process.env.APP_DATA_DIR, 'store.json') : null });
    const { app, server } = application;
    server.listen(port, () => console.log(`[game-server] profile=${app.profile} persistence=${persistent ? 'cloudbase' : 'local-development'} port=${port}`));
    let shuttingDown = false;
    const shutdown = (): void => {
      if (shuttingDown) return;
      shuttingDown = true;
      const timer = setTimeout(() => process.exit(1), 45000);
      timer.unref();
      server.close(() => {
        if (!persistent) app.store.maybePersist(true);
        clearTimeout(timer);
        process.exit(0);
      });
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    if (!persistent) setInterval(() => app.store.maybePersist(), 10000).unref();
  };
  start().catch((error: unknown) => {
    const message = error instanceof Error && error.message.startsWith('Missing or invalid runtime configuration:') ? error.message : 'startup failed; verify runtime credentials, database collection and permissions';
    console.error(`[game-server] ${message}`);
    process.exitCode = 1;
  });
}
