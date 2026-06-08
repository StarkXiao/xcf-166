export type FriendInviteStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'expired'

export type MutualTaskStatus = 'available' | 'requested' | 'accepted' | 'in_progress' | 'completed' | 'claimed' | 'expired' | 'rejected'

export type FriendNotificationType = 'invite' | 'task_request' | 'task_accepted' | 'task_rejected' | 'task_completed' | 'reward_available' | 'milestone_unlocked' | 'help_needed'

export type MutualTaskBehaviorType = 'order_completed' | 'relic_purified' | 'sanity_recovered' | 'reputation_gained' | 'money_gifted'

export type FriendActivityType = 'help_sent' | 'help_received' | 'task_completed' | 'milestone_unlocked' | 'reward_claimed' | 'friend_added' | 'friend_removed'

export interface MutualTaskReward {
  type: 'currency' | 'item' | 'badge' | 'title' | 'exp' | 'buff'
  id: string
  name: string
  icon: string
  value: number | string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  isShared: boolean
}

export interface MutualTask {
  id: string
  type: string
  behaviorType: MutualTaskBehaviorType
  title: string
  description: string
  target: number
  unit: string
  duration: number
  icon: string
  rewards: MutualTaskReward[]
  requiresFriend: boolean
  minFriendshipLevel: number
  buffEffect?: string
}

export interface FriendshipMilestone {
  id: string
  level: number
  expRequired: number
  name: string
  description: string
  rewards: MutualTaskReward[]
  icon: string
}

export interface Friend {
  id: string
  playerId: string
  friendId: string
  friendName: string
  friendAvatar: string
  friendshipLevel: number
  friendshipExp: number
  mutualHelpCount: number
  totalHelpGiven: number
  totalHelpReceived: number
  isOnline: boolean
  currentDay: number
  totalOrdersCompleted: number
  createdAt: number
  lastInteractAt: number
  isBlocked: boolean
  note?: string
}

export interface FriendInvite {
  id: string
  fromPlayerId: string
  fromPlayerName: string
  fromPlayerAvatar: string
  toPlayerId: string
  toPlayerName?: string
  toPlayerAvatar?: string
  message?: string
  status: FriendInviteStatus
  createdAt: number
  expiresAt: number
  respondedAt?: number
}

export interface MutualTaskProgress {
  id: string
  taskId: string
  initiatorId: string
  initiatorName: string
  helperId: string
  helperName: string
  status: MutualTaskStatus
  progress: number
  startedAt: number
  expiresAt: number
  completedAt?: number
  claimedAt?: number
  respondedAt?: number
  rejectedAt?: number
  helperProgress: number
  initiatorBonusApplied: boolean
  helperBonusApplied: boolean
  requestMessage?: string
}

export interface FriendNotification {
  id: string
  playerId: string
  type: FriendNotificationType
  title: string
  message: string
  fromPlayerId: string
  fromPlayerName: string
  fromPlayerAvatar: string
  read: boolean
  createdAt: number
  data?: Record<string, any>
}

export interface FriendActivity {
  id: string
  playerId: string
  friendId: string
  activityType: FriendActivityType
  description: string
  timestamp: number
  metadata?: Record<string, any>
}

export interface FriendStatistics {
  totalFriends: number
  onlineFriends: number
  pendingInviteCount: number
  completedMutualTasks: number
  totalHelpGiven: number
  totalHelpReceived: number
  highestFriendshipLevel: number
  totalFriendshipExp: number
}

export interface FriendSaveData {
  version: string
  timestamp: number
  playerId: string
  friends: Friend[]
  invites: FriendInvite[]
  mutualTaskProgresses: MutualTaskProgress[]
  notifications: FriendNotification[]
  activities: FriendActivity[]
  statistics: FriendStatistics
}

export interface RecommendedPlayer {
  id: string
  name: string
  avatar: string
  day: number
  totalOrders: number
  isOnline: boolean
  matchReason?: string
}

export const FRIEND_STORAGE_KEY = 'friend_system_data'
export const INVITE_EXPIRE_HOURS = 24
export const MAX_FRIENDS = 100
export const MAX_PENDING_INVITES = 20
export const MAX_ACTIVE_TASKS_PER_FRIEND = 3
