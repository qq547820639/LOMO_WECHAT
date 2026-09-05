# EXTERNAL_BLOCKERS

> Section 73：真实外部阻塞（不影响其他工作持续推进，均已绕行）。

| # | 阻塞项 | 影响 | 绕行方案（已实现） | 解除条件 |
|---|---|---|---|---|
| 1 | 微信正式小游戏 AppID（当前 touristappid） | 无法真机预览/上传/域名配置 | 双产物以游客模式完整可玩（包冒烟通过） | 用户提供 AppID → project.config.json 替换 |
| 2 | 微信开发者工具 CLI / 真机 | 无法产出真机 FPS/内存/触摸实测 | Node 无头逐帧驱动测试 + 包体/启动预算表（PERFORMANCE_REPORT）；**Android 模拟器 runtime 证据已采集（2026-09-06，docs/RUNTIME_EVIDENCE.md：加固壳可运行/潮玩宇宙主体确证/云信 IM 域名）**——但微信小游戏侧的真机矩阵仍需开发者工具 | 环境接入后跑真机矩阵 |
| 3 | 出版审批（版号/备案主体） | WECHAT RELEASE 无法提审上线 | FULL CLONE/沙盒版完整交付；RELEASE 三层关闭就绪 | 资质到位 |
| 4 | 支付商户号/广告位 ID | mall mock 合同、广告槽位空转 | 订单状态机+幂等发货已按正式流建模 | 资质+ID 配置 |
| 5 | 正式 CDN/域名 | 资源走内置占位纹理 | **P0-1 已落地（2026-09-05）**：AssetManager 实现（client/src/core/assets.ts:54，manifest/版本/LRU/占位兜底），主城/黄金矿场已接真实 APK 矿工帧（game-assets/，构建期入包，verify bundle-smoke drawImage>0）；CDN 切换仅需改 manifest.base | 用户提供 CDN |
| 6 | 原正式服数值（概率/奖池/签名） | 无法证明与原服数值一致 | 全部 INFERRED 标注 + RemoteConfig 热替换 | 抓包/运营配置/原服数据 |
| 7 | 本轮会话外网检索不可用 | COMPLIANCE_CURRENT 无法二次复核官网 | 沿用 2026-09 cleanroom 检索基线+最严默认 | ✅ **已解除（2026-09-05）**：联网复核完成，详见 docs/COMPLIANCE_CURRENT.md 复审记录；产出 2 个新增 P0 工程项（启动合规页、隐私授权交互层） |
| 8 | PAG→图集图形工具链（libpag 渲染端/TexturePacker） | 60MB PAG 未完成像素级烘焙 | 逐文件策略表+440 样本+归档 99 个 .pag 样本 | ✅ **工程侧已解除（2026-09-05）**：bake 工具链落地（tools/src/bake_pag.ts + bake/render.html），99/99 样本烘焙成功（docs/BAKE_REPORT.md）；剩余为 P0-3 图集打包产能任务（非阻塞） |

**无阻塞项阻止本工程继续开发**——以上全部有替代路径，主循环可玩、可测、可构建。
