export type ActivityStatus = 'draft' | 'pending' | 'active' | 'paused' | 'ended' | 'cancelled' | 'archived'

export type CountdownWarningLevel = 'safe' | 'warning' | 'urgent' | 'expired'

export type StageUnlockType = 'time' | 'condition' | 'manual'

export type ConditionValidationResult = 'pass' | 'fail' | 'error' | 'skipped'

export type RewardReissueStatus = 'pending' | 'processing' | 'success' | 'failed'

export type ArchiveStatus = 'none' | 'archiving' | 'archived' | 'failed'

export type ActivityTemplateType = 'season' | 'signin' | 'task' | 'gacha' | 'limited_shop' | 'custom'

export type ScheduleType = 'fixed' | 'recurring' | 'trigger'

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly'

export type TriggerConditionType =
  | 'player_level'
  | 'player_vip'
  | 'login_days'
  | 'order_count'
  | 'total_payment'
  | 'first_login'
  | 'date_range'
  | 'custom_event'

export type RewardType = 'currency' | 'item' | 'badge' | 'title' | 'season_exp'

export type PageElementType =
  | 'banner'
  | 'button'
  | 'text'
  | 'image'
  | 'countdown'
  | 'progress'
  | 'reward_list'
  | 'task_list'
  | 'tab'

export interface ActivityTemplate {
  id: string
  name: string
  type: ActivityTemplateType
  description: string
  icon: string
  defaultConfig: Partial<ActivityConfig>
  createdAt: number
  updatedAt: number
}

export interface TimeSchedule {
  type: ScheduleType
  startTime: number
  endTime: number
  recurring?: {
    frequency: RecurringFrequency
    times: Array<{ start: string; end: string }>
    weekdays?: number[]
    days?: number[]
  }
  timezone: string
}

export interface TriggerCondition {
  id: string
  type: TriggerConditionType
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne' | 'between' | 'contains'
  value: number | string | [number, number]
  params?: Record<string, any>
  description: string
}

export interface ConditionGroup {
  id: string
  logic: 'AND' | 'OR'
  conditions: TriggerCondition[]
  children?: ConditionGroup[]
}

export interface RewardItem {
  id: string
  type: RewardType
  itemId?: string
  name: string
  icon: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  value: number | string
  count: number
}

export interface RewardRule {
  id: string
  name: string
  description: string
  conditions: ConditionGroup
  rewards: RewardItem[]
  limitType: 'unlimited' | 'daily' | 'weekly' | 'total'
  limitCount: number
  priority: number
}

export interface PageElement {
  id: string
  type: PageElementType
  x: number
  y: number
  width: number
  height: number
  props: Record<string, any>
  style: Record<string, any>
  action?: {
    type: 'navigate' | 'claim' | 'open_modal' | 'custom'
    target?: string
    params?: Record<string, any>
  }
}

export interface PageConfig {
  id: string
  name: string
  theme: string
  backgroundColor: string
  backgroundImage?: string
  elements: PageElement[]
}

export interface ActivityConfig {
  templateId: string
  name: string
  description: string
  bannerImage?: string
  schedule: TimeSchedule
  triggerConditions: ConditionGroup
  rewardRules: RewardRule[]
  pageConfig: PageConfig
  isEnabled: boolean
  priority: number
  audience: {
    playerLevel?: [number, number]
    vipLevel?: [number, number]
    tags?: string[]
    excludeTags?: string[]
  }
  stages?: ActivityStage[]
  countdownWarningThresholdMs?: number
}

export interface Activity {
  id: string
  config: ActivityConfig
  status: ActivityStatus
  createdBy: string
  approvedBy?: string
  createdAt: number
  updatedAt: number
  startedAt?: number
  endedAt?: number
  approvedAt?: number
  archiveStatus?: ArchiveStatus
}

export interface ActivityDataPoint {
  timestamp: number
  value: number
}

export interface ActivityStatistics {
  activityId: string
  totalParticipants: number
  newParticipants: ActivityDataPoint[]
  activeUsers: ActivityDataPoint[]
  completionRate: number
  rewardClaimedCount: number
  rewardClaimedValue: number
  clickEvents: Record<string, number>
  pageViews: number
  uniqueVisitors: number
  averageDuration: number
}

export type TrackEventType = 'exposure' | 'click' | 'claim' | 'complete' | 'view' | 'error'

export interface ActivityLog {
  id: string
  activityId: string
  playerId: string
  eventType: TrackEventType
  elementId?: string
  rewardId?: string
  metadata: Record<string, any>
  timestamp: number
}

export interface ActivityEvent {
  id: string
  activityId: string
  playerId: string
  eventType: TrackEventType
  elementId?: string
  rewardId?: string
  pageUrl?: string
  userAgent?: string
  ipAddress?: string
  metadata: Record<string, any>
  timestamp: number
  sessionId?: string
}

export interface EventQueryParams {
  activityId?: string
  playerId?: string
  eventType?: TrackEventType
  startTime?: number
  endTime?: number
  elementId?: string
  page?: number
  pageSize?: number
}

export interface AggregatedStatistics {
  activityId: string
  totalExposures: number
  totalClicks: number
  totalClaims: number
  totalCompletions: number
  totalPageViews: number
  uniqueVisitors: number
  clickThroughRate: number
  conversionRate: number
  averageDuration: number
  rewardDistribution: Record<string, number>
  topClickedElements: Array<{ elementId: string; count: number }>
  hourlyData: Array<{ hour: string; exposures: number; clicks: number; claims: number }>
  dailyData: Array<{ date: string; exposures: number; clicks: number; claims: number }>
}

export interface CountdownInfo {
  remainingMs: number
  days: number
  hours: number
  minutes: number
  seconds: number
  warningLevel: CountdownWarningLevel
  isExpired: boolean
}

export interface ActivityStage {
  id: string
  name: string
  description: string
  unlockType: StageUnlockType
  unlockTime?: number
  unlockConditions?: ConditionGroup
  isUnlocked: boolean
  unlockedAt?: number
  order: number
  rewardRules: string[]
}

export interface ConditionValidation {
  conditionId: string
  conditionType: TriggerConditionType
  description: string
  result: ConditionValidationResult
  actualValue?: number | string
  expectedValue?: number | string | [number, number]
  operator?: string
  message: string
}

export interface ConditionValidationReport {
  activityId: string
  playerId: string
  validatedAt: number
  overallResult: boolean
  results: ConditionValidation[]
}

export interface RewardReissueRecord {
  id: string
  activityId: string
  playerId: string
  rewardId: string
  rewardName: string
  originalClaimAt: number
  reissueAt: number
  status: RewardReissueStatus
  reason: string
  retryCount: number
  lastRetryAt?: number
  metadata: Record<string, any>
}

export interface ActivityArchive {
  id: string
  activityId: string
  activitySnapshot: Activity
  statisticsSnapshot: ActivityStatistics | null
  eventsSnapshot: ActivityEvent[]
  logsSnapshot: ActivityLog[]
  aggregatedSnapshot: AggregatedStatistics | null
  archiveStatus: ArchiveStatus
  archivedAt?: number
  archivedBy: string
  archiveSize: number
  error?: string
}

export interface ActivityState {
  templates: ActivityTemplate[]
  activities: Activity[]
  currentActivity: Activity | null
  statistics: Record<string, ActivityStatistics>
  logs: ActivityLog[]
  events: ActivityEvent[]
  loading: boolean
  stages: Record<string, ActivityStage[]>
  reissueRecords: RewardReissueRecord[]
  archives: ActivityArchive[]
}
