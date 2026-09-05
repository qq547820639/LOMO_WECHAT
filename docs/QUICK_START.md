# QUICK_START

## 5 分钟跑通（命令均已实测）

```bash
cd LOMO_WECHAT_FORMAL_MIGRATION
npm install
npm run verify        # 一键验收：8 步全绿，生成 docs/TEST_REPORT.md 与微信双产物
```

## 启动参考服务端

```bash
npm run server                                   # FULL CLONE，http://127.0.0.1:8787
APP_PROFILE=wechat-release npm run server       # RELEASE（现金类 API 全 403）
curl -X POST http://127.0.0.1:8787/v1/auth/wechat -H 'content-type: application/json' -d '{"code":"demo"}'
```

## 微信开发者工具运行

1. 导入 `build/wechat-full-clone/`（完整沙盒）或 `build/wechat-release/`（合规版）
2. AppID 选"测试号"即可运行（包内进程内后端，无需外部服务）
3. 首屏 → 主城大厅：签到 → 大逃杀（选房/修门/躲避/结算）→ 地下城（点砖）→ 卡牌合成 → 潮玩/猿宇宙/交易/我的 五 Tab 全部可点

## 重新生成数据/产物

```bash
npm run gen:data      # 修改 evidence CSV 或功能注册表后
npm run build:wechat  # 重新出双包
npm run parity        # 重建 docs/ROUTE_PARITY_680.md
```

## 部署到自有服务器/域名

见 `docs/DEPLOYMENT.md`（服务端部署、APP_SERVER_URL 构建、CDN 接入、隔离与合规红线）。
