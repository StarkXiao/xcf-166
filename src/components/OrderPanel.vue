<script setup lang="ts">
import { computed } from 'vue'
import { useOrderStore } from '@/stores/orderStore'
import { useGameStore } from '@/stores/gameStore'
import { audioManager } from '@/game/audio'

const orderStore = useOrderStore()
const gameStore = useGameStore()

const pendingOrders = computed(() => orderStore.pendingOrdersList)
const acceptedOrders = computed(() => orderStore.acceptedOrdersList)
const currentOrderId = computed(() => orderStore.currentOrderId)

const difficultyStars = (level: number) => '★'.repeat(level) + '☆'.repeat(3 - level)

const anomalyName: Record<string, string> = {
  whisper: '低语',
  cold_spot: '寒意',
  shadow: '阴影',
  flicker: '闪烁',
  echo: '回声',
  poltergeist: '骚动'
}

const relicIcon: Record<string, string> = {
  photo: '📷',
  watch: '⌚',
  letter: '✉️',
  jewelry: '💍',
  toy: '🧸',
  book: '📖',
  music_box: '🎵',
  mirror: '🪞'
}

function handleAccept(orderId: string) {
  audioManager.playClick()
  orderStore.acceptOrder(orderId)
}

function handleReject(orderId: string) {
  audioManager.playClick()
  orderStore.rejectOrder(orderId)
}

function handleSelect(orderId: string) {
  audioManager.playClick()
  orderStore.selectOrder(orderId)
}
</script>

<template>
  <div class="order-panel h-full flex flex-col bg-gray-900/90 text-gray-100 border-r border-gray-700">
    <div class="p-4 border-b border-gray-700">
      <h2 class="text-xl font-bold text-red-400">📋 订单列表</h2>
      <p class="text-sm text-gray-400 mt-1">第 {{ gameStore.day }} 天 · {{ gameStore.timePhase === 'day' ? '白天' : '夜晚' }}</p>
    </div>

    <div class="flex-1 overflow-y-auto p-3 space-y-4">
      <div v-if="gameStore.timePhase === 'day'">
        <h3 class="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          待接订单 ({{ pendingOrders.length }})
        </h3>
        <div v-if="pendingOrders.length === 0" class="text-center text-gray-500 py-8">
          暂无新订单
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="item in pendingOrders"
            :key="item.order.id"
            class="bg-gray-800/80 rounded-lg p-3 border border-gray-700 hover:border-red-500/50 transition-all"
          >
            <div class="flex items-start justify-between mb-2">
              <div>
                <div class="font-medium">{{ item.order.clientName }} 委托</div>
                <div class="text-xs text-gray-400">逝者：{{ item.order.deceasedName }}（{{ item.order.deceasedAge }}岁）</div>
              </div>
              <div class="text-amber-400 text-xs">
                {{ difficultyStars(item.order.difficulty) }}
              </div>
            </div>

            <div class="flex items-center gap-2 mb-2 text-sm">
              <span class="text-2xl">{{ relicIcon[item.relic.type] }}</span>
              <div>
                <div class="font-medium text-red-300">{{ item.relic.name }}</div>
                <div class="text-xs text-gray-500">异常：{{ anomalyName[item.relic.anomaly] }}</div>
              </div>
            </div>

            <p class="text-xs text-gray-400 mb-3 line-clamp-2">{{ item.order.description }}</p>

            <div class="flex items-center justify-between text-xs">
              <div class="space-x-2">
                <span class="text-yellow-400">💰 {{ item.order.reward }}</span>
                <span class="text-purple-400">⭐ +{{ item.order.reputationReward }}</span>
              </div>
              <div class="flex gap-1">
                <button
                  @click="handleAccept(item.order.id)"
                  class="accept-order-btn px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-xs font-medium transition-colors"
                >
                  接受
                </button>
                <button
                  @click="handleReject(item.order.id)"
                  class="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors"
                >
                  拒绝
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 class="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-blue-400" :class="{ 'animate-pulse': gameStore.timePhase === 'night' }"></span>
          待处理 ({{ acceptedOrders.length }})
        </h3>
        <div v-if="acceptedOrders.length === 0" class="text-center text-gray-500 py-8">
          {{ gameStore.timePhase === 'day' ? '白天可以接受订单' : '没有需要处理的遗物' }}
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="item in acceptedOrders"
            :key="item.order.id"
            @click="handleSelect(item.order.id)"
            class="rounded-lg p-3 border cursor-pointer transition-all"
            :class="[
              currentOrderId === item.order.id
                ? 'bg-red-900/40 border-red-500'
                : 'bg-gray-800/80 border-gray-700 hover:border-blue-500/50'
            ]"
          >
            <div class="flex items-center gap-3">
              <span class="text-3xl">{{ relicIcon[item.relic.type] }}</span>
              <div class="flex-1 min-w-0">
                <div class="font-medium truncate">{{ item.relic.name }}</div>
                <div class="text-xs text-gray-400">{{ item.order.deceasedName }} 的遗物</div>
                <div class="flex gap-2 mt-1">
                  <div
                    v-for="step in item.relic.processingSteps"
                    :key="step.id"
                    class="w-2 h-2 rounded-full"
                    :class="step.completed ? 'bg-green-500' : 'bg-gray-600'"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
