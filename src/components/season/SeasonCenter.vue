<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSeasonStore } from '@/stores/seasonStore'
import {
  Trophy,
  ListTodo,
  TrendingUp,
  Gift,
  Sparkles,
  ChevronRight,
  Star,
  Zap,
} from 'lucide-vue-next'

const router = useRouter()
const seasonStore = useSeasonStore()

const quickActions = [
  {
    id: 'tasks',
    label: '任务列表',
    description: '完成每日/每周任务获取奖励',
    icon: ListTodo,
    color: 'from-blue-500 to-cyan-500',
    count: computed(() => seasonStore.dailyTasks.filter((t) => {
      const p = seasonStore.getTaskProgress(t.id)
      return p?.completed && !p.claimed
    }).length + seasonStore.weeklyTasks.filter((t) => {
      const p = seasonStore.getTaskProgress(t.id)
      return p?.completed && !p.claimed
    }).length),
  },
  {
    id: 'progress',
    label: '进度追踪',
    description: '查看赛季等级和奖励里程碑',
    icon: TrendingUp,
    color: 'from-purple-500 to-pink-500',
    count: computed(() => seasonStore.getClaimableLevelRewards().length),
  },
  {
    id: 'rewards',
    label: '奖励中心',
    description: '领取你的赛季奖励',
    icon: Gift,
    color: 'from-amber-500 to-orange-500',
    count: computed(() => seasonStore.unclaimedCount),
  },
  {
    id: 'leaderboard',
    label: '排行榜',
    description: '与其他玩家一较高下',
    icon: Trophy,
    color: 'from-yellow-500 to-amber-500',
    count: computed(() => seasonStore.playerRank),
  },
]

const nextLevelReward = computed(() => {
  if (!seasonStore.playerSeason || !seasonStore.rewards) return null
  const nextLevel = seasonStore.playerSeason.level + 1
  return seasonStore.rewards.find((r) => r.level === nextLevel)
})

const recentProgress = computed(() => {
  const daily = seasonStore.dailyTasks
  const completed = daily.filter((t) => {
    const p = seasonStore.getTaskProgress(t.id)
    return p?.completed
  }).length
  return { completed, total: daily.length }
})

function navigateTo(tab: string) {
  router.push({ path: '/season', query: { tab } })
}
</script>

