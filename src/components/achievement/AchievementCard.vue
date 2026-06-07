<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Achievement, PlayerAchievement } from '@/types/achievement'
import { Lock, Check, Gift, Coins } from 'lucide-vue-next'

const props = defineProps<{
  achievement: Achievement
  playerAchievement?: PlayerAchievement
}>()

const emit = defineEmits<{
  claim: [achievementId: string]
}>()

const isClaiming = ref(false)

const rarityColors: Record<string, string> = {
  common: 'from-gray-500 to-gray-600',
  uncommon: 'from-green-500 to-emerald-600',
  rare: 'from-blue-500 to-cyan-600',
  epic: 'from-purple-500 to-pink-600',
  legendary: 'from-amber-500 to-orange-600'
}

const rarityBorderColors: Record<string, string> = {
  common: 'border-gray-500/30',
  uncommon: 'border-green-500/30',
  rare: 'border-blue-500/30',
  epic: 'border-purple-500/30',
  legendary: 'border-amber-500/30'
}

const rarityTextColors: Record<string, string> = {
  common: 'text-gray-400',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-amber-400'
}

const rarityNames: Record<string, string> = {
  common: '普通',
  uncommon: '优秀',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说'
}

const isUnlocked = computed(() => props.playerAchievement?.unlocked || false)
const isClaimed = computed(() => props.playerAchievement?.claimed || false)
const canClaim = computed(() => isUnlocked.value && !isClaimed.value)

const progress = computed(() => {
  if (!props.playerAchievement) return 0
  if (props.achievement.condition.target === 0) return 100
  return Math.min(100, (props.playerAchievement.progress / props.achievement.condition.target) * 100)
})

const progressText = computed(() => {
  if (!props.playerAchievement) return '0 / 0'
  return `${Math.min(props.playerAchievement.progress, props.achievement.condition.target)} / ${props.achievement.condition.target}`
})

async function handleClaim() {
  if (!canClaim.value || isClaiming.value) return
  isClaiming.value = true
  await new Promise(resolve => setTimeout(resolve, 300))
  emit('claim', props.achievement.id)
  isClaiming.value = false
}
</script>

<template>
  <div
    class="achievement-card relative rounded-2xl border-2 overflow-hidden transition-all duration-300 hover:scale-[1.02]"
    :class="[
      rarityBorderColors[achievement.rarity],
      isUnlocked ? 'bg-gray-900/80' : 'bg-gray-900/40'
    ]"
  >
    <div
      v-if="isUnlocked"
      class="absolute inset-0 opacity-5 pointer-events-none bg-gradient-to-br"
      :class="rarityColors[achievement.rarity]"
    ></div>

    <div class="p-5 relative z-10">
      <div class="flex items-start gap-4">
        <div
          class="w-16 h-16 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 shadow-lg"
          :class="[
            `bg-gradient-to-br ${rarityColors[achievement.rarity]}`,
            !isUnlocked && 'grayscale opacity-50'
          ]"
        >
          <span v-if="isUnlocked">{{ achievement.icon }}</span>
          <Lock v-else class="w-6 h-6 text-gray-500" />
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span
              class="inline-block px-2 py-0.5 rounded text-xs font-bold text-white"
              :class="`bg-gradient-to-r ${rarityColors[achievement.rarity]}`"
            >
              {{ rarityNames[achievement.rarity] }}
            </span>
            <span
              v-if="isClaimed"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400"
            >
              <Check class="w-3 h-3" />
              已领取
            </span>
            <span
              v-else-if="canClaim"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-amber-500/20 text-amber-400 animate-pulse"
            >
              <Gift class="w-3 h-3" />
              可领取
            </span>
          </div>

          <h3
            class="font-bold text-lg truncate"
            :class="isUnlocked ? 'text-white' : 'text-gray-500'"
          >
            {{ isUnlocked || !achievement.isHidden ? achievement.name : '???' }}
          </h3>

          <p
            class="text-sm line-clamp-2 mb-3"
            :class="isUnlocked ? 'text-gray-400' : 'text-gray-600'"
          >
            {{ isUnlocked || !achievement.isHidden ? achievement.description : '完成隐藏条件解锁' }}
          </p>

          <div v-if="!isUnlocked && !achievement.isHidden" class="mb-3">
            <div class="flex justify-between text-xs mb-1">
              <span class="text-gray-500">进度</span>
              <span :class="rarityTextColors[achievement.rarity]">{{ progressText }}</span>
            </div>
            <div class="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r transition-all duration-500"
                :class="rarityColors[achievement.rarity]"
                :style="{ width: `${progress}%` }"
              ></div>
            </div>
          </div>

          <div
            v-if="isUnlocked && achievement.rewards.length > 0"
            class="flex flex-wrap gap-2 mb-3"
          >
            <div
              v-for="reward in achievement.rewards"
              :key="reward.id"
              class="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-800/50 text-xs"
            >
              <span>{{ reward.icon }}</span>
              <span class="text-gray-300">{{ reward.name }}</span>
              <span
                v-if="typeof reward.value === 'number'"
                class="text-amber-400 font-bold flex items-center gap-0.5"
              >
                <Coins class="w-3 h-3" />
                {{ reward.value.toLocaleString() }}
              </span>
            </div>
          </div>

          <div v-if="isUnlocked && playerAchievement?.unlockedAt" class="text-xs text-gray-600">
            解锁时间：{{ new Date(playerAchievement.unlockedAt).toLocaleDateString() }}
          </div>
        </div>
      </div>

      <button
        v-if="canClaim"
        @click="handleClaim"
        :disabled="isClaiming"
        class="mt-4 w-full py-3 rounded-xl font-bold text-white transition-all duration-300 hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        :class="`bg-gradient-to-r ${rarityColors[achievement.rarity]}`"
      >
        <span v-if="isClaiming" class="flex items-center justify-center gap-2">
          <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          领取中...
        </span>
        <span v-else class="flex items-center justify-center gap-2">
          <Gift class="w-4 h-4" />
          领取奖励
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
