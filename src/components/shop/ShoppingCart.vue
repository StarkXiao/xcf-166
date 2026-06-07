<script setup lang="ts">
import { ref, computed } from 'vue'
import { useShopStore } from '@/stores/shopStore'
import { useGameStore } from '@/stores/gameStore'
import { X, Plus, Minus, Trash2, ShoppingBag, AlertCircle, CheckCircle } from 'lucide-vue-next'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  close: []
  purchaseSuccess: [order: any]
}>()

const shopStore = useShopStore()
const gameStore = useGameStore()

const isProcessing = ref(false)
const showResult = ref(false)
const resultMessage = ref('')
const resultSuccess = ref(false)

const canAfford = computed(() => gameStore.stats.money >= shopStore.cartTotal)

const validation = computed(() => shopStore.validatePurchase())

async function handleCheckout() {
  if (isProcessing.value) return
  
  const validationResult = shopStore.validatePurchase()
  if (!validationResult.valid) {
    resultMessage.value = validationResult.error || '购买失败'
    resultSuccess.value = false
    showResult.value = true
    setTimeout(() => {
      showResult.value = false
    }, 3000)
    return
  }

  isProcessing.value = true

  await new Promise(resolve => setTimeout(resolve, 800))

  const result = shopStore.checkout()
  
  isProcessing.value = false
  
  if (result.success && result.order) {
    resultMessage.value = `购买成功！共节省 ¥${result.totalDiscount || 0}`
    resultSuccess.value = true
    showResult.value = true
    emit('purchaseSuccess', result.order)
    
    setTimeout(() => {
      showResult.value = false
      emit('close')
    }, 2000)
  } else {
    resultMessage.value = result.message || '购买失败'
    resultSuccess.value = false
    showResult.value = true
    setTimeout(() => {
      showResult.value = false
    }, 3000)
  }
}

function handleUpdateQuantity(itemId: string, delta: number) {
  const cartItem = shopStore.cart.find(c => c.item.id === itemId)
  if (!cartItem) return
  
  const newQuantity = cartItem.quantity + delta
  shopStore.updateCartQuantity(itemId, newQuantity)
}

function handleRemoveItem(itemId: string) {
  shopStore.removeFromCart(itemId)
}

function handleClearCart() {
  if (confirm('确定要清空购物车吗？')) {
    shopStore.clearCart()
  }
}

function getItemPrice(item: any) {
  return shopStore.getItemCurrentPrice(item).money
}

function getItemTotalPrice(item: any, quantity: number) {
  return getItemPrice(item) * quantity
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div 
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        @click.self="emit('close')"
      >
        <Transition name="slide">
          <div 
            v-if="show"
            class="w-full max-w-lg max-h-[80vh] bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col"
          >
            <div class="flex items-center justify-between p-4 border-b border-gray-700">
              <div class="flex items-center gap-3">
                <ShoppingBag class="w-6 h-6 text-purple-400" />
                <h2 class="text-xl font-bold text-white">购物车</h2>
                <span 
                  v-if="shopStore.cartItemCount > 0"
                  class="px-2 py-0.5 bg-purple-600 rounded-full text-xs text-white font-bold"
                >
                  {{ shopStore.cartItemCount }}
                </span>
              </div>
              <button
                @click="emit('close')"
                class="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X class="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div class="flex-1 overflow-y-auto p-4">
              <Transition name="fade">
                <div 
                  v-if="showResult"
                  class="mb-4 p-3 rounded-lg flex items-center gap-2"
                  :class="resultSuccess ? 'bg-green-900/50 border border-green-700' : 'bg-red-900/50 border border-red-700'"
                >
                  <CheckCircle v-if="resultSuccess" class="w-5 h-5 text-green-400 flex-shrink-0" />
                  <AlertCircle v-else class="w-5 h-5 text-red-400 flex-shrink-0" />
                  <span :class="resultSuccess ? 'text-green-300' : 'text-red-300'">
                    {{ resultMessage }}
                  </span>
                </div>
              </Transition>

              <div v-if="shopStore.cart.length === 0" class="text-center py-12">
                <ShoppingBag class="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p class="text-gray-500">购物车是空的</p>
                <p class="text-sm text-gray-600 mt-1">快去挑选心仪的商品吧</p>
              </div>

              <div v-else class="space-y-3">
                <div 
                  v-for="cartItem in shopStore.cart"
                  :key="cartItem.item.id"
                  class="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl border border-gray-700"
                >
                  <div class="text-3xl">{{ cartItem.item.icon }}</div>
                  
                  <div class="flex-1 min-w-0">
                    <h4 class="font-medium text-white truncate">{{ cartItem.item.name }}</h4>
                    <div class="flex items-center gap-2 mt-1">
                      <span class="text-yellow-400 font-bold">
                        ¥{{ getItemPrice(cartItem.item) }}
                      </span>
                      <span v-if="getItemPrice(cartItem.item) < cartItem.item.originalPrice.money" class="text-xs text-gray-500 line-through">
                        ¥{{ cartItem.item.originalPrice.money }}
                      </span>
                    </div>
                  </div>

                  <div class="flex items-center gap-2">
                    <button
                      @click="handleUpdateQuantity(cartItem.item.id, -1)"
                      class="p-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      <Minus class="w-4 h-4 text-gray-300" />
                    </button>
                    <span class="w-8 text-center text-white font-medium">
                      {{ cartItem.quantity }}
                    </span>
                    <button
                      @click="handleUpdateQuantity(cartItem.item.id, 1)"
                      :disabled="cartItem.quantity >= cartItem.item.stock"
                      class="p-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                    >
                      <Plus class="w-4 h-4 text-gray-300" />
                    </button>
                  </div>

                  <div class="text-right">
                    <div class="text-yellow-400 font-bold">
                      ¥{{ getItemTotalPrice(cartItem.item, cartItem.quantity) }}
                    </div>
                    <button
                      @click="handleRemoveItem(cartItem.item.id)"
                      class="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 ml-auto"
                    >
                      <Trash2 class="w-3 h-3" />
                      移除
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="p-4 border-t border-gray-700 bg-gray-800/50">
              <div class="space-y-2 mb-4">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">商品原价</span>
                  <span class="text-gray-300">¥{{ shopStore.cartOriginalTotal }}</span>
                </div>
                <div v-if="shopStore.cartDiscount > 0" class="flex justify-between text-sm">
                  <span class="text-green-400">优惠减免</span>
                  <span class="text-green-400">-¥{{ shopStore.cartDiscount }}</span>
                </div>
                <div class="flex justify-between text-lg font-bold">
                  <span class="text-white">应付金额</span>
                  <span class="text-yellow-400">¥{{ shopStore.cartTotal }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">当前金币</span>
                  <span :class="canAfford ? 'text-green-400' : 'text-red-400'">
                    ¥{{ gameStore.stats.money }}
                  </span>
                </div>
              </div>

              <div v-if="!validation.valid" class="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg">
                <div class="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle class="w-4 h-4 flex-shrink-0" />
                  <span>{{ validation.error }}</span>
                </div>
              </div>

              <div class="flex gap-3">
                <button
                  @click="handleClearCart"
                  :disabled="shopStore.cart.length === 0"
                  class="flex-1 py-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium text-gray-300 transition-colors"
                >
                  清空购物车
                </button>
                <button
                  @click="handleCheckout"
                  :disabled="!validation.valid || isProcessing"
                  class="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl font-bold text-white transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <span v-if="isProcessing">结算中...</span>
                  <span v-else>立即结算</span>
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
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

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-20px);
}
</style>
