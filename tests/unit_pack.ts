/**
 * P0-3 图集打包单测：MaxRects 正确性 / 降帧选择 / 视频桶分类 / 形态 A manifest 校验。
 * MaxRects 直接 import 浏览器同款实现（tools/bake/maxrects.mjs）—— 单实现双端。
 */
import * as assert from 'node:assert';
import * as url from 'node:url';
import { rootPath } from '../shared/src/paths';

async function loadMaxRects() {
  // 隐藏式动态 import：TS→CJS 会把 import() 转译成 require，必须逃逸（.mjs 无法 require）
  const dynImport = new Function('u', 'return import(u)') as (u: string) => Promise<any>;
  return dynImport(url.pathToFileURL(rootPath('tools', 'bake', 'maxrects.mjs')).href);
}

function assertNoOverlap(placed: Array<{ x: number; y: number; w: number; h: number }>): void {
  for (let i = 0; i < placed.length; i++) {
    for (let j = i + 1; j < placed.length; j++) {
      const a = placed[i], b = placed[j];
      const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
      assert.ok(!overlap, `overlap at ${i}(${a.x},${a.y},${a.w},${a.h}) vs ${j}(${b.x},${b.y},${b.w},${b.h})`);
    }
  }
}

export async function run(): Promise<void> {
  const { Sheet, selectFrames, classifyVideoBucket } = await loadMaxRects();

  // ---------- MaxRects：均匀网格高占用率 ----------
  {
    const sheet = new Sheet(256, 256);
    for (let i = 0; i < 16; i++) {
      const pos = sheet.insert(64, 64, 'r' + i);
      assert.ok(pos, `rect ${i} placed`);
    }
    assert.equal(sheet.placed.length, 16);
    assertNoOverlap(sheet.placed);
    assert.ok(sheet.occupancy() > 0.99, `grid occupancy ${sheet.occupancy().toFixed(3)}`);
    assert.equal(sheet.insert(64, 64), null, 'full sheet rejects');
  }

  // ---------- MaxRects：混排尺寸跨 sheet 流式放置（在线语义：放不下即开新 sheet） ----------
  {
    const sizes: Array<[number, number]> = [
      [300, 200], [200, 300], [150, 150], [100, 400], [64, 64], [128, 96],
      [400, 100], [96, 128], [200, 200], [50, 50], [80, 80], [110, 90],
      [333, 111], [77, 77], [222, 44], [160, 160],
    ];
    // 总面积 ≈ 147% 单张 512² → 需要 2 张
    const sheets = [new Sheet(512, 512)];
    for (const [w, h] of sizes) {
      let pos = sheets[sheets.length - 1].insert(w, h);
      if (!pos) { sheets.push(new Sheet(512, 512)); pos = sheets[sheets.length - 1].insert(w, h); }
      assert.ok(pos, `${w}x${h} placed`);
    }
    // 在线流式（不回溯、文件到达序）允许比理论下限多用一张：3 张断言 + 密度下限
    assert.ok(sheets.length <= 3, `sheets used ${sheets.length} (area 147% of one)`);
    for (const sh of sheets) assertNoOverlap(sh.placed);
    const totalOcc = sheets.reduce((a, sh) => a + sh.usedArea(), 0);
    assert.ok(totalOcc / (512 * 512 * sheets.length) > 0.45, `packed density ${(totalOcc / (512 * 512 * sheets.length)).toFixed(2)}`);
    assert.equal(sheets[0].insert(600, 10), null, 'oversize rejected');
    assert.equal(sheets[0].insert(0, 10), null, 'zero-size rejected');
  }

  // ---------- MaxRects：在线放置（流式到达序）且放大件后小件仍能塞缝 ----------
  {
    const sheet = new Sheet(256, 256);
    assert.ok(sheet.insert(128, 128, 'big1'));
    assert.ok(sheet.insert(128, 128, 'big2'));
    assert.ok(sheet.insert(64, 64, 'small1'));
    assert.ok(sheet.insert(64, 64, 'small2'));
    assert.ok(sheet.insert(32, 32, 'tiny'));
    assertNoOverlap(sheet.placed);
  }

  // ---------- 降帧选择：stride 数学 ----------
  {
    assert.deepEqual(selectFrames(60, 30, 15, 120), [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58], '30→15fps stride=2');
    assert.deepEqual(selectFrames(10, 60, 20, 120), [0, 3, 6, 9], '60→20fps stride=3');
    assert.deepEqual(selectFrames(5, 10, 20, 120), [0, 1, 2, 3, 4], 'src<target → stride=1 不加帧');
    assert.equal(selectFrames(1000, 60, 15, 24).length, 24, 'cap respected');
  }

  // ---------- 视频桶：无法 2×2 平铺 / 单帧超 1MP / 面积超 6 sheet ----------
  {
    assert.equal(classifyVideoBucket(1125, 2436, 12), true, 'full-screen performance → video');
    assert.equal(classifyVideoBucket(800, 1100, 30), true, 'maxDim>1024 cannot 2x2 tile → video');
    assert.equal(classifyVideoBucket(1000, 1000, 75), true, 'area > 6 sheets → video');
    assert.equal(classifyVideoBucket(1000, 1000, 20), false, 'exactly 2x2 tileable, 20MP < 6-sheet budget stays atlas');
    assert.equal(classifyVideoBucket(390, 165, 25), false, 'small UI effect stays atlas');
    assert.equal(classifyVideoBucket(500, 500, 50), false, 'borderline stays atlas');
    assert.equal(classifyVideoBucket(600, 600, 200), true, 'heavy area → video');
  }

  // ---------- 形态 A manifest 校验（经 validateManifest） ----------
  {
    const { validateManifest } = await import('../client/src/core/assets');
    const manifest = {
      version: 'atlas-test', base: 'assets/game/',
      atlases: [
        { id: 'marbles', file: 'atlas/marbles/sheet_00.webp', fps: 15, frames: [{ name: 'launch_click:0000', x: 0, y: 0, w: 390, h: 165, dur: 67 }] },
        { id: 'miner', fps: 12, frames: [{ name: 'f00', file: 'miner/f00.webp', w: 420, h: 420 }] },
      ],
    };
    assert.equal(validateManifest(manifest as any).length, 0, 'form A + form B both valid');
  }

  console.log('unit-pack ok: maxrects(no-overlap/occupancy/online)/selectFrames/videoBucket/manifest-formA');
}

if (require.main === module) run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
