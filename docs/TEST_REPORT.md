# TEST_REPORT

> 自动生成: tools/src/verify.ts · 2026-09-05T23:32:09.749Z

## ✅ route-parity-680 (3ms)

`{"total":680,"byStatus":{"implemented":354,"sandbox-only":10,"mapped":203,"platform-replaced":113},"byMode":{"CLONE_1_TO_1":513,"UI_CLONE_TEST_ONLY_SETTLEMENT_DISABLED":10,"CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER":44,"PLATFORM_ADAPTER":113},"ok":true,"problems":[]}`

## ✅ asset-manifest (30ms)

ok

## ✅ unit-core (2ms)

ok

## ✅ unit-assets+compliance (50ms)

ok

## ✅ unit-pack (2ms)

ok

## ✅ slot-ref-integrity (3ms)

`{"checked":14,"unresolved":[]}`

## ✅ frame-qa (981ms)

`{"scanned":6004,"violations":[]}`

## ✅ gameplay-server (10ms)

ok

## ✅ release-safety (3ms)

ok

## ✅ integration-client (425ms)

integration-client ok: drawCalls=4695 coin 500→437 fpsLoop normal

## ✅ build-wechat-bundles (7729ms)

`{"full":"/Volumes/Extra/CodeProj/ape/LOMO_WECHAT_FORMAL_MIGRATION/build/wechat-full-clone","release":"/Volumes/Extra/CodeProj/ape/LOMO_WECHAT_FORMAL_MIGRATION/build/wechat-release"}`

## ✅ bundle-smoke (2664ms)

`["build/wechat-full-clone: gate→home ok, drawCalls=14601, drawImage=116","build/wechat-release: gate→home ok, drawCalls=12785, drawImage=118"]`

## 性能/体积

- 无头启动+全功能冒烟: 425ms（含两局完整玩法）
- 双产物构建耗时: 7729ms
- FULL CLONE 包: 7160 KB
- RELEASE 包: 7160 KB

> 包体含编译 JS 与数据；APK 原始资源未打包（按 CDN 策略设计，见 docs/ASSET_MIGRATION.md）。