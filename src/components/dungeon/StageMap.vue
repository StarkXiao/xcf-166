<script setup lang="ts">
import { computed } from 'vue'
import { useDungeonStore } from '@/stores/dungeonStore'
import { getDungeonById } from '@/game/data/dungeons'
import type { DungeonStage, StageStatus, DropRarity } from '@/types/dungeon'
import { Lock, Check, Star, ChevronRight, Skull, Swords, ArrowLeft, Zap, Flame } from 'lucide-vue-next'

const props = defineProps<{
  dungeonId: string
}>()

const emit = defineEmits<{
  (e: 'select-stage', dungeonId: string, stageId: string): void
  (e: 'back'): void
}>()

const dungeonStore = useDungeonStore()

const dungeon = computed(() => getDungeonById(props.dungeonId))
const progress = computed(() => dungeonStore.getDungeonProgress(props.dungeonId))

const difficultyColors: Record<string, string> = {
  normal: 'from-green-500 to-emerald-600',
  hard: 'from-orange-500 to-red-600',
  hell: 'from-red-600 to-purple-700',
}

const difficultyLabels: Record<string, string> = {
  normal: '普通',
  hard: '困难',
  hell: '地狱',
}

const difficultyBadgeColors: Record<string, string> = {
  normal: 'bg-green-500/20 text-green-400 border-green-500/30',
  hard: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  hell: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const rarityColors: Record<DropRarity, string> = {
  common: 'text-gray-400',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-amber-400',
}

const rarityBorders: Record<DropRarity, string> = {
  common: 'border-gray-600/50',
  uncommon: 'border-green-500/40',
  rare: 'border-blue-500/40',
  epic: 'border-purple-500/40',
  legendary: 'border-amber-500/40',
}

const stagesWithStatus = computed(() => {
  if (!dungeon.value) return []
  return dungeon.value.stages.map((stage) => {
    const sp = dungeonStore.getStageProgress(stage.id)
    const isUnlocked = dungeonStore.isStageUnlocked(props.dungeonId, stage.id)
    const unmetConditions = isUnlocked ? [] : dungeonStore.getUnmetConditions(props.dungeonId, stage.id)
    return {
      stage,
      status: sp?.status || 'locked' as StageStatus,
      isUnlocked,
      unmetConditions,
      bestStarRating: sp?.bestStarRating || 0,
      clearCount: sp?.clearCount || 0,
    }
  })
})

function getStatusClasses(status: StageStatus, isUnlocked: boolean) {
  if (!isUnlocked) {
    return {
      node: 'bg-gray-800 border-gray-700',
      icon: 'text-gray-500',
      card: 'bg-gray-900/30 border-gray-800/30 opacity-60',
    }
  }
  switch (status) {
    case 'available':
      return {
        node: 'bg-gradient-to-br from-purple-500 to-violet-600 border-purple-400/50 shadow-[0_0_15px_rgba(168,85,247,0.4)]',
        icon: '',
        card: 'bg-gray-900/60 border-purple-500/40 hover:border-purple-400/60 shadow-[0_0_10px_rgba(168,85,247,0.15)]',
      }
    case 'in_progress':
      return {
        node: 'bg-gradient-to-br from-blue-500 to-cyan-600 border-blue-400/50 animate-pulse',
        icon: '',
        card: 'bg-gray-900/60 border-blue-500/40 shadow-[0_0_10px_rgba(59,130,246,0.2)]',
      }
    case 'cleared':
      return {
        node: 'bg-gradient-to-br from-emerald-500 to-green-600 border-green-400/50 shadow-lg shadow-green-500/20',
        icon: '',
        card: 'bg-gray-900/60 border-green-500/30',
      }
    case 'perfect':
      return {
        node: 'bg-gradient-to-br from-amber-500 to-orange-500 border-amber-400/50 shadow-lg shadow-amber-500/30',
        icon: '',
        card: 'bg-gray-900/60 border-amber-500/30',
      }
    default:
      return {
        node: 'bg-gray-800 border-gray-700',
        icon: 'text-gray-500',
        card: 'bg-gray-900/30 border-gray-800/30 opacity-60',
      }
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4 mb-2">
      <button
        @click="emit('back')"
        class="p-2 rounded-lg bg-gray-800/60 hover:bg-gray-700/60 text-gray-300 hover:text-white transition-all"
      >
        <ArrowLeft :size="20" />
      </button>
      <div v-if="dungeon" class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-2xl" :class="difficultyColors[dungeon.difficulty]">
          {{ dungeon.icon }}
        </div>
        <div>
          <h2 class="text-xl font-bold text-white">{{ dungeon.name }}</h2>
          <p class="text-sm text-gray-500">{{ dungeon.theme }} · 今日 {{ progress?.todayClearCount || 0 }}/{{ dungeon.dailyResetLimit }} 次</p>
        </div>
      </div>
    </div>

    <div class="relative">
      <div class="absolute left-8 top-16 bottom-16 w-0.5 bg-gray-700/50"></div>

      <div class="space-y-4">
        <div
          v-for="(item, index) in stagesWithStatus"
          :key="item.stage.id"
          class="stage-node relative flex items-start gap-6"
        >
          <div class="relative z-10 flex-shrink-0">
            <div
              class="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl border-2 transition-all relative"
              :class="getStatusClasses(item.status, item.isUnlocked).node"
            >
              <template v-if="!item.isUnlocked">
                <Lock class="w-6 h-6 text-gray-500" />
              </template>
              <template v-else-if="item.status === 'cleared'">
                <Check class="w-6 h-6 text-white" />
              </template>
              <template v-else-if="item.status === 'perfect'">
                <Star class="w-6 h-6 text-white fill-white" />
              </template>
              <template v-else>
                {{ item.stage.icon }}
              </template>
              <span class="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-gray-900 border-2 border-gray-700 flex items-center justify-center text-xs font-bold text-gray-300">
                {{ item.stage.order }}
              </span>
            </div>
          </div>

          <div
            class="flex-1 p-5 rounded-xl border-2 transition-all"
            :class="[
              getStatusClasses(item.status, item.isUnlocked).card,
              item.isUnlocked ? 'cursor-pointer' : 'cursor-not-allowed'
            ]"
            @click="item.isUnlocked && emit('select-stage', props.dungeonId, item.stage.id)"
          >
            <div class="flex items-start justify-between mb-3">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="text-lg font-bold text-white">{{ item.stage.name }}</h3>
                  <span class="px-2 py-0.5 rounded-full text-xs font-medium border" :class="difficultyBadgeColors[item.stage.difficulty]">
                    {{ difficultyLabels[item.stage.difficulty] }}
                  </span>
                  <span
                    v-if="item.stage.bossId"
                    class="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30"
                  >
                    <Skull class="w-3 h-3" />
                    BOSS
                  </span>
                </div>
                <p class="text-sm text-gray-400">{{ item.stage.description }}</p>
              </div>

              <div class="flex items-center gap-1">
                <Star
                  v-for="i in 3"
                  :key="i"
                  class="w-5 h-5"
                  :class="i <= item.bestStarRating ? 'text-amber-400 fill-amber-400' : 'text-gray-600'"
                />
              </div>
            </div>

            <div class="flex items-center gap-4 mb-3 text-xs text-gray-500">
              <span class="flex items-center gap-1.5">
                <Swords class="w-3.5 h-3.5" />
                推荐战力 {{ item.stage.recommendedPower }}
              </span>
              <span class="flex items-center gap-1.5">
                <Zap class="w-3.5 h-3.5" />
                体力 {{ item.stage.staminaCost }}
              </span>
              <span v-if="item.clearCount > 0" class="flex items-center gap-1.5">
                <Flame class="w-3.5 h-3.5" />
                通关 {{ item.clearCount }} 次
              </span>
            </div>

            <div class="flex items-center gap-2 flex-wrap">
              <div
                v-for="drop in item.stage.drops.slice(0, 5)"
                :key="drop.id"
                class="flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs"
                :class="[rarityBorders[drop.rarity], rarityColors[drop.rarity]]"
              >
                <span>{{ drop.icon }}</span>
                <span>{{ drop.name }}</span>
              </div>
              <span v-if="item.stage.drops.length > 5" class="text-xs text-gray-600">
                +{{ item.stage.drops.length - 5 }}
              </span>
            </div>

            <div v-if="!item.isUnlocked" class="mt-3 text-xs text-red-400/70">
              <Lock class="w-3 h-3 inline mr-1" />
              {{ item.unmetConditions.join('、') }}
            </div>

            <div v-if="item.isUnlocked" class="mt-3 flex items-center gap-1 text-purple-400 text-xs">
              进入挑战 <ChevronRight class="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stage-node {
  transition: transform 0.2s ease;
}
</style>
