# TEST_REPORT

> 自动生成: tools/src/verify.ts · 2026-09-06T02:32:33.934Z

## ✅ route-parity-680 (15ms)

`{"total":680,"byStatus":{"implemented":354,"sandbox-only":10,"mapped":203,"platform-replaced":113},"byMode":{"CLONE_1_TO_1":513,"UI_CLONE_TEST_ONLY_SETTLEMENT_DISABLED":10,"CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER":44,"PLATFORM_ADAPTER":113},"ok":true,"problems":[]}`

## ✅ asset-manifest (64ms)

ok

## ✅ unit-core (10ms)

ok

## ✅ unit-assets+compliance (74ms)

ok

## ✅ unit-pack (5ms)

ok

## ✅ slot-ref-integrity (7ms)

`{"checked":14,"unresolved":[]}`

## ✅ screen-route-integrity (0ms)

`{"checked":48,"missing":[]}`

## ✅ frame-qa (2499ms)

`{"scanned":6004,"violations":[]}`

## ✅ gameplay-server (10ms)

ok

## ✅ release-safety (3ms)

ok

## ✅ integration-client (431ms)

integration-client ok: drawCalls=4657 coin 500→436 fpsLoop normal

## ✅ build-wechat-bundles (8598ms)

`{"full":"/Volumes/Extra/CodeProj/ape/LOMO_WECHAT_FORMAL_MIGRATION/build/wechat-full-clone","release":"/Volumes/Extra/CodeProj/ape/LOMO_WECHAT_FORMAL_MIGRATION/build/wechat-release","cloudBase":"https://assets.invalid/assets/game/"}`

## ✅ bundle-size-gate (48ms)

build/wechat-full-clone: 2.48MB / 4.00MB
build/wechat-release: 2.48MB / 4.00MB

## ✅ bundle-smoke (2723ms)

`["build/wechat-full-clone: gate→home ok, drawCalls=14912, drawImage=118","build/wechat-release: gate→home ok, drawCalls=12780, drawImage=118"]`

## 性能/体积

- 无头启动+全功能冒烟: 431ms（含两局完整玩法）
- 双产物构建耗时: 8598ms
- FULL CLONE 包: 2542 KB
- RELEASE 包: 2542 KB

> 包体含编译 JS 与数据；APK 原始资源未打包（按 CDN 策略设计，见 docs/ASSET_MIGRATION.md）。