<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ShopItem, DiscountConfig } from '../../types/shop'
import { useShopStore } from '../../stores/shopStore'
import { useGameStore } from '../../stores/gameStore'
import { rarityColors, rarityBgColors, categoryNames, tagNames } from '../../game/data/shopItems'
import { Lock, ShoppingCart, Tag, Clock, Gift, X } from 'lucide-vue-next'

const props = defineProps<{
  item: ShopItem
  discount?: DiscountConfig | null
  highlighted?: boolean
}>()

const emit = defineEmits<{
  buy: [item: ShopItem]
  'add-to-cart': [item: ShopItem]
}>()

const shopStore = useShopStore()
const gameStore = useGameStore()

const showGiftPreview = ref(false)

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

const isInCart = computed(() => {
  return shopStore.cart.some(c => c.item.id === props.item.id)
})

const isGiftPack = computed(() => props.item.category === 'gift_pack' && !!props.item.giftPack)
const tagText = computed(() => props.item.tag ? tagNames[props.item.tag] || null : null)
const limitText = computed(() => shopStore.getPurchaseLimitText(props.item))
const giftPreviewItems = computed(() => {
  if (!props.item.giftPack) return []
  return shopStore.getGiftPackPreviewItems(props.item.giftPack)
})

function handleBuy() {
  if (canBuy.value) {
    emit('buy', props.item)
  }
}

function handleAddToCart() {
  if (canBuy.value) {
    shopStore.addToCart(props.item.id, 1)
    emit('add-to-cart', props.item)
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

function getItemRarityClass(rarity?: string): string {
  return rarity ? (rarityColors[rarity] || '') : ''
}

function getItemRarityBgClass(rarity?: string): string {
  return rarity ? (rarityBgColors[rarity] || '') : ''
}
</script>

<template>
  <div
    :data-shop-item-id="item.id"
    class="relative rounded-xl border-2 transition-all duration-300 overflow-hidden group"
    :class="[
      rarityColorClass,
      rarityBgClass,
      isUnlocked ? 'hover:scale-[1.02] hover:shadow-lg hover:shadow-current/20' : 'opacity-60',
      highlighted ? 'ring-4 ring-amber-400 ring-opacity-75 animate-pulse scale-[1.02]' : ''
    ]"
  >
    <div class="absolute top-0 left-0 z-10 flex gap-1">
      <div
        v-if="tagText"
        class="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-2 py-1 text-xs font-bold rounded-br-lg"
      >
        {{ tagText }}
      </div>
      <div
        v-if="isGiftPack"
        class="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-2 py-1 text-xs font-bold rounded-br-lg flex items-center gap-1"
      >
        <Gift class="w-3 h-3" />
        礼包
      </div>
    </div>
    <div
      v-if="hasDiscount"
      class="absolute top-0 right-0 z-10 bg-red-500 text-white px-2 py-1 text-xs font-bold rounded-bl-lg flex items-center gap-1"
    >
      <Tag class="w-3 h-3" />
      -{{ discountPercent }}%
    </div>

    <div class="p-4">
      <div class="flex items-start gap-3 mb-3 mt-4">
        <div class="text-4xl flex-shrink-0">{{ item.icon }}</div>
        <div class="flex-1 min-w-0">
          <div class="font-bold text-white truncate">{{ item.name }}</div>
          <div class="text-xs text-gray-400">{{ categoryNames[item.category] }}</div>
        </div>
      </div>

      <p class="text-sm text-gray-300 mb-3 line-clamp-2 h-10">{{ item.description }}</p>

      <div v-if="isGiftPack && item.giftPack?.showPreview" class="mb-3 p-2 bg-gray-800/50 rounded-lg">
        <button
          @click.stop="showGiftPreview = true"
          class="w-full text-left flex items-center justify-between text-sm text-purple-300 hover:text-purple-200 transition-colors"
        >
          <span class="flex items-center gap-1.5">
            <Gift class="w-4 h-4" />
            查看礼包内容 ({{ giftPreviewItems.length }}件)
          </span>
          <span class="text-xs">点击展开</span>
        </button>
      </div>

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

        <div v-if="limitText" class="flex items-center justify-between text-sm">
          <span class="text-gray-400">限购</span>
          <span class="text-orange-400 text-xs">
            {{ limitText }}
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

      <div class="flex gap-2">
        <button
          @click="handleAddToCart"
          :disabled="!canBuy"
          class="flex-1 py-2.5 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 text-sm"
          :class="[
            canBuy
              ? isInCart
                ? 'bg-green-600/20 text-green-400 border border-green-500/50'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600'
              : 'bg-gray-700/50 text-gray-500 cursor-not-allowed border border-gray-700'
          ]"
        >
          <ShoppingCart class="w-4 h-4" />
          {{ isInCart ? '已在购物车' : '加购' }}
        </button>
        <button
          @click="handleBuy"
          :disabled="!canBuy"
          class="flex-1 py-2.5 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 text-sm"
          :class="[
            canBuy
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-amber-500/25'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          ]"
        >
          {{ buyButtonText }}
        </button>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showGiftPreview"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="showGiftPreview = false"></div>
          <div class="relative bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl w-full max-w-md overflow-hidden">
            <div class="flex items-center justify-between p-4 border-b border-gray-700">
              <div class="flex items-center gap-2">
                <Gift class="w-5 h-5 text-purple-400" />
                <h3 class="text-lg font-bold text-white">{{ item.name }} · 礼包内容</h3>
              </div>
              <button @click="showGiftPreview = false" class="p-1 hover:bg-gray-800 rounded-lg transition-colors">
                <X class="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div class="p-4 max-h-80 overflow-y-auto space-y-2">
              <div
                v-for="previewItem in giftPreviewItems"
                :key="previewItem.itemId"
                class="flex items-center gap-3 p-3 rounded-xl border"
                :class="[getItemRarityClass(previewItem.rarity), getItemRarityBgClass(previewItem.rarity)]"
              >
                <div class="text-2xl">{{ previewItem.icon || '📦' }}</div>
                <div class="flex-1">
                  <div class="font-medium text-white">{{ previewItem.itemName }}</div>
                  <div class="text-xs text-gray-400">x{{ previewItem.quantity }}</div>
                </div>
              </div>
            </div>
            <div class="p-4 border-t border-gray-700 bg-gray-800/30">
              <button
                @click="showGiftPreview = false"
                class="w-full py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
              >
                知道了
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
