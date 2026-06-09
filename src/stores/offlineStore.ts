import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  OfflineEarnings,
  OfflineEarningsResult,
  OfflineEarningsLog,
  OfflineEarningsCapInfo,
  OfflineEarningsConfig,
  OfflineEarningsState,
} from '@/types/offline'
import { DEFAULT_OFFLINE_CONFIG, calculateOfflineEarnings } from '@/types/offline'
import { useGameStore } from './gameStore'

const STORAGE_KEY = 'offline_earnings_data'

const EMPTY_CAP_INFO: OfflineEarningsCapInfo = {
  moneyCapped: false,
  reputationCapped: false,
  sanityCapped: false,
  moneyCapValue: DEFAULT_OFFLINE_CONFIG.moneyCap,
  reputationCapValue: DEFAULT_OFFLINE_CONFIG.reputationCap,
  sanityCapValue: DEFAULT_OFFLINE_CONFIG.sanityCap,
}

export const useOfflineStore = defineStore('offline', () => {
  const lastOnlineTime = ref(Date.now())
  const pendingEarnings = ref<OfflineEarnings | null>(null)
  const pendingRawEarnings = ref<OfflineEarnings | null>(null)
  const pendingOfflineMinutes = ref(0)
  const pendingEffectiveMinutes = ref(0)
  const pendingCapInfo = ref<OfflineEarningsCapInfo>({ ...EMPTY_CAP_INFO })
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

  const isTimeCapped = computed(() => pendingOfflineMinutes.value > pendingEffectiveMinutes.value)

  const anyValueCapped = computed(() => {
    const ci = pendingCapInfo.value
    return ci.moneyCapped || ci.reputationCapped || ci.sanityCapped
  })

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
    const result: OfflineEarningsResult = calculateOfflineEarnings(
      offlineMinutes,
      config.value,
      gameStore.day,
      gameStore.stats.reputation
    )

    const hasAnyEarning = result.earnings.money > 0 || result.earnings.reputation > 0 || result.earnings.sanity > 0
    if (!hasAnyEarning) {
      return null
    }

    pendingEarnings.value = result.earnings
    pendingRawEarnings.value = result.rawEarnings
    pendingOfflineMinutes.value = offlineMinutes
    pendingEffectiveMinutes.value = result.effectiveMinutes
    pendingCapInfo.value = result.capInfo
    return result.earnings
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
      effectiveMinutes: pendingEffectiveMinutes.value,
      timeCapped: pendingOfflineMinutes.value > pendingEffectiveMinutes.value,
      capInfo: { ...pendingCapInfo.value },
      earnings: { ...pendingEarnings.value },
      rawEarnings: { ...(pendingRawEarnings.value || pendingEarnings.value) },
    }

    logs.value.unshift(logEntry)
    if (logs.value.length > 50) {
      logs.value = logs.value.slice(0, 50)
    }

    const claimed = { ...pendingEarnings.value }
    pendingEarnings.value = null
    pendingRawEarnings.value = null
    pendingOfflineMinutes.value = 0
    pendingEffectiveMinutes.value = 0
    pendingCapInfo.value = { ...EMPTY_CAP_INFO }
    showClaimDialog.value = false
    lastOnlineTime.value = Date.now()

    saveToStorage()
    gameStore.saveGame()

    return claimed
  }

  function dismissEarnings() {
    pendingEarnings.value = null
    pendingRawEarnings.value = null
    pendingOfflineMinutes.value = 0
    pendingEffectiveMinutes.value = 0
    pendingCapInfo.value = { ...EMPTY_CAP_INFO }
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
    pendingRawEarnings.value = null
    pendingOfflineMinutes.value = 0
    pendingEffectiveMinutes.value = 0
    pendingCapInfo.value = { ...EMPTY_CAP_INFO }
    logs.value = []
    showClaimDialog.value = false
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    lastOnlineTime,
    pendingEarnings,
    pendingRawEarnings,
    pendingOfflineMinutes,
    pendingEffectiveMinutes,
    pendingCapInfo,
    logs,
    showClaimDialog,
    config,
    totalClaimedMoney,
    totalClaimedReputation,
    totalClaimedSanity,
    hasPendingEarnings,
    isTimeCapped,
    anyValueCapped,
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
