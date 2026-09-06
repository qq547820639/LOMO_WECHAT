# PAG_BAKE_PLAN

> 2026-09-05 选型评估与执行计划。以下第一节是当日的历史基线；P0-1/P0-2/P0-3/P1 已于 2026-09-06 完成，当前状态以文末执行记录和 `docs/IMPLEMENTATION_STATUS.md` 为准。
> 规模口径：APK 内 PAG 共 **60.6MB / 535 文件**（逐文件策略表 data/asset-conversion-report.csv，策略行 469 条 "PAG→帧序列/图集或远端视频"）；归档可直接用于工具链开发的样本 **99 个**（evidence/apk_assets_sample/assets/pag/，含 marbles/launch_click.pag 等）。

## 一、代码核查结论（2026-09-05 历史基线）

| 文档声称 | 实际核查（2026-09-05） | 结论 |
|---|---|---|
| "客户端图集帧动画渲染路径（占位纹理→图集替换零代码改动）已交付"（ASSET_MIGRATION.md:31、IMPLEMENTATION_STATUS 平台表） | 2026-09-05 基线核查：client/src 当时 `drawImage` **0 处**、`atlas` **0 处**；ui/widgets.ts 仅矢量绘制 | ✅ **已解决**——后续已补齐图像层、FrameClip 与 bundle 验收 |
| "AssetManager manifest/hash/LRU 就绪，接入即切"（EXTERNAL_BLOCKERS #5） | 2026-09-05 基线核查：当时 TS 源 `AssetManager` **0 处** | ✅ **已解决**——后续已补齐 AssetManager、LRU 和 manifest 校验 |
| "烘焙执行需图形工具链（libpag 渲染端/TexturePacker）"（asset_pipeline.ts:7 自述"不实际解码"） | 属实：tools/asset_pipeline.ts 仅输出策略 CSV 与统计 | ✅ 如实 |

> 当前复查：客户端图像层、`AssetManager`、`FrameClip`、图集构建和视频桶均已实现并通过 verify；上表仅保留选型当日的核查证据。

**影响**：PAG 落地的第一优先级不是烘焙工具本身，而是**客户端图像渲染层 + AssetManager**——当前客户端是纯矢量立即模式 UI，没有画图能力，烘焙产物再多也无渲染入口。

## 二、路线对比

### Route A：无头烘焙 → PNG/WebP 图集（推荐主路）

离线把 PAG 逐帧渲染成 PNG 序列 → 打包图集 + JSON 元数据 → CDN bundle 下发 → 客户端 FrameClip 播放。

- **可行栈（联网核实）**：puppeteer（headless Chrome 自带 SwiftShader WebGL）+ 官方 libpag-web（WASM+WebGL）渲染逐帧 → canvas 截图导出 PNG。比 native headless-gl（macOS ARM 编译坑多）更稳，无 native 依赖。
- 优点：客户端零运行时依赖；低端机性能最好（纯 drawImage）；与既有三级策略表/CDN bundle 规划完全一致；离线渲染结果跨设备一致。
- 缺点：需搭建烘焙管线（spike 1-2 天量级）；光栅图多的 PAG 帧序列体积需用 WebP 有损 + 12-20fps 降帧压制。

### Route B：libpag 运行时（WASM）直接播放 .pag

- **官方支持现状（联网核实）**：
  - 微信**小程序**有官方 SDK `libpag-miniprogram`（WASM+WebGL，官方标注 **alpha**；npm 包含 wechat/lib/ 产物）。
  - 微信**小游戏**无官方一等 SDK：需自适配（wx.createCanvas 的 WebGL canvas + WXWebAssembly；libpag.wasm.br 约 2-3MB，主包放不下，须 CDN 下载后实例化）。
  - 实务坑：微信网络请求对 `.pag` 后缀有限制，线上需改名（如按 .png 后缀承载）。
- 优点：无需烘焙，像素级还原原始矢量动画，动态内容可编程。
- 缺点：alpha 成熟度；低端机 CPU/内存成本；469 文件全量在线加载流量大；与立即模式 UI 合成需独立 WebGL canvas 分层；2-3MB WASM 依赖。

### 结论

**A 为主、长演出走 mp4（三级策略第 3 级）、B 仅作兜底 spike**。B 的合理适用面只剩"长演出全屏动画"，而该类按既有策略本就规划为远端视频，故 B 不进入关键路径。

## 三、执行计划

