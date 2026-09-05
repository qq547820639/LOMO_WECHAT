# TEST_REPORT

> 自动生成: tools/src/verify.ts · 2026-09-05T22:53:21.998Z

## ✅ route-parity-680 (10ms)

`{"total":680,"byStatus":{"implemented":354,"sandbox-only":10,"mapped":203,"platform-replaced":113},"byMode":{"CLONE_1_TO_1":513,"UI_CLONE_TEST_ONLY_SETTLEMENT_DISABLED":10,"CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER":44,"PLATFORM_ADAPTER":113},"ok":true,"problems":[]}`

## ✅ asset-manifest (49ms)

ok

## ✅ unit-core (3ms)

ok

## ✅ unit-assets+compliance (52ms)

ok

## ✅ unit-pack (2ms)

ok

## ✅ gameplay-server (10ms)

ok

## ✅ release-safety (3ms)

ok

## ✅ integration-client (424ms)

integration-client ok: drawCalls=4472 coin 500→448 fpsLoop normal

## ✅ build-wechat-bundles (5754ms)

`{"full":"/Volumes/Extra/CodeProj/ape/LOMO_WECHAT_FORMAL_MIGRATION/build/wechat-full-clone","release":"/Volumes/Extra/CodeProj/ape/LOMO_WECHAT_FORMAL_MIGRATION/build/wechat-release"}`

## ✅ bundle-smoke (2662ms)

`["build/wechat-full-clone: gate→home ok, drawCalls=14527, drawImage=41","build/wechat-release: gate→home ok, drawCalls=12395, drawImage=41"]`

## 性能/体积

- 无头启动+全功能冒烟: 424ms（含两局完整玩法）
- 双产物构建耗时: 5754ms
- FULL CLONE 包: 2039 KB
- RELEASE 包: 2039 KB

> 包体含编译 JS 与数据；APK 原始资源未打包（按 CDN 策略设计，见 docs/ASSET_MIGRATION.md）。