<script setup lang="ts">
import { ref } from 'vue'
import type { SeasonReward } from '@/types/season'
import { useSeasonStore } from '@/stores/seasonStore'
import { Star, Lock, Check, Gift, Coins, Crown, Medal, Palette, Award, Scroll, Sparkles, Moon } from 'lucide-vue-next'

const props = defineProps<{
  reward: SeasonReward
  currentLevel: number
  isClaimed: boolean
}>()

const seasonStore = useSeasonStore()
const isClaiming = ref(false)

const isUnlocked = props.currentLevel >= props.reward.level
const canClaim = isUnlocked && !props.isClaimed

const iconMap: Record<string, any> = {
  Gift,
  Coins,
  Crown,
  Medal,
  Palette,
  Award,
  Scroll,
  Sparkles,
  Moon,
  Star,
}

const RewardIcon = iconMap[props.reward.icon] || Gift

const rarityColors: Record<string, string> = {
  common: 'from-gray-500 to-gray-600',
  uncommon: 'from-green-500 to-emerald-600',
  rare: 'from-blue-500 to-cyan-600',
  epic: 'from-purple-500 to-pink-600',
  legendary: 'from-amber-500 to-orange-600',
}

const rarityBorderColors: Record<string, string> = {
  common: 'border-gray-500/30',
  uncommon: 'border-green-500/30',
  rare: 'border-blue-500/30',
  epic: 'border-purple-500/30',
  legendary: 'border-amber-500/30',
}

const rarityBgColors: Record<string, string> = {
  common: 'bg-gray-500/10',
  uncommon: 'bg-green-500/10',
  rare: 'bg-blue-500/10',
  epic: 'bg-purple-500/10',
  legendary: 'bg-amber-500/10',
}

const rarityTextColors: Record<string, string> = {
  common: 'text-gray-400',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-amber-400',
}

async function handleClaim() {
  if (!canClaim || isClaiming.value) return

  isClaiming.value = true
  await new Promise((resolve) => setTimeout(resolve, 500))

  seasonStore.claimLevelReward(props.reward.level)
  isClaiming.value = false
}
</script>

<template>
  <div
    class="milestone-item relative flex items-center gap-4 p-4 rounded-xl transition-all duration-300"
    :class="[
      rarityBorderColors[reward.rarity],
      {
        [rarityBgColors[reward.rarity]]: isUnlocked,
        'bg-gray-800/30 border-gray-700/30 opacity-60': !isUnlocked,
        'animate-pulse-glow': canClaim,
      },
    ]"
  >
    <div class="relative">
      <div
        class="w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300"
        :class="[
          isUnlocked
            ? `bg-gradient-to-br ${rarityColors[reward.rarity]} shadow-lg`
            : 'bg-gray-700',
          canClaim ? 'animate-pulse-slow' : '',
        ]"
        :style="canClaim ? `box-shadow: 0 0 30px ${reward.rarity === 'legendary' ? 'rgba(251, 191, 36, 0.5)' : 'rgba(139, 92, 246, 0.4)'}` : ''"
      >
        <component
          v-if="isUnlocked"
          :is="RewardIcon"
          :size="28"
          class="text-white"
        />
        <Lock v-else :size="24" class="text-gray-500" />
      </div>

      <div
        class="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
        :class="{
          'bg-green-500 text-white': isClaimed,
          'bg-purple-600 text-white': canClaim,
          'bg-gray-700 text-gray-400': !isUnlocked,
        }"
      >
        <Check v-if="isClaimed" :size="14" />
        <span v-else>Lv.{{ reward.level }}</span>
      </div>
    </div>

    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 mb-1">
        <h4 class="font-bold text-white truncate">{{ reward.name }}</h4>
        <span
          class="px-2 py-0.5 rounded text-xs font-medium"
          :class="[rarityBgColors[reward.rarity], rarityTextColors[reward.rarity]]"
        >
          {{ reward.rarity === 'common' ? '普通' : reward.rarity === 'uncommon' ? '优秀' : reward.rarity === 'rare' ? '稀有' : reward.rarity === 'epic' ? '史诗' : '传说' }}
        </span>
      </div>
      <p class="text-sm text-gray-500 truncate">{{ reward.description }}</p>
      <div v-if="reward.type === 'currency' && typeof reward.value === 'number'" class="text-sm text-amber-400 mt-1">
        💰 {{ reward.value.toLocaleString() }} 金钱
      </div>
    </div>

    <div class="flex-shrink-0">
      <button
        v-if="canClaim"
        @click="handleClaim"
        :disabled="isClaiming"
        class="milestone-claim-btn px-5 py-2 rounded-xl bg-gradient-to-r font-bold text-white text-sm transition-all duration-300 hover:shadow-lg active:scale-95 disabled:opacity-50"
        :class="rarityColors[reward.rarity]"
      >
        <span v-if="isClaiming" class="flex items-center gap-2">
          <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          领取中
        </span>
        <span v-else class="flex items-center gap-2">
          <Gift :size="16" />
          领取
        </span>
      </button>

      <div v-else-if="isClaimed" class="px-5 py-2 rounded-xl bg-green-500/20 text-green-400 font-medium text-sm flex items-center gap-2">
        <Check :size="16" />
        已领取
      </div>

      <div v-else class="px-5 py-2 rounded-xl bg-gray-700/30 text-gray-500 font-medium text-sm">
        Lv.{{ reward.level }} 解锁
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 15px rgba(139, 92, 246, 0.2);
  }
  50% {
    box-shadow: 0 0 30px rgba(139, 92, 246, 0.4);
  }
}

.animate-pulse-slow {
  animation: pulse-slow 2s ease-in-out infinite;
}

@keyframes pulse-slow {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.milestone-item {
  position: relative;
}

.milestone-item::before {
  content: '';
  position: absolute;
  left: 31px;
  top: 100%;
  width: 2px;
  height: 8px;
  background: linear-gradient(to bottom, rgba(139, 92, 246, 0.3), transparent);
}

.milestone-item:last-child::before {
  display: none;
}
</style>
