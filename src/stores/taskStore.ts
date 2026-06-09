import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  WeeklyTask,
  GrowthTask,
  WeeklyTaskProgress,
  GrowthTaskProgress,
  RewardPoolProgress,
  MergedProgressRecord,
  TaskReminder,
  TaskSaveData,
  MergedProgressType,
  RewardPoolSource,
} from '@/types/task'
import { weeklyTasks, getWeeklyTaskById } from '@/game/data/weeklyTasks'
import { growthTasks, getGrowthTaskById } from '@/game/data/growthTasks'
import { rewardPoolTiers, getNextTier } from '@/game/data/rewardPool'
import { useSeasonStore } from './seasonStore'
import { useFriendStore } from './friendStore'
import { useGameStore } from './gameStore'
import { useShopStore } from './shopStore'
import { useAchievementStore } from './achievementStore'

const STORAGE_KEY = 'task_center_data'
const STORAGE_VERSION = '1.0'

function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export const useTaskStore = defineStore('task', () => {
  const weeklyTaskList = ref<WeeklyTask[]>([...weeklyTasks])
  const growthTaskList = ref<GrowthTask[]>([...growthTasks])
  const weeklyProgressMap = ref<Map<string, WeeklyTaskProgress>>(new Map())
  const growthProgressMap = ref<Map<string, GrowthTaskProgress>>(new Map())
  const rewardPoolProgress = ref<RewardPoolProgress>({
    id: generateId('pool'),
    points: 0,
    claimedTiers: [],
    lastWeeklyReset: Date.now(),
  })
  const mergedRecords = ref<MergedProgressRecord[]>([])
  const reminders = ref<TaskReminder[]>([])

  const completedWeeklyCount = computed(() => {
    let count = 0
    weeklyProgressMap.value.forEach(p => { if (p.completed) count++ })
    return count
  })

  const completedGrowthCount = computed(() => {
    let count = 0
    growthProgressMap.value.forEach(p => { if (p.completed) count++ })
    return count
  })

  const totalWeeklyTasks = computed(() => weeklyTaskList.value.length)
  const totalGrowthTasks = computed(() => growthTaskList.value.length)

  const unclaimedWeeklyCount = computed(() => {
    let count = 0
    weeklyProgressMap.value.forEach(p => { if (p.completed && !p.claimed) count++ })
    return count
  })

  const unclaimedGrowthCount = computed(() => {
    let count = 0
    growthProgressMap.value.forEach(p => { if (p.completed && !p.claimed) count++ })
    return count
  })

  const unclaimedPoolTierCount = computed(() => {
    return rewardPoolTiers.filter(t =>
      t.threshold <= rewardPoolProgress.value.points &&
      !rewardPoolProgress.value.claimedTiers.includes(t.id)
    ).length
  })

  const totalUnclaimedCount = computed(() =>
    unclaimedWeeklyCount.value + unclaimedGrowthCount.value + unclaimedPoolTierCount.value
  )

  const currentPoolTier = computed(() => {
    const points = rewardPoolProgress.value.points
    let current = rewardPoolTiers[0]
    for (const tier of rewardPoolTiers) {
      if (points >= tier.threshold) current = tier
      else break
    }
    return current
  })

  const nextPoolTier = computed(() => {
    return getNextTier(rewardPoolProgress.value.points)
  })

  const poolProgressPercent = computed(() => {
    const points = rewardPoolProgress.value.points
    const next = nextPoolTier.value
    if (!next) return 100
    const prevThreshold = currentPoolTier.value?.threshold || 0
    const range = next.threshold - prevThreshold
    const current = points - prevThreshold
    return range > 0 ? Math.min(100, (current / range) * 100) : 100
  })

  const activeGrowthCategories = computed(() => {
    const categories = new Set(growthTaskList.value.map(t => t.category))
    return Array.from(categories)
  })

  const unreadReminderCount = computed(() =>
    reminders.value.filter(r => !r.read).length
  )

  function initTaskCenter() {
    loadFromStorage()
    ensureAllProgressEntries()
    checkAndResetWeeklyTasks()
    generateReminders()
  }

  function ensureAllProgressEntries() {
    weeklyTaskList.value.forEach(task => {
      if (!weeklyProgressMap.value.has(task.id)) {
        weeklyProgressMap.value.set(task.id, {
          id: generateId('wp'),
          taskId: task.id,
          progress: 0,
          completed: false,
          claimed: false,
        })
      }
    })
    growthTaskList.value.forEach(task => {
      if (!growthProgressMap.value.has(task.id)) {
        growthProgressMap.value.set(task.id, {
          id: generateId('gp'),
          taskId: task.id,
          progress: 0,
          completed: false,
          claimed: false,
        })
      }
    })
  }

  function checkAndResetWeeklyTasks() {
    const now = Date.now()
    const oneWeek = 7 * 24 * 60 * 60 * 1000
    if (now - rewardPoolProgress.value.lastWeeklyReset >= oneWeek) {
      weeklyTaskList.value.forEach(task => {
        const progress = weeklyProgressMap.value.get(task.id)
        if (progress) {
          progress.progress = 0
          progress.completed = false
          progress.claimed = false
          progress.completedAt = undefined
          progress.claimedAt = undefined
        }
      })
      rewardPoolProgress.value.lastWeeklyReset = now
      addReminder('weekly_reset', 'weekly', '周常任务已重置，快来查看新一周的任务吧！', 'new_available')
      saveToStorage()
    }
  }

  function updateWeeklyProgress(conditionType: string, amount: number = 1, params?: Record<string, any>) {
    weeklyTaskList.value.forEach(task => {
      if (task.condition.type !== conditionType) return
      if (params && task.condition.params) {
        const matches = Object.entries(task.condition.params).every(
          ([key, value]) => params[key] === value
        )
        if (!matches) return
      }

      const progress = weeklyProgressMap.value.get(task.id)
      if (!progress || progress.completed) return

      const newProgress = Math.min(progress.progress + amount, task.target)
      progress.progress = newProgress

      if (newProgress >= task.target && !progress.completed) {
        progress.completed = true
        progress.completedAt = Date.now()
        rewardPoolProgress.value.points += task.rewardPoolContribution

        addReminder(
          task.id,
          'weekly',
          `周常任务「${task.title}」已完成，快去领取奖励！`,
          'reward_available'
        )
      }

      weeklyProgressMap.value.set(task.id, progress)
    })

    saveToStorage()
  }

  function updateGrowthProgress(conditionType: string, amount: number = 1, params?: Record<string, any>) {
    growthTaskList.value.forEach(task => {
      if (task.condition.type !== conditionType) return
      if (params && task.condition.params) {
        const matches = Object.entries(task.condition.params).every(
          ([key, value]) => params[key] === value
        )
        if (!matches) return
      }

      const progress = growthProgressMap.value.get(task.id)
      if (!progress || progress.completed) return

      if (task.prerequisiteGrowthTaskId) {
        const prereq = growthProgressMap.value.get(task.prerequisiteGrowthTaskId)
        if (!prereq || !prereq.completed) return
      }

      const newProgress = Math.min(progress.progress + amount, task.target)
      progress.progress = newProgress

      if (newProgress >= task.target && !progress.completed) {
        progress.completed = true
        progress.completedAt = Date.now()
        rewardPoolProgress.value.points += task.rewardPoolContribution

        addReminder(
          task.id,
          'growth',
          `成长任务「${task.title}」已完成，快去领取奖励！`,
          'reward_available'
        )
      }

      growthProgressMap.value.set(task.id, progress)
    })

    saveToStorage()
  }

  function mergeProgressFromSeason(conditionType: string, amount: number, seasonTaskId: string) {
    weeklyTaskList.value.forEach(task => {
      if (!task.linkedSeasonTaskIds?.includes(seasonTaskId)) return

      const progress = weeklyProgressMap.value.get(task.id)
      if (!progress || progress.completed) return

      const mergedAmount = Math.floor(amount * 0.5)
      if (mergedAmount <= 0) return

      const existingMerge = mergedRecords.value.find(
        r => r.sourceType === 'daily_to_weekly' && r.sourceTaskId === seasonTaskId && r.targetTaskId === task.id
      )

      if (existingMerge) return

      const newProgress = Math.min(progress.progress + mergedAmount, task.target)
      progress.progress = newProgress

      const record: MergedProgressRecord = {
        id: generateId('merge'),
        sourceType: 'daily_to_weekly',
        sourceTaskId: seasonTaskId,
        targetTaskId: task.id,
        amount: mergedAmount,
        timestamp: Date.now(),
      }
      mergedRecords.value.push(record)

      if (newProgress >= task.target && !progress.completed) {
        progress.completed = true
        progress.completedAt = Date.now()
        rewardPoolProgress.value.points += task.rewardPoolContribution

        addReminder(
          task.id,
          'weekly',
          `周常任务「${task.title}」通过进度合并已完成！`,
          'reward_available'
        )
      }

      weeklyProgressMap.value.set(task.id, progress)
    })

    saveToStorage()
  }

  function mergeProgressFromMutual(behaviorType: string, amount: number, mutualTaskId: string) {
    weeklyTaskList.value.forEach(task => {
      if (!task.linkedMutualBehaviorTypes?.includes(behaviorType)) return

      const progress = weeklyProgressMap.value.get(task.id)
      if (!progress || progress.completed) return

      const mergedAmount = Math.floor(amount * 0.5)
      if (mergedAmount <= 0) return

      const existingMerge = mergedRecords.value.find(
        r => r.sourceType === 'mutual_to_weekly' && r.sourceTaskId === mutualTaskId && r.targetTaskId === task.id
      )
      if (existingMerge) return

      const newProgress = Math.min(progress.progress + mergedAmount, task.target)
      progress.progress = newProgress

      const record: MergedProgressRecord = {
        id: generateId('merge'),
        sourceType: 'mutual_to_weekly',
        sourceTaskId: mutualTaskId,
        targetTaskId: task.id,
        amount: mergedAmount,
        timestamp: Date.now(),
      }
      mergedRecords.value.push(record)

      if (newProgress >= task.target && !progress.completed) {
        progress.completed = true
        progress.completedAt = Date.now()
        rewardPoolProgress.value.points += task.rewardPoolContribution

        addReminder(
          task.id,
          'weekly',
          `周常任务「${task.title}」通过互助进度合并已完成！`,
          'reward_available'
        )
      }

      weeklyProgressMap.value.set(task.id, progress)
    })

    saveToStorage()
  }

  function mergeWeeklyToGrowth(weeklyTaskId: string, amount: number) {
    const weeklyTask = getWeeklyTaskById(weeklyTaskId)
    if (!weeklyTask) return

    growthTaskList.value.forEach(task => {
      if (!task.linkedWeeklyTaskIds?.includes(weeklyTaskId)) return

      const progress = growthProgressMap.value.get(task.id)
      if (!progress || progress.completed) return

      const mergedAmount = Math.floor(amount * 0.3)
      if (mergedAmount <= 0) return

      const existingMerge = mergedRecords.value.find(
        r => r.sourceType === 'weekly_to_growth' && r.sourceTaskId === weeklyTaskId && r.targetTaskId === task.id
      )
      if (existingMerge) return

      const newProgress = Math.min(progress.progress + mergedAmount, task.target)
      progress.progress = newProgress

      const record: MergedProgressRecord = {
        id: generateId('merge'),
        sourceType: 'weekly_to_growth',
        sourceTaskId: weeklyTaskId,
        targetTaskId: task.id,
        amount: mergedAmount,
        timestamp: Date.now(),
      }
      mergedRecords.value.push(record)

      if (newProgress >= task.target && !progress.completed) {
        progress.completed = true
        progress.completedAt = Date.now()
        rewardPoolProgress.value.points += task.rewardPoolContribution

        addReminder(
          task.id,
          'growth',
          `成长任务「${task.title}」通过周常进度合并已完成！`,
          'reward_available'
        )
      }

      growthProgressMap.value.set(task.id, progress)
    })

    saveToStorage()
  }

  function claimWeeklyTask(taskId: string): boolean {
    const progress = weeklyProgressMap.value.get(taskId)
    if (!progress || !progress.completed || progress.claimed) return false

    const task = getWeeklyTaskById(taskId)
    if (!task) return false

    progress.claimed = true
    progress.claimedAt = Date.now()
    weeklyProgressMap.value.set(taskId, progress)

    const seasonStore = useSeasonStore()
    if (seasonStore.isSeasonActive) {
      seasonStore.addExp(task.expReward, 'weekly_task', taskId)
    }

    mergeWeeklyToGrowth(taskId, task.target)

    saveToStorage()
    return true
  }

  function claimGrowthTask(taskId: string): boolean {
    const progress = growthProgressMap.value.get(taskId)
    if (!progress || !progress.completed || progress.claimed) return false

    const task = getGrowthTaskById(taskId)
    if (!task) return false

    progress.claimed = true
    progress.claimedAt = Date.now()
    growthProgressMap.value.set(taskId, progress)

    const seasonStore = useSeasonStore()
    if (seasonStore.isSeasonActive) {
      seasonStore.addExp(task.expReward, 'growth_task', taskId)
    }

    saveToStorage()
    return true
  }

  function claimRewardPoolTier(tierId: string): boolean {
    const tier = rewardPoolTiers.find(t => t.id === tierId)
    if (!tier) return false
    if (rewardPoolProgress.value.points < tier.threshold) return false
    if (rewardPoolProgress.value.claimedTiers.includes(tierId)) return false

    rewardPoolProgress.value.claimedTiers.push(tierId)

    const gameStore = useGameStore()
    const shopStore = useShopStore()
    const achievementStore = useAchievementStore()
    const seasonStore = useSeasonStore()

    tier.rewards.forEach(reward => {
      switch (reward.type) {
        case 'currency':
          if (typeof reward.value === 'number') {
            gameStore.addMoney(reward.value)
          }
          break
        case 'item':
          shopStore.grantItemById(String(reward.value))
          break
        case 'badge':
          achievementStore.grantBadge(reward.id, reward.name, reward.icon, reward.rarity)
          break
        case 'title':
          achievementStore.grantTitle(reward.id, reward.name, reward.icon)
          break
        case 'cosmetic':
          shopStore.grantItemById(String(reward.value))
          break
        case 'exp':
          if (typeof reward.value === 'number' && seasonStore.isSeasonActive) {
            seasonStore.addExp(reward.value, 'reward_pool', tierId)
          }
          break
      }
    })

    saveToStorage()
    return true
  }

  function onGameEvent(conditionType: string, amount: number = 1, params?: Record<string, any>) {
    updateWeeklyProgress(conditionType, amount, params)
    updateGrowthProgress(conditionType, amount, params)
    generateReminders()
  }

  function addRewardPoolPoints(points: number, _source: RewardPoolSource) {
    rewardPoolProgress.value.points += points
    generateReminders()
    saveToStorage()
  }

  function getWeeklyTaskProgress(taskId: string): WeeklyTaskProgress | undefined {
    return weeklyProgressMap.value.get(taskId)
  }

  function getGrowthTaskProgress(taskId: string): GrowthTaskProgress | undefined {
    return growthProgressMap.value.get(taskId)
  }

  function addReminder(taskId: string, taskType: 'weekly' | 'growth' | 'pool', message: string, triggerCondition: TaskReminder['triggerCondition']) {
    const existing = reminders.value.find(r => r.taskId === taskId && r.triggerCondition === triggerCondition && !r.read)
    if (existing) return

    const reminder: TaskReminder = {
      id: generateId('remind'),
      taskId,
      taskType,
      message,
      triggerCondition,
      read: false,
      createdAt: Date.now(),
    }
    reminders.value.unshift(reminder)
    if (reminders.value.length > 50) {
      reminders.value = reminders.value.slice(0, 50)
    }
  }

  function markReminderRead(reminderId: string) {
    const reminder = reminders.value.find(r => r.id === reminderId)
    if (reminder) {
      reminder.read = true
      saveToStorage()
    }
  }

  function markAllRemindersRead() {
    reminders.value.forEach(r => { r.read = true })
    saveToStorage()
  }

  function clearReadReminders() {
    reminders.value = reminders.value.filter(r => !r.read)
    saveToStorage()
  }

  function generateReminders() {
    weeklyTaskList.value.forEach(task => {
      const progress = weeklyProgressMap.value.get(task.id)
      if (!progress || progress.completed) return

      const percent = (progress.progress / task.target) * 100
      if (percent >= 80 && percent < 100) {
        addReminder(task.id, 'weekly', `周常任务「${task.title}」即将完成（${Math.floor(percent)}%），再努力一下！`, 'almost_complete')
      }
    })

    growthTaskList.value.forEach(task => {
      const progress = growthProgressMap.value.get(task.id)
      if (!progress || progress.completed) return

      const percent = (progress.progress / task.target) * 100
      if (percent >= 80 && percent < 100) {
        addReminder(task.id, 'growth', `成长任务「${task.title}」即将完成（${Math.floor(percent)}%），冲刺吧！`, 'almost_complete')
      }
    })

    const nextTier = getNextTier(rewardPoolProgress.value.points)
    if (nextTier) {
      const remaining = nextTier.threshold - rewardPoolProgress.value.points
      if (remaining <= 30) {
        addReminder('pool', 'pool', `奖励池距离下一档仅差 ${remaining} 点，完成更多任务即可解锁！`, 'almost_complete')
      }
    }
  }

  function getWeeklyResetCountdown(): { days: number; hours: number; minutes: number } {
    const now = Date.now()
    const oneWeek = 7 * 24 * 60 * 60 * 1000
    const elapsed = now - rewardPoolProgress.value.lastWeeklyReset
    const remaining = Math.max(0, oneWeek - elapsed)
    return {
      days: Math.floor(remaining / (24 * 60 * 60 * 1000)),
      hours: Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)),
      minutes: Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000)),
    }
  }

  function getWeeklyTaskSummary() {
    const completed = completedWeeklyCount.value
    const total = totalWeeklyTasks.value
    const poolPoints = rewardPoolProgress.value.points
    return { completed, total, poolPoints }
  }

  function getGrowthTaskSummary() {
    const completed = completedGrowthCount.value
    const total = totalGrowthTasks.value
    const categories = activeGrowthCategories.value.length
    return { completed, total, categories }
  }

  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const data: TaskSaveData = JSON.parse(raw)

      if (data.weeklyTaskProgresses) {
        weeklyProgressMap.value = new Map()
        data.weeklyTaskProgresses.forEach(p => weeklyProgressMap.value.set(p.taskId, p))
      }
      if (data.growthTaskProgresses) {
        growthProgressMap.value = new Map()
        data.growthTaskProgresses.forEach(p => growthProgressMap.value.set(p.taskId, p))
      }
      if (data.rewardPoolProgress) {
        rewardPoolProgress.value = data.rewardPoolProgress
      }
      if (data.mergedProgressRecords) {
        mergedRecords.value = data.mergedProgressRecords
      }
      if (data.reminders) {
        reminders.value = data.reminders
      }
    } catch (e) {
      console.error('Failed to load task data:', e)
    }
  }

  function saveToStorage() {
    try {
      const data: TaskSaveData = {
        version: STORAGE_VERSION,
        timestamp: Date.now(),
        weeklyTaskProgresses: Array.from(weeklyProgressMap.value.values()),
        growthTaskProgresses: Array.from(growthProgressMap.value.values()),
        rewardPoolProgress: rewardPoolProgress.value,
        mergedProgressRecords: mergedRecords.value,
        reminders: reminders.value,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (e) {
      console.error('Failed to save task data:', e)
    }
  }

  return {
    weeklyTaskList,
    growthTaskList,
    weeklyProgressMap,
    growthProgressMap,
    rewardPoolProgress,
    mergedRecords,
    reminders,
    completedWeeklyCount,
    completedGrowthCount,
    totalWeeklyTasks,
    totalGrowthTasks,
    unclaimedWeeklyCount,
    unclaimedGrowthCount,
    unclaimedPoolTierCount,
    totalUnclaimedCount,
    currentPoolTier,
    nextPoolTier,
    poolProgressPercent,
    activeGrowthCategories,
    unreadReminderCount,
    initTaskCenter,
    updateWeeklyProgress,
    updateGrowthProgress,
    mergeProgressFromSeason,
    mergeProgressFromMutual,
    mergeWeeklyToGrowth,
    claimWeeklyTask,
    claimGrowthTask,
    claimRewardPoolTier,
    onGameEvent,
    addRewardPoolPoints,
    getWeeklyTaskProgress,
    getGrowthTaskProgress,
    addReminder,
    markReminderRead,
    markAllRemindersRead,
    clearReadReminders,
    generateReminders,
    getWeeklyResetCountdown,
    getWeeklyTaskSummary,
    getGrowthTaskSummary,
    saveToStorage,
  }
})
