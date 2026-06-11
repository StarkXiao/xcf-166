import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import type {
  RedDotItem,
  RedDotCategory,
  RedDotPriority,
  RedDotStatistics,
  RedDotSaveData,
} from '@/types/redDot'
import {
  RED_DOT_STORAGE_KEY,
  RED_DOT_STORAGE_VERSION,
  RED_DOT_PRIORITY_ORDER,
  RED_DOT_CATEGORY_SORT_ORDER,
  RED_DOT_CATEGORY_LABELS,
  RED_DOT_READABLE_CATEGORIES,
} from '@/types/redDot'
import { useAchievementStore } from './achievementStore'
import { useFriendStore } from './friendStore'
import { useMailStore } from './mailStore'
import { useSeasonStore } from './seasonStore'
import { useShopStore } from './shopStore'

function generateId(prefix: string = 'rd'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function loadFromStorage(): RedDotSaveData | null {
  try {
    const raw = localStorage.getItem(RED_DOT_STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw) as RedDotSaveData
    }
  } catch (e) {
    console.error('Failed to load red dot data from storage:', e)
  }
  return null
}

function saveToStorage(data: RedDotSaveData) {
  try {
    localStorage.setItem(RED_DOT_STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save red dot data to storage:', e)
  }
}

function migrateLegacyData(raw: any): RedDotSaveData | null {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (parsed && (parsed.version === '1.0' || parsed.version === '2.0')) {
      return {
        version: RED_DOT_STORAGE_VERSION,
        timestamp: Date.now(),
        playerId: parsed.playerId || 'player_local',
        customReadIds: parsed.customReadIds || [],
        dismissedSnapshots: parsed.dismissedSnapshots || [],
      }
    }
  } catch {}
  return null
}

