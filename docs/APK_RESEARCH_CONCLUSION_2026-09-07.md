# 原始 APK 研究结论（2026-09-07）

## 研究对象与方法

- 样本：`evidence/lomo_4.3.7.apk`，包名 `com.caike.lomo`，versionCode `403007`；SHA-256 与 [SOURCE_OF_TRUTH.md](SOURCE_OF_TRUTH.md) 记录一致。
- 静态检查：Manifest、ZIP 条目、`assets/` 目录、音频/PAG/Lottie 文件名、资源分组和 `evidence/cleanroom/evidence/` 清单。
- 运行时证据：安装启动与首屏行为见 [RUNTIME_EVIDENCE.md](RUNTIME_EVIDENCE.md)。样本使用 `com.stub.StubApp`、`libjiagu` 加固壳，业务 DEX 运行时加载，因此未把反编译猜测当成规则。

## 已能确认的核心玩法信号

| 玩法 | 证据 | 可迁移的规则结论 |
|---|---|---|
| 虎口逃生 | `music/escape/*`；`escape_animal/{cow,dog,fox,monkey,pig,raccoon,tiger}` 下有 `choice/run/catch/fall_down/mud/palsy`，并有 `rope_breaks`、`ready_go`、护盾/无敌/加速道具 | 这是动物选择后连续做风险决策的逃生闯关；失败由被捕/绳断/地形状态触发。现版用三车道、服务端 seed 和可复现动作承载同一核心循环。
| 弹珠 | `music/marbles/{launch,collision,win}`；各颜色含 `left/right/middle/quick/slow/standby`，另有 `launch_click/launch_long_click`、`swing/spring` | 核心是瞄准角度、蓄力和碰撞结果；现版保留角度+力度+多发制，并以服务端结算为唯一奖励来源。
| 偷鸡/鸡窝 | `music/chicken/{countdown,stealer_coming,chicken_steal,win,fail}` | 核心循环是喂养、等待孵化、收蛋，并在偷鸡者出现时布防；现版保留这一时间窗与防守选择。
| 方块大逃杀 | `blockBattleRoyal/*` 含 `myself_*`、`killer_*`、`avoid`、`up_nail`、`killed` 和倒计时音乐 | 资源证明存在单局生存/躲避杀手玩法与等级/结果表现；没有证据证明真实多人房间协议，现版明确降级为 Bot 训练场。
| 运动/拔河/矿坑等 | `music/sport/*`、`tug/*`、`pit_*`、`multiple_pit_*` 及对应帧资源 | 证明玩法家族和交互素材存在，但不能从资源名恢复服务端数值、匹配或经济规则；现版只保留能独立游玩的低风险入口。

## 联机机制结论

静态 APK 没有可审计的房间、匹配、WebSocket 或服务端协议实现：核心业务代码被加固壳运行时解密，网络端点和消息 schema 无法由样本可靠还原。资源中的“杀手/其他玩家”动画只能证明表现层角色，不足以证明真人联机。因而现版不再展示“真人联机”承诺；`battleRoyal` 使用确定性 Bot 对手，只有在未来取得后端协议、鉴权、房间生命周期、断线重连和反作弊证据后才可重新评估多人房间。

## 研究边界与产品决策

以下内容不能由单个静态 APK 证明：正式服数值表、随机概率、奖池、资产账本、反作弊、匹配算法、广告回执和支付结算。它们被列为外部证据项，而不是客户端缺口。首发版本因此采用自有 `OWNED_LAUNCH_DEFAULTS` 参数、服务端 seed/动作校验、纯游戏内奖励和可回放广告凭证，避免把“有素材”误当成“有实现”。

## 结论

APK 研究足以支持三条核心玩法的 clean-room 重制和 Bot 生存玩法的表现层还原；不足以支持原商业生态、现金/下注/提现、真人联机或原服数值的复制。当前重制范围、砍项和广告设计以 [LAUNCH_REDESIGN_SPEC.md](LAUNCH_REDESIGN_SPEC.md) 为准。
