export type ItemCategory = 'consumable' | 'buff' | 'material' | 'cosmetic'
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
export type ShopOrderStatus = 'pending' | 'completed' | 'refunded'
export type CurrencyType = 'money' | 'reputation'

export interface DiscountConfig {
  id: string
  name: string
  description: string
  discountPercent: number
  startTime: number
  endTime: number
  itemIds: string[]
  category?: ItemCategory
  minPurchase?: number
}

export interface ShopItem {
  id: string
  name: string
  description: string
  category: ItemCategory
  rarity: ItemRarity
  icon: string
  price: {
    money: number
    reputation?: number
  }
  originalPrice: {
    money: number
    reputation?: number
  }
  stock: number
  maxStock: number
  maxPurchasePerUser: number
  isOnSale: boolean
  effect: ItemEffect
  unlockCondition?: UnlockCondition
}

export interface ItemEffect {
  type: 'instant' | 'buff' | 'passive' | 'unlock'
  target: 'sanity' | 'money' | 'reputation' | 'skill' | 'character' | 'buff'
  value: number
  duration?: number
  buffType?: string
  special?: string
}

export interface UnlockCondition {
  type: 'day' | 'reputation' | 'order_complete' | 'season_level'
  value: number
}

export interface InventoryItem {
  itemId: string
  quantity: number
  acquiredAt: number
  usedAt?: number
}

export interface ShopOrder {
  id: string
  itemId: string
  itemName: string
  quantity: number
  unitPrice: {
    money: number
    reputation?: number
  }
  totalPrice: {
    money: number
    reputation?: number
  }
  discountApplied: number
  status: ShopOrderStatus
  createdAt: number
  completedAt?: number
}

export interface ShopState {
  items: ShopItem[]
  discounts: DiscountConfig[]
  orders: ShopOrder[]
  purchaseHistory: Record<string, number>
}

export interface PurchaseResult {
  success: boolean
  message: string
  order?: ShopOrder
  inventoryItem?: InventoryItem
}

export interface GameItemDef {
  id: string
  name: string
  description: string
  category: ItemCategory
  rarity: ItemRarity
  icon: string
  effect?: ItemEffect
  sellValue?: number
  source?: 'shop' | 'dungeon' | 'achievement' | 'event' | 'mail'
}

export interface UseItemResult {
  success: boolean
  message: string
  effect?: {
    type: string
    target: string
    value: number
  }
}
