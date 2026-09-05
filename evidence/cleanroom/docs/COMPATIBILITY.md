# Android 能力兼容与替换清单

## 直接兼容/低成本适配

- HTTPS API：`Retrofit/OkHttp` → `wx.request`。
- WebSocket：Android socket → `wx.connectSocket`。
- 本地 KV：SharedPreferences → `wx.getStorageSync/setStorageSync`。
- 图片：PNG/WebP/JPG → Texture/Canvas/WebGL。
- 大部分 MP3/WAV：转码后通过 InnerAudioContext。
- 分享/好友邀请：原 App deep link → 微信分享 scene 参数。
- 排行榜：改小游戏开放数据域/服务端排行（视具体接口与隐私要求）。

## 必须替换

- Alipay SDK：小游戏内不直接移植；支付走微信小游戏当期虚拟支付/实物支付能力。
- JPush：改订阅消息、游戏内公告、回流触达。
- Pangle/Kuaishou/GDT：改微信小游戏广告组件。
- Qiyu 客服：改微信客服/客服消息。
- Huawei ScanKit：按需使用微信扫码能力。
- BytedCert/Toyger：不搬原生 SDK；实名/防沉迷走监管与平台体系。
- Bugly/Tinker/App Update：改平台版本发布 + JS 错误上报；禁止 App 自更新逻辑。

## 资源格式风险

### PAG

APK 中 `assets/pag` 约 60.6 MiB，且依赖 `libpag.so`。小游戏不能直接加载 Android `.so`。

默认策略：

1. UI 闪光/按钮循环 → 12–20 fps WebP/PNG atlas。
2. 角色短动作 → sprite sheet + 帧事件。
3. 长演出 → 视频/远程序列。
4. 少量必须保留矢量的 PAG 才评估 Web/WASM runtime，且单独做真机兼容/内存压测。

### Lottie

APK 中部分 Lottie JSON 单文件达到 1.5 MiB+。不建议直接在首屏解析；默认烘焙成 atlas，只有轻量 UI 动效保留 JSON 渲染。

## 不兼容且应删除

- `REQUEST_INSTALL_PACKAGES` / `INSTALL_PACKAGES`。
- 后台定位、电话、系统悬浮窗、读取电话状态、查询所有 App。
- Android 原生文件 Provider、Activity 路由、推送常驻进程。

## 包体策略

主包只放启动与 UI 核心。即便平台总包政策后续变化，也不依赖总包上限：大资源统一走 CDN + 内容 hash + 本地缓存。
