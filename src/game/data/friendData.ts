import type { MutualTask, FriendshipMilestone } from '@/types/friend'

export const mutualTasks: MutualTask[] = [
  {
    id: 'mutual_001',
    type: 'order_help',
    title: '订单援助',
    description: '帮助好友完成一个订单处理，双方均可获得奖励',
    target: 1,
    unit: '单',
    duration: 3600,
    icon: '📋',
    rewards: [
      {
        id: 'reward_001',
        type: 'currency',
        name: '金币',
        icon: '💰',
        value: 500,
        rarity: 'common',
        isShared: true
      },
      {
        id: 'reward_002',
        type: 'exp',
        name: '友谊经验',
        icon: '⭐',
        value: 20,
        rarity: 'common',
        isShared: true
      }
    ],
    requiresFriend: true,
    minFriendshipLevel: 1
  },
  {
    id: 'mutual_002',
    type: 'relic_purify',
    title: '遗物净化',
    description: '协助好友净化一件遗物，降低处理难度',
    target: 1,
    unit: '件',
    duration: 7200,
    icon: '✨',
    rewards: [
      {
        id: 'reward_003',
        type: 'currency',
        name: '金币',
        icon: '💰',
        value: 800,
        rarity: 'uncommon',
        isShared: true
      },
      {
        id: 'reward_004',
        type: 'item',
        name: '净化符',
        icon: '🔮',
        value: 1,
        rarity: 'uncommon',
        isShared: false
      }
    ],
    requiresFriend: true,
    minFriendshipLevel: 2
  },
  {
    id: 'mutual_003',
    type: 'sanity_recover',
    title: '心灵慰藉',
    description: '倾听好友的倾诉，帮助其恢复理智值',
    target: 30,
    unit: '点',
    duration: 1800,
    icon: '💚',
    rewards: [
      {
        id: 'reward_005',
        type: 'buff',
        name: '心灵守护',
        icon: '🛡️',
        value: 'sanity_boost_24h',
        rarity: 'rare',
        isShared: true
      },
      {
        id: 'reward_006',
        type: 'exp',
        name: '友谊经验',
        icon: '⭐',
        value: 30,
        rarity: 'common',
        isShared: true
      }
    ],
    requiresFriend: true,
    minFriendshipLevel: 1
  },
  {
    id: 'mutual_004',
    type: 'reputation_boost',
    title: '声望提携',
    description: '在同行中为美言，提升双方声望',
    target: 50,
    unit: '点',
    duration: 14400,
    icon: '🌟',
    rewards: [
      {
        id: 'reward_007',
        type: 'currency',
        name: '金币',
        icon: '💰',
        value: 1200,
        rarity: 'rare',
        isShared: true
      },
      {
        id: 'reward_008',
        type: 'badge',
        name: '互助勋章',
        icon: '🎖️',
        value: 'mutual_help_1',
        rarity: 'rare',
        isShared: true
      }
    ],
    requiresFriend: true,
    minFriendshipLevel: 3
  },
  {
    id: 'mutual_005',
    type: 'money_gift',
    title: '资金拆借',
    description: '在好友困难时伸出援手，赠送一笔启动资金',
    target: 1000,
    unit: '金币',
    duration: 0,
    icon: '💝',
    rewards: [
      {
        id: 'reward_009',
        type: 'title',
        name: '仗义疏财',
        icon: '👑',
        value: 'generous_friend',
        rarity: 'epic',
        isShared: false
      },
      {
        id: 'reward_010',
        type: 'exp',
        name: '友谊经验',
        icon: '⭐',
        value: 50,
        rarity: 'uncommon',
        isShared: true
      }
    ],
    requiresFriend: true,
    minFriendshipLevel: 2
  }
]

