<script setup lang="ts">
import { computed } from 'vue'
import { Trophy, Clock, Target, Award, X } from 'lucide-vue-next'
import type { TutorialAnalytics, TutorialPhase } from '@/types/tutorial'
import { DEFAULT_TUTORIAL_PHASES } from '@/types/tutorial'
import { tutorialPhaseConfigs } from '@/game/data/tutorials'

const props = defineProps<{
  show: boolean
  analytics: TutorialAnalytics
  totalSteps: number
  completedSteps: number
  skippedSteps: number
  totalProgress: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const formattedTime = computed(() => {
  const seconds = Math.floor(props.analytics.totalTimeSpent / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (minutes > 0) {
    return `${minutes} 分 ${remainingSeconds} 秒`
  }
  return `${seconds} 秒`
})

const completionRate = computed(() => {
  if (props.totalSteps === 0) return 0
  return Math.round((props.completedSteps / props.totalSteps) * 100)
})

const phaseCompletionData = computed(() => {
  return DEFAULT_TUTORIAL_PHASES.map(phase => {
    const config = tutorialPhaseConfigs[phase]
    const timeSpent = props.analytics.phaseTimeSpent[phase] || 0
    const isSkipped = props.analytics.skippedPhases.includes(phase)

    return {
      phase,
      name: config?.name || phase.replace(/_/g, ' '),
      timeSpent: Math.floor(timeSpent / 1000),
      isSkipped,
      isCompleted: !isSkipped
    }
  }).filter(item => item.phase !== 'complete')
})

const rewardsEarned = computed(() => {
  const rewards = []
  DEFAULT_TUTORIAL_PHASES.forEach(phase => {
    const config = tutorialPhaseConfigs[phase]
    const isSkipped = props.analytics.skippedPhases.includes(phase)
    if (!isSkipped && config?.rewards) {
      rewards.push(...config.rewards.map(r => ({
        ...r,
        phaseName: config.name
      })))
    }
  })
  return rewards
})

function handleClose() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="complete">
      <div
        v-if="show"
        class="fixed inset-0 z-[70] flex items-center justify-center p-4"
      >
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" />

        <div class="relative bg-gradient-to-b from-gray-900 to-gray-950 border border-amber-500/30 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden">
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(251,191,36,0.1),transparent_70%)] pointer-events-none" />

          <button
            @click="handleClose"
            class="absolute top-4 right-4 z-10 p-2 hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-white"
          >
            <X class="w-5 h-5" />
          </button>

          <div class="relative px-8 py-8 text-center border-b border-gray-800">
            <div class="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-amber-400 to-amber-600 rounded-3xl flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Trophy class="w-10 h-10 text-white" />
            </div>
            <h2 class="text-3xl font-bold text-white mb-2">🎉 恭喜毕业！</h2>
            <p class="text-gray-400">你已完成新手引导，成为正式的遗物净化师</p>
          </div>

          <div class="relative px-8 py-6">
            <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Target class="w-5 h-5 text-amber-400" />
              完成统计
            </h3>

            <div class="grid grid-cols-3 gap-4 mb-6">
              <div class="bg-gray-800/50 border border-gray-700 rounded-2xl p-4 text-center">
                <div class="text-3xl font-bold text-amber-400 mb-1">{{ totalProgress }}%</div>
                <div class="text-xs text-gray-400">总体完成率</div>
              </div>
              <div class="bg-gray-800/50 border border-gray-700 rounded-2xl p-4 text-center">
                <div class="text-3xl font-bold text-green-400 mb-1">{{ completedSteps }}</div>
                <div class="text-xs text-gray-400">完成步骤</div>
              </div>
              <div class="bg-gray-800/50 border border-gray-700 rounded-2xl p-4 text-center">
                <div class="text-3xl font-bold text-blue-400 mb-1">{{ formattedTime }}</div>
                <div class="text-xs text-gray-400">总用时</div>
              </div>
            </div>

            <div class="mb-6">
              <h4 class="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <Clock class="w-4 h-4 text-gray-400" />
                各阶段用时
              </h4>
              <div class="space-y-2">
                <div
                  v-for="item in phaseCompletionData"
                  :key="item.phase"
                  class="flex items-center gap-3"
                >
                  <div class="w-32 text-sm text-gray-400 truncate">{{ item.name }}</div>
                  <div class="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all duration-500"
                      :class="item.isSkipped ? 'bg-gray-600' : 'bg-gradient-to-r from-amber-500 to-amber-400'"
                      :style="{ width: item.isSkipped ? '100%' : `${Math.min(100, item.timeSpent * 2)}%` }"
                    />
                  </div>
                  <div class="w-16 text-right text-xs" :class="item.isSkipped ? 'text-gray-500' : 'text-gray-300'">
                    {{ item.isSkipped ? '已跳过' : `${item.timeSpent}s` }}
                  </div>
                </div>
              </div>
            </div>

            <div v-if="rewardsEarned.length > 0">
              <h4 class="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <Award class="w-4 h-4 text-amber-400" />
                获得奖励
              </h4>
              <div class="flex flex-wrap gap-2">
                <div
                  v-for="reward in rewardsEarned"
                  :key="reward.id"
                  class="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl"
                >
                  <span class="text-lg">{{ reward.icon }}</span>
                  <div class="text-left">
                    <div class="text-xs font-medium text-amber-300">{{ reward.name }}</div>
                    <div class="text-xs text-gray-500">{{ reward.phaseName }}</div>
                  </div>
                  <div class="text-xs text-amber-400 font-bold">+{{ reward.value }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="relative px-8 py-4 border-t border-gray-800">
            <button
              @click="handleClose"
              class="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-gray-900 font-bold rounded-xl transition-all shadow-lg shadow-amber-500/30"
            >
              开始游戏之旅
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.complete-enter-active,
.complete-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.complete-enter-from,
.complete-leave-to {
  opacity: 0;
}

.complete-enter-from .relative,
.complete-leave-to .relative {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}
</style>
