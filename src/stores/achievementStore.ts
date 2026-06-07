import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type {
  Achievement,
  PlayerAchievement,
  BehaviorEventType,
  BehaviorEvent,
  Notification,
  AchievementStatistics,
  AchievementCategory,
  AchievementRarity,
  AchievementSaveData,
  AchievementConditionType
} from '@/types/achievement'
import { ACHIEVEMENT_STORAGE_KEY } from '@/types/achievement'
import { achievements, getAchievementById } from '@/game/data/achievements'
import { useGameStore } from './gameStore'
import { useSeasonStore } from './seasonStore'
import { useCharacterStore } from './characterStore'
import { useActivityStore } from './activityStore'

const STORAGE_VERSION = '1.0'

function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function loadFromStorage(): AchievementSaveData | null {
  try {
    const raw = localStorage.getItem(ACHIEVEMENT_STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw) as AchievementSaveData
    }
  } catch (e) {
    console.error('Failed to load achievement data from storage:', e)
  }
  return null
}

function saveToStorage(data: AchievementSaveData) {
  try {
    localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save achievement data to storage:', e)
  }
}

const conditionTypeMap: Record<BehaviorEventType, AchievementConditionType[]> = {
  order_completed: ['order_complete'],
  order_accepted: ['order_accept'],
  day_passed: ['day_pass'],
  night_fell: ['night_fall'],
  relic_purified: ['relic_purify'],
  money_earned: ['money_earn', 'money_total'],
  reputation_gained: ['reputation_gain', 'reputation_total'],
  sanity_changed: ['sanity_maintain'],
  sanity_recovered: ['sanity_recover'],
  character_unlocked: ['character_unlock'],
  skill_upgraded: ['skill_upgrade'],
  exp_gained: ['exp_gain'],
  level_up: ['level_up'],
  season_level_up: ['season_level'],
  task_completed: ['task_complete'],
  anomaly_resisted: ['anomaly_resist'],
  perfect_completed: ['perfect_complete'],
  login: ['consecutive_login', 'total_login'],
  page_view: [],
  button_click: [],
  reward_claimed: [],
  shop_purchase: [],
  item_used: [],
  custom: ['custom_event', 'relic_type_collect']
}

