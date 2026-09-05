/**
 * 680 路由验收（Section 85/十一）——
 *  data/routes.json 覆盖 = 原 CSV 680 行；
 *  每个业务 Activity 都有 target/status/decision；
 *  每个 PLATFORM_ADAPTER 页面记录 platform replacement。
 * 生成 docs/ROUTE_PARITY_680.md。
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { rootPath } from '../../shared/src/paths';
import { LegacyRoute } from '../../shared/src/registry';

export function run(): { total: number; byStatus: Record<string, number>; byMode: Record<string, number>; ok: boolean; problems: string[] } {
  const routes: LegacyRoute[] = JSON.parse(fs.readFileSync(rootPath('data/routes.json'), 'utf8'));
  const csv = fs.readFileSync(rootPath('evidence/full_clone/03_FULL_ROUTE_MATRIX_680.csv'), 'utf8').replace(/^\uFEFF/, '').split('\n').filter((l) => l.trim());
  const csvActivities = new Set(csv.slice(1).map((l) => l.split(',')[0]));
  const jsonActivities = new Set(routes.map((r) => r.legacyActivity));

  const problems: string[] = [];
  for (const a of csvActivities) if (!jsonActivities.has(a)) problems.push(`missing in routes.json: ${a}`);
  for (const a of jsonActivities) if (!csvActivities.has(a)) problems.push(`extra in routes.json: ${a}`);

  const byStatus: Record<string, number> = {};
  const byMode: Record<string, number> = {};
  for (const r of routes) {
    byStatus[r.migrationStatus] = (byStatus[r.migrationStatus] ?? 0) + 1;
    byMode[r.mode] = (byMode[r.mode] ?? 0) + 1;
    if (!r.targetRoute || !r.migrationStatus) problems.push(`incomplete decision: ${r.legacyActivity}`);
    if (r.mode === 'PLATFORM_ADAPTER' && r.migrationStatus !== 'platform-replaced') problems.push(`adapter not replaced: ${r.legacyActivity}`);
  }

  const ok = problems.length === 0 && routes.length === 680;

  // 生成 ROUTE_PARITY_680.md
  const docsDir = rootPath('docs');
  fs.mkdirSync(docsDir, { recursive: true });
  const lines: string[] = [
    '# ROUTE_PARITY_680', '',
    `> 自动生成于 tools/src/route_parity.ts · 运行 npm run parity 重建。`,
    '',
    `- 原 CSV 行数: ${csvActivities.size}`,
    `- routes.json 条目: ${routes.length}`,
    `- 状态分布: ${JSON.stringify(byStatus)}`,
    `- 决策分布: ${JSON.stringify(byMode)}`,
    `- 验收: ${ok ? 'PASS ✅' : 'FAIL ❌'}`,
    '',
    '| 原 Activity | 模块 | 功能 | 决策 | 迁移状态 | 目标路由 | 发布策略 | 说明 |',
    '|---|---|---|---|---|---|---|---|',
  ];
  for (const r of routes) {
    lines.push(`| ${r.legacyActivity} | ${r.moduleName} | ${r.feature} | ${r.mode} | ${r.migrationStatus} | ${r.targetRoute} | ${r.releasePolicy} | ${r.note ?? ''} |`);
  }
  fs.writeFileSync(path.join(docsDir, 'ROUTE_PARITY_680.md'), lines.join('\n'));

  if (!ok) {
    console.error(problems.slice(0, 20));
    throw new Error(`route parity failed: ${problems.length} problems`);
  }
  console.log(`route-parity ok: 680/680 mapped (${JSON.stringify(byStatus)})`);
  return { total: routes.length, byStatus, byMode, ok, problems };
}

if (require.main === module) run();
