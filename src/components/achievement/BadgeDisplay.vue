<script setup lang="ts">
import { computed } from 'vue'
import type { AchievementRarity } from '@/types/achievement'

const props = defineProps<{
  name: string
  icon: string
  rarity: AchievementRarity
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
}>()

const sizeClasses = {
  sm: 'w-10 h-10 text-xl',
  md: 'w-14 h-14 text-2xl',
  lg: 'w-20 h-20 text-4xl'
}

const rarityColors: Record<string, string> = {
  common: 'from-gray-500 to-gray-600 border-gray-400/50',
  uncommon: 'from-green-500 to-emerald-600 border-green-400/50',
  rare: 'from-blue-500 to-cyan-600 border-blue-400/50',
  epic: 'from-purple-500 to-pink-600 border-purple-400/50',
  legendary: 'from-amber-500 to-orange-600 border-amber-400/50'
}

const rarityGlow: Record<string, string> = {
  common: '',
  uncommon: '',
  rare: 'shadow-blue-500/30',
  epic: 'shadow-purple-500/40',
  legendary: 'shadow-amber-500/50 animate-pulse-glow'
}

const badgeClass = computed(() => {
  const size = props.size || 'md'
  return [
    sizeClasses[size],
    rarityColors[props.rarity],
    rarityGlow[props.rarity]
  ].join(' ')
})
</script>

<template>
  <div class="badge-display flex flex-col items-center gap-1">
    <div
      class="badge-icon rounded-xl flex items-center justify-center bg-gradient-to-br border-2 shadow-lg transition-transform hover:scale-110 cursor-pointer"
      :class="badgeClass"
      :title="name"
    >
      {{ icon }}
    </div>
    <div v-if="showName" class="text-xs text-center text-gray-300 max-w-16 truncate">
      {{ name }}
    </div>
  </div>
</template>

<style scoped>
.animate-pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 10px rgba(245, 158, 11, 0.3);
  }
  50% {
    box-shadow: 0 0 25px rgba(245, 158, 11, 0.6);
  }
}
</style>
