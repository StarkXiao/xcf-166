<script setup lang="ts">
import { ref } from 'vue'
import type { SeasonReward } from '@/types/season'
import { useSeasonStore } from '@/stores/seasonStore'
import { Gift, Coins, Crown, Medal, Palette, Award, Scroll, Sparkles, Moon, Star, Check } from 'lucide-vue-next'

const props = defineProps<{
  reward: SeasonReward
  source: 'level' | 'task' | 'rank'
  canClaim: boolean
}>()

const seasonStore = useSeasonStore()
const isClaiming = ref(false)
const isClaimed = ref(seasonStore.isRewardClaimed(props.reward.id))

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
  common: 'border-gray-500/40',
  uncommon: 'border-green-500/40',
  rare: 'border-blue-500/40',
  epic: 'border-purple-500/40',
  legendary: 'border-amber-500/40',
}

const rarityBgGlow: Record<string, string> = {
  common: 'shadow-gray-500/20',
  uncommon: 'shadow-green-500/20',
  rare: 'shadow-blue-500/20',
  epic: 'shadow-purple-500/20',
  legendary: 'shadow-amber-500/30',
}

const rarityTextColors: Record<string, string> = {
  common: 'text-gray-400',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-amber-400',
}

async function handleClaim() {
  if (!props.canClaim || isClaiming.value || isClaimed.value) return

  isClaiming.value = true
  await new Promise((resolve) => setTimeout(resolve, 500))

  if (props.source === 'level') {
    seasonStore.claimLevelReward(props.reward.level)
  } else if (props.source === 'rank') {
    seasonStore.claimRankReward(props.reward.id)
  }

  isClaimed.value = true
  isClaiming.value = false
}
</script>

<template>
  <div
    class="reward-card relative p-5 rounded-2xl border-2 transition-all duration-500 overflow-hidden"
    :class="[
      rarityBorderColors[reward.rarity],
      {
        'bg-gray-900/60 hover:bg-gray-900/80': canClaim && !isClaimed,
        'bg-gray-800/40 opacity-60': isClaimed,
      },
    ]"
  >
    <div class="absolute inset-0 pointer-events-none">
      <div
        v-if="canClaim && !isClaimed"
        class="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500"
        :class="`bg-gradient-to-br ${rarityColors[reward.rarity]}`"
        style="opacity: 0.05"
      ></div>
    </div>

    <div v-if="canClaim && !isClaimed" class="absolute -top-10 -right-10 w-32 h-32 rounded-full pointer-events-none animate-pulse-slow"
         :class="`bg-gradient-to-br ${rarityColors[reward.rarity]} opacity-20 blur-2xl`"></div>

    <div class="relative z-10">
      <div class="flex items-start justify-between mb-4">
        <div
          class="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
          :class="[`bg-gradient-to-br ${rarityColors[reward.rarity]}`, rarityBgGlow[reward.rarity], canClaim && !isClaimed ? 'animate-float' : '']"
        >
          <component :is="RewardIcon" :size="32" class="text-white" />
        </div>

        <span
          class="px-2.5 py-1 rounded-full text-xs font-bold"
          :class="[`bg-gradient-to-r ${rarityColors[reward.rarity]}`, 'text-white']"
        >
          {{
            reward.rarity === 'common'
              ? '普通'
              : reward.rarity === 'uncommon'
              ? '优秀'
              : reward.rarity === 'rare'
              ? '稀有'
              : reward.rarity === 'epic'
              ? '史诗'
              : '传说'
          }}
        </span>
      </div>

      <h3 class="text-lg font-bold text-white mb-1 truncate">{{ reward.name }}</h3>
      <p class="text-sm text-gray-500 mb-3 line-clamp-2 h-10">{{ reward.description }}</p>

      <div v-if="reward.type === 'currency' && typeof reward.value === 'number'" class="mb-4 p-3 rounded-xl bg-gray-800/50 border border-gray-700/30">
        <div class="flex items-center justify-center gap-2">
          <Coins :size="20" class="text-amber-400" />
          <span class="text-xl font-bold text-amber-400">{{ reward.value.toLocaleString() }}</span>
          <span class="text-gray-500">金钱</span>
        </div>
      </div>

      <div v-else class="mb-4 p-3 rounded-xl bg-gray-800/50 border border-gray-700/30">
        <div class="flex items-center justify-center gap-2">
          <span class="text-sm" :class="rarityTextColors[reward.rarity]">
            {{ reward.type === 'item' ? '道具' : reward.type === 'title' ? '称号' : reward.type === 'badge' ? '徽章' : '外观' }}
          </span>
        </div>
      </div>

      <button
        v-if="canClaim && !isClaimed"
        @click="handleClaim"
        :disabled="isClaiming"
        class="reward-claim-btn w-full py-3 rounded-xl font-bold text-white transition-all duration-300 hover:shadow-lg active:scale-95 disabled:opacity-50"
        :class="`bg-gradient-to-r ${rarityColors[reward.rarity]}`"
      >
        <span v-if="isClaiming" class="flex items-center justify-center gap-2">
          <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          领取中
        </span>
        <span v-else class="flex items-center justify-center gap-2">
          <Gift :size="18" />
          立即领取
        </span>
      </button>

      <div v-else-if="isClaimed" class="w-full py-3 rounded-xl bg-green-500/20 text-green-400 font-bold text-center flex items-center justify-center gap-2">
        <Check :size="18" />
        已领取
      </div>

      <div v-else class="w-full py-3 rounded-xl bg-gray-700/30 text-gray-500 font-medium text-center">
        不可领取
      </div>
    </div>
  </div>
</template>

<style scoped>
.reward-card {
  position: relative;
  transform-style: preserve-3d;
}

.reward-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.3s;
}

.reward-card:hover::after {
  opacity: 1;
}

.reward-card:hover {
  transform: translateY(-4px);
}

.reward-claim-btn {
  position: relative;
  overflow: hidden;
}

.reward-claim-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transform: translateX(-100%);
  transition: transform 0.6s;
}

.reward-claim-btn:hover::before {
  transform: translateX(100%);
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.animate-pulse-slow {
  animation: pulse-slow 3s ease-in-out infinite;
}

@keyframes pulse-slow {
  0%, 100% { opacity: 0.1; transform: scale(1); }
  50% { opacity: 0.3; transform: scale(1.1); }
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
