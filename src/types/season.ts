export type SeasonStatus = 'upcoming' | 'active' | 'ended' | 'settled'

export interface Season {
  id: string
  name: string
  theme: string
  startTime: number
  endTime: number
  status: SeasonStatus
  description: string
  bannerImage: string
  maxLevel: number
  baseExpPerLevel: number
  expMultiplier: number
}

export type TaskType = 'daily' | 'weekly' | 'challenge'
export type TaskResetPeriod = 'daily' | 'weekly' | 'never'

export type TaskConditionType =
  | 'order_complete'
  | 'order_accept'
  | 'day_pass'
  | 'relic_purify'
  | 'money_earn'
  | 'reputation_gain'

export interface SeasonTask {
  id: string
  seasonId: string
  type: TaskType
  title: string
  description: string
  target: number
  unit: string
  expReward: number
  rewardId?: string
  resetPeriod: TaskResetPeriod
  order: number
  icon: string
  condition: {
    type: TaskConditionType
    params?: Record<string, any>
  }
}

export type RewardRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
export type RewardType = 'currency' | 'item' | 'title' | 'badge' | 'cosmetic'

export interface SeasonReward {
  id: string
  seasonId: string
  type: RewardType
  level: number
  name: string
  description: string
  icon: string
  rarity: RewardRarity
  value: string | number
  isFree: boolean
}

export interface PlayerSeason {
  id: string
  playerId: string
  seasonId: string
  level: number
  exp: number
  totalExp: number
  rankScore: number
  joinedAt: number
  lastResetDaily: number
  lastResetWeekly: number
}

export interface TaskProgress {
  id: string
  playerSeasonId: string
  taskId: string
  progress: number
  completed: boolean
  claimed: boolean
  completedAt?: number
  claimedAt?: number
}

export interface RewardRecord {
  id: string
  playerSeasonId: string
  rewardId: string
  source: 'level' | 'task' | 'rank'
  claimedAt: number
}

export interface LeaderboardEntry {
  id: string
  playerId: string
  seasonId: string
  playerName: string
  playerAvatar: string
  rank: number
  score: number
  previousRank?: number
  updatedAt: number
}

export interface ExpRecord {
  id: string
  playerSeasonId: string
  amount: number
  source: string
  sourceId: string
  createdAt: number
}

export interface Countdown {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export interface SeasonSaveData {
  version: string
  timestamp: number
  currentSeasonId: string
  playerSeasons: PlayerSeason[]
  taskProgresses: TaskProgress[]
  rewardRecords: RewardRecord[]
  expRecords: ExpRecord[]
}
