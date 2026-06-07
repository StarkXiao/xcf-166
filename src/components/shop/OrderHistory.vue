<script setup lang="ts">
import { computed } from 'vue'
import { useShopStore } from '../../stores/shopStore'
import { ShoppingBag, Clock, Tag, CheckCircle } from 'lucide-vue-next'

const props = defineProps<{
  limit?: number
}>()

const shopStore = useShopStore()

const orders = computed(() => {
  const list = shopStore.completedOrders
  return props.limit ? list.slice(0, props.limit) : list
})

const totalSpent = computed(() => {
  return orders.value.reduce((acc, order) => ({
    money: acc.money + order.totalPrice.money,
    reputation: acc.reputation + (order.totalPrice.reputation || 0)
  }), { money: 0, reputation: 0 })
})

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const statusText: Record<string, string> = {
  pending: '处理中',
  completed: '已完成',
  refunded: '已退款'
}

const statusColor: Record<string, string> = {
  pending: 'text-amber-400 bg-amber-500/20',
  completed: 'text-green-400 bg-green-500/20',
  refunded: 'text-red-400 bg-red-500/20'
}
</script>

<template>
  <div class="bg-gray-900/90 rounded-xl border border-gray-700 overflow-hidden">
    <div class="p-4 border-b border-gray-700 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <ShoppingBag class="w-5 h-5 text-amber-400" />
        <h3 class="font-bold text-white">购买记录</h3>
      </div>
      <div class="text-sm text-gray-400">
        共 {{ orders.length }} 笔订单
      </div>
    </div>

    <div v-if="orders.length === 0" class="p-8 text-center">
      <ShoppingBag class="w-12 h-12 text-gray-600 mx-auto mb-3" />
      <p class="text-gray-500">暂无购买记录</p>
      <p class="text-sm text-gray-600 mt-1">快去商城逛逛吧~</p>
    </div>

    <div v-else class="divide-y divide-gray-700 max-h-96 overflow-y-auto">
      <div
        v-for="order in orders"
        :key="order.id"
        class="p-4 hover:bg-gray-800/50 transition-colors"
      >
        <div class="flex items-start justify-between mb-2">
          <div>
            <div class="font-medium text-white">{{ order.itemName }}</div>
            <div class="flex items-center gap-1 text-xs text-gray-500 mt-1">
              <Clock class="w-3 h-3" />
              {{ formatDate(order.createdAt) }}
            </div>
          </div>
          <span
            class="px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1"
            :class="statusColor[order.status]"
          >
            <CheckCircle class="w-3 h-3" />
            {{ statusText[order.status] }}
          </span>
        </div>

        <div class="flex items-center justify-between text-sm">
          <div class="flex items-center gap-2">
            <span class="text-gray-400">x{{ order.quantity }}</span>
            <span
              v-if="order.discountApplied > 0"
              class="px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded text-xs flex items-center gap-0.5"
            >
              <Tag class="w-3 h-3" />
              -{{ order.discountApplied }}%
            </span>
          </div>
          <div class="text-right">
            <div class="text-amber-400 font-medium">
              {{ order.totalPrice.money }}💰
              <span v-if="order.totalPrice.reputation !== undefined">
                +{{ order.totalPrice.reputation }}⭐
              </span>
            </div>
            <div class="text-xs text-gray-500">
              单价 {{ order.unitPrice.money }}💰
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="orders.length > 0" class="p-4 border-t border-gray-700 bg-gray-800/30">
      <div class="flex items-center justify-between text-sm">
        <span class="text-gray-400">累计消费</span>
        <span class="text-amber-400 font-bold">
          {{ totalSpent.money }}💰
          <span v-if="totalSpent.reputation > 0">
            +{{ totalSpent.reputation }}⭐
          </span>
        </span>
      </div>
    </div>
  </div>
</template>
