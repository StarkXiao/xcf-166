<script setup lang="ts">
import { computed } from 'vue'
import { useTaskStore } from '@/stores/taskStore'
import { rewardPoolTiers } from '@/game/data/rewardPool'
import { Gift, Trophy, Lock, Unlock, ChevronRight, Zap, Star, Award } from 'lucide-vue-next'

const taskStore = useTaskStore()

const poolPoints = computed(() => taskStore.rewardPoolProgress.points)
const claimedTiers = computed(() => taskStore.rewardPoolProgress.claimedTiers)
const currentTier = computed(() => taskStore.currentPoolTier)
const nextTier = computed(() => taskStore.nextPoolTier)
const progressPercent = computed(() => taskStore.poolProgressPercent)

const rarityColors: Record<string, string> = {
  common: 'from-gray-500 to-gray-600',
  uncommon: 'from-green-500 to-emerald-600',
  rare: 'from-blue-500 to-cyan-600',
  epic: 'from-purple-500 to-violet-600',
  legendary: 'from-amber-500 to-orange-600',
}

const rarityTextColors: Record<string, string> = {
  common: 'text-gray-400',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-amber-400',
}

const rarityBgColors: Record<string, string> = {
  common: 'bg-gray-500/20',
  uncommon: 'bg-green-500/20',
  rare: 'bg-blue-500/20',
  epic: 'bg-purple-500/20',
  legendary: 'bg-amber-500/20',
}

const rarityBorderColors: Record<string, string> = {
  common: 'border-gray-600/40',
  uncommon: 'border-green-600/40',
  rare: 'border-blue-600/40',
  epic: 'border-purple-600/40',
  legendary: 'border-amber-600/40',
}

const rarityGlowColors: Record<string, string> = {
  common: '',
  uncommon: 'shadow-green-500/20',
  rare: 'shadow-blue-500/20',
  epic: 'shadow-purple-500/20',
  legendary: 'shadow-amber-500/20',
}

const highestRarity = computed(() => {
  if (!currentTier.value) return 'common'
  const rarities = currentTier.value.rewards.map(r => r.rarity)
  if (rarities.includes('legendary')) return 'legendary'
  if (rarities.includes('epic')) return 'epic'
  if (rarities.includes('rare')) return 'rare'
  if (rarities.includes('uncommon')) return 'uncommon'
  return 'common'
})

function isClaimed(tierId: string): boolean {
  return claimedTiers.value.includes(tierId)
}

function canClaim(tierId: string, threshold: number): boolean {
  return poolPoints.value >= threshold && !isClaimed(tierId)
}

function isLocked(threshold: number): boolean {
  return poolPoints.value < threshold
}

function remainingPoints(threshold: number): number {
  return threshold - poolPoints.value
}

