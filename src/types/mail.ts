export type MailCategory = 'system' | 'reward' | 'announcement' | 'private'

export type MailPriority = 'normal' | 'important' | 'urgent'

export type MailAttachmentType = 'currency' | 'item' | 'badge' | 'title' | 'exp' | 'season_exp'

export type MailAttachmentStatus = 'unclaimed' | 'claimed' | 'expired'

export interface MailAttachment {
  id: string
  type: MailAttachmentType
  itemId?: string
  name: string
  icon: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  value: number | string
  count: number
  status: MailAttachmentStatus
  claimedAt?: number
  expiresAt?: number
}

export interface Mail {
  id: string
  category: MailCategory
  priority: MailPriority
  title: string
  sender: string
  senderAvatar: string
  content: string
  htmlContent?: string
  attachments: MailAttachment[]
  isRead: boolean
  isStarred: boolean
  isDeleted: boolean
  createdAt: number
  readAt?: number
  expiresAt?: number
  actionLabel?: string
  actionUrl?: string
  actionParams?: Record<string, any>
  tag?: string
  playerId: string
}

export interface MailStatistics {
  totalMails: number
  unreadCount: number
  unclaimedAttachmentCount: number
  unclaimedAttachmentValue: number
  byCategory: Record<MailCategory, { total: number; unread: number }>
  starredCount: number
}

export interface OperationalAnnouncement {
  id: string
  title: string
  content: string
  sender: string
  senderAvatar: string
  priority: MailPriority
  tag?: string
  actionLabel?: string
  actionUrl?: string
  attachments: MailAttachment[]
  startsAt: number
  expiresAt: number
  targetSegment?: 'all' | 'new_players' | 'veterans' | 'paying'
  publishedBy?: string
  publishedAt?: number
}

export interface MailSaveData {
  version: string
  timestamp: number
  playerId: string
  mails: Mail[]
  lastDeliveryCheck: number
  publishedAnnouncementIds: string[]
}

export const MAIL_STORAGE_KEY = 'mail_system_data'
export const MAIL_STORAGE_VERSION = '1.1'
export const MAX_MAILS = 200
export const MAIL_EXPIRE_DAYS = 30
