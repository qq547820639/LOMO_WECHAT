# TEST_REPORT

> 自动生成: tools/src/verify.ts · 2026-09-05T22:38:28.479Z

## ✅ route-parity-680 (7ms)

`{"total":680,"byStatus":{"implemented":354,"sandbox-only":10,"mapped":203,"platform-replaced":113},"byMode":{"CLONE_1_TO_1":513,"UI_CLONE_TEST_ONLY_SETTLEMENT_DISABLED":10,"CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER":44,"PLATFORM_ADAPTER":113},"ok":true,"problems":[]}`

## ✅ asset-manifest (48ms)

ok

## ✅ unit-core (3ms)

ok

## ✅ unit-assets+compliance (56ms)

ok

## ✅ unit-pack (2ms)

ok

## ✅ gameplay-server (11ms)

ok

## ✅ release-safety (3ms)

ok

## ✅ integration-client (428ms)

integration-client ok: drawCalls=4424 coin 500→429 fpsLoop normal

## ✅ build-wechat-bundles (3367ms)

`{"full":"/Volumes/Extra/CodeProj/ape/LOMO_WECHAT_FORMAL_MIGRATION/build/wechat-full-clone","release":"/Volumes/Extra/CodeProj/ape/LOMO_WECHAT_FORMAL_MIGRATION/build/wechat-release"}`

## ✅ bundle-smoke (2670ms)

`["build/wechat-full-clone: gate→home ok, drawCalls=14216, drawImage=40","build/wechat-release: gate→home ok, drawCalls=12443, drawImage=41"]`

## 性能/体积

- 无头启动+全功能冒烟: 428ms（含两局完整玩法）
- 双产物构建耗时: 3367ms
- FULL CLONE 包: 881 KB
- RELEASE 包: 881 KB

> 包体含编译 JS 与数据；APK 原始资源未打包（按 CDN 策略设计，见 docs/ASSET_MIGRATION.md）。