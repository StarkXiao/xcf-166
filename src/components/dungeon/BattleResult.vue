<script setup lang="ts">
import { computed } from 'vue'
import type { BattleRecord, BattleReward } from '@/types/dungeon'
import { Trophy, Star, Heart, Swords, Clock, Gift, RotateCcw, ChevronRight, Skull } from 'lucide-vue-next'

const props = defineProps<{
  record: BattleRecord
  rewards: BattleReward[]
}>()

const emit = defineEmits<{
  (e: 'retry'): void
  (e: 'continue'): void
  (e: 'review-defeat'): void
}>()

const isVictory = computed(() => props.record.result === 'victory')

const hpPercentage = computed(() =>
  props.record.playerMaxHp > 0
    ? Math.round((props.record.playerHp / props.record.playerMaxHp) * 100)
    : 0
)

const formattedDuration = computed(() => {
  const seconds = Math.floor(props.record.duration / 1000)
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
})

const rarityColors: Record<string, string> = {
  common: 'text-gray-300 bg-gray-500/20 border-gray-500/30',
  uncommon: 'text-green-300 bg-green-500/20 border-green-500/30',
  rare: 'text-blue-300 bg-blue-500/20 border-blue-500/30',
  epic: 'text-purple-300 bg-purple-500/20 border-purple-500/30',
  legendary: 'text-amber-300 bg-amber-500/20 border-amber-500/30',
}

const rarityBadgeColors: Record<string, string> = {
  common: 'bg-gray-500/20 text-gray-400',
  uncommon: 'bg-green-500/20 text-green-400',
  rare: 'bg-blue-500/20 text-blue-400',
  epic: 'bg-purple-500/20 text-purple-400',
  legendary: 'bg-amber-500/20 text-amber-400',
}

const rarityLabel: Record<string, string> = {
  common: '普通',
  uncommon: '优秀',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
}

const rarityGradient: Record<string, string> = {
  common: 'from-gray-500 to-gray-600',
  uncommon: 'from-green-500 to-emerald-600',
  rare: 'from-blue-500 to-cyan-600',
  epic: 'from-purple-500 to-violet-600',
  legendary: 'from-amber-500 to-orange-600',
}
</script>