export const friendshipMilestones: FriendshipMilestone[] = [
  {
    id: 'milestone_001',
    level: 1,
    expRequired: 0,
    name: '初识',
    description: '刚刚认识的朋友，开启你们的友谊之旅',
    rewards: [],
    icon: '🤝'
  },
  {
    id: 'milestone_002',
    level: 2,
    expRequired: 100,
    name: '熟识',
    description: '逐渐熟悉的朋友，可以互相帮助处理简单事务',
    rewards: [
      {
        id: 'milestone_reward_001',
        type: 'currency',
        name: '金币',
        icon: '💰',
        value: 1000,
        rarity: 'common',
        isShared: true
      }
    ],
    icon: '😊'
  },
  {
    id: 'milestone_003',
    level: 3,
    expRequired: 300,
    name: '好友',
    description: '信任的好友，可以托付重要的事情',
    rewards: [
      {
        id: 'milestone_reward_002',
        type: 'item',
        name: '友谊护符',
        icon: '🔮',
        value: 1,
        rarity: 'uncommon',
        isShared: true
      }
    ],
    icon: '❤️'
  },
  {
    id: 'milestone_004',
    level: 4,
    expRequired: 600,
    name: '挚友',
    description: '亲密的挚友，愿意为对方付出更多',
    rewards: [
      {
        id: 'milestone_reward_003',
        type: 'badge',
        name: '挚友徽章',
        icon: '🎖️',
        value: 'best_friend_badge',
        rarity: 'rare',
        isShared: true
      }
    ],
    icon: '💎'
  },
  {
    id: 'milestone_005',
    level: 5,
    expRequired: 1000,
    name: '生死之交',
    description: '可以托付生死的至交，友谊的最高境界',
    rewards: [
      {
        id: 'milestone_reward_004',
        type: 'title',
        name: '生死之交',
        icon: '👑',
        value: 'sworn_brother',
        rarity: 'legendary',
        isShared: true
      },
      {
        id: 'milestone_reward_005',
        type: 'currency',
        name: '金币',
        icon: '💰',
        value: 5000,
        rarity: 'epic',
        isShared: true
      }
    ],
    icon: '🏆'
  }
]

export const mockPlayers = [
  { id: 'player_001', name: '守夜人老张', avatar: '👴', day: 15, totalOrders: 120, isOnline: true },
  { id: 'player_002', name: '遗物猎人小李', avatar: '🧑', day: 8, totalOrders: 45, isOnline: true },
  { id: 'player_003', name: '殡仪馆学徒', avatar: '👧', day: 22, totalOrders: 200, isOnline: false },
  { id: 'player_004', name: '午夜来客', avatar: '🕵️', day: 30, totalOrders: 350, isOnline: true },
  { id: 'player_005', name: '安静的守护者', avatar: '🧙', day: 12, totalOrders: 78, isOnline: false },
  { id: 'player_006', name: '追忆者', avatar: '👩', day: 5, totalOrders: 20, isOnline: true },
  { id: 'player_007', name: '灵魂摆渡人', avatar: '🧔', day: 45, totalOrders: 520, isOnline: false },
  { id: 'player_008', name: '新来的助手', avatar: '🧒', day: 3, totalOrders: 8, isOnline: true }
]

export function getMutualTaskById(taskId: string): MutualTask | undefined {
  return mutualTasks.find(t => t.id === taskId)
}

export function getMilestoneByLevel(level: number): FriendshipMilestone | undefined {
  return friendshipMilestones.find(m => m.level === level)
}

export function getNextMilestone(currentLevel: number): FriendshipMilestone | undefined {
  return friendshipMilestones.find(m => m.level > currentLevel)
}

export function getExpForFriendshipLevel(level: number): number {
  const milestone = friendshipMilestones.find(m => m.level === level)
  return milestone?.expRequired || 0
}

export function getFriendshipLevelFromExp(totalExp: number): number {
  let level = 1
  for (const milestone of friendshipMilestones) {
    if (totalExp >= milestone.expRequired) {
      level = milestone.level
    } else {
      break
    }
  }
  return level
}
