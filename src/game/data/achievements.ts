import type { Achievement } from '@/types/achievement'

export const achievements: Achievement[] = [
  {
    id: 'ach_first_order',
    name: '初入茅庐',
    description: '完成你的第一份订单',
    category: 'gameplay',
    rarity: 'common',
    icon: '📝',
    condition: {
      type: 'order_complete',
      target: 1
    },
    rewards: [
      {
        type: 'currency',
        id: 'reward_ach_first_order_1',
        name: '启动资金',
        icon: '💰',
        value: 500,
        rarity: 'common'
      },
      {
        type: 'badge',
        id: 'badge_first_order',
        name: '新手实习生',
        icon: '🎖️',
        value: '新手实习生徽章',
        rarity: 'common'
      }
    ],
    isHidden: false,
    order: 1
  },
  {
    id: 'ach_order_10',
    name: '渐入佳境',
    description: '累计完成 10 份订单',
    category: 'gameplay',
    rarity: 'common',
    icon: '📋',
    condition: {
      type: 'order_complete',
      target: 10
    },
    rewards: [
      {
        type: 'currency',
        id: 'reward_ach_order_10_1',
        name: '辛勤奖励',
        icon: '💰',
        value: 1000,
        rarity: 'common'
      }
    ],
    isHidden: false,
    order: 2
  },
  {
    id: 'ach_order_50',
    name: '熟练工',
    description: '累计完成 50 份订单',
    category: 'gameplay',
    rarity: 'uncommon',
    icon: '📚',
    condition: {
      type: 'order_complete',
      target: 50
    },
    rewards: [
      {
        type: 'currency',
        id: 'reward_ach_order_50_1',
        name: '熟练奖励',
        icon: '💰',
        value: 3000,
        rarity: 'uncommon'
      },
      {
        type: 'title',
        id: 'title_skilled',
        name: '熟练处理师',
        icon: '👔',
        value: '熟练处理师',
        rarity: 'uncommon'
      }
    ],
    isHidden: false,
    order: 3
  },
  {
    id: 'ach_order_100',
    name: '行业精英',
    description: '累计完成 100 份订单',
    category: 'gameplay',
    rarity: 'rare',
    icon: '🏆',
    condition: {
      type: 'order_complete',
      target: 100
    },
    rewards: [
      {
        type: 'currency',
        id: 'reward_ach_order_100_1',
        name: '精英奖励',
        icon: '💰',
        value: 8000,
        rarity: 'rare'
      },
      {
        type: 'badge',
        id: 'badge_elite',
        name: '行业精英徽章',
        icon: '🏅',
        value: '行业精英徽章',
        rarity: 'rare'
      }
    ],
    isHidden: false,
    order: 4
  },
  {
    id: 'ach_day_7',
    name: '坚持一周',
    description: '连续度过 7 天',
    category: 'gameplay',
    rarity: 'common',
    icon: '📅',
    condition: {
      type: 'day_pass',
      target: 7
    },
    rewards: [
      {
        type: 'currency',
        id: 'reward_ach_day_7_1',
        name: '坚持奖励',
        icon: '💰',
        value: 800,
        rarity: 'common'
      }
    ],
    isHidden: false,
    order: 5
  },
  {
    id: 'ach_day_30',
    name: '月度坚守',
    description: '连续度过 30 天',
    category: 'gameplay',
    rarity: 'rare',
    icon: '🗓️',
    condition: {
      type: 'day_pass',
      target: 30
    },
    rewards: [
      {
        type: 'currency',
        id: 'reward_ach_day_30_1',
        name: '坚守奖励',
        icon: '💰',
        value: 5000,
        rarity: 'rare'
      },
      {
        type: 'title',
        id: 'title_veteran',
        name: '资深处理师',
        icon: '🎩',
        value: '资深处理师',
        rarity: 'rare'
      }
    ],
    isHidden: false,
    order: 6
  },
  {
    id: 'ach_relic_10',
    name: '净化新手',
    description: '累计净化 10 件遗物',
    category: 'collection',
    rarity: 'common',
    icon: '✨',
    condition: {
      type: 'relic_purify',
      target: 10
    },
    rewards: [
      {
        type: 'currency',
        id: 'reward_ach_relic_10_1',
        name: '净化奖励',
        icon: '💰',
        value: 1000,
        rarity: 'common'
      }
    ],
    isHidden: false,
    order: 7
  },
  {
    id: 'ach_relic_50',
    name: '净化大师',
    description: '累计净化 50 件遗物',
    category: 'collection',
    rarity: 'uncommon',
    icon: '🌟',
    condition: {
      type: 'relic_purify',
      target: 50
    },
    rewards: [
      {
        type: 'currency',
        id: 'reward_ach_relic_50_1',
        name: '大师奖励',
        icon: '💰',
        value: 4000,
        rarity: 'uncommon'
      },
      {
        type: 'badge',
        id: 'badge_purify_master',
        name: '净化大师徽章',
        icon: '💫',
        value: '净化大师徽章',
        rarity: 'uncommon'
      }
    ],
    isHidden: false,
    order: 8
  },
  {
    id: 'ach_money_10000',
    name: '小有积蓄',
    description: '累计赚取 10,000 金钱',
    category: 'gameplay',
    rarity: 'uncommon',
    icon: '💰',
    condition: {
      type: 'money_earn',
      target: 10000
    },
    rewards: [
      {
        type: 'currency',
        id: 'reward_ach_money_10000_1',
        name: '理财奖励',
        icon: '💰',
        value: 2000,
        rarity: 'uncommon'
      }
    ],
    isHidden: false,
    order: 9
  },
  {
    id: 'ach_money_50000',
    name: '富甲一方',
    description: '累计赚取 50,000 金钱',
    category: 'gameplay',
    rarity: 'rare',
    icon: '💎',
    condition: {
      type: 'money_earn',
      target: 50000
    },
    rewards: [
      {
        type: 'currency',
        id: 'reward_ach_money_50000_1',
        name: '富豪奖励',
        icon: '💰',
        value: 10000,
        rarity: 'rare'
      },
      {
        type: 'title',
        id: 'title_rich',
        name: '富贵人家',
        icon: '👑',
        value: '富贵人家',
        rarity: 'rare'
      }
    ],
    isHidden: false,
    order: 10
  },
  {
    id: 'ach_reputation_50',
    name: '口碑相传',
    description: '声望达到 50',
    category: 'gameplay',
    rarity: 'uncommon',
    icon: '⭐',
    condition: {
      type: 'reputation_total',
      target: 50
    },
    rewards: [
      {
        type: 'currency',
        id: 'reward_ach_reputation_50_1',
        name: '声望奖励',
        icon: '💰',
        value: 1500,
        rarity: 'uncommon'
      }
    ],
    isHidden: false,
    order: 11
  },
  {
    id: 'ach_reputation_80',
    name: '声名远扬',
    description: '声望达到 80',
    category: 'gameplay',
    rarity: 'rare',
    icon: '🌟',
    condition: {
      type: 'reputation_total',
      target: 80
    },
    rewards: [
      {
        type: 'currency',
        id: 'reward_ach_reputation_80_1',
        name: '名望奖励',
        icon: '💰',
        value: 5000,
        rarity: 'rare'
      },
      {
        type: 'badge',
        id: 'badge_famous',
        name: '声名远扬徽章',
        icon: '🌠',
        value: '声名远扬徽章',
        rarity: 'rare'
      }
    ],
    isHidden: false,
    order: 12
  },
  {
    id: 'ach_perfect_5',
    name: '完美主义',
    description: '累计完美完成 5 份订单',
    category: 'gameplay',
    rarity: 'epic',
    icon: '💯',
    condition: {
      type: 'perfect_complete',
      target: 5
    },
    rewards: [
      {
        type: 'currency',
        id: 'reward_ach_perfect_5_1',
        name: '完美奖励',
        icon: '💰',
        value: 10000,
        rarity: 'epic'
      },
      {
        type: 'title',
        id: 'title_perfect',
        name: '完美主义者',
        icon: '✨',
        value: '完美主义者',
        rarity: 'epic'
      }
    ],
    isHidden: false,
    order: 13
  },
  {
    id: 'ach_sanity_30_days',
    name: '心如止水',
    description: '连续 30 天理智值保持在 50 以上',
    category: 'gameplay',
    rarity: 'epic',
    icon: '🧘',
    condition: {
      type: 'sanity_maintain',
      target: 30,
      params: { minSanity: 50 }
    },
    rewards: [
      {
        type: 'currency',
        id: 'reward_ach_sanity_30_1',
        name: '心智奖励',
        icon: '💰',
        value: 8000,
        rarity: 'epic'
      },
      {
        type: 'badge',
        id: 'badge_calm',
        name: '心如止水徽章',
        icon: '🕊️',
        value: '心如止水徽章',
        rarity: 'epic'
      }
    ],
    isHidden: false,
    order: 14
  },
  {
    id: 'ach_character_all',
    name: '角色收藏家',
    description: '解锁所有角色',
    category: 'collection',
    rarity: 'legendary',
    icon: '🎭',
    condition: {
      type: 'character_unlock',
      target: 999,
      params: { unlockAll: true }
    },
    rewards: [
      {
        type: 'currency',
        id: 'reward_ach_character_all_1',
        name: '收藏奖励',
        icon: '💰',
        value: 20000,
        rarity: 'legendary'
      },
      {
        type: 'title',
        id: 'title_collector',
        name: '万物收藏',
        icon: '🏛️',
        value: '万物收藏',
        rarity: 'legendary'
      },
      {
        type: 'badge',
        id: 'badge_character_collector',
        name: '角色收藏家徽章',
        icon: '👥',
        value: '角色收藏家徽章',
        rarity: 'legendary'
      }
    ],
    isHidden: false,
    order: 15
  },
  {
    id: 'ach_skill_max',
    name: '技能大师',
    description: '将任意技能升级至满级',
    category: 'gameplay',
    rarity: 'epic',
    icon: '⚡',
    condition: {
      type: 'skill_upgrade',
      target: 1,
      params: { maxLevel: true }
    },
    rewards: [
      {
        type: 'currency',
        id: 'reward_ach_skill_max_1',
        name: '技能奖励',
        icon: '💰',
        value: 8000,
        rarity: 'epic'
      },
      {
        type: 'badge',
        id: 'badge_skill_master',
        name: '技能大师徽章',
        icon: '🔮',
        value: '技能大师徽章',
        rarity: 'epic'
      }
    ],
    isHidden: false,
    order: 16
  },
  {
    id: 'ach_season_10',
    name: '赛季新星',
    description: '赛季等级达到 10 级',
    category: 'seasonal',
    rarity: 'uncommon',
    icon: '🌱',
    condition: {
      type: 'season_level',
      target: 10
    },
    rewards: [
      {
        type: 'exp',
        id: 'reward_ach_season_10_1',
        name: '赛季经验',
        icon: '⭐',
        value: 500,
        rarity: 'uncommon'
      }
    ],
    isHidden: false,
    order: 17
  },
  {
    id: 'ach_season_50',
    name: '赛季达人',
    description: '赛季等级达到 50 级',
    category: 'seasonal',
    rarity: 'rare',
    icon: '🌳',
    condition: {
      type: 'season_level',
      target: 50
    },
    rewards: [
      {
        type: 'exp',
        id: 'reward_ach_season_50_1',
        name: '赛季经验',
        icon: '⭐',
        value: 2000,
        rarity: 'rare'
      },
      {
        type: 'badge',
        id: 'badge_season_pro',
        name: '赛季达人徽章',
        icon: '🏅',
        value: '赛季达人徽章',
        rarity: 'rare'
      }
    ],
    isHidden: false,
    order: 18
  },
  {
    id: 'ach_anomaly_10',
    name: '异常抗性',
    description: '成功抵抗 10 次异常事件',
    category: 'gameplay',
    rarity: 'uncommon',
    icon: '🛡️',
    condition: {
      type: 'anomaly_resist',
      target: 10
    },
    rewards: [
      {
        type: 'currency',
        id: 'reward_ach_anomaly_10_1',
        name: '抗性奖励',
        icon: '💰',
        value: 2000,
        rarity: 'uncommon'
      }
    ],
    isHidden: false,
    order: 19
  },
  {
    id: 'ach_login_7',
    name: '七日签到',
    description: '累计登录 7 天',
    category: 'social',
    rarity: 'common',
    icon: '📆',
    condition: {
      type: 'total_login',
      target: 7
    },
    rewards: [
      {
        type: 'currency',
        id: 'reward_ach_login_7_1',
        name: '签到奖励',
        icon: '💰',
        value: 700,
        rarity: 'common'
      }
    ],
    isHidden: false,
    order: 20
  },
  {
    id: 'ach_consecutive_login_30',
    name: '坚持不懈',
    description: '连续登录 30 天',
    category: 'social',
    rarity: 'epic',
    icon: '🔥',
    condition: {
      type: 'consecutive_login',
      target: 30
    },
    rewards: [
      {
        type: 'currency',
        id: 'reward_ach_consecutive_30_1',
        name: '坚持奖励',
        icon: '💰',
        value: 10000,
        rarity: 'epic'
      },
      {
        type: 'title',
        id: 'title_dedicated',
        name: '忠实玩家',
        icon: '💎',
        value: '忠实玩家',
        rarity: 'epic'
      }
    ],
    isHidden: false,
    order: 21
  },
  {
    id: 'ach_relic_all_types',
    name: '遗物百科',
    description: '收集并净化所有类型的遗物',
    category: 'collection',
    rarity: 'legendary',
    icon: '📖',
    condition: {
      type: 'relic_type_collect',
      target: 8,
      params: { collectAllTypes: true }
    },
    rewards: [
      {
        type: 'currency',
        id: 'reward_ach_relic_all_types_1',
        name: '百科奖励',
        icon: '💰',
        value: 15000,
        rarity: 'legendary'
      },
      {
        type: 'badge',
        id: 'badge_encyclopedia',
        name: '遗物百科徽章',
        icon: '📚',
        value: '遗物百科徽章',
        rarity: 'legendary'
      }
    ],
    isHidden: false,
    order: 22
  },
  {
    id: 'ach_order_200',
    name: '传奇处理师',
    description: '累计完成 200 份订单',
    category: 'gameplay',
    rarity: 'legendary',
    icon: '👑',
    condition: {
      type: 'order_complete',
      target: 200
    },
    rewards: [
      {
        type: 'currency',
        id: 'reward_ach_order_200_1',
        name: '传奇奖励',
        icon: '💰',
        value: 20000,
        rarity: 'legendary'
      },
      {
        type: 'title',
        id: 'title_legend',
        name: '传奇处理师',
        icon: '👑',
        value: '传奇处理师',
        rarity: 'legendary'
      },
      {
        type: 'badge',
        id: 'badge_legend',
        name: '传奇徽章',
        icon: '🏆',
        value: '传奇徽章',
        rarity: 'legendary'
      }
    ],
    isHidden: false,
    order: 23
  },
  {
    id: 'ach_hidden_1',
    name: '???',
    description: '完成某个隐藏条件解锁',
    category: 'hidden',
    rarity: 'epic',
    icon: '❓',
    condition: {
      type: 'custom_event',
      target: 1,
      params: { eventName: 'perfect_night_order' }
    },
    rewards: [
      {
        type: 'currency',
        id: 'reward_ach_hidden_1_1',
        name: '神秘奖励',
        icon: '💰',
        value: 6666,
        rarity: 'epic'
      },
      {
        type: 'badge',
        id: 'badge_night_owl',
        name: '夜行者徽章',
        icon: '🌙',
        value: '夜行者徽章',
        rarity: 'epic'
      }
    ],
    isHidden: true,
    order: 24
  },
  {
    id: 'ach_hidden_2',
    name: '???',
    description: '探索隐藏内容解锁',
    category: 'hidden',
    rarity: 'legendary',
    icon: '🎭',
    condition: {
      type: 'custom_event',
      target: 1,
      params: { eventName: 'all_characters_max_level' }
    },
    rewards: [
      {
        type: 'currency',
        id: 'reward_ach_hidden_2_1',
        name: '神秘大奖',
        icon: '💰',
        value: 99999,
        rarity: 'legendary'
      },
      {
        type: 'title',
        id: 'title_mystery',
        name: '神秘探索者',
        icon: '🎭',
        value: '神秘探索者',
        rarity: 'legendary'
      }
    ],
    isHidden: true,
    order: 25
  }
]

export function getAchievementById(id: string): Achievement | undefined {
  return achievements.find(a => a.id === id)
}

export function getAchievementsByCategory(category: string): Achievement[] {
  return achievements.filter(a => a.category === category)
}

export function getVisibleAchievements(): Achievement[] {
  return achievements.filter(a => !a.isHidden)
}
