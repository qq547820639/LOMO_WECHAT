/**
 * Node 环境缺失声明的垫片（仅供微信小游戏构建的 tsc 程序使用；不含实现）。
 */
declare module 'node:http';
declare module 'node:crypto';
declare module 'node:fs';
declare module 'node:path';
declare function require(id: string): any;
declare function setInterval(handler: (...args: any[]) => void, timeout?: number, ...args: any[]): any;
declare function clearInterval(id: any): void;
declare function setTimeout(handler: (...args: any[]) => void, timeout?: number, ...args: any[]): any;
declare function clearTimeout(id: any): void;
type AbortSignal = any;
declare const AbortController: any;
declare const process: any;
declare const Buffer: any;
declare const URL: any;
declare const URLSearchParams: any;
declare function fetch(input: any, init?: any): Promise<any>;
declare const __dirname: any;
declare const console: any;
declare const GameGlobal: any;
