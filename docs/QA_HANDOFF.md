# QA 交接手册 —— 猿岛 ApeIsland 微信小游戏

> 面向 QA 工程师的自足文档：不依赖开发会话上下文即可开始测试。
> 版本基线：commit `25737c9`（2026-09-06）。以下所有地址/账号均已实测可用。

---

## 1. 环境信息卡

| 项 | 值 |
|---|---|
| AppID | `wxec103651e807c540` |
| 云开发环境 | `lomo-wechat-d0gcakr952f0d90b8`（个人版 / ap-shanghai） |
| **服务端 API** | `https://lomo-wechat-309031-6-1301149345.sh.run.tcloudbase.com`（CloudBase Run 容器 `lomo-wechat`） |
| **资源 CDN** | `https://lomo-wechat-d0gcakr952f0d90b8-1301149345.tcloudbaseapp.com/v1/assets/game/`（静态托管） |
| 仓库 | `github.com/qq547820639/LOMO_WECHAT`，main 分支 |
| 本地产物 | `LOMO_WECHAT_FORMAL_MIGRATION/build/wechat-release/`（已导入开发者工具） |
| 域名校验 | **已关闭**（`project.config.json` → `setting.urlCheck=false`，开发态） |
| 密钥位置 | 本地 `.env.cloud`（600 权限、已 gitignore；**含 CAM 密钥，用后请在腾讯云控制台轮换**） |

