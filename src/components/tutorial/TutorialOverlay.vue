<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps<{
  targetSelector?: string
  show: boolean
  padding?: number
  rounded?: boolean
}>()

const emit = defineEmits<{
  (e: 'click'): void
}>()

const highlightRect = ref<DOMRect | null>(null)
const animationFrame = ref<number | null>(null)

const padding = computed(() => props.padding ?? 8)
const rounded = computed(() => props.rounded ?? true)

const highlightStyle = computed(() => {
  if (!highlightRect.value) return {}

  return {
    left: `${highlightRect.value.left - padding.value}px`,
    top: `${highlightRect.value.top - padding.value}px`,
    width: `${highlightRect.value.width + padding.value * 2}px`,
    height: `${highlightRect.value.height + padding.value * 2}px`,
    borderRadius: rounded.value ? '12px' : '0'
  }
})

const cutoutStyle = computed(() => {
  if (!highlightRect.value) return {}

  return {
    clipPath: `polygon(
      0% 0%,
      0% 100%,
      ${highlightRect.value.left - padding.value}px 100%,
      ${highlightRect.value.left - padding.value}px ${highlightRect.value.top - padding.value}px,
      ${highlightRect.value.right + padding.value}px ${highlightRect.value.top - padding.value}px,
      ${highlightRect.value.right + padding.value}px ${highlightRect.value.bottom + padding.value}px,
      ${highlightRect.value.left - padding.value}px ${highlightRect.value.bottom + padding.value}px,
      ${highlightRect.value.left - padding.value}px 100%,
      100% 100%,
      100% 0%
    )`
  }
})

function updateHighlight() {
  if (!props.targetSelector || !props.show) {
    highlightRect.value = null
    return
  }

  const element = document.querySelector(props.targetSelector)
  if (element) {
    highlightRect.value = element.getBoundingClientRect()
  } else {
    highlightRect.value = null
  }
}

function startAnimationLoop() {
  function loop() {
    updateHighlight()
    animationFrame.value = requestAnimationFrame(loop)
  }
  animationFrame.value = requestAnimationFrame(loop)
}

function stopAnimationLoop() {
  if (animationFrame.value) {
    cancelAnimationFrame(animationFrame.value)
    animationFrame.value = null
  }
}

watch(
  () => [props.show, props.targetSelector],
  ([show]) => {
    if (show) {
      updateHighlight()
      startAnimationLoop()
    } else {
      stopAnimationLoop()
      highlightRect.value = null
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (props.show) {
    updateHighlight()
    startAnimationLoop()
  }
})

onUnmounted(() => {
  stopAnimationLoop()
})

function handleOverlayClick() {
  emit('click')
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="tutorial-overlay fixed inset-0 z-50 pointer-events-none"
    >
      <template v-if="targetSelector && highlightRect">
        <div
          class="absolute bg-black/60 backdrop-blur-sm pointer-events-auto cursor-pointer transition-opacity duration-300"
          :style="{
            left: 0,
            top: 0,
            right: 0,
            height: `${highlightRect.top - padding}px`
          }"
          @click="handleOverlayClick"
        />
        <div
          class="absolute bg-black/60 backdrop-blur-sm pointer-events-auto cursor-pointer transition-opacity duration-300"
          :style="{
            left: 0,
            top: `${highlightRect.bottom + padding}px`,
            right: 0,
            bottom: 0
          }"
          @click="handleOverlayClick"
        />
        <div
          class="absolute bg-black/60 backdrop-blur-sm pointer-events-auto cursor-pointer transition-opacity duration-300"
          :style="{
            left: 0,
            top: `${highlightRect.top - padding}px`,
            width: `${highlightRect.left - padding}px`,
            height: `${highlightRect.height + padding * 2}px`
          }"
          @click="handleOverlayClick"
        />
        <div
          class="absolute bg-black/60 backdrop-blur-sm pointer-events-auto cursor-pointer transition-opacity duration-300"
          :style="{
            left: `${highlightRect.right + padding}px`,
            top: `${highlightRect.top - padding}px`,
            right: 0,
            height: `${highlightRect.height + padding * 2}px`
          }"
          @click="handleOverlayClick"
        />
      </template>
      <div
        v-else
        class="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto cursor-pointer transition-opacity duration-300"
        @click="handleOverlayClick"
      />

      <div
        v-if="targetSelector && highlightRect"
        class="absolute pointer-events-none transition-all duration-300"
        :style="highlightStyle"
      >
        <div class="absolute inset-0 rounded-xl ring-4 ring-amber-400 ring-opacity-80 animate-pulse" />
        <div class="absolute inset-0 rounded-xl shadow-2xl shadow-amber-400/30" />
        <div class="absolute -inset-1 rounded-xl bg-gradient-to-r from-amber-400/20 via-transparent to-amber-400/20 animate-[shimmer_2s_infinite]" />
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
@keyframes shimmer {
  0% {
    opacity: 0;
    transform: translateX(-100%);
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateX(100%);
  }
}
</style>
