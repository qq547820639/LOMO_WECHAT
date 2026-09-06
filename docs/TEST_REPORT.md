# TEST_REPORT

> 自动生成: tools/src/verify.ts · 2026-09-06T02:59:04.142Z

## ✅ route-parity-680 (10ms)

`{"total":680,"byStatus":{"implemented":354,"sandbox-only":10,"mapped":203,"platform-replaced":113},"byMode":{"CLONE_1_TO_1":513,"UI_CLONE_TEST_ONLY_SETTLEMENT_DISABLED":10,"CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER":44,"PLATFORM_ADAPTER":113},"ok":true,"problems":[]}`

## ✅ asset-manifest (52ms)

ok

## ✅ unit-core (5ms)

ok

## ✅ unit-assets+compliance (72ms)

ok

## ✅ unit-pack (3ms)

ok

## ✅ slot-ref-integrity (12ms)

`{"checked":14,"unresolved":[]}`

## ✅ screen-route-integrity (1ms)

`{"checked":48,"missing":[]}`

## ✅ frame-qa (2110ms)

`{"scanned":6004,"violations":[]}`

## ✅ gameplay-server (12ms)

ok

## ✅ release-safety (3ms)

ok

## ✅ integration-client (432ms)

integration-client ok: drawCalls=4657 coin 500→433 fpsLoop normal

## ✅ build-wechat-bundles (4209ms)

`{"full":"/Volumes/Extra/CodeProj/ape/LOMO_WECHAT_FORMAL_MIGRATION/build/wechat-full-clone","release":"/Volumes/Extra/CodeProj/ape/LOMO_WECHAT_FORMAL_MIGRATION/build/wechat-release","cloudBase":"https://assets.invalid/assets/game/"}`

## ✅ bundle-size-gate (26ms)

build/wechat-full-clone: 2.48MB / 4.00MB
build/wechat-release: 2.48MB / 4.00MB

## ✅ bundle-smoke (2678ms)

`["build/wechat-full-clone: gate→home ok, drawCalls=14596, drawImage=116","build/wechat-release: gate→home ok, drawCalls=12516, drawImage=116"]`

## 性能/体积

- 无头启动+全功能冒烟: 432ms（含两局完整玩法）
- 双产物构建耗时: 4209ms
- FULL CLONE 包: 2542 KB
- RELEASE 包: 2542 KB

> 包体含编译 JS 与数据；APK 原始资源未打包（按 CDN 策略设计，见 docs/ASSET_MIGRATION.md）。