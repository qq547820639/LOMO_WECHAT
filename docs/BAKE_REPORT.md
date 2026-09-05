# BAKE_REPORT（P0-2 spike，2026-09-05 20:29）

> 机器生成：tools/src/bake_pag.ts + tools/bake/render.html；逐帧统计明细见 data/bake-report.json。

## 结果

| 指标 | 值 |
|---|---|
| 样本 | 535 个（归档 99 个 .pag，evidence/apk_assets_sample/assets/pag/） |
| 烘焙成功 | 535 / 535（失败 0） |
| 渲染帧数 | 19056（cap=120 帧/文件，natural 超限裁剪 48 个） |
| 吞吐 | 10 帧/秒（headless Chrome WebGL，含快照回读+PNG/WebP 双格式编码） |
| PNG 序列总体积 | 8724385.7KB（样本） |
| WebP 序列总体积 | 1057603.6KB（q=0.8，PNG 的 12%） |
| 全量 535 文件外推 | PNG ≈ 7464MB；WebP ≈ 905MB（按 PAG 字节等比，未含打包器去重收益） |

## Top-10 体积（PNG 序列）

| 文件 | 组 | 尺寸 | fps | natural/cap | PNG | WebP | 渲染耗时 |
|---|---|---|---|---|---|---|---|
| pag/arena/battle.pag | pag/arena | 1125×2436 | 30 | 124/120 | 389360.5KB | 32302.4KB | 63511ms |
| pag/box_card_pag_lv6.pag | pag | 1125×1530 | 30 | 120/120 | 201740.4KB | 14094.4KB | 29618ms |
| pag/box_card_pag_lv4.pag | pag | 1125×1530 | 30 | 120/120 | 190979.0KB | 15650.5KB | 27851ms |
| pag/box_card_pag_lv5.pag | pag | 1125×1530 | 30 | 120/120 | 187239.8KB | 14063.1KB | 27762ms |
| pag/ape_stage1.pag | pag | 1125×1000 | 30 | 214/120 | 181710.1KB | 18318.4KB | 21490ms |
| pag/ape_stage2.pag | pag | 1125×1000 | 30 | 208/120 | 176764.9KB | 16979.5KB | 23917ms |
| pag/box_card_pag_lv3.pag | pag | 1125×1530 | 30 | 120/120 | 165530.6KB | 17095.4KB | 32233ms |
| pag/bg_light.pag | pag | 1125×1125 | 30 | 290/120 | 156893.8KB | 12070.9KB | 20123ms |
| pag/compose_acquire.pag | pag | 1125×2436 | 25 | 100/100 | 154726.1KB | 58750.1KB | 56240ms |
| pag/puzzle_detail_light.pag | pag | 1125×1500 | 30 | 120/120 | 151551.2KB | 17392.3KB | 27956ms |

## 分组聚合

| 组 | 文件 | PNG | WebP |
|---|---|---|---|
| pag | 182 | 5359437.4KB | 668895.3KB |
| pag/strengthen | 13 | 701465.4KB | 77271.0KB |
| pag/arena | 12 | 498025.3KB | 45667.3KB |
| pag/challenge_boss | 11 | 386253.9KB | 51410.9KB |
| pag/dress_normal | 18 | 374615.2KB | 36653.4KB |
| pag/dress_rock | 9 | 254595.4KB | 19537.8KB |
| pag/medal_reward | 7 | 194051.9KB | 10501.1KB |
| pag/dress_medal | 9 | 172502.2KB | 23480.5KB |
| pag/idle | 6 | 89283.7KB | 9923.1KB |
| beast/pag | 6 | 72686.9KB | 9959.2KB |
| pag/rob | 10 | 70412.5KB | 4828.2KB |
| pag/ape | 5 | 68340.8KB | 4475.7KB |
| pag/monkeyFighting | 10 | 52428.9KB | 9158.0KB |
| tug | 29 | 46565.8KB | 8985.8KB |
| pag/marbles | 8 | 44401.8KB | 12360.6KB |
| pag/sport_ribbon | 1 | 34841.3KB | 10528.0KB |
| blockBattleRoyal | 16 | 31927.7KB | 8184.6KB |
| pag/ready_go | 1 | 27698.7KB | 2862.9KB |
| pag/marbles/yellow | 10 | 23198.9KB | 4575.7KB |
| pag/marbles/white | 10 | 22822.1KB | 4199.6KB |
| pag/marbles/orange | 10 | 22796.0KB | 4050.7KB |
| pag/chicken | 7 | 22588.2KB | 3275.2KB |
| pag/marbles/gray | 10 | 22478.1KB | 3931.1KB |
| pag/escape_animal/prop | 3 | 15081.8KB | 2893.4KB |
| pag/sport | 6 | 14206.3KB | 2433.4KB |
| pag/battleRoyal | 14 | 11862.9KB | 2486.1KB |
| pag/sport_win | 6 | 10601.3KB | 1368.6KB |
| pag/escape_animal/tiger | 8 | 10046.4KB | 1617.2KB |
| pag/escape_animal/monkey | 9 | 7217.6KB | 1204.5KB |
| pag/sport_stay | 6 | 7116.1KB | 1061.1KB |
| pag/escape_animal/pig | 9 | 6749.8KB | 1190.8KB |
| pag/escape_animal/dog | 9 | 6475.7KB | 1233.0KB |
| pag/escape_animal/fox | 9 | 6456.3KB | 1187.8KB |
| pag/escape_animal/cow | 9 | 6440.5KB | 1106.8KB |
| pag/escape_animal/raccoon | 9 | 5968.8KB | 1110.5KB |
| pag/escape_animal | 3 | 5961.4KB | 898.2KB |
| dagger | 12 | 4257.4KB | 816.5KB |
| pag/debuff | 6 | 2780.8KB | 456.0KB |
| pag/run | 6 | 2777.7KB | 395.1KB |
| robbery | 3 | 1672.1KB | 331.5KB |
| pag/escape_animal/prop/speed | 2 | 1670.2KB | 311.2KB |
| pag/escape_animal/prop/shield | 1 | 1136.7KB | 240.8KB |
| pag/escape_animal/prop/invincible | 2 | 1106.8KB | 237.5KB |
| pag/buff | 1 | 718.1KB | 173.2KB |
| pag/me | 2 | 662.7KB | 134.9KB |

## 方法与口径

- 渲染：headless Chrome（Google Chrome）WebGL（Apple Silicon 实测 ANGLE Metal 后端）+ libpag-web（npm libpag，WASM 单线程版）。
- 像素获取：PAGView.setProgress/flush → makeSnapshot(ImageBitmap) → 2D canvas drawImage → toDataURL（官方导出路径；PAGSurface.fromCanvas 对动态 canvas 存在创建即销毁态缺陷、裸 new PAGPlayer 得到空壳，均记录于 tools/bake/render.html 头注）。
- 帧数：natural = duration × frameRate；超 cap=120 截断（截断文件的体积外推已在 fullBakeVolumeEstimate 内按帧数比例计入自然时长权重前提示 cappedFiles）。
- 磁盘策略：仅 keep 抽样落盘（f070, f279 → evidence/bake_samples/），其余文件渲染后即弃，字节统计在浏览器端累计。
- 朝向假设：readPixels 按 top-left 原点处理（SkBitmap 语义）；kept 样本可人工核验，若发现上下翻转在 P0-3 打包器统一校正。

## 下一步（P0-3）

图集打包：MaxRects + JSON 元数据（形态 A）→ assets/atlas/；fps 按策略表 12-20；长演出转 mp4。
