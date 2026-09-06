# ASSET_MIGRATION

> 管线：tools/src/asset_pipeline.ts（npm run gen:assets）。报告产物：data/asset-manifest.json / asset-conversion-report.csv / asset-duplicate.csv / asset-missing.csv / asset-pipeline-stats.json。

## 覆盖验收（Section 87：14,092 全覆盖）

14,092 条 APK 资源全部被分类（data/assets.json），零"无状态"资源：

| 分类 | 数量 | 处理 |
|---|---|---|
| converted | 1,496 | PAG/Lottie/音频——策略表逐文件生成 |
| mapped | 1,624 | 帧序列/玩法资源同名映射 |
| third-party | 641 | 不移植：libjiagu/SDK dat/密钥/穿山甲等由平台能力替代 |
| unused / android_res | 10,331 | 未引用或 Android 原生布局（UI 由小游戏重写），保留索引 |

## 真实提取验证

`asset_pipeline --apk <原APK> --out evidence/apk_assets_sample` 实际执行：
- **3,524 个 assets/ 游戏资源全部解压成功**（extract-report.json 记录）
- 归档保留 440 个代表性样本（pag/lottie/png 序列帧/mp3/字体/tug/blockBattleRoyal/dagger，8.8MB）作为管线与烘焙工具开发的输入
- 重复资源检测：asset-duplicate.csv

## PAG 策略（60.6MB / 535 文件，Section 14）

依赖 libpag.so 不可用 → 三级策略（逐文件策略见 asset-conversion-report.csv）：

1. **短循环 UI**（按钮/特效/图标动）→ 12-20fps 帧序列 → WebP 图集
2. **人物/战斗动作**（battleRoyal 杀手、monkeyFight、escape_animal 73 个）→ 帧序列 → packed atlas → animation clip（帧事件驱动）
3. **长演出**（大额奖励/开箱全屏）→ 远端视频或序列帧流

烘焙执行（PAG 解码渲染→PNG 序列→图集打包）需要图形工具链（libpag 渲染端/PIL/TexturePacker），属像素产能问题而非架构问题；客户端渲染侧已实测就绪（2026-09-05，P0-1 落地；**2026-09-06 勘误：包内图集/帧曾为原版派生，已按 SANITIZATION_ASSESSMENT P0 全量替换为自绘 PNG 帧与程序化特效，下述「真实 APK 矿工帧」表述为历史记录**）：Draw.drawImage（client/src/ui/widgets.ts:18）+ FrameClip（client/src/ui/frame_clip.ts:24，支持 packed atlas 子矩形与逐帧文件两形态）+ AssetManager（client/src/core/assets.ts:54，manifest/版本/LRU/占位兜底）；真实 APK 矿工帧序列（game-assets/miner/ 8 帧）经构建管线打入包内并在主城/矿场屏实际渲染（verify bundle-smoke drawImage>0 断言）。烘焙产物按 manifest 形态 A（packed atlas）接入即播。

## 视频资产处置（2026-09-06 脱敏补充）

209 个原版 PAG 烘焙 mp4（tools/bake/out/video/，44MB）与 2 个样例（evidence/video_samples/）法律性质 = **原版派生美术**（同图集字节，P0 级）。
处置：**私有研究档案**——git/ZIP/构建产物零暴露（已核查），目录内附 PRIVATE_ARCHIVE_NOTICE；原「长演出转 mp4 上 CDN」计划作废，产品若需长演出动画须以自制内容重制或完成权利清理。data/video-report.json（转换元数据）属 P1-6 逆向清单口径：研究 ZIP 内保留、外发受限。

## 图集打包实测（P0-3，2026-09-06，docs/ATLAS_REPORT.md）

全量烘包已完成：535 文件 0 失败，326 文件进入 478 张 2048² WebP 图集（65MB），209 个超大件进入视频桶（42MB）；WebP 往返像素损失 ≤1.03%，客户端 marbles/launch_click 图集按形态 A 入包并由 bundle-smoke + integration 断言。早期 99 文件样本统计保留在 `docs/ATLAS_REPORT.md` 作为方法学证据。

## Lottie 策略（15.8MB / 869 文件）

- <100KB 且纯 UI（如 brickSelf/brickOther 状态标）→ 运行时轻量解析
- 其余（含 1.5MB+ 大件）→ 烘焙 sprite atlas
- 同样以策略表先行，烘焙工具同 PAG 通道

## 音频（25MB / 158 文件）

统一转码 mp3（SFX 48kbps / BGM 96kbps）→ InnerAudioContext；BGM 流式、SFX 常驻缓存（AudioManager 已实现同名 80ms 防爆音、前后台挂起恢复）。

## 包体策略（Section 48）

- 主包=启动+核心 UI（本包编译 JS 数百 KB 级）
- 玩法资源按 bundle（ape/battle/universe/minigames/collection）CDN 下发 + content-hash + LRU 缓存
- AssetManager 预留 manifest 版本/缺图占位（程序化纹理）→ 资源接入后自动切换
