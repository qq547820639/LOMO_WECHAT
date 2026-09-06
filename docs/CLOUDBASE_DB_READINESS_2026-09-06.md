# CloudBase 数据库就绪记录（2026-09-06）

## 变更范围

本次只处理生产 NoSQL 集合结构与集合权限，目标环境为 `lomo-wechat-d0gcakr952f0d90b8`（`ap-shanghai`），集合为 `ape_game_state`。没有读取、导出、修改或删除任何业务文档；没有执行数据迁移、部署、环境转换、密钥轮换或服务流量切换。

依据为 `docs/PERSISTENCE.md`：生产集合应使用 `ADMINONLY`，并建立五个普通复合索引，服务端通过权威持久化适配器访问。

## 实际执行

| 操作 | 结果 | 请求标识 |
|---|---|---|
| 检查 `ape_game_state` | 变更前不存在 | `c91109f0-6d6b-45bc-bbd7-f435eafe2aa7` |
| 查询变更前权限 | `PRIVATE` | `9cd8f92e-df7c-451f-a512-3a2604078ee1` |
| 创建 `ape_game_state` | 成功，空集合 | `006adee2-b924-4a3d-9790-1fe9816708ae` |
| 创建 `ape_kind_owner_seq` | 成功 | `89ef453b-eb8f-480f-8d67-4aa60bd8b517` |
| 创建 `ape_kind_owner_board_seq` | 成功 | `7382045a-ab2e-4d0d-b9bf-cb291b1c398b` |
| 创建 `ape_kind_board_score` | 成功 | `05d24b8b-61ba-4395-bca2-6f8b953b30f2` |
| 创建 `ape_kind_created` | 成功 | `d30faf6d-8730-440f-8197-9134b62cf603` |
| 创建 `ape_kind_seq` | 成功 | `07c9ee4a-de5e-4b5f-8450-d56a6f8e94dc` |
| 更新集合权限为 `ADMINONLY` | 成功 | `c634adaa-b4a3-42cb-8eea-cbce1d6421ee` |

索引字段顺序与 `PERSISTENCE.md` 一致：

- `ape_kind_owner_seq`: `kind ASC, owner ASC, seq DESC`
- `ape_kind_owner_board_seq`: `kind ASC, owner ASC, board ASC, seq DESC`
- `ape_kind_board_score`: `kind ASC, board ASC, score DESC`
- `ape_kind_created`: `kind ASC, createdAt ASC`
- `ape_kind_seq`: `kind ASC, seq ASC`

## 变更后回读

CloudBase `describeCollection`/`listIndexes` 回读成功：集合共 7 个索引，包括上述 5 个应用复合索引，以及平台已有的 `_id_` 和 `_openid_1` 默认索引；5 个应用索引均为非唯一索引，方向和字段顺序正确。回读请求标识：`3d4f0842-783c-43a2-8213-584d99cdb485`、`cd429b20-8c61-4e50-ba75-5b4934f7464f`。

权限回读显示：

```text
resourceType = noSqlDatabase
resourceId   = ape_game_state
Permission   = ADMINONLY
SecurityRule = ""
```

权限回读请求标识：`78e68ba5-ddf8-41af-b6ef-7827f62450cb`。

## 仍未关闭的阻断

- 集合为空是本次创建时的事实，不代表已完成生产数据迁移。必须先获取旧 JSON/线上实例权威快照、身份映射和余额对账，再导入正式玩家数据。
- `ADMINONLY` 只验证了控制面集合权限；尚未用生产云托管运行身份执行一次真实读写事务，也没有验证客户端直读被拒绝。应在部署新版本前完成最小权限运行身份探针。
- 当前在线云托管服务仍可能运行旧版本；本次没有部署服务或切换写流量。生产代码必须显式使用 `APP_PERSISTENCE=cloudbase`、正确 EnvId 和 `APP_DB_COLLECTION=ape_game_state`，并继续 fail closed。
- 需要在迁移后验证重启、跨实例、并发幂等、commit 后丢响应恢复、账本分页与备份恢复；不能把结构就绪当作运营就绪。
- NoSQL 环境信息显示数据库实例 `RUNNING`，但容量、费用告警、备份策略、归档和恢复演练仍未完成。

## 结论

`ape_game_state` 的生产集合骨架已具备：集合存在、5 个契约索引存在且方向正确、集合权限为 `ADMINONLY`。这只关闭“集合/索引/权限尚未配置”的可独立处理项，不能解除 `PERSISTENCE.md` 所列的数据迁移、运行身份、真实事务、备份恢复、正式登录和部署阻断。