<template>
  <div class="battle-result space-y-6">
    <div
      class="p-8 rounded-2xl border-2"
      :class="isVictory
        ? 'border-amber-500/30 bg-gradient-to-b from-amber-500/10 to-transparent'
        : 'border-red-500/30 bg-gradient-to-b from-red-500/10 to-transparent'"
    >
      <div class="text-center mb-6">
        <div v-if="isVictory" class="victory-header mb-4">
          <Trophy class="w-16 h-16 text-amber-400 mx-auto mb-2" />
          <h2
            class="text-5xl font-black tracking-wider shimmer-text text-amber-400"
          >
            VICTORY
          </h2>
        </div>
        <div v-else class="defeat-header mb-4">
          <Skull class="w-16 h-16 text-red-400 mx-auto mb-2" />
          <h2 class="text-5xl font-black tracking-wider text-red-400">
            DEFEAT
          </h2>
        </div>
      </div>

      <div v-if="isVictory" class="flex justify-center gap-3 mb-6">
        <Star
          v-for="i in 3"
          :key="i"
          class="w-10 h-10 transition-all duration-500 star-fill"
          :class="i <= record.starRating ? 'text-amber-400 fill-amber-400 scale-110' : 'text-gray-600'"
          :style="{ transitionDelay: `${i * 200}ms` }"
        />
      </div>

      <div class="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div class="p-4 rounded-xl bg-gray-900/60 border border-gray-700/50 text-center">
          <Swords class="w-5 h-5 text-purple-400 mx-auto mb-1" />
          <div class="text-xs text-gray-500 mb-1">回合数</div>
          <div class="text-xl font-bold text-purple-400">{{ record.turnsElapsed }}</div>
        </div>
        <div class="p-4 rounded-xl bg-gray-900/60 border border-gray-700/50 text-center">
          <Clock class="w-5 h-5 text-blue-400 mx-auto mb-1" />
          <div class="text-xs text-gray-500 mb-1">战斗时长</div>
          <div class="text-xl font-bold text-blue-400">{{ formattedDuration }}</div>
        </div>
        <div class="p-4 rounded-xl bg-gray-900/60 border border-gray-700/50 text-center">
          <Swords class="w-5 h-5 text-red-400 mx-auto mb-1" />
          <div class="text-xs text-gray-500 mb-1">造成伤害</div>
          <div class="text-xl font-bold text-red-400">{{ record.totalDamageDealt }}</div>
        </div>
        <div class="p-4 rounded-xl bg-gray-900/60 border border-gray-700/50 text-center">
          <Swords class="w-5 h-5 text-orange-400 mx-auto mb-1" />
          <div class="text-xs text-gray-500 mb-1">承受伤害</div>
          <div class="text-xl font-bold text-orange-400">{{ record.totalDamageTaken }}</div>
        </div>
        <div class="p-4 rounded-xl bg-gray-900/60 border border-gray-700/50 text-center col-span-2 md:col-span-1">
          <Heart class="w-5 h-5 mx-auto mb-1" :class="hpPercentage > 50 ? 'text-green-400' : hpPercentage > 0 ? 'text-yellow-400' : 'text-red-400'" />
          <div class="text-xs text-gray-500 mb-1">剩余生命</div>
          <div class="text-xl font-bold" :class="hpPercentage > 50 ? 'text-green-400' : hpPercentage > 0 ? 'text-yellow-400' : 'text-red-400'">
            {{ hpPercentage }}%
          </div>
        </div>
      </div>

      <div v-if="record.synergyBonus && record.synergyBonus.names.length > 0" class="mb-6 p-4 rounded-xl bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30">
        <h3 class="text-sm font-bold text-green-400 mb-2 flex items-center gap-2">
          <span>🔗</span>
          组合加成生效
        </h3>
        <div class="flex flex-wrap gap-2 mb-2">
          <span
            v-for="name in record.synergyBonus.names"
            :key="name"
            class="px-2 py-1 bg-green-900/50 rounded text-xs text-green-300 border border-green-500/20"
          >
            {{ name }}
          </span>
        </div>
        <div class="flex flex-wrap gap-3 text-xs text-gray-400">
          <span v-if="record.synergyBonus.totalBonus.processingSpeed > 0" class="text-green-400">处理速度+{{ record.synergyBonus.totalBonus.processingSpeed }}%</span>
          <span v-if="record.synergyBonus.totalBonus.sanityProtection > 0" class="text-blue-400">理智保护+{{ record.synergyBonus.totalBonus.sanityProtection }}%</span>
          <span v-if="record.synergyBonus.totalBonus.rewardMultiplier > 0" class="text-yellow-400">奖励加成+{{ record.synergyBonus.totalBonus.rewardMultiplier }}%</span>
          <span v-if="record.synergyBonus.totalBonus.anomalyResistance > 0" class="text-purple-400">异常抵抗+{{ record.synergyBonus.totalBonus.anomalyResistance }}%</span>
          <span v-if="record.synergyBonus.totalBonus.successRateBonus > 0" class="text-emerald-400">成功率+{{ record.synergyBonus.totalBonus.successRateBonus }}%</span>
        </div>
      </div>

      <div v-if="isVictory && rewards.length > 0" class="mb-6">
        <h3 class="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <Gift class="w-5 h-5 text-amber-400" />
          战斗奖励
        </h3>
        <TransitionGroup name="reward-item" tag="div" class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            v-for="(reward, idx) in rewards"
            :key="reward.id"
            class="flex items-center gap-3 p-3 rounded-xl border"
            :class="rarityColors[reward.rarity]"
            :style="{ transitionDelay: `${idx * 100}ms` }"
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
                <span
                  class="px-1.5 py-0.5 rounded text-xs"
                  :class="rarityBadgeColors[reward.rarity]"
                >
                  {{ rarityLabel[reward.rarity] }}
                </span>
              </div>
              <div class="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                <span>x{{ reward.quantity }}</span>
                <span v-if="reward.isGuaranteed" class="px-1.5 py-0.5 rounded text-xs bg-green-500/20 text-green-400 font-bold">必得</span>
              </div>
            </div>
          </div>
        </TransitionGroup>
      </div>

      <div v-if="isVictory" class="mb-6 p-3 rounded-xl bg-gray-800/40 border border-gray-700/30 text-center">
        <p class="text-xs text-gray-500">
          满血通关=3星, 50%以上=2星, 50%以下=1星
        </p>
      </div>

      <div v-if="!isVictory" class="mb-6">
        <div class="p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-4">
          <p class="text-red-300 text-center">挑战失败，不要气馁，调整策略再次尝试吧！</p>
        </div>
        <button
          @click="emit('review-defeat')"
          class="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-bold hover:bg-red-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          失败复盘
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>

      <div class="flex justify-center gap-4">
        <button
          @click="emit('retry')"
          class="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 text-white font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all active:scale-95 flex items-center gap-2"
        >
          <RotateCcw class="w-4 h-4" />
          再次挑战
        </button>
        <button
          @click="emit('continue')"
          class="px-6 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-bold transition-all active:scale-95"
        >
          返回
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.battle-result {
  animation: fadeInScale 0.5s ease-out;
}

@keyframes fadeInScale {
  0% {
    opacity: 0;
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.shimmer-text {
  background: linear-gradient(
    90deg,
    #fbbf24 0%,
    #fde68a 25%,
    #fffbeb 50%,
    #fde68a 75%,
    #fbbf24 100%
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shimmer 2s linear infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.victory-header {
  animation: glowPulse 2s ease-in-out infinite;
}

@keyframes glowPulse {
  0%,
  100% {
    filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.4));
  }
  50% {
    filter: drop-shadow(0 0 20px rgba(251, 191, 36, 0.8));
  }
}

.star-fill {
  filter: drop-shadow(0 0 4px rgba(251, 191, 36, 0.6));
}

.reward-item-enter-active {
  transition: all 0.4s ease-out;
}

.reward-item-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.reward-item-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
}
</style>
