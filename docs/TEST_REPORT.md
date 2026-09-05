# TEST_REPORT

> 自动生成: tools/src/verify.ts · 2026-09-05T23:37:25.265Z

## ✅ route-parity-680 (4ms)

`{"total":680,"byStatus":{"implemented":354,"sandbox-only":10,"mapped":203,"platform-replaced":113},"byMode":{"CLONE_1_TO_1":513,"UI_CLONE_TEST_ONLY_SETTLEMENT_DISABLED":10,"CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER":44,"PLATFORM_ADAPTER":113},"ok":true,"problems":[]}`

## ✅ asset-manifest (31ms)

ok

## ✅ unit-core (2ms)

ok

## ✅ unit-assets+compliance (53ms)

ok

## ✅ unit-pack (1ms)

ok

## ✅ slot-ref-integrity (4ms)

`{"checked":14,"unresolved":[]}`

## ✅ frame-qa (1032ms)

`{"scanned":6004,"violations":[]}`

## ✅ gameplay-server (12ms)

ok

## ✅ release-safety (3ms)

ok

## ✅ integration-client (427ms)

integration-client ok: drawCalls=4657 coin 500→439 fpsLoop normal

## ✅ build-wechat-bundles (7271ms)

`{"full":"/Volumes/Extra/CodeProj/ape/LOMO_WECHAT_FORMAL_MIGRATION/build/wechat-full-clone","release":"/Volumes/Extra/CodeProj/ape/LOMO_WECHAT_FORMAL_MIGRATION/build/wechat-release"}`

## ✅ bundle-smoke (2663ms)

`["build/wechat-full-clone: gate→home ok, drawCalls=14965, drawImage=119","build/wechat-release: gate→home ok, drawCalls=12780, drawImage=118"]`

## 性能/体积

- 无头启动+全功能冒烟: 427ms（含两局完整玩法）
- 双产物构建耗时: 7271ms
- FULL CLONE 包: 7162 KB
- RELEASE 包: 7163 KB

> 包体含编译 JS 与数据；APK 原始资源未打包（按 CDN 策略设计，见 docs/ASSET_MIGRATION.md）。