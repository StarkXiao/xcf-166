import { createPinia, setActivePinia } from 'pinia'
import { useFriendStore } from './src/stores/friendStore'
import { useGameStore } from './src/stores/gameStore'
import { useSeasonStore } from './src/stores/seasonStore'
import { useCharacterStore } from './src/stores/characterStore'
import { useAchievementStore } from './src/stores/achievementStore'
import { useShopStore } from './src/stores/shopStore'
import { useOrderStore } from './src/stores/orderStore'
import { useEventStore } from './src/stores/eventStore'
import { FRIEND_STORAGE_KEY } from './src/types/friend'
import fs from 'fs'
import path from 'path'

const mockStorage: Record<string, string> = {}
globalThis.localStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => { mockStorage[key] = value },
  removeItem: (key: string) => { delete mockStorage[key] },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]) },
  key: (index: number) => Object.keys(mockStorage)[index] || null,
  length: Object.keys(mockStorage).length
} as Storage

const pinia = createPinia()
setActivePinia(pinia)

const gameStore = useGameStore()
const seasonStore = useSeasonStore()
const characterStore = useCharacterStore()
const achievementStore = useAchievementStore()
const shopStore = useShopStore()
const orderStore = useOrderStore()
const eventStore = useEventStore()
const friendStore = useFriendStore()

interface VerificationStep {
  step: number
  name: string
  expected: string
  actual: string
  passed: boolean
  notes?: string
  screenshot?: string
}

const report: {
  title: string
  date: string
  serverUrl: string
  steps: VerificationStep[]
  summary: {
    totalSteps: number
    passed: number
    failed: number
    issues: string[]
  }
  notifications: any[]
  activities: any[]
} = {
  title: '好友协作完整链路验证报告',
  date: new Date().toLocaleString('zh-CN'),
  serverUrl: 'http://localhost:5177/',
  steps: [],
  summary: {
    totalSteps: 0,
    passed: 0,
    failed: 0,
    issues: []
  },
  notifications: [],
  activities: []
}

function addStep(step: VerificationStep) {
  report.steps.push(step)
  report.summary.totalSteps++
  if (step.passed) {
    report.summary.passed++
  } else {
    report.summary.failed++
    report.summary.issues.push(`步骤 ${step.step}: ${step.name} - ${step.notes || '未通过'}`)
  }
  console.log(`\n=== 步骤 ${step.step}: ${step.name} ===`)
  console.log(`预期: ${step.expected}`)
  console.log(`实际: ${step.actual}`)
  console.log(`结果: ${step.passed ? '✅ 通过' : '❌ 失败'}`)
  if (step.notes) console.log(`备注: ${step.notes}`)
}

function clearStorage() {
  localStorage.clear()
  console.log('\n已执行 localStorage.clear()')
}

