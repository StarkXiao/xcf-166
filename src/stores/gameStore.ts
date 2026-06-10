import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { GameStats, TimePhase, SaveData } from '../game/types'
import {
  saveSlot,
  loadSlot,
  deleteSlot,
  getActiveSlotIndex,
  setActiveSlotIndex,
  hasSlotData,
  isSlotOccupied,
  migrateLegacySave,
  CURRENT_VERSION
} from '../game/saveManager'
import { useOrderStore } from './orderStore'
import { useEventStore } from './eventStore'
import { useSeasonStore } from './seasonStore'
import { useCharacterStore } from './characterStore'
import { useAchievementStore } from './achievementStore'
import { useShopStore } from './shopStore'
import { useFriendStore } from './friendStore'
import { useTaskStore } from './taskStore'
import { useOfflineStore } from './offlineStore'

export { CURRENT_VERSION as SAVE_VERSION }

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
    const shopStore = useShopStore()
    shopStore.resetShop()
  }

  function addMoney(amount: number) {
    const previous = stats.value.money
    stats.value.money = Math.max(0, stats.value.money + amount)
    if (amount > 0) {
      const seasonStore = useSeasonStore()
      seasonStore.updateTaskProgress('money_earn', amount)
      const achievementStore = useAchievementStore()
      achievementStore.trackBehavior('money_earned', { amount, previous, current: stats.value.money })
      const taskStore = useTaskStore()
      taskStore.onGameEvent('money_earn', amount)
    }
    try {
      const actStore = (globalThis as any).__pinia_activityStore as any
      if (actStore) actStore.onPlayerEvent('money_change', { money: stats.value.money })
    } catch {}
  }

  function addReputation(amount: number) {
    const previous = stats.value.reputation
    stats.value.reputation = Math.max(0, Math.min(100, stats.value.reputation + amount))
    if (amount > 0) {
      const seasonStore = useSeasonStore()
      seasonStore.updateTaskProgress('reputation_gain', amount)
      const achievementStore = useAchievementStore()
      achievementStore.trackBehavior('reputation_gained', { amount, previous, current: stats.value.reputation })
      const friendStore = useFriendStore()
      friendStore.onGameBehavior('reputation_gained', amount)
      const taskStore = useTaskStore()
      taskStore.onGameEvent('reputation_gain', amount)
    }
  }

  function addSanity(amount: number) {
    const previous = stats.value.sanity
    stats.value.sanity = Math.max(0, Math.min(stats.value.maxSanity, stats.value.sanity + amount))
    if (amount > 0) {
      const achievementStore = useAchievementStore()
      achievementStore.trackBehavior('sanity_recovered', { amount, previous, current: stats.value.sanity })
      const friendStore = useFriendStore()
      friendStore.onGameBehavior('sanity_recovered', amount)
    }
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
      const achievementStore = useAchievementStore()
      achievementStore.trackBehavior('night_fell', { day: day.value })
    } else {
      timePhase.value = 'day'
      day.value++
      stats.value.day = day.value

      const characterStore = useCharacterStore()
      const sanityRecovery = 10 + Math.floor(characterStore.getAttributeValue('sanity') / 20)
      stats.value.sanity = Math.min(stats.value.maxSanity, stats.value.sanity + sanityRecovery)

      characterStore.reduceCooldowns()
      characterStore.checkUnlockConditions()

      const seasonStore = useSeasonStore()
      seasonStore.updateTaskProgress('day_pass', 1)
      const achievementStore = useAchievementStore()
      achievementStore.trackBehavior('day_passed', { day: day.value, totalDays: day.value })
      const taskStore = useTaskStore()
      taskStore.onGameEvent('day_pass', 1)

      try {
        const actStore = (globalThis as any).__pinia_activityStore as any
        if (actStore) actStore.onPlayerEvent('day_pass', { login_days: day.value })
      } catch {}
    }
  }

  function completeOrder(orderQuality?: string) {
    stats.value.totalOrdersCompleted++
    stats.value.totalRelicsProcessed++

    const characterStore = useCharacterStore()
    characterStore.addExp(50 + stats.value.totalOrdersCompleted * 5)
    characterStore.checkUnlockConditions()

    const seasonStore = useSeasonStore()
    seasonStore.updateTaskProgress('order_complete', 1)
    seasonStore.updateTaskProgress('relic_purify', 1)

    const taskStore = useTaskStore()
    taskStore.onGameEvent('order_complete', 1)
    taskStore.onGameEvent('relic_purify', 1)

    const achievementStore = useAchievementStore()
    achievementStore.trackBehavior('order_completed', {
      orderCount: stats.value.totalOrdersCompleted,
      relicCount: stats.value.totalRelicsProcessed,
      quality: orderQuality
    })

    try {
      const actStore = (globalThis as any).__pinia_activityStore as any
      if (actStore) actStore.onPlayerEvent('order_complete', {
        order_count: stats.value.totalOrdersCompleted,
        total_relics: stats.value.totalRelicsProcessed,
      })
    } catch {}
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

  function buildSaveData(): SaveData {
    const orderStore = useOrderStore()
    const eventStore = useEventStore()
    const characterStore = useCharacterStore()
    const shopStore = useShopStore()
    const offlineStore = useOfflineStore()

    const characterData = characterStore.getSaveData()
    const shopData = shopStore.getShopSaveData()

    offlineStore.updateLastOnlineTime()

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
      characterData,
      shopData,
      timestamp: Date.now(),
      version: CURRENT_VERSION
    }
    return saveData
  }

  function saveGame(slotIndex?: number): SaveData {
    const saveData = buildSaveData()
    const slot = slotIndex ?? getActiveSlotIndex()
    saveSlot(slot, saveData, false)
    return saveData
  }

  function loadGame(slotIndex?: number): SaveData | null {
    const slot = slotIndex ?? getActiveSlotIndex()
    const data = loadSlot(slot)
    if (!data) return null

    stats.value = { ...data.stats }
    timePhase.value = data.timePhase
    day.value = data.day
    isProcessing.value = data.isProcessing && data.processingProgress > 0 && data.processingProgress < 100
    currentProcessingStep.value = data.isProcessing ? data.currentProcessingStep : null
    processingProgress.value = data.isProcessing ? data.processingProgress : 0
    gameStarted.value = true

    if (data.characterData) {
      const characterStore = useCharacterStore()
      characterStore.restoreFromSaveData(data.characterData)
    }

    if (data.shopData) {
      const shopStore = useShopStore()
      shopStore.restoreFromSave(data.shopData)
    }

    setActiveSlotIndex(slot)
    return data
  }

  function hasSave(slotIndex?: number): boolean {
    if (slotIndex !== undefined) return hasSlotData(slotIndex)
    for (let i = 0; i < 5; i++) {
      if (isSlotOccupied(i)) return true
    }
    return localStorage.getItem('b2_morgue_save') !== null
  }

  function deleteSave(slotIndex?: number) {
    if (slotIndex !== undefined) {
      deleteSlot(slotIndex)
    } else {
      const activeSlot = getActiveSlotIndex()
      deleteSlot(activeSlot)
    }
    const characterStore = useCharacterStore()
    characterStore.resetCharacters()
    const shopStore = useShopStore()
    shopStore.resetShop()
    const offlineStore = useOfflineStore()
    offlineStore.resetOffline()
  }

  function tryMigrateLegacySave(): boolean {
    return migrateLegacySave()
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
    buildSaveData,
    saveGame,
    loadGame,
    hasSave,
    deleteSave,
    tryMigrateLegacySave
  }
})
