<script setup lang="ts">
import { computed } from 'vue'
import { useDungeonStore } from '@/stores/dungeonStore'
import { dungeons } from '@/game/data/dungeons'
import type { Dungeon } from '@/types/dungeon'
import { Swords, Lock, Star, ChevronRight, Trophy, Clock } from 'lucide-vue-next'

const props = defineProps<{
  highlightedDungeonId?: string | null
}>()

const emit = defineEmits<{
  (e: 'select-dungeon', dungeonId: string): void
}>()

const dungeonStore = useDungeonStore()

const dungeonList = computed(() => {
  return dungeons.map((dungeon) => {
    const progress = dungeonStore.getDungeonProgress(dungeon.id)
    const isUnlocked = dungeonStore.isDungeonUnlocked(dungeon.id)
    const unmetConditions = dungeonStore.getUnmetConditions(dungeon.id)
    const totalStars = progress
      ? progress.stageProgresses.reduce((sum, sp) => sum + sp.bestStarRating, 0)
      : 0
    const maxStars = dungeon.stages.length * 3
    const clearedStages = progress
      ? progress.stageProgresses.filter((sp) => sp.status === 'cleared' || sp.status === 'perfect').length
      : 0
    const totalStages = dungeon.stages.length
    const todayClearCount = progress?.todayClearCount ?? 0
    const dailyLimit = dungeon.dailyResetLimit

    return {
      dungeon,
      isUnlocked,
      unmetConditions,
      totalStars,
      maxStars,
      clearedStages,
      totalStages,
      status: progress?.status || 'locked',
      todayClearCount,
      dailyLimit,
    }
  })
})

const difficultyConfig: Record<string, { label: string; color: string; borderColor: string; glow: string }> = {
  normal: { label: '普通', color: 'from-green-500 to-emerald-600', borderColor: 'border-green-500/30', glow: 'shadow-green-500/20' },
  hard: { label: '困难', color: 'from-orange-500 to-red-600', borderColor: 'border-orange-500/30', glow: 'shadow-orange-500/20' },
  hell: { label: '地狱', color: 'from-red-600 to-purple-700', borderColor: 'border-red-500/30', glow: 'shadow-red-500/20' },
}

function handleClick(dungeonId: string) {
  emit('select-dungeon', dungeonId)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-3 mb-2">
      <Swords class="w-6 h-6 text-purple-400" />
      <h2 class="text-xl font-bold text-white">挑战副本</h2>
      <span class="text-sm text-gray-500">
        已通关 {{ dungeonStore.totalDungeonsCleared }}/{{ dungeons.length }}
      </span>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="item in dungeonList"
        :key="item.dungeon.id"
        :data-dungeon-id="item.dungeon.id"
        @click="item.isUnlocked && handleClick(item.dungeon.id)"
        class="dungeon-card group relative overflow-hidden rounded-2xl border-2 transition-all duration-500"
        :class="[
          item.isUnlocked
            ? `${difficultyConfig[item.dungeon.difficulty].borderColor} bg-gray-900/80 cursor-pointer hover:scale-[1.02]`
            : 'border-gray-700/50 bg-gray-900/40 cursor-not-allowed opacity-50',
          item.isUnlocked ? `hover:shadow-lg ${difficultyConfig[item.dungeon.difficulty].glow}` : '',
          highlightedDungeonId === item.dungeon.id ? 'ring-4 ring-amber-400 ring-opacity-75 animate-pulse scale-[1.02]' : ''
        ]"
      >
        <div class="absolute inset-0 bg-gradient-to-br" :class="item.dungeon.background"></div>
        <div class="absolute inset-0 bg-gray-900/70"></div>

        <div v-if="!item.isUnlocked" class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-20">
          <div class="text-center">
            <Lock class="w-10 h-10 text-gray-500 mx-auto mb-2" />
            <div class="text-sm text-gray-400 mb-1">未解锁</div>
            <div class="text-xs text-gray-600 max-w-[200px]">
              {{ item.unmetConditions.join('、') }}
            </div>
          </div>
        </div>

        <div class="relative z-10 p-6">
          <div class="flex items-start justify-between mb-4">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center text-3xl shadow-lg" :class="difficultyConfig[item.dungeon.difficulty].color">
              {{ item.dungeon.icon }}
            </div>
            <div class="flex flex-col items-end gap-1">
              <span class="px-3 py-1 rounded-full text-xs font-bold" :class="`bg-gradient-to-r ${difficultyConfig[item.dungeon.difficulty].color} text-white`">
                {{ difficultyConfig[item.dungeon.difficulty].label }}
              </span>
              <span v-if="item.status === 'cleared'" class="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">
                已通关
              </span>
            </div>
          </div>

          <h3 class="text-lg font-bold text-white mb-1">{{ item.dungeon.name }}</h3>
          <p class="text-sm text-gray-400 mb-2 line-clamp-2">{{ item.dungeon.description }}</p>

          <div class="text-xs text-gray-500 mb-4">
            {{ item.dungeon.theme }}
          </div>

          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-1">
              <Star v-for="i in item.maxStars" :key="i" class="w-4 h-4" :class="i <= item.totalStars ? 'text-amber-400 fill-amber-400' : 'text-gray-600'" />
            </div>
            <span class="text-xs text-gray-500">{{ item.totalStars }}/{{ item.maxStars }}</span>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="text-xs text-gray-500">
                <Trophy class="w-3.5 h-3.5 inline mr-1" />
                {{ item.clearedStages }}/{{ item.totalStages }} 关卡
              </div>
              <div class="text-xs text-gray-500">
                <Clock class="w-3.5 h-3.5 inline mr-1" />
                今日挑战: {{ item.todayClearCount }}/{{ item.dailyLimit }}
              </div>
            </div>
            <ChevronRight v-if="item.isUnlocked" class="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dungeon-card {
  transform: translateY(0);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dungeon-card:hover {
  transform: translateY(-4px);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
