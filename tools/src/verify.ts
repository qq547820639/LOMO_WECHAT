/**
 * 最终自动验收（Section 84）—— 一次执行：
 *   parity（680 路由）→ 资产清单校验 → release safety → unit → gameplay → integration（含客户端无头）
 *   → 微信双产物构建 + 产物冒烟 → TEST_REPORT.md 生成。
 * 全部通过 Exit Code 0。
 */
import * as fs from 'node:fs';
import * as assert from 'node:assert';
import { execFileSync } from 'node:child_process';
import { rootPath } from '../../shared/src/paths';
import { BRAND } from '../../shared/src/brand';

interface Step { name: string; fn: () => Promise<any> | any }

function runTestProcess(filename: string): string {
  return execFileSync(process.execPath, [rootPath('dist/tests', filename + '.js')], { timeout: 120000, encoding: 'utf8' }).trim();
}

async function main(): Promise<void> {
  const bundleDirs = ['build/verify/wechat-full-clone', 'build/verify/wechat-release'];
  const steps: Step[] = [
    { name: 'route-parity-680', fn: () => require('./route_parity').run() },
    { name: 'asset-manifest', fn: () => require('./asset_pipeline').run({}) },
    { name: 'unit-core', fn: () => require('../../tests/unit_core').run() },
    { name: 'unit-assets+compliance', fn: () => require('../../tests/unit_assets').run() },
    { name: 'unit-pack', fn: () => require('../../tests/unit_pack').run() },
    { name: 'slot-ref-integrity', fn: () => require('./check_slot_refs').run() },
    { name: 'screen-route-integrity', fn: () => require('./check_screen_routes').run() },
    { name: 'frame-qa', fn: () => require('./qa_frames').run() },
    { name: 'gameplay-server', fn: () => require('../../tests/gameplay_server').run() },
    { name: 'release-safety', fn: () => require('../../tests/release_safety').run() },
    { name: 'client-platform-transport', fn: () => runTestProcess('client_platform') },
    { name: 'client-runtime-consent-session-lifecycle', fn: () => runTestProcess('client_runtime') },
    { name: 'client-hub-layout-navigation', fn: () => runTestProcess('client_hubs') },
    { name: 'client-combat-entry-retry-balances', fn: () => runTestProcess('client_combat') },
    { name: 'action-idempotency-loss-restart-replay', fn: () => runTestProcess('action_idempotency') },
    { name: 'cloud-persistence-transactions-restart-replay', fn: () => runTestProcess('persistence') },
    { name: 'release-config-validation', fn: () => runTestProcess('release_config') },
    { name: 'security-auth-persistence-hardening', fn: () => runTestProcess('security_hardening') },
    { name: 'server-packaging-credential-isolation', fn: () => runTestProcess('server_packaging') },
    { name: 'integration-client', fn: () => runTestProcess('integration_client') },
    {
      name: 'build-wechat-bundles', fn: async () => {
        const { build } = await import('./build_wechat');
        // 体积门禁：始终以云资源形态构建（未配置 APP_CLOUD_BASE 时用占位域名），
        // 保证「主包 ≤4MB」红线在验收中被真实执行，而不是上线前才发现超限。
        const cloudBase = process.env.APP_CLOUD_BASE || 'https://assets.invalid/assets/game/';
        const full = build('full-clone', { cloudBase, outputDir: bundleDirs[0] });
        const release = build('wechat-release', { cloudBase, allowUnconfigured: true, outputDir: bundleDirs[1] });
        const { assertBundleAssets } = await import('../../tests/build_assets');
        for (const dir of [full, release]) assertBundleAssets(dir, cloudBase);
        return { full, release, cloudBase };
      },
    },
    {
      name: 'bundle-size-gate', fn: async () => {
        // 微信小游戏红线：主包 ≤4MB（分包合计 ≤30MB，本工程当前不使用分包）
        const { dirSizeBytes } = await import('./build_wechat');
        const limit = 4 * 1024 * 1024;
        const lines: string[] = [];
        for (const dir of bundleDirs) {
          const bytes = dirSizeBytes(rootPath(dir));
          lines.push(`${dir}: ${(bytes / 1048576).toFixed(2)}MB / 4.00MB`);
          assert.ok(bytes <= limit, `${dir} 主包 ${(bytes / 1048576).toFixed(2)}MB 超过微信 4MB 红线（limit=${limit}B）`);
        }
        return lines.join('\n');
      },
    },
    {
      name: 'bundle-smoke', fn: async () => {
        // 产物冒烟：wx mock 实际走 启动→合规门→点击进入→登录→首页→图集渲染 全链路
        const results: string[] = [];
        for (const dir of bundleDirs) {
          const mock = makeWxMock(rootPath(dir));
          (globalThis as any).wx = mock;
          const entryPath = rootPath(dir, 'dist/client/src/app/wx_entry.js');
          delete require.cache[require.resolve(entryPath)];
          for (const k of Object.keys(require.cache)) {
            if (k.includes('/build/')) delete require.cache[k];
          }
          const { start } = require(entryPath);
          await start({ profile: dir.endsWith('release') ? 'wechat-release' : 'full-clone', standalone: true });
          await mock.__settle(600);
          assertBoot(mock);
          const gateButton = mock.__textDraws.find((draw: TextDraw) => draw.text === '我已阅读并知悉 · 进入游戏');
          assert.ok(gateButton, `${dir}: consent button rendered before login`);
          assert.ok(!mock.__textDraws.some((draw: TextDraw) => draw.text === '热门玩法'), `${dir}: home is unavailable before consent`);
          mock.__textDraws.length = 0;
          mock.__drawImageCalls = 0;
          mock.__dispatchTap(gateButton.x, gateButton.y);
          await mock.__settle(700);
          assert.ok(mock.__textDraws.some((draw: TextDraw) => draw.text === '热门玩法'), `${dir}: home gameplay section rendered after consent`);
          assert.ok(mock.__textDraws.some((draw: TextDraw) => draw.text === BRAND.homeTitle), `${dir}: actual home page title rendered after consent`);
          assert.ok(mock.__drawImageCalls > 0, 'atlas frames drawn via drawImage in bundle');
          mock.__textDraws.length = 0;
          await mock.__settle(100);
          assert.ok(!mock.__textDraws.some((draw: TextDraw) => draw.text === '健康游戏忠告'), `${dir}: consent gate is no longer active`);
          results.push(`${dir}: gate→home ok, drawCalls=${mock.__drawCalls}, drawImage=${mock.__drawImageCalls}`);
        }
        delete (globalThis as any).wx;
        return results;
      },
    },
  ];

  const report: string[] = ['# TEST_REPORT', '', `> 自动生成: tools/src/verify.ts · ${new Date().toISOString()}`, ''];
  let failed = 0;
  const perf = { steps: [] as any[] };
  for (const step of steps) {
    const t0 = Date.now();
    try {
      const detail = await step.fn();
      const ms = Date.now() - t0;
      const detailText = typeof detail === 'string' ? detail : detail === undefined ? 'ok' : `\`${JSON.stringify(detail).slice(0, 600)}\``;
      report.push(`## ✅ ${step.name} (${ms}ms)`, '', detailText, '');
      perf.steps.push({ name: step.name, ms, ok: true });
      console.log(`✅ ${step.name} (${ms}ms)`);
    } catch (err: any) {
      failed++;
      const ms = Date.now() - t0;
      report.push(`## ❌ ${step.name} (${ms}ms)`, '', '```', String(err?.stack || err).slice(0, 2000), '```', '');
      perf.steps.push({ name: step.name, ms, ok: false });
      console.error(`❌ ${step.name}: ${err?.message || err}`);
    }
  }
  // 性能数据
  const bootMs = perf.steps.find((s) => s.name === 'integration-client')?.ms ?? -1;
  const buildMs = perf.steps.filter((s) => s.name.includes('build')).reduce((a, b) => a + b.ms, 0);
  const sizes: Record<string, number> = {};
  for (const d of bundleDirs) {
    sizes[d] = dirSize(rootPath(d));
  }
  report.push(
    '## 性能/体积', '',
    `- 无头启动+全功能冒烟: ${bootMs}ms（含两局完整玩法）`,
    `- 双产物构建耗时: ${buildMs}ms`,
    `- FULL CLONE 包: ${(sizes[bundleDirs[0]] / 1024).toFixed(0)} KB`,
    `- RELEASE 包: ${(sizes[bundleDirs[1]] / 1024).toFixed(0)} KB`,
    '',
    `> 包体含编译 JS 与数据；APK 原始资源未打包（按 CDN 策略设计，见 docs/ASSET_MIGRATION.md）。`,
  );
  fs.writeFileSync(rootPath('docs', 'TEST_REPORT.md'), report.join('\n'));

  if (failed > 0) {
    console.error(`verify FAILED: ${failed} step(s)`);
    process.exit(1);
  }
  console.log('verify PASS: all steps green');
}

