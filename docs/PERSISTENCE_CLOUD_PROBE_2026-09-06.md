# CloudBase 真实事务探针复查记录

日期：2026-09-06。目标环境：`lomo-wechat-d0gcakr952f0d90b8`（上海）。

本记录仅证明目标环境内隔离测试集合的 SDK 行为，不证明生产玩家迁移、部署、官方微信登录或全部持久化验收完成。

## 已执行的范围

- 使用 `@cloudbase/js-sdk@3.9.2` 与 `@cloudbase/signature-nodejs@2.0.0`，显式映射本地 `.env.cloud` 的 `TENCENTCLOUD_SECRET_ID/KEY` 为 Node SDK 的 `secretId/secretKey`。探针拒绝组/其他用户可读的凭据文件，输出不含凭据值。
- 在管理面确认 `ape_qa_persistence` 不存在后新建该集合；创建请求 ID：`f621588e-2ac2-4651-9f64-c8ad7d17d4f9`。
- 仅该新集合设置 `ADMINONLY`；设置请求 ID：`5f4568c2-3eca-439d-bdf9-84f219185efe`；回读请求 ID：`458bd83f-0706-4ece-bae1-86359b19336b`，确认 `aclTag=ADMINONLY`。
- 插入固定自建标识 `qa_probe_owner_v1`，`owner=lomo-formal-migration-qa-2026-09-06`。探针必须先核对该标识，再写随机前缀的合成测试文档；不会自行认领未知集合或修改权限。
- 每次执行上限为 100 次计费操作预算、30 秒；25 秒后停止新测试并预留清理时间。`runTransaction` 的事务开始/提交/中止使用保守预算预留，`operations` 不是腾讯云账单指标。
- 结束后逐个核对 `owner/probeId` 才删除本次文档，并逐个回读确认不存在。保留集合及自建标识供持久化集成验收使用。没有操作已有玩家数据、生产集合、部署或生产权限。

## 真实结果及处置

| 验证项 | 真实结果 | 实现要求 |
| --- | --- | --- |
| 默认 `GATEWAY` 模式 CAM 读取 | 首次读取即 `INVALID_CREDENTIALS`；没有测试写入 | 在本环境显式使用受支持的 `endPointMode: 'CLOUD_API'`；不把管理面访问成功当成数据面可用 |
| `CLOUD_API` CAM 读取 | 自建标识读取成功 | 凭据显式映射、环境固定，服务端专用 |
| 非事务 `doc.get()` 不存在 | `{data: []}` | 处理空数组 |
| 事务 `doc.get()` 不存在/存在 | `{data: null}` / `{data: document}` | 不能把事务结果当数组 |
| 事务 `create`、`update`、返回值 | 创建成功、更新可见；`runTransaction` 返回回调值 | 事务回调能返回计算结果 |
| 事务 `set` | 缺失时插入；已有时完整替换，旧字段确实消失 | 适合完整 envelope；不得用于无意保留旧字段的部分更新 |
| `rollback` | 同时撤销新文档及既有文档更新 | 不得先向客户端承诺成功后再提交 |
| 重复 `create` | `E11000`，原文档未改变 | 不能依赖只有 `error.code` 的异常分类 |
| 两事务冲突 | 第二次写被拒；最终值保留首事务的值 | 数据库拒绝丢失更新 |
| SDK 自动冲突重试 | **失败**：`runTransaction(callback, 3)` 的并发首轮读均为 0，回调次数 `[1,1]`，一个成功、一个拒绝，最终值为 1，期望为 2 | 已移交持久化实现：解析真实错误格式，实施应用层有限重试，并另做应用层真实并发验收 |
| 冲突事务清理 | 随后 rollback 返回 `ResourceUnavailable.TransactionNotExist`，表明服务端已终止该事务 | 仅此明确终止错误视为已结束，其他清理失败保留为风险 |
| 测试文档清理 | 每次已完成的测试均删除并回读确认，最终无本次待清理 ID | 30 秒硬截止时如有待清理 ID 会写出失败结果，不冒充清理成功 |

SDK 的冲突异常是 `Error.message` 中的 JSON，而 `error.code` 未定义：

```text
{"code":"OPERATION_FAIL","msg":"[DATABASE_TRANSACTION_CONFLICT] [ResourceUnavailable.TransactionConflict] ..."}
```

重复键错误也包装为 `OPERATION_FAIL`，但 `msg` 含 `E11000`。仅匹配外层 `OPERATION_FAIL` 会混淆不同失败；盲目重试所有异常也不合适。SDK 自带事务重试检查 `error.code`，本次真实错误包装没有触发该路径。

## 复现与证据

```bash
npm run build
node dist/tools/src/qa_persistence_cloud.js
```

不需要生成或刷新微信包。输出：`build/qa-evidence/persistence-cloud-probe.json`。探针输出区分 `completed`（执行结束）与 `passed`（所有断言通过）；SDK 自动重试缺陷存在时应返回退出码 1，即使其余检查与清理成功。不要将该失败改为成功来满足门禁。

发现自动重试缺陷的运行：`probe_bb0c34d88c1c4004`，UTC `2026-09-06T11:06:51.838Z`，7,304 ms，保守计数 61 次；回调次数 `[1,1]`，最终值 1；`cleanupPending=[]`，`pendingTransactions=0`。

修正失败退出码后的最终复测：`probe_cf88b348f28f437c`，UTC `2026-09-06T11:08:54.654Z`，7,788 ms，61 次；`completed=true`、`passed=false`、退出码 1，准确保留 SDK 自动重试缺陷；10 项通过、1 项失败，清理待办均为 0。独立 TypeScript 编译、`git diff --check` 和新文件尾部空白检查通过；两份源码/文档及 JSON 输出与本地秘密值比对，泄漏匹配数为 0。

## 递归修复记录

1. 初次真实读返回 `INVALID_CREDENTIALS`。读取 SDK 受支持配置并对比实际请求后，显式选择 `CLOUD_API`；标识读及后续事务成功。没有改写 SDK 安装文件。
2. 实测确认事务 `get` 为单对象或 null，已将证据通知持久化实现，避免新建玩家分支误判。
3. 重复键测试最初错误地预期 `error.code`。补齐对 `Error.message` JSON 的脱敏解析，确认 E11000 且数据未变化。
4. 冲突后回滚返回事务不存在。将这一明确状态作为终止证据，其他错误继续报失败；逐文档回读确认清理。
5. 增加有首轮读取屏障的双事务递增，稳定证实 SDK 自动重试失败；不能以单事务通过替代并发验收。探针修正退出码，使任一失败检查返回 1。

## 剩余风险

- SDK 默认网关模式和自动冲突重试在本环境不可直接依赖。应用层修复完成后仍须通过其自身的真实事务、并发、重启和分页验收；本探针不会代替它们。
- 探针使用已获授权的 CAM 服务端凭据。`ADMINONLY` 已在管理面回读；未创建终端用户来额外验证拒绝访问。
- 集合及自建标识故意保留。集合内应用集成测试和所需索引由对应实现任务独立管理，本探针不覆盖或清理它们。
- 历史凭据轮换、正式环境权限关联、持久化生产部署与数据迁移不在本次探针执行范围，不能从此报告推断已经完成。
