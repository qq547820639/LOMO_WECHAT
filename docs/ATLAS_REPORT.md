# ATLAS_REPORT

> ⚠️ 勘误（2026-09-06）：本报告为机器生成的研究数据；文中产物路径 tools/bake/out/atlas/ 已随后续处置调整（全量图集不再留存工作区，仅 data/atlas-report.json 数据与 evidence/atlas_samples 私有档案）；mp4 状态已更新为「209 个已转换（tools/bake/out/video/），待上 CDN」。（P0-3 图集打包，2026-09-05 20:33）

> 机器生成：tools/src/bake_pag.ts --atlas + tools/bake/render.html（浏览器内流式 MaxRects 打包）。明细 data/atlas-report.json。

## 结果

| 指标 | 值 |
|---|---|
| 降帧策略 | 15fps（策略表 12-20 区间中值；selectFrames 步进取帧） |
| 可打包文件 | 326 / 535（视频桶 209） |
| 打包帧数 | 5888（源 19056 帧按 15fps 降采样后） |
| 共享图集 | 478 张 2048×2048 WebP（MaxRects-BSSF 在线放置；含 24 文件/分片 relaunch 碎片，理论下限 182 张，见 totals.theoreticalSheets） |
| 图集总体积 | 66516KB（535 文件实测；按 PAG 字节等比外推 ≈ 57MB） |
| 往返像素比对 | 10 文件 × 2 帧，maxMeanAbsDiff=1.03%（WebP q=0.8 有损，<2% 视为一致） |
| 无头满帧基准 | 3 张 2048² 图集 × 900 次子矩形 drawImage：0.007ms/帧（headless ANGLE Metal，非真机；60fps 预算 16.7ms 余量 充足） |
| 会话韧性 | renderer 崩溃 1 次（libpag VideoReader WASM 堆泄漏，25-35 文件/页必然发生），分片 flush=partFiles 文件/片，丢失帧 0（已从统计扣除） |

## P1 全量批处理备注（2026-09-06）

- **覆盖范围**：全量 535 文件 = assets/pag 469 + tug/blockBattleRoyal/dagger/beast/robbery 66（多根目录模式，组名带根前缀）。bake 段 535/535 全成功、0 失败。
- **崩溃韧性实战验证**：本轮 renderer 崩溃 1 次，HTTP 服务同时失联——relaunch 已具备「服务存活检查 + 监听重建 + 整浏览器重启」三级自愈，恢复后零数据丢失（lost=0）。
- **视频桶 209 个**（39%）：全量集大帧占比高于样本集（角色/全屏演出类 PAG 显著更多），规则为 maxDim>1024 不可 2×2 平铺 / >1MP / 面积超 6 张 sheet。
- **mp4 转换挂起**：环境无 ffmpeg 且无 brew（macOS 系统包），209 个超大件记 RUNTIME_REQUIRED；图集产物可先行按 bundle 接入 CDN。
- **产物裁剪**：evidence/atlas_samples 含 keep 组（pag 根组 3 meta 分片 + 4 张代表性 sheet + marbles 全量 6 文件），2.8MB 入库；全量 478 张 sheet 在 tools/bake/out/atlas/（gitignored），接入 CDN 时整体搬运。
- **demo 发射**：game-assets/atlas/marbles 为全量 marbles 组产物（181 帧/5 sheets/launch_click 38 帧），build_wechat 按形态 A 并入微信包 manifest（7 图集条目），verify bundle-smoke 断言通过。

## 视频桶（超大件，209 个）

单帧最长边 > sheetSize/2（无法 2×2 平铺，占用率必然 <50%）或单帧 >1MP 或降采样后面积 >6 张 sheet → 转 mp4 远端视频（三级策略第 3 级）。环境无 ffmpeg，转换记 RUNTIME_REQUIRED。

