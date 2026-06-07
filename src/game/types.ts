import type { CharacterSaveData } from './characterTypes'

export type TimePhase = 'day' | 'night'

export type OrderStatus = 'pending' | 'accepted' | 'completed' | 'failed'

export type RelicType = 'photo' | 'watch' | 'letter' | 'jewelry' | 'toy' | 'book' | 'music_box' | 'mirror'

export type AnomalyType = 'whisper' | 'cold_spot' | 'shadow' | 'flicker' | 'echo' | 'poltergeist'

export interface Order {
  id: string
  clientName: string
  deceasedName: string
  deceasedAge: number
  description: string
  reward: number
  reputationReward: number
  relic: Relic
  difficulty: 1 | 2 | 3
  deadline: number
  status: OrderStatus
  createdAt: number
}

export interface Relic {
  id: string
  type: RelicType
  name: string
  description: string
  anomaly: AnomalyType
  processingSteps: ProcessingStep[]
  story: string
}

export interface ProcessingStep {
  id: string
  name: string
  description: string
  type: 'clean' | 'repair' | 'purify' | 'store'
  duration: number
  requiredFocus: number
  completed: boolean
}

export interface GameEvent {
  id: string
  type: 'narrative' | 'choice' | 'anomaly'
  title: string
  content: string
  choices?: EventChoice[]
  triggeredAt?: string
}

export interface EventChoice {
  id: string
  text: string
  effect: {
    sanity?: number
    money?: number
    reputation?: number
    nextEventId?: string
  }
}

export interface GameStats {
  money: number
  reputation: number
  sanity: number
  maxSanity: number
  day: number
  totalOrdersCompleted: number
  totalRelicsProcessed: number
}

export interface OrderWithRelic {
  order: Order
  relic: Relic
}

export interface SaveData {
  stats: GameStats
  timePhase: TimePhase
  day: number
  isProcessing: boolean
  currentProcessingStep: string | null
  processingProgress: number
  pendingOrders: OrderWithRelic[]
  acceptedOrders: OrderWithRelic[]
  currentOrderId: string | null
  eventQueue: GameEvent[]
  currentEvent: GameEvent | null
  eventHistory: GameEvent[]
  eventResultMessage: string | null
  characterData: CharacterSaveData | null
  timestamp: number
  version: string
}