function assertBoot(mock: any): void {
  if (!mock.__booted) throw new Error('wx bundle did not boot (no frames rendered)');
  if (mock.__drawCalls < 50) throw new Error(`bundle rendered too little: ${mock.__drawCalls}`);
}

interface TextDraw { text: string; x: number; y: number }
type CanvasMatrix = [number, number, number, number, number, number];

function makeWxMock(bundleDir?: string): any {
  const mock: any = {
    __drawCalls: 0,
    __drawImageCalls: 0,
    __booted: false,
    __textDraws: [] as TextDraw[],
    __frames: [] as Array<() => void>,
    __startCbs: [] as Array<(e: any) => void>,
    __endCbs: [] as Array<(e: any) => void>,
    __pending: [] as Array<() => void>,
    createCanvas() {
      const self = mock;
      let matrix: CanvasMatrix = [1, 0, 0, 1, 0, 0];
      const stack: CanvasMatrix[] = [];
      const multiply = (next: CanvasMatrix): void => {
        matrix = [
          matrix[0] * next[0] + matrix[2] * next[1],
          matrix[1] * next[0] + matrix[3] * next[1],
          matrix[0] * next[2] + matrix[2] * next[3],
          matrix[1] * next[2] + matrix[3] * next[3],
          matrix[0] * next[4] + matrix[2] * next[5] + matrix[4],
          matrix[1] * next[4] + matrix[3] * next[5] + matrix[5],
        ];
      };
      const reset = (): void => { matrix = [1, 0, 0, 1, 0, 0]; stack.length = 0; };
      let bitmapWidth = 750;
      let bitmapHeight = 1334;
      const context = new Proxy({
        measureText: (text: string) => ({ width: text.length * 7 }),
        scale: (horizontal: number, vertical: number) => multiply([horizontal, 0, 0, vertical, 0, 0]),
        translate: (horizontal: number, vertical: number) => multiply([1, 0, 0, 1, horizontal, vertical]),
        rotate: (angle: number) => multiply([Math.cos(angle), Math.sin(angle), -Math.sin(angle), Math.cos(angle), 0, 0]),
        transform: (...next: CanvasMatrix) => multiply(next),
        setTransform: (...next: CanvasMatrix) => { matrix = [...next]; },
        resetTransform: () => { matrix = [1, 0, 0, 1, 0, 0]; },
        save: () => { stack.push([...matrix]); },
        restore: () => { matrix = stack.pop() ?? matrix; },
      }, {
        get(target: any, prop: string) {
          if (prop in target) return target[prop];
          return (...args: any[]) => {
            self.__drawCalls++;
            if (prop === 'fillText') {
              const viewport = mock.getSystemInfoSync();
              const logicalX = Number(args[1]);
              const logicalY = Number(args[2]);
              self.__booted = true;
              self.__textDraws.push({
                text: String(args[0]),
                x: (matrix[0] * logicalX + matrix[2] * logicalY + matrix[4]) * viewport.windowWidth / bitmapWidth,
                y: (matrix[1] * logicalX + matrix[3] * logicalY + matrix[5]) * viewport.windowHeight / bitmapHeight,
              });
            }
            if (prop === 'drawImage') self.__drawImageCalls++;
            return undefined;
          };
        },
        set(target: any, prop: string, value: any) { target[prop] = value; return true; },
      });
      return {
        get width() { return bitmapWidth; },
        set width(value: number) { bitmapWidth = value; reset(); },
        get height() { return bitmapHeight; },
        set height(value: number) { bitmapHeight = value; reset(); },
        getContext() { return context; },
      };
    },
    getSystemInfoSync() { return { windowWidth: 375, windowHeight: 667, pixelRatio: 2, platform: 'devtools' }; },
    requestAnimationFrame(cb: () => void) { mock.__frames.push(cb); return mock.__frames.length; },
    onTouchStart(cb: (e: any) => void) { mock.__startCbs.push(cb); },
    onTouchEnd(cb: (e: any) => void) { mock.__endCbs.push(cb); },
    onTouchMove() {},
    __dispatchTap(x: number, y: number) {
      for (const cb of mock.__startCbs) cb({ touches: [{ clientX: x, clientY: y }] });
      for (const cb of mock.__endCbs) cb({ changedTouches: [{ clientX: x, clientY: y }] });
    },
    getStorageSync() { return null; }, setStorageSync() {},
    createImage() {
      const img: any = { src: '', width: 64, height: 64, onload: null as null | (() => void), onerror: null as null | (() => void) };
      Promise.resolve().then(() => img.onload?.());
      return img;
    },
    getFileSystemManager() {
      return { readFileSync: (p: string) => {
        if (!bundleDir) throw new Error('no bundle dir');
        return require('node:fs').readFileSync(require('node:path').join(bundleDir, p), 'utf8');
      } };
    },
    login(o: any) { o?.success?.({ code: 'wxmock-code' }); },
    request(o: any) { o?.fail?.({ errMsg: 'mock offline' }); },
    createInnerAudioContext() { return { play() {}, stop() {}, destroy() {}, setVolume() {} }; },
    vibrateShort() {}, vibrateLong() {},
    onHide(cb: () => void) { mock.__onHide = cb; },
    onShow(cb: () => void) { mock.__onShow = cb; },
    getLaunchOptionsSync() { return { query: {} }; },
    shareAppMessage() {},
    async __settle(ms: number): Promise<void> {
      const until = Date.now() + ms;
      while (Date.now() < until) {
        const frames = mock.__frames.splice(0, mock.__frames.length);
        frames.forEach((f: () => void) => f());
        await new Promise((r) => setTimeout(r, 16));
      }
      mock.__frames.splice(0).forEach((f: () => void) => f());
    },
  };
  return mock;
}

function dirSize(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  let total = 0;
  const walk = (d: string) => {
    for (const f of fs.readdirSync(d)) {
      const p = `${d}/${f}`;
      const st = fs.statSync(p);
      if (st.isDirectory()) walk(p);
      else total += st.size;
    }
  };
  walk(dir);
  return total;
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