| 文件 | 组 | 尺寸 | 降采样后帧数 |
|---|---|---|---|
| pag/airship.pag | pag | 1125×840 | 100 |
| pag/airship_coin_buy.pag | pag | 1035×165 | 24 |
| pag/airship_medal_buy.pag | pag | 1035×165 | 24 |
| pag/airship_stone_buy.pag | pag | 1035×165 | 24 |
| pag/ape_atmosphere.pag | pag | 1125×1800 | 60 |
| pag/ape_friend_bg_seek.pag | pag | 1125×660 | 120 |
| pag/ape_friend_final.pag | pag | 1125×200 | 15 |
| pag/ape_friend_second.pag | pag | 1125×200 | 15 |
| pag/ape_group_top_banner.pag | pag | 500×500 | 108 |
| pag/ape_index_product.pag | pag | 1125×807 | 76 |
| pag/ape_rabbit_airship.pag | pag | 1125×2436 | 75 |
| pag/ape_ribbon.pag | pag | 1125×1360 | 85 |
| pag/ape_seek1.pag | pag | 1125×300 | 15 |
| pag/ape_seek2.pag | pag | 1125×300 | 15 |
| pag/ape_stage1.pag | pag | 1125×1000 | 107 |
| pag/ape_stage2.pag | pag | 1125×1000 | 104 |
| pag/ape_stage3.pag | pag | 1125×1000 | 19 |
| pag/ape_upgradation_success.pag | pag | 1125×2436 | 30 |
| pag/arrow.pag | pag | 1125×840 | 100 |
| pag/auto_open_normal_egg.pag | pag | 800×800 | 45 |
| pag/bg_.pag | pag | 563×700 | 120 |
| pag/bg_ape_fffline.pag | pag | 1350×2436 | 30 |
| pag/bg_box.pag | pag | 1125×1593 | 90 |
| pag/bg_joint.pag | pag | 1125×1377 | 120 |
| pag/bg_light.pag | pag | 1125×1125 | 120 |
| pag/bg_starship.pag | pag | 1125×1300 | 120 |
| pag/box_animation1.pag | pag | 1125×2436 | 14 |
| pag/box_animation2.pag | pag | 1125×2436 | 30 |
| pag/box_animation3.pag | pag | 1125×400 | 24 |
| pag/box_animation4.pag | pag | 1125×2436 | 20 |
| pag/box_bg.pag | pag | 1125×1593 | 120 |
| pag/box_card_pag_lv1.pag | pag | 1125×1530 | 60 |
| pag/box_card_pag_lv2.pag | pag | 1125×1530 | 60 |
| pag/box_card_pag_lv3.pag | pag | 1125×1530 | 60 |
| pag/box_card_pag_lv4.pag | pag | 1125×1530 | 60 |
| pag/box_card_pag_lv5.pag | pag | 1125×1530 | 60 |
| pag/box_card_pag_lv6.pag | pag | 1125×1530 | 60 |
| pag/button_art.pag | pag | 1125×2436 | 20 |
| pag/button_light.pag | pag | 1125×240 | 30 |
| pag/card_appear_bmp.pag | pag | 1125×2436 | 8 |
| pag/card_blue_card_bmp.pag | pag | 1125×2436 | 27 |
| pag/card_blue_open_bmp.pag | pag | 1125×2436 | 25 |
| pag/card_compose.pag | pag | 1080×1267 | 45 |
| pag/card_finger_bmp.pag | pag | 1125×400 | 24 |
| pag/card_golden_card_bmp.pag | pag | 1125×2436 | 26 |
| pag/card_golden_open_bmp.pag | pag | 1125×2436 | 25 |
| pag/card_idle_bmp.pag | pag | 1125×2436 | 30 |
| pag/card_normal_open_bmp.pag | pag | 1125×2436 | 12 |
| pag/card_open.pag | pag | 1125×2436 | 25 |
| pag/card_open_selection.pag | pag | 1125×2436 | 25 |
| pag/card_pink_card_bmp.pag | pag | 1125×2436 | 26 |
| pag/card_pink_open_bmp.pag | pag | 1125×2436 | 25 |
| pag/card_play.pag | pag | 1125×800 | 8 |
| pag/card_split.pag | pag | 1080×1267 | 45 |
| pag/coins.pag | pag | 1125×1500 | 60 |
| pag/coloured_ribbon.pag | pag | 1125×2436 | 28 |
| pag/compose_acquire.pag | pag | 1125×2436 | 50 |
| pag/flash.pag | pag | 780×780 | 100 |
| pag/flash_card_banner_animation.pag | pag | 1125×1200 | 60 |
| pag/flashcard_bg.pag | pag | 720×1559 | 36 |
| pag/joint_index_product.pag | pag | 1125×1000 | 120 |
| pag/kill_coloured_ribbon.pag | pag | 900×700 | 41 |
| pag/luckybag.pag | pag | 1125×1400 | 75 |
| pag/luckybagEvenOpen.pag | pag | 1125×600 | 13 |
| pag/luckybagSky.pag | pag | 1125×2435 | 75 |
| pag/medal_egg.pag | pag | 800×800 | 43 |
| pag/mines_join_light.pag | pag | 1125×2436 | 30 |
| pag/mines_join_ribbon.pag | pag | 1125×1800 | 60 |
| pag/monkey.pag | pag | 2250×480 | 48 |
| pag/monkey_attack_foot.pag | pag | 1125×1000 | 9 |
| pag/monkey_attack_hand.pag | pag | 1125×1000 | 10 |
| pag/monkey_challenge_down_win.pag | pag | 1125×1000 | 8 |
| pag/monkey_challenge_up_win.pag | pag | 1125×1000 | 8 |
| pag/monkey_defeat_down.pag | pag | 1125×1000 | 10 |
| pag/monkey_defeat_up.pag | pag | 1125×1000 | 10 |
| pag/monkey_die.pag | pag | 1125×1000 | 10 |
| pag/monkey_idle.pag | pag | 1125×1000 | 15 |
| pag/monkey_recover.pag | pag | 1125×1000 | 29 |
| pag/monkey_win.pag | pag | 1125×1000 | 25 |
| pag/more_light.pag | pag | 1125×2436 | 30 |
| pag/nx_chest.pag | pag | 1065×474 | 44 |
| pag/open_gold_card.pag | pag | 1125×2436 | 26 |
| pag/open_medal_egg.pag | pag | 800×800 | 45 |
| pag/open_rock_egg.pag | pag | 800×800 | 45 |
| pag/opening.pag | pag | 1125×1800 | 19 |
| pag/openresult.pag | pag | 1125×2436 | 50 |
| pag/pag_levelup.pag | pag | 1125×1125 | 30 |
| pag/pag_levelup_fail.pag | pag | 1125×1125 | 30 |
| pag/pag_levelup_success.pag | pag | 1125×1125 | 30 |
| pag/pag_nail.pag | pag | 1125×1125 | 30 |
| pag/pag_product_special.pag | pag | 1125×1401 | 120 |
| pag/pit_leading.pag | pag | 800×1125 | 60 |
| pag/pit_update_ribbon.pag | pag | 1125×780 | 19 |
| pag/private_mines_light.pag | pag | 1125×260 | 40 |
| pag/puzzle_detail_light.pag | pag | 1125×1500 | 60 |
| pag/puzzle_mine_item.pag | pag | 1065×440 | 36 |
| pag/red_package_appear.pag | pag | 1125×2436 | 8 |
| pag/red_package_idle.pag | pag | 1125×2436 | 15 |
| pag/red_package_open.pag | pag | 1125×2436 | 8 |
| pag/red_package_win.pag | pag | 1125×800 | 45 |
| pag/rock_battle_royal_banner_new.pag | pag | 1065×306 | 25 |
| pag/rock_egg.pag | pag | 800×800 | 43 |
| pag/rss_box_indicator.pag | pag | 1125×420 | 25 |
| pag/smog_big.pag | pag | 1080×1080 | 25 |
| pag/smog_middle.pag | pag | 1080×1080 | 25 |
| pag/smog_small.pag | pag | 1080×1080 | 25 |
| pag/starship_travel.pag | pag | 1125×660 | 75 |
| pag/synthesis_card_index.pag | pag | 1080×780 | 120 |
| pag/universe_banner.pag | pag | 1065×264 | 12 |
| pag/universe_log_scale_big.pag | pag | 1125×760 | 15 |
| pag/universe_room_upgrade.pag | pag | 1125×500 | 30 |
| pag/updated_loop.pag | pag | 1125×2436 | 13 |
| pag/updating.pag | pag | 1125×2436 | 30 |
| pag/wizard_box.pag | pag | 720×720 | 88 |
| pag/wizard_rabbit.pag | pag | 720×720 | 101 |
| pag/ape/smog_big.pag | pag/ape | 1080×1080 | 45 |
| pag/arena/battle.pag | pag/arena | 1125×2436 | 62 |
| pag/arena/index.pag | pag/arena | 1125×1125 | 45 |
| pag/arena/pool.pag | pag/arena | 1125×800 | 44 |
| pag/arena/result_failure.pag | pag/arena | 1125×2436 | 22 |
| pag/arena/result_success.pag | pag/arena | 1125×2436 | 22 |
| pag/challenge_boss/boss_attack.pag | pag/challenge_boss | 1125×1000 | 32 |
| pag/challenge_boss/boss_circle_blue.pag | pag/challenge_boss | 1000×1000 | 38 |
| pag/challenge_boss/boss_circle_red.pag | pag/challenge_boss | 1000×1000 | 38 |
| pag/challenge_boss/rabbit_attack.pag | pag/challenge_boss | 1125×1300 | 34 |
| pag/challenge_boss/rabbit_be_attack.pag | pag/challenge_boss | 1125×2436 | 33 |
| pag/challenge_boss/vs_pag.pag | pag/challenge_boss | 1125×1500 | 19 |
| pag/dress_medal/body_up.pag | pag/dress_medal | 800×1100 | 26 |
| pag/dress_medal/head_up.pag | pag/dress_medal | 800×1100 | 26 |
| pag/dress_medal/left_ear_up.pag | pag/dress_medal | 800×1100 | 26 |
| pag/dress_medal/left_footer_up.pag | pag/dress_medal | 800×1100 | 26 |
| pag/dress_medal/left_hand_up.pag | pag/dress_medal | 800×1100 | 26 |
| pag/dress_medal/leg_up.pag | pag/dress_medal | 800×1100 | 26 |
| pag/dress_medal/right_ear_up.pag | pag/dress_medal | 800×1100 | 26 |
| pag/dress_medal/right_footer_up.pag | pag/dress_medal | 800×1100 | 26 |
| pag/dress_medal/right_hand_up.pag | pag/dress_medal | 800×1100 | 26 |
| pag/dress_normal/body_down.pag | pag/dress_normal | 800×1100 | 26 |
| pag/dress_normal/body_up.pag | pag/dress_normal | 800×1100 | 26 |
| pag/dress_normal/head_down.pag | pag/dress_normal | 800×1100 | 26 |
| pag/dress_normal/head_up.pag | pag/dress_normal | 800×1100 | 26 |
| pag/dress_normal/left_ear_down.pag | pag/dress_normal | 800×1100 | 26 |
| pag/dress_normal/left_ear_up.pag | pag/dress_normal | 800×1100 | 26 |
| pag/dress_normal/left_footer_down.pag | pag/dress_normal | 800×1100 | 26 |
| pag/dress_normal/left_footer_up.pag | pag/dress_normal | 800×1100 | 26 |
| pag/dress_normal/left_hand_down.pag | pag/dress_normal | 800×1100 | 26 |
| pag/dress_normal/left_hand_up.pag | pag/dress_normal | 800×1100 | 26 |
| pag/dress_normal/leg_down.pag | pag/dress_normal | 800×1100 | 26 |
| pag/dress_normal/leg_up.pag | pag/dress_normal | 800×1100 | 26 |
| pag/dress_normal/right_ear_down.pag | pag/dress_normal | 800×1100 | 26 |
| pag/dress_normal/right_ear_up.pag | pag/dress_normal | 800×1100 | 26 |
| pag/dress_normal/right_footer_down.pag | pag/dress_normal | 800×1100 | 26 |
| pag/dress_normal/right_footer_up.pag | pag/dress_normal | 800×1100 | 26 |
| pag/dress_normal/right_hand_down.pag | pag/dress_normal | 800×1100 | 26 |
| pag/dress_normal/right_hand_up.pag | pag/dress_normal | 800×1100 | 26 |
| pag/dress_rock/body_up.pag | pag/dress_rock | 800×1100 | 26 |
| pag/dress_rock/head_up.pag | pag/dress_rock | 800×1100 | 26 |
| pag/dress_rock/left_ear_up.pag | pag/dress_rock | 800×1100 | 26 |
| pag/dress_rock/left_footer_up.pag | pag/dress_rock | 800×1100 | 26 |
| pag/dress_rock/left_hand_up.pag | pag/dress_rock | 800×1100 | 26 |
| pag/dress_rock/leg_up.pag | pag/dress_rock | 800×1100 | 26 |
| pag/dress_rock/right_ear_up.pag | pag/dress_rock | 800×1100 | 26 |
| pag/dress_rock/right_footer_up.pag | pag/dress_rock | 800×1100 | 26 |
| pag/dress_rock/right_hand_up.pag | pag/dress_rock | 800×1100 | 26 |
| pag/escape_animal/rope_breaks.pag | pag/escape_animal | 300×1125 | 4 |
| pag/escape_animal/prop/lightning.pag | pag/escape_animal/prop | 1125×2436 | 7 |
| pag/marbles/swing.pag | pag/marbles | 1125×1734 | 120 |
| pag/marbles/gray/middle.pag | pag/marbles/gray | 156×1281 | 15 |
| pag/marbles/gray/quick.pag | pag/marbles/gray | 156×1281 | 13 |
| pag/marbles/gray/slow.pag | pag/marbles/gray | 156×1281 | 18 |
| pag/marbles/gray/standby.pag | pag/marbles/gray | 156×1281 | 25 |
| pag/marbles/orange/middle.pag | pag/marbles/orange | 156×1281 | 15 |
| pag/marbles/orange/quick.pag | pag/marbles/orange | 156×1281 | 13 |
| pag/marbles/orange/slow.pag | pag/marbles/orange | 156×1281 | 18 |
| pag/marbles/orange/standby.pag | pag/marbles/orange | 156×1281 | 25 |
| pag/marbles/white/middle.pag | pag/marbles/white | 156×1281 | 15 |
| pag/marbles/white/quick.pag | pag/marbles/white | 156×1281 | 13 |
| pag/marbles/white/slow.pag | pag/marbles/white | 156×1281 | 18 |
| pag/marbles/white/standby.pag | pag/marbles/white | 156×1281 | 25 |
| pag/marbles/yellow/middle.pag | pag/marbles/yellow | 156×1281 | 15 |
| pag/marbles/yellow/quick.pag | pag/marbles/yellow | 156×1281 | 13 |
| pag/marbles/yellow/slow.pag | pag/marbles/yellow | 156×1281 | 18 |
| pag/marbles/yellow/standby.pag | pag/marbles/yellow | 156×1281 | 25 |
| pag/medal_reward/glass.pag | pag/medal_reward | 1125×800 | 11 |
| pag/medal_reward/glass_light.pag | pag/medal_reward | 1125×500 | 22 |
| pag/medal_reward/medal_fight.pag | pag/medal_reward | 1125×900 | 69 |
| pag/medal_reward/screen_idle.pag | pag/medal_reward | 1125×800 | 62 |
| pag/medal_reward/screen_start.pag | pag/medal_reward | 1125×800 | 20 |
| pag/medal_reward/start_ship.pag | pag/medal_reward | 1125×2436 | 5 |
| pag/medal_reward/universe_sky.pag | pag/medal_reward | 1125×1350 | 75 |
| pag/monkeyFighting/monkey_fighting_appear.pag | pag/monkeyFighting | 1125×380 | 24 |
| pag/monkeyFighting/monkey_fighting_stele.pag | pag/monkeyFighting | 720×900 | 60 |
| pag/ready_go/ready_go.pag | pag/ready_go | 1125×600 | 35 |
| pag/rob/duwulaixi.pag | pag/rob | 1125×2436 | 15 |
| pag/rob/duzhuanchang.pag | pag/rob | 1125×2436 | 31 |
| pag/rob/result_bar_1.pag | pag/rob | 1125×78 | 120 |
| pag/rob/result_bar_2.pag | pag/rob | 1125×78 | 120 |
| pag/sport_ribbon/ribbon.pag | pag/sport_ribbon | 1125×700 | 71 |
| pag/strengthen/body.pag | pag/strengthen | 1125×1400 | 30 |
| pag/strengthen/ear_left.pag | pag/strengthen | 1125×1400 | 30 |
| pag/strengthen/ear_right.pag | pag/strengthen | 1125×1400 | 30 |
| pag/strengthen/eye_nose.pag | pag/strengthen | 1125×1400 | 30 |
| pag/strengthen/face.pag | pag/strengthen | 1125×1400 | 30 |
| pag/strengthen/footer_left.pag | pag/strengthen | 1125×1400 | 30 |
| pag/strengthen/footer_right.pag | pag/strengthen | 1125×1400 | 30 |
| pag/strengthen/hand_left.pag | pag/strengthen | 1125×1400 | 30 |
| pag/strengthen/hand_right.pag | pag/strengthen | 1125×1400 | 30 |
| pag/strengthen/pants.pag | pag/strengthen | 1125×1400 | 30 |
| blockBattleRoyal/kill_coloured_ribbon.pag | blockBattleRoyal | 900×700 | 41 |
| beast/pag/star.pag | beast/pag | 492×492 | 120 |