| 序 | 任务 | 内容 | 验收 |
|---|---|---|---|
| P0-1 | 客户端图像层 | **✅ 已完成（2026-09-05）**：① Draw 接口 `drawImage`（client/src/ui/widgets.ts:18，UI.image 封装 :88-89，主循环逻辑坐标缩放代理 client/src/app/main.ts drawImage 分支）；② FrameClip 帧动画播放器（client/src/ui/frame_clip.ts:24，帧事件 onFrame/onDone、loop/once、fitHeight 自适应、缺图占位）；③ AssetManager（client/src/core/assets.ts:54，manifest 版本/LRU 双预算驱逐/占位兜底 + validateManifest）；④ 真实 APK 矿工帧 demo（game-assets/miner/ 8 帧 webp 420x420，构建期打入 assets/game/ + manifest.json，tools/src/build_wechat.ts copyGameAssets + WebP 头尺寸解析）；⑤ 接入位：主城大厅 + 黄金矿场屏 | 验收实测：单测 manifest 校验+LRU 驱逐+帧数学（tests/unit_assets.ts 全绿）；无头集成 drawImage>0（tests/integration_client.js）；wx bundle 冒烟真实走完 启动→合规门→点击→登录→首页→图集帧渲染全链路（tools/src/verify.ts bundle-smoke，drawImage>0 断言） |
| P0-2 | 烘焙 spike | tools/bake_pag.ts + bake/render.html：puppeteer 驱动 libpag-web，输入 99 个样本 .pag → 输出 PNG 序列 + 每文件帧数/尺寸/耗时报告 | ✅ **完成（2026-09-05）：99/99 成功**，报告 docs/BAKE_REPORT.md（数据 data/bake-report.json） |
| P0-3 | 图集打包 | **✅ 已完成（2026-09-06）**：① MaxRects-BSSF 在线打包器（tools/bake/maxrects.mjs，纯 JS ESM 浏览器/Node 单实现双端）；② 烘包一体（render.html __bakeAtlas：降帧 15fps + 流式打包 + 满页导出 WebP）；③ 形态 A manifest（tools/src/build_wechat.ts copyGameAssets 探测 meta 分片 → 单 sheet 条目）；④ 弹珠屏真实消费图集（client/src/features/minigame_screens.ts MarblesScreen launch_click 待机静帧+发射播放）；⑤ 韧性：libpag VideoReader WASM 堆泄漏（25-35 文件/renderer 必死）→ 24 文件/分片 flush + 整浏览器重启 + 崩溃扣帧诚实口径 | 验收实测（docs/ATLAS_REPORT.md）：72/99 文件打包（27 超大件入视频桶）、1265 帧/78 张 2048² WebP（12.3MB，理论下限 35 张）、**10 样本×全帧 WebP 往返像素比对 maxMeanAbsDiff=1.03%**（<2% 一致线，替代人工逐帧比对的可量化版本）、无头满帧基准 0.005ms/帧（3 图集×900 次子矩形 drawImage，headless ANGLE Metal 非真机） |
| P1 | 全量批量 | 按 asset-conversion-report.csv 策略列批处理 469 文件：短循环 UI→12-20fps WebP 图集；人物动作→packed atlas + clip；长演出→ffmpeg 合 mp4 上 CDN | ✅ **完成（2026-09-06）：全量 535 文件实跑**（assets/pag 469 + tug/blockBattleRoyal/dagger/beast/robbery 66），bake 0 失败；图集 326 打包 / 209 视频桶 / 478 张 2048² WebP 共 65MB，maxRoundTripDiff 1.03%，1 次 renderer 崩溃自愈恢复；**mp4 转换完成**（2026-09-06：209/209 编码成功共 42MB，evermeet 静态 ffmpeg，见 ATLAS_REPORT 补充节） |
| P2 | 兜底 spike（可选） | libpag-miniprogram wasm 放分包，验证启动耗时/内存/兼容性，作为长演出备选 | spike 报告（仅当 P1 长演出 mp4 方案不达标时推进） |

### P0-2 结果摘要（2026-09-05，详见 docs/BAKE_REPORT.md）

- **99/99 样本烘焙成功**，3165 帧渲染，吞吐 12 帧/秒，全程 4 分 34 秒（headless Chrome WebGL，ANGLE Metal 后端）。
- 体积：样本 PNG 序列 863MB / **WebP 序列 126MB（PNG 的 15%）**；按 PAG 字节等比外推全量 535 文件：PNG ≈ 13.5GB、**WebP ≈ 1.9GB（未含图集打包收益）**。
- **对 P0-3 的决策输入**：原始帧序列全量直发不可行（WebP 外推 1.9GB），打包器必须同时做三件事——① fps 降至策略表 12-20（样本按原 fps 渲染，体积含冗余）；② MaxRects 图集打包（消除帧间空白与重复）；③ 超大件（如 marbles/swing natural=751 帧、boss_circle 1000×1000×75 帧）改走 mp4 远端视频。
- 实现踩坑（已钉死在 tools/bake/render.html 头注与探针）：PAGPlayer 须 `create()` 工厂；PAGSurface.fromCanvas 对动态 canvas 存在"创建即销毁态"缺陷（updateSize 无效、flush=false、readPixels=null）；稳定路径为 PAGView.init + setProgress/flush/makeSnapshot。

## 四、风险

| 风险 | 缓解 |
|---|---|
| 光栅图层多的 PAG 帧序列体积超预算 | WebP 有损 + 按策略表降帧（12-20fps）+ 体积预算表回归校验 |
| SwiftShader 离线渲染与真机色彩差异 | 烘焙产物是 PNG，运行时仅贴图，天然规避实时渲染差异 |
| P0-1 与既有立即模式 UI 的合成层级/触控命中冲突 | FrameClip 输出仍走每帧绘制 + hits 注册，不引入事件穿透 |
| 文档债复发 | 本文件与 IMPLEMENTATION_STATUS/EXTERNAL_BLOCKERS 已同步修正，后续"声称就绪"须附 file:line 证据 |
