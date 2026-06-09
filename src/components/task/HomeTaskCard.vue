<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTaskStore } from '@/stores/taskStore'
import { useSeasonStore } from '@/stores/seasonStore'
import { Calendar, TrendingUp, Gift, ChevronUp, ChevronDown, Zap, Bell, Target, Star } from 'lucide-vue-next'

const router = useRouter()
const taskStore = useTaskStore()
const seasonStore = useSeasonStore()
const isExpanded = ref(false)
const hasInit = ref(false)

let refreshInterval: number | null = null

const weeklySummary = computed(() => taskStore.getWeeklyTaskSummary())
const growthSummary = computed(() => taskStore.getGrowthTaskSummary())
const resetCountdown = computed(() => taskStore.getWeeklyResetCountdown())

const unclaimedTotal = computed(() => taskStore.totalUnclaimedCount)

const weeklyProgressPercent = computed(() => {
  const s = weeklySummary.value
  return s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0
})

const latestUnclaimedWeekly = computed(() => {
  for (const task of taskStore.weeklyTaskList) {
    const p = taskStore.getWeeklyTaskProgress(task.id)
    if (p?.completed && !p.claimed) return task
  }
  return null
})

const latestUnclaimedGrowth = computed(() => {
  for (const task of taskStore.growthTaskList) {
    const p = taskStore.getGrowthTaskProgress(task.id)
    if (p?.completed && !p.claimed) return task
  }
  return null
})

function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

function goToTaskPage(tab?: string) {
  router.push({ path: '/season', query: tab ? { tab } : undefined })
}

function formatResetCountdown() {
  const c = resetCountdown.value
  if (c.days > 0) return `${c.days}天${c.hours}时`
  return `${c.hours}时${c.minutes}分`
}

onMounted(() => {
  if (!hasInit.value) {
    taskStore.initTaskCenter()
    hasInit.value = true
  }
  refreshInterval = window.setInterval(() => {}, 30000)
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
})
</script>

