<script setup lang="ts">
import { ref, computed } from 'vue'
import { useShopStore } from '../stores/shopStore'
import { useGameStore } from '../stores/gameStore'
import type { ShopItem, ItemCategory } from '../types/shop'
import { categoryNames } from '../game/data/shopItems'
import ShopItemCard from '../components/shop/ShopItemCard.vue'
import PurchaseConfirmModal from '../components/shop/PurchaseConfirmModal.vue'
import OrderHistory from '../components/shop/OrderHistory.vue'
import InventoryPanel from '../components/shop/InventoryPanel.vue'
import ShoppingCart from '../components/shop/ShoppingCart.vue'
import {
  Store,
  Tag,
  Filter,
  ShoppingBag,
  Backpack,
  Coins,
  Star,
  Clock,
  Sparkles,
  ChevronDown,
  ShoppingCart as ShoppingCartIcon
} from 'lucide-vue-next'

const shopStore = useShopStore()
const gameStore = useGameStore()

type TabType = 'shop' | 'orders' | 'inventory'
const activeTab = ref<TabType>('shop')

const showPurchaseModal = ref(false)
const showCartModal = ref(false)
const selectedItem = ref<ShopItem | null>(null)
const selectedDiscount = ref<ReturnType<typeof shopStore.getItemDiscount> | null>(null)

const categories: Array<{ key: ItemCategory | 'all'; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'consumable', label: '消耗品' },
  { key: 'buff', label: '增益道具' },
  { key: 'material', label: '材料' },
  { key: 'cosmetic', label: '外观' }
]

const filteredItems = computed(() => shopStore.filteredItems)
const activeDiscounts = computed(() => shopStore.activeDiscounts)
const cartItemCount = computed(() => shopStore.cartItemCount)

const stats = computed(() => gameStore.stats)

function formatTimeRemaining(endTime: number): string {
  const diff = endTime - Date.now()
  if (diff <= 0) return '已结束'
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (hours > 24) {
    return `${Math.floor(hours / 24)}天${hours % 24}时`
  }
  if (hours > 0) {
    return `${hours}时${minutes}分`
  }
  return `${minutes}分`
}

function handleBuy(item: ShopItem) {
  selectedItem.value = item
  selectedDiscount.value = shopStore.getItemDiscount(item.id, item.category)
  showPurchaseModal.value = true
}

function handlePurchase(item: ShopItem, quantity: number) {
  console.log(`Purchased ${item.name} x${quantity}`)
  showPurchaseModal.value = false
}

function setCategory(category: ItemCategory | 'all') {
  shopStore.setCategory(category)
}

function toggleShowOnSale() {
  shopStore.toggleShowOnSale()
}

function handleAddToCart(item: ShopItem) {
  console.log(`Added ${item.name} to cart`)
}

