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
  LeaderboardType,
  LeaderboardCache,
  LeaderboardRefreshState,
  LeaderboardShareData,
  Region,
} from '@/types/season'
import { getCurrentSeason } from '@/game/data/seasons'
import { getTasksBySeasonId, getTasksByType } from '@/game/data/seasonTasks'
import {
  getRewardsBySeasonId,
  getRewardById,
  mockLeaderboard,
  rankRewardTiers,
  regions,
  getFriendLeaderboard,
  getRegionLeaderboard,
  calculateTiedRanks,
  getRandomRegion,
  getRegionById,
} from '@/game/data/seasonRewards'
import { useActivityStore } from '@/stores/activityStore'
import { useTaskStore } from '@/stores/taskStore'
import { useFriendStore } from '@/stores/friendStore'

const SEASON_ACTIVITY_ID = 'act_001'

const STORAGE_KEY = 'season_center_data'

const LEADERBOARD_CACHE_TTL = 60 * 1000
const LEADERBOARD_REFRESH_COOLDOWN = 5 * 1000
const LEADERBOARD_AUTO_REFRESH_INTERVAL = 30 * 1000

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
  const regionLeaderboard = ref<LeaderboardEntry[]>([])
  const friendLeaderboard = ref<LeaderboardEntry[]>([])
  const expRecords = ref<ExpRecord[]>([])
  const settlements = ref<SeasonSettlement[]>([])
  const frozenLeaderboard = ref<LeaderboardEntry[] | null>(null)
  const frozenRegionLeaderboard = ref<LeaderboardEntry[] | null>(null)
  const frozenFriendLeaderboard = ref<LeaderboardEntry[] | null>(null)
  const playerRegionId = ref<string | null>(null)
  const activeLeaderboardType = ref<LeaderboardType>('global')
  const leaderboardCache = ref<LeaderboardCache>({
    global: null,
    region: null,
    friend: null,
  })
  const leaderboardRefreshState = ref<Record<LeaderboardType, LeaderboardRefreshState>>({
    global: { status: 'idle', lastRefreshTime: 0, cooldownRemaining: 0 },
    region: { status: 'idle', lastRefreshTime: 0, cooldownRemaining: 0 },
    friend: { status: 'idle', lastRefreshTime: 0, cooldownRemaining: 0 },
  })
  let autoCheckTimer: number | null = null
  let autoCheckRunning = false
  let leaderboardAutoRefreshTimer: number | null = null
  let refreshCooldownTimer: number | null = null

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

  const displayRegionLeaderboard = computed(() => {
    if (frozenRegionLeaderboard.value) {
      return frozenRegionLeaderboard.value
    }
    return regionLeaderboard.value
  })

  const displayFriendLeaderboard = computed(() => {
    if (frozenFriendLeaderboard.value) {
      return frozenFriendLeaderboard.value
    }
    return friendLeaderboard.value
  })

  const currentLeaderboard = computed(() => {
    switch (activeLeaderboardType.value) {
      case 'region':
        return displayRegionLeaderboard.value
      case 'friend':
        return displayFriendLeaderboard.value
      case 'global':
      default:
        return displayLeaderboard.value
    }
  })

  const playerRegion = computed<Region | null>(() => {
    if (!playerRegionId.value) return null
    return getRegionById(playerRegionId.value) || null
  })

  const allRegions = computed(() => regions)

  const canRefreshLeaderboard = computed(() => {
    const state = leaderboardRefreshState.value[activeLeaderboardType.value]
    return state.cooldownRemaining <= 0 && state.status !== 'loading'
  })

  const currentRefreshState = computed(() => {
    return leaderboardRefreshState.value[activeLeaderboardType.value]
  })

  const playerRegionRank = computed(() => {
    if (!playerSeason.value) return -1
    const entry = displayRegionLeaderboard.value.find(
      (e) => e.playerId === playerSeason.value!.playerId
    )
    return entry ? entry.displayRank : -1
  })

  const playerFriendRank = computed(() => {
    if (!playerSeason.value) return -1
    const entry = displayFriendLeaderboard.value.find(
      (e) => e.playerId === playerSeason.value!.playerId
    )
    return entry ? entry.displayRank : -1
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

  const currentLevel = computed(() => {
    return playerSeason.value?.level || 0
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
    return entry ? entry.displayRank : -1
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

  function checkAndSettleIfEnded(): boolean {
    if (!currentSeason.value || !playerSeason.value) return false

    if (currentSeason.value.status === 'settled') {
      stopAutoCheck()
      return false
    }

    const now = Date.now()
    const isEnded = currentSeason.value.endTime < now || currentSeason.value.status === 'ended'

    if (isEnded && !currentSettlement.value) {
      if (autoCheckRunning) return false
      autoCheckRunning = true

      try {
        const success = settleSeason()
        if (success) {
          stopAutoCheck()
        }
        return success
      } finally {
        autoCheckRunning = false
      }
    }

    return false
  }

  function startAutoCheck(intervalMs: number = 1000) {
    stopAutoCheck()

    checkAndSettleIfEnded()
    startLeaderboardAutoRefresh()

    autoCheckTimer = window.setInterval(() => {
      checkAndSettleIfEnded()
    }, intervalMs)
  }

  function stopAutoCheck() {
    if (autoCheckTimer !== null) {
      clearInterval(autoCheckTimer)
      autoCheckTimer = null
    }
    stopLeaderboardAutoRefresh()
  }

  function initSeason(playerId: string = 'player_local') {
    loadCurrentSeason()
    loadPlayerSeason(playerId)
    ensurePlayerRegion()
    loadTasks()
    loadRewards()
    loadAllLeaderboards()
    checkAndResetTasks()
    checkAndSettleIfEnded()
  }

  function loadCurrentSeason() {
    const season = getCurrentSeason()
    if (!season) return

    const savedData = loadFromStorage()
    if (savedData && savedData.currentSeasonState && savedData.currentSeasonState.id === season.id) {
      currentSeason.value = {
        ...season,
        status: savedData.currentSeasonState.status,
        endTime: savedData.currentSeasonState.endTime,
      }
    } else {
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
    if (savedData && savedData.leaderboardCache) {
      leaderboardCache.value = savedData.leaderboardCache
    }
    if (savedData && savedData.playerRegionId) {
      playerRegionId.value = savedData.playerRegionId
    }
  }

  function ensurePlayerRegion() {
    if (!playerRegionId.value) {
      const savedData = loadFromStorage()
      if (savedData && savedData.playerRegionId) {
        playerRegionId.value = savedData.playerRegionId
      } else {
        const region = getRandomRegion()
        playerRegionId.value = region.id
        saveToStorage()
      }
    }
  }

  function createPlayerEntry(regionId?: string, regionName?: string, isFriend: boolean = false): LeaderboardEntry {
    if (!playerSeason.value) {
      throw new Error('Player season not loaded')
    }
    return {
      id: generateId(),
      playerId: playerSeason.value.playerId,
      seasonId: currentSeason.value?.id || '',
      playerName: '你',
      playerAvatar: '🎭',
      rank: 0,
      displayRank: 0,
      isTied: false,
      score: calculateRankScore(),
      previousRank: 12,
      regionId,
      regionName,
      isFriend,
      updatedAt: Date.now(),
    }
  }

  function loadLeaderboard() {
    if (frozenLeaderboard.value) {
      leaderboard.value = frozenLeaderboard.value
      return
    }

    let entries = [...mockLeaderboard]

    if (playerSeason.value) {
      const region = getRegionById(playerRegionId.value || '')
      const playerEntry = createPlayerEntry(region?.id, region?.name, false)
      entries.push(playerEntry)
    }

    leaderboard.value = calculateTiedRanks(entries)
  }

  function loadRegionLeaderboard() {
    if (frozenRegionLeaderboard.value) {
      regionLeaderboard.value = frozenRegionLeaderboard.value
      return
    }

    if (!playerRegionId.value) {
      regionLeaderboard.value = []
      return
    }

    let entries = getRegionLeaderboard(playerRegionId.value)

    if (playerSeason.value) {
      const region = getRegionById(playerRegionId.value)
      const playerEntry = createPlayerEntry(region?.id, region?.name, false)
      entries = [...entries, playerEntry]
    }

    regionLeaderboard.value = calculateTiedRanks(entries)
  }

  function loadFriendLeaderboard() {
    if (frozenFriendLeaderboard.value) {
      friendLeaderboard.value = frozenFriendLeaderboard.value
      return
    }

    let entries = getFriendLeaderboard()

    if (playerSeason.value) {
      const region = getRegionById(playerRegionId.value || '')
      const playerEntry = createPlayerEntry(region?.id, region?.name, true)
      entries = [...entries, playerEntry]
    }

    friendLeaderboard.value = calculateTiedRanks(entries)
  }

  function loadAllLeaderboards() {
    ensurePlayerRegion()
    loadLeaderboard()
    loadRegionLeaderboard()
    loadFriendLeaderboard()
  }

  function isLeaderboardCacheValid(type: LeaderboardType): boolean {
    const cache = leaderboardCache.value[type]
    if (!cache) return false
    return Date.now() - cache.timestamp < LEADERBOARD_CACHE_TTL
  }

  async function refreshLeaderboard(type: LeaderboardType, force: boolean = false): Promise<boolean> {
    const state = leaderboardRefreshState.value[type]

    if (!force && state.status === 'loading') {
      return false
    }

    if (!force && state.cooldownRemaining > 0) {
      return false
    }

    if (!force && isLeaderboardCacheValid(type)) {
      const cache = leaderboardCache.value[type]!
      switch (type) {
        case 'global':
          leaderboard.value = [...cache.data]
          break
        case 'region':
          regionLeaderboard.value = [...cache.data]
          break
        case 'friend':
          friendLeaderboard.value = [...cache.data]
          break
      }
      state.status = 'success'
      state.lastRefreshTime = Date.now()
      return true
    }

    state.status = 'loading'

    try {
      await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500))

      switch (type) {
        case 'global':
          loadLeaderboard()
          leaderboardCache.value.global = {
            data: [...leaderboard.value],
            timestamp: Date.now(),
          }
          break
        case 'region':
          loadRegionLeaderboard()
          leaderboardCache.value.region = {
            data: [...regionLeaderboard.value],
            timestamp: Date.now(),
          }
          break
        case 'friend':
          loadFriendLeaderboard()
          leaderboardCache.value.friend = {
            data: [...friendLeaderboard.value],
            timestamp: Date.now(),
          }
          break
      }

      state.status = 'success'
      state.lastRefreshTime = Date.now()
      state.errorMessage = undefined

      startRefreshCooldown(type)

      saveToStorage()
      return true
    } catch (error) {
      state.status = 'error'
      state.errorMessage = error instanceof Error ? error.message : '刷新失败'
      return false
    }
  }

  function startRefreshCooldown(type: LeaderboardType) {
    const state = leaderboardRefreshState.value[type]
    state.cooldownRemaining = LEADERBOARD_REFRESH_COOLDOWN

    if (refreshCooldownTimer) {
      clearInterval(refreshCooldownTimer)
    }

    refreshCooldownTimer = window.setInterval(() => {
      let anyActive = false
      ;(['global', 'region', 'friend'] as LeaderboardType[]).forEach((t) => {
        const s = leaderboardRefreshState.value[t]
        if (s.cooldownRemaining > 0) {
          s.cooldownRemaining = Math.max(0, s.cooldownRemaining - 1000)
          if (s.cooldownRemaining > 0) anyActive = true
        }
      })
      if (!anyActive && refreshCooldownTimer) {
        clearInterval(refreshCooldownTimer)
        refreshCooldownTimer = null
      }
    }, 1000)
  }

  function startLeaderboardAutoRefresh() {
    stopLeaderboardAutoRefresh()

    leaderboardAutoRefreshTimer = window.setInterval(() => {
      if (isSeasonActive.value && !isLeaderboardFrozen.value) {
        ;(['global', 'region', 'friend'] as LeaderboardType[]).forEach((type) => {
          if (!isLeaderboardCacheValid(type)) {
            refreshLeaderboard(type, false)
          }
        })
      }
    }, LEADERBOARD_AUTO_REFRESH_INTERVAL)
  }

  function stopLeaderboardAutoRefresh() {
    if (leaderboardAutoRefreshTimer !== null) {
      clearInterval(leaderboardAutoRefreshTimer)
      leaderboardAutoRefreshTimer = null
    }
  }

  function setActiveLeaderboardType(type: LeaderboardType) {
    activeLeaderboardType.value = type
  }

  function freezeLeaderboard() {
    if (frozenLeaderboard.value) return false

    frozenLeaderboard.value = [...displayLeaderboard.value].map((entry) => ({
      ...entry,
      updatedAt: Date.now(),
    }))
    frozenRegionLeaderboard.value = [...displayRegionLeaderboard.value].map((entry) => ({
      ...entry,
      updatedAt: Date.now(),
    }))
    frozenFriendLeaderboard.value = [...displayFriendLeaderboard.value].map((entry) => ({
      ...entry,
      updatedAt: Date.now(),
    }))
    saveToStorage()
    return true
  }

  function generateShareData(type: LeaderboardType): LeaderboardShareData | null {
    if (!playerSeason.value || !currentSeason.value) return null

    const boards: Record<LeaderboardType, LeaderboardEntry[]> = {
      global: displayLeaderboard.value,
      region: displayRegionLeaderboard.value,
      friend: displayFriendLeaderboard.value,
    }

    const playerEntry = boards[type].find((e) => e.playerId === playerSeason.value!.playerId)
    if (!playerEntry) return null

    return {
      type,
      playerId: playerSeason.value.playerId,
      playerName: playerEntry.playerName,
      playerAvatar: playerEntry.playerAvatar,
      rank: playerEntry.displayRank,
      score: playerEntry.score,
      seasonId: currentSeason.value.id,
      seasonName: currentSeason.value.name,
      regionName: playerRegion.value?.name,
      timestamp: Date.now(),
    }
  }

  function getRankForSettlement(type: LeaderboardType): number {
    if (!playerSeason.value) return 999
    const boards: Record<LeaderboardType, LeaderboardEntry[]> = {
      global: displayLeaderboard.value,
      region: displayRegionLeaderboard.value,
      friend: displayFriendLeaderboard.value,
    }
    const entry = boards[type].find((e) => e.playerId === playerSeason.value!.playerId)
    return entry?.displayRank || 999
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
    const finalRank = playerEntry?.displayRank || 999
    const finalScore = playerEntry?.score || 0
    const finalLevel = playerSeason.value.level

    const rewardIds: string[] = []
    const rankRewardId = getRankRewardByRank(finalRank)
    if (rankRewardId) {
      rewardIds.push(rankRewardId)
    }

    const activityStore = useActivityStore()
    activityStore.trackClaim(SEASON_ACTIVITY_ID, playerSeason.value.playerId, 'season_settlement', {
      rewardType: 'settlement',
      finalRank,
      finalScore,
      finalLevel,
      regionRank: getRankForSettlement('region'),
      friendRank: getRankForSettlement('friend'),
    })

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

    stopAutoCheck()
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

    const activityStore = useActivityStore()
    activityStore.trackClaim(SEASON_ACTIVITY_ID, playerSeason.value?.playerId || 'unknown', rewardId, {
      rewardType: 'rank',
      rewardName: reward.name,
      rewardRarity: reward.rarity,
      finalRank: currentSettlement.value.finalRank,
    })

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
    frozenRegionLeaderboard.value = null
    frozenFriendLeaderboard.value = null
    settlements.value = []
    leaderboardCache.value = { global: null, region: null, friend: null }
    saveToStorage()
    loadAllLeaderboards()
    startAutoCheck()
  }

  function setSeasonEndsInSeconds(seconds: number) {
    if (!currentSeason.value) return false
    if (currentSeason.value.status === 'settled') return false
    currentSeason.value.endTime = Date.now() + seconds * 1000
    saveToStorage()
    return true
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
    const completedTasks: string[] = []

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
        completedTasks.push(task.id)
      }

      taskProgressMap.value.set(task.id, progress)
      hasChanges = true
    })

    if (completedTasks.length > 0) {
      const activityStore = useActivityStore()
      completedTasks.forEach((taskId) => {
        const task = tasks.value.find((t) => t.id === taskId)
        activityStore.trackComplete(SEASON_ACTIVITY_ID, playerSeason.value?.playerId || 'unknown', {
          taskId,
          taskTitle: task?.title,
          taskType: task?.type,
          expReward: task?.expReward,
        })
      })

      const taskStore = useTaskStore()
      completedTasks.forEach((taskId) => {
        const task = tasks.value.find((t) => t.id === taskId)
        if (task) {
          taskStore.mergeProgressFromSeason(conditionType, amount, taskId)
        }
      })
    }

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

    const activityStore = useActivityStore()
    activityStore.trackClaim(SEASON_ACTIVITY_ID, playerSeason.value?.playerId || 'unknown', task.rewardId, {
      rewardType: 'task',
      taskId,
      taskTitle: task.title,
      expReward: task.expReward,
    })

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

    const activityStore = useActivityStore()
    activityStore.trackClaim(SEASON_ACTIVITY_ID, playerSeason.value.playerId, reward.id, {
      rewardType: 'level',
      level,
      rewardName: reward.name,
      rewardRarity: reward.rarity,
    })

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
    if (currentSeason.value?.status === 'settled') return

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
        version: '1.1',
        timestamp: Date.now(),
        currentSeasonId: currentSeason.value?.id,
        currentSeasonState: currentSeason.value
          ? {
              id: currentSeason.value.id,
              status: currentSeason.value.status,
              endTime: currentSeason.value.endTime,
            }
          : null,
        playerSeasons: playerSeason.value ? [playerSeason.value] : [],
        taskProgresses: Array.from(taskProgressMap.value.values()),
        rewardRecords: rewardRecords.value,
        expRecords: expRecords.value,
        settlements: settlements.value,
        frozenLeaderboard: frozenLeaderboard.value,
        leaderboardCache: leaderboardCache.value,
        playerRegionId: playerRegionId.value,
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
    regionLeaderboard,
    friendLeaderboard,
    expRecords,
    settlements,
    frozenLeaderboard,
    frozenRegionLeaderboard,
    frozenFriendLeaderboard,
    playerRegionId,
    activeLeaderboardType,
    leaderboardCache,
    leaderboardRefreshState,
    isSeasonActive,
    isSeasonEnded,
    isSeasonSettled,
    isLeaderboardFrozen,
    displayLeaderboard,
    displayRegionLeaderboard,
    displayFriendLeaderboard,
    currentLeaderboard,
    playerRegion,
    allRegions,
    canRefreshLeaderboard,
    currentRefreshState,
    playerRegionRank,
    playerFriendRank,
    currentSettlement,
    unclaimedRankRewards,
    unclaimedRankCount,
    timeRemaining,
    currentLevel,
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
    loadRegionLeaderboard,
    loadFriendLeaderboard,
    loadAllLeaderboards,
    refreshLeaderboard,
    setActiveLeaderboardType,
    freezeLeaderboard,
    generateShareData,
    getRankForSettlement,
    settleSeason,
    claimRankReward,
    claimAllRankRewards,
    testSettleSeason,
    resetSeasonForTesting,
    setSeasonEndsInSeconds,
    checkAndSettleIfEnded,
    startAutoCheck,
    stopAutoCheck,
    startLeaderboardAutoRefresh,
    stopLeaderboardAutoRefresh,
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
