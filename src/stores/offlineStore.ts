import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  OfflineEarnings,
  OfflineEarningsLog,
  OfflineEarningsConfig,
  OfflineEarningsState,
} from '@/types/offline'
import { DEFAULT_OFFLINE_CONFIG, calculateOfflineEarnings } from '@/types/offline'
import { useGameStore } from './gameStore'

const STORAGE_KEY = 'offline_earnings_data'

export const useOfflineStore = defineStore('offline', () => {
  const lastOnlineTime = ref(Date.now())
  const pendingEarnings = ref<OfflineEarnings | null>(null)
  const pendingOfflineMinutes = ref(0)
  const logs = ref<OfflineEarningsLog[]>([])
  const showClaimDialog = ref(false)
  const config = ref<OfflineEarningsConfig>({ ...DEFAULT_OFFLINE_CONFIG })

  const totalClaimedMoney = computed(() =>
    logs.value.reduce((sum, log) => sum + log.earnings.money, 0)
  )

  const totalClaimedReputation = computed(() =>
    logs.value.reduce((sum, log) => sum + log.earnings.reputation, 0)
  )

  const totalClaimedSanity = computed(() =>
    logs.value.reduce((sum, log) => sum + log.earnings.sanity, 0)
  )

  const hasPendingEarnings = computed(() => pendingEarnings.value !== null)

  function updateLastOnlineTime() {
    lastOnlineTime.value = Date.now()
    saveToStorage()
  }

  function checkOfflineEarnings(): OfflineEarnings | null {
    const now = Date.now()
    const offlineMs = now - lastOnlineTime.value
    const offlineMinutes = Math.floor(offlineMs / (1000 * 60))

    if (offlineMinutes < config.value.minOfflineMinutes) {
      return null
    }

    const gameStore = useGameStore()
    const earnings = calculateOfflineEarnings(
      offlineMinutes,
      config.value,
      gameStore.day,
      gameStore.stats.reputation
    )

    const hasAnyEarning = earnings.money > 0 || earnings.reputation > 0 || earnings.sanity > 0
    if (!hasAnyEarning) {
      return null
    }

    pendingEarnings.value = earnings
    pendingOfflineMinutes.value = offlineMinutes
    return earnings
  }

  function claimEarnings(): OfflineEarnings | null {
    if (!pendingEarnings.value) return null

    const gameStore = useGameStore()

    if (pendingEarnings.value.money > 0) {
      gameStore.addMoney(pendingEarnings.value.money)
    }
    if (pendingEarnings.value.reputation > 0) {
      gameStore.addReputation(pendingEarnings.value.reputation)
    }
    if (pendingEarnings.value.sanity > 0) {
      gameStore.addSanity(pendingEarnings.value.sanity)
    }

    const logEntry: OfflineEarningsLog = {
      id: `offline_${Date.now()}`,
      claimedAt: Date.now(),
      offlineMinutes: pendingOfflineMinutes.value,
      earnings: { ...pendingEarnings.value },
    }

    logs.value.unshift(logEntry)
    if (logs.value.length > 50) {
      logs.value = logs.value.slice(0, 50)
    }

    const claimed = { ...pendingEarnings.value }
    pendingEarnings.value = null
    pendingOfflineMinutes.value = 0
    showClaimDialog.value = false
    lastOnlineTime.value = Date.now()

    saveToStorage()
    gameStore.saveGame()

    return claimed
  }

  function dismissEarnings() {
    pendingEarnings.value = null
    pendingOfflineMinutes.value = 0
    showClaimDialog.value = false
    lastOnlineTime.value = Date.now()
    saveToStorage()
  }

  function formatOfflineTime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}分钟`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (mins === 0) {
      return `${hours}小时`
    }
    return `${hours}小时${mins}分钟`
  }

  function saveToStorage() {
    try {
      const data: OfflineEarningsState = {
        lastOnlineTime: lastOnlineTime.value,
        logs: logs.value,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      console.error('离线收益数据保存失败')
    }
  }

  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const data: OfflineEarningsState = JSON.parse(raw)
      if (data.lastOnlineTime) {
        lastOnlineTime.value = data.lastOnlineTime
      }
      if (data.logs) {
        logs.value = data.logs
      }
    } catch {
      console.error('离线收益数据加载失败')
    }
  }

  function resetOffline() {
    lastOnlineTime.value = Date.now()
    pendingEarnings.value = null
    pendingOfflineMinutes.value = 0
    logs.value = []
    showClaimDialog.value = false
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    lastOnlineTime,
    pendingEarnings,
    pendingOfflineMinutes,
    logs,
    showClaimDialog,
    config,
    totalClaimedMoney,
    totalClaimedReputation,
    totalClaimedSanity,
    hasPendingEarnings,
    updateLastOnlineTime,
    checkOfflineEarnings,
    claimEarnings,
    dismissEarnings,
    formatOfflineTime,
    saveToStorage,
    loadFromStorage,
    resetOffline,
  }
})