## 分组统计

| 组 | 文件 | 打包 | 帧数 | sheets | 体积 |
|---|---|---|---|---|---|
| pag | 182 | 67 | 2038 | 241 | 28928KB |
| pag/ape | 5 | 4 | 128 | 21 | 1243KB |
| pag/arena | 12 | 7 | 194 | 13 | 998KB |
| pag/battleRoyal | 14 | 14 | 239 | 3 | 1283KB |
| pag/buff | 1 | 1 | 6 | 1 | 87KB |
| pag/challenge_boss | 11 | 5 | 115 | 45 | 6354KB |
| pag/chicken | 7 | 7 | 182 | 7 | 2077KB |
| pag/debuff | 6 | 6 | 30 | 1 | 260KB |
| pag/dress_medal | 9 | 0 | 0 | 0 | 0KB |
| pag/dress_normal | 18 | 0 | 0 | 0 | 0KB |
| pag/dress_rock | 9 | 0 | 0 | 0 | 0KB |
| pag/escape_animal | 3 | 2 | 75 | 3 | 203KB |
| pag/escape_animal/cow | 9 | 9 | 72 | 3 | 698KB |
| pag/escape_animal/dog | 9 | 9 | 72 | 3 | 674KB |
| pag/escape_animal/fox | 9 | 9 | 72 | 3 | 700KB |
| pag/escape_animal/monkey | 9 | 9 | 72 | 3 | 697KB |
| pag/escape_animal/pig | 9 | 9 | 72 | 3 | 692KB |
| pag/escape_animal/prop | 3 | 2 | 30 | 3 | 1357KB |
| pag/escape_animal/prop/invincible | 2 | 2 | 19 | 1 | 186KB |
| pag/escape_animal/prop/shield | 1 | 1 | 15 | 1 | 193KB |
| pag/escape_animal/prop/speed | 2 | 2 | 19 | 1 | 153KB |
| pag/escape_animal/raccoon | 9 | 9 | 72 | 3 | 634KB |
| pag/escape_animal/tiger | 8 | 8 | 56 | 3 | 651KB |
| pag/idle | 6 | 6 | 426 | 21 | 3402KB |
| pag/marbles | 8 | 7 | 181 | 5 | 433KB |
| pag/marbles/gray | 10 | 6 | 14 | 1 | 33KB |
| pag/marbles/orange | 10 | 6 | 14 | 1 | 35KB |
| pag/marbles/white | 10 | 6 | 14 | 1 | 35KB |
| pag/marbles/yellow | 10 | 6 | 14 | 1 | 38KB |
| pag/me | 2 | 2 | 21 | 1 | 105KB |
| pag/medal_reward | 7 | 0 | 0 | 0 | 0KB |
| pag/monkeyFighting | 10 | 8 | 135 | 19 | 1705KB |
| pag/ready_go | 1 | 0 | 0 | 0 | 0KB |
| pag/rob | 10 | 6 | 129 | 3 | 1059KB |
| pag/run | 6 | 6 | 30 | 1 | 245KB |
| pag/sport | 6 | 6 | 102 | 5 | 1310KB |
| pag/sport_ribbon | 1 | 0 | 0 | 0 | 0KB |
| pag/sport_stay | 6 | 6 | 96 | 5 | 724KB |
| pag/sport_win | 6 | 6 | 96 | 5 | 1014KB |
| pag/strengthen | 13 | 3 | 156 | 11 | 955KB |
| tug | 29 | 29 | 468 | 20 | 4050KB |
| blockBattleRoyal | 16 | 15 | 204 | 5 | 994KB |
| dagger | 12 | 12 | 108 | 3 | 528KB |
| beast/pag | 6 | 5 | 75 | 7 | 1585KB |
| robbery | 3 | 3 | 27 | 1 | 199KB |

