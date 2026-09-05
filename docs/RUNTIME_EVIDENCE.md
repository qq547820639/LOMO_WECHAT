# RUNTIME_EVIDENCE（原 APK 运行时行为采集）

> 任务书 Section 77：具备 Android 运行环境时进行运行时行为采集。采集于 2026-09-06，
> 环境：macOS arm64 + Android Emulator（AVD `lomo_evidence`，system-images;android-35;default;arm64-v8a），
> APK SHA-256 `8e6ae674…d0cb5de`（与全项目输入一致）。采集仅限恢复用户提供应用的行为，未绕过任何安全系统。

## 采集结果

### 1. 加固壳在模拟器可正常运行（RUNTIME_REQUIRED 部分解除）

- APK（360 加固 com.stub.StubApp + libjiagu）在 arm64 模拟器**成功安装并启动**，
  进程存活，`SplashActivity → LomoLoginActivity` 跳转正常（`evidence/runtime-evidence/01_login_activity.png`）。
- 意义：静态分析的 Activity/资源证据与运行时入口**互相印证**；
  后续如需更深行为采集（登录后页面遍历）可复用此环境（AVD 已建，APK 已装）。

### 2. 产品真实命名与运营主体（出处级证据）

登录页（01 截图）与隐私政策页（03 截图）确证：

| 项 | 运行时证据 | 与工程映射 |
|---|---|---|
| 产品名 | **《潮玩宇宙》**（登录页 slogan「潮玩玩家聚集地」） | full_clone 包名"潮玩宇宙 APK→微信小游戏"命名 MATCHED |
| 运营主体 | **深圳市扭蛋兔网络科技有限公司**（隐私政策页明文，niudantu@163.com，深圳南山大冲商务中心） | 公司名即"扭蛋兔"——扭蛋兔玩法为公司核心 IP 的直接佐证；cleanroom gacha 族 KEEP 决策正确 |
| 隐私政策 | 版本 2022-08-19 / 2025-01-14，登录页**先勾协议后可登录** | 与本工程 compliance_gate 设计一致（协议勾选前置） |
| 登录方式 | 唯一按钮「微信登录」 | WXEntryActivity/wxapi 映射 MATCHED |

### 3. 真实基础设施域名（新增证据，静态分析未确证）

点击《隐私政策》→ 内嵌 `WebActivity` WebView 打开（03 截图），logcat 捕获到 SDK 基础设施流量：

```
lbs.netease.im / httpdns.n.netease.com / nos.netease.com / nosup-hz1.127.net   ← 网易云信 IM SDK
ysf.nosdn.127.net                                                              ← 网易七鱼客服
59.111.239.x / 45.127.128.25                                                   ← 网易机房 IP
```

**工程影响**：原 App 内置网易云信 IM（聊天/私信）——文档 01 的社交模块（social defer）在
微信小游戏侧的替代方案应是微信客服消息/订阅消息或小游戏自有关系链，**不应移植云信 SDK**
（WECHAT_ADAPTATION.md 兼容表补充一条）。七鱼客服判断已被运行时印证。

**部署隔离声明**：以上域名/IP/主体信息均为**原 App 基础设施的研究证据**，仅用于溯源与兼容决策。
本工程部署使用自有域名与服务器（见 docs/DEPLOYMENT.md），不连接、不复用上述任何原版基础设施；
原版品牌（《潮玩宇宙》/扭蛋兔主体）同样不复用，自有产品需自有命名与视觉。

### 4. 登录页持续动画

`uiautomator dump` 报 `could not get idle state`——登录页存在不间断动画
（与 APK 内 PAG/Lottie 素材证据一致，登录页本身也有 PAG 背景）。

### 5. 未完成部分（诚实口径）

- **登录后页面遍历未做**：微信登录在模拟器无微信环境无法完成（这是原 App 的正常依赖，非工程缺陷），
  因此 567 个业务页的运行时遍历、网络域名全量观察、在线数值抓取均未发生——
  原服数值仍为 INFERRED（RUNTIME_REQUIRED 维持，需真实账号环境）。
- logcat 全量存档：`evidence/runtime-evidence/logcat_login_session.txt`（4821 行）。
- 采集截图：01 登录页 / 02 登录按钮点击后（无变化，因协议未勾）/ 03 隐私政策 WebView。

## 复现命令（环境已就绪可随时重采）

```bash
~/Library/Android/sdk/emulator/emulator -avd lomo_evidence &   # 或走 android-dev skill
adb install -r evidence/lomo_4.3.7.apk
adb shell am start -n com.caike.lomo/com.caike.ticket.modules.main.ui.SplashActivity
```
