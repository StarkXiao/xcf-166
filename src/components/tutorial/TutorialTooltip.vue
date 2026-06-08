<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { ChevronRight, ChevronLeft, X, SkipForward } from 'lucide-vue-next'
import type { TutorialStep } from '@/types/tutorial'

const props = defineProps<{
  step: TutorialStep | null
  show: boolean
  totalSteps: number
  currentStepIndex: number
  canSkip: boolean
  isMandatory: boolean
  phaseProgress: number
  totalProgress: number
}>()

const emit = defineEmits<{
  (e: 'next'): void
  (e: 'skip'): void
  (e: 'skipPhase'): void
  (e: 'close'): void
}>()

const tooltipRect = ref<DOMRect | null>(null)
const targetRect = ref<DOMRect | null>(null)
const animationFrame = ref<number | null>(null)

const positionStyle = computed(() => {
  if (!props.step?.targetSelector || props.step.actionType === 'show_modal') {
    return {
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      position: 'fixed' as const
    }
  }

  if (!targetRect.value) return { display: 'none' }

  const tooltipWidth = 380
  const tooltipHeight = 200
  const offset = 16
  const position = props.step.position || 'right'

  let left = 0
  let top = 0
  let transform = ''

  switch (position) {
    case 'top':
      left = targetRect.value.left + targetRect.value.width / 2
      top = targetRect.value.top - offset
      transform = 'translate(-50%, -100%)'
      break
    case 'bottom':
      left = targetRect.value.left + targetRect.value.width / 2
      top = targetRect.value.bottom + offset
      transform = 'translate(-50%, 0)'
      break
    case 'left':
      left = targetRect.value.left - offset
      top = targetRect.value.top + targetRect.value.height / 2
      transform = 'translate(-100%, -50%)'
      break
    case 'right':
    default:
      left = targetRect.value.right + offset
      top = targetRect.value.top + targetRect.value.height / 2
      transform = 'translate(0, -50%)'
      break
  }

  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  if (position === 'right' && left + tooltipWidth > viewportWidth - 16) {
    left = targetRect.value.left - offset
    transform = 'translate(-100%, -50%)'
  } else if (position === 'left' && left - tooltipWidth < 16) {
    left = targetRect.value.right + offset
    transform = 'translate(0, -50%)'
  }

  if (position === 'bottom' && top + tooltipHeight > viewportHeight - 16) {
    top = targetRect.value.top - offset
    transform = 'translate(-50%, -100%)'
  } else if (position === 'top' && top - tooltipHeight < 16) {
    top = targetRect.value.bottom + offset
    transform = 'translate(-50%, 0)'
  }

  if (left < 16) left = 16
  if (top < 16) top = 16
  if (left + tooltipWidth > viewportWidth - 16) left = viewportWidth - tooltipWidth - 16
  if (top + tooltipHeight > viewportHeight - 16) top = viewportHeight - tooltipHeight - 16

  return {
    left: `${left}px`,
    top: `${top}px`,
    transform,
    position: 'fixed' as const
  }
})

const arrowPosition = computed(() => {
  if (!props.step?.targetSelector || props.step.actionType === 'show_modal') {
    return null
  }
  return props.step.position || 'right'
})

const isModal = computed(() => {
  return props.step?.actionType === 'show_modal' || !props.step?.targetSelector
})

const formattedDescription = computed(() => {
  if (!props.step?.description) return ''
  return props.step.description
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-amber-400">$1</strong>')
    .replace(/\n/g, '<br />')
})

function updateTargetPosition() {
  if (!props.step?.targetSelector || !props.show) {
    targetRect.value = null
    return
  }

  const element = document.querySelector(props.step.targetSelector)
  if (element) {
    targetRect.value = element.getBoundingClientRect()
  }
}

function startAnimationLoop() {
  function loop() {
    updateTargetPosition()
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
  () => [props.show, props.step?.targetSelector],
  ([show]) => {
    if (show) {
      updateTargetPosition()
      startAnimationLoop()
    } else {
      stopAnimationLoop()
      targetRect.value = null
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (props.show) {
    updateTargetPosition()
    startAnimationLoop()
  }
})

onUnmounted(() => {
  stopAnimationLoop()
})

function handleNext() {
  emit('next')
}

function handleSkip() {
  emit('skip')
}

function handleSkipPhase() {
  emit('skipPhase')
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="tooltip">
      <div
        v-if="show && step"
        class="tutorial-tooltip z-[60] max-w-sm"
        :class="{ 'max-w-md': isModal }"
        :style="positionStyle"
      >
        <div
          v-if="arrowPosition"
          class="absolute w-4 h-4 bg-gray-900 border border-gray-700 transform rotate-45"
          :class="{
            '-bottom-2 left-1/2 -translate-x-1/2': arrowPosition === 'top',
            '-top-2 left-1/2 -translate-x-1/2': arrowPosition === 'bottom',
            '-right-2 top-1/2 -translate-y-1/2': arrowPosition === 'left',
            '-left-2 top-1/2 -translate-y-1/2': arrowPosition === 'right'
          }"
        />

        <div
          class="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden"
          :class="{ 'min-w-[400px]': isModal }"
        >
          <div class="px-6 py-4 border-b border-gray-800 bg-gradient-to-r from-amber-900/30 to-transparent">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-medium text-amber-400 uppercase tracking-wider">
                {{ step.phase.replace(/_/g, ' ') }}
              </span>
              <button
                v-if="!isMandatory"
                @click="handleClose"
                class="p-1 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
            <h3 class="text-xl font-bold text-white">{{ step.title }}</h3>
          </div>

          <div class="px-6 py-5">
            <p class="text-lg font-semibold text-amber-300 mb-3">{{ step.content }}</p>
            <p
              class="text-gray-300 text-sm leading-relaxed whitespace-pre-line"
              v-html="formattedDescription"
            />
          </div>

          <div class="px-6 py-4 border-t border-gray-800">
            <div class="mb-4">
              <div class="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                <span>本阶段进度</span>
                <span>{{ phaseProgress }}%</span>
              </div>
              <div class="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                  :style="{ width: `${phaseProgress}%` }"
                />
              </div>
            </div>

            <div class="mb-4">
              <div class="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                <span>总体进度</span>
                <span>{{ totalProgress }}%</span>
              </div>
              <div class="h-1 bg-gray-800 rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
                  :style="{ width: `${totalProgress}%` }"
                />
              </div>
            </div>

            <div class="flex items-center justify-between">
              <div class="flex gap-1">
                <span class="text-xs text-gray-500">
                  {{ currentStepIndex + 1 }} / {{ totalSteps }}
                </span>
              </div>

              <div class="flex items-center gap-2">
                <button
                  v-if="canSkip && step.canSkip"
                  @click="handleSkip"
                  class="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-1"
                >
                  <SkipForward class="w-4 h-4" />
                  跳过
                </button>

                <button
                  @click="handleNext"
                  class="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-gray-900 font-semibold rounded-xl transition-all shadow-lg shadow-amber-500/30 flex items-center gap-2"
                >
                  {{ currentStepIndex + 1 >= totalSteps ? '完成阶段' : '下一步' }}
                  <ChevronRight class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.tooltip-enter-active,
.tooltip-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.95);
}
</style>
