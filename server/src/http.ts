/**
 * 极简 HTTP 框架（零依赖 node:http）—— 参考服务端专用。
 */
import { hmac, randomId } from './util';
export { hmac, randomId };

export interface HttpCtx {
  req: any;
  res: any;
  method: string;
  path: string;
  params: Record<string, string>;
  query: any;
  body: any;
  status(code: number): void;
  json(data: unknown): void;
}

export type HttpHandler = (ctx: HttpCtx) => Promise<void> | void;

export interface RouteDef { method: string; pattern: string; handler: HttpHandler }

export function matchRoute(routes: RouteDef[], method: string, path: string): { handler: HttpHandler; params: Record<string, string> } | null {
  for (const r of routes) {
    if (r.method !== method) continue;
    const pp = r.pattern.split('/').filter(Boolean);
    const cp = path.split('/').filter(Boolean);
    if (pp.length !== cp.length) continue;
    const params: Record<string, string> = {};
    let matched = true;
    for (let i = 0; i < pp.length; i++) {
      if (pp[i].startsWith(':')) params[pp[i].slice(1)] = decodeURIComponent(cp[i]);
      else if (pp[i] !== cp[i]) { matched = false; break; }
    }
    if (matched) return { handler: r.handler, params };
  }
  return null;
}

export function makeServer(routes: RouteDef[], opts: { log?: (msg: string) => void } = {}): any {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const http = require('node:http');
  return http.createServer(async (req: any, res: any) => {
    const url = new URL(req.url || '/', 'http://localhost');
    const path = url.pathname;
    const send = (code: number, data: unknown) => {
      const body = JSON.stringify(data);
      res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
      res.end(body);
    };
    let body: any = undefined;
    if (req.method === 'POST' || req.method === 'PUT') {
      const chunks: any[] = [];
      let size = 0;
      for await (const chunk of req) {
        size += (chunk as any).length;
        if (size > 2 * 1024 * 1024) { send(413, { ok: false, code: 'BAD_REQUEST', message: 'payload too large' }); return; }
        chunks.push(chunk as any);
      }
      try { body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch { send(400, { ok: false, code: 'BAD_REQUEST', message: 'invalid json' }); return; }
    }
    const found = matchRoute(routes, req.method || 'GET', path);
    const ctx: HttpCtx = {
      req, res, method: req.method || 'GET', path, params: found?.params || {}, query: url.searchParams, body,
      status(code: number) { res.statusCode = code; },
      json(data: unknown) { send(res.statusCode || 200, data); },
    };
    try {
      if (!found) { send(404, { ok: false, code: 'NOT_FOUND', message: `no route ${req.method} ${path}` }); return; }
      await found.handler(ctx);
      if (!res.writableEnded) send(res.statusCode || 200, (ctx as any).__body ?? { ok: true });
    } catch (err: any) {
      opts.log?.(`[error] ${req.method} ${path}: ${err?.name || 'Error'}`);
      send(500, { ok: false, code: 'SERVER_ERROR', message: '服务暂不可用，请稍后重试' });
    }
  });
}
