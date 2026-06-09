<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTaskStore } from '@/stores/taskStore'
import {
  Calendar,
  Clock,
  Check,
  Zap,
  Sparkles,
  ClipboardList,
  Trophy,
  Coins,
  Heart,
  Shield,
  Crown,
  Star,
} from 'lucide-vue-next'

const taskStore = useTaskStore()
const isClaiming = ref(false)

const iconMap: Record<string, any> = {
  Calendar,
  Clock,
  Check,
  Zap,
  Sparkles,
  ClipboardList,
  Trophy,
  Coins,
  Heart,
  Shield,
  Crown,
  Star,
}

const countdown = computed(() => taskStore.getWeeklyResetCountdown())

const countdownText = computed(() => {
  const { days, hours, minutes } = countdown.value
  return `${days}天 ${hours}时 ${minutes}分`
})

const overallPercent = computed(() => {
  const total = taskStore.totalWeeklyTasks
  if (total === 0) return 0
  return Math.min(100, (taskStore.completedWeeklyCount / total) * 100)
})

const difficultyStyle: Record<string, { bg: string; text: string; border: string }> = {
  easy: { bg: 'bg-green-500/20', text: 'text-green-300', border: 'border-green-500/30' },
  medium: { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30' },
  hard: { bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500/30' },
}

const difficultyLabel: Record<string, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
}

function getProgress(taskId: string) {
  return taskStore.getWeeklyTaskProgress(taskId)
}

function getProgressPercent(taskId: string) {
  const progress = getProgress(taskId)
  const task = taskStore.weeklyTaskList.find(t => t.id === taskId)
  if (!progress || !task) return 0
  return Math.min(100, (progress.progress / task.target) * 100)
}

async function handleClaim(taskId: string) {
  if (isClaiming.value) return
  isClaiming.value = true
  await new Promise((resolve) => setTimeout(resolve, 500))
  taskStore.claimWeeklyTask(taskId)
  isClaiming.value = false
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-white flex items-center gap-3">
          <Calendar :size="28" class="text-purple-400" />
          周常任务
        </h2>
        <div class="flex items-center gap-2 mt-1.5">
          <Clock :size="16" class="text-gray-500" />
          <span class="text-gray-500 text-sm">重置倒计时：{{ countdownText }}</span>
        </div>
      </div>
      <div class="flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-xl border border-gray-700/50">
        <Trophy :size="18" class="text-amber-400" />
        <span class="text-white font-bold">{{ taskStore.completedWeeklyCount }}</span>
        <span class="text-gray-500">/</span>
        <span class="text-gray-400">{{ taskStore.totalWeeklyTasks }}</span>
      </div>
    </div>

    <div class="relative h-3 bg-gray-800 rounded-full overflow-hidden">
      <div
        class="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-purple-500 to-blue-500"
        :style="{ width: overallPercent + '%' }"
      >
        <div class="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
      </div>
    </div>

    <div class="space-y-4">
      <div
        v-for="task in taskStore.weeklyTaskList"
        :key="task.id"
        class="task-card relative p-5 rounded-2xl transition-all duration-500"
        :class="{
          'bg-gradient-to-r from-green-900/30 to-emerald-900/20 border-2 border-green-500/40': getProgress(task.id)?.completed && !getProgress(task.id)?.claimed,
          'bg-gray-800/30 border border-gray-700/50 opacity-60': getProgress(task.id)?.claimed,
          'bg-gray-900/60 border border-gray-800 hover:border-blue-500/30': !getProgress(task.id)?.completed,
        }"
      >
        <div class="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div
            v-if="getProgress(task.id)?.completed && !getProgress(task.id)?.claimed"
            class="absolute inset-0 bg-gradient-to-r from-green-500/10 via-transparent to-green-500/10 animate-pulse-slow"
          ></div>
        </div>

        <div class="relative z-10">
          <div class="flex items-start gap-4">
            <div
              class="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300"
              :class="{
                'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30': getProgress(task.id)?.completed,
                'bg-gradient-to-br from-blue-600 to-cyan-700': !getProgress(task.id)?.completed,
              }"
            >
              <component :is="iconMap[task.icon] || Sparkles" :size="26" class="text-white" />
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap mb-1.5">
                <h3 class="text-lg font-bold text-white truncate">{{ task.title }}</h3>
                <span
                  class="px-2 py-0.5 rounded-full text-xs font-medium border"
                  :class="[difficultyStyle[task.difficulty]?.bg, difficultyStyle[task.difficulty]?.text, difficultyStyle[task.difficulty]?.border]"
                >
                  {{ difficultyLabel[task.difficulty] }}
                </span>
                <span
                  v-if="getProgress(task.id)?.claimed"
                  class="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-600/30 text-gray-400 border border-gray-600/30"
                >
                  已领取
                </span>
              </div>

              <p class="text-gray-400 text-sm mb-3">{{ task.description }}</p>

              <div class="flex items-center gap-2 flex-wrap mb-3">
                <div class="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <Zap :size="14" class="text-amber-400" />
                  <span class="text-amber-300 text-xs font-bold">+{{ task.expReward }}</span>
                  <span class="text-amber-500/70 text-xs">EXP</span>
                </div>
                <div class="flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <Coins :size="14" class="text-purple-400" />
                  <span class="text-purple-300 text-xs font-bold">+{{ task.rewardPoolContribution }}</span>
                  <span class="text-purple-500/70 text-xs">奖励池</span>
                </div>
              </div>

              <div class="flex items-center gap-2 flex-wrap mb-3" v-if="task.linkedSeasonTaskIds?.length || task.linkedMutualBehaviorTypes?.length">
                <span
                  v-if="task.linkedSeasonTaskIds?.length"
                  class="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/15 text-blue-300 border border-blue-500/25"
                >
                  联动赛季
                </span>
                <span
                  v-if="task.linkedMutualBehaviorTypes?.length"
                  class="px-2 py-0.5 rounded-full text-xs font-medium bg-pink-500/15 text-pink-300 border border-pink-500/25"
                >
                  联动互助
                </span>
              </div>

              <div class="flex-1">
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-sm text-gray-500">任务进度</span>
                  <span
                    class="text-sm font-medium"
                    :class="getProgress(task.id)?.completed ? 'text-green-400' : 'text-gray-300'"
                  >
                    {{ getProgress(task.id)?.progress || 0 }} / {{ task.target }} {{ task.unit }}
                  </span>
                </div>
                <div class="h-2.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-700 ease-out"
                    :class="{
                      'bg-gradient-to-r from-green-500 to-emerald-400': getProgress(task.id)?.completed,
                      'bg-gradient-to-r from-blue-500 to-purple-500': !getProgress(task.id)?.completed,
                    }"
                    :style="{ width: getProgressPercent(task.id) + '%' }"
                  >
                    <div
                      v-if="!getProgress(task.id)?.completed && getProgressPercent(task.id) > 0"
                      class="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex-shrink-0 self-center">
              <button
                v-if="getProgress(task.id)?.completed && !getProgress(task.id)?.claimed"
                @click="handleClaim(task.id)"
                :disabled="isClaiming"
                class="task-claim-btn relative px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-green-500/30 active:scale-95 disabled:opacity-50"
              >
                <span v-if="isClaiming" class="flex items-center gap-2">
                  <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  领取中
                </span>
                <span v-else class="flex items-center gap-2">
                  <Check :size="16" />
                  领取奖励
                </span>
              </button>

              <div
                v-else-if="getProgress(task.id)?.claimed"
                class="px-5 py-2.5 rounded-xl bg-gray-700/30 text-gray-500 font-medium text-sm"
              >
                已领取
              </div>

              <div
                v-else
                class="px-5 py-2.5 rounded-xl bg-gray-800/50 text-gray-500 font-medium text-sm"
              >
                进行中
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="taskStore.weeklyTaskList.length === 0" class="text-center py-16">
        <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-800/50 flex items-center justify-center">
          <ClipboardList :size="40" class="text-gray-600" />
        </div>
        <p class="text-gray-500">暂无周常任务</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.task-card {
  position: relative;
}

.task-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, transparent 40%, rgba(96, 165, 250, 0.3) 50%, transparent 60%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.3s;
}

.task-card:hover::after {
  opacity: 1;
}

.task-claim-btn {
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(16, 185, 129, 0.5);
  }
}

.animate-shimmer {
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.animate-pulse-slow {
  animation: pulse-slow 3s ease-in-out infinite;
}

@keyframes pulse-slow {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
</style>
