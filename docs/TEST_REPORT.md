# TEST_REPORT

> 自动生成: tools/src/verify.ts · 2026-09-06T01:33:57.429Z

## ✅ route-parity-680 (17ms)

`{"total":680,"byStatus":{"implemented":354,"sandbox-only":10,"mapped":203,"platform-replaced":113},"byMode":{"CLONE_1_TO_1":513,"UI_CLONE_TEST_ONLY_SETTLEMENT_DISABLED":10,"CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER":44,"PLATFORM_ADAPTER":113},"ok":true,"problems":[]}`

## ✅ asset-manifest (96ms)

ok

## ✅ unit-core (11ms)

ok

## ✅ unit-assets+compliance (109ms)

ok

## ✅ unit-pack (8ms)

ok

## ✅ slot-ref-integrity (33ms)

`{"checked":14,"unresolved":[]}`

## ✅ screen-route-integrity (3ms)

`{"checked":48,"missing":[]}`

## ✅ frame-qa (4409ms)

`{"scanned":6004,"violations":[]}`

## ✅ gameplay-server (25ms)

ok

## ✅ release-safety (13ms)

ok

## ✅ integration-client (528ms)

integration-client ok: drawCalls=4657 coin 500→447 fpsLoop normal

## ✅ build-wechat-bundles (18020ms)

`{"full":"/Volumes/Extra/CodeProj/ape/LOMO_WECHAT_FORMAL_MIGRATION/build/wechat-full-clone","release":"/Volumes/Extra/CodeProj/ape/LOMO_WECHAT_FORMAL_MIGRATION/build/wechat-release"}`

## ✅ bundle-smoke (2690ms)

`["build/wechat-full-clone: gate→home ok, drawCalls=14596, drawImage=116","build/wechat-release: gate→home ok, drawCalls=12516, drawImage=116"]`

## 性能/体积

- 无头启动+全功能冒烟: 528ms（含两局完整玩法）
- 双产物构建耗时: 18020ms
- FULL CLONE 包: 7180 KB
- RELEASE 包: 7180 KB

> 包体含编译 JS 与数据；APK 原始资源未打包（按 CDN 策略设计，见 docs/ASSET_MIGRATION.md）。