export type RedDotCategory =
  | 'achievement_reward'
  | 'achievement_notification'
  | 'friend_invite'
  | 'friend_notification'
  | 'friend_help_request'
  | 'friend_task_reward'
  | 'mail_unread'
  | 'mail_attachment'
  | 'season_task'
  | 'shop_new'
  | 'custom'

export type RedDotPriority = 'urgent' | 'important' | 'normal' | 'low'

export const RED_DOT_PRIORITY_ORDER: Record<RedDotPriority, number> = {
  urgent: 0,
  important: 1,
  normal: 2,
  low: 3,
}

export const RED_DOT_READABLE_CATEGORIES: Set<RedDotCategory> = new Set([
  'achievement_notification',
  'friend_notification',
  'mail_unread',
])

export const RED_DOT_CATEGORY_SORT_ORDER: Record<RedDotCategory, number> = {
  friend_help_request: 0,
  achievement_reward: 1,
  friend_invite: 2,
  friend_task_reward: 3,
  mail_attachment: 4,
  season_task: 5,
  achievement_notification: 6,
  friend_notification: 7,
  mail_unread: 8,
  shop_new: 9,
  custom: 10,
}

export interface RedDotItem {
  id: string
  category: RedDotCategory
  title: string
  description?: string
  priority: RedDotPriority
  count: number
  routePath?: string
  routeQuery?: Record<string, any>
  sourceId?: string
  sourceType?: string
  icon?: string
  createdAt: number
  updatedAt: number
  isRead: boolean
  metadata?: Record<string, any>
}

export interface RedDotGroup {
  id: string
  name: string
  category?: RedDotCategory
  routePath?: string
  routeQuery?: Record<string, any>
  items: RedDotItem[]
}

export interface RedDotStatistics {
  totalCount: number
  unreadCount: number
  byPriority: Record<RedDotPriority, number>
  byCategory: Record<RedDotCategory, number>
  highestPriority: RedDotPriority | null
}

export interface RedDotSaveData {
  version: string
  timestamp: number
  playerId: string
  customReadIds: string[]
  dismissedSnapshots: [string, number][]
}

export const RED_DOT_STORAGE_KEY = 'red_dot_system_data'
export const RED_DOT_STORAGE_VERSION = '2.0'

export const RED_DOT_CATEGORY_LABELS: Record<RedDotCategory, string> = {
  achievement_reward: '成就奖励',
  achievement_notification: '成就消息',
  friend_invite: '好友邀请',
  friend_notification: '好友消息',
  friend_help_request: '互助请求',
  friend_task_reward: '互助奖励',
  mail_unread: '未读邮件',
  mail_attachment: '邮件附件',
  season_task: '赛季任务',
  shop_new: '商城新品',
  custom: '自定义',
}

export const RED_DOT_CATEGORY_COLORS: Record<RedDotCategory, string> = {
  achievement_reward: 'bg-amber-500',
  achievement_notification: 'bg-amber-500',
  friend_invite: 'bg-pink-500',
  friend_notification: 'bg-pink-500',
  friend_help_request: 'bg-pink-500',
  friend_task_reward: 'bg-pink-500',
  mail_unread: 'bg-blue-500',
  mail_attachment: 'bg-blue-500',
  season_task: 'bg-purple-500',
  shop_new: 'bg-green-500',
  custom: 'bg-gray-500',
}

export const RED_DOT_PRIORITY_COLORS: Record<RedDotPriority, string> = {
  urgent: 'bg-red-500',
  important: 'bg-orange-500',
  normal: 'bg-blue-500',
  low: 'bg-gray-500',
}
