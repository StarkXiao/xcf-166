<script setup lang="ts">
import { computed } from 'vue'
import { useDungeonStore } from '@/stores/dungeonStore'
import { dungeons, getDungeonById, getStageById } from '@/game/data/dungeons'
import { BarChart3, Trophy, Star, Swords, Clock, TrendingUp, Target, Flame } from 'lucide-vue-next'

const dungeonStore = useDungeonStore()

const overallStats = computed(() => [
  { label: '总通关次数', value: dungeonStore.totalClearCount, icon: Trophy, color: 'text-amber-400', bg: 'from-amber-500/20 to-amber-600/10' },
  { label: '已通关副本', value: `${dungeonStore.totalDungeonsCleared}/${dungeons.length}`, icon: Swords, color: 'text-purple-400', bg: 'from-purple-500/20 to-purple-600/10' },
  { label: '获得星星', value: `${dungeonStore.totalStarsEarned}/${dungeonStore.maxStarsPossible}`, icon: Star, color: 'text-yellow-400', bg: 'from-yellow-500/20 to-yellow-600/10' },
  { label: '总战斗次数', value: dungeonStore.battleHistory.length, icon: BarChart3, color: 'text-blue-400', bg: 'from-blue-500/20 to-blue-600/10' },
])

const starProgress = computed(() => {
  const max = dungeonStore.maxStarsPossible
  if (max === 0) return 0
  return (dungeonStore.totalStarsEarned / max) * 100
})

const dungeonBreakdowns = computed(() => {
  return dungeons.map((dungeon) => {
    const progress = dungeonStore.getDungeonProgress(dungeon.id)
    const clearedStages = progress
      ? progress.stageProgresses.filter((sp) => sp.status === 'cleared' || sp.status === 'perfect').length
      : 0
    const earnedStars = progress
      ? progress.stageProgresses.reduce((sum, sp) => sum + sp.bestStarRating, 0)
      : 0
    const maxStars = dungeon.stages.length * 3
    const bestClear = progress
      ? progress.stageProgresses.find((sp) => sp.lastClearAt)
      : undefined

    return {
      dungeon,
      clearedStages,
      totalStages: dungeon.stages.length,
      earnedStars,
      maxStars,
      bestClearTime: bestClear?.lastClearAt,
    }
  })
})

const recentBattles = computed(() => {
  return dungeonStore.battleHistory.slice(0, 5).map((record) => {
    const stage = getStageById(record.dungeonId, record.stageId)
    const dungeon = getDungeonById(record.dungeonId)
    return {
      ...record,
      stageName: stage?.name || '未知关卡',
      dungeonName: dungeon?.name || '未知副本',
    }
  })
})

const victoryRate = computed(() => {
  if (dungeonStore.battleHistory.length === 0) return 0
  const victories = dungeonStore.battleHistory.filter((r) => r.result === 'victory').length
  return Math.round((victories / dungeonStore.battleHistory.length) * 100)
})

