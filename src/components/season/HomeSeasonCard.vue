<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSeasonStore } from '@/stores/seasonStore'
import { Trophy, ListTodo, Gift, ChevronUp, ChevronDown, Zap, Bell } from 'lucide-vue-next'

const router = useRouter()
const seasonStore = useSeasonStore()
const isExpanded = ref(false)
const hasInit = ref(false)

let countdownInterval: number | null = null

const latestTask = computed(() => {
  const dailyTasks = seasonStore.dailyTasks
  for (const task of dailyTasks) {
    const progress = seasonStore.getTaskProgress(task.id)
    if (progress && !progress.completed) {
      return { task, progress }
    }
  }
  return null
})

const completedTasks = computed(() => {
  return seasonStore.dailyTasks.filter((t) => {
    const p = seasonStore.getTaskProgress(t.id)
    return p?.completed && !p.claimed
  })
})

function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

function goToSeason(tab?: string) {
  router.push({ path: '/season', query: tab ? { tab } : undefined })
}

function formatCountdown() {
  const t = seasonStore.timeRemaining
  if (t.days > 0) {
    return `${t.days}天${String(t.hours).padStart(2, '0')}:${String(t.minutes).padStart(2, '0')}`
  }
  return `${String(t.hours).padStart(2, '0')}:${String(t.minutes).padStart(2, '0')}:${String(t.seconds).padStart(2, '0')}`
}

onMounted(() => {
  if (!hasInit.value) {
    seasonStore.initSeason()
    hasInit.value = true
  }

  countdownInterval = window.setInterval(() => {}, 1000)
})

onUnmounted(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval)
  }
})
</script>

<template>
  <div
    v-if="seasonStore.isSeasonActive"
    class="home-season-card fixed bottom-6 right-6 z-40"
  >
    <Transition name="slide-up">
      <div
        v-if="isExpanded"
        class="absolute bottom-20 right-0 w-80 rounded-2xl bg-gray-900/95 backdrop-blur-xl border border-purple-500/30 shadow-2xl shadow-purple-500/20 overflow-hidden"
      >
        <div class="p-5 border-b border-gray-800">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-red-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Trophy :size="24" class="text-white" />
              </div>
              <div>
                <h3 class="font-bold text-white">{{ seasonStore.currentSeason?.name }}</h3>
                <p class="text-xs text-gray-500">{{ seasonStore.currentSeason?.theme }}</p>
              </div>
            </div>
            <div class="text-right">
              <div class="text-xs text-gray-500">剩余时间</div>
              <div class="font-mono text-amber-400 font-bold">{{ formatCountdown() }}</div>
            </div>
          </div>

          <div class="mb-3">
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-sm text-gray-400 flex items-center gap-1">
                <Zap :size="14" class="text-purple-400" />
                等级 {{ seasonStore.playerSeason?.level || 1 }}
              </span>
              <span class="text-sm text-purple-400 font-bold">{{ seasonStore.expProgress.toFixed(0) }}%</span>
            </div>
            <div class="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-purple-500 to-red-500 rounded-full transition-all duration-500"
                :style="{ width: seasonStore.expProgress + '%' }"
              ></div>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2">
            <div class="text-center p-2 rounded-lg bg-gray-800/50">
              <div class="text-xs text-gray-500">累计经验</div>
              <div class="text-amber-400 font-bold text-sm">{{ seasonStore.playerSeason?.totalExp?.toLocaleString() || 0 }}</div>
            </div>
            <div class="text-center p-2 rounded-lg bg-gray-800/50">
              <div class="text-xs text-gray-500">完成任务</div>
              <div class="text-green-400 font-bold text-sm">{{ seasonStore.completedTasksCount }}</div>
            </div>
            <div class="text-center p-2 rounded-lg bg-gray-800/50">
              <div class="text-xs text-gray-500">当前排名</div>
              <div class="text-purple-400 font-bold text-sm">{{ seasonStore.playerRank > 0 ? '#' + seasonStore.playerRank : '-' }}</div>
            </div>
          </div>
        </div>

        <div v-if="completedTasks.length > 0" class="p-4 bg-amber-500/10 border-b border-amber-500/20">
          <div class="flex items-center gap-2 mb-2">
            <Bell :size="16" class="text-amber-400 animate-pulse" />
            <span class="text-sm font-medium text-amber-300">可领取奖励 ({{ completedTasks.length }})</span>
          </div>
          <button
            @click="goToSeason('tasks')"
            class="w-full py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm hover:shadow-lg hover:shadow-amber-500/30 transition-all active:scale-95"
          >
            前往领取
          </button>
        </div>

        <div v-if="latestTask" class="p-4 border-b border-gray-800">
          <div class="flex items-center gap-2 mb-2">
            <ListTodo :size="16" class="text-blue-400" />
            <span class="text-sm font-medium text-gray-300">进行中任务</span>
          </div>
          <div class="p-3 rounded-lg bg-gray-800/50">
            <div class="text-sm text-white mb-2">{{ latestTask.task.title }}</div>
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs text-gray-500">进度</span>
              <span class="text-xs text-blue-400 font-medium">{{ latestTask.progress?.progress || 0 }}/{{ latestTask.task.target }}</span>
            </div>
            <div class="h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                :style="{ width: ((latestTask.progress?.progress || 0) / latestTask.task.target * 100) + '%' }"
              ></div>
            </div>
          </div>
        </div>

        <div class="p-4">
          <div class="grid grid-cols-3 gap-2">
            <button
              @click="goToSeason('tasks')"
              class="flex flex-col items-center gap-1 p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors group"
            >
              <div class="relative">
                <ListTodo :size="20" class="text-blue-400 group-hover:scale-110 transition-transform" />
                <span
                  v-if="seasonStore.unclaimedCount > 0"
                  class="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center"
                >
                  {{ seasonStore.unclaimedCount }}
                </span>
              </div>
              <span class="text-xs text-gray-400">任务</span>
            </button>
            <button
              @click="goToSeason('rewards')"
              class="flex flex-col items-center gap-1 p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors group"
            >
              <Gift :size="20" class="text-amber-400 group-hover:scale-110 transition-transform" />
              <span class="text-xs text-gray-400">奖励</span>
            </button>
            <button
              @click="goToSeason('leaderboard')"
              class="flex flex-col items-center gap-1 p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors group"
            >
              <Trophy :size="20" class="text-purple-400 group-hover:scale-110 transition-transform" />
              <span class="text-xs text-gray-400">排行</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <button
      @click="toggleExpand"
      class="season-toggle-btn relative w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-red-600 shadow-2xl shadow-purple-500/40 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
    >
      <div
        v-if="seasonStore.unclaimedCount > 0"
        class="absolute -top-1 -right-1 min-w-[24px] h-6 px-2 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center animate-bounce"
      >
        {{ seasonStore.unclaimedCount }}
      </div>

      <Transition name="rotate" mode="out-in">
        <ChevronUp v-if="isExpanded" :size="28" class="text-white" :key="'up'" />
        <Trophy v-else :size="28" class="text-white" :key="'trophy'" />
      </Transition>

      <div class="absolute inset-0 rounded-2xl border-2 border-purple-400/30 animate-ping-slow"></div>
    </button>
  </div>
</template>

<style scoped>
.season-toggle-btn {
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

.animate-bounce {
  animation: bounce 1s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
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
</style>
