<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useTutorialStore } from '@/stores/tutorialStore'
import { useAchievementStore } from '@/stores/achievementStore'
import TutorialOverlay from './TutorialOverlay.vue'
import TutorialTooltip from './TutorialTooltip.vue'
import SkipConfirmModal from './SkipConfirmModal.vue'
import TutorialComplete from './TutorialComplete.vue'
import { getTotalStepCount } from '@/game/data/tutorials'

const tutorialStore = useTutorialStore()
const achievementStore = useAchievementStore()

const showComplete = ref(false)
const keyboardHandler = ref<((e: KeyboardEvent) => void) | null>(null)

const shouldShowOverlay = computed(() => {
  return tutorialStore.state.isActive &&
    !tutorialStore.state.isPaused &&
    tutorialStore.state.showOverlay &&
    tutorialStore.state.currentStep !== null
})

const shouldShowTooltip = computed(() => {
  return tutorialStore.state.isActive &&
    !tutorialStore.state.isPaused &&
    tutorialStore.state.currentStep !== null
})

const currentPhaseStepCount = computed(() => {
  return tutorialStore.currentPhaseSteps.length
})

const isHighlightStep = computed(() => {
  const step = tutorialStore.state.currentStep
  return step?.actionType === 'highlight_element' && !!step.targetSelector
})

const totalSteps = computed(() => getTotalStepCount())

function handleNext() {
  tutorialStore.nextStep()
}

function handleSkipStep() {
  tutorialStore.skipCurrentStep()
}

function handleSkipPhase() {
  tutorialStore.skipCurrentPhase()
}

function handleCloseTooltip() {
  tutorialStore.stopTutorial()
}

function handleOverlayClick() {
}

function handleSkipAllConfirm() {
  tutorialStore.confirmSkipAll()
}

function handleSkipAllCancel() {
  tutorialStore.hideSkipConfirmation()
}

function handleCompleteClose() {
  showComplete.value = false
}

function handleKeydown(e: KeyboardEvent) {
  if (!tutorialStore.state.isActive || tutorialStore.state.isPaused) return
  if (tutorialStore.state.showSkipConfirm) return

  switch (e.key) {
    case 'Escape':
      e.preventDefault()
      if (tutorialStore.canSkipCurrentPhase) {
        tutorialStore.showSkipConfirmation()
      }
      break
    case 'Enter':
    case ' ':
      e.preventDefault()
      handleNext()
      break
    case 'ArrowRight':
      e.preventDefault()
      handleNext()
      break
    case 'ArrowLeft':
      e.preventDefault()
      break
  }
}

watch(
  () => tutorialStore.isCompleted,
  (isCompleted) => {
    if (isCompleted && tutorialStore.analytics.completedAt) {
      const timeSinceComplete = Date.now() - tutorialStore.analytics.completedAt
      if (timeSinceComplete < 5000) {
        showComplete.value = true
      }
    }
  },
  { immediate: true }
)

watch(
  () => tutorialStore.state.currentStep,
  (newStep, oldStep) => {
    if (newStep && newStep.id !== oldStep?.id) {
      achievementStore.trackBehavior('custom', {
        eventName: 'tutorial_step_view',
        stepId: newStep.id,
        phase: newStep.phase
      })
    }
  }
)

onMounted(() => {
  keyboardHandler.value = handleKeydown
  window.addEventListener('keydown', keyboardHandler.value)
})

onUnmounted(() => {
  if (keyboardHandler.value) {
    window.removeEventListener('keydown', keyboardHandler.value)
  }
})

function handleBehaviorEvent(eventType: string, metadata: Record<string, any> = {}) {
  tutorialStore.handleBehaviorEvent(eventType, metadata)
}

defineExpose({
  handleBehaviorEvent
})
</script>

<template>
  <div class="tutorial-guide">
    <TutorialOverlay
      :show="shouldShowOverlay && isHighlightStep"
      :target-selector="tutorialStore.state.currentStep?.targetSelector"
      @click="handleOverlayClick"
    />

    <TutorialTooltip
      :step="tutorialStore.state.currentStep"
      :show="shouldShowTooltip"
      :total-steps="currentPhaseStepCount"
      :current-step-index="tutorialStore.state.currentStepIndex"
      :can-skip="tutorialStore.canSkipCurrentPhase"
      :is-mandatory="tutorialStore.isCurrentPhaseMandatory"
      :phase-progress="tutorialStore.phaseProgressPercent"
      :total-progress="tutorialStore.totalProgress"
      @next="handleNext"
      @skip="handleSkipStep"
      @skip-phase="handleSkipPhase"
      @close="handleCloseTooltip"
    />

    <SkipConfirmModal
      :show="tutorialStore.state.showSkipConfirm"
      :can-skip-all="true"
      @confirm="handleSkipAllConfirm"
      @cancel="handleSkipAllCancel"
    />

    <TutorialComplete
      :show="showComplete"
      :analytics="tutorialStore.analytics"
      :total-steps="totalSteps"
      :completed-steps="tutorialStore.getCompletedStepCount()"
      :skipped-steps="tutorialStore.getSkippedStepCount()"
      :total-progress="tutorialStore.totalProgress"
      @close="handleCompleteClose"
    />

    <button
      v-if="tutorialStore.state.isActive && !tutorialStore.state.isPaused && tutorialStore.canSkipCurrentPhase"
      @click="tutorialStore.showSkipConfirmation"
      class="fixed bottom-6 right-6 z-50 px-4 py-2 bg-gray-900/90 backdrop-blur-sm border border-gray-700 hover:bg-gray-800 text-gray-400 hover:text-white rounded-xl transition-all text-sm flex items-center gap-2"
    >
      <span>按 ESC 跳过引导</span>
    </button>
  </div>
</template>

<style scoped>
.tutorial-guide {
  pointer-events: none;
}

.tutorial-guide > * {
  pointer-events: auto;
}
</style>