async function runVerification() {
  console.log('='.repeat(80))
  console.log('好友协作完整链路验证 - 开始')
  console.log('='.repeat(80))

  clearStorage()
  gameStore.resetGame()
  friendStore.clearAllData()

  console.log('\n--- 步骤 1-3: 初始化游戏 ---')
  gameStore.startGame()
  friendStore.initFriendSystem('player_local')
  console.log('游戏初始化完成')

  console.log('\n--- 步骤 4: 跳过新手引导 (模拟) ---')
  console.log('新手引导已跳过 (模拟)')

  addStep({
    step: 1,
    name: '清除数据并初始化',
    expected: 'localStorage 数据被清除，游戏重新初始化',
    actual: 'localStorage.clear() 已执行，gameStore 和 friendStore 已重置',
    passed: true,
    notes: '通过代码模拟浏览器操作'
  })

  addStep({
    step: 2,
    name: '游戏初始化完成',
    expected: '游戏状态正常，好友系统初始化完成',
    actual: `金币: ${gameStore.stats.money}, 好友数: ${friendStore.friends.length}`,
    passed: gameStore.stats.money === 2000 && friendStore.friends.length === 4,
    notes: gameStore.stats.money === 2000 ? '' : `金币应为2000，实际为${gameStore.stats.money}`
  })

  console.log('\n' + '='.repeat(80))
  console.log('步骤 6: 记录初始状态')
  console.log('='.repeat(80))
  
  const initialState = {
    friendCount: friendStore.friends.length,
    pendingRequestCount: friendStore.pendingHelpRequestCount,
    pendingInviteCount: friendStore.pendingInviteCount,
    money: gameStore.stats.money,
    mutualTasks: friendStore.mutualTaskProgresses.map(t => ({
      id: t.id,
      taskId: t.taskId,
      initiator: t.initiatorName,
      helper: t.helperName,
      status: t.status,
      progress: t.progress
    })),
    notifications: friendStore.notifications.map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      fromPlayerId: n.fromPlayerId,
      fromPlayerName: n.fromPlayerName
    }))
  }

  console.log('初始状态:', JSON.stringify(initialState, null, 2))

  addStep({
    step: 3,
    name: '记录初始状态 - 好友数量',
    expected: '好友数量 = 4',
    actual: `好友数量 = ${initialState.friendCount}`,
    passed: initialState.friendCount === 4,
    notes: initialState.friendCount === 4 ? '' : `好友数量应为4，实际为${initialState.friendCount}`
  })

  addStep({
    step: 4,
    name: '记录初始状态 - 待处理请求',
    expected: '待处理互助请求 = 1 (资金拆借任务)',
    actual: `待处理互助请求 = ${initialState.pendingRequestCount}`,
    passed: initialState.pendingRequestCount === 1,
    notes: initialState.pendingRequestCount === 1 ? '' : `待处理请求应为1，实际为${initialState.pendingRequestCount}`
  })

  addStep({
    step: 5,
    name: '记录初始状态 - 金币数量',
    expected: '金币数量 = 2000',
    actual: `金币数量 = ${initialState.money}`,
    passed: initialState.money === 2000,
    notes: initialState.money === 2000 ? '' : `金币应为2000，实际为${initialState.money}`
  })

  addStep({
    step: 6,
    name: '检查初始通知 - task_request',
    expected: '收到 task_request 通知，消息"遗物猎人小李 邀请你协助「资金拆借」"，fromPlayerName = "遗物猎人小李"',
    actual: initialState.notifications.find(n => n.type === 'task_request') 
      ? `消息: "${initialState.notifications.find(n => n.type === 'task_request')?.message}", fromPlayerName: "${initialState.notifications.find(n => n.type === 'task_request')?.fromPlayerName}"`
      : '未找到 task_request 通知',
    passed: initialState.notifications.some(n => 
      n.type === 'task_request' && 
      n.fromPlayerName === '遗物猎人小李' &&
      n.message.includes('资金拆借') &&
      n.message.includes('邀请你协助')
    ),
    notes: !initialState.notifications.some(n => n.type === 'task_request') ? '缺少初始通知' : 
      !initialState.notifications.some(n => n.fromPlayerName === '遗物猎人小李') ? 'fromPlayerName 错误' :
      !initialState.notifications.some(n => n.message.includes('邀请你协助')) ? '消息视角错误（应该是别人邀请你）' : ''
  })

  console.log('\n' + '='.repeat(80))
  console.log('验证步骤 7: 接受资金拆借请求')
  console.log('='.repeat(80))

  const pendingTask = friendStore.mutualTaskProgresses.find(
    t => t.status === 'requested' && t.helperId === friendStore.playerId
  )

  console.log('找到待接受任务:', pendingTask ? {
    id: pendingTask.id,
    initiator: pendingTask.initiatorName,
    status: pendingTask.status
  } : '未找到')

  addStep({
    step: 7,
    name: '找到待接受的资金拆借任务',
    expected: '找到1个状态为 requested 的资金拆借任务，发起方为"遗物猎人小李"',
    actual: pendingTask 
      ? `找到任务: 发起方=${pendingTask.initiatorName}, 状态=${pendingTask.status}` 
      : '未找到待接受任务',
    passed: !!pendingTask && pendingTask.initiatorName === '遗物猎人小李' && pendingTask.status === 'requested',
    notes: !pendingTask ? '缺少待接受任务' : 
      pendingTask.initiatorName !== '遗物猎人小李' ? `发起方错误: ${pendingTask.initiatorName}` :
      pendingTask.status !== 'requested' ? `状态错误: ${pendingTask.status}` : ''
  })

  if (pendingTask) {
    const notificationsBefore = [...friendStore.notifications]
    const result = friendStore.acceptMutualTask(pendingTask.id)
    
    const newNotifications = friendStore.notifications.filter(
      n => !notificationsBefore.some(nb => nb.id === n.id)
    )

    console.log('接受任务后新通知:', newNotifications.map(n => ({
      type: n.type,
      message: n.message,
      fromPlayerName: n.fromPlayerName
    })))

    const taskAfter = friendStore.mutualTaskProgresses.find(t => t.id === pendingTask.id)
    const taskAcceptedNotif = newNotifications.find(n => n.type === 'task_accepted')
    const helpNeededNotif = newNotifications.find(n => n.type === 'help_needed')

    addStep({
      step: 8,
      name: '接受任务 - 状态变化',
      expected: '任务状态从 requested 变为 in_progress',
      actual: taskAfter ? `状态 = ${taskAfter.status}` : '任务不存在',
      passed: !!taskAfter && taskAfter.status === 'in_progress',
      notes: taskAfter?.status !== 'in_progress' ? `状态应为 in_progress，实际为 ${taskAfter?.status}` : ''
    })

    addStep({
      step: 9,
      name: '接受任务 - task_accepted 通知',
      expected: '收到通知: "你接受了 遗物猎人小李 的「资金拆借」互助请求"，fromPlayerName = "遗物猎人小李"',
      actual: taskAcceptedNotif 
        ? `消息: "${taskAcceptedNotif.message}", fromPlayerName: "${taskAcceptedNotif.fromPlayerName}"` 
        : '未收到 task_accepted 通知',
      passed: !!taskAcceptedNotif && 
        taskAcceptedNotif.message.includes('你接受了') && 
        taskAcceptedNotif.message.includes('遗物猎人小李') &&
        taskAcceptedNotif.fromPlayerName === '遗物猎人小李',
      notes: !taskAcceptedNotif ? '缺少 task_accepted 通知' :
        !taskAcceptedNotif.message.includes('你接受了') ? '消息视角错误（应该是"你接受了..."）' :
        taskAcceptedNotif.fromPlayerName !== '遗物猎人小李' ? `fromPlayerName 错误: ${taskAcceptedNotif.fromPlayerName}` : ''
    })

    addStep({
      step: 10,
      name: '接受任务 - help_needed 通知',
      expected: '收到通知: "请向 遗物猎人小李 赠送 1000 金币完成互助"，fromPlayerName = "遗物猎人小李"',
      actual: helpNeededNotif 
        ? `消息: "${helpNeededNotif.message}", fromPlayerName: "${helpNeededNotif.fromPlayerName}"` 
        : '未收到 help_needed 通知',
      passed: !!helpNeededNotif && 
        helpNeededNotif.message.includes('请向') && 
        helpNeededNotif.message.includes('遗物猎人小李') &&
        helpNeededNotif.message.includes('1000') &&
        helpNeededNotif.fromPlayerName === '遗物猎人小李',
      notes: !helpNeededNotif ? '缺少 help_needed 通知' :
        !helpNeededNotif.message.includes('请向') ? '消息视角错误' :
        helpNeededNotif.fromPlayerName !== '遗物猎人小李' ? `fromPlayerName 错误: ${helpNeededNotif.fromPlayerName}` : ''
    })

    console.log('\n' + '='.repeat(80))
    console.log('验证步骤 8: 赠送金币完成任务')
    console.log('='.repeat(80))

    const moneyBefore = gameStore.stats.money
    console.log('赠送前金币:', moneyBefore)

    const notificationsBeforeGift = [...friendStore.notifications]
    const activitiesBeforeGift = [...friendStore.activities]
    const giftResult = friendStore.giftMoneyToFriend(pendingTask.id)
    
    const moneyAfter = gameStore.stats.money
    const taskAfterGift = friendStore.mutualTaskProgresses.find(t => t.id === pendingTask.id)
    
    const newNotificationsAfterGift = friendStore.notifications.filter(
      n => !notificationsBeforeGift.some(nb => nb.id === n.id)
    )
    
    const newActivitiesAfterGift = friendStore.activities.filter(
      a => !activitiesBeforeGift.some(ab => ab.id === a.id)
    )

    console.log('赠送后金币:', moneyAfter)
    console.log('任务状态:', taskAfterGift?.status)
    console.log('新通知:', newNotificationsAfterGift.map(n => ({
      type: n.type,
      message: n.message,
      fromPlayerName: n.fromPlayerName
    })))
    console.log('新活动记录:', newActivitiesAfterGift.map(a => ({
      type: a.activityType,
      description: a.description
    })))

    const taskCompletedNotif = newNotificationsAfterGift.find(n => n.type === 'task_completed')
    const rewardAvailableNotif = newNotificationsAfterGift.find(n => n.type === 'reward_available')
    const moneyGiftedActivity = newActivitiesAfterGift.find(a => a.activityType === 'money_gifted')

    addStep({
      step: 11,
      name: '赠送金币 - 金币变化',
      expected: `金币从 ${moneyBefore} 减少到 ${moneyBefore - 1000}`,
      actual: `金币从 ${moneyBefore} 变为 ${moneyAfter}`,
      passed: moneyAfter === moneyBefore - 1000,
      notes: moneyAfter !== moneyBefore - 1000 ? `金币减少量错误，应为1000，实际减少${moneyBefore - moneyAfter}` : ''
    })

    addStep({
      step: 12,
      name: '赠送金币 - 任务状态变化',
      expected: '任务状态从 in_progress 变为 completed',
      actual: taskAfterGift ? `状态 = ${taskAfterGift.status}` : '任务不存在',
      passed: !!taskAfterGift && taskAfterGift.status === 'completed',
      notes: taskAfterGift?.status !== 'completed' ? `状态应为 completed，实际为 ${taskAfterGift?.status}` : ''
    })

    addStep({
      step: 13,
      name: '赠送金币 - 任务进度',
      expected: '任务进度 = 1000/1000',
      actual: taskAfterGift ? `进度 = ${taskAfterGift.progress}/${taskAfterGift.helperProgress}` : '任务不存在',
      passed: !!taskAfterGift && taskAfterGift.progress === 1000 && taskAfterGift.helperProgress === 1000,
      notes: taskAfterGift?.progress !== 1000 ? `进度应为 1000，实际为 ${taskAfterGift?.progress}` : ''
    })

    addStep({
      step: 14,
      name: '赠送金币 - task_completed 通知',
      expected: '收到通知: "与 遗物猎人小李 的「资金拆借」已完成..."，fromPlayerName = "遗物猎人小李"',
      actual: taskCompletedNotif 
        ? `消息: "${taskCompletedNotif.message}", fromPlayerName: "${taskCompletedNotif.fromPlayerName}"` 
        : '未收到 task_completed 通知',
      passed: !!taskCompletedNotif && 
        taskCompletedNotif.message.includes('与') && 
        taskCompletedNotif.message.includes('遗物猎人小李') &&
        taskCompletedNotif.message.includes('已完成') &&
        taskCompletedNotif.fromPlayerName === '遗物猎人小李',
      notes: !taskCompletedNotif ? '缺少 task_completed 通知' :
        !taskCompletedNotif.message.includes('与') ? '消息视角错误（应该是"与XX的..."）' :
        taskCompletedNotif.fromPlayerName !== '遗物猎人小李' ? `fromPlayerName 错误: ${taskCompletedNotif.fromPlayerName}` : ''
    })

    addStep({
      step: 15,
      name: '赠送金币 - reward_available 通知',
      expected: '收到通知: "与 遗物猎人小李 的「资金拆借」奖励已准备好"，fromPlayerName = "遗物猎人小李"',
      actual: rewardAvailableNotif 
        ? `消息: "${rewardAvailableNotif.message}", fromPlayerName: "${rewardAvailableNotif.fromPlayerName}"` 
        : '未收到 reward_available 通知',
      passed: !!rewardAvailableNotif && 
        rewardAvailableNotif.message.includes('与') && 
        rewardAvailableNotif.message.includes('遗物猎人小李') &&
        rewardAvailableNotif.message.includes('奖励已准备好') &&
        rewardAvailableNotif.fromPlayerName === '遗物猎人小李',
      notes: !rewardAvailableNotif ? '缺少 reward_available 通知' :
        !rewardAvailableNotif.message.includes('与') ? '消息视角错误' :
        rewardAvailableNotif.fromPlayerName !== '遗物猎人小李' ? `fromPlayerName 错误: ${rewardAvailableNotif.fromPlayerName}` : ''
    })

    addStep({
      step: 16,
      name: '赠送金币 - money_gifted 活动记录',
      expected: '活动记录中新增 money_gifted 类型，描述包含"向 遗物猎人小李 赠送了 1000 金币"',
      actual: moneyGiftedActivity 
        ? `类型: ${moneyGiftedActivity.activityType}, 描述: "${moneyGiftedActivity.description}"` 
        : '未找到 money_gifted 活动记录',
      passed: !!moneyGiftedActivity && 
        moneyGiftedActivity.activityType === 'money_gifted' &&
        moneyGiftedActivity.description.includes('遗物猎人小李') &&
        moneyGiftedActivity.description.includes('1000 金币'),
      notes: !moneyGiftedActivity ? '缺少 money_gifted 活动记录' :
        moneyGiftedActivity.activityType !== 'money_gifted' ? `活动类型错误: ${moneyGiftedActivity.activityType}` : ''
    })

    console.log('\n' + '='.repeat(80))
    console.log('验证步骤 9: 领取奖励')
    console.log('='.repeat(80))

    const friendBeforeClaim = friendStore.friends.find(f => f.friendId === pendingTask.initiatorId)
    const friendshipExpBefore = friendBeforeClaim?.friendshipExp || 0
    const activitiesBeforeClaim = [...friendStore.activities]
    
    const claimResult = friendStore.claimMutualTaskReward(pendingTask.id)
    
    const taskAfterClaim = friendStore.mutualTaskProgresses.find(t => t.id === pendingTask.id)
    const friendAfterClaim = friendStore.friends.find(f => f.friendId === pendingTask.initiatorId)
    const friendshipExpAfter = friendAfterClaim?.friendshipExp || 0
    
    const newActivitiesAfterClaim = friendStore.activities.filter(
      a => !activitiesBeforeClaim.some(ab => ab.id === a.id)
    )

    console.log('领取后任务状态:', taskAfterClaim?.status)
    console.log('友谊经验变化:', friendshipExpBefore, '→', friendshipExpAfter)
    console.log('新活动记录:', newActivitiesAfterClaim.map(a => ({
      type: a.activityType,
      description: a.description
    })))

    const rewardClaimedActivity = newActivitiesAfterClaim.find(a => a.activityType === 'reward_claimed')

    addStep({
      step: 17,
      name: '领取奖励 - 任务状态变化',
      expected: '任务状态从 completed 变为 claimed',
      actual: taskAfterClaim ? `状态 = ${taskAfterClaim.status}` : '任务不存在',
      passed: !!taskAfterClaim && taskAfterClaim.status === 'claimed',
      notes: taskAfterClaim?.status !== 'claimed' ? `状态应为 claimed，实际为 ${taskAfterClaim?.status}` : ''
    })

    addStep({
      step: 18,
      name: '领取奖励 - 友谊经验增加',
      expected: `友谊经验增加 50（从 ${friendshipExpBefore} 到 ${friendshipExpBefore + 50}）`,
      actual: `友谊经验从 ${friendshipExpBefore} 变为 ${friendshipExpAfter}，增加了 ${friendshipExpAfter - friendshipExpBefore}`,
      passed: friendshipExpAfter === friendshipExpBefore + 50,
      notes: friendshipExpAfter !== friendshipExpBefore + 50 ? `友谊经验增加量错误，应为50，实际增加${friendshipExpAfter - friendshipExpBefore}` : ''
    })

    addStep({
      step: 19,
      name: '领取奖励 - reward_claimed 活动记录',
      expected: '活动记录中新增 reward_claimed 类型，描述包含"领取了「资金拆借」的奖励"',
      actual: rewardClaimedActivity 
        ? `类型: ${rewardClaimedActivity.activityType}, 描述: "${rewardClaimedActivity.description}"` 
        : '未找到 reward_claimed 活动记录',
      passed: !!rewardClaimedActivity && 
        rewardClaimedActivity.activityType === 'reward_claimed' &&
        rewardClaimedActivity.description.includes('资金拆借'),
      notes: !rewardClaimedActivity ? '缺少 reward_claimed 活动记录' : ''
    })
  }

  console.log('\n' + '='.repeat(80))
  console.log('验证步骤 10: 发起新的互助请求')
  console.log('='.repeat(80))

  const friendToHelp = friendStore.friends[0]
  const taskToStart = friendStore.availableMutualTasks.find(t => t.behaviorType === 'order_completed')

  console.log('选择好友:', friendToHelp?.friendName)
  console.log('选择任务:', taskToStart?.title)

  if (friendToHelp && taskToStart) {
    const notificationsBeforeStart = [...friendStore.notifications]
    const startResult = friendStore.startMutualTask(taskToStart.id, friendToHelp.friendId)
    
    const newTask = friendStore.mutualTaskProgresses.find(
      t => t.initiatorId === friendStore.playerId && t.helperId === friendToHelp.friendId && t.status === 'requested'
    )
    
    const newNotificationsAfterStart = friendStore.notifications.filter(
      n => !notificationsBeforeStart.some(nb => nb.id === n.id)
    )

    console.log('新任务:', newTask ? {
      id: newTask.id,
      status: newTask.status,
      initiator: newTask.initiatorName,
      helper: newTask.helperName
    } : '未找到')
    console.log('新通知:', newNotificationsAfterStart.map(n => ({
      type: n.type,
      message: n.message,
      fromPlayerName: n.fromPlayerName
    })))

    const taskRequestNotif = newNotificationsAfterStart.find(n => n.type === 'task_request')

    addStep({
      step: 20,
      name: '发起互助请求 - 任务状态',
      expected: `新任务状态为 requested，发起方=你，帮助方=${friendToHelp.friendName}`,
      actual: newTask 
        ? `状态=${newTask.status}, 发起方=${newTask.initiatorName}, 帮助方=${newTask.helperName}` 
        : '未找到新任务',
      passed: !!newTask && newTask.status === 'requested' && 
        newTask.initiatorId === friendStore.playerId &&
        newTask.helperId === friendToHelp.friendId,
      notes: !newTask ? '任务创建失败' :
        newTask.status !== 'requested' ? `状态错误: ${newTask.status}` : ''
    })

    addStep({
      step: 21,
      name: '发起互助请求 - 通知消息',
      expected: `收到通知: "你向 ${friendToHelp.friendName} 发起了「${taskToStart.title}」互助请求"，fromPlayerName = "${friendToHelp.friendName}"`,
      actual: taskRequestNotif 
        ? `消息: "${taskRequestNotif.message}", fromPlayerName: "${taskRequestNotif.fromPlayerName}"` 
        : '未收到 task_request 通知',
      passed: !!taskRequestNotif && 
        taskRequestNotif.message.includes('你向') && 
        taskRequestNotif.message.includes(friendToHelp.friendName) &&
        taskRequestNotif.message.includes(taskToStart.title) &&
        taskRequestNotif.message.includes('发起了') &&
        taskRequestNotif.fromPlayerName === friendToHelp.friendName,
      notes: !taskRequestNotif ? '缺少 task_request 通知' :
        !taskRequestNotif.message.includes('你向') ? '消息视角错误（应该是"你向XX发起了..."）' :
        taskRequestNotif.fromPlayerName !== friendToHelp.friendName ? `fromPlayerName 错误: ${taskRequestNotif.fromPlayerName}` : ''
    })
  }

  console.log('\n' + '='.repeat(80))
  console.log('验证步骤 11: 拒绝请求')
  console.log('='.repeat(80))

  const secondFriend = friendStore.friends[2]
  const anotherTask = friendStore.availableMutualTasks.find(t => t.behaviorType === 'sanity_recovered')

  console.log('创建另一个待拒绝的任务...')
  if (secondFriend && anotherTask) {
    const mockTaskId = `task_reject_test_${Date.now()}`
    const now = Date.now()
    const mockTaskToReject = {
      id: mockTaskId,
      taskId: anotherTask.id,
      initiatorId: secondFriend.friendId,
      initiatorName: secondFriend.friendName,
      helperId: friendStore.playerId,
      helperName: friendStore.playerName,
      status: 'requested' as const,
      progress: 0,
      helperProgress: 0,
      startedAt: now - 1800000,
      expiresAt: now + anotherTask.duration * 1000,
      initiatorBonusApplied: false,
      helperBonusApplied: false,
      requestMessage: '帮我恢复一下理智值吧！'
    }
    friendStore.mutualTaskProgresses.push(mockTaskToReject)

    friendStore.addNotification({
      type: 'task_request',
      title: '🤝 互助请求',
      message: `${secondFriend.friendName} 邀请你协助「${anotherTask.title}」`,
      fromPlayerId: secondFriend.friendId,
      fromPlayerName: secondFriend.friendName,
      fromPlayerAvatar: secondFriend.friendAvatar,
      data: { taskProgressId: mockTaskId, taskId: anotherTask.id }
    })

    console.log('已创建待拒绝任务:', {
      taskId: mockTaskId,
      initiator: secondFriend.friendName,
      taskName: anotherTask.title
    })

    const notificationsBeforeReject = [...friendStore.notifications]
    const rejectResult = friendStore.rejectMutualTask(mockTaskId, '现在太忙了')
    
    const taskAfterReject = friendStore.mutualTaskProgresses.find(t => t.id === mockTaskId)
    const newNotificationsAfterReject = friendStore.notifications.filter(
      n => !notificationsBeforeReject.some(nb => nb.id === n.id)
    )

    console.log('拒绝后任务状态:', taskAfterReject?.status)
    console.log('新通知:', newNotificationsAfterReject.map(n => ({
      type: n.type,
      message: n.message,
      fromPlayerName: n.fromPlayerName
    })))

    const taskRejectedNotif = newNotificationsAfterReject.find(n => n.type === 'task_rejected')

    addStep({
      step: 22,
      name: '拒绝请求 - 任务状态变化',
      expected: '任务状态从 requested 变为 rejected',
      actual: taskAfterReject ? `状态 = ${taskAfterReject.status}` : '任务不存在',
      passed: !!taskAfterReject && taskAfterReject.status === 'rejected',
      notes: taskAfterReject?.status !== 'rejected' ? `状态应为 rejected，实际为 ${taskAfterReject?.status}` : ''
    })

    addStep({
      step: 23,
      name: '拒绝请求 - 通知消息',
      expected: `收到通知: "你拒绝了 ${secondFriend.friendName} 的「${anotherTask.title}」互助请求..."，fromPlayerName = "${secondFriend.friendName}"`,
      actual: taskRejectedNotif 
        ? `消息: "${taskRejectedNotif.message}", fromPlayerName: "${taskRejectedNotif.fromPlayerName}"` 
        : '未收到 task_rejected 通知',
      passed: !!taskRejectedNotif && 
        taskRejectedNotif.message.includes('你拒绝了') && 
        taskRejectedNotif.message.includes(secondFriend.friendName) &&
        taskRejectedNotif.message.includes(anotherTask.title) &&
        taskRejectedNotif.fromPlayerName === secondFriend.friendName,
      notes: !taskRejectedNotif ? '缺少 task_rejected 通知' :
        !taskRejectedNotif.message.includes('你拒绝了') ? '消息视角错误（应该是"你拒绝了XX的..."）' :
        taskRejectedNotif.fromPlayerName !== secondFriend.friendName ? `fromPlayerName 错误: ${taskRejectedNotif.fromPlayerName}` : ''
    })
  }

  console.log('\n' + '='.repeat(80))
  console.log('验证步骤 12: 通知归属检查')
  console.log('='.repeat(80))

  console.log('\n所有通知列表:')
  friendStore.notifications.forEach((n, index) => {
    console.log(`\n[${index + 1}] 类型: ${n.type}`)
    console.log(`    标题: ${n.title}`)
    console.log(`    消息: ${n.message}`)
    console.log(`    fromPlayerId: ${n.fromPlayerId}`)
    console.log(`    fromPlayerName: ${n.fromPlayerName}`)
    console.log(`    fromPlayerAvatar: ${n.fromPlayerAvatar}`)
  })

  report.notifications = friendStore.notifications.map(n => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    fromPlayerId: n.fromPlayerId,
    fromPlayerName: n.fromPlayerName,
    fromPlayerAvatar: n.fromPlayerAvatar,
    read: n.read
  }))

  report.activities = friendStore.activities.map(a => ({
    id: a.id,
    activityType: a.activityType,
    friendId: a.friendId,
    description: a.description,
    timestamp: new Date(a.timestamp).toLocaleString('zh-CN')
  }))

  const notificationIssues: string[] = []
  
  friendStore.notifications.forEach((n, index) => {
    const playerName = friendStore.playerName
    const expectedPerspectives: Record<string, { shouldContain: string[], shouldNotContain: string[] }> = {
      'task_request': {
        shouldContain: n.message.includes('你向') ? ['你向', '发起了'] : ['邀请你协助'],
        shouldNotContain: n.message.includes('你向') ? ['邀请你协助'] : ['你向']
      },
      'task_accepted': {
        shouldContain: ['你接受了'],
        shouldNotContain: ['接受了你的']
      },
      'task_rejected': {
        shouldContain: ['你拒绝了'],
        shouldNotContain: ['拒绝了你的']
      },
      'task_completed': {
        shouldContain: ['与', '已完成'],
        shouldNotContain: []
      },
      'reward_available': {
        shouldContain: ['与', '奖励已准备好'],
        shouldNotContain: []
      },
      'help_needed': {
        shouldContain: ['请向', '赠送'],
        shouldNotContain: []
      }
    }

    const expected = expectedPerspectives[n.type]
    if (expected) {
      const containsAll = expected.shouldContain.every(text => n.message.includes(text))
      const containsNone = expected.shouldNotContain.every(text => !n.message.includes(text))
      
      if (!containsAll || !containsNone) {
        notificationIssues.push(`通知[${index + 1}] ${n.type}: 消息视角可能错误 - "${n.message}"`)
      }
    }

    if (n.fromPlayerName === playerName && n.type !== 'invite') {
      notificationIssues.push(`通知[${index + 1}] ${n.type}: fromPlayerName 不应是玩家自己`)
    }
  })

  addStep({
    step: 24,
    name: '通知归属检查',
    expected: '所有通知的 fromPlayerName 与消息内容匹配，没有归属错位，消息视角正确',
    actual: notificationIssues.length === 0 
      ? `共 ${friendStore.notifications.length} 条通知，全部检查通过` 
      : `发现 ${notificationIssues.length} 个问题:\n${notificationIssues.join('\n')}`,
    passed: notificationIssues.length === 0,
    notes: notificationIssues.join('\n') || ''
  })

  console.log('\n' + '='.repeat(80))
  console.log('验证完成 - 生成报告')
  console.log('='.repeat(80))

  console.log(`\n总计: ${report.summary.totalSteps} 步`)
  console.log(`通过: ${report.summary.passed} 步`)
  console.log(`失败: ${report.summary.failed} 步`)
  
  if (report.summary.issues.length > 0) {
    console.log('\n发现的问题:')
    report.summary.issues.forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue}`)
    })
  } else {
    console.log('\n✅ 所有验证步骤通过！')
  }

  const reportPath = path.join(__dirname, 'FRIEND_COLLABORATION_VERIFICATION_REPORT.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8')
  console.log(`\n详细报告已保存到: ${reportPath}`)

  const mdReport = generateMarkdownReport(report)
  const mdReportPath = path.join(__dirname, 'FRIEND_COLLABORATION_VERIFICATION_REPORT.md')
  fs.writeFileSync(mdReportPath, mdReport, 'utf-8')
  console.log(`Markdown 报告已保存到: ${mdReportPath}`)

  return report
}

function generateMarkdownReport(report: any): string {
  let md = `# 好友协作完整链路验证报告\n\n`
  md += `- **验证时间**: ${report.date}\n`
  md += `- **服务器地址**: ${report.serverUrl}\n`
  md += `- **总计步骤**: ${report.summary.totalSteps}\n`
  md += `- **通过**: ${report.summary.passed} ✅\n`
  md += `- **失败**: ${report.summary.failed} ❌\n\n`

  if (report.summary.issues.length > 0) {
    md += `## ⚠️ 发现的问题\n\n`
    report.summary.issues.forEach((issue: string, i: number) => {
      md += `${i + 1}. ${issue}\n\n`
    })
  } else {
    md += `## ✅ 验证结论\n\n所有功能验证通过，好友协作完整链路运行正常。\n\n`
  }

  md += `---\n\n## 详细验证步骤\n\n`

  report.steps.forEach((step: any) => {
    const status = step.passed ? '✅ 通过' : '❌ 失败'
    md += `### 步骤 ${step.step}: ${step.name}\n\n`
    md += `- **状态**: ${status}\n`
    md += `- **预期结果**: ${step.expected}\n`
    md += `- **实际结果**: ${step.actual}\n`
    if (step.notes) {
      md += `- **备注**: ${step.notes}\n`
    }
    md += `\n---\n\n`
  })

  md += `## 通知列表\n\n`
  md += `| # | 类型 | 标题 | 消息 | fromPlayerName | 已读 |\n`
  md += `|---|------|------|------|----------------|------|\n`
  report.notifications.forEach((n: any, i: number) => {
    md += `| ${i + 1} | ${n.type} | ${n.title} | ${n.message} | ${n.fromPlayerName} | ${n.read ? '是' : '否'} |\n`
  })

  md += `\n## 活动记录\n\n`
  md += `| # | 类型 | 描述 | 时间 |\n`
  md += `|---|------|------|------|\n`
  report.activities.forEach((a: any, i: number) => {
    md += `| ${i + 1} | ${a.activityType} | ${a.description} | ${a.timestamp} |\n`
  })

  md += `\n---\n\n*本报告由自动化验证脚本生成*`

  return md
}

runVerification().catch(console.error)
