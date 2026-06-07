<script setup lang="ts">
import { computed, ref } from 'vue'
import type { SeasonTask, TaskProgress } from '@/types/season'
import { useSeasonStore } from '@/stores/seasonStore'
import { getRewardById } from '@/game/data/seasonRewards'
import {
  Sparkles,
  ClipboardList,
  CheckCircle2,
  Sun,
  Coins,
  Wand2,
  Package,
  Trophy,
  Calendar,
  Crown,
  Star,
  Heart,
  Gem,
  Gift,
  Check,
  Zap,
} from 'lucide-vue-next'

const props = defineProps<{
  task: SeasonTask
  progress?: TaskProgress
}>()

const seasonStore = useSeasonStore()
const isClaiming = ref(false)

const iconMap: Record<string, any> = {
  Sparkles,
  ClipboardList,
  CheckCircle2,
  Sun,
  Coins,
  Wand2,
  Package,
  Trophy,
  Calendar,
  Crown,
  Star,
  Heart,
  Gem,
}

const TaskIcon = computed(() => iconMap[props.task.icon] || Sparkles)

const progressPercent = computed(() => {
  if (!props.progress) return 0
  return Math.min(100, (props.progress.progress / props.task.target) * 100)
})

const isCompleted = computed(() => props.progress?.completed || false)
const isClaimed = computed(() => props.progress?.claimed || false)

const extraReward = computed(() => {
  if (props.task.rewardId) {
    return getRewardById(props.task.rewardId)
  }
  return null
})

const rarityColors: Record<string, string> = {
  common: 'from-gray-500 to-gray-600',
  uncommon: 'from-green-500 to-emerald-600',
  rare: 'from-blue-500 to-cyan-600',
  epic: 'from-purple-500 to-pink-600',
  legendary: 'from-amber-500 to-orange-600',
}

async function handleClaim() {
  if (isClaiming.value || !isCompleted.value || isClaimed.value) return

  isClaiming.value = true
  await new Promise((resolve) => setTimeout(resolve, 500))

  seasonStore.claimTaskReward(props.task.id)
  isClaiming.value = false
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}
</script>

<template>
  <div
    class="task-card relative p-5 rounded-2xl transition-all duration-500"
    :class="{
      'bg-gradient-to-r from-green-900/30 to-emerald-900/20 border-2 border-green-500/40': isCompleted && !isClaimed,
      'bg-gray-800/30 border border-gray-700/50 opacity-60': isClaimed,
      'bg-gray-900/60 border border-gray-800 hover:border-purple-500/30': !isCompleted,
    }"
  >
    <div class="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
      <div
        v-if="isCompleted && !isClaimed"
        class="absolute inset-0 bg-gradient-to-r from-green-500/10 via-transparent to-green-500/10 animate-pulse-slow"
      ></div>
    </div>

    <div class="relative z-10 flex items-center gap-5">
      <div
        class="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300"
        :class="{
          'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30': isCompleted,
          'bg-gradient-to-br from-purple-600 to-violet-700': task.type === 'daily' && !isCompleted,
          'bg-gradient-to-br from-blue-600 to-cyan-700': task.type === 'weekly' && !isCompleted,
          'bg-gradient-to-br from-amber-600 to-orange-700': task.type === 'challenge' && !isCompleted,
        }"
      >
        <component :is="TaskIcon" :size="30" class="text-white" />
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-3 mb-2">
          <h3 class="text-lg font-bold text-white truncate">{{ task.title }}</h3>
          <span
            class="px-2.5 py-0.5 rounded-full text-xs font-medium"
            :class="{
              'bg-blue-500/20 text-blue-300 border border-blue-500/30': task.type === 'daily',
              'bg-purple-500/20 text-purple-300 border border-purple-500/30': task.type === 'weekly',
              'bg-amber-500/20 text-amber-300 border border-amber-500/30': task.type === 'challenge',
            }"
          >
            {{ task.type === 'daily' ? '每日' : task.type === 'weekly' ? '每周' : '挑战' }}
          </span>
          <span v-if="isClaimed" class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-600/30 text-gray-400 border border-gray-600/30">
            已领取
          </span>
        </div>

        <p class="text-gray-400 text-sm mb-3">{{ task.description }}</p>

        <div class="flex items-center gap-4">
          <div class="flex-1">
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-sm text-gray-500">任务进度</span>
              <span class="text-sm font-medium" :class="isCompleted ? 'text-green-400' : 'text-gray-300'">
                {{ progress?.progress || 0 }} / {{ task.target }} {{ task.unit }}
              </span>
            </div>
            <div class="h-2.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-700 ease-out"
                :class="{
                  'bg-gradient-to-r from-green-500 to-emerald-400': isCompleted,
                  'bg-gradient-to-r from-purple-500 to-pink-500': !isCompleted,
                }"
                :style="{ width: progressPercent + '%' }"
              >
                <div v-if="!isCompleted && progressPercent > 0" class="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col items-end gap-3 flex-shrink-0">
        <div class="flex items-center gap-2 px-4 py-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
          <Zap :size="18" class="text-amber-400" />
          <span class="text-amber-300 font-bold">+{{ formatNumber(task.expReward) }}</span>
          <span class="text-amber-500/70 text-sm">EXP</span>
        </div>

        <div v-if="extraReward" class="flex items-center gap-2">
          <div
            class="w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center"
            :class="rarityColors[extraReward.rarity]"
          >
            <Gift :size="16" class="text-white" />
          </div>
          <span class="text-sm text-gray-400">{{ extraReward.name }}</span>
        </div>

        <button
          v-if="isCompleted && !isClaimed"
          @click="handleClaim"
          :disabled="isClaiming"
          class="task-claim-btn relative px-6 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-green-500/30 active:scale-95 disabled:opacity-50"
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

        <div v-else-if="isClaimed" class="px-6 py-2.5 rounded-xl bg-gray-700/30 text-gray-500 font-medium text-sm">
          已领取
        </div>

        <div v-else class="px-6 py-2.5 rounded-xl bg-gray-800/50 text-gray-500 font-medium text-sm">
          进行中
        </div>
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
  background: linear-gradient(135deg, transparent 40%, rgba(139, 92, 246, 0.3) 50%, transparent 60%);
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
