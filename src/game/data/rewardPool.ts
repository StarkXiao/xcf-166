import type { RewardPoolTier } from '@/types/task'

export const rewardPoolTiers: RewardPoolTier[] = [
  {
    id: 'pool_tier_1',
    threshold: 50,
    name: '铜奖池',
    description: '奖励池初步解锁，内含基础资源',
    rewards: [
      { id: 'pool_reward_001', type: 'currency', name: '金币', icon: '💰', value: 1000, rarity: 'common' },
      { id: 'pool_reward_002', type: 'exp', name: '赛季经验', icon: '⭐', value: 200, rarity: 'common' },
    ],
    icon: '🥉',
  },
  {
    id: 'pool_tier_2',
    threshold: 120,
    name: '银奖池',
    description: '奖励池进一步解锁，内含珍稀道具',
    rewards: [
      { id: 'pool_reward_003', type: 'currency', name: '金币', icon: '💰', value: 3000, rarity: 'uncommon' },
      { id: 'pool_reward_004', type: 'item', name: '净化符', icon: '🔮', value: 'purify_talisman', rarity: 'uncommon' },
      { id: 'pool_reward_005', type: 'exp', name: '赛季经验', icon: '⭐', value: 500, rarity: 'uncommon' },
    ],
    icon: '🥈',
  },
  {
    id: 'pool_tier_3',
    threshold: 200,
    name: '金奖池',
    description: '奖励池高级解锁，内含稀有徽章',
    rewards: [
      { id: 'pool_reward_006', type: 'currency', name: '金币', icon: '💰', value: 8000, rarity: 'rare' },
      { id: 'pool_reward_007', type: 'badge', name: '全能勋章', icon: '🎖️', value: 'badge_allround', rarity: 'rare' },
      { id: 'pool_reward_008', type: 'exp', name: '赛季经验', icon: '⭐', value: 1000, rarity: 'rare' },
    ],
    icon: '🥇',
  },
  {
    id: 'pool_tier_4',
    threshold: 300,
    name: '铂金奖池',
    description: '奖励池精英解锁，内含传说道具',
    rewards: [
      { id: 'pool_reward_009', type: 'currency', name: '金币', icon: '💰', value: 20000, rarity: 'epic' },
      { id: 'pool_reward_010', type: 'title', name: '万能行者', icon: '👑', value: 'title_versatile', rarity: 'epic' },
      { id: 'pool_reward_011', type: 'item', name: '高级净化符咒', icon: '📜', value: 'purify_talisman_advanced', rarity: 'epic' },
    ],
    icon: '💎',
  },
  {
    id: 'pool_tier_5',
    threshold: 450,
    name: '钻石奖池',
    description: '奖励池终极解锁，内含传说品质奖励',
    rewards: [
      { id: 'pool_reward_012', type: 'currency', name: '金币', icon: '💰', value: 50000, rarity: 'legendary' },
      { id: 'pool_reward_013', type: 'cosmetic', name: '万象归一', icon: '🌟', value: 'skin_omni', rarity: 'legendary' },
      { id: 'pool_reward_014', type: 'badge', name: '至高勋章', icon: '🏅', value: 'badge_supreme', rarity: 'legendary' },
    ],
    icon: '🏆',
  },
]

export function getTierById(tierId: string): RewardPoolTier | undefined {
  return rewardPoolTiers.find(t => t.id === tierId)
}

export function getNextTier(currentPoints: number): RewardPoolTier | undefined {
  return rewardPoolTiers.find(t => t.threshold > currentPoints)
}
