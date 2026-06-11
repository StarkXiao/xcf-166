<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useTaskStore } from '@/stores/taskStore'
import { getGrowthTasksByCategory } from '@/game/data/growthTasks'
import type { GrowthTaskCategory, GrowthTask } from '@/types/task'
import {
  TrendingUp,
  Swords,
  Coins,
  Heart,
  Compass,
  Trophy,
  Check,
  Zap,
  Lock,
  Unlock,
} from 'lucide-vue-next'

const props = defineProps<{
  highlightedTaskId?: string | null
}>()

const taskStore = useTaskStore()
const isClaiming = ref<string | null>(null)
const activeCategory = ref<GrowthTaskCategory>('combat')

const categories: {
  id: GrowthTaskCategory
  label: string
  emoji: string
  gradientFrom: string
  gradientTo: string
  borderActive: string
  textActive: string
  bgBadge: string
  borderBadge: string
  textBadge: string
  shadowColor: string
  progressFrom: string
  progressTo: string
}[] = [
  {
    id: 'combat',
    label: '战斗',
    emoji: '⚔️',
    gradientFrom: 'from-red-500',
    gradientTo: 'to-rose-600',
    borderActive: 'border-red-500/50',
    textActive: 'text-red-300',
    bgBadge: 'bg-red-500/20',
    borderBadge: 'border-red-500/30',
    textBadge: 'text-red-300',
    shadowColor: 'shadow-red-500/10',
    progressFrom: 'from-red-500',
    progressTo: 'to-rose-400',
  },
  {
    id: 'economy',
    label: '经济',
    emoji: '💰',
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-orange-600',
    borderActive: 'border-amber-500/50',
    textActive: 'text-amber-300',
    bgBadge: 'bg-amber-500/20',
    borderBadge: 'border-amber-500/30',
    textBadge: 'text-amber-300',
    shadowColor: 'shadow-amber-500/10',
    progressFrom: 'from-amber-500',
    progressTo: 'to-orange-400',
  },
  {
    id: 'social',
    label: '社交',
    emoji: '🤝',
    gradientFrom: 'from-pink-500',
    gradientTo: 'to-rose-600',
    borderActive: 'border-pink-500/50',
    textActive: 'text-pink-300',
    bgBadge: 'bg-pink-500/20',
    borderBadge: 'border-pink-500/30',
    textBadge: 'text-pink-300',
    shadowColor: 'shadow-pink-500/10',
    progressFrom: 'from-pink-500',
    progressTo: 'to-rose-400',
  },
  {
    id: 'exploration',
    label: '探索',
    emoji: '🔍',
    gradientFrom: 'from-cyan-500',
    gradientTo: 'to-teal-600',
    borderActive: 'border-cyan-500/50',
    textActive: 'text-cyan-300',
    bgBadge: 'bg-cyan-500/20',
    borderBadge: 'border-cyan-500/30',
    textBadge: 'text-cyan-300',
    shadowColor: 'shadow-cyan-500/10',
    progressFrom: 'from-cyan-500',
    progressTo: 'to-teal-400',
  },
  {
    id: 'collection',
    label: '收藏',
    emoji: '🏆',
    gradientFrom: 'from-green-500',
    gradientTo: 'to-emerald-600',
    borderActive: 'border-green-500/50',
    textActive: 'text-green-300',
    bgBadge: 'bg-green-500/20',
    borderBadge: 'border-green-500/30',
    textBadge: 'text-green-300',
    shadowColor: 'shadow-green-500/10',
    progressFrom: 'from-green-500',
    progressTo: 'to-emerald-400',
  },
]

const iconMap: Record<string, any> = {
  Sword: Swords,
  Swords: Swords,
  Coins: Coins,
  Heart: Heart,
  Sparkles: TrendingUp,
  Compass: Compass,
  Trophy: Trophy,
  TrendingUp: TrendingUp,
}

const completedCount = computed(() => taskStore.completedGrowthCount)
const totalCount = computed(() => taskStore.totalGrowthTasks)

const activeCategoryConfig = computed(() =>
  categories.find(c => c.id === activeCategory.value) || categories[0],
)

const filteredTasks = computed(() =>
  getGrowthTasksByCategory(activeCategory.value),
)

function getTaskIcon(icon: string) {
  return iconMap[icon] || TrendingUp
}

function getProgress(taskId: string) {
  return taskStore.getGrowthTaskProgress(taskId)
}

function getProgressPercent(task: GrowthTask): number {
  const p = getProgress(task.id)
  if (!p) return 0
  return Math.min(100, (p.progress / task.target) * 100)
}

function isLocked(task: GrowthTask): boolean {
  if (!task.prerequisiteGrowthTaskId) return false
  const prereq = taskStore.growthProgressMap.get(task.prerequisiteGrowthTaskId)
  return !prereq || !prereq.completed
}

