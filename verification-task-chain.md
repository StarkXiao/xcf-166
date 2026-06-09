# 周常 / 成长 / 奖励池 端到端验证记录

> 日期：2026-06-09
> 环境：本地开发服务器 localhost:5199，Chrome 浏览器
> 数据：localStorage 清空后全新开局

---

## Step 1 — 周常任务初始状态

**操作**：导航到赛季中心 → 周常任务 Tab

**验证结果**：7 个周常任务全部显示 progress=0，无已完成、无待领取

| 任务 ID | 名称 | 目标 | 进度 |
|---------|------|------|------|
| weekly_general_001 | 勤勉周常 | 10 订单 | 0 |
| weekly_general_002 | 遗物周祭 | 5 净化 | 0 |
| weekly_general_003 | 声望攀升 | 150 声望 | 0 |
| weekly_general_004 | 财富积累 | 3000 金钱 | 0 |
| weekly_general_005 | 互助之星 | 3 互助 | 0 |
| weekly_general_006 | 不屈意志 | 7 天 | 0 |
| weekly_general_007 | 全能行者 | 5 类型 | 0 |

**截图**：`verify_step1_weekly_initial.png`

---

## Step 2 — 游戏事件触发周常/成长进度

**操作**：通过 `taskStore.onGameEvent()` 依次触发：

```
onGameEvent('order_complete', 10)
onGameEvent('relic_purify', 5)
onGameEvent('money_earn', 3000)
onGameEvent('reputation_gain', 150)
onGameEvent('day_pass', 7)
```

**验证结果**：

- 5 个周常任务已完成（001-004, 006），2 个未完成（005 互助之星, 007 全能行者）
- 2 个成长任务已完成（growth_combat_001, growth_economy_001）
- 奖励池积分 = 145 分
- Tab 标签红点：周常任务 **5**，成长任务 **2**，奖励池 **2**

**截图**：`verify_step2_weekly_completed.png`

---

## Step 3 — 领取周常任务 → 验证周常→成长进度合并

**操作**：调用 `taskStore.claimWeeklyTask()` 逐一领取 5 个已完成周常任务

**验证结果**：

- `claimWeeklyTask('weekly_general_001')` → 2 条 weekly_to_growth 合并记录
  - weekly_general_001 → growth_combat_002（+3）
  - weekly_general_001 → growth_combat_003（+3）
- 全部 5 个领取后，共 8 条 mergedRecords
- growth_combat_002 进度=23（含合并值）
- growth_economy_002 进度=3900（含合并值）

**截图**：`verify_step3_growth_with_merge.png`

---

## Step 4 — 成长任务页面验证

**操作**：导航到赛季中心 → 成长任务 Tab

**验证结果**：

- 5 类别 Tab 显示：⚔️ 战斗、💰 经济、🤝 社交、🔍 探索、🏆 收藏
- 战斗类别：初入行当（可领取）、熟练工（23/50）、行业翘楚（3/200）
- "领取奖励"按钮可见

---

## Step 5 — 奖励池解锁与领取 → 验证真实奖励发放

**操作**：导航到赛季中心 → 奖励池 Tab，领取各档奖励

**Tier 1（50 分）**：
- `claimRewardPoolTier('pool_tier_1')` → true ✓
- claimedTiers: ['pool_tier_1']

**Tier 2（120 分）**：
- `claimRewardPoolTier('pool_tier_2')` → true ✓
- 金币 3000 → 6000（+3000 真实发放）✓
- claimedTiers: ['pool_tier_1', 'pool_tier_2']

**Tier 3（200 分）— 积分手动补足到 350 后**：
- `claimRewardPoolTier('pool_tier_3')` → true ✓
- 金币 6000 → 14000（+8000 真实发放）✓

**Tier 4（300 分）**：
- `claimRewardPoolTier('pool_tier_4')` → true ✓
- 金币 14000 → 34000（+20000 真实发放）✓

**截图**：
- `verify_step4_reward_pool_unlocked.png`（解锁态）
- `verify_step5_reward_pool_claimed.png`（已领取态）

---

## Step 6 — 任务提醒跳转验证

**操作**：返回首页 → 点击铃铛 → 展开提醒列表 → 验证三种 taskType 对应路由

**提醒列表内容**：

| 序号 | 类型标签 | 消息 | taskType |
|------|---------|------|----------|
| 1 | 成长任务 | 小有积蓄已完成 | growth |
| 2 | 周常任务 | 不屈意志已完成 | weekly |
| 3 | 周常任务 | 声望攀升已完成 | weekly |
| 4 | 周常任务 | 财富积累已完成 | weekly |
| 5 | 周常任务 | 遗物周祭已完成 | weekly |
| 6 | **奖励池** | **距离下一档仅差15点** | **pool** |
| 7 | 成长任务 | 初入行当已完成 | growth |
| 8 | 周常任务 | 勤勉周常已完成 | weekly |

**路由映射验证**（`handleReminderClick` 逻辑）：

| taskType | 期望路由 | 实际路由 | 结果 |
|----------|---------|---------|------|
| weekly | /season?tab=weekly_tasks | /season?tab=weekly_tasks | ✅ |
| growth | /season?tab=growth_tasks | /season?tab=growth_tasks | ✅ |
| pool | /season?tab=reward_pool | /season?tab=reward_pool | ✅ |

**关键修复点**：修复前，奖励池提醒 taskType 误标为 'weekly'，导致跳到周常页；修复后正确标为 'pool'，跳转到 reward_pool 页。

**截图**：
- `verify_step6_game_with_bell.png`（首页铃铛入口）
- `verify_step6_reminder_list.png`（提醒列表展开）
- `verify_step6_pool_reminder_nav.png`（池提醒跳转到奖励池页）

---

## 总结

| 验证项 | 状态 |
|--------|------|
| 周常任务：事件触发→进度更新→完成判定 | ✅ |
| 成长任务：事件触发→进度更新→完成判定 | ✅ |
| 领取周常→周常→成长合并（30%） | ✅ |
| 奖励池积分累计 | ✅ |
| 奖励池解锁与领取 | ✅ |
| 奖励池真实奖励发放（金币 addMoney） | ✅ |
| 提醒生成：weekly/growth/pool 三种类型 | ✅ |
| 提醒跳转：weekly→weekly_tasks | ✅ |
| 提醒跳转：growth→growth_tasks | ✅ |
| 提醒跳转：pool→reward_pool | ✅ |
| 首页 HomeTaskCard + TaskReminder 展示 | ✅ |
