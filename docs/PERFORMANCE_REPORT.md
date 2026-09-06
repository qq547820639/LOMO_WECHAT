# PERFORMANCE_REPORT

> 实测环境：Node 26（Apple Silicon，darwin 27 arm64）。真机数据待微信开发者工具/真机（见 EXTERNAL_BLOCKERS）。

## 实测数据（verify 自动运行，docs/TEST_REPORT.md 同步）

| 指标 | 数值 | 说明 |
|---|---|---|
| 无头启动+登录+bootstrap+两局完整玩法+17 屏导航 | 325-440ms | integration-client 步骤总耗时（含进程内服务端） |
| 首帧渲染（bundle 冒烟） | <1 帧延迟内出 HUD | drawCalls 300+/秒级帧循环正常 |
| 服务端 action 往返（进程内） | ~1ms 级 | HTTP 模式另加网络 RTT |
| 渲染吞吐 | 4229 drawCalls / 17 屏导航+2 局玩法，无泄漏报错 | 立即模式每帧重建命中表，屏幕切换 O(1) |
| FULL CLONE 包体积 | 见 TEST_REPORT（数百 KB 级） | 不含任何 APK 资源 |
| RELEASE 包体积 | 同级 | 与 FULL 差异仅为配置文件 |

## 微信小游戏预算（Section 88 最低预算基线）

| 指标 | 预算 | 现状 |
|---|---|---|
| 冷启动→首帧 | <3s | 主包数百 KB，预期大幅优于预算；真机实测待补 |
| 首屏可交互 | <5s | Node standalone 验收为即装即玩；微信真机需远端 HTTPS 服务端并待实测 |
| 内存 | <150MB | 无大图集常驻；帧动画按 bundle 懒加载+LRU（槽位就绪） |
| FPS | ≥50 中端机 | 立即模式 UI 绘制量低；重动画面页依赖图集烘焙后的批渲染 |
| bundle 加载 | 按需+缓存 | AssetManager manifest/hash/LRU 结构就绪 |

## 内存治理（Section 50）

- 屏幕 onExit 释放引用；Router pop 即弃（无全局屏幕缓存）
- AudioManager SFX 常驻小缓存 + release() 全清；BGM 前后台启停
- PAG→图集产物按 bundle 懒加载，禁止只载不放（策略已定，随图集接入生效）

## 风险

1. 图集/视频桶已生成，真实微信机型上的体积、解码内存和首屏加载仍需实测
2. 弹珠/虎口逃生在高 DPI 低端机 fillText 频次 → 已有帧内文本缓存空间，必要时引入位图字体
3. 真机 socket 延迟（大逃杀轮转同步改 realtime 时）→ 已有 seed/seq/replay 结构，迁移成本低
