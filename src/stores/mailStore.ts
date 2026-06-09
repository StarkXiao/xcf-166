import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type {
  Mail,
  MailCategory,
  MailAttachment,
  MailStatistics,
  MailSaveData,
  OperationalAnnouncement,
} from '@/types/mail'
import {
  MAIL_STORAGE_KEY,
  MAIL_STORAGE_VERSION,
  MAX_MAILS,
  MAIL_EXPIRE_DAYS,
} from '@/types/mail'
import { initialMails } from '@/game/data/mailData'
import { useGameStore } from './gameStore'
import { useSeasonStore } from './seasonStore'
import { useCharacterStore } from './characterStore'
import { useShopStore } from './shopStore'
import { useAchievementStore } from './achievementStore'

function generateId(prefix: string = 'mail'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function loadFromStorage(): MailSaveData | null {
  try {
    const raw = localStorage.getItem(MAIL_STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw) as MailSaveData
    }
  } catch (e) {
    console.error('Failed to load mail data from storage:', e)
  }
  return null
}

function saveToStorageFn(data: MailSaveData) {
  try {
    localStorage.setItem(MAIL_STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save mail data to storage:', e)
  }
}

export const useMailStore = defineStore('mail', () => {
  const playerId = ref('player_local')
  const mails = ref<Mail[]>([])
  const selectedMailId = ref<string | null>(null)
  const lastDeliveryCheck = ref(0)
  const publishedAnnouncementIds = ref<Set<string>>(new Set())
  const announcements = ref<OperationalAnnouncement[]>([])

  watch(
    [mails],
    () => {
      saveAllData()
    },
    { deep: true }
  )

  const activeMails = computed(() =>
    mails.value.filter(m => !m.isDeleted)
  )

  const unreadMails = computed(() =>
    activeMails.value.filter(m => !m.isRead)
  )

  const starredMails = computed(() =>
    activeMails.value.filter(m => m.isStarred)
  )

  const mailsWithUnclaimedAttachments = computed(() =>
    activeMails.value.filter(m =>
      m.attachments.some(a => a.status === 'unclaimed')
    )
  )

  const unreadCount = computed(() => unreadMails.value.length)

  const unclaimedAttachmentCount = computed(() =>
    activeMails.value.reduce(
      (sum, m) => sum + m.attachments.filter(a => a.status === 'unclaimed').length,
      0
    )
  )

  const unclaimedAttachmentValue = computed(() =>
    activeMails.value.reduce((sum, m) => {
      return sum + m.attachments
        .filter(a => a.status === 'unclaimed' && typeof a.value === 'number')
        .reduce((s, a) => s + (a.value as number) * a.count, 0)
    }, 0)
  )

  const statistics = computed<MailStatistics>(() => {
    const active = activeMails.value
    const categories: MailCategory[] = ['system', 'reward', 'announcement', 'private']

    const byCategory = Object.fromEntries(
      categories.map(cat => [
        cat,
        {
          total: active.filter(m => m.category === cat).length,
          unread: active.filter(m => m.category === cat && !m.isRead).length
        }
      ])
    ) as Record<MailCategory, { total: number; unread: number }>

    return {
      totalMails: active.length,
      unreadCount: unreadCount.value,
      unclaimedAttachmentCount: unclaimedAttachmentCount.value,
      unclaimedAttachmentValue: unclaimedAttachmentValue.value,
      byCategory,
      starredCount: starredMails.value.length
    }
  })

  const selectedMail = computed(() =>
    selectedMailId.value
      ? mails.value.find(m => m.id === selectedMailId.value && !m.isDeleted)
      : null
  )

  function initMailSystem(pId: string = 'player_local') {
    playerId.value = pId

    const saved = loadFromStorage()
    if (saved && saved.mails && saved.mails.length > 0) {
      mails.value = saved.mails
      lastDeliveryCheck.value = saved.lastDeliveryCheck || 0
      publishedAnnouncementIds.value = new Set(saved.publishedAnnouncementIds || [])
    } else {
      mails.value = initialMails.map(m => ({
        ...m,
        playerId: pId
      }))
      lastDeliveryCheck.value = Date.now()
    }

    checkExpiredAttachments()
    deliverQueuedAnnouncements()
    cleanExpiredMails()
  }

  function deliverQueuedAnnouncements() {
    const now = Date.now()
    announcements.value.forEach(ann => {
      if (ann.startsAt > now) return
      if (ann.expiresAt < now) return
      if (publishedAnnouncementIds.value.has(ann.id)) return

      const mailId = sendMail({
        category: 'announcement',
        priority: ann.priority,
        title: ann.title,
        sender: ann.sender,
        senderAvatar: ann.senderAvatar,
        content: ann.content,
        attachments: ann.attachments.map(a => ({ ...a })),
        tag: ann.tag,
        actionLabel: ann.actionLabel,
        actionUrl: ann.actionUrl,
        expiresAt: ann.expiresAt,
      })

      publishedAnnouncementIds.value.add(ann.id)
    })

    lastDeliveryCheck.value = now
  }

  function announce(params: Omit<OperationalAnnouncement, 'id' | 'publishedAt'>): string {
    const id = generateId('ann')
    const announcement: OperationalAnnouncement = {
      ...params,
      id,
      publishedAt: Date.now(),
    }
    announcements.value.push(announcement)

    if (announcement.startsAt <= Date.now()) {
      deliverQueuedAnnouncements()
    }

    return id
  }

  function removeAnnouncement(announcementId: string) {
    announcements.value = announcements.value.filter(a => a.id !== announcementId)
  }

  function checkExpiredAttachments() {
    const now = Date.now()
    mails.value.forEach(mail => {
      mail.attachments.forEach(att => {
        if (att.status === 'unclaimed' && att.expiresAt && now > att.expiresAt) {
          att.status = 'expired'
        }
      })
    })
  }

  function cleanExpiredMails() {
    const now = Date.now()
    const expireMs = MAIL_EXPIRE_DAYS * 86400000
    mails.value = mails.value.filter(m => {
      if (m.isDeleted) return now - m.createdAt < 7 * 86400000
      if (m.expiresAt) return now < m.expiresAt
      return now - m.createdAt < expireMs
    })

    if (mails.value.length > MAX_MAILS) {
      const sorted = [...mails.value].sort((a, b) => {
        if (a.isStarred !== b.isStarred) return a.isStarred ? -1 : 1
        return b.createdAt - a.createdAt
      })
      mails.value = sorted.slice(0, MAX_MAILS)
    }
  }

  function saveAllData() {
    const data: MailSaveData = {
      version: MAIL_STORAGE_VERSION,
      timestamp: Date.now(),
      playerId: playerId.value,
      mails: mails.value,
      lastDeliveryCheck: lastDeliveryCheck.value,
      publishedAnnouncementIds: Array.from(publishedAnnouncementIds.value),
    }
    saveToStorageFn(data)
  }

  function markAsRead(mailId: string) {
    const mail = mails.value.find(m => m.id === mailId)
    if (mail && !mail.isRead) {
      mail.isRead = true
      mail.readAt = Date.now()
    }
  }

  function markAsUnread(mailId: string) {
    const mail = mails.value.find(m => m.id === mailId)
    if (mail && mail.isRead) {
      mail.isRead = false
      mail.readAt = undefined
    }
  }

  function markAllAsRead(category?: MailCategory) {
    activeMails.value.forEach(m => {
      if (category && m.category !== category) return
      if (!m.isRead) {
        m.isRead = true
        m.readAt = Date.now()
      }
    })
  }

  function toggleStar(mailId: string) {
    const mail = mails.value.find(m => m.id === mailId)
    if (mail) {
      mail.isStarred = !mail.isStarred
    }
  }

  function deleteMail(mailId: string) {
    const mail = mails.value.find(m => m.id === mailId)
    if (mail) {
      if (mail.attachments.some(a => a.status === 'unclaimed')) {
        return false
      }
      mail.isDeleted = true
      if (selectedMailId.value === mailId) {
        selectedMailId.value = null
      }
    }
    return true
  }

  function deleteReadMails() {
    let deleted = 0
    activeMails.value.forEach(m => {
      if (m.isRead && !m.attachments.some(a => a.status === 'unclaimed')) {
        m.isDeleted = true
        deleted++
      }
    })
    if (selectedMailId.value) {
      const sel = mails.value.find(m => m.id === selectedMailId.value)
      if (sel?.isDeleted) {
        selectedMailId.value = null
      }
    }
    return deleted
  }

  function applyAttachmentToPlayer(attachment: MailAttachment, sourceMailId: string) {
    const gameStore = useGameStore()
    const seasonStore = useSeasonStore()
    const characterStore = useCharacterStore()
    const shopStore = useShopStore()
    const achievementStore = useAchievementStore()

    switch (attachment.type) {
      case 'currency':
        if (typeof attachment.value === 'number') {
          gameStore.addMoney(attachment.value * attachment.count)
        }
        break
      case 'exp':
        if (typeof attachment.value === 'number') {
          characterStore.addExp(attachment.value * attachment.count)
        }
        break
      case 'season_exp':
        if (typeof attachment.value === 'number') {
          seasonStore.addExp(attachment.value * attachment.count, 'mail_claim', sourceMailId)
        }
        break
      case 'item':
        if (attachment.itemId) {
          shopStore.grantItemById(attachment.itemId, attachment.count)
        }
        break
      case 'badge':
        if (attachment.itemId) {
          achievementStore.grantBadge(attachment.itemId, attachment.name, attachment.icon, attachment.rarity)
        }
        break
      case 'title':
        if (attachment.itemId) {
          achievementStore.grantTitle(attachment.itemId, attachment.name, attachment.icon)
        }
        break
    }
  }

  function claimAttachment(mailId: string, attachmentId: string): boolean {
    const mail = mails.value.find(m => m.id === mailId)
    if (!mail) return false

    const attachment = mail.attachments.find(a => a.id === attachmentId)
    if (!attachment || attachment.status !== 'unclaimed') return false

    applyAttachmentToPlayer(attachment, mailId)

    attachment.status = 'claimed'
    attachment.claimedAt = Date.now()
    return true
  }

  function claimAllAttachments(mailId: string): number {
    const mail = mails.value.find(m => m.id === mailId)
    if (!mail) return 0

    let claimed = 0
    mail.attachments.forEach(att => {
      if (att.status === 'unclaimed') {
        if (claimAttachment(mailId, att.id)) {
          claimed++
        }
      }
    })
    return claimed
  }

  function batchClaimAll(): number {
    let totalClaimed = 0
    activeMails.value.forEach(mail => {
      mail.attachments.forEach(att => {
        if (att.status === 'unclaimed') {
          if (claimAttachment(mail.id, att.id)) {
            totalClaimed++
          }
        }
      })
    })
    return totalClaimed
  }

  function batchClaimByCategory(category: MailCategory): number {
    let totalClaimed = 0
    activeMails.value
      .filter(m => m.category === category)
      .forEach(mail => {
        mail.attachments.forEach(att => {
          if (att.status === 'unclaimed') {
            if (claimAttachment(mail.id, att.id)) {
              totalClaimed++
            }
          }
        })
      })
    return totalClaimed
  }

  function selectMail(mailId: string | null) {
    selectedMailId.value = mailId
    if (mailId) {
      markAsRead(mailId)
    }
  }

  function getMailsByCategory(category: MailCategory): Mail[] {
    return activeMails.value
      .filter(m => m.category === category)
      .sort((a, b) => {
        if (a.isStarred !== b.isStarred) return a.isStarred ? -1 : 1
        if (a.priority !== b.priority) {
          const order: Record<string, number> = { urgent: 0, important: 1, normal: 2 }
          return (order[a.priority] || 2) - (order[b.priority] || 2)
        }
        return b.createdAt - a.createdAt
      })
  }

  function sendMail(params: Omit<Mail, 'id' | 'playerId' | 'isRead' | 'isStarred' | 'isDeleted' | 'createdAt'>): string {
    const mail: Mail = {
      ...params,
      id: generateId('mail'),
      playerId: playerId.value,
      isRead: false,
      isStarred: false,
      isDeleted: false,
      createdAt: Date.now()
    }
    mails.value.unshift(mail)
    return mail.id
  }

  function sendRewardMail(params: {
    title: string
    sender: string
    senderAvatar: string
    content: string
    tag?: string
    source: string
    attachments: Array<Omit<MailAttachment, 'id' | 'status' | 'claimedAt'>>
  }): string {
    const attachments: MailAttachment[] = params.attachments.map(a => ({
      ...a,
      id: generateId('att'),
      status: 'unclaimed' as const,
      claimedAt: undefined,
    }))

    return sendMail({
      category: 'reward',
      priority: 'important',
      title: params.title,
      sender: params.sender,
      senderAvatar: params.senderAvatar,
      content: params.content,
      attachments,
      tag: params.tag,
      expiresAt: Date.now() + 30 * 86400000,
    })
  }

  function sendSystemMail(params: {
    title: string
    content: string
    tag?: string
    priority?: 'normal' | 'important' | 'urgent'
    attachments?: Array<Omit<MailAttachment, 'id' | 'status' | 'claimedAt'>>
    actionLabel?: string
    actionUrl?: string
  }): string {
    const attachments: MailAttachment[] = (params.attachments || []).map(a => ({
      ...a,
      id: generateId('att'),
      status: 'unclaimed' as const,
      claimedAt: undefined,
    }))

    return sendMail({
      category: 'system',
      priority: params.priority || 'normal',
      title: params.title,
      sender: '系统管理员',
      senderAvatar: '⚙️',
      content: params.content,
      attachments,
      tag: params.tag,
      actionLabel: params.actionLabel,
      actionUrl: params.actionUrl,
    })
  }

  function clearAllData() {
    mails.value = []
    selectedMailId.value = null
    lastDeliveryCheck.value = 0
    publishedAnnouncementIds.value.clear()
    announcements.value = []
    localStorage.removeItem(MAIL_STORAGE_KEY)
  }

  return {
    playerId,
    mails,
    selectedMailId,
    lastDeliveryCheck,
    publishedAnnouncementIds,
    announcements,
    activeMails,
    unreadMails,
    starredMails,
    mailsWithUnclaimedAttachments,
    unreadCount,
    unclaimedAttachmentCount,
    unclaimedAttachmentValue,
    statistics,
    selectedMail,
    initMailSystem,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    toggleStar,
    deleteMail,
    deleteReadMails,
    claimAttachment,
    claimAllAttachments,
    batchClaimAll,
    batchClaimByCategory,
    selectMail,
    getMailsByCategory,
    sendMail,
    sendRewardMail,
    sendSystemMail,
    announce,
    removeAnnouncement,
    deliverQueuedAnnouncements,
    clearAllData,
    saveAllData
  }
})
