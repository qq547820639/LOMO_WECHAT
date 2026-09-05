declare const wx: any;
declare const GameGlobal: any;
declare function setTimeout(handler: (...args: any[]) => void, timeout?: number, ...args: any[]): any;
declare function setInterval(handler: (...args: any[]) => void, timeout?: number, ...args: any[]): any;
declare function clearInterval(id: any): void;
declare interface Console { log(...args: any[]): void; error(...args: any[]): void; warn(...args: any[]): void; }
declare const console: Console;
