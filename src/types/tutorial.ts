export type TutorialPhase =
  | 'welcome'
  | 'game_intro'
  | 'order_system'
  | 'purification'
  | 'relic_process'
  | 'day_night'
  | 'sanity_system'
  | 'character_system'
  | 'season_intro'
  | 'achievement_intro'
  | 'shop_intro'
  | 'complete'

export type TutorialTriggerType =
  | 'auto'
  | 'page_enter'
  | 'button_click'
  | 'event_trigger'
  | 'condition_met'

export type TutorialActionType =
  | 'show_tooltip'
  | 'highlight_element'
  | 'show_modal'
  | 'scroll_to'
  | 'play_animation'

export interface TutorialStep {
  id: string
  phase: TutorialPhase
  order: number
  title: string
  content: string
  description: string
  triggerType: TutorialTriggerType
  triggerCondition?: {
    page?: string
    event?: string
    condition?: () => boolean
  }
  actionType: TutorialActionType
  targetSelector?: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  canSkip: boolean
  isBlocking: boolean
  validation?: {
    type: 'event' | 'condition'
    eventType?: string
    checkCondition?: () => boolean
    maxRetries?: number
  }
  rewards?: TutorialReward[]
  nextStepDelay?: number
}

export interface TutorialReward {
  type: 'currency' | 'item' | 'badge' | 'exp'
  id: string
  name: string
  icon: string
  value: number
}

export interface TutorialPhaseConfig {
  id: TutorialPhase
  name: string
  description: string
  steps: string[]
  isMandatory: boolean
  canSkipPhase: boolean
  rewards?: TutorialReward[]
}

export interface PlayerTutorialProgress {
  phase: TutorialPhase
  currentStepIndex: number
  completedSteps: string[]
  skippedSteps: string[]
  startedAt: number
  completedAt?: number
  validationAttempts: Record<string, number>
}

export interface TutorialAnalytics {
  totalTimeSpent: number
  phaseTimeSpent: Record<TutorialPhase, number>
  skippedPhases: TutorialPhase[]
  skippedSteps: string[]
  failedValidations: Record<string, number>
  completedAt?: number
  firstLogin: boolean
}

export interface TutorialSaveData {
  version: string
  playerId: string
  currentPhase: TutorialPhase
  currentStepIndex: number
  isCompleted: boolean
  phaseProgress: Record<TutorialPhase, PlayerTutorialProgress>
  analytics: TutorialAnalytics
  claimedRewards: string[]
  lastActiveAt: number
  sessionStartTime?: number
}

export interface TutorialState {
  isActive: boolean
  isPaused: boolean
  currentPhase: TutorialPhase
  currentStep: TutorialStep | null
  currentStepIndex: number
  showOverlay: boolean
  showSkipConfirm: boolean
  phaseStartTime: number
}

export const TUTORIAL_STORAGE_KEY = 'tutorial_system_data'
export const TUTORIAL_VERSION = '1.0'

export const DEFAULT_TUTORIAL_PHASES: TutorialPhase[] = [
  'welcome',
  'game_intro',
  'order_system',
  'purification',
  'relic_process',
  'day_night',
  'sanity_system',
  'character_system',
  'season_intro',
  'achievement_intro',
  'shop_intro',
  'complete'
]
