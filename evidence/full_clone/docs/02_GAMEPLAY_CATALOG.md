# 02 — 玩法目录（按 APK 证据 + 公开历史资料复原）

> 规则中没有静态证据能确认的数值都放进服务器配置，禁止写死；后续若拿到接口文档或运行期抓包，以线上规则覆盖。

## A. 大逃杀 / Battle Royal
APK 证据：`BattleRoyalActivity`、`NewBattleRoyalActivity`、`BettingHistoryActivity`、`assets/blockBattleRoyal/*`、`assets/pag/battleRoyal/*`。

复刻交互：
- 多个房间，玩家选择房间并投入游戏内资产；倒计时结束前可切换房间/增加投入。
- 杀手倒计时后攻击某房间；新版资源显示存在房门、杀手走路/破门/击杀动画。
- 可修门；杀手未破门则继续寻找目标，直至出现淘汰房间。
- 幸存房间按配置规则分配本局奖池；保留历史记录、排行。
- 方块兽版另有“选择队伍、雇佣越多抢得越多、毒雾追赶”的抢夺战说明，作为 Blocks 分支模式，而不是替换主大逃杀。

## B. 匕首 / 刺杀 / 抢劫杀手
APK：`Dagger*`、`AssassinationHistoryActivity`、`RobberyKillerActivity`、`MyDaggerActivity`、`assets/dagger/*`、`assets/robbery/*`。
- 大逃杀失败可衍生匕首资产。
- 匕首有持有、升级/钉子、释放、交易记录。
- 刺杀杀手与抢劫杀手是匕首的消耗/质押衍生玩法。

## C. 扭蛋兔：开蛋—装备—战力—挑战—生产
APK：大量 `dress_*`、`strengthen/*`、`normal_egg`、`medal_egg`、`rock_egg`、Boss/竞技场资源。
- 普通蛋/勋章蛋/宝石或猿石蛋。
- 随机得到部件；至少有耳、头/脸、身体、手、脚、裤装等装备位。
- 高战力装备替换；低战力装备分解。
- 蛋可升级，资源显示自动开蛋相关动画。
- 战力进入关卡挑战、Boss、竞技场，并与资源产出挂钩。

## D. 猿宇宙 / 无聊猿卡 / 矿场
APK：94 个 Ape Activity；包括卡、宝石、猿石、金沙、勋章、矿坑、好友矿场、安全箱、仓库、交易中心、合成拆分、拼图矿、租赁、团购。
- 卡持有/卡集/星球卡。
- 开矿坑，定时生产；私人矿场、好友矿场、多坑。
- 宝石统计、赠送、交易、记录。
- 猿石/金沙/勋章互相进入兑换、存储、生产与玩法消耗。
- 卡片合成、拆分、仓库、保险箱、提货、实物订单。

## E. 宝石地下城
APK：`Undertown*`、`ProbDetail*`、`LevelReward*`、`TicketAllocation*`、`DailyTopHundred*`，Lottie 有 brickSelf/brickOther/bricksRupture/goNextFloor。
- 每层由若干砖块组成。
- 玩家购买/选择砖块参与；其中一格藏大奖，另有奖票等奖励。
- 参与当前层后解锁下一层；层数越深奖池/难度上升。
- 保留概率详情、开奖记录、每日百强、层奖励。

## F. 竞技场 / Boss / 斗猿场
- `ApeArenaActivity` + arena PAG：VS、胜负结果、奖池。
- `ChallengeBossActivity` + boss/rabbit 攻击动画。
- `MonkeyFightingSiteActivity` + monkeyFighting PAG：笼子、场地破裂、坏猴袭击等。
- 保留挑战列表、复仇/战斗记录、奖池排名。

## G. 虎口逃生
APK：`EscapeTigerMouthActivity`，73 个 escape_animal PAG，含牛/狗/狐狸/猴/猪/浣熊/老虎、绳断、泥、麻痹、加速、护盾、无敌、闪电等。
- 这是可以完整重建的独立竞速/逃生小游戏，不应删除。

## H. 今晚吃鸡
APK：`ChickenActivity/ChickenLogsActivity`，有鸡窝消失、偷鸡者、预警等动画。
- 复刻为选择/守护/偷取类短局游戏；具体结算数值走服务器配置。

## I. 弹珠
APK：`MarblesActivity` + 48 个 marbles PAG。
- 角色有 left/right/jump/quick/slow/standby，另有 spring/swing/发射点击动画。
- 复刻原物理路径/发射交互。

## J. 运动会 / 拔河 / 动物玩法
- SportsMeet：6 套选手选中/待机/胜利动画。
- RocksTug：TugActivity/Record/Rank + 8MB tug 素材。
- AnimalsMain：动物主玩法、奖品、结果、排行、历史。

## K. 炸猴王 / 猴王池
`MonkeyKingActivity`、`RocksMonkeyKingActivity`、MonkeyPool、排名、历史日志；Lottie 有 bombOne/bombTen/bombHundred/useBomb。
- 明确存在 1/10/100 级别投弹与猴王池的表现资源。

## L. 猿石魔兽 / 黄金矿场 / 多人矿坑 / 宇宙探索
- Warcraft：猿石交换/提取记录。
- Gold：矿工 PNG 序列 1591 张，涵盖 appear/front/back/left/right/idle；对应黄金矿、矿物、精炼、矿石交易。
- MultiplePit：多人矿坑、大奖/参与日志。
- Universe：英雄、UFO升级、星球探索、飞船、仓库、契约、神殿。

## M. 卡牌/闪卡/盲盒/福袋/数字潮玩
- 闪卡：开卡、合成、交换、出售、交易、扫码、仓库。
- 盲盒：开盒、回收、提货、物流、卡包。
- 福袋：开袋、排行、日志、订单。
- 数字潮玩：竞拍/出价/抽签/潮玩交易/数字卡。

全部进入复刻范围，不再像上一版一样先删。