function handleCartPurchaseSuccess(order: any) {
  console.log('Cart purchase successful:', order)
  showCartModal.value = false
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 text-white">
    <div class="max-w-7xl mx-auto px-4 py-6">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <div class="p-3 bg-amber-500/20 rounded-xl">
            <Store class="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <h1 class="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              道具商城
            </h1>
            <p class="text-sm text-gray-400">精选道具，助你一臂之力</p>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <button
            @click="showCartModal = true"
            class="relative flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 px-4 py-2 rounded-xl hover:bg-blue-500/20 transition-colors"
          >
            <ShoppingCartIcon class="w-5 h-5 text-blue-400" />
            <span class="font-bold text-blue-400">购物车</span>
            <span
              v-if="cartItemCount > 0"
              class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
            >
              {{ cartItemCount }}
            </span>
          </button>
          <div class="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 px-4 py-2 rounded-xl">
            <Coins class="w-5 h-5 text-yellow-400" />
            <span class="font-bold text-yellow-400">{{ stats.money.toLocaleString() }}</span>
          </div>
          <div class="flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 px-4 py-2 rounded-xl">
            <Star class="w-5 h-5 text-purple-400" />
            <span class="font-bold text-purple-400">{{ stats.reputation }}</span>
          </div>
        </div>
      </div>

      <div v-if="activeDiscounts.length > 0" class="mb-6 space-y-3">
        <div
          v-for="discount in activeDiscounts"
          :key="discount.id"
          class="bg-gradient-to-r from-red-500/20 to-amber-500/20 border border-red-500/30 rounded-xl p-4 flex items-center justify-between"
        >
          <div class="flex items-center gap-3">
            <div class="p-2 bg-red-500/30 rounded-lg">
              <Sparkles class="w-6 h-6 text-red-400" />
            </div>
            <div>
              <div class="font-bold text-white flex items-center gap-2">
                {{ discount.name }}
                <span class="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  -{{ discount.discountPercent }}%
                </span>
              </div>
              <p class="text-sm text-gray-400">{{ discount.description }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2 text-amber-400">
            <Clock class="w-4 h-4" />
            <span class="font-medium">剩余 {{ formatTimeRemaining(discount.endTime) }}</span>
          </div>
        </div>
      </div>

      <div class="flex gap-2 mb-6 bg-gray-800/50 p-1.5 rounded-xl w-fit">
        <button
          v-for="tab in [{ key: 'shop', label: '商城', icon: Store }, { key: 'orders', label: '订单', icon: ShoppingBag }, { key: 'inventory', label: '背包', icon: Backpack }]"
          :key="tab.key"
          @click="activeTab = tab.key as TabType"
          class="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all"
          :class="[
            activeTab === tab.key
              ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25'
              : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
          ]"
        >
          <component :is="tab.icon" class="w-4 h-4" />
          {{ tab.label }}
        </button>
      </div>

      <div v-show="activeTab === 'shop'">
        <div class="flex flex-wrap items-center gap-4 mb-6">
          <div class="flex items-center gap-2">
            <Filter class="w-4 h-4 text-gray-400" />
            <span class="text-sm text-gray-400">分类：</span>
            <div class="flex gap-1 bg-gray-800/50 p-1 rounded-lg">
              <button
                v-for="cat in categories"
                :key="cat.key"
                @click="setCategory(cat.key)"
                class="px-3 py-1.5 rounded-md text-sm font-medium transition-all"
                :class="[
                  shopStore.selectedCategory === cat.key
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:text-white'
                ]"
              >
                {{ cat.label }}
              </button>
            </div>
          </div>

          <button
            @click="toggleShowOnSale"
            class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
            :class="[
              shopStore.showOnlyOnSale
                ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                : 'bg-gray-800/50 text-gray-400 hover:text-white'
            ]"
          >
            <Tag class="w-4 h-4" />
            仅显示折扣
          </button>

          <div class="ml-auto text-sm text-gray-400">
            共 {{ filteredItems.length }} 件商品
          </div>
        </div>

        <div v-if="filteredItems.length === 0" class="text-center py-16">
          <Store class="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p class="text-gray-500 text-lg">暂无符合条件的商品</p>
          <p class="text-sm text-gray-600 mt-2">试试其他筛选条件吧</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <ShopItemCard
            v-for="item in filteredItems"
            :key="item.id"
            :item="item"
            :discount="shopStore.getItemDiscount(item.id, item.category)"
            @buy="handleBuy"
            @add-to-cart="handleAddToCart"
          />
        </div>
      </div>

      <div v-show="activeTab === 'orders'">
        <OrderHistory />
      </div>

      <div v-show="activeTab === 'inventory'">
        <InventoryPanel />
      </div>
    </div>

    <PurchaseConfirmModal
      :show="showPurchaseModal"
      :item="selectedItem"
      :discount="selectedDiscount"
      @close="showPurchaseModal = false"
      @purchase="handlePurchase"
    />

    <ShoppingCart
      :show="showCartModal"
      @close="showCartModal = false"
      @purchase-success="handleCartPurchaseSuccess"
    />
  </div>
</template>
