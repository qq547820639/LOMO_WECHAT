# SANITIZATION_ASSESSMENT（待脱敏资产评估清单）

> 评估日期 2026-09-06 · 方法：双路全仓深扫（入包层 + 归档/数据层，只读）+ 逐文件性质判定。
> 目标：作为后续脱敏工作的**唯一依据清单**。本文件只评估不改码（整改按优先级另行执行）。
> 风险分级：**P0**=法律红线，任何对外发布/上传前必须处置；**P1**=高，仓库/ZIP 对外分发前必须处置；
> **P2**=中，自有品牌部署前处置；**P3**=低，记录并接受。
> 暴露面三轴：**包**（进微信小游戏产物到终端用户）/ **git**（进仓库历史）/ **ZIP**（随研究交付包分发）。

## 总览

| 级别 | 项数 | 一句话结论 |
|---|---|---|
| P0 | 4 | **原版美术字节直接进发布包**（提取帧+烘焙图集+元数据），git 已跟踪 |
| P1 | 9 | 原版素材样本/完整逆向清单/第三方主体标识进 git 历史与 ZIP；133 个原 Activity 名渲染给用户 |
| P2 | 5 | 原版代币名 NDTU 用户可见、品类词 17 处、工程标识符、自我披露描述 |
| P3 | 5 | 通用品类词、已自有化文案、gitignore 已正确隔离的大体积物（附分发流程注意事项） |

---

## P0（法律红线 —— 部署/上传微信平台前必须处置）

| # | 资产 | 位置 | 敏感类型 | 暴露面 | 原因与建议动作 |
|---|---|---|---|---|---|
| P0-1 | 原版美术帧 `miner/f00–f07.webp`（8 文件 32,178B） | `build/wechat-*/assets/game/` + `game-assets/miner/` | **原 APK 美术逐字复制**（黄金矿场 miner 原序列 1591 帧中提取） | 包✅ git✅ ZIP✅ | 原版美术字节随发布包分发=直接侵权物证。动作：从 game-assets/ 与包构建中移除，客户端回退程序化占位 Miner 动画；原始帧转私有证据存储 |
| P0-2 | 原版 PAG 烘焙图集 `atlas/marbles/sheet_000/001/004.webp`（443KB，126+帧） | 同上 + `game-assets/atlas/marbles/` + `evidence/atlas_samples/`（git 跟踪） | **原版美术的衍生渲染**（可直接复原原版视觉） | 包✅ git✅ ZIP✅ | 同上。动作：包内移除、evidence 样张移出 git；478 张全量 sheet 本身不在仓库（见 P1-8 磁盘注意事项） |
| P0-3 | 图集元数据 `marbles.meta.part06/24.json` + `manifest.json` 帧名 | 包内 assets/game/ | **原版内部数据**：meta 含原版内部路径 `atlas/pag/marbles/`；帧名为原 PAG 动画名（launch_click/launch_long_click/spring 等） | 包✅ git✅ | 元数据泄露原版内部目录结构与资源命名。动作：随 P0-2 一并移除；manifest 保留结构模板、内容脱敏 |
| P0-4 | 上述全部的 **git 历史污染** | 仓库历史（game-assets/ 16 文件、evidence/atlas_samples 13 文件等已提交） | 同上 | git✅ | 仅删工作区文件不删历史则侵权物仍在仓库历史中。动作：`git rm --cached` + gitignore + 视需要 `git filter-repo` 清史（或弃库重建） |

## P1（高 —— 仓库/ZIP 对外分发前必须处置）

