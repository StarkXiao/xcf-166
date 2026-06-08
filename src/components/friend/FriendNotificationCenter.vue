<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFriendStore } from '@/stores/friendStore'
import type { FriendNotification } from '@/types/friend'
import { Bell, Check, CheckCheck, Trash2, UserPlus, Zap, Gift, Heart, X } from 'lucide-vue-next'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const friendStore = useFriendStore()

const filterType = ref<'all' | 'invite' | 'task_request' | 'task_accepted' | 'task_rejected' | 'help_needed' | 'task_completed' | 'reward_available' | 'milestone_unlocked'>('all')

const filteredNotifications = computed(() => {
  let result = [...friendStore.notifications]
  if (filterType.value !== 'all') {
    result = result.filter(n => n.type === filterType.value)
  }
  return result
})

const typeIcons: Record<string, any> = {
  invite: UserPlus,
  task_request: Zap,
  task_accepted: Check,
  task_rejected: X,
  help_needed: Gift,
  task_completed: Check,
  reward_available: Gift,
  milestone_unlocked: Heart
}

const typeColors: Record<string, string> = {
  invite: 'bg-cyan-500/20 text-cyan-400',
  task_request: 'bg-blue-500/20 text-blue-400',
  task_accepted: 'bg-green-500/20 text-green-400',
  task_rejected: 'bg-red-500/20 text-red-400',
  help_needed: 'bg-amber-500/20 text-amber-400',
  task_completed: 'bg-green-500/20 text-green-400',
  reward_available: 'bg-amber-500/20 text-amber-400',
  milestone_unlocked: 'bg-pink-500/20 text-pink-400'
}

const typeLabels: Record<string, string> = {
  all: '全部',
  invite: '好友邀请',
  task_request: '互助请求',
  task_accepted: '请求已接受',
  task_rejected: '请求已拒绝',
  help_needed: '需要帮助',
  task_completed: '任务完成',
  reward_available: '奖励可领',
  milestone_unlocked: '里程碑'
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
  friendStore.markNotificationAsRead(id)
}

function handleMarkAllAsRead() {
  friendStore.markAllNotificationsAsRead()
}

function handleClearAll() {
  if (confirm('确定要清空所有好友消息吗？')) {
    friendStore.clearNotifications()
  }
}

function handleAcceptTaskRequest(notification: FriendNotification) {
  handleMarkAsRead(notification.id)
  if (notification.data?.taskProgressId) {
    friendStore.acceptMutualTask(notification.data.taskProgressId)
  }
}

function handleRejectTaskRequest(notification: FriendNotification) {
  handleMarkAsRead(notification.id)
  if (notification.data?.taskProgressId) {
    friendStore.rejectMutualTask(notification.data.taskProgressId)
  }
}

function handleGiftMoney(notification: FriendNotification) {
  handleMarkAsRead(notification.id)
  if (notification.data?.taskProgressId) {
    friendStore.giftMoneyToFriend(notification.data.taskProgressId)
  }
}

function handleNotificationAction(notification: FriendNotification) {
  handleMarkAsRead(notification.id)

  if (notification.type === 'invite' && notification.data?.inviteId) {
    friendStore.acceptFriendInvite(notification.data.inviteId)
  } else if (notification.type === 'reward_available' && notification.data?.taskProgressId) {
    friendStore.claimMutualTaskReward(notification.data.taskProgressId)
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
            <Heart class="w-5 h-5 text-pink-400" />
            <h2 class="text-xl font-bold text-white">好友消息</h2>
            <span
              v-if="friendStore.unreadNotificationCount > 0"
              class="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white"
            >
              {{ friendStore.unreadNotificationCount }}
            </span>
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
            v-for="(label, type) in typeLabels"
            :key="type"
            @click="filterType = type as any"
            class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            :class="filterType === type
              ? 'bg-pink-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'"
          >
            {{ label }}
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
            <p>暂无好友消息</p>
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
                <component :is="typeIcons[notification.type] || Bell" class="w-5 h-5" />
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                  <h4 class="font-medium text-white truncate">{{ notification.title }}</h4>
                  <span class="text-xs text-gray-500 flex-shrink-0">{{ formatTime(notification.createdAt) }}</span>
                </div>
                <p class="text-sm text-gray-400 mt-1">{{ notification.message }}</p>

                <div class="flex items-center gap-2 mt-3">
                  <div class="flex items-center gap-1 text-xs text-gray-500">
                    <span class="text-lg">{{ notification.fromPlayerAvatar }}</span>
                    <span>{{ notification.fromPlayerName }}</span>
                  </div>

                  <div class="flex-1"></div>

                  <button
                    v-if="notification.type === 'invite' && notification.data?.inviteId"
                    @click.stop="handleNotificationAction(notification)"
                    class="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 rounded text-xs text-white font-medium transition-colors"
                  >
                    接受
                  </button>

                  <template v-if="notification.type === 'task_request' && notification.data?.taskProgressId">
                    <button
                      @click.stop="handleAcceptTaskRequest(notification)"
                      class="px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-xs text-white font-medium transition-colors flex items-center gap-1"
                    >
                      <Check class="w-3 h-3" />
                      接受
                    </button>
                    <button
                      @click.stop="handleRejectTaskRequest(notification)"
                      class="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-xs text-white font-medium transition-colors flex items-center gap-1"
                    >
                      <X class="w-3 h-3" />
                      拒绝
                    </button>
                  </template>

                  <button
                    v-if="notification.type === 'help_needed' && notification.data?.taskProgressId"
                    @click.stop="handleGiftMoney(notification)"
                    class="px-3 py-1 bg-amber-600 hover:bg-amber-500 rounded text-xs text-white font-medium transition-colors flex items-center gap-1"
                  >
                    <Gift class="w-3 h-3" />
                    赠送
                  </button>

                  <button
                    v-if="notification.type === 'reward_available' && notification.data?.taskProgressId"
                    @click.stop="handleNotificationAction(notification)"
                    class="px-3 py-1 bg-amber-600 hover:bg-amber-500 rounded text-xs text-white font-medium transition-colors flex items-center gap-1"
                  >
                    <Gift class="w-3 h-3" />
                    领取
                  </button>
                </div>
              </div>

              <div v-if="!notification.read" class="w-2 h-2 rounded-full bg-pink-500 flex-shrink-0 mt-2"></div>
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
