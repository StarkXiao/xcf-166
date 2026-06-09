export type WeeklyTaskDifficulty = 'easy' | 'medium' | 'hard'
export type GrowthTaskCategory = 'combat' | 'economy' | 'social' | 'exploration' | 'collection'
export type RewardPoolSource = 'weekly_task' | 'growth_task' | 'season_task' | 'mutual_task' | 'merged_bonus'
export type MergedProgressType = 'daily_to_weekly' | 'weekly_to_growth' | 'mutual_to_weekly' | 'season_to_growth'

export interface WeeklyTask {
  id: string
  title: string
  description: string
  difficulty: WeeklyTaskDifficulty
  target: number
  unit: string
  expReward: number
  rewardPoolContribution: number
  icon: string
  condition: {
    type: string
    params?: Record<string, any>
  }
  order: number
  linkedSeasonTaskIds?: string[]
  linkedMutualBehaviorTypes?: string[]
}

export interface GrowthTask {
  id: string
  category: GrowthTaskCategory
  title: string
  description: string
  target: number
  unit: string
  expReward: number
  rewardPoolContribution: number
  icon: string
  condition: {
    type: string
    params?: Record<string, any>
  }
  order: number
  stage: number
  prerequisiteGrowthTaskId?: string
  linkedWeeklyTaskIds?: string[]
}

export interface RewardPoolTier {
  id: string
  threshold: number
  name: string
  description: string
  rewards: RewardPoolReward[]
  icon: string
}

export interface RewardPoolReward {
  id: string
  type: 'currency' | 'item' | 'title' | 'badge' | 'cosmetic' | 'exp'
  name: string
  icon: string
  value: number | string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
}

export interface WeeklyTaskProgress {
  id: string
  taskId: string
  progress: number
  completed: boolean
  claimed: boolean
  completedAt?: number
  claimedAt?: number
}

export interface GrowthTaskProgress {
  id: string
  taskId: string
  progress: number
  completed: boolean
  claimed: boolean
  completedAt?: number
  claimedAt?: number
}

export interface RewardPoolProgress {
  id: string
  points: number
  claimedTiers: string[]
  lastWeeklyReset: number
}

export interface MergedProgressRecord {
  id: string
  sourceType: MergedProgressType
  sourceTaskId: string
  targetTaskId: string
  amount: number
  timestamp: number
}

export interface TaskReminder {
  id: string
  taskId: string
  taskType: 'weekly' | 'growth'
  message: string
  triggerCondition: 'almost_complete' | 'new_available' | 'expiring_soon' | 'reward_available'
  read: boolean
  createdAt: number
}

export interface TaskSaveData {
  version: string
  timestamp: number
  weeklyTaskProgresses: WeeklyTaskProgress[]
  growthTaskProgresses: GrowthTaskProgress[]
  rewardPoolProgress: RewardPoolProgress | null
  mergedProgressRecords: MergedProgressRecord[]
  reminders: TaskReminder[]
}
