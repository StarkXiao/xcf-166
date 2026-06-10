<script setup lang="ts">
import { computed } from 'vue'
import type { RedDotPriority } from '@/types/redDot'
import { RED_DOT_PRIORITY_COLORS } from '@/types/redDot'

const props = withDefaults(defineProps<{
  count?: number
  showZero?: boolean
  maxCount?: number
  priority?: RedDotPriority
  dotOnly?: boolean
  pulse?: boolean
  size?: 'sm' | 'md' | 'lg'
  color?: string
}>(), {
  count: 0,
  showZero: false,
  maxCount: 99,
  priority: 'normal',
  dotOnly: false,
  pulse: true,
  size: 'md',
})

const displayCount = computed(() => {
  if (props.count > props.maxCount) {
    return `${props.maxCount}+`
  }
  return props.count.toString()
})

const shouldShow = computed(() => {
  if (props.dotOnly) return true
  if (props.showZero) return true
  return props.count > 0
})

const badgeColor = computed(() => {
  if (props.color) return props.color
  return RED_DOT_PRIORITY_COLORS[props.priority] || 'bg-red-500'
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return props.dotOnly
        ? 'w-2 h-2'
        : 'min-w-[16px] h-4 px-1 text-[10px]'
    case 'lg':
      return props.dotOnly
        ? 'w-3.5 h-3.5'
        : 'min-w-[24px] h-6 px-1.5 text-sm'
    case 'md':
    default:
      return props.dotOnly
        ? 'w-2.5 h-2.5'
        : 'min-w-[20px] h-5 px-1.5 text-xs'
  }
})
</script>

<template>
  <span
    v-if="shouldShow"
    class="inline-flex items-center justify-center rounded-full text-white font-bold shadow-lg"
    :class="[
      sizeClasses,
      badgeColor,
      pulse && !dotOnly ? 'animate-pulse' : '',
    ]"
  >
    <span v-if="!dotOnly">{{ displayCount }}</span>
  </span>
</template>
