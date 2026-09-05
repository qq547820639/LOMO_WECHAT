# KNOWN_DIFFERENCES

> 诚实清单（Section 95）。分类：MATCHED / HIGH_CONFIDENCE_REIMPLEMENTATION / INFERRED / SERVER_REQUIRED / RUNTIME_REQUIRED / RELEASE_ADAPTED / NOT_REPRODUCIBLE_FROM_APK。

## MATCHED（结构级与 APK 证据一致）

- 680 Activity 清单/模块归属/功能标签/决策（CSV↔JSON↔注册表三处一致，自动验收）
- 20 种资产名单与语义（宝石/勋章/NDTU/世界币/猿石/金沙/黄金/匕首/卡牌三系/奖券/红包进度…）
- 玩法家族清单与大循环结构（生产→短局→资产→成长→交易→赛季回流）
- 结算十屏名单（Withdrawal/CashResult/CoinCash/FriendCashReward/WarcraftWithdrawLog 等）
- 第三方 SDK 113 页名单与替代方案

## HIGH_CONFIDENCE_REIMPLEMENTATION（公开玩法资料+资源名交叉验证）

- 大逃杀：房间投注→杀手撞门→门破淘汰→幸存分池→败方铸匕首（搜狐/360 商专/10100 三源一致；修门机制来自升级公告）
- 地下城：逐层砖块、一块大奖砖、买砖参与、解锁下一层、奖券次奖、概率/百强页
- 扭蛋兔：三蛋型、六装备部位、高替换低分解、战力入挑战
- 炸猴王：1/10/100 三档投弹 + 猴王池

## INFERRED（合理工程重建，原值未知）

- 全部数值：房间数 6、门耐久 100、杀手伤害 18、各玩法产出区间、成长曲线、合成权重、体力速率
- 卡牌 18 模板的命名/稀有度/战力
- 经济流向比率（矿石:猿石=10:1 等）
- UI 布局像素级：原 res 资源名混淆，无法恢复原始 layout；本版为功能等价的暗色主题重绘

## SERVER_REQUIRED（客观不可静态恢复，全部走 RemoteConfig）

- 正式服概率/奖池/手续费/风控参数
- API 签名与加密实现
- 精确掉落表、离线产出公式

## RUNTIME_REQUIRED（需真机/抓包补充）

- 页面间精确转场动画时序、PAG 动画逐帧内容
- 在线匹配节奏（大逃杀/多人矿坑当前为 NPC 同服模拟）

## RELEASE_ADAPTED（合规改造，见 COMPLIANCE_CURRENT/FINAL_LAUNCH_DECISION）

- 下注→门票；现金奖池→赛季积分；提现十屏→沙盒桥；P2P 交易→NPC 兑换；代理/分销→关闭；付费随机→免费钥匙
- 抢夺定向转移→PvE 积分；匕首刺杀题材→defer（保留战利品收集语义）

## NOT_REPRODUCIBLE_FROM_APK

- 加固壳内业务代码的原始实现细节（类逻辑级 1:1）
- 原服务端数据库与真实玩家数据
- 品牌素材版权链（资源按"用户自有可用"前提提取映射，未做第三方素材二次分发）
