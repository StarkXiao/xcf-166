import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  ShopItem,
  DiscountConfig,
  ShopOrder,
  InventoryItem,
  PurchaseResult,
  UseItemResult,
  ItemCategory,
  GameItemDef,
  GiftPackConfig,
  GiftPackItem,
  UnpackedItem,
  PurchaseLimitConfig,
  PurchaseLimitType,
  RollbackRecord,
  AssetChange,
  RollbackStatus,
  AppliedBuffSnapshot,
  InstantEffectSnapshot
} from '../types/shop'
import { getInitialShopItems, getInitialDiscounts } from '../game/data/shopItems'
import { getItemDef } from '../game/data/itemCatalog'
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
  const dailyPurchaseHistory = ref<Record<string, { date: string; count: number }>>({})
  const weeklyPurchaseHistory = ref<Record<string, { weekKey: string; count: number }>>({})
  const monthlyPurchaseHistory = ref<Record<string, { monthKey: string; count: number }>>({})
  const rollbackRecords = ref<RollbackRecord[]>([])
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
        const shopItem = items.value.find(i => i.id === inv.itemId)
        if (shopItem) {
          return { ...inv, item: shopItem as GameItemDef }
        }
        const catalogItem = getItemDef(inv.itemId)
        if (catalogItem) {
          return { ...inv, item: catalogItem }
        }
        return { ...inv, item: undefined as unknown as GameItemDef }
      })
      .filter(inv => inv.item)
  })

  const completedOrders = computed(() => {
    return orders.value
      .filter(o => o.status === 'completed' || o.status === 'rollback')
      .sort((a, b) => b.createdAt - a.createdAt)
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

  function getDateKey(date: Date = new Date()): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  function getWeekKey(date: Date = new Date()): string {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
    return `${date.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`
  }

  function getMonthKey(date: Date = new Date()): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  }

  function getLimitPurchaseCount(itemId: string, limitType: PurchaseLimitType): number {
    if (limitType === 'permanent') {
      return purchaseHistory.value[itemId] || 0
    }
    if (limitType === 'daily') {
      const key = `${itemId}_${getDateKey()}`
      return dailyPurchaseHistory.value[key]?.count || 0
    }
    if (limitType === 'weekly') {
      const key = `${itemId}_${getWeekKey()}`
      return weeklyPurchaseHistory.value[key]?.count || 0
    }
    if (limitType === 'monthly') {
      const key = `${itemId}_${getMonthKey()}`
      return monthlyPurchaseHistory.value[key]?.count || 0
    }
    return 0
  }

  function recordLimitPurchase(itemId: string, quantity: number): void {
    purchaseHistory.value[itemId] = (purchaseHistory.value[itemId] || 0) + quantity

    const dailyKey = `${itemId}_${getDateKey()}`
    if (!dailyPurchaseHistory.value[dailyKey]) {
      dailyPurchaseHistory.value[dailyKey] = { date: getDateKey(), count: 0 }
    }
    dailyPurchaseHistory.value[dailyKey].count += quantity

    const weeklyKey = `${itemId}_${getWeekKey()}`
    if (!weeklyPurchaseHistory.value[weeklyKey]) {
      weeklyPurchaseHistory.value[weeklyKey] = { weekKey: getWeekKey(), count: 0 }
    }
    weeklyPurchaseHistory.value[weeklyKey].count += quantity

    const monthlyKey = `${itemId}_${getMonthKey()}`
    if (!monthlyPurchaseHistory.value[monthlyKey]) {
      monthlyPurchaseHistory.value[monthlyKey] = { monthKey: getMonthKey(), count: 0 }
    }
    monthlyPurchaseHistory.value[monthlyKey].count += quantity
  }

  function getPurchaseLimitText(item: ShopItem): string | null {
    if (!item.purchaseLimits || item.purchaseLimits.length === 0) return null

    const parts: string[] = []
    for (const limit of item.purchaseLimits) {
      const purchased = getLimitPurchaseCount(item.id, limit.type)
      const remaining = Math.max(0, limit.maxCount - purchased)
      const typeText = {
        permanent: '总共',
        daily: '今日',
        weekly: '本周',
        monthly: '本月'
      }[limit.type]
      if (remaining <= 0) {
        parts.push(`${typeText}已达上限`)
      } else {
        parts.push(`${typeText}还可购买 ${remaining} 件`)
      }
    }
    return parts.join('，')
  }

  function validatePurchaseLimits(item: ShopItem, quantity: number): { valid: boolean; message: string } {
    if (!item.purchaseLimits || item.purchaseLimits.length === 0) {
      return { valid: true, message: '' }
    }

    for (const limit of item.purchaseLimits) {
      const purchased = getLimitPurchaseCount(item.id, limit.type)
      if (purchased + quantity > limit.maxCount) {
        const remaining = Math.max(0, limit.maxCount - purchased)
        const typeText = {
          permanent: '总限购',
          daily: '每日限购',
          weekly: '每周限购',
          monthly: '每月限购'
        }[limit.type]
        if (remaining <= 0) {
          return { valid: false, message: `${typeText}已达上限，无法购买` }
        }
        return { valid: false, message: `${typeText}还可购买 ${remaining} 件` }
      }
    }
    return { valid: true, message: '' }
  }

  function getGiftPackPreviewItems(giftPack: GiftPackConfig): UnpackedItem[] {
    const result: UnpackedItem[] = []
    for (const packItem of giftPack.items) {
      const shopItem = items.value.find(i => i.id === packItem.itemId)
      const catalogItem = getItemDef(packItem.itemId)
      result.push({
        itemId: packItem.itemId,
        itemName: packItem.itemName || shopItem?.name || catalogItem?.name || packItem.itemId,
        quantity: packItem.quantity,
        icon: shopItem?.icon || catalogItem?.icon,
        rarity: shopItem?.rarity || catalogItem?.rarity
      })
    }
    return result
  }

  function unpackGiftPack(giftPack: GiftPackConfig, packQuantity: number = 1): UnpackedItem[] {
    const unpacked: UnpackedItem[] = []
    for (const packItem of giftPack.items) {
      const shopItem = items.value.find(i => i.id === packItem.itemId)
      const catalogItem = getItemDef(packItem.itemId)
      const qty = packItem.quantity * packQuantity
      const existing = unpacked.find(u => u.itemId === packItem.itemId)
      if (existing) {
        existing.quantity += qty
      } else {
        unpacked.push({
          itemId: packItem.itemId,
          itemName: packItem.itemName || shopItem?.name || catalogItem?.name || packItem.itemId,
          quantity: qty,
          icon: shopItem?.icon || catalogItem?.icon,
          rarity: shopItem?.rarity || catalogItem?.rarity
        })
      }
    }
    return unpacked
  }

  function addUnpackedItemsToInventory(unpackedItems: UnpackedItem[]): {
    buffSnapshots: AppliedBuffSnapshot[]
    instantEffectSnapshots: InstantEffectSnapshot[]
  } {
    const buffSnapshots: AppliedBuffSnapshot[] = []
    const instantEffectSnapshots: InstantEffectSnapshot[] = []

    for (const unpacked of unpackedItems) {
      const existing = inventory.value.find(inv => inv.itemId === unpacked.itemId)
      if (existing) {
        existing.quantity += unpacked.quantity
      } else {
        inventory.value.push({
          itemId: unpacked.itemId,
          quantity: unpacked.quantity,
          acquiredAt: Date.now()
        })
      }

      const shopItem = items.value.find(i => i.id === unpacked.itemId)
      if (shopItem && shopItem.category === 'buff' && shopItem.effect.type === 'buff') {
        const prevBuffCount = characterStore.activeBuffs.length
        applyItemEffect(shopItem, unpacked.quantity)
        const newBuffs = characterStore.activeBuffs.slice(prevBuffCount)
        for (const b of newBuffs) {
          buffSnapshots.push({ buffId: b.id, sourceSkillId: b.sourceSkillId })
        }
        const invItem = inventory.value.find(inv => inv.itemId === unpacked.itemId)
        if (invItem) {
          invItem.quantity -= unpacked.quantity
          if (invItem.quantity <= 0) {
            inventory.value = inventory.value.filter(inv => inv.itemId !== unpacked.itemId)
          }
        }
      }

      if (shopItem && shopItem.effect.type === 'instant') {
        const eff = shopItem.effect
        if (eff.target === 'sanity' || eff.target === 'money' || eff.target === 'reputation') {
          instantEffectSnapshots.push({
            target: eff.target,
            value: eff.value * unpacked.quantity
          })
        }
        if (eff.target === 'buff' && eff.special === 'anomaly_immunity_one_time') {
          const prevBuffCount = characterStore.activeBuffs.length
          applyItemEffect(shopItem, unpacked.quantity)
          const newBuffs = characterStore.activeBuffs.slice(prevBuffCount)
          for (const b of newBuffs) {
            buffSnapshots.push({ buffId: b.id, sourceSkillId: b.sourceSkillId })
          }
        }
      }
    }

    return { buffSnapshots, instantEffectSnapshots }
  }

  function createRollbackRecord(orderId: string, changes: AssetChange[], reason?: string, orderItemId?: string, orderQuantity?: number): RollbackRecord {
    const record: RollbackRecord = {
      id: `rollback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderId,
      changes,
      status: 'pending',
      createdAt: Date.now(),
      reason,
      orderItemId,
      orderQuantity
    }
    rollbackRecords.value.push(record)
    return record
  }

  function executeRollback(rollbackId: string, reason?: string): { success: boolean; message: string } {
    const record = rollbackRecords.value.find(r => r.id === rollbackId)
    if (!record) {
      return { success: false, message: '回滚记录不存在' }
    }
    if (record.status === 'success') {
      return { success: false, message: '该回滚已执行过' }
    }

    try {
      for (const change of record.changes) {
        if (change.type === 'money') {
          gameStore.addMoney(change.amount)
        } else if (change.type === 'reputation') {
          gameStore.addReputation(change.amount)
        } else if (change.type === 'inventory') {
          if (change.itemId) {
            const inv = inventory.value.find(i => i.itemId === change.itemId)
            if (inv) {
              inv.quantity = Math.max(0, inv.quantity - change.amount)
              if (inv.quantity <= 0) {
                inventory.value = inventory.value.filter(i => i.itemId !== change.itemId)
              }
            }
          }
        } else if (change.type === 'buff') {
          if (change.buffSnapshots) {
            for (const bs of change.buffSnapshots) {
              const existingBuff = characterStore.activeBuffs.find(b => b.id === bs.buffId)
              if (existingBuff) {
                characterStore.removeBuff(bs.buffId)
              } else {
                const sourceBuffs = characterStore.activeBuffs.filter(b => b.sourceSkillId === bs.sourceSkillId)
                for (const sb of sourceBuffs) {
                  characterStore.removeBuff(sb.id)
                }
              }
            }
          }
        } else if (change.type === 'instant_effect') {
          if (change.instantEffectSnapshots) {
            for (const eff of change.instantEffectSnapshots) {
              if (eff.target === 'sanity') {
                gameStore.addSanity(-eff.value)
              } else if (eff.target === 'money') {
                gameStore.addMoney(-eff.value)
              } else if (eff.target === 'reputation') {
                gameStore.addReputation(-eff.value)
              }
            }
          }
        } else if (change.type === 'limit_count') {
          if (change.limitSnapshot) {
            const snap = change.limitSnapshot
            if (purchaseHistory.value[snap.itemId] !== undefined) {
              purchaseHistory.value[snap.itemId] = Math.max(0, purchaseHistory.value[snap.itemId] - snap.quantity)
            }
            const dailyKey = `${snap.itemId}_${snap.dateKey}`
            if (dailyPurchaseHistory.value[dailyKey]) {
              dailyPurchaseHistory.value[dailyKey].count = Math.max(0, dailyPurchaseHistory.value[dailyKey].count - snap.quantity)
            }
            const weeklyKey = `${snap.itemId}_${snap.weekKey}`
            if (weeklyPurchaseHistory.value[weeklyKey]) {
              weeklyPurchaseHistory.value[weeklyKey].count = Math.max(0, weeklyPurchaseHistory.value[weeklyKey].count - snap.quantity)
            }
            const monthlyKey = `${snap.itemId}_${snap.monthKey}`
            if (monthlyPurchaseHistory.value[monthlyKey]) {
              monthlyPurchaseHistory.value[monthlyKey].count = Math.max(0, monthlyPurchaseHistory.value[monthlyKey].count - snap.quantity)
            }
          }
        }
      }

      const order = orders.value.find(o => o.id === record.orderId)
      if (order) {
        order.status = 'rollback'
        order.rollbackReason = reason || record.reason || '用户回滚'
        order.refundedAt = Date.now()
        if (order.itemId) {
          const item = items.value.find(i => i.id === order.itemId)
          if (item) {
            item.stock = Math.min(item.maxStock, item.stock + order.quantity)
          }
        }
      }

      record.status = 'success'
      record.executedAt = Date.now()
      if (reason) {
        record.reason = reason
      }
      return { success: true, message: '资产回滚成功' }
    } catch (e: any) {
      record.status = 'failed'
      record.executedAt = Date.now()
      return { success: false, message: `回滚失败：${e.message || '未知错误'}` }
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

    const limitValidation = validatePurchaseLimits(item, quantity)
    if (!limitValidation.valid) {
      return { valid: false, message: limitValidation.message, error: limitValidation.message }
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

    const assetChanges: AssetChange[] = []
    const allBuffSnapshots: AppliedBuffSnapshot[] = []
    const allInstantEffectSnapshots: InstantEffectSnapshot[] = []

    gameStore.addMoney(-totalPrice.money)
    assetChanges.push({ type: 'money', target: 'player', amount: totalPrice.money })
    if (totalPrice.reputation !== undefined) {
      gameStore.addReputation(-totalPrice.reputation)
      assetChanges.push({ type: 'reputation', target: 'player', amount: totalPrice.reputation })
    }

    item.stock -= quantity

    const dateKey = getDateKey()
    const weekKey = getWeekKey()
    const monthKey = getMonthKey()

    recordLimitPurchase(itemId, quantity)
    assetChanges.push({
      type: 'limit_count',
      target: 'purchase_limits',
      amount: quantity,
      limitSnapshot: {
        itemId,
        quantity,
        dateKey,
        weekKey,
        monthKey
      }
    })

    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    let unpackedItems: UnpackedItem[] | undefined
    const isGiftPack = item.category === 'gift_pack' && !!item.giftPack

    if (isGiftPack && item.giftPack) {
      unpackedItems = unpackGiftPack(item.giftPack, quantity)
      if (item.giftPack.autoUnpack) {
        for (const unpacked of unpackedItems) {
          assetChanges.push({
            type: 'inventory',
            target: 'player',
            amount: unpacked.quantity,
            itemId: unpacked.itemId
          })
        }
        const unpackResult = addUnpackedItemsToInventory(unpackedItems)
        allBuffSnapshots.push(...unpackResult.buffSnapshots)
        allInstantEffectSnapshots.push(...unpackResult.instantEffectSnapshots)
      } else {
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
        assetChanges.push({
          type: 'inventory',
          target: 'player',
          amount: quantity,
          itemId
        })
      }
    } else {
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
      assetChanges.push({
        type: 'inventory',
        target: 'player',
        amount: quantity,
        itemId
      })
    }

    if (!isGiftPack && item.category === 'buff' && item.effect.type === 'buff') {
      const prevBuffCount = characterStore.activeBuffs.length
      applyItemEffect(item, quantity)
      const newBuffs = characterStore.activeBuffs.slice(prevBuffCount)
      for (const b of newBuffs) {
        allBuffSnapshots.push({ buffId: b.id, sourceSkillId: b.sourceSkillId })
      }
      const invItem = inventory.value.find(inv => inv.itemId === itemId)
      if (invItem) {
        invItem.quantity -= quantity
        if (invItem.quantity <= 0) {
          inventory.value = inventory.value.filter(inv => inv.itemId !== itemId)
        }
      }
    }

    if (!isGiftPack && item.effect.type === 'instant') {
      const eff = item.effect
      if (eff.target === 'sanity' || eff.target === 'money' || eff.target === 'reputation') {
        allInstantEffectSnapshots.push({
          target: eff.target,
          value: eff.value * quantity
        })
      }
      if (eff.target === 'buff' && eff.special === 'anomaly_immunity_one_time') {
        const prevBuffCount = characterStore.activeBuffs.length
        applyItemEffect(item, quantity)
        const newBuffs = characterStore.activeBuffs.slice(prevBuffCount)
        for (const b of newBuffs) {
          allBuffSnapshots.push({ buffId: b.id, sourceSkillId: b.sourceSkillId })
        }
      }
    }

    if (allBuffSnapshots.length > 0) {
      assetChanges.push({
        type: 'buff',
        target: 'character',
        amount: allBuffSnapshots.length,
        buffSnapshots: allBuffSnapshots
      })
    }

    if (allInstantEffectSnapshots.length > 0) {
      assetChanges.push({
        type: 'instant_effect',
        target: 'player',
        amount: allInstantEffectSnapshots.reduce((s, e) => s + e.value, 0),
        instantEffectSnapshots: allInstantEffectSnapshots
      })
    }

    const order: ShopOrder = {
      id: orderId,
      itemId,
      itemName: item.name,
      quantity,
      unitPrice: { ...unitPrice },
      totalPrice: { ...totalPrice },
      discountApplied: discount ? discount.discountPercent : 0,
      status: 'completed',
      createdAt: Date.now(),
      completedAt: Date.now(),
      isGiftPack,
      unpackedItems
    }
    orders.value.push(order)

    createRollbackRecord(orderId, assetChanges, undefined, itemId, quantity)

    achievementStore.trackBehavior('shop_purchase', {
      itemId,
      itemName: item.name,
      quantity,
      totalPrice,
      category: item.category,
      rarity: item.rarity,
      isGiftPack
    })

    try {
      const actStore = (globalThis as any).__pinia_activityStore as any
      if (actStore) {
        const totalPurchases = Object.values(purchaseHistory.value).reduce((s, v) => s + (v || 0), 0)
        actStore.onPlayerEvent('shop_purchase', {
          shop_purchase_count: totalPurchases,
          total_payment: characterStore.totalSpent?.money ?? 0,
        })
      }
    } catch {}

    if (isGiftPack && unpackedItems) {
      const names = unpackedItems.map(u => `${u.itemName}x${u.quantity}`).join('、')
      return {
        success: true,
        message: `成功购买 ${item.name} x${quantity}！拆封获得：${names}`,
        order,
        unpackedItems,
        inventoryItem: inventory.value.find(inv => inv.itemId === itemId)
      }
    }

    return {
      success: true,
      message: `成功购买 ${item.name} x${quantity}！`,
      order,
      inventoryItem: inventory.value.find(inv => inv.itemId === itemId)
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

  function resolveItemDef(itemId: string): GameItemDef | undefined {
    const shopItem = items.value.find(i => i.id === itemId)
    if (shopItem) return shopItem as GameItemDef
    return getItemDef(itemId)
  }

  function useItem(itemId: string, quantity: number = 1): UseItemResult {
    const invItem = inventory.value.find(inv => inv.itemId === itemId)
    if (!invItem || invItem.quantity < quantity) {
      return { success: false, message: '物品数量不足' }
    }

    const item = resolveItemDef(itemId)
    if (!item) {
      return { success: false, message: '物品不存在' }
    }

    if (item.category === 'material') {
      const sv = item.sellValue ?? 0
      if (sv > 0) {
        return sellItem(itemId, quantity)
      }
      return { success: false, message: '该材料无法出售' }
    }

    if (item.category === 'cosmetic') {
      return { success: false, message: '外观物品无法使用' }
    }

    if (!item.effect) {
      return { success: false, message: '该物品无法使用' }
    }

    const shopItem = items.value.find(i => i.id === itemId)
    if (!shopItem) {
      return { success: false, message: '该物品无法使用' }
    }

    const result = applyItemEffect(shopItem, quantity)
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

  function sellItem(itemId: string, quantity: number = 1): UseItemResult {
    const invItem = inventory.value.find(inv => inv.itemId === itemId)
    if (!invItem || invItem.quantity < quantity) {
      return { success: false, message: '物品数量不足' }
    }

    const item = resolveItemDef(itemId)
    if (!item) {
      return { success: false, message: '物品不存在' }
    }

    const sv = item.sellValue ?? 0
    if (sv <= 0) {
      return { success: false, message: '该物品无法出售' }
    }

    const totalGold = sv * quantity
    gameStore.addMoney(totalGold)
    invItem.quantity -= quantity
    if (invItem.quantity <= 0) {
      inventory.value = inventory.value.filter(inv => inv.itemId !== itemId)
    }

    achievementStore.trackBehavior('item_sold', {
      itemId,
      itemName: item.name,
      quantity,
      sellValue: sv,
      totalGold
    })

    return {
      success: true,
      message: `出售 ${item.name} x${quantity}，获得 ${totalGold} 金币！`,
      effect: { type: 'instant', target: 'money', value: totalGold }
    }
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
      purchaseHistory: { ...purchaseHistory.value },
      dailyPurchaseHistory: { ...dailyPurchaseHistory.value },
      weeklyPurchaseHistory: { ...weeklyPurchaseHistory.value },
      monthlyPurchaseHistory: { ...monthlyPurchaseHistory.value },
      rollbackRecords: rollbackRecords.value.map(r => ({ ...r }))
    }
  }

  function restoreFromSave(data: ReturnType<typeof getShopSaveData>) {
    items.value = data.items.map(item => ({ ...item }))
    discounts.value = data.discounts.map(d => ({ ...d }))
    orders.value = data.orders.map(o => ({ ...o }))
    inventory.value = data.inventory.map(inv => ({ ...inv }))
    purchaseHistory.value = { ...data.purchaseHistory }
    dailyPurchaseHistory.value = { ...(data.dailyPurchaseHistory || {}) }
    weeklyPurchaseHistory.value = { ...(data.weeklyPurchaseHistory || {}) }
    monthlyPurchaseHistory.value = { ...(data.monthlyPurchaseHistory || {}) }
    rollbackRecords.value = (data.rollbackRecords || []).map(r => ({ ...r }))
  }

  function resetShop() {
    items.value = getInitialShopItems()
    discounts.value = getInitialDiscounts()
    orders.value = []
    inventory.value = []
    purchaseHistory.value = {}
    dailyPurchaseHistory.value = {}
    weeklyPurchaseHistory.value = {}
    monthlyPurchaseHistory.value = {}
    rollbackRecords.value = []
    selectedCategory.value = 'all'
    showOnlyOnSale.value = false
    cart.value = []
  }

  return {
    items,
    discounts,
    orders,
    inventory,
    purchaseHistory,
    dailyPurchaseHistory,
    weeklyPurchaseHistory,
    monthlyPurchaseHistory,
    rollbackRecords,
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
    getPurchaseLimitText,
    validatePurchaseLimits,
    getGiftPackPreviewItems,
    unpackGiftPack,
    createRollbackRecord,
    executeRollback,
    validatePurchase,
    purchaseItem,
    useItem,
    sellItem,
    resolveItemDef,
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
