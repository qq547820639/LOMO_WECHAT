# TEST_REPORT

> 自动生成: tools/src/verify.ts · 2026-09-06T22:20:19.650Z

## ✅ route-parity-680 (10ms)

`{"total":680,"byStatus":{"implemented":354,"sandbox-only":10,"mapped":203,"platform-replaced":113},"byMode":{"CLONE_1_TO_1":513,"UI_CLONE_TEST_ONLY_SETTLEMENT_DISABLED":10,"CLONE_COMMERCE_FLOW_WITH_PAYMENT_ADAPTER":44,"PLATFORM_ADAPTER":113},"ok":true,"problems":[]}`

## ✅ asset-manifest (47ms)

ok

## ✅ unit-core (5ms)

ok

## ✅ unit-assets+compliance (73ms)

ok

## ✅ unit-pack (3ms)

ok

## ✅ slot-ref-integrity (13ms)

`{"checked":14,"unresolved":[]}`

## ✅ screen-route-integrity (0ms)

`{"checked":48,"missing":[]}`

## ✅ frame-qa (34ms)

`{"scanned":0,"violations":[]}`

## ✅ gameplay-server (11ms)

ok

## ✅ release-safety (6ms)

ok

## ❌ client-platform-transport (37ms)

```
Error: Command failed: /Users/panhao/.workbuddy/binaries/node/versions/22.22.2-2/bin/node /Volumes/Extra/CodeProj/ape/LOMO_WECHAT_FORMAL_MIGRATION/dist/tests/client_platform.js
AssertionError [ERR_ASSERTION]: The input did not match the regular expression /APP_SERVER_URL is required for WeChat runtime/. Input:

'Error: APP_SERVER_URL or APP_CLOUD_FN is required for WeChat runtime; standalone is Node/test only'

    at run (/Volumes/Extra/CodeProj/ape/LOMO_WECHAT_FORMAL_MIGRATION/dist/tests/client_platform.js:44:12)
    at Object.<anonymous> (/Volumes/Extra/CodeProj/ape/LOMO_WECHAT_FORMAL_MIGRATION/dist/tests/client_platform.js:74:5)
    at Module._compile (node:internal/modules/cjs/loader:1705:14)
    at Object..js (node:internal/modules/cjs/loader:1838:10)
    at Module.load (node:internal/modules/cjs/loader:1441:32)
    at Function._load (node:internal/modules/cjs/loader:1263:12)
    at TracingChannel.traceSync (node:diagnostics_channel:328:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:237:24)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:171:5)
    at node:internal/main/run_main_module:36:49 {
  generatedMessage: true,
  code: 'ERR_ASSERTION',
  actual: Error: APP_SERVER_URL or APP_CLOUD_FN is required for WeChat runtime; standalone is Node/test only
      at new MiniGameClientApp (/Volumes/Extra/CodeProj/ape/LOMO_WECHAT_FORMAL_MIGRATION/dist/client/src/app/main.js:133:19)
      at /Volumes/Extra/CodeProj/ape/LOMO_WECHAT_FORMAL_MIGRATION/dist/tests/client_platform.js:44:25
      at getActual (node:assert:609:5)
      at Object.throws (node:assert:757:24)
      at run (/Volumes/Extra/CodeProj/ape/LOMO_WECHAT_FORMAL_MIGRATION/dist/tests/client_platform.js:44:12)
      at Object.<anonymous> (/Volumes/Extra/CodeProj/ape/LOMO_WECHAT_FORMAL_MIGRATION/dist/tests/client_platform.js:74:5)
      at Module._compile (node:internal/modules/cjs/loader:1705:14)
      at Object..js (node:internal/modules/cjs/loader:1838:10)
    
```

## ✅ client-runtime-consent-session-lifecycle (56ms)

client-runtime ok: native scale contract, feature reachability, consent timeout/retry, global RAF fallback

## ✅ client-hub-layout-navigation (38ms)

client-hubs ok: no invalid account polling, clipping, visible hit bounds, final row access, player copy, empty-state navigation

## ✅ client-combat-entry-retry-balances (64ms)

client-combat ok: real button fee/HUD sync, duplicate suppression, pending-session retry, lost-response recovery, correct duel routing

## ✅ action-idempotency-loss-restart-replay (3706ms)

action-idempotency ok: lost responses, request conflicts, account scope, failures, session finish, restart and retention

## ✅ cloud-persistence-transactions-restart-replay (164ms)

persistence ok: two instances, 20-way identities/commands/slots, atomic invites/mail/rollback, lost commit response, restart, paginated ledger, fail-closed; peak 36 ops

## ✅ release-config-validation (4350ms)

[build_wechat] wechat-release → /Volumes/Extra/CodeProj/ape/LOMO_WECHAT_FORMAL_MIGRATION/build/release-config-test-49y32C (atlases: 539, cloud-assets (boot pack 353), main pkg 2.80MB)
release-config ok: fail-closed runtime config, exact AppID, strict HTTPS, explicit cloudBase, URL validation enabled

## ✅ security-auth-persistence-hardening (5089ms)

security-hardening ok: isolated auth exchange/input validation/timeouts/login limits/tokens/admin/persistence

## ✅ server-packaging-credential-isolation (406ms)

package:server → /var/folders/8_/gnp60nfx1xq97r2hld5bys1w0000gn/T/lomo-server-package-LW2Hc6/configured (440K)
Configure Cloud Run runtime credentials before deploying this package.
package:server → /var/folders/8_/gnp60nfx1xq97r2hld5bys1w0000gn/T/lomo-server-package-LW2Hc6/without-credentials (440K)
Configure Cloud Run runtime credentials before deploying this package.
server-packaging ok: no embedded credentials/build without credentials/runtime fail-closed

## ✅ integration-client (409ms)

integration-client ok: drawCalls=3287 coin 500→440 fpsLoop normal

## ✅ build-wechat-bundles (6856ms)

`{"full":"/Volumes/Extra/CodeProj/ape/LOMO_WECHAT_FORMAL_MIGRATION/build/verify/wechat-full-clone","release":"/Volumes/Extra/CodeProj/ape/LOMO_WECHAT_FORMAL_MIGRATION/build/verify/wechat-release","cloudBase":"https://assets.invalid/assets/game/"}`

## ✅ bundle-size-gate (47ms)

build/verify/wechat-full-clone: 2.80MB / 4.00MB
build/verify/wechat-release: 2.80MB / 4.00MB

## ✅ bundle-smoke (2897ms)

`["build/verify/wechat-full-clone: gate→home ok, drawCalls=6401, drawImage=48","build/verify/wechat-release: gate→home ok, drawCalls=6113, drawImage=48"]`

## 性能/体积

- 无头启动+全功能冒烟: 409ms（含两局完整玩法）
- 双产物构建耗时: 6856ms
- FULL CLONE 包: 2867 KB
- RELEASE 包: 2867 KB

> 包体含编译 JS 与数据；APK 原始资源未打包（按 CDN 策略设计，见 docs/ASSET_MIGRATION.md）。