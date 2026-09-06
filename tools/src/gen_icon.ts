/**
 * 《猿岛 ApeIsland》小程序图标生成器 —— 144×144（微信小游戏规范尺寸）。
 * 与游戏内美术同源：三阶色阶 + 自动描边 + 定向着色的像素工坊管线，零外部素材。
 * 构图：星空 → 金色徽章环 → 金盔猿脸 → 底部岛屿/棕榈剪影 → 矿石星芒。
 * 运行：node dist/tools/src/gen_icon.js → brand/icon_144.png
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Canvas, encodePNG, hsl, rampOf, OUTLINE, RGB } from './gen_slot_animations';
import { rootPath } from '../../shared/src/paths';

const W = 48, H = 48;

// 材质表（图标专属）
const M = {
  FUR: 0,    // 猿毛棕
  FACE: 1,   // 脸部米色
  HELM: 2,   // 盔金
  LAMP: 3,   // 灯白
  ISLE: 4,   // 岛绿
  TRUNK: 5,  // 棕榈干
  RING: 6,   // 徽章环金
  ORE: 7,    // 矿石青
  SKY: 8,    // 天空基色（渐变由 writeRGB 直写，此材质仅占位）
};
const MATS = [
  rampOf(hsl(22, 0.52, 0.34)),  // FUR 深棕
  rampOf(hsl(30, 0.6, 0.66)),   // FACE 米
  rampOf(hsl(44, 0.92, 0.52)),  // HELM 金
  rampOf(hsl(50, 0.5, 0.86)),   // LAMP 白金
  rampOf(hsl(146, 0.5, 0.36)),  // ISLE 岛绿
  rampOf(hsl(26, 0.5, 0.3)),    // TRUNK
  rampOf(hsl(43, 0.85, 0.5)),   // RING
  rampOf(hsl(186, 0.7, 0.52)),  // ORE 青
  rampOf(hsl(228, 0.5, 0.2)),   // SKY
];

export function generate(): void {
  const c = new Canvas(W, H, MATS, 3);

  // ---- 星空背景渐变（writeRGB 直写，绕过材质）----
  const top: [number, number, number] = hsl(228, 0.55, 0.14);
  const bot: [number, number, number] = hsl(232, 0.5, 0.24);
  for (let y = 0; y < H; y++) {
    const t = y / H;
    const row: RGB = [
      Math.round(top[0] + (bot[0] - top[0]) * t),
      Math.round(top[1] + (bot[1] - top[1]) * t),
      Math.round(top[2] + (bot[2] - top[2]) * t),
    ];
    for (let x = 0; x < W; x++) c.writeRGB(x, y, row);
  }
  // 星点（确定性）
  for (const [sx, sy] of [[7, 6], [38, 5], [42, 14], [5, 20], [40, 30], [4, 34], [36, 40], [10, 43]] as Array<[number, number]>) {
    c.writeRGB(sx, sy, [235, 238, 255]);
  }

  // ---- 底部岛屿剪影（绿丘 + 棕榈，下沉至环内底部）----
  c.disc(24, 62, 26, M.ISLE);
  for (let x = 10; x < 38; x++) c.writeRGB(x, 36, hsl(146, 0.5, 0.34));
  c.limb(35, 41, 33, 30, 1.4, 1.0, M.TRUNK);
  for (const [dx, dy] of [[-4, -2], [-1, -4], [3, -3], [5, 0], [-5, 1]] as Array<[number, number]>) {
    c.limb(33, 30, 33 + dx, 30 + dy, 1.3, 0.6, M.ISLE);
  }

  // ---- 金色徽章环 ----
  for (let a = 0; a < 360; a += 3) {
    const rad = (a * Math.PI) / 180;
    c.disc(24 + Math.cos(rad) * 19.5, 23 + Math.sin(rad) * 19.5, 1.15, M.RING);
  }

  // ---- 猿脸（几何 v2：盔不压脸）----
  c.disc(11, 25, 3.0, M.FUR);   // 耳
  c.disc(37, 25, 3.0, M.FUR);
  c.disc(11, 25, 1.4, M.FACE);
  c.disc(37, 25, 1.4, M.FACE);
  c.disc(24, 24, 11.5, M.FUR);  // 头
  c.disc(19, 27, 5.6, M.FACE);  // 脸（双瓣）
  c.disc(29, 27, 5.6, M.FACE);
  c.tri(14, 29, 34, 29, 24, 37, M.FACE);
  c.disc(19.5, 27.5, 1.6, M.FUR);  // 眼
  c.disc(28.5, 27.5, 1.6, M.FUR);
  c.put(19.5, 27, 3); c.put(20, 27, 3);
  c.put(28.5, 27, 3); c.put(28, 27, 3);
  c.put(23, 31, M.FUR); c.put(25, 31, M.FUR);   // 鼻
  c.put(22, 33, M.FUR); c.put(23, 34, M.FUR); c.put(24, 34, M.FUR); c.put(25, 34, M.FUR); c.put(26, 33, M.FUR); // 嘴

  // ---- 金盔（上移缩小，只扣头顶）----
  c.disc(24, 15.5, 8.2, M.HELM);
  c.rect(11, 14, 26, 3, M.HELM);
  c.rect(22, 5, 5, 3, M.LAMP);
  c.put(21, 7, M.LAMP);
  c.put(17, 15, M.LAMP);
  c.put(31, 15, M.LAMP);

  // ---- 矿石星芒（左下环内 + 右上环外）----
  for (const [ox, oy] of [[10, 38], [39, 9]] as Array<[number, number]>) {
    c.put(ox, oy, M.ORE);
    c.put(ox - 1, oy, M.ORE);
    c.put(ox + 1, oy, M.ORE);
    c.put(ox, oy - 1, M.ORE);
    c.put(ox, oy + 1, M.ORE);
    c.put(ox, oy, M.LAMP);
  }

  const outDir = rootPath('brand');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'icon_144.png'), c.render(3));
  console.log('[gen_icon] brand/icon_144.png (144×144) 生成完毕');
}

if (require.main === module) generate();