<template>
  <div class="home-task-card fixed bottom-6 left-24 z-40">
    <Transition name="slide-up">
      <div
        v-if="isExpanded"
        class="absolute bottom-20 left-0 w-80 rounded-2xl bg-gray-900/95 backdrop-blur-xl border border-emerald-500/30 shadow-2xl shadow-emerald-500/20 overflow-hidden"
      >
        <div class="p-5 border-b border-gray-800">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Target :size="24" class="text-white" />
              </div>
              <div>
                <h3 class="font-bold text-white">任务中心</h3>
                <p class="text-xs text-gray-500">周常 · 成长 · 奖励池</p>
              </div>
            </div>
            <div class="text-right">
              <div class="text-xs text-gray-500">重置倒计时</div>
              <div class="font-mono text-emerald-400 font-bold text-sm">{{ formatResetCountdown() }}</div>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2">
            <div class="text-center p-2 rounded-lg bg-gray-800/50">
              <div class="text-xs text-gray-500">周常进度</div>
              <div class="text-emerald-400 font-bold text-sm">{{ weeklySummary.completed }}/{{ weeklySummary.total }}</div>
            </div>
            <div class="text-center p-2 rounded-lg bg-gray-800/50">
              <div class="text-xs text-gray-500">成长完成</div>
              <div class="text-purple-400 font-bold text-sm">{{ growthSummary.completed }}/{{ growthSummary.total }}</div>
            </div>
            <div class="text-center p-2 rounded-lg bg-gray-800/50">
              <div class="text-xs text-gray-500">奖励池</div>
              <div class="text-amber-400 font-bold text-sm">{{ weeklySummary.poolPoints }}</div>
            </div>
          </div>
        </div>

        <div v-if="unclaimedTotal > 0" class="p-4 bg-emerald-500/10 border-b border-emerald-500/20">
          <div class="flex items-center gap-2 mb-2">
            <Gift :size="16" class="text-emerald-400 animate-pulse" />
            <span class="text-sm font-medium text-emerald-300">{{ unclaimedTotal }} 个奖励待领取</span>
          </div>
          <button
            @click="goToTaskPage('weekly_tasks')"
            class="w-full py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm hover:shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-95"
          >
            前往领取
          </button>
        </div>

        <div v-if="latestUnclaimedWeekly" class="p-4 border-b border-gray-800">
          <div class="flex items-center gap-2 mb-2">
            <Calendar :size="16" class="text-emerald-400" />
            <span class="text-sm font-medium text-gray-300">周常待领</span>
          </div>
          <div class="p-3 rounded-lg bg-gray-800/50">
            <div class="text-sm text-white mb-1">{{ latestUnclaimedWeekly.title }}</div>
            <div class="text-xs text-emerald-400">+{{ latestUnclaimedWeekly.expReward }} EXP · +{{ latestUnclaimedWeekly.rewardPoolContribution }} 奖励池</div>
          </div>
        </div>

        <div v-if="latestUnclaimedGrowth" class="p-4 border-b border-gray-800">
          <div class="flex items-center gap-2 mb-2">
            <TrendingUp :size="16" class="text-purple-400" />
            <span class="text-sm font-medium text-gray-300">成长待领</span>
          </div>
          <div class="p-3 rounded-lg bg-gray-800/50">
            <div class="text-sm text-white mb-1">{{ latestUnclaimedGrowth.title }}</div>
            <div class="text-xs text-purple-400">+{{ latestUnclaimedGrowth.expReward }} EXP · +{{ latestUnclaimedGrowth.rewardPoolContribution }} 奖励池</div>
          </div>
        </div>

        <div class="p-4">
          <div class="grid grid-cols-3 gap-2">
            <button
              @click="goToTaskPage('weekly_tasks')"
              class="flex flex-col items-center gap-1 p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors group"
            >
              <div class="relative">
                <Calendar :size="20" class="text-emerald-400 group-hover:scale-110 transition-transform" />
                <span
                  v-if="taskStore.unclaimedWeeklyCount > 0"
                  class="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center"
                >
                  {{ taskStore.unclaimedWeeklyCount }}
                </span>
              </div>
              <span class="text-xs text-gray-400">周常</span>
            </button>
            <button
              @click="goToTaskPage('growth_tasks')"
              class="flex flex-col items-center gap-1 p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors group"
            >
              <div class="relative">
                <TrendingUp :size="20" class="text-purple-400 group-hover:scale-110 transition-transform" />
                <span
                  v-if="taskStore.unclaimedGrowthCount > 0"
                  class="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center"
                >
                  {{ taskStore.unclaimedGrowthCount }}
                </span>
              </div>
              <span class="text-xs text-gray-400">成长</span>
            </button>
            <button
              @click="goToTaskPage('reward_pool')"
              class="flex flex-col items-center gap-1 p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors group"
            >
              <div class="relative">
                <Star :size="20" class="text-amber-400 group-hover:scale-110 transition-transform" />
                <span
                  v-if="taskStore.unclaimedPoolTierCount > 0"
                  class="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center"
                >
                  {{ taskStore.unclaimedPoolTierCount }}
                </span>
              </div>
              <span class="text-xs text-gray-400">奖励池</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <button
      @click="toggleExpand"
      class="task-entry-btn task-toggle-btn relative w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 shadow-2xl shadow-emerald-500/40 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
    >
      <div
        v-if="unclaimedTotal > 0"
        class="absolute -top-1 -right-1 min-w-[24px] h-6 px-2 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center animate-bounce"
      >
        {{ unclaimedTotal }}
      </div>

      <Transition name="rotate" mode="out-in">
        <ChevronUp v-if="isExpanded" :size="28" class="text-white" :key="'up'" />
        <Target v-else :size="28" class="text-white" :key="'target'" />
      </Transition>

      <div class="absolute inset-0 rounded-2xl border-2 border-emerald-400/30 animate-ping-slow"></div>
    </button>
  </div>
</template>

<style scoped>
.task-toggle-btn {
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
