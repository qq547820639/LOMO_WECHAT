/**
 * 运行时项目根定位（仅服务端/工具使用；客户端打包不包含此文件）。
 * node:fs 延迟加载，兼容微信小游戏进程内运行。
 */
import * as path from 'node:path';

export function projectRoot(): string {
  let fs: typeof import('node:fs') | null = null;
  try { fs = require('node:fs'); } catch { fs = null; }
  let dir = __dirname;
  for (let i = 0; i < 8; i++) {
    if (fs && fs.existsSync(path.join(dir, 'package.json'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}

export function rootPath(...segs: string[]): string {
  return path.join(projectRoot(), ...segs);
}
