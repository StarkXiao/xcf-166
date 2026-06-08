import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type {
  Friend,
  FriendInvite,
  MutualTaskProgress,
  FriendNotification,
  FriendActivity,
  FriendStatistics,
  FriendSaveData,
  RecommendedPlayer,
  MutualTask
} from '@/types/friend'
import {
  FRIEND_STORAGE_KEY,
  INVITE_EXPIRE_HOURS,
  MAX_FRIENDS,
  MAX_PENDING_INVITES,
  MAX_ACTIVE_TASKS_PER_FRIEND
} from '@/types/friend'
import { mutualTasks, mockPlayers, getFriendshipLevelFromExp, getExpForFriendshipLevel, getNextMilestone, getMilestoneByLevel } from '@/game/data/friendData'
import { useGameStore } from './gameStore'
import { useSeasonStore } from './seasonStore'
import { useCharacterStore } from './characterStore'

const STORAGE_VERSION = '1.0'

function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function loadFromStorage(): FriendSaveData | null {
  try {
    const raw = localStorage.getItem(FRIEND_STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw) as FriendSaveData
    }
  } catch (e) {
    console.error('Failed to load friend data from storage:', e)
  }
  return null
}

function saveToStorage(data: FriendSaveData) {
  try {
    localStorage.setItem(FRIEND_STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save friend data to storage:', e)
  }
}

export const useFriendStore = defineStore('friend', () => {
  const playerId = ref('player_local')
  const playerName = ref('殡仪馆馆长')
  const playerAvatar = ref('🏛️')

  const friends = ref<Friend[]>([])
  const invites = ref<FriendInvite[]>([])
  const mutualTaskProgresses = ref<MutualTaskProgress[]>([])
  const notifications = ref<FriendNotification[]>([])
  const activities = ref<FriendActivity[]>([])

  const availableMutualTasks = ref<MutualTask[]>([...mutualTasks])

  watch(
    [friends, invites, mutualTaskProgresses, notifications, activities],
    () => {
      saveAllData()
    },
    { deep: true }
  )

  const acceptedFriends = computed(() =>
    friends.value.filter(f => !f.isBlocked)
  )

  const blockedFriends = computed(() =>
    friends.value.filter(f => f.isBlocked)
  )

  const pendingInvites = computed(() =>
    invites.value.filter(i => i.status === 'pending' && i.toPlayerId === playerId.value && Date.now() < i.expiresAt)
  )

  const sentInvites = computed(() =>
    invites.value.filter(i => i.status === 'pending' && i.fromPlayerId === playerId.value && Date.now() < i.expiresAt)
  )

  const pendingInviteCount = computed(() => pendingInvites.value.length)

  const activeMutualTasks = computed(() =>
    mutualTaskProgresses.value.filter(t =>
      (t.initiatorId === playerId.value || t.helperId === playerId.value) &&
      (t.status === 'in_progress' || t.status === 'completed')
    )
  )

  const activeTaskCount = computed(() =>
    mutualTaskProgresses.value.filter(t =>
      (t.initiatorId === playerId.value || t.helperId === playerId.value) &&
      t.status === 'in_progress'
    ).length
  )

  const unclaimedRewardCount = computed(() =>
    mutualTaskProgresses.value.filter(t =>
      t.status === 'completed' && !t.claimedAt &&
      (t.initiatorId === playerId.value || t.helperId === playerId.value)
    ).length
  )

  const unreadNotifications = computed(() =>
    notifications.value.filter(n => !n.read)
  )

  const unreadNotificationCount = computed(() => unreadNotifications.value.length)

  const totalUnreadCount = computed(() =>
    pendingInviteCount.value + unclaimedRewardCount.value + unreadNotificationCount.value
  )

  const statistics = computed<FriendStatistics>(() => {
    const accepted = acceptedFriends.value
    return {
      totalFriends: accepted.length,
      onlineFriends: accepted.filter(f => f.isOnline).length,
      pendingInviteCount: pendingInviteCount.value,
      completedMutualTasks: mutualTaskProgresses.value.filter(t => t.status === 'claimed').length,
      totalHelpGiven: accepted.reduce((sum, f) => sum + f.totalHelpGiven, 0),
      totalHelpReceived: accepted.reduce((sum, f) => sum + f.totalHelpReceived, 0),
      highestFriendshipLevel: accepted.length > 0 ? Math.max(...accepted.map(f => f.friendshipLevel)) : 0,
      totalFriendshipExp: accepted.reduce((sum, f) => sum + f.friendshipExp, 0)
    }
  })

  function initFriendSystem(pId: string = 'player_local') {
    playerId.value = pId

    const saved = loadFromStorage()
    if (saved) {
      friends.value = saved.friends || []
      invites.value = saved.invites || []
      mutualTaskProgresses.value = saved.mutualTaskProgresses || []
      notifications.value = saved.notifications || []
      activities.value = saved.activities || []
    }

    checkExpiredInvites()
    checkExpiredTasks()

    if (friends.value.length === 0 && invites.value.length === 0) {
      initializeMockData()
    }

    saveAllData()
  }

  function initializeMockData() {
    const now = Date.now()

    const mockFriends: Friend[] = mockPlayers.slice(0, 4).map((p, index) => ({
      id: generateId('friend'),
      playerId: playerId.value,
      friendId: p.id,
      friendName: p.name,
      friendAvatar: p.avatar,
      friendshipLevel: index + 1,
      friendshipExp: index * 150,
      mutualHelpCount: Math.floor(Math.random() * 10) + 2,
      totalHelpGiven: Math.floor(Math.random() * 5) + 1,
      totalHelpReceived: Math.floor(Math.random() * 5) + 1,
      isOnline: p.isOnline,
      currentDay: p.day,
      totalOrdersCompleted: p.totalOrders,
      createdAt: now - (index + 1) * 86400000,
      lastInteractAt: now - index * 3600000,
      isBlocked: false
    }))
    friends.value = mockFriends

    const mockInvite: FriendInvite = {
      id: generateId('invite'),
      fromPlayerId: mockPlayers[4].id,
      fromPlayerName: mockPlayers[4].name,
      fromPlayerAvatar: mockPlayers[4].avatar,
      toPlayerId: playerId.value,
      toPlayerName: playerName.value,
      toPlayerAvatar: playerAvatar.value,
      message: '你好！我是新来的，想找个老玩家带带我，互相帮助呀~',
      status: 'pending',
      createdAt: now - 1800000,
      expiresAt: now + INVITE_EXPIRE_HOURS * 3600000
    }
    invites.value = [mockInvite]

    addNotification({
      type: 'invite',
      title: '新的好友邀请',
      message: `${mockPlayers[4].name} 想加你为好友`,
      fromPlayerId: mockPlayers[4].id,
      fromPlayerName: mockPlayers[4].name,
      fromPlayerAvatar: mockPlayers[4].avatar,
      data: { inviteId: mockInvite.id }
    })

    if (mockFriends.length >= 2) {
      const task = availableMutualTasks.value[0]
      const friend = mockFriends[0]
      const mockTaskProgress: MutualTaskProgress = {
        id: generateId('task'),
        taskId: task.id,
        initiatorId: playerId.value,
        initiatorName: playerName.value,
        helperId: friend.friendId,
        helperName: friend.friendName,
        status: 'in_progress',
        progress: 0,
        helperProgress: 0,
        startedAt: now - 3600000,
        expiresAt: now + task.duration * 1000
      }
      mutualTaskProgresses.value = [mockTaskProgress]
    }
  }

  function checkExpiredInvites() {
    const now = Date.now()
    invites.value.forEach(invite => {
      if (invite.status === 'pending' && now >= invite.expiresAt) {
        invite.status = 'expired'
      }
    })
  }

  function checkExpiredTasks() {
    const now = Date.now()
    mutualTaskProgresses.value.forEach(task => {
      if (task.status === 'in_progress' && now >= task.expiresAt) {
        task.status = 'expired'
      }
    })
  }

  function saveAllData() {
    const data: FriendSaveData = {
      version: STORAGE_VERSION,
      timestamp: Date.now(),
      playerId: playerId.value,
      friends: friends.value,
      invites: invites.value,
      mutualTaskProgresses: mutualTaskProgresses.value,
      notifications: notifications.value,
      activities: activities.value,
      statistics: statistics.value
    }
    saveToStorage(data)
  }

  function searchPlayers(query: string): RecommendedPlayer[] {
    const lowerQuery = query.toLowerCase().trim()
    if (!lowerQuery) return []

    const friendIds = new Set(friends.value.map(f => f.friendId))
    const inviteeIds = new Set(invites.value.filter(i => i.status === 'pending').map(i => i.toPlayerId))

    return mockPlayers
      .filter(p =>
        p.id.toLowerCase().includes(lowerQuery) ||
        p.name.toLowerCase().includes(lowerQuery)
      )
      .filter(p => p.id !== playerId.value && !friendIds.has(p.id) && !inviteeIds.has(p.id))
      .map(p => ({ ...p }))
  }

  function getRecommendedPlayers(): RecommendedPlayer[] {
    const friendIds = new Set(friends.value.map(f => f.friendId))
    const inviteeIds = new Set(invites.value.filter(i => i.status === 'pending').map(i => i.toPlayerId))

    return mockPlayers
      .filter(p => p.id !== playerId.value && !friendIds.has(p.id) && !inviteeIds.has(p.id))
      .slice(0, 6)
      .map(p => ({
        ...p,
        matchReason: p.isOnline ? '当前在线' : '活跃度高'
      }))
  }

  function sendFriendInvite(toPlayerId: string, message?: string): boolean {
    if (friends.value.length >= MAX_FRIENDS) {
      alert(`好友数量已达上限 (${MAX_FRIENDS})`)
      return false
    }

    if (sentInvites.value.length >= MAX_PENDING_INVITES) {
      alert(`待处理邀请已达上限 (${MAX_PENDING_INVITES})`)
      return false
    }

    const existingFriend = friends.value.find(f => f.friendId === toPlayerId)
    if (existingFriend) {
      alert('对方已经是你的好友了')
      return false
    }

    const existingInvite = invites.value.find(
      i => i.status === 'pending' &&
        ((i.fromPlayerId === playerId.value && i.toPlayerId === toPlayerId) ||
         (i.fromPlayerId === toPlayerId && i.toPlayerId === playerId.value))
    )
    if (existingInvite) {
      alert('已有待处理的邀请')
      return false
    }

    const targetPlayer = mockPlayers.find(p => p.id === toPlayerId)
    if (!targetPlayer) {
      alert('找不到该玩家')
      return false
    }

    const now = Date.now()
    const invite: FriendInvite = {
      id: generateId('invite'),
      fromPlayerId: playerId.value,
      fromPlayerName: playerName.value,
      fromPlayerAvatar: playerAvatar.value,
      toPlayerId: targetPlayer.id,
      toPlayerName: targetPlayer.name,
      toPlayerAvatar: targetPlayer.avatar,
      message,
      status: 'pending',
      createdAt: now,
      expiresAt: now + INVITE_EXPIRE_HOURS * 3600000
    }

    invites.value.push(invite)

    addActivity({
      friendId: toPlayerId,
      activityType: 'friend_added',
      description: `向 ${targetPlayer.name} 发送了好友邀请`
    })

    saveAllData()
    return true
  }

  function acceptFriendInvite(inviteId: string): boolean {
    const invite = invites.value.find(i => i.id === inviteId)
    if (!invite || invite.status !== 'pending') {
      return false
    }

    if (friends.value.length >= MAX_FRIENDS) {
      alert(`好友数量已达上限 (${MAX_FRIENDS})`)
      return false
    }

    const now = Date.now()
    invite.status = 'accepted'
    invite.respondedAt = now

    const existingFriend = friends.value.find(f => f.friendId === invite.fromPlayerId)
    if (!existingFriend) {
      const friend: Friend = {
        id: generateId('friend'),
        playerId: playerId.value,
        friendId: invite.fromPlayerId,
        friendName: invite.fromPlayerName,
        friendAvatar: invite.fromPlayerAvatar,
        friendshipLevel: 1,
        friendshipExp: 0,
        mutualHelpCount: 0,
        totalHelpGiven: 0,
        totalHelpReceived: 0,
        isOnline: true,
        currentDay: 1,
        totalOrdersCompleted: 0,
        createdAt: now,
        lastInteractAt: now,
        isBlocked: false
      }
      friends.value.push(friend)

      addFriendshipExp(invite.fromPlayerId, 20)

      addActivity({
        friendId: invite.fromPlayerId,
        activityType: 'friend_added',
        description: `与 ${invite.fromPlayerName} 成为好友`
      })

      addNotification({
        type: 'milestone_unlocked',
        title: '🎉 新好友！',
        message: `你与 ${invite.fromPlayerName} 成为好友，获得 20 友谊经验`,
        fromPlayerId: invite.fromPlayerId,
        fromPlayerName: invite.fromPlayerName,
        fromPlayerAvatar: invite.fromPlayerAvatar
      })
    }

    saveAllData()
    return true
  }

  function rejectFriendInvite(inviteId: string): boolean {
    const invite = invites.value.find(i => i.id === inviteId)
    if (!invite || invite.status !== 'pending') {
      return false
    }

    invite.status = 'rejected'
    invite.respondedAt = Date.now()

    saveAllData()
    return true
  }

  function cancelFriendInvite(inviteId: string): boolean {
    const invite = invites.value.find(i => i.id === inviteId)
    if (!invite || invite.status !== 'pending' || invite.fromPlayerId !== playerId.value) {
      return false
    }

    invite.status = 'cancelled'
    invite.respondedAt = Date.now()

    saveAllData()
    return true
  }

  function removeFriend(friendId: string): boolean {
    const friendIndex = friends.value.findIndex(f => f.friendId === friendId)
    if (friendIndex === -1) return false

    const friend = friends.value[friendIndex]
    friends.value.splice(friendIndex, 1)

    addActivity({
      friendId,
      activityType: 'friend_removed',
      description: `删除了好友 ${friend.friendName}`
    })

    saveAllData()
    return true
  }

  function blockFriend(friendId: string): boolean {
    const friend = friends.value.find(f => f.friendId === friendId)
    if (!friend) return false

    friend.isBlocked = true
    saveAllData()
    return true
  }

  function unblockFriend(friendId: string): boolean {
    const friend = friends.value.find(f => f.friendId === friendId)
    if (!friend) return false

    friend.isBlocked = false
    saveAllData()
    return true
  }

  function getFriendById(friendId: string): Friend | undefined {
    return friends.value.find(f => f.friendId === friendId)
  }

  function startMutualTask(taskId: string, helperId: string): boolean {
    const task = availableMutualTasks.value.find(t => t.id === taskId)
    if (!task) return false

    const friend = friends.value.find(f => f.friendId === helperId && !f.isBlocked)
    if (!friend) {
      alert('找不到该好友')
      return false
    }

    if (friend.friendshipLevel < task.minFriendshipLevel) {
      alert(`需要友谊等级 Lv.${task.minFriendshipLevel} 才能发起此任务`)
      return false
    }

    const activeTasksWithFriend = mutualTaskProgresses.value.filter(
      t => t.status === 'in_progress' &&
        ((t.initiatorId === playerId.value && t.helperId === helperId) ||
         (t.initiatorId === helperId && t.helperId === playerId.value))
    ).length

    if (activeTasksWithFriend >= MAX_ACTIVE_TASKS_PER_FRIEND) {
      alert(`与该好友的进行中任务已达上限 (${MAX_ACTIVE_TASKS_PER_FRIEND})`)
      return false
    }

    const now = Date.now()
    const taskProgress: MutualTaskProgress = {
      id: generateId('task'),
      taskId: task.id,
      initiatorId: playerId.value,
      initiatorName: playerName.value,
      helperId: friend.friendId,
      helperName: friend.friendName,
      status: 'in_progress',
      progress: 0,
      helperProgress: 0,
      startedAt: now,
      expiresAt: now + task.duration * 1000
    }

    mutualTaskProgresses.value.push(taskProgress)

    friend.lastInteractAt = now

    addActivity({
      friendId: helperId,
      activityType: 'help_sent',
      description: `向 ${friend.friendName} 发起了「${task.title}」互助任务`
    })

    addNotification({
      type: 'task_request',
      title: '互助任务请求',
      message: `${playerName.value} 邀请你协助「${task.title}」`,
      fromPlayerId: friend.friendId,
      fromPlayerName: friend.friendName,
      fromPlayerAvatar: friend.friendAvatar,
      data: { taskProgressId: taskProgress.id, taskId: task.id }
    })

    saveAllData()
    return true
  }

  function completeTaskHelper(taskProgressId: string): boolean {
    const taskProgress = mutualTaskProgresses.value.find(t => t.id === taskProgressId)
    if (!taskProgress || taskProgress.status !== 'in_progress') {
      return false
    }

    const task = availableMutualTasks.value.find(t => t.id === taskProgress.taskId)
    if (!task) return false

    const friend = friends.value.find(f =>
      f.friendId === (taskProgress.initiatorId === playerId.value ? taskProgress.helperId : taskProgress.initiatorId)
    )

    taskProgress.helperProgress = task.target
    taskProgress.progress = task.target
    taskProgress.status = 'completed'
    taskProgress.completedAt = Date.now()

    if (friend) {
      friend.mutualHelpCount++
      friend.lastInteractAt = Date.now()

      if (taskProgress.initiatorId === playerId.value) {
        friend.totalHelpReceived++
      } else {
        friend.totalHelpGiven++
      }
    }

    addActivity({
      friendId: friend?.friendId || '',
      activityType: 'task_completed',
      description: `互助任务「${task.title}」已完成`
    })

    addNotification({
      type: 'task_completed',
      title: '✅ 互助任务完成',
      message: `「${task.title}」已完成，快去领取奖励吧！`,
      fromPlayerId: friend?.friendId || '',
      fromPlayerName: friend?.friendName || '',
      fromPlayerAvatar: friend?.friendAvatar || '',
      data: { taskProgressId: taskProgress.id, taskId: task.id }
    })

    addNotification({
      type: 'reward_available',
      title: '🎁 奖励待领取',
      message: `「${task.title}」的奖励已准备好`,
      fromPlayerId: friend?.friendId || '',
      fromPlayerName: friend?.friendName || '',
      fromPlayerAvatar: friend?.friendAvatar || '',
      data: { taskProgressId: taskProgress.id, taskId: task.id }
    })

    saveAllData()
    return true
  }

  function claimMutualTaskReward(taskProgressId: string): boolean {
    const taskProgress = mutualTaskProgresses.value.find(t => t.id === taskProgressId)
    if (!taskProgress || taskProgress.status !== 'completed' || taskProgress.claimedAt) {
      return false
    }

    const task = availableMutualTasks.value.find(t => t.id === taskProgress.taskId)
    if (!task) return false

    const gameStore = useGameStore()
    const seasonStore = useSeasonStore()

    taskProgress.claimedAt = Date.now()
    taskProgress.status = 'claimed'

    let expGained = 0
    task.rewards.forEach(reward => {
      switch (reward.type) {
        case 'currency':
          if (typeof reward.value === 'number') {
            gameStore.addMoney(reward.value)
          }
          break
        case 'exp':
          if (typeof reward.value === 'number') {
            expGained += reward.value
            seasonStore.addExp(reward.value, 'mutual_task', task.id)
          }
          break
        case 'buff':
        case 'item':
        case 'badge':
        case 'title':
          break
      }
    })

    const friend = friends.value.find(f =>
      f.friendId === (taskProgress.initiatorId === playerId.value ? taskProgress.helperId : taskProgress.initiatorId)
    )

    if (friend && expGained > 0) {
      addFriendshipExp(friend.friendId, expGained)
    }

    addActivity({
      friendId: friend?.friendId || '',
      activityType: 'reward_claimed',
      description: `领取了「${task.title}」的奖励`
    })

    saveAllData()
    return true
  }

  function addFriendshipExp(friendId: string, amount: number): boolean {
    const friend = friends.value.find(f => f.friendId === friendId)
    if (!friend) return false

    const oldLevel = friend.friendshipLevel
    friend.friendshipExp += amount

    const newLevel = getFriendshipLevelFromExp(friend.friendshipExp)

    if (newLevel > oldLevel) {
      friend.friendshipLevel = newLevel

      const milestone = getMilestoneByLevel(newLevel)
      if (milestone) {
        addNotification({
          type: 'milestone_unlocked',
          title: '🎉 友谊里程碑！',
          message: `与 ${friend.friendName} 的友谊等级提升至 Lv.${newLevel} - ${milestone.name}`,
          fromPlayerId: friend.friendId,
          fromPlayerName: friend.friendName,
          fromPlayerAvatar: friend.friendAvatar,
          data: { level: newLevel, milestoneId: milestone.id }
        })

        addActivity({
          friendId: friend.friendId,
          activityType: 'milestone_unlocked',
          description: `与 ${friend.friendName} 的友谊达到 ${milestone.name} (Lv.${newLevel})`
        })

        const gameStore = useGameStore()
        const seasonStore = useSeasonStore()

        milestone.rewards.forEach(reward => {
          switch (reward.type) {
            case 'currency':
              if (typeof reward.value === 'number') {
                gameStore.addMoney(reward.value)
              }
              break
            case 'exp':
              if (typeof reward.value === 'number') {
                seasonStore.addExp(reward.value, 'friendship_milestone', milestone.id)
              }
              break
            case 'item':
            case 'badge':
            case 'title':
              break
          }
        })
      }
    }

    saveAllData()
    return true
  }

  function getFriendshipProgress(friend: Friend): { current: number; next: number; percentage: number } {
    const currentLevelExp = getExpForFriendshipLevel(friend.friendshipLevel)
    const nextMilestone = getNextMilestone(friend.friendshipLevel)
    const nextLevelExp = nextMilestone ? nextMilestone.expRequired : currentLevelExp + 1000

    const current = friend.friendshipExp - currentLevelExp
    const next = nextLevelExp - currentLevelExp
    const percentage = next > 0 ? Math.min(100, (current / next) * 100) : 100

    return { current, next, percentage }
  }

  function addNotification(params: Omit<FriendNotification, 'id' | 'playerId' | 'read' | 'createdAt'>) {
    const notification: FriendNotification = {
      ...params,
      id: generateId('notif'),
      playerId: playerId.value,
      read: false,
      createdAt: Date.now()
    }
    notifications.value.unshift(notification)
    if (notifications.value.length > 100) {
      notifications.value = notifications.value.slice(0, 100)
    }
    saveAllData()
  }

  function markNotificationAsRead(notificationId: string) {
    const notif = notifications.value.find(n => n.id === notificationId)
    if (notif) {
      notif.read = true
      saveAllData()
    }
  }

  function markAllNotificationsAsRead() {
    notifications.value.forEach(n => {
      n.read = true
    })
    saveAllData()
  }

  function clearNotifications() {
    notifications.value = []
    saveAllData()
  }

  function addActivity(params: Omit<FriendActivity, 'id' | 'playerId' | 'timestamp'>) {
    const activity: FriendActivity = {
      ...params,
      id: generateId('act'),
      playerId: playerId.value,
      timestamp: Date.now()
    }
    activities.value.unshift(activity)
    if (activities.value.length > 200) {
      activities.value = activities.value.slice(0, 200)
    }
    saveAllData()
  }

  function clearAllData() {
    friends.value = []
    invites.value = []
    mutualTaskProgresses.value = []
    notifications.value = []
    activities.value = []
    localStorage.removeItem(FRIEND_STORAGE_KEY)
  }

  return {
    playerId,
    playerName,
    playerAvatar,
    friends,
    invites,
    mutualTaskProgresses,
    notifications,
    activities,
    availableMutualTasks,
    acceptedFriends,
    blockedFriends,
    pendingInvites,
    sentInvites,
    pendingInviteCount,
    activeMutualTasks,
    activeTaskCount,
    unclaimedRewardCount,
    unreadNotifications,
    unreadNotificationCount,
    totalUnreadCount,
    statistics,
    initFriendSystem,
    searchPlayers,
    getRecommendedPlayers,
    sendFriendInvite,
    acceptFriendInvite,
    rejectFriendInvite,
    cancelFriendInvite,
    removeFriend,
    blockFriend,
    unblockFriend,
    getFriendById,
    startMutualTask,
    completeTaskHelper,
    claimMutualTaskReward,
    addFriendshipExp,
    getFriendshipProgress,
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    addActivity,
    clearAllData,
    saveAllData
  }
})