| # | 资产 | 位置 | 敏感类型 | 暴露面 | 原因与建议动作 |
|---|---|---|---|---|---|
| P1-1 | `evidence/apk_assets_sample/`（440 文件 8.8MB：99 个原版 .pag、原版 mp3×33/wav×5、原版角色 png/webp、字体、加固标记 .jgapp） | evidence/ | **原版素材逐字复制** | git✅ ZIP✅ | 最大宗原版素材样本，已在 git 历史。动作：git rm --cached + gitignore；研究需要时改私有存储按需分发 |
| P1-2 | `evidence/bake_samples/`（84 文件 804KB 原版烘焙帧）、`evidence/atlas_samples/`（13 文件 2.8MB）、`evidence/video_samples/`（2 个原版烘焙 mp4） | evidence/ | 原版美术衍生渲染 | git✅ ZIP✅ | 同 P1-1 处置 |
| P1-3 | 133 个原版 Activity 名（含 `LomoDeviceDetailActivity`/`LomoLotteryActivity`）经客户端 `PolicyScreen`「APK 原始证据」面板**渲染给终端用户** | `shared/src/gen/data.gen.*`（release 包 36 个可见 feature、101 条） | 原版内部页面清单 | 包✅ git✅ | 内部数据外泄且用户可见。动作：release 构建剥离 evidence 字段渲染（PolicyScreen 研究开关化），或 data.gen 分层（研究字段独立文件不入 release） |
| P1-4 | `data/apk_summary.json` 字段 `certificate_cn: "yqkj_lomo"` + **证书 SHA-256 全指纹** | data/ | 第三方签名主体标识 | git✅ ZIP✅ | 证书指纹可唯一锁定原版权属主体。动作：字段脱敏（指纹截断或移除），原文转私有证据 |
| P1-5 | `evidence/runtime-evidence/03_privacy_webview.png`（明文：第三方主体全称/注册地址/邮箱 niudantu@163.com）及 01/02 截图（原版 UI/原画） | evidence/runtime-evidence/（4 文件全跟踪） | 第三方商业标识+公开联系方式 | git✅ ZIP✅ | 公开信息但属第三方主体标识，仓库分发应最小化。动作：截图移出 git 或对主体信息打码；文字概述已隔离于 RUNTIME_EVIDENCE 声明下可留 |
| P1-6 | 完整结构化逆向清单：`data/routes.json`（680 Activity）、`data/assets.json`+`asset-manifest.json`（14,092 条原文件路径/大小）、`asset-conversion-report.csv`、`evidence/cleanroom/evidence/first-party-activities.txt`（567 行）、`evidence/full_clone/*.csv`（14,093 行清单） | data/ + evidence/ | 原版内部数据（完整逆向成果） | git✅ ZIP✅ | 研究本体，但对外分发=交付完整逆向地图。动作：仓库内保留（研究需要）；对外分发改摘要版（计数+分类统计），全量清单走私有 |
| P1-7 | `evidence/runtime-evidence/logcat_login_session.txt`（4,821 行原版运行日志，含快手/穿山甲等三方 SDK 日志） | evidence/runtime-evidence/ | 原版运行时内部数据 | git✅ ZIP✅ | 已核实无明文设备标识，但仍是原版运行日志。动作：摘要化（保留域名/Activity 结论行）或移出 git |
| P1-8 | 磁盘大体积原版派生物：`evidence/lomo_4.3.7.apk`（262MB）、`evidence/apk_assets/`（141MB 全量抽取含 535 PAG/jks 密钥库）、`tools/bake/out/video/`（209 个原版烘焙 mp4 43.8MB） | 磁盘（gitignore ✅） | 原版素材/衍生 | git❌ **磁盘整目录交付会带出** | gitignore 挡得住 git 挡不住 rsync/整目录打包。动作：分发一律走本评估固化的排除清单（node_modules/dist/build/.git/tools/bake/out/tools/bin/evidence/apk_assets/evidence/lomo_4.3.7.apk 等） |
| P1-9 | 附带技术缺陷：marbles manifest 指向 **0 字节** `sheet_002/003`，非空 `sheet_000/001` 未被引用（386KB 死重 + 包内 marbles 图集运行时必加载失败回退占位） | 包内 assets/game/ + game-assets/ | 完整性缺陷 | 包✅ | 非敏感但直接影响发布质量。动作：随 P0-2 移除包内图集后自然消解；若保留图集路线则修构建器引用 |

## P2（中 —— 自有品牌部署前处置）

