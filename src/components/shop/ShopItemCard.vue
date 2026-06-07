<script setup lang="ts">
import { computed } from 'vue'
import type { ShopItem, DiscountConfig } from '../../types/shop'
import { useShopStore } from '../../stores/shopStore'
import { useGameStore } from '../../stores/gameStore'
import { rarityColors, rarityBgColors, categoryNames } from '../../game/data/shopItems'
import { Lock, ShoppingCart, Tag, Clock } from 'lucide-vue-next'

const props = defineProps<{
  item: ShopItem
  discount?: DiscountConfig | null
}>()

const emit = defineEmits<{
  buy: [item: ShopItem]
}>()

const shopStore = useShopStore()
const gameStore = useGameStore()

const currentPrice = computed(() => shopStore.getItemCurrentPrice(props.item))
const isUnlocked = computed(() => shopStore.isItemUnlocked(props.item))
const unlockText = computed(() => shopStore.getUnlockConditionText(props.item))
const hasDiscount = computed(() => props.discount !== null)
const discountPercent = computed(() => props.discount?.discountPercent || 0)
const originalPrice = computed(() => props.item.originalPrice)
const stockText = computed(() => {
  if (props.item.stock <= 0) return '缺货'
  if (props.item.stock <= 5) return `仅剩 ${props.item.stock} 件`
  return `库存 ${props.item.stock}`
})
const canBuy = computed(() => {
  if (!isUnlocked.value) return false
  if (props.item.stock <= 0) return false
  const validation = shopStore.validatePurchase(props.item.id, 1)
  return validation.valid
})
const buyButtonText = computed(() => {
  if (!isUnlocked.value) return '未解锁'
  if (props.item.stock <= 0) return '缺货'
  const validation = shopStore.validatePurchase(props.item.id, 1)
  if (!validation.valid) return validation.message
  return '购买'
})
const rarityColorClass = computed(() => rarityColors[props.item.rarity] || '')
const rarityBgClass = computed(() => rarityBgColors[props.item.rarity] || '')

function handleBuy() {
  if (canBuy.value) {
    emit('buy', props.item)
  }
}

function formatTimeRemaining(endTime: number): string {
  const diff = endTime - Date.now()
  if (diff <= 0) return '已结束'
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (hours > 24) {
    return `${Math.floor(hours / 24)}天${hours % 24}时`
  }
  return `${hours}时${minutes}分`
}
</script>

<template>
  <div
    class="relative rounded-xl border-2 transition-all duration-300 overflow-hidden group"
    :class="[
      rarityColorClass,
      rarityBgClass,
      isUnlocked ? 'hover:scale-[1.02] hover:shadow-lg hover:shadow-current/20' : 'opacity-60'
    ]"
  >
    <div
      v-if="hasDiscount"
      class="absolute top-0 right-0 z-10 bg-red-500 text-white px-2 py-1 text-xs font-bold rounded-bl-lg flex items-center gap-1"
    >
      <Tag class="w-3 h-3" />
      -{{ discountPercent }}%
    </div>

    <div class="p-4">
      <div class="flex items-start gap-3 mb-3">
        <div class="text-4xl flex-shrink-0">{{ item.icon }}</div>
        <div class="flex-1 min-w-0">
          <div class="font-bold text-white truncate">{{ item.name }}</div>
          <div class="text-xs text-gray-400">{{ categoryNames[item.category] }}</div>
        </div>
      </div>

      <p class="text-sm text-gray-300 mb-3 line-clamp-2 h-10">{{ item.description }}</p>

      <div class="space-y-2 mb-4">
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-400">价格</span>
          <div class="flex items-center gap-2">
            <span
              v-if="hasDiscount"
              class="text-gray-500 line-through text-sm"
            >
              {{ originalPrice.money }}💰
              <span v-if="originalPrice.reputation !== undefined">
                +{{ originalPrice.reputation }}⭐
              </span>
            </span>
            <span class="text-amber-400 font-bold">
              {{ currentPrice.money }}💰
              <span v-if="currentPrice.reputation !== undefined">
                +{{ currentPrice.reputation }}⭐
              </span>
            </span>
          </div>
        </div>

        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-400">库存</span>
          <span :class="item.stock <= 5 ? 'text-red-400' : 'text-gray-300'">
            {{ stockText }}
          </span>
        </div>

        <div v-if="hasDiscount && discount" class="flex items-center justify-between text-sm">
          <span class="text-gray-400">折扣剩余</span>
          <span class="text-red-400 flex items-center gap-1">
            <Clock class="w-3 h-3" />
            {{ formatTimeRemaining(discount.endTime) }}
          </span>
        </div>
      </div>

      <div v-if="!isUnlocked && unlockText" class="mb-3 p-2 bg-gray-800/50 rounded-lg flex items-center gap-2 text-sm text-amber-400">
        <Lock class="w-4 h-4 flex-shrink-0" />
        <span>{{ unlockText }}</span>
      </div>

      <button
        @click="handleBuy"
        :disabled="!canBuy"
        class="w-full py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
        :class="[
          canBuy
            ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-amber-500/25'
            : 'bg-gray-700 text-gray-400 cursor-not-allowed'
        ]"
      >
        <ShoppingCart class="w-4 h-4" />
        {{ buyButtonText }}
      </button>
    </div>
  </div>
</template>
