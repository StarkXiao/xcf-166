<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSeasonStore } from '@/stores/seasonStore'
import { getRewardById } from '@/game/data/seasonRewards'
import RewardCard from './RewardCard.vue'
import { Gift, Package, History, Award, CheckCircle2 } from 'lucide-vue-next'

const seasonStore = useSeasonStore()

const activeTab = ref<'claimable' | 'history'>('claimable')

const claimableLevelRewards = computed(() => {
  return seasonStore.getClaimableLevelRewards()
})

const claimableTaskRewards = computed(() => {
  const rewards: Array<{ reward: any; taskId: string }> = []
  seasonStore.taskProgressMap.forEach((progress, taskId) => {
    if (progress.completed && !progress.claimed) {
      const task = seasonStore.tasks.find((t) => t.id === taskId)
      if (task?.rewardId) {
        const reward = getRewardById(task.rewardId)
        if (reward) {
          rewards.push({ reward, taskId })
        }
      }
    }
  })
  return rewards
})

const allClaimableRewards = computed(() => {
  const levelRewards = claimableLevelRewards.value.map((r) => ({
    reward: r,
    source: 'level' as const,
    sourceId: r.id,
  }))
  const taskRewards = claimableTaskRewards.value.map(({ reward, taskId }) => ({
    reward,
    source: 'task' as const,
    sourceId: taskId,
  }))
  return [...levelRewards, ...taskRewards]
})

const rewardHistory = computed(() => {
  return [...seasonStore.rewardRecords]
    .sort((a, b) => b.claimedAt - a.claimedAt)
    .slice(0, 20)
    .map((record) => ({
      record,
      reward: getRewardById(record.rewardId),
    }))
    .filter((item) => item.reward)
})