export const useRedDotStore = defineStore('redDot', () => {
  const playerId = ref('player_local')
  const customReadIds = ref<string[]>([])
  const dismissedSnapshots = ref<Record<string, number>>({})
  const customItems = ref<RedDotItem[]>([])

  const router = useRouter()

  const achievementStore = useAchievementStore()
  const friendStore = useFriendStore()
  const mailStore = useMailStore()
  const seasonStore = useSeasonStore()
  const shopStore = useShopStore()

  watch(
    [customReadIds, dismissedSnapshots, customItems],
    () => {
      saveAllData()
    },
    { deep: true }
  )

  function isDismissed(itemId: string, currentCount: number): boolean {
    const snapshot = dismissedSnapshots.value[itemId]
    if (snapshot === undefined) return false
    return currentCount <= snapshot
  }

  function isCustomRead(itemId: string): boolean {
    return customReadIds.value.includes(itemId)
  }

  function addCustomRead(itemId: string) {
    if (!customReadIds.value.includes(itemId)) {
      customReadIds.value.push(itemId)
    }
  }

  function removeCustomRead(itemId: string) {
    const idx = customReadIds.value.indexOf(itemId)
    if (idx >= 0) customReadIds.value.splice(idx, 1)
  }

  const generatedItems = computed<RedDotItem[]>(() => {
    const items: RedDotItem[] = []
    const now = Date.now()

    if (achievementStore.unclaimedCount > 0) {
      const count = achievementStore.unclaimedCount
      if (!isDismissed('gen_achievement_reward', count)) {
        items.push({
          id: 'gen_achievement_reward',
          category: 'achievement_reward',
          title: `${count} 个成就奖励待领取`,
          description: '前往成就中心领取奖励',
          priority: 'important',
          count,
          routePath: '/achievements',
          icon: '🏆',
          createdAt: now,
          updatedAt: now,
          isRead: false,
        })
      }
    }

    if (achievementStore.unreadNotificationCount > 0) {
      const count = achievementStore.unreadNotificationCount
      if (!isDismissed('gen_achievement_notification', count)) {
        items.push({
          id: 'gen_achievement_notification',
          category: 'achievement_notification',
          title: `${count} 条成就消息`,
          description: '查看新的成就通知',
          priority: 'normal',
          count,
          icon: '🔔',
          createdAt: now,
          updatedAt: now,
          isRead: false,
        })
      }
    }

    if (friendStore.pendingInviteCount > 0) {
      const count = friendStore.pendingInviteCount
      if (!isDismissed('gen_friend_invite', count)) {
        items.push({
          id: 'gen_friend_invite',
          category: 'friend_invite',
          title: `${count} 个好友邀请`,
          description: '处理好友邀请请求',
          priority: 'important',
          count,
          routePath: '/friends',
          routeQuery: { tab: 'invites' },
          icon: '👥',
          createdAt: now,
          updatedAt: now,
          isRead: false,
        })
      }
    }

    if (friendStore.unreadNotificationCount > 0) {
      const count = friendStore.unreadNotificationCount
      if (!isDismissed('gen_friend_notification', count)) {
        items.push({
          id: 'gen_friend_notification',
          category: 'friend_notification',
          title: `${count} 条好友消息`,
          description: '查看好友动态',
          priority: 'normal',
          count,
          icon: '💬',
          createdAt: now,
          updatedAt: now,
          isRead: false,
        })
      }
    }

    if (friendStore.pendingHelpRequestCount > 0) {
      const count = friendStore.pendingHelpRequestCount
      if (!isDismissed('gen_friend_help', count)) {
        items.push({
          id: 'gen_friend_help',
          category: 'friend_help_request',
          title: `${count} 个互助请求`,
          description: '好友需要你的帮助',
          priority: 'urgent',
          count,
          routePath: '/friends',
          routeQuery: { tab: 'tasks' },
          icon: '🤝',
          createdAt: now,
          updatedAt: now,
          isRead: false,
        })
      }
    }

    if (friendStore.unclaimedRewardCount > 0) {
      const count = friendStore.unclaimedRewardCount
      if (!isDismissed('gen_friend_task_reward', count)) {
        items.push({
          id: 'gen_friend_task_reward',
          category: 'friend_task_reward',
          title: `${count} 个互助奖励待领取`,
          description: '前往好友页面领取奖励',
          priority: 'important',
          count,
          routePath: '/friends',
          routeQuery: { tab: 'tasks' },
          icon: '🎁',
          createdAt: now,
          updatedAt: now,
          isRead: false,
        })
      }
    }

    if (mailStore.unreadCount > 0) {
      const count = mailStore.unreadCount
      if (!isDismissed('gen_mail_unread', count)) {
        items.push({
          id: 'gen_mail_unread',
          category: 'mail_unread',
          title: `${count} 封未读邮件`,
          description: '前往邮件中心查看',
          priority: 'normal',
          count,
          routePath: '/mail',
          icon: '✉️',
          createdAt: now,
          updatedAt: now,
          isRead: false,
        })
      }
    }

    if (mailStore.unclaimedAttachmentCount > 0) {
      const count = mailStore.unclaimedAttachmentCount
      if (!isDismissed('gen_mail_attachment', count)) {
        items.push({
          id: 'gen_mail_attachment',
          category: 'mail_attachment',
          title: `${count} 个邮件附件待领取`,
          description: '前往邮件中心领取附件',
          priority: 'important',
          count,
          routePath: '/mail',
          icon: '📎',
          createdAt: now,
          updatedAt: now,
          isRead: false,
        })
      }
    }

    const seasonUnclaimed = (seasonStore as any).unclaimedCount || (seasonStore as any).unclaimedRewardCount || 0
    if (seasonUnclaimed > 0) {
      if (!isDismissed('gen_season_task', seasonUnclaimed)) {
        items.push({
          id: 'gen_season_task',
          category: 'season_task',
          title: `${seasonUnclaimed} 个赛季奖励待领取`,
          description: '前往赛季中心领取',
          priority: 'important',
          count: seasonUnclaimed,
          routePath: '/season',
          routeQuery: { tab: 'weekly_tasks' },
          icon: '⚔️',
          createdAt: now,
          updatedAt: now,
          isRead: false,
        })
      }
    }

    const shopNewCount = (shopStore as any).newArrivalCount || (shopStore as any).activeDiscounts?.length || 0
    if (shopNewCount > 0) {
      if (!isDismissed('gen_shop_new', shopNewCount)) {
        items.push({
          id: 'gen_shop_new',
          category: 'shop_new',
          title: `${shopNewCount} 件商城新品/优惠`,
          description: '前往商城查看',
          priority: 'low',
          count: shopNewCount,
          routePath: '/shop',
          icon: '🛒',
          createdAt: now,
          updatedAt: now,
          isRead: false,
        })
      }
    }

    return items
  })

  const allItems = computed<RedDotItem[]>(() => {
    const merged = [...generatedItems.value]

    customItems.value.forEach(item => {
      const existing = merged.find(i => i.id === item.id)
      if (!existing) {
        merged.push({
          ...item,
          isRead: item.isRead || isCustomRead(item.id),
        })
      }
    })

    return merged.sort((a, b) => {
      const prioDiff = RED_DOT_PRIORITY_ORDER[a.priority] - RED_DOT_PRIORITY_ORDER[b.priority]
      if (prioDiff !== 0) return prioDiff
      const catDiff = (RED_DOT_CATEGORY_SORT_ORDER[a.category] ?? 99) - (RED_DOT_CATEGORY_SORT_ORDER[b.category] ?? 99)
      if (catDiff !== 0) return catDiff
      return b.count - a.count
    })
  })

  const unreadItems = computed(() => allItems.value.filter(i => !i.isRead))

  const totalCount = computed(() => allItems.value.length)
  const totalUnreadCount = computed(() => unreadItems.value.length)

  const totalBadgeCount = computed(() => {
    return unreadItems.value.reduce((sum, item) => sum + item.count, 0)
  })

  const highestPriority = computed<RedDotPriority | null>(() => {
    if (unreadItems.value.length === 0) return null
    return unreadItems.value.reduce<RedDotPriority | null>((highest, item) => {
      if (highest === null) return item.priority
      return RED_DOT_PRIORITY_ORDER[item.priority] < RED_DOT_PRIORITY_ORDER[highest]
        ? item.priority
        : highest
    }, null)
  })

  const statistics = computed<RedDotStatistics>(() => {
    const byPriority: Record<RedDotPriority, number> = {
      urgent: 0,
      important: 0,
      normal: 0,
      low: 0,
    }
    const byCategory: Record<RedDotCategory, number> = {
      achievement_reward: 0,
      achievement_notification: 0,
      friend_invite: 0,
      friend_notification: 0,
      friend_help_request: 0,
      friend_task_reward: 0,
      mail_unread: 0,
      mail_attachment: 0,
      season_task: 0,
      shop_new: 0,
      custom: 0,
    }

    unreadItems.value.forEach(item => {
      byPriority[item.priority] += item.count
      byCategory[item.category] += item.count
    })

    return {
      totalCount: totalCount.value,
      unreadCount: totalUnreadCount.value,
      byPriority,
      byCategory,
      highestPriority: highestPriority.value,
    }
  })

  const groupedByCategory = computed(() => {
    const groups: Record<string, RedDotItem[]> = {}
    allItems.value.forEach(item => {
      const key = item.category
      if (!groups[key]) groups[key] = []
      groups[key].push(item)
    })
    return groups
  })

  function initRedDotSystem(pId: string = 'player_local') {
    playerId.value = pId

    let saved = loadFromStorage()
    if (saved && (saved.version === '1.0' || saved.version === '2.0')) {
      saved = migrateLegacyData(saved)
    }

    if (saved) {
      customReadIds.value = saved.customReadIds || []
      dismissedSnapshots.value = Object.fromEntries(saved.dismissedSnapshots || [])
    }
  }

  function saveAllData() {
    const data: RedDotSaveData = {
      version: RED_DOT_STORAGE_VERSION,
      timestamp: Date.now(),
      playerId: playerId.value,
      customReadIds: [...customReadIds.value],
      dismissedSnapshots: Object.entries(dismissedSnapshots.value),
    }
    saveToStorage(data)
  }

  function markAsRead(itemId: string) {
    const item = allItems.value.find(i => i.id === itemId)
    if (!item) return

    if (RED_DOT_READABLE_CATEGORIES.has(item.category)) {
      switch (item.category) {
        case 'achievement_notification':
          achievementStore.markAllNotificationsAsRead()
          break
        case 'friend_notification':
          friendStore.markAllNotificationsAsRead()
          break
        case 'mail_unread':
          mailStore.markAllAsRead()
          break
      }
    } else if (item.category === 'custom') {
      addCustomRead(itemId)
    }
  }

  function markAllAsRead() {
    RED_DOT_READABLE_CATEGORIES.forEach(category => {
      switch (category) {
        case 'achievement_notification':
          achievementStore.markAllNotificationsAsRead()
          break
        case 'friend_notification':
          friendStore.markAllNotificationsAsRead()
          break
        case 'mail_unread':
          mailStore.markAllAsRead()
          break
      }
    })

    customItems.value.forEach(item => {
      addCustomRead(item.id)
    })
  }

  function markCategoryAsRead(category: RedDotCategory) {
    if (!RED_DOT_READABLE_CATEGORIES.has(category)) return

    switch (category) {
      case 'achievement_notification':
        achievementStore.markAllNotificationsAsRead()
        break
      case 'friend_notification':
        friendStore.markAllNotificationsAsRead()
        break
      case 'mail_unread':
        mailStore.markAllAsRead()
        break
    }

    if (category === 'custom') {
      customItems.value
        .filter(item => item.category === 'custom')
        .forEach(item => addCustomRead(item.id))
    }
  }

  function dismissItem(itemId: string) {
    const item = allItems.value.find(i => i.id === itemId)
    if (!item) return

    if (item.category === 'custom') {
      addCustomRead(itemId)
    } else {
      dismissedSnapshots.value = {
        ...dismissedSnapshots.value,
        [itemId]: item.count,
      }
    }
  }

  function navigateToItem(itemId: string) {
    const item = allItems.value.find(i => i.id === itemId)
    if (!item || !item.routePath) return false

    if (RED_DOT_READABLE_CATEGORIES.has(item.category)) {
      markAsRead(itemId)
    }

    if (item.routeQuery) {
      router.push({ path: item.routePath, query: item.routeQuery })
    } else {
      router.push(item.routePath)
    }
    return true
  }

  function getCategoryCount(category: RedDotCategory): number {
    return (
      unreadItems.value
        .filter(item => item.category === category)
        .reduce((sum, item) => sum + item.count, 0)
    )
  }

  function getCategoryLabel(category: RedDotCategory): string {
    return RED_DOT_CATEGORY_LABELS[category] || category
  }

  function isCategoryReadable(category: RedDotCategory): boolean {
    return RED_DOT_READABLE_CATEGORIES.has(category)
  }

  function addCustomItem(params: Omit<RedDotItem, 'id' | 'createdAt' | 'updatedAt' | 'isRead'> & {
    id?: string
  }): string {
    const id = params.id || generateId('custom')
    const now = Date.now()

    const existing = customItems.value.findIndex(i => i.id === id)
    const item: RedDotItem = {
      ...params,
      id,
      createdAt: existing >= 0 ? customItems.value[existing].createdAt : now,
      updatedAt: now,
      isRead: false,
    }

    if (existing >= 0) {
      customItems.value[existing] = item
    } else {
      customItems.value.push(item)
    }

    return id
  }

  function removeCustomItem(itemId: string) {
    customItems.value = customItems.value.filter(i => i.id !== itemId)
    removeCustomRead(itemId)
    const { [itemId]: _, ...rest } = dismissedSnapshots.value
    dismissedSnapshots.value = rest
  }

  function clearAllData() {
    customReadIds.value = []
    dismissedSnapshots.value = {}
    customItems.value = []
    localStorage.removeItem(RED_DOT_STORAGE_KEY)
  }

  return {
    playerId,
    customReadIds,
    dismissedSnapshots,
    allItems,
    unreadItems,
    generatedItems,
    customItems,
    totalCount,
    totalUnreadCount,
    totalBadgeCount,
    highestPriority,
    statistics,
    groupedByCategory,
    initRedDotSystem,
    saveAllData,
    markAsRead,
    markAllAsRead,
    markCategoryAsRead,
    dismissItem,
    navigateToItem,
    getCategoryCount,
    getCategoryLabel,
    isCategoryReadable,
    addCustomItem,
    removeCustomItem,
    clearAllData,
  }
})