## 往返像素比对明细（打包→WebP→回抠 vs 直渲）

| 文件 | meanAbsDiff（×帧） |
|---|---|
| pag/super_vip_btn.pag | 0.45%, 0.42%, 0.43%, 0.43%, 0.46%, 0.42%, 0.40%, 0.39%, 0.39% |
| pag/wizard_pop_3.pag | 0.00%, 0.04%, 0.12%, 0.23%, 0.28%, 0.28%, 0.32%, 0.31%, 0.32%, 0.31%, 0.31%, 0.32%, 0.32%, 0.31%, 0.31%, 0.32%, 0.31%, 0.31%, 0.31%, 0.31%, 0.31%, 0.31%, 0.31%, 0.31%, 0.31%, 0.31%, 0.31%, 0.31%, 0.31%, 0.31%, 0.31%, 0.31%, 0.31%, 0.31%, 0.31%, 0.31%, 0.31%, 0.31%, 0.32%, 0.25%, 0.22%, 0.14%, 0.13% |
| pag/ape_buy.pag | 0.51%, 0.52%, 0.54%, 0.56%, 0.56%, 0.58%, 0.64%, 0.62%, 0.63%, 0.56%, 0.60%, 0.59%, 0.62%, 0.60%, 0.61%, 0.63%, 0.62%, 0.64%, 0.63%, 0.61%, 0.60%, 0.59%, 0.57%, 0.59%, 0.55%, 0.60%, 0.63%, 0.63%, 0.59%, 0.55%, 0.54%, 0.54%, 0.48%, 0.52%, 0.48%, 0.49%, 0.52%, 0.52%, 0.54%, 0.53%, 0.51%, 0.49%, 0.49%, 0.47%, 0.51% |
| pag/universe_destination.pag | 0.75%, 0.74%, 0.75%, 0.75%, 0.75%, 0.74%, 0.73%, 0.75%, 0.75%, 0.72% |
| pag/marbles/blue.pag | 0.00%, 1.03%, 0.94%, 0.77%, 0.66%, 0.62%, 0.59%, 0.55%, 0.51%, 0.49%, 0.48%, 0.45%, 0.44%, 0.42%, 0.40%, 0.38%, 0.36%, 0.36%, 0.36%, 0.32%, 0.34%, 0.33%, 0.32%, 0.28%, 0.27%, 0.28% |
| pag/marbles/orange.pag | 0.26%, 0.64%, 0.59%, 0.48%, 0.50%, 0.43%, 0.41%, 0.39%, 0.37%, 0.34%, 0.33%, 0.33%, 0.35%, 0.31%, 0.32%, 0.32%, 0.28%, 0.26%, 0.27%, 0.24%, 0.28%, 0.26%, 0.24%, 0.27%, 0.25%, 0.21% |
| pag/marbles/purple.pag | 0.22%, 0.55%, 0.51%, 0.46%, 0.42%, 0.42%, 0.39%, 0.37%, 0.34%, 0.33%, 0.33%, 0.32%, 0.33%, 0.32%, 0.31%, 0.28%, 0.25%, 0.23%, 0.26%, 0.26%, 0.25%, 0.24%, 0.23%, 0.23%, 0.22%, 0.19% |
| pag/marbles/white.pag | 0.22%, 0.36%, 0.36%, 0.34%, 0.31%, 0.24%, 0.23%, 0.24%, 0.21%, 0.19%, 0.16%, 0.14%, 0.14%, 0.11%, 0.11%, 0.10%, 0.10%, 0.10%, 0.09%, 0.10%, 0.09%, 0.07%, 0.06%, 0.06%, 0.08%, 0.07% |
| pag/monkeyFighting/kill_seat_alert.pag | 0.00%, 0.10%, 0.18%, 0.33%, 0.54%, 0.64%, 0.64%, 0.43%, 0.42%, 0.44%, 0.43%, 0.44%, 0.38%, 0.34%, 0.25% |
| pag/strengthen/airplane_loop.pag | 0.02%, 0.02%, 0.02%, 0.02%, 0.02%, 0.02%, 0.03%, 0.02%, 0.03%, 0.03%, 0.03%, 0.03%, 0.02%, 0.03%, 0.02%, 0.02%, 0.03%, 0.03%, 0.03%, 0.03%, 0.03%, 0.03%, 0.03%, 0.03%, 0.03%, 0.03%, 0.02%, 0.02%, 0.03%, 0.02%, 0.03%, 0.03%, 0.03%, 0.03%, 0.02%, 0.03%, 0.03%, 0.03%, 0.03%, 0.03%, 0.03%, 0.03%, 0.03%, 0.03%, 0.03%, 0.03%, 0.03%, 0.03%, 0.03%, 0.03%, 0.03%, 0.03%, 0.03%, 0.03%, 0.03%, 0.03%, 0.02%, 0.03%, 0.03%, 0.03%, 0.03%, 0.02%, 0.03%, 0.03%, 0.03%, 0.03%, 0.05%, 0.04%, 0.04%, 0.04%, 0.03%, 0.04%, 0.04%, 0.03%, 0.02%, 0.03%, 0.02%, 0.02%, 0.03%, 0.02%, 0.02%, 0.02%, 0.02%, 0.05%, 0.05%, 0.06%, 0.07%, 0.05%, 0.04%, 0.05%, 0.04%, 0.04%, 0.04%, 0.04%, 0.04%, 0.03%, 0.03%, 0.03%, 0.02%, 0.03%, 0.02%, 0.04%, 0.03%, 0.04%, 0.04%, 0.05%, 0.03%, 0.04%, 0.06%, 0.05%, 0.04%, 0.04%, 0.03%, 0.04%, 0.05%, 0.04%, 0.05%, 0.05%, 0.05%, 0.06% |

## 产物

- evidence/atlas_samples/：keep 组图集 + meta（入库）
- game-assets/atlas/launch_click/：微信包 demo 图集（构建器按形态 A 并入 manifest）
- tools/bake/out/atlas/：全部组图集 + meta（临时，不入库）

## P1 补充：视频桶 mp4 转换完成（2026-09-06）

- **209/209 全部编码成功**，总计 42MB（tools/bake/out/video/，gitignored），`data/video-report.json` 为逐文件清单。
- 编码参数：H.264 yuv420p CRF23 +faststart，帧率 = min(源fps, 30)；源帧渲染后即弃。
- ffmpeg 供给：evermeet.cx 静态包（`tools/bin/ffmpeg`，gitignored；GPL 二进制仅内部工具使用，不随 ZIP 分发）——ffmpeg-static npm 包因 release 下载超时弃用。
- 踩坑两连：①浏览器端 blank 帧跳过导致上传帧序号有缺口，image2 demuxer 要求连续 → 编码前重编号；②源帧宽高常为 1125 等奇数，yuv420p 要求偶数 → `crop=trunc(iw/2)*2:trunc(ih/2)*2`。
- 样本入库：evidence/video_samples/（button_light 8.6KB + head_up 102KB）。