服务健康自检（应全部 200）：

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://lomo-wechat-309031-6-1301149345.sh.run.tcloudbase.com/v1/config/bootstrap
curl -s -o /dev/null -w "%{http_code}\n" https://lomo-wechat-d0gcakr952f0d90b8-1301149345.tcloudbaseapp.com/v1/assets/game/miner/f00.png
```

---

## 2. 快速开始（已就绪，可直接测）

1. 打开**微信开发者工具**（已安装并运行，服务端口已开启 37002）
2. 项目 `wechat-release` 已导入 → 模拟器应显示**启动合规门**（健康游戏忠告 + 「进入游戏」按钮）
3. 点「进入游戏」→ 自动完成 登录 → 拉取玩家 → 进入**首页宫格**
4. 真机：工具顶部「预览」生成二维码，微信扫码（预览码约 25 分钟有效，过期让开发重生成）

> 已知 UI 现象：模拟器/真机底部偶见 `readFile: assets/game/audio/sfx/nav.mp3` 红字 —— 音频文件缺失，已被 try/catch 静音，**不影响功能**，属已知问题 #K3。

---

## 3. 测试重点（按优先级）

### P0 核心链路（必须全绿）
- [ ] 合规门渲染 + 「进入游戏」可点
- [ ] 登录自动完成（Console 应见 `POST /v1/auth/wechat` 200）
- [ ] 首页宫格渲染（Console 应见 `GET /v1/player/state` 200，balances 含 COIN=500）
- [ ] **大逃杀**：进一局 → join → act 若干次 → 出结果（幸存/被淘汰）
- [ ] **地下城**：开砖 → 领取
- [ ] **每日签到** → 领取奖励
- [ ] **卡牌抽取** → 抽卡出结果
- [ ] **钱包/账本**：余额与流水一致（初始 COIN 500 / ENERGY 30 / TICKET 5）

### P1 稳定性与恢复
- [ ] **退出再进**：应自动恢复玩家状态，不黑屏、不卡加载（旧 token 失效会自动重新登录）
- [ ] 后台切前台（onHide/onShow）：无崩溃，音乐/状态正常
- [ ] 断网启动：应显示**「启动失败」或「启动超时（连不上服务端）」错误画面**（不是黑屏），恢复网络后可重试
- [ ] 快速连点：无卡死、无重复扣费/重复领取

### P2 体验与资源
- [ ] 首页动画流畅（boot pack 133 图集在包内，其余按需从 CDN 拉——首次进入新玩法会有短暂加载）
- [ ] 各屏 Tab 切换正常
- [ ] 抽卡/结算的奖励动效（fx 层）是否显示

---

## 4. 已知问题与限制（提交缺陷前先对照）

| 编号 | 级别 | 描述 | 状态 |
|---|---|---|---|
| K1 | 🔴 **收费阻断** | 服务端容器文件系统**临时**：实例重启/重新部署会**丢失全部玩家进度**（内存 + store.json 随容器消失）。收费前必须迁移外部持久化 | 待办（架构项） |
| K2 | 🟡 | MP 后台**白名单未配**：真机「预览」模式（非真机调试）会被拦。开发期用「真机调试」或等白名单配好（两个域名见 §6） | 待用户配置 |
| K3 | 🟢 | Console 报 `readFile: assets/game/audio/sfx/nav.mp3 不存在` —— 部分音效文件缺失，已静音不影响功能 | 低优修复 |
| K4 | 🟢 | `wx.requestAnimationFrame` 在该开发者工具版本缺失，已自动降级 `setTimeout`（Console 有黄字提示，属预期） | 已兜底 |
| K5 | 🟡 | `urlCheck=false` 为开发态配置：**正式分发前必须改回 true** 并配齐白名单，否则等于绕过域名校验 | 发布检查项 |
| K6 | 🔴 合规 | 云开发 CAM 密钥在会话中明文传递过，**建议尽快在腾讯云控制台轮换** | 待用户操作 |

---

## 5. 缺陷反馈格式（方便开发直接定位）

```
【现象】一句话描述
【复现步骤】1→2→3
【环境】模拟器 / 真机(机型+微信版本)
【Console 报错】红色行原文（开发者工具 Console 面板可直接复制）
【网络】Console Network 面板里失败请求的 URL + 状态码
```

> 客户端已内置诊断：启动失败会在**主画布直接显示错误文字**（不会黑屏）；卡住 20 秒会显示「启动超时（阶段）+ 服务端地址」。截图发过来即可。

---

## 6. 常用操作速查

| 操作 | 命令/路径 |
|---|---|
| 重新构建产物（云资源形态） | `APP_WX_APPID=wxec103651e807c540 APP_SERVER_URL=<服务端> APP_CLOUD_BASE=<CDN>/v1/assets/game/ APP_CLOUD_ENV=lomo-wechat-d0gcakr952f0d90b8 APP_CLOUD_SERVICE=lomo-wechat node dist/tools/src/build_wechat.js --profile wechat-release` |
| 刷新开发者工具 | `/Applications/wechatwebdevtools.app/Contents/MacOS/cli open --project "<绝对路径>/build/wechat-release"` |
| 全量自动验收（13 步） | `npm run verify`（含主包 ≤4MB 硬门禁） |
| 重新部署服务端 | `npm run package:server` → `printf '\n' \| npx -p @cloudbase/cli tcb cloudrun deploy -s lomo-wechat --port 8080 --source build/cloudrun --wait --force -e $CLOUDBASE_ENV` |
| 重新上传资源 | `npx -p @cloudbase/cli tcb hosting deploy build/wechat-release/assets/game v1/assets/game -e $CLOUDBASE_ENV` |
| MP 后台白名单（正式分发前） | 开发管理 → 开发设置 → 服务器域名（request/uploadFile/downloadFile 三处）：`https://lomo-wechat-309031-6-1301149345.sh.run.tcloudbase.com` + `https://lomo-wechat-d0gcakr952f0d90b8-1301149345.tcloudbaseapp.com` |

---

## 7. 范围外事项（测试时不用管，但别报缺陷）

- 广告/内购：**尚未接入**（等流量主资质与版号），游戏内无任何付费点
- 音频文件缺失（K3）：只影响音效，不影响流程
- 原 APK 素材：已全部替换为自制资产（零原衍生字节），与本项目运行无关
