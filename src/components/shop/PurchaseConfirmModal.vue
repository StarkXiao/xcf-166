<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ShopItem, DiscountConfig } from '../../types/shop'
import { useShopStore } from '../../stores/shopStore'
import { useGameStore } from '../../stores/gameStore'
import { rarityColors, rarityBgColors } from '../../game/data/shopItems'
import { X, Minus, Plus, ShoppingCart, AlertCircle, CheckCircle, XCircle } from 'lucide-vue-next'

const props = defineProps<{
  show: boolean
  item: ShopItem | null
  discount?: DiscountConfig | null
}>()

const emit = defineEmits<{
  close: []
  purchase: [item: ShopItem, quantity: number]
}>()

const shopStore = useShopStore()
const gameStore = useGameStore()

const quantity = ref(1)
const purchaseResult = ref<{ success: boolean; message: string } | null>(null)
const isProcessing = ref(false)

const currentPrice = computed(() => {
  if (!props.item) return { money: 0 }
  return shopStore.getItemCurrentPrice(props.item)
})

const totalPrice = computed(() => ({
  money: currentPrice.value.money * quantity.value,
  reputation: currentPrice.value.reputation !== undefined
    ? currentPrice.value.reputation * quantity.value
    : undefined
}))

const originalTotalPrice = computed(() => {
  if (!props.item) return { money: 0 }
  return {
    money: props.item.originalPrice.money * quantity.value,
    reputation: props.item.originalPrice.reputation !== undefined
      ? props.item.originalPrice.reputation * quantity.value
      : undefined
  }
})

const maxQuantity = computed(() => {
  if (!props.item) return 1
  const purchased = shopStore.getItemPurchaseCount(props.item.id)
  return Math.min(
    props.item.maxPurchasePerUser - purchased,
    props.item.stock
  )
})

const canIncrease = computed(() => quantity.value < maxQuantity.value)

const canPurchase = computed(() => {
  if (!props.item) return false
  const validation = shopStore.validatePurchase(props.item.id, quantity.value)
  return validation.valid
})

const savedAmount = computed(() => {
  if (!props.discount) return { money: 0, reputation: 0 }
  const moneySaved = originalTotalPrice.value.money - totalPrice.value.money
  const repSaved = (originalTotalPrice.value.reputation || 0) - (totalPrice.value.reputation || 0)
  return { money: moneySaved, reputation: repSaved }
})

const rarityColorClass = computed(() => {
  if (!props.item) return ''
  return rarityColors[props.item.rarity] || ''
})

const rarityBgClass = computed(() => {
  if (!props.item) return ''
  return rarityBgColors[props.item.rarity] || ''
})

watch(() => props.show, (newVal) => {
  if (newVal) {
    quantity.value = 1
    purchaseResult.value = null
    isProcessing.value = false
  }
})

function decreaseQuantity() {
  if (quantity.value > 1) {
    quantity.value--
  }
}

function increaseQuantity() {
  if (canIncrease.value) {
    quantity.value++
  }
}

function handleClose() {
  if (!isProcessing.value) {
    emit('close')
  }
}

async function handlePurchase() {
  if (!props.item || !canPurchase.value || isProcessing.value) return

  isProcessing.value = true
  purchaseResult.value = null

  await new Promise(resolve => setTimeout(resolve, 300))

  const result = shopStore.purchaseItem(props.item.id, quantity.value)

  purchaseResult.value = {
    success: result.success,
    message: result.message
  }

  isProcessing.value = false

  if (result.success) {
    setTimeout(() => {
      emit('purchase', props.item!, quantity.value)
      emit('close')
    }, 1500)
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          class="absolute inset-0 bg-black/70 backdrop-blur-sm"
          @click="handleClose"
        ></div>

        <div
          class="relative bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl w-full max-w-md overflow-hidden"
        >
          <div
            v-if="item"
            class="p-6"
          >
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-xl font-bold text-white">确认购买</h3>
              <button
                @click="handleClose"
                :disabled="isProcessing"
                class="p-1 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X class="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div
              class="rounded-xl border-2 p-4 mb-4"
              :class="[rarityColorClass, rarityBgClass]"
            >
              <div class="flex items-center gap-4">
                <div class="text-5xl">{{ item.icon }}</div>
                <div class="flex-1">
                  <div class="font-bold text-white text-lg">{{ item.name }}</div>
                  <p class="text-sm text-gray-400 mt-1">{{ item.description }}</p>
                </div>
              </div>
            </div>

            <div class="space-y-4 mb-6">
              <div class="flex items-center justify-between">
                <span class="text-gray-400">单价</span>
                <div class="flex items-center gap-2">
                  <span
                    v-if="discount"
                    class="text-gray-500 line-through"
                  >
                    {{ item.originalPrice.money }}💰
                    <span v-if="item.originalPrice.reputation !== undefined">
                      +{{ item.originalPrice.reputation }}⭐
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

              <div class="flex items-center justify-between">
                <span class="text-gray-400">购买数量</span>
                <div class="flex items-center gap-3">
                  <button
                    @click="decreaseQuantity"
                    :disabled="quantity <= 1"
                    class="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus class="w-4 h-4" />
                  </button>
                  <span class="text-white font-bold w-8 text-center">{{ quantity }}</span>
                  <button
                    @click="increaseQuantity"
                    :disabled="!canIncrease"
                    class="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div class="pt-3 border-t border-gray-700">
                <div class="flex items-center justify-between">
                  <span class="text-gray-400">总计</span>
                  <span class="text-2xl font-bold text-amber-400">
                    {{ totalPrice.money }}💰
                    <span v-if="totalPrice.reputation !== undefined">
                      +{{ totalPrice.reputation }}⭐
                    </span>
                  </span>
                </div>
                <div
                  v-if="discount && (savedAmount.money > 0 || savedAmount.reputation > 0)"
                  class="flex items-center justify-between text-sm text-green-400 mt-1"
                >
                  <span>本次节省</span>
                  <span>
                    {{ savedAmount.money }}💰
                    <span v-if="savedAmount.reputation > 0">
                      +{{ savedAmount.reputation }}⭐
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div
              v-if="purchaseResult"
              class="mb-4 p-3 rounded-lg flex items-center gap-2"
              :class="purchaseResult.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'"
            >
              <component
                :is="purchaseResult.success ? CheckCircle : XCircle"
                class="w-5 h-5 flex-shrink-0"
              />
              <span>{{ purchaseResult.message }}</span>
            </div>

            <div
              v-if="!canPurchase && item"
              class="mb-4 p-3 bg-amber-500/20 rounded-lg flex items-center gap-2 text-amber-400"
            >
              <AlertCircle class="w-5 h-5 flex-shrink-0" />
              <span class="text-sm">{{ shopStore.validatePurchase(item.id, quantity).message }}</span>
            </div>

            <div class="flex gap-3">
              <button
                @click="handleClose"
                :disabled="isProcessing"
                class="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
              >
                取消
              </button>
              <button
                @click="handlePurchase"
                :disabled="!canPurchase || isProcessing"
                class="flex-1 py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                :class="[
                  canPurchase && !isProcessing
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-amber-500/25'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                ]"
              >
                <ShoppingCart class="w-5 h-5" />
                <span v-if="isProcessing">处理中...</span>
                <span v-else>确认购买</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
