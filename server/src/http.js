"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomId = exports.hmac = void 0;
exports.matchRoute = matchRoute;
exports.makeServer = makeServer;
/**
 * 极简 HTTP 框架（零依赖 node:http）—— 参考服务端专用。
 */
const http = __importStar(require("node:http"));
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
