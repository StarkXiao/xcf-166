<script setup lang="ts">
import { computed, ref } from 'vue'
import { useShopStore } from '../../stores/shopStore'
import { ShoppingBag, Clock, Tag, CheckCircle, Gift, ChevronDown, ChevronUp, RefreshCw } from 'lucide-vue-next'

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

const expandedOrders = ref<Set<string>>(new Set())

function toggleExpand(orderId: string) {
  if (expandedOrders.value.has(orderId)) {
    expandedOrders.value.delete(orderId)
  } else {
    expandedOrders.value.add(orderId)
  }
}

function isExpanded(orderId: string): boolean {
  return expandedOrders.value.has(orderId)
}

function handleRollback(orderId: string) {
  if (confirm('确定要回滚该订单吗？\n\n回滚将执行以下操作：\n1. 返还已花费的金币和声望\n2. 从背包中移除获得的物品\n3. 撤销已生效的增益效果\n4. 恢复限购计数\n5. 恢复商品库存')) {
    const record = shopStore.rollbackRecords.find(r => r.orderId === orderId)
    if (record) {
      const result = shopStore.executeRollback(record.id, '用户手动回滚')
      alert(result.message)
    } else {
      alert('未找到回滚记录')
    }
  }
}

const statusText: Record<string, string> = {
  pending: '处理中',
  completed: '已完成',
  refunded: '已退款',
  rollback: '已回滚'
}

const statusColor: Record<string, string> = {
  pending: 'text-amber-400 bg-amber-500/20',
  completed: 'text-green-400 bg-green-500/20',
  refunded: 'text-red-400 bg-red-500/20',
  rollback: 'text-gray-400 bg-gray-500/20'
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
            <div class="font-medium text-white flex items-center gap-2">
              {{ order.itemName }}
              <span v-if="order.isGiftPack" class="text-xs px-2 py-0.5 bg-purple-500/30 text-purple-300 rounded-full flex items-center gap-1">
                <Gift class="w-3 h-3" />
                礼包
              </span>
            </div>
            <div class="flex items-center gap-1 text-xs text-gray-500 mt-1">
              <Clock class="w-3 h-3" />
              {{ formatDate(order.createdAt) }}
              <span v-if="order.rollbackReason" class="text-red-400 ml-2">回滚原因：{{ order.rollbackReason }}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="(order.status === 'completed' || order.status === 'rollback') && order.isGiftPack && order.unpackedItems"
              @click="toggleExpand(order.id)"
              class="p-1 hover:bg-gray-700 rounded transition-colors text-gray-400"
            >
              <ChevronDown v-if="!isExpanded(order.id)" class="w-4 h-4" />
              <ChevronUp v-else class="w-4 h-4" />
            </button>
            <button
              v-if="order.status === 'completed'"
              @click="handleRollback(order.id)"
              class="p-1 hover:bg-red-500/20 rounded transition-colors text-gray-400 hover:text-red-400"
              title="回滚订单"
            >
              <RefreshCw class="w-4 h-4" />
            </button>
            <span
              class="px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1"
              :class="statusColor[order.status]"
            >
              <CheckCircle class="w-3 h-3" />
              {{ statusText[order.status] }}
            </span>
          </div>
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

        <Transition name="fade">
          <div v-if="isExpanded(order.id) && order.isGiftPack && order.unpackedItems" class="mt-3 pt-3 border-t border-gray-700">
            <div class="text-xs text-gray-400 mb-2">{{ order.status === 'rollback' ? '曾拆封获得（已回滚）：' : '拆封获得：' }}</div>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="item in order.unpackedItems"
                :key="item.itemId"
                class="flex items-center gap-1.5 px-2 py-1 bg-gray-800 rounded-lg text-sm"
              >
                <span>{{ item.icon || '📦' }}</span>
                <span class="text-white">{{ item.itemName }}</span>
                <span class="text-gray-400">x{{ item.quantity }}</span>
              </div>
            </div>
          </div>
        </Transition>
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

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  max-height: 0;
}
</style>
