import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Season,
  SeasonTask,
  SeasonReward,
  PlayerSeason,
  TaskProgress,
  RewardRecord,
  LeaderboardEntry,
  ExpRecord,
  Countdown,
  TaskConditionType,
  SeasonSettlement,
} from '@/types/season'
import { getCurrentSeason } from '@/game/data/seasons'
import { getTasksBySeasonId, getTasksByType } from '@/game/data/seasonTasks'
import {
  getRewardsBySeasonId,
  getRewardById,
  mockLeaderboard,
  rankRewardTiers,
} from '@/game/data/seasonRewards'

const STORAGE_KEY = 'season_center_data'

function generateId(): string {
  return 'id_' + Math.random().toString(36).substr(2, 9)
}

function getExpForLevel(
  level: number,
  baseExp: number,
  multiplier: number
): number {
  return Math.floor(baseExp * Math.pow(level, multiplier))
}

function getLevelFromExp(
  totalExp: number,
  baseExp: number,
  multiplier: number
): number {
  let level = 1
  while (getExpForLevel(level + 1, baseExp, multiplier) <= totalExp) {
    level++
  }
  return level
}

export const useSeasonStore = defineStore('season', () => {
  const currentSeason = ref<Season | null>(null)
  const playerSeason = ref<PlayerSeason | null>(null)
  const tasks = ref<SeasonTask[]>([])
  const taskProgressMap = ref<Map<string, TaskProgress>>(new Map())
  const rewards = ref<SeasonReward[]>([])
  const rewardRecords = ref<RewardRecord[]>([])
  const leaderboard = ref<LeaderboardEntry[]>([])
  const expRecords = ref<ExpRecord[]>([])
  const settlements = ref<SeasonSettlement[]>([])
  const frozenLeaderboard = ref<LeaderboardEntry[] | null>(null)

  const isSeasonActive = computed(() => {
    if (!currentSeason.value) return false
    if (currentSeason.value.status === 'settled') return false
    const now = Date.now()
    return (
      currentSeason.value.status === 'active' &&
      currentSeason.value.startTime <= now &&
      currentSeason.value.endTime >= now
    )
  })

  const isSeasonEnded = computed(() => {
    if (!currentSeason.value) return false
    const now = Date.now()
    return currentSeason.value.endTime < now || currentSeason.value.status === 'ended'
  })

  const isSeasonSettled = computed(() => {
    if (!currentSeason.value) return false
    return currentSeason.value.status === 'settled'
  })

  const isLeaderboardFrozen = computed(() => {
    return frozenLeaderboard.value !== null
  })

  const displayLeaderboard = computed(() => {
    if (frozenLeaderboard.value) {
      return frozenLeaderboard.value
    }
    return leaderboard.value
  })

  const currentSettlement = computed(() => {
    if (!currentSeason.value || !playerSeason.value) return null
    return settlements.value.find(
      (s) => s.seasonId === currentSeason.value!.id && s.playerId === playerSeason.value!.playerId
    )
  })

  const unclaimedRankRewards = computed(() => {
    if (!currentSettlement.value || currentSettlement.value.claimed) return []
    return currentSettlement.value.rewardIds
      .map((rewardId) => getRewardById(rewardId))
      .filter((r): r is SeasonReward => r !== undefined)
  })

  const unclaimedRankCount = computed(() => {
    return unclaimedRankRewards.value.length
  })

  const timeRemaining = computed<Countdown>(() => {
    if (!currentSeason.value) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 }
    }
    const diff = Math.max(0, currentSeason.value.endTime - Date.now())
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
    }
  })

  const currentLevelExp = computed(() => {
    if (!currentSeason.value || !playerSeason.value) return 0
    return getExpForLevel(
      playerSeason.value.level,
      currentSeason.value.baseExpPerLevel,
      currentSeason.value.expMultiplier
    )
  })

  const nextLevelExp = computed(() => {
    if (!currentSeason.value || !playerSeason.value) return 0
    if (playerSeason.value.level >= currentSeason.value.maxLevel) {
      return currentLevelExp.value
    }
    return getExpForLevel(
      playerSeason.value.level + 1,
      currentSeason.value.baseExpPerLevel,
      currentSeason.value.expMultiplier
    )
  })

  const expProgress = computed(() => {
    if (!playerSeason.value) return 0
    if (!currentSeason.value || playerSeason.value.level >= currentSeason.value.maxLevel) {
      return 100
    }
    const current = playerSeason.value.exp - currentLevelExp.value
    const needed = nextLevelExp.value - currentLevelExp.value
    return Math.min(100, Math.max(0, (current / needed) * 100))
  })

  const dailyTasks = computed(() => getTasksByType(currentSeason.value?.id || '', 'daily'))
  const weeklyTasks = computed(() => getTasksByType(currentSeason.value?.id || '', 'weekly'))
  const challengeTasks = computed(() => getTasksByType(currentSeason.value?.id || '', 'challenge'))

  const completedTasksCount = computed(() => {
    let count = 0
    taskProgressMap.value.forEach((progress) => {
      if (progress.completed) count++
    })
    return count
  })

  const playerRank = computed(() => {
    if (!playerSeason.value) return -1
    const entry = displayLeaderboard.value.find(
      (e) => e.playerId === playerSeason.value!.playerId
    )
    return entry ? entry.rank : -1
  })

  const unclaimedCount = computed(() => {
    let count = 0
    taskProgressMap.value.forEach((progress) => {
      if (progress.completed && !progress.claimed) count++
    })
    if (rewards.value.length > 0 && playerSeason.value) {
      rewards.value.forEach((reward) => {
        if (
          reward.level > 0 &&
          reward.level <= playerSeason.value!.level &&
          !isRewardClaimed(reward.id)
        ) {
          count++
        }
      })
    }
    count += unclaimedRankCount.value
    return count
  })

  function isRewardClaimed(rewardId: string): boolean {
    return rewardRecords.value.some((r) => r.rewardId === rewardId)
  }

  function getTaskProgress(taskId: string): TaskProgress | undefined {
    return taskProgressMap.value.get(taskId)
  }

  function initSeason(playerId: string = 'player_local') {
    loadCurrentSeason()
    loadPlayerSeason(playerId)
    loadTasks()
    loadRewards()
    loadLeaderboard()
    checkAndResetTasks()
  }

  function loadCurrentSeason() {
    const season = getCurrentSeason()
    if (season) {
      currentSeason.value = season
    }
  }

  function loadPlayerSeason(playerId: string) {
    if (!currentSeason.value) return

    const savedData = loadFromStorage()
    if (savedData && savedData.playerSeasons) {
      const existing = savedData.playerSeasons.find(
        (ps) => ps.seasonId === currentSeason.value!.id && ps.playerId === playerId
      )
      if (existing) {
        playerSeason.value = existing
        return
      }
    }

    playerSeason.value = {
      id: generateId(),
      playerId,
      seasonId: currentSeason.value.id,
      level: 1,
      exp: getExpForLevel(1, currentSeason.value.baseExpPerLevel, currentSeason.value.expMultiplier),
      totalExp: 0,
      rankScore: 0,
      joinedAt: Date.now(),
      lastResetDaily: Date.now(),
      lastResetWeekly: Date.now(),
    }

    saveToStorage()
  }

  function loadTasks() {
    if (!currentSeason.value) return
    tasks.value = getTasksBySeasonId(currentSeason.value.id)

    const savedData = loadFromStorage()
    if (savedData && savedData.taskProgresses) {
      taskProgressMap.value = new Map()
      savedData.taskProgresses.forEach((tp) => {
        taskProgressMap.value.set(tp.taskId, tp)
      })
    }

    tasks.value.forEach((task) => {
      if (!taskProgressMap.value.has(task.id)) {
        const newProgress: TaskProgress = {
          id: generateId(),
          playerSeasonId: playerSeason.value?.id || '',
          taskId: task.id,
          progress: 0,
          completed: false,
          claimed: false,
        }
        taskProgressMap.value.set(task.id, newProgress)
      }
    })

    saveToStorage()
  }

  function loadRewards() {
    if (!currentSeason.value) return
    rewards.value = getRewardsBySeasonId(currentSeason.value.id)

    const savedData = loadFromStorage()
    if (savedData && savedData.rewardRecords) {
      rewardRecords.value = savedData.rewardRecords
    }
    if (savedData && savedData.expRecords) {
      expRecords.value = savedData.expRecords
    }
    if (savedData && savedData.settlements) {
      settlements.value = savedData.settlements
    }
    if (savedData && savedData.frozenLeaderboard) {
      frozenLeaderboard.value = savedData.frozenLeaderboard
    }
  }

  function loadLeaderboard() {
    leaderboard.value = [...mockLeaderboard]

    if (playerSeason.value) {
      const playerEntry: LeaderboardEntry = {
        id: generateId(),
        playerId: playerSeason.value.playerId,
        seasonId: currentSeason.value?.id || '',
        playerName: '你',
        playerAvatar: '🎭',
        rank: 8,
        score: calculateRankScore(),
        previousRank: 12,
        updatedAt: Date.now(),
      }
      leaderboard.value.push(playerEntry)
      leaderboard.value.sort((a, b) => b.score - a.score)
      leaderboard.value.forEach((entry, index) => {
        entry.previousRank = entry.rank
        entry.rank = index + 1
      })
    }
  }

  function freezeLeaderboard() {
    if (frozenLeaderboard.value) return false

    frozenLeaderboard.value = [...displayLeaderboard.value].map((entry) => ({
      ...entry,
      updatedAt: Date.now(),
    }))
    saveToStorage()
    return true
  }

  function getRankRewardByRank(rank: number): string | null {
    const tier = rankRewardTiers.find((t) => {
      if (t.maxRank !== undefined) {
        return rank >= t.minRank && rank <= t.maxRank
      }
      return rank >= t.minRank
    })
    return tier ? tier.rewardId : null
  }

  function settleSeason(): boolean {
    if (!currentSeason.value || !playerSeason.value) return false
    if (currentSettlement.value) return false

    freezeLeaderboard()

    const playerEntry = displayLeaderboard.value.find(
      (e) => e.playerId === playerSeason.value!.playerId
    )
    const finalRank = playerEntry?.rank || 999
    const finalScore = playerEntry?.score || 0
    const finalLevel = playerSeason.value.level

    const rewardIds: string[] = []
    const rankRewardId = getRankRewardByRank(finalRank)
    if (rankRewardId) {
      rewardIds.push(rankRewardId)
    }

    const settlement: SeasonSettlement = {
      id: generateId(),
      seasonId: currentSeason.value.id,
      playerId: playerSeason.value.playerId,
      finalRank,
      finalScore,
      finalLevel,
      rewardIds,
      settledAt: Date.now(),
      claimed: false,
    }

    settlements.value.push(settlement)

    if (currentSeason.value) {
      currentSeason.value.status = 'settled'
    }

    saveToStorage()
    return true
  }

  function claimRankReward(rewardId: string): boolean {
    if (!currentSettlement.value || currentSettlement.value.claimed) return false
    if (!currentSettlement.value.rewardIds.includes(rewardId)) return false
    if (isRewardClaimed(rewardId)) return false

    const reward = getRewardById(rewardId)
    if (!reward) return false

    const record: RewardRecord = {
      id: generateId(),
      playerSeasonId: playerSeason.value?.id || '',
      rewardId,
      source: 'rank',
      claimedAt: Date.now(),
    }
    rewardRecords.value.push(record)

    const allClaimed = currentSettlement.value.rewardIds.every((id) => isRewardClaimed(id))
    if (allClaimed) {
      currentSettlement.value.claimed = true
      currentSettlement.value.claimedAt = Date.now()
    }

    saveToStorage()
    return true
  }

  function claimAllRankRewards(): boolean {
    if (!currentSettlement.value || currentSettlement.value.claimed) return false

    let success = false
    currentSettlement.value.rewardIds.forEach((rewardId) => {
      if (!isRewardClaimed(rewardId)) {
        const result = claimRankReward(rewardId)
        if (result) success = true
      }
    })
    return success
  }

  function testSettleSeason() {
    if (!currentSeason.value) return false
    currentSeason.value.status = 'ended'
    return settleSeason()
  }

  function resetSeasonForTesting() {
    if (!currentSeason.value) return
    currentSeason.value.status = 'active'
    currentSeason.value.endTime = Date.now() + 30 * 24 * 60 * 60 * 1000
    frozenLeaderboard.value = null
    settlements.value = []
    saveToStorage()
  }

  function calculateRankScore(): number {
    if (!playerSeason.value) return 0
    const levelScore = playerSeason.value.level * 100
    const expScore = playerSeason.value.totalExp * 0.1

    let completedTasks = 0
    taskProgressMap.value.forEach((progress) => {
      if (progress.completed) completedTasks++
    })
    const taskScore = completedTasks * 50

    return levelScore + expScore + taskScore
  }

  function updateTaskProgress(
    conditionType: TaskConditionType,
    amount: number = 1,
    params?: Record<string, any>
  ) {
    if (!isSeasonActive.value) return

    let hasChanges = false

    tasks.value.forEach((task) => {
      if (task.condition.type !== conditionType) return

      const progress = taskProgressMap.value.get(task.id)
      if (!progress || progress.completed) return

      if (params && task.condition.params) {
        const matches = Object.entries(task.condition.params).every(
          ([key, value]) => params[key] === value
        )
        if (!matches) return
      }

      const newProgress = Math.min(progress.progress + amount, task.target)
      progress.progress = newProgress

      if (newProgress >= task.target && !progress.completed) {
        progress.completed = true
        progress.completedAt = Date.now()
      }

      taskProgressMap.value.set(task.id, progress)
      hasChanges = true
    })

    if (hasChanges) {
      saveToStorage()
    }
  }

  function claimTaskReward(taskId: string): boolean {
    const progress = taskProgressMap.value.get(taskId)
    if (!progress || !progress.completed || progress.claimed) return false

    const task = tasks.value.find((t) => t.id === taskId)
    if (!task) return false

    addExp(task.expReward, 'task', taskId)

    progress.claimed = true
    progress.claimedAt = Date.now()
    taskProgressMap.value.set(taskId, progress)

    if (task.rewardId) {
      const record: RewardRecord = {
        id: generateId(),
        playerSeasonId: playerSeason.value?.id || '',
        rewardId: task.rewardId,
        source: 'task',
        claimedAt: Date.now(),
      }
      rewardRecords.value.push(record)
    }

    saveToStorage()
    return true
  }

  function claimLevelReward(level: number): boolean {
    if (!playerSeason.value || !currentSeason.value) return false
    if (playerSeason.value.level < level) return false

    const reward = rewards.value.find((r) => r.level === level)
    if (!reward) return false
    if (isRewardClaimed(reward.id)) return false

    const record: RewardRecord = {
      id: generateId(),
      playerSeasonId: playerSeason.value.id,
      rewardId: reward.id,
      source: 'level',
      claimedAt: Date.now(),
    }
    rewardRecords.value.push(record)

    saveToStorage()
    return true
  }

  function addExp(amount: number, source: string, sourceId: string) {
    if (!playerSeason.value || !currentSeason.value) return

    playerSeason.value.exp += amount
    playerSeason.value.totalExp += amount

    const record: ExpRecord = {
      id: generateId(),
      playerSeasonId: playerSeason.value.id,
      amount,
      source,
      sourceId,
      createdAt: Date.now(),
    }
    expRecords.value.unshift(record)
    if (expRecords.value.length > 50) {
      expRecords.value = expRecords.value.slice(0, 50)
    }

    checkLevelUp()
    saveToStorage()
  }

  function checkLevelUp() {
    if (!playerSeason.value || !currentSeason.value) return

    const newLevel = getLevelFromExp(
      playerSeason.value.totalExp,
      currentSeason.value.baseExpPerLevel,
      currentSeason.value.expMultiplier
    )

    if (newLevel > playerSeason.value.level) {
      playerSeason.value.level = Math.min(newLevel, currentSeason.value.maxLevel)
      playerSeason.value.rankScore = calculateRankScore()
    }
  }

  function checkAndResetTasks() {
    if (!playerSeason.value) return

    const now = Date.now()
    const oneDay = 24 * 60 * 60 * 1000
    const oneWeek = 7 * oneDay

    const lastResetDate = new Date(playerSeason.value.lastResetDaily).toDateString()
    const today = new Date().toDateString()

    if (lastResetDate !== today) {
      resetDailyTasks()
      playerSeason.value.lastResetDaily = now
    }

    const lastWeek = playerSeason.value.lastResetWeekly
    if (now - lastWeek >= oneWeek) {
      resetWeeklyTasks()
      playerSeason.value.lastResetWeekly = now
    }

    saveToStorage()
  }

  function resetDailyTasks() {
    tasks.value.forEach((task) => {
      if (task.type === 'daily') {
        const progress = taskProgressMap.value.get(task.id)
        if (progress) {
          progress.progress = 0
          progress.completed = false
          progress.claimed = false
          progress.completedAt = undefined
          progress.claimedAt = undefined
          taskProgressMap.value.set(task.id, progress)
        }
      }
    })
  }

  function resetWeeklyTasks() {
    tasks.value.forEach((task) => {
      if (task.type === 'weekly') {
        const progress = taskProgressMap.value.get(task.id)
        if (progress) {
          progress.progress = 0
          progress.completed = false
          progress.claimed = false
          progress.completedAt = undefined
          progress.claimedAt = undefined
          taskProgressMap.value.set(task.id, progress)
        }
      }
    })
  }

  function loadFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (data) {
        return JSON.parse(data)
      }
    } catch (e) {
      console.error('Failed to load season data from storage:', e)
    }
    return null
  }

  function saveToStorage() {
    try {
      const data = {
        version: '1.0',
        timestamp: Date.now(),
        currentSeasonId: currentSeason.value?.id,
        playerSeasons: playerSeason.value ? [playerSeason.value] : [],
        taskProgresses: Array.from(taskProgressMap.value.values()),
        rewardRecords: rewardRecords.value,
        expRecords: expRecords.value,
        settlements: settlements.value,
        frozenLeaderboard: frozenLeaderboard.value,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (e) {
      console.error('Failed to save season data to storage:', e)
    }
  }

  function hasUnclaimedRewards(): boolean {
    return unclaimedCount.value > 0
  }

  function getRecentExpRecords(limit: number = 10): ExpRecord[] {
    return expRecords.value.slice(0, limit)
  }

  function getClaimableLevelRewards(): SeasonReward[] {
    if (!playerSeason.value) return []
    return rewards.value.filter(
      (r) =>
        r.level > 0 &&
        r.level <= playerSeason.value!.level &&
        !isRewardClaimed(r.id)
    )
  }

  return {
    currentSeason,
    playerSeason,
    tasks,
    taskProgressMap,
    rewards,
    rewardRecords,
    leaderboard,
    expRecords,
    settlements,
    frozenLeaderboard,
    isSeasonActive,
    isSeasonEnded,
    isSeasonSettled,
    isLeaderboardFrozen,
    displayLeaderboard,
    currentSettlement,
    unclaimedRankRewards,
    unclaimedRankCount,
    timeRemaining,
    currentLevelExp,
    nextLevelExp,
    expProgress,
    dailyTasks,
    weeklyTasks,
    challengeTasks,
    completedTasksCount,
    playerRank,
    unclaimedCount,
    initSeason,
    loadCurrentSeason,
    loadPlayerSeason,
    loadTasks,
    loadRewards,
    loadLeaderboard,
    freezeLeaderboard,
    settleSeason,
    claimRankReward,
    claimAllRankRewards,
    testSettleSeason,
    resetSeasonForTesting,
    updateTaskProgress,
    claimTaskReward,
    claimLevelReward,
    addExp,
    checkLevelUp,
    resetDailyTasks,
    resetWeeklyTasks,
    isRewardClaimed,
    getTaskProgress,
    hasUnclaimedRewards,
    getRecentExpRecords,
    getClaimableLevelRewards,
    saveToStorage,
  }
})
