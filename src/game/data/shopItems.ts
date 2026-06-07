import type { ShopItem, DiscountConfig } from '../../types/shop'

export function getInitialShopItems(): ShopItem[] {
  return [
    {
      id: 'sanity_potion_small',
      name: '小型理智药剂',
      description: '恢复20点理智值，在紧张的工作后让你放松一下。',
      category: 'consumable',
      rarity: 'common',
      icon: '🧪',
      price: { money: 300 },
      originalPrice: { money: 300 },
      stock: 99,
      maxStock: 99,
      maxPurchasePerUser: 10,
      isOnSale: false,
      effect: {
        type: 'instant',
        target: 'sanity',
        value: 20
      }
    },
    {
      id: 'sanity_potion_medium',
      name: '中型理智药剂',
      description: '恢复50点理智值，帮助你应对更棘手的异常。',
      category: 'consumable',
      rarity: 'uncommon',
      icon: '⚗️',
      price: { money: 800 },
      originalPrice: { money: 800 },
      stock: 50,
      maxStock: 50,
      maxPurchasePerUser: 5,
      isOnSale: false,
      effect: {
        type: 'instant',
        target: 'sanity',
        value: 50
      }
    },
    {
      id: 'sanity_potion_large',
      name: '大型理智药剂',
      description: '完全恢复理智值，让你以最佳状态面对任何挑战。',
      category: 'consumable',
      rarity: 'rare',
      icon: '🍷',
      price: { money: 2000, reputation: 10 },
      originalPrice: { money: 2000, reputation: 10 },
      stock: 20,
      maxStock: 20,
      maxPurchasePerUser: 3,
      isOnSale: false,
      effect: {
        type: 'instant',
        target: 'sanity',
        value: 100,
        special: 'full_restore'
      }
    },
    {
      id: 'lucky_charm',
      name: '幸运护符',
      description: '接下来3天异常事件发生概率降低50%。',
      category: 'buff',
      rarity: 'uncommon',
      icon: '🍀',
      price: { money: 1500 },
      originalPrice: { money: 1500 },
      stock: 30,
      maxStock: 30,
      maxPurchasePerUser: 5,
      isOnSale: false,
      effect: {
        type: 'buff',
        target: 'buff',
        value: 50,
        duration: 3,
        buffType: 'anomaly_resistance'
      }
    },
    {
      id: 'focus_crystal',
      name: '专注水晶',
      description: '接下来3天处理效率提升30%。',
      category: 'buff',
      rarity: 'uncommon',
      icon: '💎',
      price: { money: 1200 },
      originalPrice: { money: 1200 },
      stock: 30,
      maxStock: 30,
      maxPurchasePerUser: 5,
      isOnSale: false,
      effect: {
        type: 'buff',
        target: 'buff',
        value: 30,
        duration: 3,
        buffType: 'processing_speed'
      }
    },
    {
      id: 'golden_contract',
      name: '黄金契约',
      description: '接下来3天订单报酬提升25%。',
      category: 'buff',
      rarity: 'rare',
      icon: '📜',
      price: { money: 2500, reputation: 15 },
      originalPrice: { money: 2500, reputation: 15 },
      stock: 15,
      maxStock: 15,
      maxPurchasePerUser: 3,
      isOnSale: false,
      effect: {
        type: 'buff',
        target: 'buff',
        value: 25,
        duration: 3,
        buffType: 'reward_multiplier'
      },
      unlockCondition: {
        type: 'reputation',
        value: 60
      }
    },
    {
      id: 'protective_ward',
      name: '防护罩',
      description: '免疫下一次异常事件的负面影响。',
      category: 'consumable',
      rarity: 'rare',
      icon: '🛡️',
      price: { money: 1800 },
      originalPrice: { money: 1800 },
      stock: 20,
      maxStock: 20,
      maxPurchasePerUser: 3,
      isOnSale: false,
      effect: {
        type: 'instant',
        target: 'buff',
        value: 100,
        special: 'anomaly_immunity_one_time'
      }
    },
    {
      id: 'reputation_medal',
      name: '荣誉奖章',
      description: '立即获得20点声望。',
      category: 'consumable',
      rarity: 'uncommon',
      icon: '🎖️',
      price: { money: 1000 },
      originalPrice: { money: 1000 },
      stock: 40,
      maxStock: 40,
      maxPurchasePerUser: 10,
      isOnSale: false,
      effect: {
        type: 'instant',
        target: 'reputation',
        value: 20
      }
    },
    {
      id: 'money_bag',
      name: '钱袋',
      description: '立即获得500金币。',
      category: 'consumable',
      rarity: 'common',
      icon: '💰',
      price: { money: 0, reputation: 5 },
      originalPrice: { money: 0, reputation: 5 },
      stock: 50,
      maxStock: 50,
      maxPurchasePerUser: 20,
      isOnSale: false,
      effect: {
        type: 'instant',
        target: 'money',
        value: 500
      }
    },
    {
      id: 'veteran_badge',
      name: '老兵徽章',
      description: '立即获得50点声望，需要完成至少10个订单。',
      category: 'consumable',
      rarity: 'rare',
      icon: '🏅',
      price: { money: 3000 },
      originalPrice: { money: 3000 },
      stock: 10,
      maxStock: 10,
      maxPurchasePerUser: 1,
      isOnSale: false,
      effect: {
        type: 'instant',
        target: 'reputation',
        value: 50
      },
      unlockCondition: {
        type: 'order_complete',
        value: 10
      }
    },
    {
      id: 'sanctuary_candle',
      name: '圣所蜡烛',
      description: '接下来5天理智消耗降低40%。',
      category: 'buff',
      rarity: 'epic',
      icon: '🕯️',
      price: { money: 5000, reputation: 30 },
      originalPrice: { money: 5000, reputation: 30 },
      stock: 5,
      maxStock: 5,
      maxPurchasePerUser: 2,
      isOnSale: false,
      effect: {
        type: 'buff',
        target: 'buff',
        value: 40,
        duration: 5,
        buffType: 'sanity_protection'
      },
      unlockCondition: {
        type: 'day',
        value: 15
      }
    },
    {
      id: 'legendary_compass',
      name: '传奇罗盘',
      description: '接下来7天，所有效果提升20%。',
      category: 'buff',
      rarity: 'legendary',
      icon: '🧭',
      price: { money: 10000, reputation: 50 },
      originalPrice: { money: 10000, reputation: 50 },
      stock: 3,
      maxStock: 3,
      maxPurchasePerUser: 1,
      isOnSale: false,
      effect: {
        type: 'buff',
        target: 'buff',
        value: 20,
        duration: 7,
        buffType: 'all_bonus',
        special: 'double_all'
      },
      unlockCondition: {
        type: 'order_complete',
        value: 30
      }
    }
  ]
}

