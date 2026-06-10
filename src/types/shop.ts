export type ItemCategory = 'consumable' | 'buff' | 'material' | 'cosmetic' | 'gift_pack'
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
export type ShopOrderStatus = 'pending' | 'completed' | 'refunded' | 'rollback'
export type CurrencyType = 'money' | 'reputation'
export type PurchaseLimitType = 'permanent' | 'daily' | 'weekly' | 'monthly'
export type RollbackStatus = 'none' | 'pending' | 'success' | 'failed'

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
  giftPack?: GiftPackConfig
  purchaseLimits?: PurchaseLimitConfig[]
  tag?: string
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

export interface PurchaseLimitConfig {
  type: PurchaseLimitType
  maxCount: number
  resetAt?: number
}

export interface GiftPackItem {
  itemId: string
  itemName?: string
  quantity: number
  guaranteed?: boolean
  weight?: number
}

export interface GiftPackConfig {
  items: GiftPackItem[]
  autoUnpack: boolean
  showPreview: boolean
  previewMode?: 'full' | 'partial' | 'random'
  previewCount?: number
}

export interface AssetChange {
  type: 'money' | 'reputation' | 'inventory' | 'buff'
  target: string
  amount: number
  itemId?: string
}

export interface RollbackRecord {
  id: string
  orderId: string
  changes: AssetChange[]
  status: RollbackStatus
  createdAt: number
  executedAt?: number
  reason?: string
}

export interface InventoryItem {
  itemId: string
  quantity: number
  acquiredAt: number
  usedAt?: number
}

export interface UnpackedItem {
  itemId: string
  itemName: string
  quantity: number
  icon?: string
  rarity?: ItemRarity
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
  parentOrderId?: string
  isGiftPack?: boolean
  unpackedItems?: UnpackedItem[]
  refundedAt?: number
  rollbackReason?: string
}

export interface ShopState {
  items: ShopItem[]
  discounts: DiscountConfig[]
  orders: ShopOrder[]
  purchaseHistory: Record<string, number>
  dailyPurchaseHistory: Record<string, { date: string; count: number }>
  weeklyPurchaseHistory: Record<string, { weekKey: string; count: number }>
  monthlyPurchaseHistory: Record<string, { monthKey: string; count: number }>
  rollbackRecords: RollbackRecord[]
}

export interface PurchaseResult {
  success: boolean
  message: string
  order?: ShopOrder
  inventoryItem?: InventoryItem
  unpackedItems?: UnpackedItem[]
  rollbackInfo?: {
    applied: boolean
    reason?: string
  }
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