const difficultyConfig: Record<string, { label: string; color: string; badge: string }> = {
  normal: { label: '普通', color: 'text-green-400', badge: 'bg-green-500/20 text-green-400 border-green-500/30' },
  hard: { label: '困难', color: 'text-orange-400', badge: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  hell: { label: '地狱', color: 'text-red-400', badge: 'bg-red-500/20 text-red-400 border-red-500/30' },
}

const resultConfig: Record<string, { label: string; class: string }> = {
  victory: { label: '胜利', class: 'bg-green-500/20 text-green-400 border-green-500/30' },
  defeat: { label: '失败', class: 'bg-red-500/20 text-red-400 border-red-500/30' },
  retreat: { label: '撤退', class: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}
</script>

<template>
  <div class="space-y-8">
    <div class="flex items-center gap-3">
      <BarChart3 class="w-6 h-6 text-purple-400" />
      <h2 class="text-xl font-bold text-white">副本统计</h2>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div
        v-for="stat in overallStats"
        :key="stat.label"
        class="group p-5 rounded-2xl border border-gray-700/50 bg-gray-900/60 hover:border-gray-600/50 hover:bg-gray-800/60 transition-all duration-300 hover:-translate-y-0.5"
      >
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center" :class="stat.bg">
            <component :is="stat.icon" class="w-5 h-5" :class="stat.color" />
          </div>
        </div>
        <div class="text-2xl font-bold text-white mb-1">{{ stat.value }}</div>
        <div class="text-sm text-gray-500">{{ stat.label }}</div>
      </div>
    </div>

    <div class="p-6 rounded-2xl border border-gray-700/50 bg-gray-900/60">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <Star class="w-5 h-5 text-yellow-400" />
          <h3 class="text-lg font-bold text-white">星星收集进度</h3>
        </div>
        <span class="text-sm text-gray-400">{{ dungeonStore.totalStarsEarned }} / {{ dungeonStore.maxStarsPossible }}</span>
      </div>
      <div class="w-full h-4 rounded-full bg-gray-800 overflow-hidden">
        <div
          class="h-full rounded-full bg-gradient-to-r from-yellow-500 via-amber-400 to-orange-500 transition-all duration-700 ease-out"
          :style="{ width: `${starProgress}%` }"
        ></div>
      </div>
      <div class="text-right mt-2">
        <span class="text-sm font-medium text-amber-400">{{ starProgress.toFixed(1) }}%</span>
      </div>
    </div>

    <div>
      <div class="flex items-center gap-2 mb-4">
        <Target class="w-5 h-5 text-purple-400" />
        <h3 class="text-lg font-bold text-white">副本详情</h3>
      </div>
      <div class="space-y-4">
        <div
          v-for="item in dungeonBreakdowns"
          :key="item.dungeon.id"
          class="p-5 rounded-2xl border border-gray-700/50 bg-gray-900/60 hover:border-gray-600/50 hover:bg-gray-800/60 transition-all duration-300"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-600/10 flex items-center justify-center text-2xl">
                {{ item.dungeon.icon }}
              </div>
              <div>
                <h4 class="text-base font-bold text-white">{{ item.dungeon.name }}</h4>
                <span class="inline-block px-2 py-0.5 rounded text-xs border mt-1" :class="difficultyConfig[item.dungeon.difficulty].badge">
                  {{ difficultyConfig[item.dungeon.difficulty].label }}
                </span>
              </div>
            </div>
            <div v-if="item.bestClearTime" class="text-xs text-gray-500 flex items-center gap-1">
              <Clock class="w-3.5 h-3.5" />
              {{ formatDate(item.bestClearTime) }}
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="p-3 rounded-xl bg-gray-800/50 border border-gray-700/30">
              <div class="flex items-center gap-1.5 mb-1">
                <Flame class="w-3.5 h-3.5 text-orange-400" />
                <span class="text-xs text-gray-500">关卡进度</span>
              </div>
              <div class="text-lg font-bold text-white">{{ item.clearedStages }}<span class="text-gray-600">/{{ item.totalStages }}</span></div>
            </div>
            <div class="p-3 rounded-xl bg-gray-800/50 border border-gray-700/30">
              <div class="flex items-center gap-1.5 mb-1">
                <Star class="w-3.5 h-3.5 text-yellow-400" />
                <span class="text-xs text-gray-500">星级评价</span>
              </div>
              <div class="text-lg font-bold text-white">{{ item.earnedStars }}<span class="text-gray-600">/{{ item.maxStars }}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div>
      <div class="flex items-center gap-2 mb-4">
        <Clock class="w-5 h-5 text-blue-400" />
        <h3 class="text-lg font-bold text-white">最近战斗</h3>
      </div>
      <div v-if="recentBattles.length === 0" class="p-6 rounded-2xl border border-gray-700/50 bg-gray-900/60 text-center text-gray-500">
        暂无战斗记录
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="battle in recentBattles"
          :key="battle.id"
          class="flex items-center gap-4 p-4 rounded-xl border border-gray-700/50 bg-gray-900/60 hover:border-gray-600/50 hover:bg-gray-800/60 transition-all duration-300"
        >
          <span class="px-2.5 py-1 rounded-lg text-xs font-bold border" :class="resultConfig[battle.result].class">
            {{ resultConfig[battle.result].label }}
          </span>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-white truncate">{{ battle.stageName }}</div>
            <div class="text-xs text-gray-500">{{ battle.dungeonName }}</div>
          </div>
          <div class="flex items-center gap-0.5">
            <Star
              v-for="i in 3"
              :key="i"
              class="w-3.5 h-3.5"
              :class="i <= battle.starRating ? 'text-amber-400 fill-amber-400' : 'text-gray-700'"
            />
          </div>
          <div class="text-xs text-gray-500 whitespace-nowrap">{{ formatDate(battle.completedAt) }}</div>
        </div>
      </div>
    </div>

    <div class="p-6 rounded-2xl border border-gray-700/50 bg-gray-900/60">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-600/10 flex items-center justify-center">
          <TrendingUp class="w-6 h-6 text-green-400" />
        </div>
        <div class="flex-1">
          <div class="text-sm text-gray-500 mb-1">胜率</div>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-bold text-white">{{ victoryRate }}</span>
            <span class="text-lg text-gray-500">%</span>
          </div>
        </div>
        <div class="w-16 h-16 relative">
          <svg class="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgb(31, 41, 55)" stroke-width="3" />
            <circle
              cx="18" cy="18" r="15.9" fill="none"
              stroke="rgb(34, 197, 94)"
              stroke-width="3"
              stroke-linecap="round"
              :stroke-dasharray="`${victoryRate} ${100 - victoryRate}`"
              class="transition-all duration-700"
            />
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>
