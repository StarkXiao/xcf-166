import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  ShopItem,
  DiscountConfig,
  ShopOrder,
  InventoryItem,
  PurchaseResult,
  UseItemResult,
  ItemCategory
} from '../types/shop'
import { getInitialShopItems, getInitialDiscounts } from '../game/data/shopItems'
import { useGameStore } from './gameStore'
import { useCharacterStore } from './characterStore'
import { useAchievementStore } from './achievementStore'
import { useSeasonStore } from './seasonStore'

export const useShopStore = defineStore('shop', () => {
  const gameStore = useGameStore()
  const characterStore = useCharacterStore()
  const achievementStore = useAchievementStore()
  const seasonStore = useSeasonStore()

  const items = ref<ShopItem[]>(getInitialShopItems())
  const discounts = ref<DiscountConfig[]>(getInitialDiscounts())
  const orders = ref<ShopOrder[]>([])
  const inventory = ref<InventoryItem[]>([])
  const purchaseHistory = ref<Record<string, number>>({})
  const selectedCategory = ref<ItemCategory | 'all'>('all')
  const showOnlyOnSale = ref(false)
  const cart = ref<{ item: ShopItem; quantity: number }[]>([])

  const cartItemCount = computed(() => {
    return cart.value.reduce((sum, c) => sum + c.quantity, 0)
  })

  const cartOriginalTotal = computed(() => {
    return cart.value.reduce((sum, c) => sum + c.item.originalPrice.money * c.quantity, 0)
  })

  const cartTotal = computed(() => {
    return cart.value.reduce((sum, c) => {
      const price = getItemCurrentPrice(c.item)
      return sum + price.money * c.quantity
    }, 0)
  })

  const cartDiscount = computed(() => {
    return cartOriginalTotal.value - cartTotal.value
  })

  const activeDiscounts = computed(() => {
    const now = Date.now()
    return discounts.value.filter(d => d.startTime <= now && d.endTime >= now)
  })

  const expiredDiscounts = computed(() => {
    const now = Date.now()
    return discounts.value.filter(d => d.endTime < now)
  })

  const upcomingDiscounts = computed(() => {
    const now = Date.now()
    return discounts.value.filter(d => d.startTime > now)
  })

  const filteredItems = computed(() => {
    let result = [...items.value]

    if (selectedCategory.value !== 'all') {
      result = result.filter(item => item.category === selectedCategory.value)
    }

    if (showOnlyOnSale.value) {
      result = result.filter(item => {
        return activeDiscounts.value.some(d =>
          (d.itemIds.length > 0 && d.itemIds.includes(item.id)) ||
          (d.category && d.category === item.category)
        )
      })
    }

    return result
  })

  const inventoryWithDetails = computed(() => {
    return inventory.value
      .filter(inv => inv.quantity > 0)
      .map(inv => {
        const item = items.value.find(i => i.id === inv.itemId)
        return {
          ...inv,
          item
        }
      })
      .filter(inv => inv.item)
  })

  const completedOrders = computed(() => {
    return orders.value.filter(o => o.status === 'completed').sort((a, b) => b.createdAt - a.createdAt)
  })

  function getItemDiscount(itemId: string, category?: ItemCategory): DiscountConfig | null {
    const now = Date.now()
    for (const discount of activeDiscounts.value) {
      if (discount.startTime > now || discount.endTime < now) continue
      if (discount.itemIds.length > 0 && discount.itemIds.includes(itemId)) {
        return discount
      }
      if (discount.category && category && discount.category === category) {
        return discount
      }
    }
    return null
  }

  function calculateDiscountedPrice(
    originalPrice: { money: number; reputation?: number },
    discountPercent: number
  ): { money: number; reputation?: number } {
    const multiplier = (100 - discountPercent) / 100
    return {
      money: Math.floor(originalPrice.money * multiplier),
      reputation: originalPrice.reputation !== undefined
        ? Math.floor(originalPrice.reputation * multiplier)
        : undefined
    }
  }

  function getItemCurrentPrice(item: ShopItem): { money: number; reputation?: number } {
    const discount = getItemDiscount(item.id, item.category)
    if (discount) {
      return calculateDiscountedPrice(item.originalPrice, discount.discountPercent)
    }
    return item.price
  }

  function getItemById(itemId: string): ShopItem | undefined {
    return items.value.find(i => i.id === itemId)
  }

  function isItemUnlocked(item: ShopItem): boolean {
    if (!item.unlockCondition) return true

    const condition = item.unlockCondition
    switch (condition.type) {
      case 'day':
        return gameStore.day >= condition.value
      case 'reputation':
        return gameStore.stats.reputation >= condition.value
      case 'order_complete':
        return gameStore.stats.totalOrdersCompleted >= condition.value
      case 'season_level':
        return seasonStore.currentLevel >= condition.value
      default:
        return true
    }
  }

  function getUnlockConditionText(item: ShopItem): string | null {
    if (!item.unlockCondition || isItemUnlocked(item)) return null

    const condition = item.unlockCondition
    switch (condition.type) {
      case 'day':
        return `需要游戏天数达到 ${condition.value} 天`
      case 'reputation':
        return `需要声望达到 ${condition.value}`
      case 'order_complete':
        return `需要完成 ${condition.value} 个订单`
      case 'season_level':
        return `需要赛季等级达到 ${condition.value} 级`
      default:
        return '未解锁'
    }
  }

  function validatePurchase(itemId?: string, quantity: number = 1): { valid: boolean; message: string; error?: string } {
    if (!itemId) {
      if (cart.value.length === 0) {
        return { valid: false, message: '购物车是空的', error: '购物车是空的' }
      }
      for (const cartItem of cart.value) {
        const result = validatePurchase(cartItem.item.id, cartItem.quantity)
        if (!result.valid) {
          return { ...result, error: result.message }
        }
      }
      return { valid: true, message: '可以购买' }
    }

    const item = items.value.find(i => i.id === itemId)
    if (!item) {
      return { valid: false, message: '商品不存在', error: '商品不存在' }
    }

    if (!isItemUnlocked(item)) {
      const lockText = getUnlockConditionText(item)
      return { valid: false, message: lockText || '商品未解锁', error: lockText || '商品未解锁' }
    }

    if (quantity <= 0) {
      return { valid: false, message: '购买数量无效', error: '购买数量无效' }
    }

    if (item.stock < quantity) {
      return { valid: false, message: `库存不足，仅剩 ${item.stock} 件`, error: `库存不足，仅剩 ${item.stock} 件` }
    }

    const purchasedCount = purchaseHistory.value[itemId] || 0
    if (purchasedCount + quantity > item.maxPurchasePerUser) {
      const remaining = item.maxPurchasePerUser - purchasedCount
      return { valid: false, message: `超出购买上限，还可购买 ${remaining} 件`, error: `超出购买上限，还可购买 ${remaining} 件` }
    }

    const price = getItemCurrentPrice(item)
    const totalMoney = price.money * quantity
    const totalReputation = (price.reputation || 0) * quantity

    if (gameStore.stats.money < totalMoney) {
      return { valid: false, message: '金币不足', error: '金币不足' }
    }

    if (price.reputation !== undefined && gameStore.stats.reputation < totalReputation) {
      return { valid: false, message: '声望不足', error: '声望不足' }
    }

    return { valid: true, message: '可以购买' }
  }

  function addToCart(itemId: string, quantity: number = 1): boolean {
    const item = items.value.find(i => i.id === itemId)
    if (!item) return false

    const existing = cart.value.find(c => c.item.id === itemId)
    if (existing) {
      existing.quantity += quantity
    } else {
      cart.value.push({ item, quantity })
    }
    return true
  }

  function removeFromCart(itemId: string): void {
    const index = cart.value.findIndex(c => c.item.id === itemId)
    if (index !== -1) {
      cart.value.splice(index, 1)
    }
  }

  function updateCartQuantity(itemId: string, quantity: number): void {
    const cartItem = cart.value.find(c => c.item.id === itemId)
    if (cartItem) {
      if (quantity <= 0) {
        removeFromCart(itemId)
      } else {
        cartItem.quantity = quantity
      }
    }
  }

  function clearCart(): void {
    cart.value = []
  }

  function checkout(): PurchaseResult & { order?: ShopOrder; totalDiscount?: number } {
    const validation = validatePurchase()
    if (!validation.valid) {
      return { success: false, message: validation.message }
    }

    const orders: ShopOrder[] = []
    let totalDiscount = 0

    for (const cartItem of cart.value) {
      const result = purchaseItem(cartItem.item.id, cartItem.quantity)
      if (!result.success || !result.order) {
        return { success: false, message: result.message }
      }
      orders.push(result.order)
      const discount = (cartItem.item.originalPrice.money - getItemCurrentPrice(cartItem.item).money) * cartItem.quantity
      totalDiscount += discount
    }

    clearCart()

    return {
      success: true,
      message: `成功购买 ${orders.length} 件商品`,
      order: orders[0],
      totalDiscount
    }
  }

  function purchaseItem(itemId: string, quantity: number = 1): PurchaseResult {
    const validation = validatePurchase(itemId, quantity)
    if (!validation.valid) {
      return { success: false, message: validation.message }
    }

    const item = items.value.find(i => i.id === itemId)!
    const discount = getItemDiscount(item.id, item.category)
    const unitPrice = getItemCurrentPrice(item)
    const totalPrice = {
      money: unitPrice.money * quantity,
      reputation: unitPrice.reputation !== undefined ? unitPrice.reputation * quantity : undefined
    }

    gameStore.addMoney(-totalPrice.money)
    if (totalPrice.reputation !== undefined) {
      gameStore.addReputation(-totalPrice.reputation)
    }

    item.stock -= quantity

    purchaseHistory.value[itemId] = (purchaseHistory.value[itemId] || 0) + quantity

    const existingInventory = inventory.value.find(inv => inv.itemId === itemId)
    if (existingInventory) {
      existingInventory.quantity += quantity
    } else {
      inventory.value.push({
        itemId,
        quantity,
        acquiredAt: Date.now()
      })
    }

    const order: ShopOrder = {
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      itemId,
      itemName: item.name,
      quantity,
      unitPrice: { ...unitPrice },
      totalPrice: { ...totalPrice },
      discountApplied: discount ? discount.discountPercent : 0,
      status: 'completed',
      createdAt: Date.now(),
      completedAt: Date.now()
    }
    orders.value.push(order)

    achievementStore.trackBehavior('shop_purchase', {
      itemId,
      itemName: item.name,
      quantity,
      totalPrice,
      category: item.category,
      rarity: item.rarity
    })

    if (item.category === 'buff' && item.effect.type === 'buff') {
      applyItemEffect(item, quantity)
      const invItem = inventory.value.find(inv => inv.itemId === itemId)
      if (invItem) {
        invItem.quantity -= quantity
        if (invItem.quantity <= 0) {
          inventory.value = inventory.value.filter(inv => inv.itemId !== itemId)
        }
      }
      return {
        success: true,
        message: `成功购买并使用 ${item.name} x${quantity}！`,
        order,
        inventoryItem: existingInventory
      }
    }

    return {
      success: true,
      message: `成功购买 ${item.name} x${quantity}！`,
      order,
      inventoryItem: existingInventory || inventory.value.find(inv => inv.itemId === itemId)
    }
  }

  function applyItemEffect(item: ShopItem, quantity: number = 1): UseItemResult {
    const effect = item.effect
    const value = effect.value * quantity

    if (effect.type === 'instant') {
      switch (effect.target) {
        case 'sanity':
          if (effect.special === 'full_restore') {
            gameStore.stats.sanity = gameStore.stats.maxSanity
            return {
              success: true,
              message: `理智值已完全恢复！`,
              effect: { type: effect.type, target: effect.target, value: gameStore.stats.maxSanity }
            }
          }
          gameStore.addSanity(value)
          return {
            success: true,
            message: `恢复了 ${value} 点理智值！`,
            effect: { type: effect.type, target: effect.target, value }
          }

        case 'money':
          gameStore.addMoney(value)
          return {
            success: true,
            message: `获得了 ${value} 金币！`,
            effect: { type: effect.type, target: effect.target, value }
          }

        case 'reputation':
          gameStore.addReputation(value)
          return {
            success: true,
            message: `获得了 ${value} 点声望！`,
            effect: { type: effect.type, target: effect.target, value }
          }

        case 'buff':
          if (effect.special === 'anomaly_immunity_one_time') {
            characterStore.addBuff({
              id: `buff_${Date.now()}`,
              name: item.name,
              icon: item.icon,
              type: 'anomaly_immunity',
              value: 100,
              remainingTurns: 999,
              sourceSkillId: `shop_${item.id}`,
              description: item.description
            })
            return {
              success: true,
              message: `${item.name} 已生效，下次异常将被免疫！`,
              effect: { type: effect.type, target: effect.target, value }
            }
          }
      }
    }

    if (effect.type === 'buff' && effect.buffType && effect.duration) {
      if (effect.special === 'double_all') {
        characterStore.addBuff({
          id: `buff_${Date.now()}`,
          name: item.name,
          icon: item.icon,
          type: 'processing_speed',
          value: value,
          remainingTurns: effect.duration,
          sourceSkillId: `shop_${item.id}`,
          description: `处理效率提升${value}%`
        })
        characterStore.addBuff({
          id: `buff_${Date.now()}_san`,
          name: item.name,
          icon: item.icon,
          type: 'sanity_protection',
          value: value,
          remainingTurns: effect.duration,
          sourceSkillId: `shop_${item.id}`,
          description: `理智消耗降低${value}%`
        })
        characterStore.addBuff({
          id: `buff_${Date.now()}_rew`,
          name: item.name,
          icon: item.icon,
          type: 'reward_multiplier',
          value: value,
          remainingTurns: effect.duration,
          sourceSkillId: `shop_${item.id}`,
          description: `报酬提升${value}%`
        })
        characterStore.addBuff({
          id: `buff_${Date.now()}_anom`,
          name: item.name,
          icon: item.icon,
          type: 'anomaly_resistance',
          value: value,
          remainingTurns: effect.duration,
          sourceSkillId: `shop_${item.id}`,
          description: `异常抗性提升${value}%`
        })
      } else {
        characterStore.addBuff({
          id: `buff_${Date.now()}`,
          name: item.name,
          icon: item.icon,
          type: effect.buffType as any,
          value: value,
          remainingTurns: effect.duration,
          sourceSkillId: `shop_${item.id}`,
          description: item.description
        })
      }

      return {
        success: true,
        message: `${item.name} 已生效，持续 ${effect.duration} 天！`,
        effect: { type: effect.type, target: effect.buffType, value }
      }
    }

    return { success: false, message: '无法使用该物品' }
  }

  function useItem(itemId: string, quantity: number = 1): UseItemResult {
    const invItem = inventory.value.find(inv => inv.itemId === itemId)
    if (!invItem || invItem.quantity < quantity) {
      return { success: false, message: '物品数量不足' }
    }

    const item = items.value.find(i => i.id === itemId)
    if (!item) {
      return { success: false, message: '物品不存在' }
    }

    if (item.category === 'material' || item.category === 'cosmetic') {
      return { success: false, message: '该物品无法使用' }
    }

    const result = applyItemEffect(item, quantity)
    if (result.success) {
      invItem.quantity -= quantity
      if (invItem.quantity <= 0) {
        inventory.value = inventory.value.filter(inv => inv.itemId !== itemId)
      }

      achievementStore.trackBehavior('item_used', {
        itemId,
        itemName: item.name,
        quantity,
        category: item.category
      })
    }

    return result
  }

  function getItemPurchaseCount(itemId: string): number {
    return purchaseHistory.value[itemId] || 0
  }

  function hasItemInInventory(itemId: string): boolean {
    const inv = inventory.value.find(i => i.itemId === itemId)
    return inv ? inv.quantity > 0 : false
  }

  function getInventoryQuantity(itemId: string): number {
    const inv = inventory.value.find(i => i.itemId === itemId)
    return inv ? inv.quantity : 0
  }

  function setCategory(category: ItemCategory | 'all') {
    selectedCategory.value = category
  }

  function toggleShowOnSale() {
    showOnlyOnSale.value = !showOnlyOnSale.value
  }

  function addDiscount(discount: DiscountConfig) {
    discounts.value.push(discount)
  }

  function grantItemById(itemId: string, quantity: number = 1) {
    const existing = inventory.value.find(inv => inv.itemId === itemId)
    if (existing) {
      existing.quantity += quantity
    } else {
      inventory.value.push({
        itemId,
        quantity,
        acquiredAt: Date.now()
      })
    }
  }

  function removeDiscount(discountId: string) {
    discounts.value = discounts.value.filter(d => d.id !== discountId)
  }

  function addItem(item: ShopItem) {
    items.value.push(item)
  }

  function updateItem(itemId: string, updates: Partial<ShopItem>) {
    const item = items.value.find(i => i.id === itemId)
    if (item) {
      Object.assign(item, updates)
    }
  }

  function restockItem(itemId: string, amount: number) {
    const item = items.value.find(i => i.id === itemId)
    if (item) {
      item.stock = Math.min(item.maxStock, item.stock + amount)
    }
  }

  function getShopSaveData() {
    return {
      items: items.value.map(item => ({ ...item })),
      discounts: discounts.value.map(d => ({ ...d })),
      orders: orders.value.map(o => ({ ...o })),
      inventory: inventory.value.map(inv => ({ ...inv })),
      purchaseHistory: { ...purchaseHistory.value }
    }
  }

  function restoreFromSave(data: ReturnType<typeof getShopSaveData>) {
    items.value = data.items.map(item => ({ ...item }))
    discounts.value = data.discounts.map(d => ({ ...d }))
    orders.value = data.orders.map(o => ({ ...o }))
    inventory.value = data.inventory.map(inv => ({ ...inv }))
    purchaseHistory.value = { ...data.purchaseHistory }
  }

  function resetShop() {
    items.value = getInitialShopItems()
    discounts.value = getInitialDiscounts()
    orders.value = []
    inventory.value = []
    purchaseHistory.value = {}
    selectedCategory.value = 'all'
    showOnlyOnSale.value = false
  }

  return {
    items,
    discounts,
    orders,
    inventory,
    purchaseHistory,
    selectedCategory,
    showOnlyOnSale,
    activeDiscounts,
    expiredDiscounts,
    upcomingDiscounts,
    filteredItems,
    inventoryWithDetails,
    completedOrders,
    getItemDiscount,
    calculateDiscountedPrice,
    getItemCurrentPrice,
    getItemById,
    isItemUnlocked,
    getUnlockConditionText,
    validatePurchase,
    purchaseItem,
    useItem,
    applyItemEffect,
    getItemPurchaseCount,
    hasItemInInventory,
    getInventoryQuantity,
    setCategory,
    toggleShowOnSale,
    cart,
    cartItemCount,
    cartTotal,
    cartOriginalTotal,
    cartDiscount,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    checkout,
    addDiscount,
    removeDiscount,
    addItem,
    grantItemById,
    updateItem,
    restockItem,
    getShopSaveData,
    restoreFromSave,
    resetShop
  }
})
