<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Notification } from '@/types/achievement'
import { useAchievementStore } from '@/stores/achievementStore'
import { X, Bell, Check, CheckCheck, Trash2, Trophy, Gift, Info, AlertTriangle } from 'lucide-vue-next'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const achievementStore = useAchievementStore()
const filterType = ref<'all' | 'achievement_unlock' | 'reward_claim' | 'system'>('all')

const filteredNotifications = computed(() => {
  let result = [...achievementStore.notifications]
  if (filterType.value !== 'all') {
    result = result.filter(n => n.type === filterType.value)
  }
  return result
})

const typeIcons: Record<string, any> = {
  achievement_unlock: Trophy,
  reward_claim: Gift,
  system: Info,
  event: AlertTriangle
}

const typeColors: Record<string, string> = {
  achievement_unlock: 'bg-amber-500/20 text-amber-400',
  reward_claim: 'bg-green-500/20 text-green-400',
  system: 'bg-blue-500/20 text-blue-400',
  event: 'bg-purple-500/20 text-purple-400'
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
    return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }
}

function handleMarkAsRead(id: string) {
  achievementStore.markNotificationAsRead(id)
}

function handleMarkAllAsRead() {
  achievementStore.markAllNotificationsAsRead()
}

function handleClearAll() {
  if (confirm('确定要清空所有消息吗？')) {
    achievementStore.clearNotifications()
  }
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
            <h2 class="text-xl font-bold text-white">消息中心</h2>
            <span
              v-if="achievementStore.unreadNotificationCount > 0"
              class="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white"
            >
              {{ achievementStore.unreadNotificationCount }}
            </span>
          </div>
          <button
            @click="emit('close')"
            class="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="flex gap-2 p-3 border-b border-gray-700">
          <button
            v-for="type in ['all', 'achievement_unlock', 'reward_claim', 'system'] as const"
            :key="type"
            @click="filterType = type"
            class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            :class="filterType === type
              ? 'bg-amber-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'"
          >
            {{ type === 'all' ? '全部' : type === 'achievement_unlock' ? '成就' : type === 'reward_claim' ? '奖励' : '系统' }}
          </button>
        </div>

        <div class="flex items-center justify-between px-4 py-2 bg-gray-800/50">
          <span class="text-sm text-gray-500">
            共 {{ filteredNotifications.length }} 条消息
          </span>
          <div class="flex gap-2">
            <button
              @click="handleMarkAllAsRead"
              class="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            >
              <CheckCheck class="w-3.5 h-3.5" />
              全部已读
            </button>
            <button
              @click="handleClearAll"
              class="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 class="w-3.5 h-3.5" />
              清空
            </button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto">
          <div v-if="filteredNotifications.length === 0" class="flex flex-col items-center justify-center h-full text-gray-500">
            <Bell class="w-12 h-12 mb-2 opacity-30" />
            <p>暂无消息</p>
          </div>

          <div
            v-for="notification in filteredNotifications"
            :key="notification.id"
            class="p-4 border-b border-gray-800 hover:bg-gray-800/50 transition-colors cursor-pointer"
            :class="{ 'bg-gray-800/30': !notification.read }"
            @click="handleMarkAsRead(notification.id)"
          >
            <div class="flex items-start gap-3">
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                :class="typeColors[notification.type]"
              >
                <component :is="typeIcons[notification.type] || Info" class="w-5 h-5" />
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                  <h4 class="font-medium text-white truncate">{{ notification.title }}</h4>
                  <span class="text-xs text-gray-500 flex-shrink-0">{{ formatTime(notification.createdAt) }}</span>
                </div>
                <p class="text-sm text-gray-400 mt-1">{{ notification.message }}</p>

                <div
                  v-if="notification.relatedAchievementId"
                  class="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded text-xs bg-amber-500/10 text-amber-400"
                >
                  <Trophy class="w-3 h-3" />
                  相关成就
                </div>
              </div>

              <div v-if="!notification.read" class="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2"></div>
              <Check v-else class="w-4 h-4 text-green-500 flex-shrink-0 mt-1.5" />
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
  transform: translateX(100%);
}

.slide-right-enter-from > div:first-child,
.slide-right-leave-to > div:first-child {
  opacity: 0;
}
</style>
