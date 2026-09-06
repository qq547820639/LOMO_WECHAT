# TEST_REPORT

> 自动生成: tools/src/verify.ts · 2026-09-06T04:13:31.366Z

## ✅ route-parity-680 (8ms)

`{"total":680,"byStatus":{"implemented":354,"sandbox-only":10,"mapped":203,"platform-replaced":113},"byMode":{"CLONE_1_TO_1":513,"UI_CLONE_TEST_ONLY_SETTLEMENT_DISABLED":10,"CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER":44,"PLATFORM_ADAPTER":113},"ok":true,"problems":[]}`

## ✅ asset-manifest (38ms)

ok

## ✅ unit-core (2ms)

ok

## ✅ unit-assets+compliance (58ms)

ok

## ✅ unit-pack (3ms)

ok

## ✅ slot-ref-integrity (3ms)

`{"checked":14,"unresolved":[]}`

## ✅ screen-route-integrity (1ms)

`{"checked":48,"missing":[]}`

## ✅ frame-qa (1679ms)

`{"scanned":6004,"violations":[]}`

## ✅ gameplay-server (5ms)

ok

## ✅ release-safety (2ms)

ok

## ✅ integration-client (405ms)

integration-client ok: drawCalls=4667 coin 500→450 fpsLoop normal

## ✅ build-wechat-bundles (2465ms)

`{"full":"/Volumes/Extra/CodeProj/ape/LOMO_WECHAT_FORMAL_MIGRATION/build/wechat-full-clone","release":"/Volumes/Extra/CodeProj/ape/LOMO_WECHAT_FORMAL_MIGRATION/build/wechat-release","cloudBase":"https://assets.invalid/assets/game/"}`

## ✅ bundle-size-gate (23ms)

build/wechat-full-clone: 2.49MB / 4.00MB
build/wechat-release: 2.49MB / 4.00MB

## ✅ bundle-smoke (2667ms)

`["build/wechat-full-clone: gate→home ok, drawCalls=14596, drawImage=116","build/wechat-release: gate→home ok, drawCalls=12516, drawImage=116"]`

## 性能/体积

- 无头启动+全功能冒烟: 405ms（含两局完整玩法）
- 双产物构建耗时: 2465ms
- FULL CLONE 包: 2550 KB
- RELEASE 包: 2551 KB

> 包体含编译 JS 与数据；APK 原始资源未打包（按 CDN 策略设计，见 docs/ASSET_MIGRATION.md）。