export function getInitialDiscounts(): DiscountConfig[] {
  const now = Date.now()
  const oneDay = 24 * 60 * 60 * 1000
  const threeDays = 3 * oneDay

  return [
    {
      id: 'flash_sale_consumables',
      name: '限时补给折扣',
      description: '所有消耗品8折优惠！',
      discountPercent: 20,
      startTime: now - oneDay,
      endTime: now + threeDays,
      itemIds: [],
      category: 'consumable'
    },
    {
      id: 'weekend_special',
      name: '周末特惠',
      description: '精选buff道具7折！',
      discountPercent: 30,
      startTime: now,
      endTime: now + oneDay,
      itemIds: ['lucky_charm', 'focus_crystal'],
    },
    {
      id: 'new_arrival',
      name: '新品上市',
      description: '稀有物品限时9折！',
      discountPercent: 10,
      startTime: now - oneDay * 2,
      endTime: now + oneDay * 5,
      itemIds: ['sanctuary_candle', 'legendary_compass'],
    }
  ]
}

export const rarityColors: Record<string, string> = {
  common: 'text-gray-400 border-gray-500',
  uncommon: 'text-green-400 border-green-500',
  rare: 'text-blue-400 border-blue-500',
  epic: 'text-purple-400 border-purple-500',
  legendary: 'text-amber-400 border-amber-500'
}

export const rarityBgColors: Record<string, string> = {
  common: 'bg-gray-500/10',
  uncommon: 'bg-green-500/10',
  rare: 'bg-blue-500/10',
  epic: 'bg-purple-500/10',
  legendary: 'bg-amber-500/10'
}

export const categoryNames: Record<string, string> = {
  consumable: '消耗品',
  buff: '增益道具',
  material: '材料',
  cosmetic: '外观'
}
