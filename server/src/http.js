"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomId = exports.hmac = void 0;
exports.matchRoute = matchRoute;
exports.makeServer = makeServer;
/**
 * 极简 HTTP 框架（零依赖 node:http）—— 参考服务端专用。
 */
const util_1 = require("./util");
Object.defineProperty(exports, "hmac", { enumerable: true, get: function () { return util_1.hmac; } });
Object.defineProperty(exports, "randomId", { enumerable: true, get: function () { return util_1.randomId; } });
function matchRoute(routes, method, path) {
    for (const r of routes) {
        if (r.method !== method)
            continue;
        const pp = r.pattern.split('/').filter(Boolean);
        const cp = path.split('/').filter(Boolean);
        if (pp.length !== cp.length)
            continue;
        const params = {};
        let matched = true;
        for (let i = 0; i < pp.length; i++) {
            if (pp[i].startsWith(':'))
                params[pp[i].slice(1)] = decodeURIComponent(cp[i]);
            else if (pp[i] !== cp[i]) {
                matched = false;
                break;
            }
        }
        if (matched)
            return { handler: r.handler, params };
    }
    return null;
}
function makeServer(routes, opts = {}) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const http = require('node:http');
    return http.createServer(async (req, res) => {
        var _a, _b;
        const url = new URL(req.url || '/', 'http://localhost');
        const path = url.pathname;
        const send = (code, data) => {
            const body = JSON.stringify(data);
            res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
            res.end(body);
        };
        let body = undefined;
        if (req.method === 'POST' || req.method === 'PUT') {
            const chunks = [];
            let size = 0;
            for await (const chunk of req) {
                size += chunk.length;
                if (size > 2 * 1024 * 1024) {
                    send(413, { ok: false, code: 'BAD_REQUEST', message: 'payload too large' });
                    return;
                }
                chunks.push(chunk);
            }
            try {
                body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
            }
            catch {
                send(400, { ok: false, code: 'BAD_REQUEST', message: 'invalid json' });
                return;
            }
        }
        const found = matchRoute(routes, req.method || 'GET', path);
        const ctx = {
            req, res, method: req.method || 'GET', path, params: (found === null || found === void 0 ? void 0 : found.params) || {}, query: url.searchParams, body,
            status(code) { res.statusCode = code; },
            json(data) { send(res.statusCode || 200, data); },
        };
        try {
            if (!found) {
                send(404, { ok: false, code: 'NOT_FOUND', message: `no route ${req.method} ${path}` });
                return;
            }
            await found.handler(ctx);
            if (!res.writableEnded)
                send(res.statusCode || 200, (_a = ctx.__body) !== null && _a !== void 0 ? _a : { ok: true });
        }
        catch (err) {
            (_b = opts.log) === null || _b === void 0 ? void 0 : _b.call(opts, `[error] ${req.method} ${path}: ${(err === null || err === void 0 ? void 0 : err.message) || err}`);
            send(500, { ok: false, code: 'SERVER_ERROR', message: String((err === null || err === void 0 ? void 0 : err.message) || err) });
        }
    });
}
