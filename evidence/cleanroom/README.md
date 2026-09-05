# LOMO → 微信小游戏 clean-room 迁移基线

这是根据上传的 LOMO 4.3.7 APK 静态证据构建的微信小游戏迁移工程。

## 运行

```bash
npm test
```

然后用微信开发者工具导入本目录，项目类型选择“小游戏”。`appid` 当前是 `touristappid`，正式项目替换为实际小游戏 AppID。

## 两种配置

- `config/full-baseline.json`：记录 APK 发现的完整功能边界，**不可直接发布**。
- `config/release.json`：发布安全方向，切除现金/下注/付费随机/P2P 交易/拍卖/代理等模块。

## 重要说明

APK 使用加固壳，静态包无法恢复原正式服数值和服务端逻辑。`config/tuning-baseline.json` 是可运行的 clean-room 数值，不是声称从原版反编译得到的正式服参数。

详细见：

- `docs/MIGRATION_REPORT.md`
- `docs/LAUNCH_DECISION.md`
- `docs/BACKEND_CONTRACT.md`
- `evidence/apk-summary.json`
