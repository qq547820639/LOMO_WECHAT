/**
 * HTTP 入口（node 独占；进程内模式请直接用 app.ts 的 GameApp / createInProcess）。
 * 启动: APP_PROFILE=wechat-release node dist/server/src/index.js
 */
import * as path from 'node:path';
import { rootPath } from '../../shared/src/paths';
import { makeServer } from './http';
import { GameApp } from './app';

export interface AppOptions {
  profile?: import('../../shared/src/config').BuildProfile;
  secret?: string;
  persistPath?: string | null;
  cards?: import('../../shared/src/registry').CardTemplate[];
  bootPngSeeds?: boolean;
}

export function createApp(opts: AppOptions = {}) {
  const app = new GameApp(opts);
  const routes = app.routes();
  const server = makeServer(routes);
  return { app, routes, server };
}

export { GameApp };

if (require.main === module) {
  const port = Number(process.env.PORT || 8787);
  const { app, server } = createApp({ persistPath: process.env.APP_DATA_DIR ? path.join(process.env.APP_DATA_DIR, 'store.json') : null });
  server.listen(port, () => {
    console.log(`[game-server] profile=${app.profile} listening on http://127.0.0.1:${port}`);
  });
  const shutdown = () => { app.store.maybePersist(true); process.exit(0); };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  setInterval(() => app.store.maybePersist(), 10000).unref();
}
