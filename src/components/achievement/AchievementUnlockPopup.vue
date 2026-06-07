<script setup lang="ts">
import { computed } from 'vue'
import type { Achievement } from '@/types/achievement'
import { Trophy, Star, Sparkles } from 'lucide-vue-next'

const props = defineProps<{
  achievement: Achievement | null
  show: boolean
}>()

const rarityColors: Record<string, string> = {
  common: 'from-gray-500 to-gray-600',
  uncommon: 'from-green-500 to-emerald-600',
  rare: 'from-blue-500 to-cyan-600',
  epic: 'from-purple-500 to-pink-600',
  legendary: 'from-amber-500 to-orange-600'
}

const rarityBorderGlow: Record<string, string> = {
  common: 'shadow-gray-500/50',
  uncommon: 'shadow-green-500/50',
  rare: 'shadow-blue-500/50',
  epic: 'shadow-purple-500/50',
  legendary: 'shadow-amber-500/50'
}

const rarityNames: Record<string, string> = {
  common: '普通成就',
  uncommon: '优秀成就',
  rare: '稀有成就',
  epic: '史诗成就',
  legendary: '传说成就'
}

const gradientClass = computed(() => {
  if (!props.achievement) return ''
  return rarityColors[props.achievement.rarity] || rarityColors.common
})

const glowClass = computed(() => {
  if (!props.achievement) return ''
  return rarityBorderGlow[props.achievement.rarity] || rarityBorderGlow.common
})
</script>

<template>
  <Transition name="achievement-unlock">
    <div
      v-if="show && achievement"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
    >
      <div
        class="achievement-popup relative p-8 rounded-3xl text-center max-w-md mx-4 animate-achievement-bounce"
        :class="`shadow-2xl ${glowClass}`"
      >
        <div class="absolute inset-0 rounded-3xl overflow-hidden">
          <div
            class="absolute inset-0 bg-gradient-to-br opacity-30"
            :class="gradientClass"
          ></div>
          <div class="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-white/10 animate-pulse-slow"></div>
          <div class="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/10 animate-pulse-slow" style="animation-delay: 0.5s;"></div>
        </div>

        <div class="relative z-10">
          <div class="flex items-center justify-center gap-2 mb-4">
            <Sparkles class="w-6 h-6 text-amber-400 animate-spin-slow" />
            <span class="text-lg font-bold text-amber-400">成就解锁</span>
            <Sparkles class="w-6 h-6 text-amber-400 animate-spin-slow" style="animation-direction: reverse;" />
          </div>

          <div
            class="w-24 h-24 mx-auto rounded-2xl flex items-center justify-center text-5xl mb-4 shadow-lg"
            :class="`bg-gradient-to-br ${gradientClass}`"
          >
            {{ achievement.icon }}
          </div>

          <div
            class="inline-block px-4 py-1 rounded-full text-sm font-bold mb-3 text-white"
            :class="`bg-gradient-to-r ${gradientClass}`"
          >
            {{ rarityNames[achievement.rarity] }}
          </div>

          <h2 class="text-3xl font-bold text-white mb-2">{{ achievement.name }}</h2>
          <p class="text-gray-300 mb-6">{{ achievement.description }}</p>

          <div v-if="achievement.rewards.length > 0" class="bg-black/30 rounded-xl p-4 mb-4">
            <div class="text-sm text-gray-400 mb-2">🎁 奖励</div>
            <div class="flex flex-wrap justify-center gap-2">
              <div
                v-for="reward in achievement.rewards"
                :key="reward.id"
                class="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-lg"
              >
                <span class="text-lg">{{ reward.icon }}</span>
                <span class="text-sm text-white">{{ reward.name }}</span>
                <span v-if="typeof reward.value === 'number'" class="text-amber-400 font-bold">
                  {{ reward.value.toLocaleString() }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-center gap-2 text-gray-400 text-sm">
            <Trophy class="w-4 h-4" />
            <span>点击任意位置关闭</span>
          </div>
        </div>

        <div class="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
          <div v-for="i in 8" :key="i" class="absolute animate-float">
            <Star
              class="w-4 h-4 text-amber-400/60"
              :style="{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }"
            />
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.achievement-unlock-enter-active,
.achievement-unlock-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.achievement-unlock-enter-from,
.achievement-unlock-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.animate-achievement-bounce {
  animation: achievement-bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes achievement-bounce {
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.animate-pulse-slow {
  animation: pulse-slow 3s ease-in-out infinite;
}

@keyframes pulse-slow {
  0%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.1);
  }
}

.animate-spin-slow {
  animation: spin-slow 4s linear infinite;
}

@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
    opacity: 0.4;
  }
  50% {
    transform: translateY(-10px) rotate(180deg);
    opacity: 0.8;
  }
}
</style>
