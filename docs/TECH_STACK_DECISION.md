# TECH_STACK_DECISION

**裁决：保留原生 TypeScript + Canvas 2D 立即模式 UI，不迁移 Cocos Creator。**

## 决策依据（基于本轮工程审查的实测）

1. **cleanroom 基线只有 274 行 TS**（CanvasApp 42 行 + 状态机）。它不是"已有 Canvas 资产投入巨大"的情形，迁移成本论据不成立；但反过来，正式工程在本轮已把服务端 22 个玩法动作、协议契约、680 路由数据层全部建立在"引擎无关"的 TS 模块上（shared/ 可被任何渲染层复用）。
2. **本项目的渲染负担特征**：680 页面中绝大多数是 表单/列表/卡片/格子/进度 条类 UI（商城、记录、卡牌、矿场、市场），真正重动画的是 PAG/Lottie（合计 76MB，见 ASSET_MIGRATION——其策略是**预烘焙为帧序列图集**，烘焙后即与引擎无关）。Canvas 2D + 立即模式 UI 对列表/格子类页面生产效率高于场景树引擎。
3. **包体与启动**：微信小游戏主包 4MB 红线。Cocos 引擎 runtime 空载 ~1.2-1.8MB；本工程全量编译 JS 约 300KB 级，主包压力小一个量级。
4. **可测试性**：立即模式渲染 + PlatformAdapter 抽象使全部页面可在 Node 无头环境逐帧驱动（tests/integration_client.js 实测 4229 drawCalls），Cocos 需要额外的 headless 适配层。
5. **升级路径保留**：PlatformAdapter/Renderer 均为接口；若后续必须迁移 Cocos/Laya，玩法服务端(shared+server/games)零改动，客户端按 Screen 重写即可。

## 代价（诚实记录）

- 无场景树/骨骼动画/粒子编辑器 → 重表现页面（大逃杀杀手动画、黄金矿工序列帧）首版用帧序列+程序动画，表现力上限低于 Cocos 同期产出。
- 立即模式 UI 无自动布局 → 每屏手工布局，规模化依赖 widgets.ts 组件库持续沉淀。

**推翻条件**：若 PAG 烘焙产能不足导致重动画页面无法按期还原，或团队产能转向场景编辑器工作流，应重新评估 Cocos Creator 3.x（届时服务端与数据层全部复用）。