<template>
  <div class="space-y-6">
    <div class="season-banner relative overflow-hidden rounded-2xl p-8 border border-purple-500/20">
      <div class="absolute inset-0 bg-gradient-to-r from-purple-900/60 via-red-900/40 to-amber-900/30"></div>
      <div class="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

      <div class="relative z-10">
        <div class="flex items-start justify-between">
          <div class="max-w-2xl">
            <div class="flex items-center gap-3 mb-4">
              <div class="season-glow-badge px-4 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/30">
                <span class="text-purple-300 text-sm font-medium flex items-center gap-2">
                  <Sparkles :size="14" class="text-amber-400" />
                  {{ seasonStore.currentSeason?.theme }}
                </span>
              </div>
              <div class="px-4 py-1.5 rounded-full bg-green-500/20 border border-green-400/30">
                <span class="text-green-300 text-sm font-medium">进行中</span>
              </div>
            </div>

            <h2 class="text-4xl font-bold text-white mb-4 leading-tight">
              {{ seasonStore.currentSeason?.name }}
            </h2>
            <p class="text-gray-400 text-lg leading-relaxed">
              {{ seasonStore.currentSeason?.description }}
            </p>
          </div>

          <div class="text-right">
            <div class="text-6xl font-bold bg-gradient-to-b from-amber-300 to-amber-500 bg-clip-text text-transparent mb-2">
              {{ seasonStore.playerSeason?.level || 1 }}
            </div>
            <div class="text-gray-400 text-sm">当前等级</div>
          </div>
        </div>

        <div class="mt-8">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-3">
              <Zap :size="20" class="text-amber-400" />
              <span class="text-white font-medium">经验进度</span>
              <span class="text-gray-500 text-sm">
                {{ seasonStore.playerSeason?.exp?.toLocaleString() || 0 }} /
                {{ seasonStore.nextLevelExp?.toLocaleString() || 0 }} EXP
              </span>
            </div>
            <span class="text-amber-400 font-bold">{{ seasonStore.expProgress.toFixed(1) }}%</span>
          </div>

          <div class="season-exp-bar relative h-4 bg-gray-800/80 rounded-full overflow-hidden">
            <div
              class="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 via-red-500 to-amber-500 rounded-full transition-all duration-1000 ease-out"
              :style="{ width: seasonStore.expProgress + '%' }"
            >
              <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
          </div>

          <div v-if="nextLevelReward" class="mt-4 flex items-center gap-3 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center" :class="nextLevelReward.rarity === 'legendary' ? 'from-amber-500 to-orange-600' : nextLevelReward.rarity === 'epic' ? 'from-purple-500 to-pink-600' : 'from-blue-500 to-cyan-600'">
              <Star :size="24" class="text-white" />
            </div>
            <div class="flex-1">
              <div class="text-sm text-gray-400">下一等级奖励</div>
              <div class="text-white font-medium">{{ nextLevelReward.name }}</div>
            </div>
            <div class="text-sm text-gray-500">Lv.{{ nextLevelReward.level }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-4 gap-4">
      <div
        v-for="action in quickActions"
        :key="action.id"
        @click="navigateTo(action.id)"
        class="season-action-card group relative p-6 rounded-2xl bg-gray-900/60 border border-gray-800 hover:border-purple-500/30 transition-all duration-500 cursor-pointer overflow-hidden"
      >
        <div class="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500" :class="action.color"></div>
        <div class="relative z-10">
          <div class="flex items-start justify-between mb-4">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center" :class="action.color">
              <component :is="action.icon" :size="28" class="text-white" />
            </div>
            <div
              v-if="action.count.value > 0"
              class="season-action-badge min-w-[24px] h-6 px-2 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center"
            >
              {{ action.count.value }}
            </div>
          </div>

          <h3 class="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
            {{ action.label }}
          </h3>
          <p class="text-gray-500 text-sm mb-4">{{ action.description }}</p>

          <div class="flex items-center gap-2 text-purple-400 text-sm font-medium group-hover:text-purple-300">
            查看详情
            <ChevronRight :size="16" class="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-4">
      <div class="season-stats-card p-6 rounded-2xl bg-gray-900/60 border border-gray-800">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <ListTodo :size="24" class="text-white" />
          </div>
          <div>
            <div class="text-gray-500 text-sm">今日任务</div>
            <div class="text-2xl font-bold text-white">
              {{ recentProgress.completed }} / {{ recentProgress.total }}
            </div>
          </div>
        </div>
        <div class="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
            :style="{ width: (recentProgress.completed / recentProgress.total * 100) + '%' }"
          ></div>
        </div>
      </div>

      <div class="season-stats-card p-6 rounded-2xl bg-gray-900/60 border border-gray-800">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
            <Trophy :size="24" class="text-white" />
          </div>
          <div>
            <div class="text-gray-500 text-sm">当前排名</div>
            <div class="text-2xl font-bold text-white">
              {{ seasonStore.playerRank > 0 ? '#' + seasonStore.playerRank : '未上榜' }}
            </div>
          </div>
        </div>
        <div class="text-sm text-gray-500">
          赛季积分: <span class="text-purple-400 font-medium">{{ seasonStore.playerSeason?.rankScore?.toLocaleString() || 0 }}</span>
        </div>
      </div>

      <div class="season-stats-card p-6 rounded-2xl bg-gray-900/60 border border-gray-800">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Gift :size="24" class="text-white" />
          </div>
          <div>
            <div class="text-gray-500 text-sm">累计经验</div>
            <div class="text-2xl font-bold text-white">
              {{ seasonStore.playerSeason?.totalExp?.toLocaleString() || 0 }}
            </div>
          </div>
        </div>
        <div class="text-sm text-gray-500">
          完成任务: <span class="text-amber-400 font-medium">{{ seasonStore.completedTasksCount }}</span> 个
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.season-banner {
  background:
    linear-gradient(135deg, rgba(30, 20, 50, 0.8) 0%, rgba(20, 10, 30, 0.9) 100%),
    url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}

.season-glow-badge {
  box-shadow: 0 0 30px rgba(139, 92, 246, 0.3);
}

.season-exp-bar {
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
}

.animate-shimmer {
  animation: shimmer 2s ease-in-out infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.season-action-card {
  transform: translateY(0);
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.season-action-card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 20px 40px -15px rgba(139, 92, 246, 0.3),
    0 0 0 1px rgba(139, 92, 246, 0.1);
}

.season-action-badge {
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.season-stats-card {
  transition: all 0.3s ease;
}

.season-stats-card:hover {
  border-color: rgba(139, 92, 246, 0.3);
  transform: translateY(-2px);
}
</style>
