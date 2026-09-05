"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fail = exports.ok = void 0;
const ok = (message, extra = {}) => ({ ok: true, message, ...extra });
exports.ok = ok;
const fail = (message) => ({ ok: false, message });
exports.fail = fail;