function handleClaim(tierId: string) {
  taskStore.claimRewardPoolTier(tierId)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-white flex items-center gap-3">
          <Trophy :size="28" class="text-amber-400" />
          联动奖励池
        </h2>
        <p class="text-gray-500 mt-1">完成联动任务积累积分，解锁各档奖励</p>
      </div>
      <div class="text-right">
        <div class="text-sm text-gray-500">当前积分</div>
        <div class="text-2xl font-bold text-amber-400 flex items-center gap-1 justify-end">
          <Star :size="20" class="text-amber-400" />
          {{ poolPoints }}
        </div>
      </div>
    </div>

    <div class="p-5 rounded-2xl bg-gray-900/60 border border-gray-800">
      <div class="flex items-center justify-between mb-3">
        <span class="text-sm text-gray-400">奖池进度</span>
        <span class="text-sm text-amber-400 font-medium">
          {{ poolPoints }} / {{ nextTier ? nextTier.threshold : poolPoints }}
        </span>
      </div>
      <div class="h-3 bg-gray-800 rounded-full overflow-hidden">
        <div
          class="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-700"
          :style="{ width: progressPercent + '%' }"
        ></div>
      </div>
      <div class="flex items-center justify-between mt-2">
        <span class="text-xs text-gray-600">{{ progressPercent.toFixed(1) }}%</span>
        <span v-if="nextTier" class="text-xs text-gray-500 flex items-center gap-1">
          下一档: {{ nextTier.name }}
          <ChevronRight :size="12" />
        </span>
        <span v-else class="text-xs text-amber-400 flex items-center gap-1">
          <Award :size="12" />
          已满档
        </span>
      </div>
    </div>

    <div v-if="nextTier" class="p-5 rounded-2xl border-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10" :class="rarityBorderColors[highestRarity]">
      <div class="flex items-center gap-3 mb-3">
        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/20">
          {{ nextTier.icon }}
        </div>
        <div>
          <div class="font-bold text-white flex items-center gap-2">
            下一档: {{ nextTier.name }}
          </div>
          <div class="text-sm text-gray-400">需要 {{ nextTier.threshold }} 积分</div>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <div
          v-for="reward in nextTier.rewards"
          :key="reward.id"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
          :class="[rarityBgColors[reward.rarity], rarityTextColors[reward.rarity]]"
        >
          <span>{{ reward.icon }}</span>
          <span>{{ reward.name }}</span>
        </div>
      </div>
    </div>

    <div class="space-y-4">
      <div
        v-for="tier in rewardPoolTiers"
        :key="tier.id"
        class="relative rounded-2xl border overflow-hidden transition-all duration-300"
        :class="[
          isClaimed(tier.id)
            ? 'bg-gray-900/40 border-gray-800/50'
            : canClaim(tier.id, tier.threshold)
              ? ['bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/40 shadow-lg', rarityGlowColors[highestRarity]]
              : isLocked(tier.threshold)
                ? 'bg-gray-900/30 border-gray-800/30'
                : 'bg-gray-900/60 border-gray-800'
        ]"
      >
        <div class="p-5">
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <div
                class="w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center text-2xl shadow-lg"
                :class="[
                  isLocked(tier.threshold) ? 'from-gray-700 to-gray-800 opacity-50' : rarityColors[highestRarity],
                  canClaim(tier.id, tier.threshold) ? 'shadow-amber-500/30' : ''
                ]"
              >
                <template v-if="isLocked(tier.threshold)">
                  <Lock :size="24" class="text-gray-500" />
                </template>
                <template v-else>
                  {{ tier.icon }}
                </template>
              </div>
              <div>
                <div class="font-bold text-white text-lg flex items-center gap-2">
                  {{ tier.name }}
                  <span
                    v-if="canClaim(tier.id, tier.threshold)"
                    class="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium animate-pulse"
                  >
                    可领取
                  </span>
                </div>
                <div class="text-sm text-gray-400 flex items-center gap-2">
                  <Star :size="14" class="text-amber-500" />
                  {{ tier.threshold }} 积分解锁
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <template v-if="isClaimed(tier.id)">
                <span class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-sm font-medium">
                  <Award :size="16" />
                  已领取
                </span>
              </template>
              <template v-else-if="canClaim(tier.id, tier.threshold)">
                <button
                  @click="handleClaim(tier.id)"
                  class="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-sm font-bold transition-all shadow-lg shadow-amber-500/30"
                >
                  <Gift :size="16" />
                  领取
                  <Zap :size="14" />
                </button>
              </template>
              <template v-else-if="isLocked(tier.threshold)">
                <span class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 text-gray-500 text-sm">
                  <Lock :size="14" />
                  还差 {{ remainingPoints(tier.threshold) }} 点
                </span>
              </template>
            </div>
          </div>

          <p v-if="!isLocked(tier.threshold)" class="text-sm text-gray-500 mb-3">{{ tier.description }}</p>

          <div class="flex flex-wrap gap-2">
            <div
              v-for="reward in tier.rewards"
              :key="reward.id"
              class="flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all"
              :class="[
                rarityBgColors[reward.rarity],
                rarityBorderColors[reward.rarity],
                isLocked(tier.threshold) ? 'opacity-40' : ''
              ]"
            >
              <span class="text-base">{{ reward.icon }}</span>
              <span class="text-sm font-medium" :class="rarityTextColors[reward.rarity]">{{ reward.name }}</span>
              <span v-if="typeof reward.value === 'number'" class="text-xs text-gray-500">
                x{{ reward.value.toLocaleString() }}
              </span>
              <span
                class="px-1.5 py-0.5 rounded text-[10px] font-medium"
                :class="[rarityBgColors[reward.rarity], rarityTextColors[reward.rarity]]"
              >
                {{ reward.rarity === 'common' ? '普通' : reward.rarity === 'uncommon' ? '优秀' : reward.rarity === 'rare' ? '稀有' : reward.rarity === 'epic' ? '史诗' : '传说' }}
              </span>
            </div>
          </div>
        </div>

        <div
          v-if="isLocked(tier.threshold)"
          class="absolute inset-0 bg-gray-950/60 backdrop-blur-[2px] flex items-center justify-center rounded-2xl"
        >
          <div class="text-center">
            <Lock :size="32" class="text-gray-600 mx-auto mb-2" />
            <div class="text-gray-500 font-medium">{{ tier.name }}</div>
            <div class="text-sm text-gray-600 mt-1">需要 {{ remainingPoints(tier.threshold) }} 积分解锁</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
