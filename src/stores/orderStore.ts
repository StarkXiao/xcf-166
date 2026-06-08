import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Order, Relic, OrderWithRelic } from '../game/types'
import { getInitialOrders } from '../game/data/relics'
import { useGameStore } from './gameStore'
import { useSeasonStore } from './seasonStore'
import { useCharacterStore } from './characterStore'
import { useAchievementStore } from './achievementStore'
import { useFriendStore } from './friendStore'

export const useOrderStore = defineStore('order', () => {
  const gameStore = useGameStore()
  const pendingOrders = ref<Array<{ order: Order, relic: Relic }>>([])
  const acceptedOrders = ref<Array<{ order: Order, relic: Relic }>>([])
  const currentOrderId = ref<string | null>(null)

  const pendingOrdersList = computed(() => pendingOrders.value)
  const acceptedOrdersList = computed(() => acceptedOrders.value)
  const currentOrder = computed(() => {
    if (!currentOrderId.value) return null
    return acceptedOrders.value.find(o => o.order.id === currentOrderId.value) || null
  })

  function generateNewOrders(day: number) {
    const newOrders = getInitialOrders(day)
    newOrders.forEach(no => {
      no.order.status = 'pending'
    })
    pendingOrders.value = [...pendingOrders.value, ...newOrders]
  }

  function acceptOrder(orderId: string) {
    const idx = pendingOrders.value.findIndex(o => o.order.id === orderId)
    if (idx === -1) return false

    const orderData = pendingOrders.value[idx]
    orderData.order.status = 'accepted'
    acceptedOrders.value.push(orderData)
    pendingOrders.value.splice(idx, 1)
    
    const seasonStore = useSeasonStore()
    seasonStore.updateTaskProgress('order_accept', 1)

    const achievementStore = useAchievementStore()
    achievementStore.trackBehavior('order_accepted', {
      orderId,
      relicType: orderData.relic.type,
      reward: orderData.order.reward
    })
    
    return true
  }

  function rejectOrder(orderId: string) {
    pendingOrders.value = pendingOrders.value.filter(o => o.order.id !== orderId)
  }

  function selectOrder(orderId: string) {
    currentOrderId.value = orderId
  }

  function completeOrder(orderId: string) {
    const idx = acceptedOrders.value.findIndex(o => o.order.id === orderId)
    if (idx === -1) return

    const orderData = acceptedOrders.value[idx]
    orderData.order.status = 'completed'

    const characterStore = useCharacterStore()
    
    const isPerfect = characterStore.consumePerfectComplete()
    const rewardMultiplier = characterStore.getAndResetRewardMultiplier()
    
    let adjustedReward = characterStore.calculateReward(orderData.order.reward)
    let adjustedReputation = characterStore.calculateReward(orderData.order.reputationReward)
    
    if (isPerfect) {
      adjustedReward = Math.floor(adjustedReward * 2)
      adjustedReputation = Math.floor(adjustedReputation * 2)
    }
    
    adjustedReward = Math.floor(adjustedReward * rewardMultiplier)
    adjustedReputation = Math.floor(adjustedReputation * rewardMultiplier)

    gameStore.addMoney(adjustedReward)
    gameStore.addReputation(adjustedReputation)
    gameStore.completeOrder()

    const friendStore = useFriendStore()
    friendStore.onGameBehavior('order_completed', 1, { orderId, relicType: orderData.relic.type })

    acceptedOrders.value.splice(idx, 1)

    if (currentOrderId.value === orderId) {
      currentOrderId.value = null
    }
  }

  function failOrder(orderId: string) {
    const idx = acceptedOrders.value.findIndex(o => o.order.id === orderId)
    if (idx === -1) return

    const orderData = acceptedOrders.value[idx]
    orderData.order.status = 'failed'

    gameStore.addReputation(-orderData.order.reputationReward)
    gameStore.addSanity(-10)

    acceptedOrders.value.splice(idx, 1)

    if (currentOrderId.value === orderId) {
      currentOrderId.value = null
    }
  }

  function updateStepProgress(orderId: string, stepId: string, completed: boolean) {
    const orderData = acceptedOrders.value.find(o => o.order.id === orderId)
    if (!orderData) return

    const step = orderData.relic.processingSteps.find(s => s.id === stepId)
    if (step) {
      step.completed = completed
    }
  }

  function resetSteps(orderId: string) {
    const orderData = acceptedOrders.value.find(o => o.order.id === orderId)
    if (!orderData) return

    orderData.relic.processingSteps.forEach(s => {
      s.completed = false
    })
  }

  function clearPendingOrders() {
    pendingOrders.value = []
  }

  function hasAcceptedOrders() {
    return acceptedOrders.value.length > 0
  }

  function getAcceptedCount() {
    return acceptedOrders.value.length
  }

  function restoreFromSave(pending: OrderWithRelic[], accepted: OrderWithRelic[], currentId: string | null) {
    pendingOrders.value = pending.map(item => ({
      order: { ...item.order },
      relic: {
        ...item.relic,
        processingSteps: item.relic.processingSteps.map(s => ({ ...s }))
      }
    }))
    acceptedOrders.value = accepted.map(item => ({
      order: { ...item.order },
      relic: {
        ...item.relic,
        processingSteps: item.relic.processingSteps.map(s => ({ ...s }))
      }
    }))
    currentOrderId.value = currentId
  }

  function clearAllOrders() {
    pendingOrders.value = []
    acceptedOrders.value = []
    currentOrderId.value = null
  }

  return {
    pendingOrders,
    acceptedOrders,
    currentOrderId,
    pendingOrdersList,
    acceptedOrdersList,
    currentOrder,
    generateNewOrders,
    acceptOrder,
    rejectOrder,
    selectOrder,
    completeOrder,
    failOrder,
    updateStepProgress,
    resetSteps,
    clearPendingOrders,
    hasAcceptedOrders,
    getAcceptedCount,
    restoreFromSave,
    clearAllOrders
  }
})
