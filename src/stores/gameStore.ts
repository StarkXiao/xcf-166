import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { GameStats, TimePhase, SaveData } from '../game/types'
import { useOrderStore } from './orderStore'
import { useEventStore } from './eventStore'

const SAVE_KEY = 'b2_morgue_save'
const SAVE_VERSION = '2.0.0'

export const useGameStore = defineStore('game', () => {
  const timePhase = ref<TimePhase>('day')
  const day = ref(1)
  const isProcessing = ref(false)
  const currentProcessingStep = ref<string | null>(null)
  const processingProgress = ref(0)
  const gameStarted = ref(false)
  const gameOver = ref(false)
  const gameOverReason = ref('')

  const stats = ref<GameStats>({
    money: 2000,
    reputation: 50,
    sanity: 100,
    maxSanity: 100,
    day: 1,
    totalOrdersCompleted: 0,
    totalRelicsProcessed: 0
  })

  const sanityColor = computed(() => {
    if (stats.value.sanity > 70) return '#22c55e'
    if (stats.value.sanity > 40) return '#eab308'
    return '#ef4444'
  })

  const isLowSanity = computed(() => stats.value.sanity < 30)
  const isNight = computed(() => timePhase.value === 'night')

  function startGame() {
    resetGame()
    gameStarted.value = true
  }

  function resetGame() {
    day.value = 1
    timePhase.value = 'day'
    isProcessing.value = false
    currentProcessingStep.value = null
    processingProgress.value = 0
    gameOver.value = false
    gameOverReason.value = ''
    stats.value = {
      money: 2000,
      reputation: 50,
      sanity: 100,
      maxSanity: 100,
      day: 1,
      totalOrdersCompleted: 0,
      totalRelicsProcessed: 0
    }
  }

  function addMoney(amount: number) {
    stats.value.money = Math.max(0, stats.value.money + amount)
  }

  function addReputation(amount: number) {
    stats.value.reputation = Math.max(0, Math.min(100, stats.value.reputation + amount))
  }

  function addSanity(amount: number) {
    stats.value.sanity = Math.max(0, Math.min(stats.value.maxSanity, stats.value.sanity + amount))
    checkGameOver()
  }

  function setProcessing(stepId: string | null, progress: number = 0) {
    currentProcessingStep.value = stepId
    processingProgress.value = progress
    isProcessing.value = stepId !== null
  }

  function advancePhase() {
    if (timePhase.value === 'day') {
      timePhase.value = 'night'
    } else {
      timePhase.value = 'day'
      day.value++
      stats.value.day = day.value
      stats.value.sanity = Math.min(stats.value.maxSanity, stats.value.sanity + 10)
    }
  }

  function completeOrder() {
    stats.value.totalOrdersCompleted++
    stats.value.totalRelicsProcessed++
  }

  function checkGameOver() {
    if (stats.value.sanity <= 0) {
      gameOver.value = true
      gameOverReason.value = '你的理智值归零了。地下二层的存在开始侵蚀你的意识...'
    }
    if (stats.value.money <= 0 && stats.value.reputation < 20) {
      gameOver.value = true
      gameOverReason.value = '你破产了，并且声名狼藉。馆长不得不让你离开这里...'
    }
  }

  function saveGame(): SaveData {
    const orderStore = useOrderStore()
    const eventStore = useEventStore()

    const saveData: SaveData = {
      stats: { ...stats.value },
      timePhase: timePhase.value,
      day: day.value,
      isProcessing: isProcessing.value,
      currentProcessingStep: currentProcessingStep.value,
      processingProgress: processingProgress.value,
      pendingOrders: JSON.parse(JSON.stringify(orderStore.pendingOrders)),
      acceptedOrders: JSON.parse(JSON.stringify(orderStore.acceptedOrders)),
      currentOrderId: orderStore.currentOrderId,
      eventQueue: JSON.parse(JSON.stringify(eventStore.eventQueue)),
      currentEvent: JSON.parse(JSON.stringify(eventStore.currentEvent)),
      eventHistory: JSON.parse(JSON.stringify(eventStore.eventHistory)),
      eventResultMessage: eventStore.eventResultMessage,
      timestamp: Date.now(),
      version: SAVE_VERSION
    }
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData))
    return saveData
  }

  function loadGame(): SaveData | null {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    try {
      const data = JSON.parse(raw) as SaveData
      if (data.version !== SAVE_VERSION) {
        console.warn('存档版本不兼容，将使用新存档')
        return null
      }
      stats.value = { ...data.stats }
      timePhase.value = data.timePhase
      day.value = data.day
      isProcessing.value = data.isProcessing && data.processingProgress > 0 && data.processingProgress < 100
      currentProcessingStep.value = data.isProcessing ? data.currentProcessingStep : null
      processingProgress.value = data.isProcessing ? data.processingProgress : 0
      gameStarted.value = true
      return data
    } catch {
      console.error('存档读取失败')
      return null
    }
  }

  function hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null
  }

  function deleteSave() {
    localStorage.removeItem(SAVE_KEY)
  }

  return {
    timePhase,
    day,
    stats,
    isProcessing,
    currentProcessingStep,
    processingProgress,
    gameStarted,
    gameOver,
    gameOverReason,
    sanityColor,
    isLowSanity,
    isNight,
    startGame,
    resetGame,
    addMoney,
    addReputation,
    addSanity,
    setProcessing,
    advancePhase,
    completeOrder,
    saveGame,
    loadGame,
    hasSave,
    deleteSave
  }
})
