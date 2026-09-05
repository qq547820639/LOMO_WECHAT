# ARCHITECTURE

```
┌────────────────────────── 微信小游戏运行时（或 Node 测试） ──────────────────────────┐
│  client/src/app/main.ts  LomoClientApp                                              │
│   ├─ 引擎循环: platform.onFrame → frame() → HUD/TabBar/Screen.render/Modal/Toast     │
│   ├─ Router: 5 Tab 潮玩/猿宇宙/游戏/交易/我的 + push/pop 屏幕栈（680 路由映射的宿主） │
│   ├─ UI: 立即模式组件库（button/panel/progress/scroll/modal + 命中分发）             │
│   ├─ AudioManager (BGM/SFX/生命周期)      AssetManager(占位→CDN)                     │
│   └─ ApiClient → Transport                                                               │
│        ├─ HttpTransport (wx.request, 重试/超时/错误码映射) → 远端参考服务端             │
│        └─ InProcessTransport (进程内 LomoApp 路由直调) → standalone 构建/无头测试       │
├──────────────────────────────────────────────────────────────────────────────────────┤
│  shared/src  资产目录 · Ledger(服务器权威·幂等·原子批) · sfc32 RNG(seed+fork) ·        │
│              RemoteConfig/ReleaseProfile · 协议 DTO · 注册表类型                        │
├──────────────────────────────────────────────────────────────────────────────────────┤
│  server/src/app.ts  LomoApp（无 node 原生顶层依赖 → 可在小游戏进程内运行）              │
│   ├─ Auth(wx.login code→服务端派生 openId→token) / Compliance(实名·防沉迷·时段)        │
│   ├─ Store(玩家/会话/邮件/挂单/排行/历史/遥测/审计 + JSON 快照) + Ledger                │
│   ├─ /v1/game/session/start|action|finish（seed 派生 RNG·serverSeq·重放令牌·幂等）     │
│   ├─ games/ 22 个 FeatureGame（battleRoyal/undertown/arena/boss/monkeyFight/dagger/    │
│   │   robbery/apeMine/goldMine/multiplePit/universe/warcraft/escapeTiger/chicken/      │
│   │   marbles/sports/tug/monkeyKing/cards/gacha/box/daily）                            │
│   └─ commerce: market/consignment/auction(沙盒) · mall(mock 支付合同) ·                │
│       settlement(沙盒桥) · agent(沙盒模型)                                             │
│  server/src/index.ts  node:http 入口（独立部署时使用）                                  │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

## 关键设计

1. **服务器权威（Section 45）**：一切资产变动走 `Ledger.apply/applyBatch`（balanceBefore/After、幂等键、原子批）；客户端 EconomyOps 只做展示。失败动作返回 `{ok:false}`（tests 验证）。
2. **确定性 RNG（Section 46）**：会话 start 颁发 seed；每次 action 用 `Rng(seed).fork(serverSeq+1)` 派生——fork 为纯函数式（种子标签+nonce），**重放不依赖调用时序**。finish 颁发 replayToken（HMAC）。
3. **双层可运行**：`app.ts` 顶层不 import node:*（fs/crypto 全部 lazy）→ 同一份编译产物既做 HTTP 服务端，也内嵌进微信包做单机模式；tests 以进程内直调驱动全部玩法。
4. **三层关闭（Section 61）**：RELEASE 下现金类功能 = 客户端入口不注册 + 服务端 `FEATURE_DISABLED`（release_safety 测试 9 条 API 全拦截）+ `RELEASE_LOCKED_FLAGS` 远程配置锁 + `RELEASE_FORBIDDEN_ASSETS` 发放守卫（直接 grant 抛错）。
5. **数据驱动页面**：48 功能族来自 `data.gen`（由 680 CSV + 44 族注册表生成），Tab 枢纽按 FEATURES 自动生成；cut/defer 族渲染 PolicyScreen（诚实呈现策略+证据），不做假页面。
6. **RemoteConfig**：`tuning-baseline.json`（全部 INFERRED 标注）经 bootstrap 下发带签名（HMAC）；玩法用 `ctx.num('battleRoyal.baseDoorHp', fallback)` 读取，原值替换零代码改动。
