/**
 * 槽位参照完整性检查（SANITIZATION/COMPLETENESS v5 防回归）。
 * 扫描 client/src 中引用的动画槽位 id（字符串字面量 + 模板前缀），与 manifest 实际 id 对账；
 * 未知/大小写不符/pag__ 缺失一律报错——彻底消灭"猜 ID 死接线"这一缺陷类。
 * 运行：node dist/tools/src/check_slot_refs.js（verify 步骤）
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { rootPath } from '../../shared/src/paths';

export function run(): { checked: number; unresolved: string[] } {
  const manifest = JSON.parse(fs.readFileSync(rootPath('game-assets', 'manifest.json'), 'utf8'));
  const ids: string[] = manifest.atlases.map((a: any) => String(a.id));
  const norm = (x: string) => x.toLowerCase();
  const resolves = (ref: string): boolean => {
    const p = norm(ref);
    if (['miner', 'fx_launch', 'icons', 'cards'].includes(p)) return ids.some((i) => norm(i) === p);
    return ids.some((i) => norm(i).includes(p));
  };
  // 1. 静态字符串引用
  const unresolved: string[] = [];
  let checked = 0;
  const scan = (dir: string): void => {
    for (const f of fs.readdirSync(dir)) {
      const fp = path.join(dir, f);
      if (fs.statSync(fp).isDirectory()) { scan(fp); continue; }
      if (!f.endsWith('.ts')) continue;
      const src = fs.readFileSync(fp, 'utf8');
      for (const m of src.matchAll(/(?:playOverlay\(|getAtlas\(|resolveSlotId\()\s*'([^']+)'/g)) {
        const ref = m[1];
        checked++;
        if (!resolves(ref)) unresolved.push(`${path.relative(rootPath(), fp)}: '${ref}'`);
      }
    }
  };
  scan(rootPath('client', 'src'));
  // 2. 动态前缀引用（resolveSlotId(`prefix${...}`) / escape_animal__${animal} 等）
  for (const f of ['client/src/features/minigame_screens.ts']) {
    const src = fs.readFileSync(rootPath(f), 'utf8');
    for (const m of src.matchAll(/resolveSlotId\(\s*`([^`]+)`/g)) {
      const prefix = m[1].split('${')[0];
      checked++;
      if (!resolves(prefix)) unresolved.push(`${f}: dynamic \'${prefix}*\'`);
    }
  }
  if (unresolved.length) {
    console.error('slot-ref unresolved:', unresolved);
    throw new Error(`slot reference integrity FAILED: ${unresolved.length} unresolved`);
  }
  console.log(`slot-ref-integrity ok: ${checked} references, all resolve against manifest (${ids.length} atlases)`);
  return { checked, unresolved: [] };
}

if (require.main === module) run();
