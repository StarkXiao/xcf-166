import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type {
  TutorialPhase,
  TutorialStep,
  TutorialReward,
  TutorialSaveData,
  TutorialState,
  TutorialAnalytics,
  PlayerTutorialProgress
} from '@/types/tutorial'
import {
  TUTORIAL_STORAGE_KEY,
  TUTORIAL_VERSION,
  DEFAULT_TUTORIAL_PHASES
} from '@/types/tutorial'
import {
  tutorialPhaseConfigs,
  getTutorialStepById,
  getTutorialStepsByPhase,
  getPhaseConfig,
  getTotalStepCount,
  getPhaseStepCount
} from '@/game/data/tutorials'
import { useGameStore } from './gameStore'
import { useSeasonStore } from './seasonStore'
import { useAchievementStore } from './achievementStore'
import { useActivityStore } from './activityStore'

function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function createEmptyPhaseProgress(phase: TutorialPhase): PlayerTutorialProgress {
  return {
    phase,
    currentStepIndex: 0,
    completedSteps: [],
    skippedSteps: [],
    startedAt: 0,
    validationAttempts: {}
  }
}

function createEmptyPhaseProgressMap(): Record<TutorialPhase, PlayerTutorialProgress> {
  const map = {} as Record<TutorialPhase, PlayerTutorialProgress>
  DEFAULT_TUTORIAL_PHASES.forEach(phase => {
    map[phase] = createEmptyPhaseProgress(phase)
  })
  return map
}

function createEmptyAnalytics(): TutorialAnalytics {
  const phaseTimeMap = {} as Record<TutorialPhase, number>
  DEFAULT_TUTORIAL_PHASES.forEach(phase => {
    phaseTimeMap[phase] = 0
  })
  return {
    totalTimeSpent: 0,
    phaseTimeSpent: phaseTimeMap,
    skippedPhases: [],
    skippedSteps: [],
    failedValidations: {},
    firstLogin: true
  }
}

function loadFromStorage(): TutorialSaveData | null {
  try {
    const raw = localStorage.getItem(TUTORIAL_STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw) as TutorialSaveData
    }
  } catch (e) {
    console.error('Failed to load tutorial data from storage:', e)
  }
  return null
}

function saveToStorage(data: TutorialSaveData) {
  try {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save tutorial data to storage:', e)
  }
}