const totalClaimableValue = computed(() => {
  let total = 0
  allClaimableRewards.value.forEach((item) => {
    if (item.reward.type === 'currency' && typeof item.reward.value === 'number') {
      total += item.reward.value
    }
  })
  return total
})

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-white flex items-center gap-3">
          <Gift :size="28" class="text-amber-400" />
          奖励中心
        </h2>
        <p class="text-gray-500 mt-1">领取你的赛季奖励，查看奖励历史记录</p>
      </div>

      <div v-if="allClaimableRewards.length > 0" class="flex items-center gap-4">
        <div class="text-right">
          <div class="text-sm text-gray-500">可领取奖励价值</div>
          <div class="text-xl font-bold text-amber-400">💰 {{ totalClaimableValue.toLocaleString() }}</div>
        </div>
      </div>
    </div>

    <div class="flex gap-4">
      <button
        @click="activeTab = 'claimable'"
        class="reward-tab-btn flex items-center gap-3 px-6 py-3 rounded-xl transition-all duration-300"
        :class="{
          'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-2 border-amber-500/40 text-amber-300': activeTab === 'claimable',
          'bg-gray-900/60 border border-gray-800 text-gray-400 hover:text-white': activeTab !== 'claimable',
        }"
      >
        <Package :size="20" />
        <span class="font-medium">待领取奖励</span>
        <span
          v-if="allClaimableRewards.length > 0"
          class="min-w-[24px] h-6 px-2 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center"
        >
          {{ allClaimableRewards.length }}
        </span>
      </button>

      <button
        @click="activeTab = 'history'"
        class="reward-tab-btn flex items-center gap-3 px-6 py-3 rounded-xl transition-all duration-300"
        :class="{
          'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-2 border-purple-500/40 text-purple-300': activeTab === 'history',
          'bg-gray-900/60 border border-gray-800 text-gray-400 hover:text-white': activeTab !== 'history',
        }"
      >
        <History :size="20" />
        <span class="font-medium">奖励历史</span>
        <span class="text-sm text-gray-500">({{ rewardHistory.length }})</span>
      </button>
    </div>

    <Transition name="fade" mode="out-in">
      <div v-if="activeTab === 'claimable'" key="claimable">
        <div v-if="allClaimableRewards.length > 0" class="grid grid-cols-4 gap-4">
          <RewardCard
            v-for="item in allClaimableRewards"
            :key="item.sourceId"
            :reward="item.reward"
            :source="item.source"
            :can-claim="true"
          />
        </div>

        <div v-else class="text-center py-20">
          <div class="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 :size="48" class="text-green-500" />
          </div>
          <h3 class="text-2xl font-bold text-white mb-2">所有奖励已领取！</h3>
          <p class="text-gray-500">完成更多任务来获取新的奖励吧~</p>
        </div>
      </div>

      <div v-else key="history">
        <div v-if="rewardHistory.length > 0" class="p-6 rounded-2xl bg-gray-900/60 border border-gray-800">
          <div class="space-y-3">
            <div
              v-for="item in rewardHistory"
              :key="item.record.id"
              class="history-item flex items-center gap-4 p-4 rounded-xl bg-gray-800/40 border border-gray-700/30 transition-all duration-300 hover:bg-gray-800/60"
            >
              <div
                class="w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0"
                :class="{
                  'from-gray-500 to-gray-600': item.reward?.rarity === 'common',
                  'from-green-500 to-emerald-600': item.reward?.rarity === 'uncommon',
                  'from-blue-500 to-cyan-600': item.reward?.rarity === 'rare',
                  'from-purple-500 to-pink-600': item.reward?.rarity === 'epic',
                  'from-amber-500 to-orange-600': item.reward?.rarity === 'legendary',
                }"
              >
                <Award :size="28" class="text-white" />
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-bold text-white">{{ item.reward?.name }}</span>
                  <span
                    class="px-2 py-0.5 rounded text-xs font-medium"
                    :class="{
                      'bg-gray-500/20 text-gray-400': item.reward?.rarity === 'common',
                      'bg-green-500/20 text-green-400': item.reward?.rarity === 'uncommon',
                      'bg-blue-500/20 text-blue-400': item.reward?.rarity === 'rare',
                      'bg-purple-500/20 text-purple-400': item.reward?.rarity === 'epic',
                      'bg-amber-500/20 text-amber-400': item.reward?.rarity === 'legendary',
                    }"
                  >
                    {{
                      item.reward?.rarity === 'common'
                        ? '普通'
                        : item.reward?.rarity === 'uncommon'
                        ? '优秀'
                        : item.reward?.rarity === 'rare'
                        ? '稀有'
                        : item.reward?.rarity === 'epic'
                        ? '史诗'
                        : '传说'
                    }}
                  </span>
                </div>
                <p class="text-sm text-gray-500">{{ item.reward?.description }}</p>
                <div class="text-xs text-gray-600 mt-1">
                  来源: {{ item.record.source === 'level' ? '等级奖励' : item.record.source === 'task' ? '任务奖励' : '排行奖励' }}
                </div>
              </div>

              <div class="text-right flex-shrink-0">
                <div class="text-sm text-gray-500">{{ formatTime(item.record.claimedAt) }}</div>
                <div v-if="item.reward?.type === 'currency' && typeof item.reward.value === 'number'" class="text-amber-400 font-bold mt-1">
                  💰 {{ item.reward.value.toLocaleString() }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-20">
          <div class="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-800/50 flex items-center justify-center">
            <History :size="48" class="text-gray-600" />
          </div>
          <h3 class="text-2xl font-bold text-white mb-2">暂无奖励记录</h3>
          <p class="text-gray-500">领取奖励后会在这里显示记录</p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.reward-tab-btn {
  position: relative;
  overflow: hidden;
}

.reward-tab-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent);
  transform: translateX(-100%);
  transition: transform 0.6s;
}

.reward-tab-btn:hover::before {
  transform: translateX(100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.history-item {
  position: relative;
}
</style>