| # | 资产 | 位置 | 敏感类型 | 暴露面 | 原因与建议动作 |
|---|---|---|---|---|---|
| P2-1 | 资产 ID `NDTU`（原版代币名，扭蛋兔缩写派生）宇宙屏余额可见；`ASSET_CATALOG.evidence` 注释含原 Activity 名（未渲染但随包） | `shared/src/assets.ts` + universe 屏 | 原版商业命名 | 包✅ git✅ | 改自有名（如 STARDUST/星尘）+ 账本资产迁移映射；evidence 注释转研究文档 |
| P2-2 | 通用品类词 17 处用户可见：Tab「潮玩/猿宇宙」、屏名「猿宇宙矿场」、NPC「潮玩酱」、商品「潮玩手办」 | main.ts/hubs.ts/econ_screens.ts/app.ts/commerce.ts | 原版用词风格（通用品类词，可辩护但非必需） | 包✅ | 求稳统一品牌化（潮玩→收藏/乐园，猿宇宙→猿岛全域）；最低限度改 NPC「潮玩酱」与商品名 |
| P2-3 | storage keys `lomo.compliance.ack.v1`/`lomo.client.cache` ×3 + env `LOMO_PROFILE/LOMO_SECRET/LOMO_ALLOW_ADMIN` 进包 | client/social+compliance、server/app | 工程标识符（含原项目名） | 包✅ | 部署换牌时一并改（与 brand.ts 同批）；注意 storage key 改名需存档迁移 |
| P2-4 | `project.config.json` description「migration research build」自我披露研究性质 | wechat/ + build 包 | 自我披露 | 包✅ | 部署时改自有描述（提审语境下不应自述"逆向迁移研究"） |
| P2-5 | full-clone 包 `config.json` 的「完整复刻 APK 4.3.7」表述 + README「研究沙盒构建（FULL CLONE）」 | build/wechat-full-clone/ | 自我披露 | 包✅（仅研究包） | full-clone 为内网研究构建可保留；**严禁**该包外发/提审（已有 warning 字段，建议再加显式禁止分发言语） |

## P3（低 —— 记录并接受）

| # | 资产 | 结论 |
|---|---|---|
| P3-1 | 机制名词（猿卡/星球卡/金沙/矿石/猿石/地下城等） | 通用品类/机制词，保留 |
| P3-2 | 邮件/分享/公告/欢迎文案 | 已自有化（brand.ts），✓ |
| P3-3 | 包内 manifest 结构、base 命名 `assets/game/` | 自有命名 ✓（帧名归 P0-3） |
| P3-4 | 个人信息：包内 0 命中；logcat 无明文设备标识（92 个标识符模式命中均为空值/拒访） | ✓ |
| P3-5 | NPC 昵称 8 个中 7 个为自创（「潮玩酱」归 P2-2） | ✓ |

## 文档失实修正项（本轮评估发现的既往文档偏差）

1. **ASSET_MIGRATION.md「正式包内当前为程序化占位与自有烘焙图集」——不实**：图集是原版 PAG 的烘焙渲染（P0-2），非自有美术。须改为「原版派生，见 SANITIZATION_ASSESSMENT P0-2」。
2. **ATLAS_REPORT/外部表述「478 张 sheet 在 tools/bake/out/atlas/」——已失实**：该目录现不存在，磁盘上仅 `tools/bake/out/video/`（209 mp4）；478 sheets 数据仅存于 data/atlas-report.json。
3. **mp4 状态**：此前文档称「209 超大件待 ffmpeg 转换」，实际 `tools/bake/out/video/` 已有 209 个 mp4（44.9MB）且 `evidence/video_samples/` 有 2 个样例（data/video-report.json 在案）——状态应更新为「已转换，待上 CDN」。
4. `.gitignore` 第 13/15 行重复（`evidence/lomo_4.3.7.apk` 两条）。

## 建议执行顺序

1. **第一批（P0，发布阻断）**：包构建器移除原版派生资产 → game-assets 原版文件移出 git（含 filter-repo 决策）→ 客户端占位回退验证（verify 需同步改断言）。
2. **第二批（P1，分发阻断）**：evidence 四类样本 git rm --cached + gitignore → apk_summary 证书字段脱敏 → PolicyScreen evidence 渲染 release 开关化 → 截图打码或移出。
3. **第三批（P2，部署前）**：NDTU 改名迁移、品类词品牌化、storage/env 标识符、描述字段。
4. **持续**：对外分发一律使用固化排除清单；ZIP 里 L2 研究层内容仅向研究者本人交付。

> 评估依据：双路深扫原始报告（入包层 agent 报告 + 归档层 agent 报告，2026-09-06）；本文件为唯一整改依据，整改完成后应在本文件追加「处置记录」并复扫归零。


---

## 处置记录（✅ 2026-09-06 全量执行）

### 方案对比与裁决（按资产类别）