export const useAchievementStore = defineStore('achievement', () => {
  const playerId = ref('player_local')
  const playerAchievements = ref<Map<string, PlayerAchievement>>(new Map())
  const notifications = ref<Notification[]>([])
  const behaviorEvents = ref<BehaviorEvent[]>([])
  const recentlyUnlocked = ref<string[]>([])
  const showUnlockAnimation = ref(false)
  const currentUnlockAchievement = ref<Achievement | null>(null)
  const consecutiveLoginDays = ref(0)
  const totalLoginDays = ref(0)
  const lastLoginDate = ref<string>('')
  const perfectCompleteCount = ref(0)
  const anomalyResistCount = ref(0)
  const collectedRelicTypes = ref<Set<string>>(new Set())
  const sanityMaintainDays = ref(0)
  const totalMoneyEarned = ref(0)
  const totalReputationGained = ref(0)
  const customEventCounts = ref<Map<string, number>>(new Map())
  const nightFellCount = ref(0)
  const totalSanityRecovered = ref(0)
  const totalLevelUps = ref(0)
  const totalExpGained = ref(0)

  const allAchievements = ref<Achievement[]>([...achievements])

  watch(
    [playerAchievements, notifications, behaviorEvents],
    () => {
      saveAllData()
    },
    { deep: true }
  )

  const unlockedAchievements = computed(() => {
    return Array.from(playerAchievements.value.values()).filter(pa => pa.unlocked)
  })

  const unclaimedAchievements = computed(() => {
    return Array.from(playerAchievements.value.values()).filter(pa => pa.unlocked && !pa.claimed)
  })

  const unreadNotifications = computed(() => {
    return notifications.value.filter(n => !n.read)
  })

  const unclaimedCount = computed(() => unclaimedAchievements.value.length)
  const unreadNotificationCount = computed(() => unreadNotifications.value.length)

  const statistics = computed<AchievementStatistics>(() => {
    const total = allAchievements.value.filter(a => !a.isHidden).length
    const unlocked = unlockedAchievements.value.filter(pa => {
      const ach = getAchievementById(pa.achievementId)
      return ach && !ach.isHidden
    }).length

    const byCategory: Record<AchievementCategory, { unlocked: number; total: number }> = {
      gameplay: { unlocked: 0, total: 0 },
      collection: { unlocked: 0, total: 0 },
      social: { unlocked: 0, total: 0 },
      seasonal: { unlocked: 0, total: 0 },
      hidden: { unlocked: 0, total: 0 }
    }

    const byRarity: Record<AchievementRarity, { unlocked: number; total: number }> = {
      common: { unlocked: 0, total: 0 },
      uncommon: { unlocked: 0, total: 0 },
      rare: { unlocked: 0, total: 0 },
      epic: { unlocked: 0, total: 0 },
      legendary: { unlocked: 0, total: 0 }
    }

    allAchievements.value.forEach(ach => {
      byCategory[ach.category].total++
      byRarity[ach.rarity].total++

      const pa = playerAchievements.value.get(ach.id)
      if (pa?.unlocked) {
        byCategory[ach.category].unlocked++
        byRarity[ach.rarity].unlocked++
      }
    })

    const sortedUnlocked = [...unlockedAchievements.value].sort(
      (a, b) => (b.unlockedAt || 0) - (a.unlockedAt || 0)
    )

    return {
      totalUnlocked: unlocked,
      totalCount: total,
      byCategory,
      byRarity,
      latestUnlocked: sortedUnlocked[0] || null,
      completionRate: total > 0 ? Math.round((unlocked / total) * 100) : 0
    }
  })

  function initAchievements(pId: string = 'player_local') {
    playerId.value = pId

    const saved = loadFromStorage()
    if (saved) {
      saved.playerAchievements.forEach(pa => {
        playerAchievements.value.set(pa.achievementId, pa)
      })
      notifications.value = saved.notifications || []
      behaviorEvents.value = saved.behaviorEvents || []
      consecutiveLoginDays.value = saved.consecutiveLoginDays || 0
      totalLoginDays.value = saved.totalLoginDays || 0
      lastLoginDate.value = saved.lastLoginDate || ''
      perfectCompleteCount.value = saved.perfectCompleteCount || 0
      anomalyResistCount.value = saved.anomalyResistCount || 0
      collectedRelicTypes.value = new Set(saved.collectedRelicTypes || [])
      sanityMaintainDays.value = saved.sanityMaintainDays || 0
      totalMoneyEarned.value = saved.totalMoneyEarned || 0
      totalReputationGained.value = saved.totalReputationGained || 0
      customEventCounts.value = new Map(saved.customEventCounts || [])
      nightFellCount.value = saved.nightFellCount || 0
      totalSanityRecovered.value = saved.totalSanityRecovered || 0
      totalLevelUps.value = saved.totalLevelUps || 0
      totalExpGained.value = saved.totalExpGained || 0
    }

    allAchievements.value.forEach(ach => {
      if (!playerAchievements.value.has(ach.id)) {
        playerAchievements.value.set(ach.id, {
          id: generateId('pa'),
          achievementId: ach.id,
          playerId: pId,
          progress: 0,
          unlocked: false,
          claimed: false,
          firstSeenAt: Date.now(),
          notified: false
        })
      }
    })

    loadDerivedStats()
    trackLogin()
    saveAllData()
  }

  function loadDerivedStats() {
    const gameStore = useGameStore()
    totalMoneyEarned.value = Math.max(totalMoneyEarned.value, gameStore.stats.money)
    totalReputationGained.value = Math.max(totalReputationGained.value, gameStore.stats.reputation)
  }

  function saveAllData() {
    const data: AchievementSaveData = {
      version: STORAGE_VERSION,
      timestamp: Date.now(),
      playerAchievements: Array.from(playerAchievements.value.values()),
      notifications: notifications.value,
      behaviorEvents: behaviorEvents.value.slice(-500),
      consecutiveLoginDays: consecutiveLoginDays.value,
      totalLoginDays: totalLoginDays.value,
      lastLoginDate: lastLoginDate.value,
      perfectCompleteCount: perfectCompleteCount.value,
      anomalyResistCount: anomalyResistCount.value,
      collectedRelicTypes: Array.from(collectedRelicTypes.value),
      sanityMaintainDays: sanityMaintainDays.value,
      totalMoneyEarned: totalMoneyEarned.value,
      totalReputationGained: totalReputationGained.value,
      customEventCounts: Array.from(customEventCounts.value.entries()),
      nightFellCount: nightFellCount.value,
      totalSanityRecovered: totalSanityRecovered.value,
      totalLevelUps: totalLevelUps.value,
      totalExpGained: totalExpGained.value
    }
    saveToStorage(data)
  }

  function trackBehavior(eventType: BehaviorEventType, metadata: Record<string, any> = {}) {
    const event: BehaviorEvent = {
      id: generateId('evt'),
      eventType,
      playerId: playerId.value,
      timestamp: Date.now(),
      metadata,
      sessionId: metadata.sessionId
    }
    behaviorEvents.value.push(event)

    updateDerivedStats(eventType, metadata)
    checkAchievementConditions(eventType, metadata)

    const activityStore = useActivityStore()
    activityStore.trackEvent({
      activityId: 'achievement_system',
      playerId: playerId.value,
      eventType: 'view',
      metadata: {
        behaviorType: eventType,
        ...metadata
      }
    })
  }

  function updateDerivedStats(eventType: BehaviorEventType, metadata: Record<string, any>) {
    const gameStore = useGameStore()

    switch (eventType) {
      case 'money_earned':
        totalMoneyEarned.value += metadata.amount || 0
        break
      case 'reputation_gained':
        totalReputationGained.value += metadata.amount || 0
        break
      case 'sanity_recovered':
        totalSanityRecovered.value += metadata.amount || 0
        break
      case 'night_fell':
        nightFellCount.value++
        break
      case 'exp_gained':
        totalExpGained.value += metadata.amount || 0
        break
      case 'level_up':
        totalLevelUps.value++
        break
      case 'perfect_completed':
        perfectCompleteCount.value++
        break
      case 'anomaly_resisted':
        anomalyResistCount.value++
        break
      case 'relic_purified':
        if (metadata.relicType) {
          collectedRelicTypes.value.add(metadata.relicType)
        }
        break
      case 'day_passed':
        if (gameStore.stats.sanity >= (metadata.minSanity || 50)) {
          sanityMaintainDays.value++
        } else {
          sanityMaintainDays.value = 0
        }
        break
      case 'custom':
        if (metadata.eventName) {
          const current = customEventCounts.value.get(metadata.eventName) || 0
          customEventCounts.value.set(metadata.eventName, current + 1)
        }
        break
    }
  }

  function checkAchievementConditions(eventType: BehaviorEventType, metadata: Record<string, any>) {
    const conditionTypes = conditionTypeMap[eventType] || []
    if (conditionTypes.length === 0) return

    const newlyUnlocked: Achievement[] = []

    allAchievements.value.forEach(ach => {
      if (!conditionTypes.includes(ach.condition.type)) return

      const pa = playerAchievements.value.get(ach.id)
      if (!pa || pa.unlocked) return

      if (ach.condition.params) {
        const matches = Object.entries(ach.condition.params).every(
          ([key, value]) => metadata[key] === value
        )
        if (!matches) return
      }

      const progress = calculateProgress(ach, eventType, metadata)
      pa.progress = progress

      if (progress >= ach.condition.target && !pa.unlocked) {
        pa.unlocked = true
        pa.unlockedAt = Date.now()
        newlyUnlocked.push(ach)

        addNotification({
          type: 'achievement_unlock',
          title: '🎉 成就解锁！',
          message: `你解锁了成就：${ach.name}`,
          icon: ach.icon,
          data: { achievementId: ach.id, rarity: ach.rarity }
        })
      }

      playerAchievements.value.set(ach.id, pa)
    })

    if (newlyUnlocked.length > 0) {
      newlyUnlocked.forEach(ach => {
        recentlyUnlocked.value.push(ach.id)
      })

      if (newlyUnlocked.length > 0) {
        showUnlockPopup(newlyUnlocked[0])
      }
    }
  }

  function calculateProgress(
    ach: Achievement,
    eventType: BehaviorEventType,
    metadata: Record<string, any>
  ): number {
    const gameStore = useGameStore()
    const seasonStore = useSeasonStore()
    const characterStore = useCharacterStore()

    const pa = playerAchievements.value.get(ach.id)
    const currentProgress = pa?.progress || 0

    switch (ach.condition.type) {
      case 'order_complete':
        return Math.min(currentProgress + (metadata.amount || 1), ach.condition.target)
      case 'order_accept':
        return Math.min(currentProgress + (metadata.amount || 1), ach.condition.target)
      case 'day_pass':
        return Math.min(gameStore.stats.day, ach.condition.target)
      case 'night_fall':
        return Math.min(nightFellCount.value, ach.condition.target)
      case 'relic_purify':
        return Math.min(gameStore.stats.totalRelicsProcessed, ach.condition.target)
      case 'money_earn':
        return Math.min(totalMoneyEarned.value, ach.condition.target)
      case 'money_total':
        return Math.min(gameStore.stats.money, ach.condition.target)
      case 'reputation_gain':
        return Math.min(totalReputationGained.value, ach.condition.target)
      case 'reputation_total':
        return Math.min(gameStore.stats.reputation, ach.condition.target)
      case 'sanity_maintain':
        return Math.min(sanityMaintainDays.value, ach.condition.target)
      case 'sanity_recover':
        return Math.min(totalSanityRecovered.value, ach.condition.target)
      case 'character_unlock':
        if (ach.condition.params?.unlockAll) {
          const unlockedCount = characterStore.characters.filter(c => c.unlocked).length
          return unlockedCount >= characterStore.characters.length ? ach.condition.target : 0
        }
        return Math.min(characterStore.characters.filter(c => c.unlocked).length, ach.condition.target)
      case 'skill_upgrade':
        if (ach.condition.params?.maxLevel) {
          const hasMaxSkill = characterStore.characters.some(c =>
            c.skills.some(s => s.unlocked && s.level >= s.maxLevel)
          )
          return hasMaxSkill ? ach.condition.target : 0
        }
        return Math.min(currentProgress + (metadata.amount || 1), ach.condition.target)
      case 'level_up':
        return Math.min(totalLevelUps.value, ach.condition.target)
      case 'exp_gain':
        return Math.min(totalExpGained.value, ach.condition.target)
      case 'season_level':
        return Math.min(seasonStore.playerSeason?.level || 0, ach.condition.target)
      case 'task_complete':
        return Math.min(currentProgress + (metadata.amount || 1), ach.condition.target)
      case 'anomaly_resist':
        return Math.min(anomalyResistCount.value, ach.condition.target)
      case 'perfect_complete':
        return Math.min(perfectCompleteCount.value, ach.condition.target)
      case 'consecutive_login':
        return Math.min(consecutiveLoginDays.value, ach.condition.target)
      case 'total_login':
        return Math.min(totalLoginDays.value, ach.condition.target)
      case 'relic_type_collect':
        return Math.min(collectedRelicTypes.value.size, ach.condition.target)
      case 'custom_event':
        const eventName = ach.condition.params?.eventName
        if (!eventName) return currentProgress
        return Math.min(customEventCounts.value.get(eventName) || 0, ach.condition.target)
      default:
        return currentProgress
    }
  }

  function showUnlockPopup(ach: Achievement) {
    currentUnlockAchievement.value = ach
    showUnlockAnimation.value = true
    setTimeout(() => {
      showUnlockAnimation.value = false
      currentUnlockAchievement.value = null
    }, 3000)
  }

  function trackLogin() {
    const today = new Date().toDateString()

    if (lastLoginDate.value !== today) {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      if (lastLoginDate.value === yesterday.toDateString()) {
        consecutiveLoginDays.value++
      } else if (lastLoginDate.value !== today) {
        consecutiveLoginDays.value = 1
      }

      totalLoginDays.value++
      lastLoginDate.value = today

      trackBehavior('login', {
        consecutiveDays: consecutiveLoginDays.value,
        totalDays: totalLoginDays.value
      })
    }
  }

  function claimAchievementReward(achievementId: string): boolean {
    const pa = playerAchievements.value.get(achievementId)
    if (!pa || !pa.unlocked || pa.claimed) return false

    const ach = getAchievementById(achievementId)
    if (!ach) return false

    const gameStore = useGameStore()
    const seasonStore = useSeasonStore()

    ach.rewards.forEach(reward => {
      switch (reward.type) {
        case 'currency':
          if (typeof reward.value === 'number') {
            gameStore.addMoney(reward.value)
          }
          break
        case 'exp':
          if (typeof reward.value === 'number') {
            seasonStore.addExp(reward.value, 'achievement', achievementId)
          }
          break
        case 'badge':
        case 'title':
        case 'item':
          break
      }
    })

    pa.claimed = true
    pa.claimedAt = Date.now()
    playerAchievements.value.set(achievementId, pa)

    addNotification({
      type: 'reward_claim',
      title: '🎁 奖励已领取',
      message: `成就「${ach.name}」的奖励已发放`,
      icon: '🎁',
      data: { achievementId }
    })

    const activityStore = useActivityStore()
    activityStore.trackClaim('achievement_system', playerId.value, achievementId, {
      achievementName: ach.name,
      rewards: ach.rewards.map(r => ({ name: r.name, value: r.value }))
    })

    saveAllData()
    return true
  }

  function claimAllRewards(): number {
    let claimed = 0
    unclaimedAchievements.value.forEach(pa => {
      if (claimAchievementReward(pa.achievementId)) {
        claimed++
      }
    })
    return claimed
  }

  function addNotification(params: Omit<Notification, 'id' | 'createdAt' | 'playerId' | 'read'>) {
    const notification: Notification = {
      ...params,
      id: generateId('notif'),
      read: false,
      createdAt: Date.now(),
      playerId: playerId.value
    }
    notifications.value.unshift(notification)
    if (notifications.value.length > 100) {
      notifications.value = notifications.value.slice(0, 100)
    }
    saveAllData()
  }

  function markNotificationAsRead(notificationId: string) {
    const notif = notifications.value.find(n => n.id === notificationId)
    if (notif) {
      notif.read = true
      saveAllData()
    }
  }

  function markAllNotificationsAsRead() {
    notifications.value.forEach(n => {
      n.read = true
    })
    saveAllData()
  }

  function clearNotifications() {
    notifications.value = []
    saveAllData()
  }

  function getPlayerAchievement(achievementId: string): PlayerAchievement | undefined {
    return playerAchievements.value.get(achievementId)
  }

  function getAchievementProgress(achievementId: string): number {
    const pa = playerAchievements.value.get(achievementId)
    if (!pa) return 0

    const ach = getAchievementById(achievementId)
    if (!ach) return 0

    if (ach.condition.target === 0) return 100
    return Math.min(100, (pa.progress / ach.condition.target) * 100)
  }

  function getNotifications(limit: number = 50, type?: string): Notification[] {
    let result = [...notifications.value]
    if (type) {
      result = result.filter(n => n.type === type)
    }
    return result.slice(0, limit)
  }

  function getAchievementsByCategory(category: AchievementCategory): Achievement[] {
    return allAchievements.value.filter(a => a.category === category && !a.isHidden)
  }

  function getUnlockedBadges(): Array<{ id: string; name: string; icon: string; rarity: AchievementRarity }> {
    const badges: Array<{ id: string; name: string; icon: string; rarity: AchievementRarity }> = []

    unlockedAchievements.value.forEach(pa => {
      const ach = getAchievementById(pa.achievementId)
      if (ach) {
        ach.rewards.forEach(reward => {
          if (reward.type === 'badge') {
            badges.push({
              id: reward.id,
              name: reward.name,
              icon: reward.icon,
              rarity: reward.rarity
            })
          }
        })
      }
    })

    return badges
  }

  function getUnlockedTitles(): Array<{ id: string; name: string; icon: string }> {
    const titles: Array<{ id: string; name: string; icon: string }> = []

    unlockedAchievements.value.forEach(pa => {
      const ach = getAchievementById(pa.achievementId)
      if (ach) {
        ach.rewards.forEach(reward => {
          if (reward.type === 'title') {
            titles.push({
              id: reward.id,
              name: reward.name,
              icon: reward.icon
            })
          }
        })
      }
    })

    return titles
  }

  function triggerCustomEvent(eventName: string, metadata: Record<string, any> = {}) {
    trackBehavior('custom', {
      eventName,
      ...metadata
    })
  }

  function clearAllData() {
    playerAchievements.value.clear()
    notifications.value = []
    behaviorEvents.value = []
    recentlyUnlocked.value = []
    consecutiveLoginDays.value = 0
    totalLoginDays.value = 0
    lastLoginDate.value = ''
    perfectCompleteCount.value = 0
    anomalyResistCount.value = 0
    collectedRelicTypes.value.clear()
    sanityMaintainDays.value = 0
    totalMoneyEarned.value = 0
    totalReputationGained.value = 0
    customEventCounts.value.clear()
    localStorage.removeItem(ACHIEVEMENT_STORAGE_KEY)
  }

  function resyncProgress() {
    const gameStore = useGameStore()
    const seasonStore = useSeasonStore()
    const characterStore = useCharacterStore()

    trackBehavior('day_passed', { amount: gameStore.stats.day })
    trackBehavior('reputation_gained', { amount: 0 })
    trackBehavior('money_earned', { amount: 0 })

    if (seasonStore.playerSeason) {
      trackBehavior('season_level_up', { level: seasonStore.playerSeason.level })
    }

    characterStore.characters.forEach(c => {
      if (c.unlocked) {
        trackBehavior('character_unlocked', { characterId: c.id })
      }
    })
  }

  return {
    playerId,
    allAchievements,
    playerAchievements,
    notifications,
    behaviorEvents,
    recentlyUnlocked,
    showUnlockAnimation,
    currentUnlockAchievement,
    consecutiveLoginDays,
    totalLoginDays,
    perfectCompleteCount,
    anomalyResistCount,
    collectedRelicTypes,
    sanityMaintainDays,
    totalMoneyEarned,
    totalReputationGained,
    customEventCounts,
    nightFellCount,
    totalSanityRecovered,
    totalLevelUps,
    totalExpGained,
    unlockedAchievements,
    unclaimedAchievements,
    unreadNotifications,
    unclaimedCount,
    unreadNotificationCount,
    statistics,
    initAchievements,
    trackBehavior,
    trackLogin,
    claimAchievementReward,
    claimAllRewards,
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    getPlayerAchievement,
    getAchievementProgress,
    getNotifications,
    getAchievementsByCategory,
    getUnlockedBadges,
    getUnlockedTitles,
    triggerCustomEvent,
    clearAllData,
    resyncProgress,
    saveAllData
  }
})
