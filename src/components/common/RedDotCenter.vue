<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRedDotStore } from '@/stores/redDotStore'
import type { RedDotCategory, RedDotPriority } from '@/types/redDot'
import {
  RED_DOT_CATEGORY_LABELS,
  RED_DOT_CATEGORY_COLORS,
  RED_DOT_PRIORITY_ORDER,
  RED_DOT_READABLE_CATEGORIES,
} from '@/types/redDot'
import RedDotBadge from './RedDotBadge.vue'
import {
  X,
  CheckCheck,
  Bell,
  ChevronRight,
  Eye,
  Trash2,
  AlertCircle,
  AlertTriangle,
  Info,
  CircleDot,
} from 'lucide-vue-next'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const redDotStore = useRedDotStore()

const filterCategory = ref<RedDotCategory | 'all'>('all')

const categories = computed(() => {
  const cats: Array<{ id: RedDotCategory | 'all'; label: string; count: number }> = [
    { id: 'all', label: '全部', count: redDotStore.totalUnreadCount },
  ]

  const usedCategories = new Set<RedDotCategory>()
  redDotStore.allItems.forEach(item => usedCategories.add(item.category))

  ;(Object.keys(RED_DOT_CATEGORY_LABELS) as RedDotCategory[]).forEach(cat => {
    if (usedCategories.has(cat)) {
      cats.push({
        id: cat,
        label: RED_DOT_CATEGORY_LABELS[cat],
        count: redDotStore.getCategoryCount(cat),
      })
    }
  })

  return cats
})

const filteredItems = computed(() => {
  let items = [...redDotStore.allItems]
  if (filterCategory.value !== 'all') {
    items = items.filter(i => i.category === filterCategory.value)
  }
  return items
})

const canMarkCategoryAsRead = computed(() => {
  if (filterCategory.value === 'all') {
    return redDotStore.allItems.some(i => RED_DOT_READABLE_CATEGORIES.has(i.category) && !i.isRead)
  }
  return RED_DOT_READABLE_CATEGORIES.has(filterCategory.value)
})

function isItemReadable(category: RedDotCategory): boolean {
  return RED_DOT_READABLE_CATEGORIES.has(category)
}

const priorityIcon: Record<RedDotPriority, any> = {
  urgent: AlertCircle,
  important: AlertTriangle,
  normal: Info,
  low: CircleDot,
}

const priorityClass: Record<RedDotPriority, string> = {
  urgent: 'text-red-400 bg-red-500/20',
  important: 'text-orange-400 bg-orange-500/20',
  normal: 'text-blue-400 bg-blue-500/20',
  low: 'text-gray-400 bg-gray-500/20',
}

function formatTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp

  if (diff < 60 * 1000) {
    return '刚刚'
  } else if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))} 分钟前`
  } else if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 60 * 1000))} 小时前`
  } else {
    const date = new Date(timestamp)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }
}

function handleMarkAsRead(id: string) {
  redDotStore.markAsRead(id)
}

function handleMarkAllAsRead() {
  redDotStore.markAllAsRead()
}

function handleMarkCategoryAsRead() {
  if (filterCategory.value === 'all') {
    handleMarkAllAsRead()
  } else {
    redDotStore.markCategoryAsRead(filterCategory.value)
  }
}

function handleNavigate(itemId: string) {
  const success = redDotStore.navigateToItem(itemId)
  if (success) {
    emit('close')
  }
}

function handleDismiss(itemId: string) {
  redDotStore.dismissItem(itemId)
}
</script>

<template>
  <Transition name="slide-right">
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex justify-end"
    >
      <div
        class="absolute inset-0 bg-black/50 backdrop-blur-sm"
        @click="emit('close')"
      ></div>

      <div class="relative w-full max-w-md h-full bg-gray-900 border-l border-gray-700 flex flex-col">
        <div class="flex items-center justify-between p-4 border-b border-gray-700">
          <div class="flex items-center gap-2">
            <Bell class="w-5 h-5 text-amber-400" />
            <h2 class="text-xl font-bold text-white">红点提醒</h2>
            <RedDotBadge
              v-if="redDotStore.totalUnreadCount > 0"
              :count="redDotStore.totalBadgeCount"
              :priority="redDotStore.highestPriority || 'normal'"
            />
          </div>
          <button
            @click="emit('close')"
            class="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="flex gap-2 p-3 border-b border-gray-700 overflow-x-auto">
          <button
            v-for="cat in categories"
            :key="cat.id"
            @click="filterCategory = cat.id"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            :class="filterCategory === cat.id
              ? 'bg-amber-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'"
          >
            {{ cat.label }}
            <RedDotBadge
              v-if="cat.count > 0"
              :count="cat.count"
              size="sm"
              :pulse="false"
              color="bg-red-500"
            />
          </button>
        </div>

        <div class="flex items-center justify-between px-4 py-2 bg-gray-800/50">
          <span class="text-sm text-gray-500">
            共 {{ filteredItems.length }} 条提醒，{{ redDotStore.totalUnreadCount }} 条未读
          </span>
          <div class="flex gap-2">
            <button
              v-if="canMarkCategoryAsRead"
              @click="handleMarkCategoryAsRead"
              class="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            >
              <CheckCheck class="w-3.5 h-3.5" />
              {{ filterCategory === 'all' ? '全部已读' : '分类已读' }}
            </button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto">
          <div v-if="filteredItems.length === 0" class="flex flex-col items-center justify-center h-full text-gray-500 p-8">
            <Bell class="w-16 h-16 mb-4 opacity-30" />
            <p class="text-lg">暂无红点提醒</p>
            <p class="text-sm mt-1">所有消息都已处理完毕</p>
          </div>

          <div v-else class="divide-y divide-gray-800">
            <div
              v-for="item in filteredItems"
              :key="item.id"
              class="p-4 hover:bg-gray-800/50 transition-colors cursor-pointer group"
              :class="{ 'opacity-60': item.isRead }"
              @click="handleNavigate(item.id)"
            >
              <div class="flex items-start gap-3">
                <div
                  class="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  :class="RED_DOT_CATEGORY_COLORS[item.category] || 'bg-gray-700'"
                >
                  {{ item.icon || '🔔' }}
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <h4
                      class="font-medium truncate"
                      :class="item.isRead ? 'text-gray-400' : 'text-white'"
                    >
                      {{ item.title }}
                    </h4>
                    <span
                      class="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0"
                      :class="priorityClass[item.priority]"
                    >
                      <component :is="priorityIcon[item.priority]" class="w-2.5 h-2.5" />
                    </span>
                  </div>

                  <p v-if="item.description" class="text-sm text-gray-400 mt-1">
                    {{ item.description }}
                  </p>

                  <div class="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <span>{{ formatTime(item.updatedAt) }}</span>
                    <span>·</span>
                    <span>{{ RED_DOT_CATEGORY_LABELS[item.category] || item.category }}</span>
                    <span v-if="item.count > 1" class="text-gray-400">· {{ item.count }} 项</span>
                  </div>
                </div>

                <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    v-if="!item.isRead && isItemReadable(item.category)"
                    @click.stop="handleMarkAsRead(item.id)"
                    class="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-blue-400 transition-colors"
                    title="标记已读"
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                  <button
                    v-if="item.routePath"
                    @click.stop="handleNavigate(item.id)"
                    class="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                    title="前往处理"
                  >
                    <ChevronRight class="w-4 h-4" />
                  </button>
                  <button
                    @click.stop="handleDismiss(item.id)"
                    class="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-red-400 transition-colors"
                    title="忽略"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease;
}
.slide-right-enter-from,
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
