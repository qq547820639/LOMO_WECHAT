/**
 * 功能族路由完整性检查：每个登记在 data.gen 的功能族都必须能打开一个真实 Screen。
 * 这会捕获“列表里有入口、点击后只有未实装弹窗”的空壳回归。
 */
import * as assert from 'node:assert';
import { FEATURES } from '../../shared/src/gen/data.gen';
import { SCREEN_ROUTES } from '../../client/src/features/registry';
import { registerAllScreensImpl } from '../../client/src/features/screens_all';

export function run(): { checked: number; missing: string[] } {
  registerAllScreensImpl({});
  const missing = FEATURES.filter((f) => !SCREEN_ROUTES[f.id]).map((f) => `${f.id} (${f.title})`);
  assert.equal(missing.length, 0, `feature routes missing: ${missing.join(', ')}`);
  console.log(`screen-route-integrity ok: ${FEATURES.length} feature families have screens`);
  return { checked: FEATURES.length, missing };
}

if (require.main === module) run();
