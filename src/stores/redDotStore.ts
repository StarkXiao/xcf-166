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
  RED_DOT_CATEGORY_LABELS,
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

export const useRedDotStore = defineStore('redDot', () => {
  const playerId = ref('player_local')
  const readIds = ref<Set<string>>(new Set())
  const dismissedIds = ref<Set<string>>(new Set())
  const customItems = ref<RedDotItem[]>([])

  const router = useRouter()

  const achievementStore = useAchievementStore()
  const friendStore = useFriendStore()
  const mailStore = useMailStore()
  const seasonStore = useSeasonStore()
  const shopStore = useShopStore()

  watch(
    [readIds, dismissedIds, customItems],
    () => {
      saveAllData()
    },
    { deep: true }
  )

  const generatedItems = computed<RedDotItem[]>(() => {
    const items: RedDotItem[] = []
    const now = Date.now()

    if (achievementStore.unclaimedCount > 0) {
      items.push({
        id: 'gen_achievement_reward',
        category: 'achievement_reward',
        title: `${achievementStore.unclaimedCount} 个成就奖励待领取`,
        description: '前往成就中心领取奖励',
        priority: 'important',
        count: achievementStore.unclaimedCount,
        routePath: '/achievements',
        icon: '🏆',
        createdAt: now,
        updatedAt: now,
        isRead: readIds.value.has('gen_achievement_reward'),
      })
    }

    if (achievementStore.unreadNotificationCount > 0) {
      items.push({
        id: 'gen_achievement_notification',
        category: 'achievement_notification',
        title: `${achievementStore.unreadNotificationCount} 条成就消息`,
        description: '查看新的成就通知',
        priority: 'normal',
        count: achievementStore.unreadNotificationCount,
        icon: '🔔',
        createdAt: now,
        updatedAt: now,
        isRead: readIds.value.has('gen_achievement_notification'),
      })
    }

    if (friendStore.pendingInviteCount > 0) {
      items.push({
        id: 'gen_friend_invite',
        category: 'friend_invite',
        title: `${friendStore.pendingInviteCount} 个好友邀请`,
        description: '处理好友邀请请求',
        priority: 'important',
        count: friendStore.pendingInviteCount,
        routePath: '/friends',
        routeQuery: { tab: 'invites' },
        icon: '👥',
        createdAt: now,
        updatedAt: now,
        isRead: readIds.value.has('gen_friend_invite'),
      })
    }

    if (friendStore.unreadNotificationCount > 0) {
      items.push({
        id: 'gen_friend_notification',
        category: 'friend_notification',
        title: `${friendStore.unreadNotificationCount} 条好友消息`,
        description: '查看好友动态',
        priority: 'normal',
        count: friendStore.unreadNotificationCount,
        icon: '💬',
        createdAt: now,
        updatedAt: now,
        isRead: readIds.value.has('gen_friend_notification'),
      })
    }

    if (friendStore.pendingHelpRequestCount > 0) {
      items.push({
        id: 'gen_friend_help',
        category: 'friend_help_request',
        title: `${friendStore.pendingHelpRequestCount} 个互助请求`,
        description: '好友需要你的帮助',
        priority: 'urgent',
        count: friendStore.pendingHelpRequestCount,
        routePath: '/friends',
        routeQuery: { tab: 'tasks' },
        icon: '🤝',
        createdAt: now,
        updatedAt: now,
        isRead: readIds.value.has('gen_friend_help'),
      })
    }

    if (friendStore.unclaimedRewardCount > 0) {
      items.push({
        id: 'gen_friend_task_reward',
        category: 'friend_task_reward',
        title: `${friendStore.unclaimedRewardCount} 个互助奖励待领取`,
        description: '前往好友页面领取奖励',
        priority: 'important',
        count: friendStore.unclaimedRewardCount,
        routePath: '/friends',
        routeQuery: { tab: 'tasks' },
        icon: '🎁',
        createdAt: now,
        updatedAt: now,
        isRead: readIds.value.has('gen_friend_task_reward'),
      })
    }

    if (mailStore.unreadCount > 0) {
      items.push({
        id: 'gen_mail_unread',
        category: 'mail_unread',
        title: `${mailStore.unreadCount} 封未读邮件`,
        description: '前往邮件中心查看',
        priority: 'normal',
        count: mailStore.unreadCount,
        routePath: '/mail',
        icon: '✉️',
        createdAt: now,
        updatedAt: now,
        isRead: readIds.value.has('gen_mail_unread'),
      })
    }

    if (mailStore.unclaimedAttachmentCount > 0) {
      items.push({
        id: 'gen_mail_attachment',
        category: 'mail_attachment',
        title: `${mailStore.unclaimedAttachmentCount} 个邮件附件待领取`,
        description: '前往邮件中心领取附件',
        priority: 'important',
        count: mailStore.unclaimedAttachmentCount,
        routePath: '/mail',
        icon: '📎',
        createdAt: now,
        updatedAt: now,
        isRead: readIds.value.has('gen_mail_attachment'),
      })
    }

    const seasonUnclaimed = (seasonStore as any).unclaimedCount || (seasonStore as any).unclaimedRewardCount || 0
    if (seasonUnclaimed > 0) {
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
        isRead: readIds.value.has('gen_season_task'),
      })
    }

    const shopNewCount = (shopStore as any).newArrivalCount || (shopStore as any).activeDiscounts?.length || 0
    if (shopNewCount > 0) {
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
        isRead: readIds.value.has('gen_shop_new'),
      })
    }

    return items
  })

  const allItems = computed<RedDotItem[]>(() => {
    const merged = [...generatedItems.value]

    customItems.value.forEach(item => {
      const existing = merged.find(i => i.id === item.id)
      if (!existing && !dismissedIds.value.has(item.id)) {
        merged.push({
          ...item,
          isRead: item.isRead || readIds.value.has(item.id),
        })
      }
    })

    return merged.sort((a, b) => {
      const prioDiff = RED_DOT_PRIORITY_ORDER[a.priority] - RED_DOT_PRIORITY_ORDER[b.priority]
      if (prioDiff !== 0) return prioDiff
      return b.updatedAt - a.updatedAt
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

    const saved = loadFromStorage()
    if (saved) {
      readIds.value = new Set(saved.readIds || [])
      dismissedIds.value = new Set(saved.dismissedIds || [])
    }
  }

  function saveAllData() {
    const data: RedDotSaveData = {
      version: RED_DOT_STORAGE_VERSION,
      timestamp: Date.now(),
      playerId: playerId.value,
      readIds: Array.from(readIds.value),
      dismissedIds: Array.from(dismissedIds.value),
    }
    saveToStorage(data)
  }

  function markAsRead(itemId: string) {
    readIds.value.add(itemId)

    const item = allItems.value.find(i => i.id === itemId)
    if (!item) return

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
  }

  function markAllAsRead() {
    allItems.value.forEach(item => {
      readIds.value.add(item.id)
    })

    achievementStore.markAllNotificationsAsRead()
    friendStore.markAllNotificationsAsRead()
    mailStore.markAllAsRead()
  }

  function markCategoryAsRead(category: RedDotCategory) {
    allItems.value
      .filter(item => item.category === category)
      .forEach(item => {
        readIds.value.add(item.id)
      })

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
      case 'mail_attachment':
        mailStore.batchClaimAll()
        break
    }
  }

  function dismissItem(itemId: string) {
    dismissedIds.value.add(itemId)
    markAsRead(itemId)
  }

  function navigateToItem(itemId: string) {
    const item = allItems.value.find(i => i.id === itemId)
    if (!item || !item.routePath) return false

    markAsRead(itemId)

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
    readIds.value.delete(itemId)
    dismissedIds.value.delete(itemId)
  }

  function clearAllData() {
    readIds.value.clear()
    dismissedIds.value.clear()
    customItems.value = []
    localStorage.removeItem(RED_DOT_STORAGE_KEY)
  }

  return {
    playerId,
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
    addCustomItem,
    removeCustomItem,
    clearAllData,
  }
})