| 类别 | 直接修改（编辑敏感字段） | 整体替换（自制内容） | 裁决 | 理由 |
|---|---|---|---|---|
| 美术字节（P0-1/2） | 侵权客体是像素本身；涂改后仍为原版美术演绎物，法律更差且视觉残破 | 纯代码程序化动画 + 自绘 PNG，零派生 | **整体替换** | 只有彻底自有化才能消除演绎物属性 |
| 结构化字段（P0-3/P1-4/P2-3/P2-4） | 文件结构与数值自有，敏感仅在个别字段；就地改字段工作量最小、功能零损 | 换整文件反而破坏功能 | **就地修改** | 最小改动原则 |
| 研究语料（P1-1/2/6/7、P1-5 截图、P1-8） | 涂改摧毁研究价值；440+ 文件逐个编辑不现实 | 不适用（本体即证据） | **本体私有化**（移出 git/ZIP，本地保留） | 控制分发面而非破坏证据 |
| 渲染面（P1-3） | 生成器与渲染开关处就地剥离 | 不需要 | **就地修改** | 同上 |

### 执行明细

- **P0-1/P0-2 ✅**：新增 `tools/src/gen_placeholder_art.ts`（纯 JS PNG 编码器 + 几何构图）生成 8 帧 64×64 自绘矿工动画替换原提取帧；`game-assets/atlas/`（原版烘焙图集+meta）整目录删除；弹珠发射特效改为 `client/src/ui/procedural_clips.ts LaunchPulse`（纯 Canvas 矢量，接口与 FrameClip 对齐）；黄金矿场/主城矿工动画改用自绘帧（原功能保留：同 manifest/同 atlasId/同帧数）。
- **P0-3 ✅**：随图集移除消解（meta/原帧名不再存在于包与仓库）。
- **P0-4 ✅**：git 历史重建——先 `git bundle` 全量备份至工作区外（`../lomo-history-backup.bundle`，研究存档），再 orphan 单提交重建 + reflog expire + gc prune，旧对象（含原版美术字节）从仓库中物理清除。
- **P1-1/2/5/7 ✅**：`evidence/apk_assets_sample|bake_samples|atlas_samples|video_samples|runtime-evidence` 全部 `git rm --cached` + gitignore（磁盘保留为私有研究档案）。
- **P1-3 ✅**：`gen_data.ts` 客户端 data.gen 剥离 evidence 字段（data/features.json 归档全文保留）；`PolicyScreen`「APK 原始证据」面板改为研究指针；`assets.ts` 20 条 evidence 注释净化（19 条映射 + 1 条前批已改），共享层 0 个原 Activity 类名。
- **P1-4 ✅**：`apk_summary.json`（cleanroom 源 + data 副本）certificate_cn/certificate_sha256 字段置 `[REDACTED]`。
- **P1-6 ✅（口径执行）**：逆向清单本体保留仓库（研究需要），分发限制固化于本文件与打包排除清单；对外分发须先抽稀。
- **P1-8 ✅**：分发排除清单固化（node_modules/dist/build/.git/tools/bake/out/tools/bin/evidence 私有档/*.zip/*.bundle）。
- **P2-1 ✅**：资产 `NDTU` → `STARDUST`（星尘），宇宙玩法/屏显/经济文档源/tuning 键同步。
- **P2-2 ✅**：Tab「潮玩→藏品」「猿宇宙→猿岛」、屏名「猿宇宙矿场→猿岛矿场」、NPC「潮玩酱→收藏酱」、商品「潮玩手办→手办模型」、hubs 生态文案两行。
- **P2-3 ✅**：env `LOMO_*` → `APP_*`（PROFILE/SECRET/DATA_DIR/ALLOW_ADMIN/SERVER_URL），storage key `lomo.*` → `app.*`，日志标签 `[lomo-server]`→`[game-server]`，类名 `LomoApp`→`GameApp`；DEPLOYMENT/QUICK_START/BACKEND_API 文档同步。
- **P2-4 ✅**：project.config description 去「research build」自我披露；full-clone 包 README 加「禁止对外分发或提审」。
- **P3 ✅**：机制词/自有文案维持；.gitignore 去重。

### 复扫结果（执行后）

- 源码（shared/client/server/tools）grep `潮玩宇宙|无聊猿|扭蛋兔|Activity 类名`：0（BRAND_AUDIT/RUNTIME_EVIDENCE 等 L2 文档除外）
- 双包 dist grep：`潮玩宇宙 0 / 无聊猿 0 / 扭蛋兔 0 / LOMO 0`（env 标识符已随 P2-3 更名归零）
- git ls-files：原版素材样本/烘焙样本/截图/logcat 0 跟踪；`git log` 单一洁净提交，旧对象已 prune
- npm test 6/6 · verify 10/10（bundle-smoke 全链路 + miner 自绘帧 drawImage 断言通过）
