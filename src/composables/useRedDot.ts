import { computed } from 'vue'
import { useRedDotStore } from '@/stores/redDotStore'
import type { RedDotCategory, RedDotPriority } from '@/types/redDot'
import { RED_DOT_PRIORITY_ORDER } from '@/types/redDot'

export function useRedDot() {
  const redDotStore = useRedDotStore()

  const totalBadgeCount = computed(() => redDotStore.totalBadgeCount)
  const totalUnreadCount = computed(() => redDotStore.totalUnreadCount)
  const highestPriority = computed(() => redDotStore.highestPriority)
  const allItems = computed(() => redDotStore.allItems)
  const unreadItems = computed(() => redDotStore.unreadItems)

  function getCategoryBadgeCount(category: RedDotCategory): number {
    return redDotStore.getCategoryCount(category)
  }

  function getMultiCategoryBadgeCount(categories: RedDotCategory[]): number {
    return categories.reduce((sum, cat) => sum + getCategoryBadgeCount(cat), 0)
  }

  function getMultiCategoryHighestPriority(
    categories: RedDotCategory[]
  ): RedDotPriority | null {
    const categorySet = new Set(categories)
    const items = unreadItems.value.filter(i => categorySet.has(i.category))
    if (items.length === 0) return null

    return items.reduce<RedDotPriority>((highest, item) => {
      return RED_DOT_PRIORITY_ORDER[item.priority] < RED_DOT_PRIORITY_ORDER[highest]
        ? item.priority
        : highest
    }, items[0].priority)
  }

  function markCategoryAsRead(category: RedDotCategory) {
    redDotStore.markCategoryAsRead(category)
  }

  function markAllAsRead() {
    redDotStore.markAllAsRead()
  }

  function navigateToCategory(category: RedDotCategory) {
    const item = unreadItems.value.find(i => i.category === category)
    if (item) {
      redDotStore.navigateToItem(item.id)
    }
  }

  function addCustomRedDot(params: {
    id?: string
    title: string
    description?: string
    priority?: RedDotPriority
    count?: number
    routePath?: string
    routeQuery?: Record<string, any>
    icon?: string
    metadata?: Record<string, any>
  }): string {
    return redDotStore.addCustomItem({
      category: 'custom',
      title: params.title,
      description: params.description,
      priority: params.priority || 'normal',
      count: params.count || 1,
      routePath: params.routePath,
      routeQuery: params.routeQuery,
      icon: params.icon || '🔔',
      metadata: params.metadata,
      ...(params.id ? { id: params.id } : {}),
    })
  }

  function removeCustomRedDot(itemId: string) {
    redDotStore.removeCustomItem(itemId)
  }

  return {
    redDotStore,
    totalBadgeCount,
    totalUnreadCount,
    highestPriority,
    allItems,
    unreadItems,
    getCategoryBadgeCount,
    getMultiCategoryBadgeCount,
    getMultiCategoryHighestPriority,
    markCategoryAsRead,
    markAllAsRead,
    navigateToCategory,
    addCustomRedDot,
    removeCustomRedDot,
  }
}
