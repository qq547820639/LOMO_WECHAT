# WECHAT_ADAPTATION

> Android → 微信小游戏能力映射（继承 cleanroom docs/COMPATIBILITY.md 并落实到工程）。

## 已实现（平台适配层 client/src/platform/platform.ts）

| Android 原能力 | 小游戏实现 | 工程落点 |
|---|---|---|
| Retrofit/OkHttp | HttpTransport(wx.request, 3 次重试/超时/5xx 退避) | client/src/net/api.ts |
| Native Socket | wx.connectSocket 槽位（大逃杀/多人矿坑本轮为服务端轮询制；realtime=defer） | 预留 |
| SharedPreferences | wx.storage（缓存 only，服务端为真相） | NodePlatform 同接口 |
| WXEntry/微信登录 | wx.login→服务端换 token；session_key 不落客户端 | /v1/auth/wechat |
| 深链邀请 | 分享卡片 title+query（invite token）+ getLaunchOptionsSync 进游处理 | /v1/social/invite/* |
| 支付宝 SDK | 移除；mall=mock 支付合同（服务端订单状态机+幂等发货）；正式支付待资质 | commerce.ts |
| 穿山甲/快手/GDT 广告 | 移除；Rewarded Ad 槽位仅兑 Energy/软币/固定材料（RewardAdapter 预留，adUnitId 走配置） | — |
| 七鱼客服/JPush | 移除；客服=微信客服消息、触达=订阅消息（PolicyScreen 呈现） | — |
| 网易云信 IM（**运行时新证据**，lbs.netease.im/httpdns.n.netease.com，见 RUNTIME_EVIDENCE.md） | 移除；IM/聊天由微信客服消息与小游戏关系链替代，不移植云信 SDK | RUNTIME_EVIDENCE §3 |
| 人脸实名 SDK | 移除；实名防沉迷接国家体系+平台能力（服务端判定） | /v1/compliance/status |
| Bugly/Tinker/自更新 | 移除；版本走平台发布+JS 错误上报 | — |
| 不兼容权限（安装包/后台定位/浮窗/READ_PHONE_STATE） | 移除（38 项权限仅保留玩法最小集语义） | PRIVACY_DATA_MAP |

## 双产物构建（tools/src/build_wechat.ts，实测通过）

- `build/wechat-full-clone/`：完整生态+沙盒结算；game.js → wx_entry → LomoClientApp（进程内 LomoApp 同包内置，真机单机可玩）
- `build/wechat-release/`：同一代码+release 配置；现金类 API 服务端 403（bundle-smoke 在 Node 中以 wx mock 实际启动两包，渲染帧验证通过）
- 两包均含 game.json（portrait）/project.config.json（touristappid）/README.txt

## 主循环生命周期

wx.onHide → BGM 停止+遥测 flush；wx.onShow → BGM 恢复+玩家状态刷新（服务端为准）。帧驱动 wx.requestAnimationFrame。

## 屏幕适配（Section 52）

逻辑坐标 375 宽，按 windowWidth/windowHeight/DPR 缩放绘制（iPhone 刘海安全区预留 top HUD 64px/底部 Tab 54px）；平板按宽度等比放大。

## 已知平台约束（执行时复核 2026-09）

- 主包 4MB 红线：本包未打包任何 APK 资源，编译 JS 数百 KB——红线内余量极大
- 域名白名单：真机联调需在 mp 后台配置 request/socket 合法域名（开发者工具可关校验）
- iOS 虚拟支付：运行时 `checkIsSupportMidasPayment` 探测后按能力开放商城入口（预留槽位）
- 随机抽取合规：概率公示页（undertown probDetail 已实现）+ 付费随机永久关闭