function getStageColor(stage: number) {
  switch (stage) {
    case 1: return { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/30' }
    case 2: return { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/30' }
    case 3: return { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30' }
    default: return { bg: 'bg-gray-500/20', text: 'text-gray-300', border: 'border-gray-500/30' }
  }
}

async function handleClaim(taskId: string) {
  if (isClaiming.value) return
  isClaiming.value = taskId
  await new Promise(resolve => setTimeout(resolve, 500))
  taskStore.claimGrowthTask(taskId)
  isClaiming.value = null
}

watch(() => props.highlightedTaskId, (id) => {
  if (!id) return
  for (const cat of categories) {
    const tasks = getGrowthTasksByCategory(cat.id)
    const found = tasks.find(t => t.id === id)
    if (found) {
      activeCategory.value = cat.id
      nextTick(() => {
        setTimeout(() => {
          const el = document.querySelector(`[data-task-id="${id}"]`)
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 300)
      })
      break
    }
  }
}, { immediate: true })
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-white flex items-center gap-3">
          <TrendingUp :size="28" class="text-purple-400" />
          成长任务
        </h2>
        <p class="text-gray-500 mt-1">完成成长里程碑，解锁丰厚奖励</p>
      </div>
      <div class="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800/60 border border-gray-700/50">
        <Trophy :size="18" class="text-amber-400" />
        <span class="text-white font-bold">{{ completedCount }}</span>
        <span class="text-gray-500">/</span>
        <span class="text-gray-400">{{ totalCount }}</span>
      </div>
    </div>

    <div class="grid grid-cols-5 gap-3">
      <button
        v-for="cat in categories"
        :key="cat.id"
        @click="activeCategory = cat.id"
        class="growth-tab relative p-4 rounded-2xl text-center transition-all duration-300"
        :class="{
          [`bg-gradient-to-br ${cat.gradientFrom}/30 to-gray-900/40 border-2 ${cat.borderActive} shadow-lg ${cat.shadowColor}`]: activeCategory === cat.id,
          'bg-gray-900/60 border border-gray-800 hover:border-gray-700': activeCategory !== cat.id,
        }"
      >
        <div class="text-2xl mb-1">{{ cat.emoji }}</div>
        <div class="text-sm font-medium" :class="activeCategory === cat.id ? cat.textActive : 'text-gray-500'">
          {{ cat.label }}
        </div>
        <div
          v-if="activeCategory === cat.id"
          class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r rounded-b-2xl"
          :class="`${cat.gradientFrom} ${cat.gradientTo}`"
        ></div>
      </button>
    </div>

    <div class="space-y-4">
      <TransitionGroup name="task-list" tag="div" class="space-y-4">
        <div
          v-for="task in filteredTasks"
          :key="task.id"
          :data-task-id="task.id"
          class="growth-card relative p-5 rounded-2xl transition-all duration-500"
          :class="{
            'opacity-50': isLocked(task),
            'bg-gradient-to-r from-green-900/30 to-emerald-900/20 border-2 border-green-500/40': getProgress(task.id)?.completed && !getProgress(task.id)?.claimed && !isLocked(task),
            'bg-gray-800/30 border border-gray-700/50 opacity-60': getProgress(task.id)?.claimed,
            'bg-gray-900/60 border border-gray-800 hover:border-purple-500/30': !getProgress(task.id)?.completed && !isLocked(task),
            'bg-gray-900/40 border border-gray-800': isLocked(task),
            'ring-4 ring-amber-400 ring-opacity-75 animate-pulse scale-[1.01]': highlightedTaskId === task.id
          }"
        >
          <div v-if="isLocked(task)" class="absolute inset-0 rounded-2xl bg-gray-900/50 z-20 flex items-center justify-center">
            <div class="flex items-center gap-2 text-gray-500">
              <Lock :size="20" />
              <span class="text-sm">需完成前置任务</span>
            </div>
          </div>

          <div v-if="getProgress(task.id)?.completed && !getProgress(task.id)?.claimed" class="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
            <div class="absolute inset-0 bg-gradient-to-r from-green-500/10 via-transparent to-green-500/10 animate-pulse-slow"></div>
          </div>

          <div class="relative z-10 flex items-center gap-5">
            <div
              class="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300"
              :class="{
                [`bg-gradient-to-br ${activeCategoryConfig.gradientFrom} ${activeCategoryConfig.gradientTo} shadow-lg ${activeCategoryConfig.shadowColor}`]: !isLocked(task) && !(getProgress(task.id)?.completed),
                'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30': getProgress(task.id)?.completed && !isLocked(task),
                'bg-gradient-to-br from-gray-600 to-gray-700': isLocked(task),
              }"
            >
              <component :is="getTaskIcon(task.icon)" :size="30" class="text-white" />
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-3 mb-2 flex-wrap">
                <h3 class="text-lg font-bold text-white truncate">{{ task.title }}</h3>
                <span
                  class="px-2.5 py-0.5 rounded-full text-xs font-medium border"
                  :class="[getStageColor(task.stage).bg, getStageColor(task.stage).text, getStageColor(task.stage).border]"
                >
                  阶段 {{ task.stage }}
                </span>
                <span
                  v-if="task.linkedWeeklyTaskIds?.length"
                  class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1"
                >
                  <Zap :size="12" />
                  联动周常
                </span>
                <span v-if="getProgress(task.id)?.claimed" class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-600/30 text-gray-400 border border-gray-600/30">
                  已领取
                </span>
              </div>

              <p class="text-gray-400 text-sm mb-3">{{ task.description }}</p>

              <div class="flex items-center gap-4">
                <div class="flex-1">
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="text-sm text-gray-500">任务进度</span>
                    <span class="text-sm font-medium" :class="getProgress(task.id)?.completed ? 'text-green-400' : 'text-gray-300'">
                      {{ getProgress(task.id)?.progress || 0 }} / {{ task.target }} {{ task.unit }}
                    </span>
                  </div>
                  <div class="h-2.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all duration-700 ease-out"
                      :class="{
                        'bg-gradient-to-r from-green-500 to-emerald-400': getProgress(task.id)?.completed,
                        [`bg-gradient-to-r ${activeCategoryConfig.progressFrom} ${activeCategoryConfig.progressTo}`]: !getProgress(task.id)?.completed,
                      }"
                      :style="{ width: getProgressPercent(task) + '%' }"
                    >
                      <div v-if="!getProgress(task.id)?.completed && getProgressPercent(task) > 0" class="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex flex-col items-end gap-3 flex-shrink-0">
              <div class="flex items-center gap-2 px-4 py-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <Zap :size="18" class="text-amber-400" />
                <span class="text-amber-300 font-bold">+{{ task.expReward }}</span>
                <span class="text-amber-500/70 text-sm">EXP</span>
              </div>

              <div class="flex items-center gap-2 px-4 py-2 rounded-xl border"
                   :class="[activeCategoryConfig.bgBadge, activeCategoryConfig.borderBadge]">
                <Trophy :size="16" :class="activeCategoryConfig.textBadge" />
                <span class="font-medium text-sm" :class="activeCategoryConfig.textBadge">+{{ task.rewardPoolContribution }}</span>
                <span class="text-sm opacity-70" :class="activeCategoryConfig.textBadge">贡献</span>
              </div>

              <button
                v-if="getProgress(task.id)?.completed && !getProgress(task.id)?.claimed && !isLocked(task)"
                @click="handleClaim(task.id)"
                :disabled="isClaiming === task.id"
                class="task-claim-btn relative px-6 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-green-500/30 active:scale-95 disabled:opacity-50"
              >
                <span v-if="isClaiming === task.id" class="flex items-center gap-2">
                  <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  领取中
                </span>
                <span v-else class="flex items-center gap-2">
                  <Check :size="16" />
                  领取奖励
                </span>
              </button>

              <div v-else-if="getProgress(task.id)?.claimed" class="px-6 py-2.5 rounded-xl bg-gray-700/30 text-gray-500 font-medium text-sm">
                已领取
              </div>

              <div v-else-if="isLocked(task)" class="px-6 py-2.5 rounded-xl bg-gray-800/50 text-gray-600 font-medium text-sm flex items-center gap-2">
                <Lock :size="14" />
                未解锁
              </div>

              <div v-else class="px-6 py-2.5 rounded-xl bg-gray-800/50 text-gray-500 font-medium text-sm flex items-center gap-2">
                <Unlock :size="14" />
                进行中
              </div>
            </div>
          </div>
        </div>
      </TransitionGroup>

      <div v-if="filteredTasks.length === 0" class="text-center py-16">
        <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-800/50 flex items-center justify-center">
          <TrendingUp :size="40" class="text-gray-600" />
        </div>
        <p class="text-gray-500">暂无该类别任务</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.growth-tab {
  position: relative;
  overflow: hidden;
}

.growth-tab::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent);
  transform: translateX(-100%);
  transition: transform 0.6s;
}

.growth-tab:hover::before {
  transform: translateX(100%);
}

.growth-card {
  position: relative;
}

.growth-card::after {
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

.growth-card:hover::after {
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

.task-list-enter-active,
.task-list-leave-active {
  transition: all 0.4s ease;
}

.task-list-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.task-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.task-list-move {
  transition: transform 0.4s ease;
}
</style>
