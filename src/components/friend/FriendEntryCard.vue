<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFriendStore } from '@/stores/friendStore'
import { Users, Heart, Star, ChevronUp, ChevronDown, Bell, ListTodo, UserPlus, Zap } from 'lucide-vue-next'

const router = useRouter()
const friendStore = useFriendStore()
const isExpanded = ref(false)
const hasInit = ref(false)

const latestNotification = computed(() => {
  return friendStore.unreadNotifications[0] || null
})

const pendingInviteCount = computed(() => friendStore.pendingInviteCount)
const activeTaskCount = computed(() => friendStore.activeTaskCount)
const unclaimedRewardCount = computed(() => friendStore.unclaimedRewardCount)

function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

function goToFriends(tab?: string) {
  router.push({ path: '/friends', query: tab ? { tab } : undefined })
}

function formatCountdown(expiresAt: number): string {
  const diff = expiresAt - Date.now()
  if (diff <= 0) return '已过期'
  const minutes = Math.floor(diff / (60 * 1000))
  if (minutes < 60) return `${minutes}分钟`
  return `${Math.floor(minutes / 60)}小时`
}

onMounted(() => {
  if (!hasInit.value) {
    friendStore.initFriendSystem()
    hasInit.value = true
  }
})
</script>

<template>
  <div class="friend-entry-card fixed bottom-6 left-6 z-40">
    <Transition name="slide-up">
      <div
        v-if="isExpanded"
        class="absolute bottom-20 left-0 w-80 rounded-2xl bg-gray-900/95 backdrop-blur-xl border border-pink-500/30 shadow-2xl shadow-pink-500/20 overflow-hidden"
      >
        <div class="p-5 border-b border-gray-800">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-500/30">
                <Users :size="24" class="text-white" />
              </div>
              <div>
                <h3 class="font-bold text-white">好友协作</h3>
                <p class="text-xs text-gray-500">互助共赢，共同成长</p>
              </div>
            </div>
            <div class="text-right">
              <div class="text-xs text-gray-500">好友数量</div>
              <div class="font-bold text-pink-400">
                {{ friendStore.statistics.onlineFriends }}/{{ friendStore.statistics.totalFriends }}
              </div>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2">
            <div class="text-center p-2 rounded-lg bg-gray-800/50">
              <div class="text-xs text-gray-500">待处理邀请</div>
              <div class="text-amber-400 font-bold text-sm">{{ pendingInviteCount }}</div>
            </div>
            <div class="text-center p-2 rounded-lg bg-gray-800/50">
              <div class="text-xs text-gray-500">进行中任务</div>
              <div class="text-blue-400 font-bold text-sm">{{ activeTaskCount }}</div>
            </div>
            <div class="text-center p-2 rounded-lg bg-gray-800/50">
              <div class="text-xs text-gray-500">待领取奖励</div>
              <div class="text-green-400 font-bold text-sm">{{ unclaimedRewardCount }}</div>
            </div>
          </div>
        </div>

        <div v-if="pendingInviteCount > 0" class="p-4 bg-amber-500/10 border-b border-amber-500/20">
          <div class="flex items-center gap-2 mb-2">
            <UserPlus :size="16" class="text-amber-400 animate-pulse" />
            <span class="text-sm font-medium text-amber-300">{{ pendingInviteCount }} 个好友邀请待处理</span>
          </div>
          <button
            @click="goToFriends('invites')"
            class="w-full py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm hover:shadow-lg hover:shadow-amber-500/30 transition-all active:scale-95"
          >
            立即处理
          </button>
        </div>

        <div v-if="unclaimedRewardCount > 0" class="p-4 bg-green-500/10 border-b border-green-500/20">
          <div class="flex items-center gap-2 mb-2">
            <Zap :size="16" class="text-green-400 animate-pulse" />
            <span class="text-sm font-medium text-green-300">{{ unclaimedRewardCount }} 个互助奖励待领取</span>
          </div>
          <button
            @click="goToFriends('tasks')"
            class="w-full py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-sm hover:shadow-lg hover:shadow-green-500/30 transition-all active:scale-95"
          >
            前往领取
          </button>
        </div>

        <div v-if="latestNotification" class="p-4 border-b border-gray-800">
          <div class="flex items-center gap-2 mb-2">
            <Bell :size="16" class="text-pink-400" />
            <span class="text-sm font-medium text-gray-300">最新消息</span>
          </div>
          <div class="p-3 rounded-lg bg-gray-800/50">
            <div class="text-sm text-white mb-1">{{ latestNotification.title }}</div>
            <div class="text-xs text-gray-500 line-clamp-2">{{ latestNotification.message }}</div>
          </div>
        </div>

        <div class="p-4">
          <div class="grid grid-cols-4 gap-2">
            <button
              @click="goToFriends('list')"
              class="flex flex-col items-center gap-1 p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors group"
            >
              <div class="relative">
                <Users :size="20" class="text-pink-400 group-hover:scale-110 transition-transform" />
              </div>
              <span class="text-xs text-gray-400">好友</span>
            </button>
            <button
              @click="goToFriends('invites')"
              class="flex flex-col items-center gap-1 p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors group"
            >
              <div class="relative">
                <UserPlus :size="20" class="text-cyan-400 group-hover:scale-110 transition-transform" />
                <span
                  v-if="pendingInviteCount > 0"
                  class="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center"
                >
                  {{ pendingInviteCount }}
                </span>
              </div>
              <span class="text-xs text-gray-400">邀请</span>
            </button>
            <button
              @click="goToFriends('tasks')"
              class="flex flex-col items-center gap-1 p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors group"
            >
              <div class="relative">
                <ListTodo :size="20" class="text-green-400 group-hover:scale-110 transition-transform" />
                <span
                  v-if="unclaimedRewardCount > 0"
                  class="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center"
                >
                  {{ unclaimedRewardCount }}
                </span>
              </div>
              <span class="text-xs text-gray-400">任务</span>
            </button>
            <button
              @click="goToFriends('rewards')"
              class="flex flex-col items-center gap-1 p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors group"
            >
              <Star :size="20" class="text-amber-400 group-hover:scale-110 transition-transform" />
              <span class="text-xs text-gray-400">奖励</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <button
      @click="toggleExpand"
      class="friend-entry-btn friend-toggle-btn relative w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-600 to-rose-600 shadow-2xl shadow-pink-500/40 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
    >
      <div
        v-if="friendStore.totalUnreadCount > 0"
        class="absolute -top-1 -right-1 min-w-[24px] h-6 px-2 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center animate-bounce"
      >
        {{ friendStore.totalUnreadCount }}
      </div>

      <Transition name="rotate" mode="out-in">
        <ChevronUp v-if="isExpanded" :size="28" class="text-white" :key="'up'" />
        <Heart v-else :size="28" class="text-white" :key="'heart'" />
      </Transition>

      <div class="absolute inset-0 rounded-2xl border-2 border-pink-400/30 animate-ping-slow"></div>
    </button>
  </div>
</template>

<style scoped>
.friend-toggle-btn {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

@keyframes ping-slow {
  0%, 100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 0;
    transform: scale(1.15);
  }
}

.animate-ping-slow {
  animation: ping-slow 2s ease-in-out infinite;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.rotate-enter-active,
.rotate-leave-active {
  transition: all 0.3s ease;
}

.rotate-enter-from {
  opacity: 0;
  transform: rotate(-180deg) scale(0.5);
}

.rotate-leave-to {
  opacity: 0;
  transform: rotate(180deg) scale(0.5);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