export const useTutorialStore = defineStore('tutorial', () => {
  const playerId = ref('player_local')
  const isCompleted = ref(false)
  const claimedRewards = ref<string[]>([])
  const phaseProgress = ref<Record<TutorialPhase, PlayerTutorialProgress>>(createEmptyPhaseProgressMap())
  const analytics = ref<TutorialAnalytics>(createEmptyAnalytics())
  const lastActiveAt = ref(Date.now())

  const state = ref<TutorialState>({
    isActive: false,
    isPaused: false,
    currentPhase: 'welcome',
    currentStep: null,
    currentStepIndex: 0,
    currentStepValidated: false,
    showOverlay: false,
    showSkipConfirm: false,
    phaseStartTime: Date.now()
  })

  const sessionStartTime = ref<number | undefined>(undefined)

  watch(
    [phaseProgress, analytics, isCompleted, claimedRewards, state],
    () => {
      if (state.value.isActive) {
        saveAllData()
      }
    },
    { deep: true }
  )

  const currentPhaseConfig = computed(() => {
    return tutorialPhaseConfigs[state.value.currentPhase]
  })

  const currentPhaseSteps = computed(() => {
    return getTutorialStepsByPhase(state.value.currentPhase)
  })

  const totalProgress = computed(() => {
    const totalSteps = getTotalStepCount()
    let completedSteps = 0
    Object.values(phaseProgress.value).forEach(progress => {
      completedSteps += progress.completedSteps.length + progress.skippedSteps.length
    })
    return totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0
  })

  const phaseProgressPercent = computed(() => {
    const phase = state.value.currentPhase
    const totalSteps = getPhaseStepCount(phase)
    const progress = phaseProgress.value[phase]
    if (!progress || totalSteps === 0) return 0
    const completed = progress.completedSteps.length + progress.skippedSteps.length
    return Math.round((completed / totalSteps) * 100)
  })

  const canSkipCurrentPhase = computed(() => {
    const config = currentPhaseConfig.value
    if (!config) return false
    return config.canSkipPhase
  })

  const canSkipCurrentStep = computed(() => {
    const step = state.value.currentStep
    if (!step) return false
    return step.canSkip
  })

  const canProceedToNext = computed(() => {
    const step = state.value.currentStep
    if (!step) return false
    if (step.validation && !state.value.currentStepValidated) {
      return false
    }
    return true
  })

  const isCurrentPhaseMandatory = computed(() => {
    const config = currentPhaseConfig.value
    return config?.isMandatory ?? false
  })

  const completedPhases = computed(() => {
    return DEFAULT_TUTORIAL_PHASES.filter(phase => {
      const progress = phaseProgress.value[phase]
      if (!progress) return false
      return progress.completedAt !== undefined
    })
  })

  const analyticsSummary = computed(() => {
    const totalSteps = getTotalStepCount()
    let completedSteps = 0
    let skippedSteps = 0
    Object.values(phaseProgress.value).forEach(progress => {
      completedSteps += progress.completedSteps.length
      skippedSteps += progress.skippedSteps.length
    })

    return {
      totalTimeSpent: analytics.value.totalTimeSpent,
      completedSteps,
      skippedSteps,
      totalSteps,
      skippedPhases: analytics.value.skippedPhases.length,
      completionRate: totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0,
      averageTimePerStep: completedSteps > 0
        ? Math.round(analytics.value.totalTimeSpent / completedSteps / 1000)
        : 0
    }
  })

  function initTutorial(pId: string = 'player_local') {
    playerId.value = pId

    const saved = loadFromStorage()
    if (saved) {
      if (saved.version !== TUTORIAL_VERSION) {
        console.warn('Tutorial data version mismatch, resetting...')
        resetTutorial()
        return
      }

      playerId.value = saved.playerId
      isCompleted.value = saved.isCompleted
      claimedRewards.value = saved.claimedRewards || []
      lastActiveAt.value = saved.lastActiveAt
      sessionStartTime.value = saved.sessionStartTime

      if (saved.phaseProgress) {
        Object.entries(saved.phaseProgress).forEach(([phase, progress]) => {
          if (progress) {
            phaseProgress.value[phase as TutorialPhase] = {
              ...createEmptyPhaseProgress(phase as TutorialPhase),
              ...progress
            }
          }
        })
      }

      if (saved.analytics) {
        analytics.value = {
          ...createEmptyAnalytics(),
          ...saved.analytics
        }
      }

      state.value.currentPhase = saved.currentPhase || 'welcome'
      state.value.currentStepIndex = saved.currentStepIndex || 0
    } else {
      resetTutorial()
    }

    if (!isCompleted.value) {
      analytics.value.firstLogin = !saved
      saveAllData()
    }
  }

  function resetTutorial() {
    isCompleted.value = false
    claimedRewards.value = []
    phaseProgress.value = createEmptyPhaseProgressMap()
    analytics.value = createEmptyAnalytics()
    lastActiveAt.value = Date.now()

    state.value = {
      isActive: false,
      isPaused: false,
      currentPhase: 'welcome',
      currentStep: null,
      currentStepIndex: 0,
      currentStepValidated: false,
      showOverlay: false,
      showSkipConfirm: false,
      phaseStartTime: Date.now()
    }

    sessionStartTime.value = undefined
    saveAllData()
  }

  function saveAllData() {
    const data: TutorialSaveData = {
      version: TUTORIAL_VERSION,
      playerId: playerId.value,
      currentPhase: state.value.currentPhase,
      currentStepIndex: state.value.currentStepIndex,
      isCompleted: isCompleted.value,
      phaseProgress: phaseProgress.value,
      analytics: analytics.value,
      claimedRewards: claimedRewards.value,
      lastActiveAt: Date.now(),
      sessionStartTime: sessionStartTime.value
    }
    saveToStorage(data)
  }

  function startTutorial() {
    if (isCompleted.value) return

    state.value.isActive = true
    state.value.isPaused = false
    state.value.currentPhase = 'welcome'
    state.value.currentStepIndex = 0
    state.value.phaseStartTime = Date.now()
    sessionStartTime.value = Date.now()

    const welcomeProgress = phaseProgress.value['welcome']
    if (welcomeProgress && welcomeProgress.startedAt === 0) {
      welcomeProgress.startedAt = Date.now()
    }

    loadCurrentStep()
    saveAllData()
  }

  function pauseTutorial() {
    if (state.value.isActive && !state.value.isPaused) {
      state.value.isPaused = true
      updatePhaseTimeSpent()
      saveAllData()
    }
  }

  function resumeTutorial() {
    if (state.value.isActive && state.value.isPaused) {
      state.value.isPaused = false
      state.value.phaseStartTime = Date.now()
      saveAllData()
    }
  }

  function stopTutorial() {
    updatePhaseTimeSpent()
    state.value.isActive = false
    state.value.isPaused = false
    state.value.showOverlay = false
    state.value.currentStep = null
    saveAllData()
  }

  function loadCurrentStep() {
    const phase = state.value.currentPhase
    const steps = getTutorialStepsByPhase(phase)
    const stepIndex = state.value.currentStepIndex

    if (stepIndex < steps.length) {
      const step = steps[stepIndex]
      state.value.currentStep = step
      state.value.showOverlay = step.isBlocking
      state.value.currentStepValidated = !step.validation
    } else {
      completePhase()
    }
  }

  function nextStep(): boolean {
    if (!state.value.currentStep) return false

    const currentStep = state.value.currentStep

    if (currentStep.validation && !state.value.currentStepValidated) {
      trackTutorialEvent('next_blocked_by_validation', { stepId: currentStep.id })
      return false
    }

    const phaseProgressItem = phaseProgress.value[state.value.currentPhase]

    if (phaseProgressItem && !phaseProgressItem.completedSteps.includes(currentStep.id)) {
      phaseProgressItem.completedSteps.push(currentStep.id)
    }

    if (currentStep.rewards && currentStep.rewards.length > 0) {
      currentStep.rewards.forEach(reward => {
        if (!claimedRewards.value.includes(reward.id)) {
          claimReward(reward)
        }
      })
    }

    const delay = currentStep.nextStepDelay || 0

    setTimeout(() => {
      state.value.currentStepIndex++
      loadCurrentStep()
    }, delay)

    return true
  }

  function skipCurrentStep() {
    if (!state.value.currentStep || !state.value.currentStep.canSkip) return

    const currentStep = state.value.currentStep
    const phaseProgressItem = phaseProgress.value[state.value.currentPhase]

    if (phaseProgressItem && !phaseProgressItem.skippedSteps.includes(currentStep.id)) {
      phaseProgressItem.skippedSteps.push(currentStep.id)
    }

    if (!analytics.value.skippedSteps.includes(currentStep.id)) {
      analytics.value.skippedSteps.push(currentStep.id)
    }

    trackTutorialEvent('step_skipped', { stepId: currentStep.id })

    state.value.currentStepIndex++
    loadCurrentStep()
  }

  function skipCurrentPhase() {
    const config = currentPhaseConfig.value
    if (!config || !config.canSkipPhase) return

    const phase = state.value.currentPhase
    const phaseProgressItem = phaseProgress.value[phase]
    const steps = getTutorialStepsByPhase(phase)

    steps.forEach(step => {
      if (phaseProgressItem &&
          !phaseProgressItem.completedSteps.includes(step.id) &&
          !phaseProgressItem.skippedSteps.includes(step.id)) {
        phaseProgressItem.skippedSteps.push(step.id)
        if (!analytics.value.skippedSteps.includes(step.id)) {
          analytics.value.skippedSteps.push(step.id)
        }
      }
    })

    if (!analytics.value.skippedPhases.includes(phase)) {
      analytics.value.skippedPhases.push(phase)
    }

    updatePhaseTimeSpent()
    trackTutorialEvent('phase_skipped', { phase })

    goToNextPhase()
  }

  function completePhase() {
    const phase = state.value.currentPhase
    const phaseProgressItem = phaseProgress.value[phase]
    const config = getPhaseConfig(phase)

    if (phaseProgressItem) {
      phaseProgressItem.completedAt = Date.now()
    }

    updatePhaseTimeSpent()

    if (config?.rewards && config.rewards.length > 0) {
      config.rewards.forEach(reward => {
        if (!claimedRewards.value.includes(reward.id)) {
          claimReward(reward)
        }
      })
    }

    trackTutorialEvent('phase_completed', { phase })

    if (phase === 'complete') {
      completeTutorial()
    } else {
      goToNextPhase()
    }
  }

  function goToNextPhase() {
    const currentIndex = DEFAULT_TUTORIAL_PHASES.indexOf(state.value.currentPhase)
    if (currentIndex < DEFAULT_TUTORIAL_PHASES.length - 1) {
      const nextPhase = DEFAULT_TUTORIAL_PHASES[currentIndex + 1]
      state.value.currentPhase = nextPhase
      state.value.currentStepIndex = 0
      state.value.phaseStartTime = Date.now()

      const nextProgress = phaseProgress.value[nextPhase]
      if (nextProgress && nextProgress.startedAt === 0) {
        nextProgress.startedAt = Date.now()
      }

      loadCurrentStep()
    } else {
      completeTutorial()
    }
  }

  function completeTutorial() {
    isCompleted.value = true
    state.value.isActive = false
    state.value.showOverlay = false
    state.value.currentStep = null

    if (sessionStartTime.value) {
      analytics.value.totalTimeSpent = Date.now() - sessionStartTime.value
    }
    analytics.value.completedAt = Date.now()

    const activityStore = useActivityStore()
    activityStore.trackEvent({
      activityId: 'tutorial_complete',
      playerId: playerId.value,
      eventType: 'complete',
      metadata: {
        ...analyticsSummary.value,
        analytics: analytics.value
      }
    })

    saveAllData()
  }

  function claimReward(reward: TutorialReward) {
    if (claimedRewards.value.includes(reward.id)) return

    const gameStore = useGameStore()
    const seasonStore = useSeasonStore()
    const achievementStore = useAchievementStore()

    switch (reward.type) {
      case 'currency':
        if (typeof reward.value === 'number') {
          gameStore.addMoney(reward.value)
        }
        break
      case 'exp':
        if (typeof reward.value === 'number') {
          seasonStore.addExp(reward.value, 'tutorial', reward.id)
        }
        break
      case 'badge':
      case 'item':
        break
    }

    claimedRewards.value.push(reward.id)

    achievementStore.addNotification({
      type: 'reward_claim',
      title: '🎁 引导奖励',
      message: `获得「${reward.name}」${reward.type === 'currency' ? ` ×${reward.value}` : ''}`,
      icon: reward.icon,
      data: { rewardId: reward.id, rewardType: reward.type }
    })

    trackTutorialEvent('reward_claimed', { rewardId: reward.id, rewardType: reward.type })
  }

  function validateStep(stepId: string): boolean {
    const step = getTutorialStepById(stepId)
    if (!step || !step.validation) return true

    const phaseProgressItem = phaseProgress.value[step.phase]
    if (!phaseProgressItem) return true

    const attempts = phaseProgressItem.validationAttempts[stepId] || 0
    const maxRetries = step.validation.maxRetries || 3

    if (attempts >= maxRetries) {
      trackTutorialEvent('validation_failed', { stepId, attempts })
      if (!analytics.value.failedValidations[stepId]) {
        analytics.value.failedValidations[stepId] = 0
      }
      analytics.value.failedValidations[stepId]++
      return false
    }

    phaseProgressItem.validationAttempts[stepId] = attempts + 1
    return true
  }

  function handleBehaviorEvent(eventType: string, metadata: Record<string, any> = {}) {
    if (!state.value.isActive || !state.value.currentStep) return

    const currentStep = state.value.currentStep
    if (!currentStep.validation) return

    if (currentStep.validation.type === 'event' &&
        currentStep.validation.eventType === eventType) {
      trackTutorialEvent('validation_passed', {
        stepId: currentStep.id,
        eventType
      })
      state.value.currentStepValidated = true
      nextStep()
    }
  }

  function updatePhaseTimeSpent() {
    const phase = state.value.currentPhase
    const now = Date.now()
    const elapsed = now - state.value.phaseStartTime

    if (elapsed > 0) {
      analytics.value.phaseTimeSpent[phase] = (analytics.value.phaseTimeSpent[phase] || 0) + elapsed
    }

    if (sessionStartTime.value) {
      analytics.value.totalTimeSpent = now - sessionStartTime.value
    }
  }

  function trackTutorialEvent(eventType: string, metadata: Record<string, any> = {}) {
    const activityStore = useActivityStore()
    const validEventType: 'exposure' | 'click' | 'claim' | 'complete' | 'view' | 'error' =
      eventType === 'complete' ? 'complete' :
      eventType === 'claim' ? 'claim' :
      eventType === 'error' ? 'error' : 'view'

    activityStore.trackEvent({
      activityId: 'tutorial_system',
      playerId: playerId.value,
      eventType: validEventType,
      metadata: {
        phase: state.value.currentPhase,
        stepId: state.value.currentStep?.id,
        tutorialEventType: eventType,
        ...metadata
      }
    })
  }

  function goToPhase(phase: TutorialPhase) {
    const phaseProgressItem = phaseProgress.value[phase]
    if (!phaseProgressItem) return

    updatePhaseTimeSpent()

    state.value.currentPhase = phase
    state.value.currentStepIndex = phaseProgressItem.currentStepIndex || 0
    state.value.phaseStartTime = Date.now()

    if (phaseProgressItem.startedAt === 0) {
      phaseProgressItem.startedAt = Date.now()
    }

    loadCurrentStep()
  }

  function showSkipConfirmation() {
    state.value.showSkipConfirm = true
  }

  function hideSkipConfirmation() {
    state.value.showSkipConfirm = false
  }

  function confirmSkipAll() {
    hideSkipConfirmation()
    updatePhaseTimeSpent()

    DEFAULT_TUTORIAL_PHASES.forEach(phase => {
      const progress = phaseProgress.value[phase]
      const steps = getTutorialStepsByPhase(phase)
      const config = getPhaseConfig(phase)

      steps.forEach(step => {
        if (progress &&
            !progress.completedSteps.includes(step.id) &&
            !progress.skippedSteps.includes(step.id)) {
          progress.skippedSteps.push(step.id)
          if (!analytics.value.skippedSteps.includes(step.id)) {
            analytics.value.skippedSteps.push(step.id)
          }
        }
      })

      if (!analytics.value.skippedPhases.includes(phase) && !progress?.completedAt) {
        analytics.value.skippedPhases.push(phase)
      }

      if (progress && !progress.completedAt) {
        progress.completedAt = Date.now()
      }
    })

    trackTutorialEvent('tutorial_skipped', {
      skippedPhases: analytics.value.skippedPhases.length,
      skippedSteps: analytics.value.skippedSteps.length
    })

    completeTutorial()
  }

  function getCurrentPhaseSteps(): TutorialStep[] {
    return getTutorialStepsByPhase(state.value.currentPhase)
  }

  function getCompletedStepCount(): number {
    let count = 0
    Object.values(phaseProgress.value).forEach(progress => {
      count += progress.completedSteps.length
    })
    return count
  }

  function getSkippedStepCount(): number {
    let count = 0
    Object.values(phaseProgress.value).forEach(progress => {
      count += progress.skippedSteps.length
    })
    return count
  }

  function clearAllData() {
    resetTutorial()
    localStorage.removeItem(TUTORIAL_STORAGE_KEY)
  }

  return {
    playerId,
    isCompleted,
    claimedRewards,
    phaseProgress,
    analytics,
    state,
    sessionStartTime,
    currentPhaseConfig,
    currentPhaseSteps,
    totalProgress,
    phaseProgressPercent,
    canSkipCurrentPhase,
    canSkipCurrentStep,
    canProceedToNext,
    isCurrentPhaseMandatory,
    completedPhases,
    analyticsSummary,
    initTutorial,
    resetTutorial,
    startTutorial,
    pauseTutorial,
    resumeTutorial,
    stopTutorial,
    nextStep,
    skipCurrentStep,
    skipCurrentPhase,
    completePhase,
    goToNextPhase,
    completeTutorial,
    claimReward,
    validateStep,
    handleBehaviorEvent,
    goToPhase,
    showSkipConfirmation,
    hideSkipConfirmation,
    confirmSkipAll,
    getCurrentPhaseSteps,
    getCompletedStepCount,
    getSkippedStepCount,
    clearAllData,
    saveAllData
  }
})
