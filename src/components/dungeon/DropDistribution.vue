<script setup lang="ts">
import { computed } from 'vue'
import { useDungeonStore } from '@/stores/dungeonStore'
import { getDungeonById, getStageById } from '@/game/data/dungeons'
import type { BattleReward, DropRarity } from '@/types/dungeon'
import { Package, Star, Sparkles, Check } from 'lucide-vue-next'

const props = defineProps<{
  rewards: BattleReward[]
  dungeonId: string
  stageId: string
  starRating: number
}>()

const emit = defineEmits<{
  (e: 'continue'): void
}>()

const dungeon = computed(() => getDungeonById(props.dungeonId))
const stage = computed(() => getStageById(props.dungeonId, props.stageId))

const rarityGradient: Record<DropRarity, string> = {
  common: 'from-gray-500 to-gray-600',
  uncommon: 'from-green-500 to-emerald-600',
  rare: 'from-blue-500 to-cyan-600',
  epic: 'from-purple-500 to-violet-600',
  legendary: 'from-amber-500 to-orange-600',
}

const rarityLabel: Record<DropRarity, string> = {
  common: '普通',
  uncommon: '优秀',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
}

const rarityBorder: Record<DropRarity, string> = {
  common: 'border-gray-500/30',
  uncommon: 'border-green-500/30',
  rare: 'border-blue-500/30',
  epic: 'border-purple-500/30',
  legendary: 'border-amber-500/30',
}

const guaranteedCount = computed(() => props.rewards.filter((r) => r.isGuaranteed).length)
const rareCount = computed(() => props.rewards.filter((r) => r.rarity === 'epic' || r.rarity === 'legendary').length)
</script>

<template>
  <div class="drop-distribution p-6 rounded-2xl border-2 border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent">
    <div class="text-center mb-6">
      <div class="flex justify-center gap-1 mb-4">
        <Star
          v-for="i in 3"
          :key="i"
          class="w-8 h-8"
          :class="i <= starRating ? 'text-amber-400 fill-amber-400' : 'text-gray-600'"
        />
      </div>
      <h3 class="text-2xl font-bold text-white mb-1">挑战成功!</h3>
      <p class="text-gray-400">{{ stage?.name }} · {{ dungeon?.name }}</p>
    </div>

    <div class="flex items-center gap-4 mb-4 justify-center">
      <div class="flex items-center gap-1.5 text-sm text-gray-400">
        <Package class="w-4 h-4" />
        共 {{ rewards.length }} 件
      </div>
      <div class="flex items-center gap-1.5 text-sm text-green-400">
        <Check class="w-4 h-4" />
        保底 {{ guaranteedCount }} 件
      </div>
      <div v-if="rareCount > 0" class="flex items-center gap-1.5 text-sm text-purple-400">
        <Sparkles class="w-4 h-4" />
        稀有 {{ rareCount }} 件
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
      <div
        v-for="(reward, idx) in rewards"
        :key="reward.id"
        class="drop-item flex items-center gap-3 p-4 rounded-xl border-2 transition-all"
        :class="rarityBorder[reward.rarity]"
        :style="{ animationDelay: `${idx * 100}ms` }"
      >
        <div
          class="w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-2xl shadow-lg flex-shrink-0"
          :class="rarityGradient[reward.rarity]"
        >
          {{ reward.itemIcon }}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-sm font-bold text-white truncate">{{ reward.itemName }}</span>
            <span class="px-1.5 py-0.5 rounded text-xs" :class="{
              'bg-gray-500/20 text-gray-400': reward.rarity === 'common',
              'bg-green-500/20 text-green-400': reward.rarity === 'uncommon',
              'bg-blue-500/20 text-blue-400': reward.rarity === 'rare',
              'bg-purple-500/20 text-purple-400': reward.rarity === 'epic',
              'bg-amber-500/20 text-amber-400': reward.rarity === 'legendary',
            }">
              {{ rarityLabel[reward.rarity] }}
            </span>
          </div>
          <div class="text-xs text-gray-500 mt-0.5">
            x{{ reward.quantity }}
            <span v-if="reward.isGuaranteed" class="text-green-400 ml-1">保底</span>
          </div>
        </div>
      </div>
    </div>

    <button
      @click="emit('continue')"
      class="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold hover:shadow-lg hover:shadow-amber-500/30 transition-all active:scale-[0.98]"
    >
      收取奖励
    </button>
  </div>
</template>

<style scoped>
.drop-item {
  animation: dropSlideIn 0.4s ease-out both;
  background: rgba(17, 24, 39, 0.6);
}

@keyframes dropSlideIn {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
