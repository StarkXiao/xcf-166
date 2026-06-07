<script setup lang="ts">
import { computed } from 'vue'
import { useSeasonStore } from '@/stores/seasonStore'
import LevelMilestone from './LevelMilestone.vue'
import { TrendingUp, Zap, History, Award, ChevronRight } from 'lucide-vue-next'

const seasonStore = useSeasonStore()

const recentRecords = computed(() => seasonStore.getRecentExpRecords(10))

const levelRewards = computed(() => {
  return seasonStore.rewards
    .filter((r) => r.level > 0)
    .sort((a, b) => a.level - b.level)
})

const currentLevel = computed(() => seasonStore.playerSeason?.level || 1)

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - timestamp

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'

  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function getSourceName(source: string): string {
  const names: Record<string, string> = {
    task: '任务奖励',
    level: '等级提升',
    challenge: '挑战完成',
  }
  return names[source] || source
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-white flex items-center gap-3">
          <TrendingUp :size="28" class="text-purple-400" />
          进度追踪
        </h2>
        <p class="text-gray-500 mt-1">查看你的赛季等级进度和经验获取记录</p>
      </div>
    </div>

    <div class="grid grid-cols-4 gap-4">
      <div class="progress-stat p-5 rounded-2xl bg-gray-900/60 border border-gray-800">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
            <Award :size="20" class="text-white" />
          </div>
          <div class="text-sm text-gray-500">当前等级</div>
        </div>
        <div class="text-3xl font-bold text-white">{{ currentLevel }}</div>
      </div>

      <div class="progress-stat p-5 rounded-2xl bg-gray-900/60 border border-gray-800">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Zap :size="20" class="text-white" />
          </div>
          <div class="text-sm text-gray-500">累计经验</div>
        </div>
        <div class="text-3xl font-bold text-amber-400">{{ seasonStore.playerSeason?.totalExp?.toLocaleString() || 0 }}</div>
      </div>

      <div class="progress-stat p-5 rounded-2xl bg-gray-900/60 border border-gray-800">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <TrendingUp :size="20" class="text-white" />
          </div>
          <div class="text-sm text-gray-500">赛季积分</div>
        </div>
        <div class="text-3xl font-bold text-green-400">{{ seasonStore.playerSeason?.rankScore?.toLocaleString() || 0 }}</div>
      </div>

      <div class="progress-stat p-5 rounded-2xl bg-gray-900/60 border border-gray-800">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
            <History :size="20" class="text-white" />
          </div>
          <div class="text-sm text-gray-500">本赛季天数</div>
        </div>
        <div class="text-3xl font-bold text-blue-400">
          {{ seasonStore.playerSeason ? Math.ceil((Date.now() - seasonStore.playerSeason.joinedAt) / (1000 * 60 * 60 * 24)) : 0 }}
        </div>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-6">
      <div class="col-span-2">
        <div class="p-6 rounded-2xl bg-gray-900/60 border border-gray-800">
          <h3 class="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <Award :size="24" class="text-purple-400" />
            等级里程碑
          </h3>

          <div class="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            <LevelMilestone
              v-for="reward in levelRewards"
              :key="reward.id"
              :reward="reward"
              :current-level="currentLevel"
              :is-claimed="seasonStore.isRewardClaimed(reward.id)"
            />
          </div>
        </div>
      </div>

      <div>
        <div class="p-6 rounded-2xl bg-gray-900/60 border border-gray-800 h-full">
          <h3 class="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <History :size="24" class="text-blue-400" />
            经验记录
          </h3>

          <div class="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            <div
              v-for="record in recentRecords"
              :key="record.id"
              class="exp-record flex items-center gap-3 p-3 rounded-xl bg-gray-800/40 border border-gray-700/30"
            >
              <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center flex-shrink-0">
                <Zap :size="18" class="text-amber-400" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm text-white font-medium truncate">{{ getSourceName(record.source) }}</div>
                <div class="text-xs text-gray-500">{{ formatTime(record.createdAt) }}</div>
              </div>
              <div class="text-amber-400 font-bold flex items-center gap-1">
                <span class="text-green-400">+</span>
                {{ record.amount.toLocaleString() }}
                <ChevronRight :size="14" class="text-gray-600" />
              </div>
            </div>

            <div v-if="recentRecords.length === 0" class="text-center py-12">
              <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800/50 flex items-center justify-center">
                <History :size="32" class="text-gray-600" />
              </div>
              <p class="text-gray-500">暂无经验记录</p>
              <p class="text-gray-600 text-sm mt-1">完成任务获取经验吧~</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.progress-stat {
  transition: all 0.3s ease;
}

.progress-stat:hover {
  transform: translateY(-2px);
  border-color: rgba(139, 92, 246, 0.3);
}

.exp-record {
  transition: all 0.2s ease;
}

.exp-record:hover {
  background: rgba(139, 92, 246, 0.1);
  border-color: rgba(139, 92, 246, 0.2);
}
</style>
