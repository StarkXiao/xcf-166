export type AchievementCategory = 'gameplay' | 'collection' | 'social' | 'seasonal' | 'hidden'

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export type AchievementConditionType =
  | 'order_complete'
  | 'order_accept'
  | 'day_pass'
  | 'night_fall'
  | 'relic_purify'
  | 'money_earn'
  | 'money_total'
  | 'reputation_gain'
  | 'reputation_total'
  | 'sanity_maintain'
  | 'sanity_recover'
  | 'character_unlock'
  | 'skill_upgrade'
  | 'level_up'
  | 'exp_gain'
  | 'season_level'
  | 'task_complete'
  | 'anomaly_resist'
  | 'perfect_complete'
  | 'consecutive_login'
  | 'total_login'
  | 'relic_type_collect'
  | 'custom_event'

export interface AchievementCondition {
  type: AchievementConditionType
  target: number
  params?: Record<string, any>
}

export interface AchievementReward {
  type: 'currency' | 'item' | 'badge' | 'title' | 'exp'
  id: string
  name: string
  icon: string
  value: number | string
  rarity: AchievementRarity
}

export interface Achievement {
  id: string
  name: string
  description: string
  category: AchievementCategory
  rarity: AchievementRarity
  icon: string
  condition: AchievementCondition
  rewards: AchievementReward[]
  isHidden: boolean
  isDeprecated?: boolean
  order: number
  badgeImage?: string
}

export interface PlayerAchievement {
  id: string
  achievementId: string
  playerId: string
  progress: number
  unlocked: boolean
  unlockedAt?: number
  claimed: boolean
  claimedAt?: number
  firstSeenAt: number
  notified: boolean
}

export type BehaviorEventType =
  | 'order_completed'
  | 'order_accepted'
  | 'day_passed'
  | 'night_fell'
  | 'relic_purified'
  | 'money_earned'
  | 'reputation_gained'
  | 'sanity_changed'
  | 'sanity_recovered'
  | 'character_unlocked'
  | 'skill_upgraded'
  | 'exp_gained'
  | 'level_up'
  | 'season_level_up'
  | 'task_completed'
  | 'anomaly_resisted'
  | 'perfect_completed'
  | 'login'
  | 'page_view'
  | 'button_click'
  | 'reward_claimed'
  | 'shop_purchase'
  | 'item_used'
  | 'custom'

export interface BehaviorEvent {
  id: string
  eventType: BehaviorEventType
  playerId: string
  timestamp: number
  metadata: Record<string, any>
  sessionId?: string
}

export type NotificationType = 'achievement_unlock' | 'reward_claim' | 'system' | 'event'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  icon: string
  data?: Record<string, any>
  read: boolean
  createdAt: number
  playerId: string
  relatedAchievementId?: string
}

export interface AchievementStatistics {
  totalUnlocked: number
  totalCount: number
  byCategory: Record<AchievementCategory, { unlocked: number; total: number }>
  byRarity: Record<AchievementRarity, { unlocked: number; total: number }>
  latestUnlocked: PlayerAchievement | null
  completionRate: number
}

export interface AchievementSaveData {
  version: string
  timestamp: number
  playerAchievements: PlayerAchievement[]
  notifications: Notification[]
  behaviorEvents: BehaviorEvent[]
  consecutiveLoginDays: number
  totalLoginDays: number
  lastLoginDate: string
  perfectCompleteCount: number
  anomalyResistCount: number
  collectedRelicTypes: string[]
  sanityMaintainDays: number
  totalMoneyEarned: number
  totalReputationGained: number
  customEventCounts: [string, number][]
  nightFellCount: number
  totalSanityRecovered: number
  totalLevelUps: number
  totalExpGained: number
  grantedBadges?: [string, { name: string; icon: string; rarity: AchievementRarity; grantedAt: number }][]
  grantedTitles?: [string, { name: string; icon: string; grantedAt: number }][]
}

export const ACHIEVEMENT_STORAGE_KEY = 'achievement_system_data'
