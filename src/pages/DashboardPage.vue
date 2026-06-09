<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/gameStore'
import { useShopStore } from '@/stores/shopStore'
import { useActivityStore } from '@/stores/activityStore'
import { useDungeonStore } from '@/stores/dungeonStore'
import { useSeasonStore } from '@/stores/seasonStore'
import { useFriendStore } from '@/stores/friendStore'
import { useAchievementStore } from '@/stores/achievementStore'
import { useOrderStore } from '@/stores/orderStore'
import {
  ArrowLeft,
  Users,
  CheckCircle2,
  CreditCard,
  CalendarCheck,
  Gamepad2,
  TrendingUp,
  Activity,
  Sword,
  Clock,
  Star,
  Zap,
  BarChart3,
} from 'lucide-vue-next'

const router = useRouter()
const gameStore = useGameStore()
const shopStore = useShopStore()
const activityStore = useActivityStore()
const dungeonStore = useDungeonStore()
const seasonStore = useSeasonStore()
const friendStore = useFriendStore()
const achievementStore = useAchievementStore()
const orderStore = useOrderStore()

const selectedPeriod = ref<'7' | '14' | '30'>('7')

function toDateString(ts: number): string {
  return new Date(ts).toDateString()
}

function toDateKey(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const allTimestamps = computed(() => {
  const ts: number[] = []
  achievementStore.behaviorEvents.forEach(e => ts.push(e.timestamp))
  dungeonStore.battleHistory.forEach(b => ts.push(b.completedAt))
  shopStore.completedOrders.forEach(o => ts.push(o.createdAt))
  activityStore.events.forEach(e => ts.push(e.timestamp))
  return ts.sort((a, b) => a - b)
})

const activeDateSet = computed(() => {
  const dates = new Set<string>()
  achievementStore.behaviorEvents.forEach(e => dates.add(toDateKey(e.timestamp)))
  dungeonStore.battleHistory.forEach(b => dates.add(toDateKey(b.completedAt)))
  shopStore.completedOrders.forEach(o => dates.add(toDateKey(o.createdAt)))
  activityStore.events.forEach(e => dates.add(toDateKey(e.timestamp)))
  return dates
})

const firstEventTime = computed(() => {
  if (allTimestamps.value.length === 0) return Date.now()
  return allTimestamps.value[0]
})

const totalCalendarDays = computed(() => {
  return Math.max(1, Math.ceil((Date.now() - firstEventTime.value) / (24 * 60 * 60 * 1000)) + 1)
})

const userActivityMetrics = computed(() => {
  const friendCount = friendStore.friends.length
  const totalOrdersCompleted = gameStore.stats.totalOrdersCompleted
  const totalRelicsProcessed = gameStore.stats.totalRelicsProcessed
  const day = gameStore.day
  const avgOrdersPerDay = day > 0 ? (totalOrdersCompleted / day).toFixed(1) : '0'
  const reputation = gameStore.stats.reputation
  const sanityPercent = Math.round((gameStore.stats.sanity / gameStore.stats.maxSanity) * 100)

  const behaviorEvents = achievementStore.behaviorEvents
  const totalActions = behaviorEvents.length
  const activeDays = activeDateSet.value.size
  const engagementRate = Math.round((activeDays / totalCalendarDays.value) * 100)
  const avgActionsPerActiveDay = activeDays > 0 ? (totalActions / activeDays).toFixed(1) : '0'

  const loginEvents = behaviorEvents.filter(e => e.eventType === 'login')
  const totalLoginDays = loginEvents.length > 0
    ? new Set(loginEvents.map(e => toDateKey(e.timestamp))).size
    : achievementStore.totalLoginDays

  const consecutiveLogins = achievementStore.consecutiveLoginDays

  const orderEvents = behaviorEvents.filter(e => e.eventType === 'order_completed')
  const orderDates = new Set(orderEvents.map(e => toDateKey(e.timestamp)))
  const orderActiveDays = orderDates.size

  return {
    day,
    friendCount,
    totalOrdersCompleted,
    totalRelicsProcessed,
    avgOrdersPerDay,
    reputation,
    sanityPercent,
    activeDays,
    totalCalendarDays: totalCalendarDays.value,
    engagementRate,
    totalActions,
    avgActionsPerActiveDay,
    totalLoginDays,
    consecutiveLogins,
    orderActiveDays,
  }
})

const taskCompletionMetrics = computed(() => {
  const totalOrdersCompleted = gameStore.stats.totalOrdersCompleted
  const pendingCount = orderStore.pendingOrdersList.length
  const acceptedCount = orderStore.acceptedOrdersList.length
  const totalAvailable = totalOrdersCompleted + pendingCount + acceptedCount
  const completionRate = totalAvailable > 0 ? Math.round((totalOrdersCompleted / totalAvailable) * 100) : 0

  const seasonTasks = seasonStore.tasks
  const completedTasks = seasonTasks.filter(t => {
    const progress = seasonStore.taskProgressMap.get(t.id)
    return progress && progress.completed
  }).length
  const totalTasks = seasonTasks.length
  const seasonCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const achievementStats = achievementStore.statistics
  const unlockedAchievements = achievementStats?.totalUnlocked || 0
  const totalAchievements = achievementStats?.totalCount || 1
  const achievementRate = Math.round((unlockedAchievements / totalAchievements) * 100)

  return {
    totalOrdersCompleted,
    completionRate,
    seasonCompletionRate,
    completedTasks,
    totalTasks,
    achievementRate,
    unlockedAchievements,
    totalAchievements,
  }
})

const paymentConversionMetrics = computed(() => {
  const orders = shopStore.completedOrders
  const totalPurchases = orders.length
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalPrice.money, 0)
  const avgOrderValue = totalPurchases > 0 ? Math.round(totalRevenue / totalPurchases) : 0

  const inventoryCount = shopStore.inventory.reduce((sum, i) => sum + i.quantity, 0)
  const activeDiscounts = shopStore.activeDiscounts.length

  const itemsOnSale = shopStore.items.filter(item => {
    return shopStore.activeDiscounts.some(d =>
      (d.itemIds.length > 0 && d.itemIds.includes(item.id)) ||
      (d.category && d.category === item.category)
    )
  }).length

  const uniqueSkusPurchased = Object.keys(shopStore.purchaseHistory).length
  const totalSkus = shopStore.items.length

  const day = gameStore.day
  const avgDailySpend = day > 0 ? Math.round(totalRevenue / day) : 0

  const discountedPurchases = orders.filter(o => o.discountApplied > 0).length
  const discountUtilization = totalPurchases > 0 ? Math.round((discountedPurchases / totalPurchases) * 100) : 0

  const shopBehaviorEvents = achievementStore.behaviorEvents.filter(e => e.eventType === 'shop_purchase')
  const purchaseDates = new Set(shopBehaviorEvents.map(e => toDateKey(e.timestamp)))
  const purchaseActiveDays = purchaseDates.size

  const totalUsers = 1
  const activeUsers = activeDateSet.value.size > 0 ? 1 : 0
  const loginUsers = achievementStore.totalLoginDays > 0 ? 1 : 0
  const payingUsers = totalPurchases > 0 ? 1 : 0

  const payRateByActive = activeUsers > 0 ? Math.round((payingUsers / activeUsers) * 100) : 0
  const payRateByLogin = loginUsers > 0 ? Math.round((payingUsers / loginUsers) * 100) : 0

  const avgPurchasesPerPayingUser = payingUsers > 0 ? totalPurchases : 0
  const avgRevenuePerPayingUser = payingUsers > 0 ? totalRevenue : 0

  const isSingleUser = true

  return {
    totalPurchases,
    totalRevenue,
    avgOrderValue,
    inventoryCount,
    activeDiscounts,
    itemsOnSale,
    payRateByActive,
    payRateByLogin,
    discountUtilization,
    avgDailySpend,
    uniqueSkusPurchased,
    totalSkus,
    purchaseActiveDays,
    totalUsers,
    activeUsers,
    loginUsers,
    payingUsers,
    avgPurchasesPerPayingUser,
    avgRevenuePerPayingUser,
    isSingleUser,
    currentMoney: gameStore.stats.money,
  }
})

const activityParticipationMetrics = computed(() => {
  const activities = activityStore.activities
  const activeActivities = activityStore.activeActivities.length
  const totalActivities = activities.length
  const endedActivities = activityStore.endedActivities.length

  const totalEvents = activityStore.events.length
  const totalExposures = activityStore.events.filter(e => e.eventType === 'exposure').length
  const totalClicks = activityStore.events.filter(e => e.eventType === 'click').length
  const totalClaims = activityStore.events.filter(e => e.eventType === 'claim').length
  const totalCompletions = activityStore.events.filter(e => e.eventType === 'complete').length

  const clickRate = totalExposures > 0 ? Math.round((totalClicks / totalExposures) * 1000) / 10 : 0
  const claimRate = totalClicks > 0 ? Math.round((totalClaims / totalClicks) * 1000) / 10 : 0
  const completionRate = totalExposures > 0 ? Math.round((totalCompletions / totalExposures) * 1000) / 10 : 0

  const uniquePlayers = new Set(activityStore.events.map(e => e.playerId)).size

  return {
    activeActivities,
    totalActivities,
    endedActivities,
    totalEvents,
    clickRate,
    claimRate,
    completionRate,
    uniquePlayers,
    totalExposures,
    totalClicks,
    totalClaims,
  }
})

const retentionMetrics = computed(() => {
  const day = gameStore.day
  const behaviorEvents = achievementStore.behaviorEvents
  const battleHistory = dungeonStore.battleHistory

  const eventDateKeys = new Set<string>()
  behaviorEvents.forEach(e => eventDateKeys.add(toDateKey(e.timestamp)))
  battleHistory.forEach(b => eventDateKeys.add(toDateKey(b.completedAt)))
  shopStore.completedOrders.forEach(o => eventDateKeys.add(toDateKey(o.createdAt)))

  const sortedDates = Array.from(eventDateKeys).sort()
  const firstDate = sortedDates[0]

  let day1Retention = 0
  let day7Retention = 0
  let day30Retention = 0

  if (firstDate && eventDateKeys.size > 0) {
    const first = new Date(firstDate)

    const checkTarget = (offset: number): boolean => {
      const target = new Date(first)
      target.setDate(target.getDate() + offset)
      return eventDateKeys.has(toDateKey(target.getTime()))
    }

    day1Retention = checkTarget(1) ? 100 : 0
    day7Retention = checkTarget(7) ? 100 : 0
    day30Retention = checkTarget(30) ? 100 : 0

    const lastDate = sortedDates[sortedDates.length - 1]
    const last = new Date(lastDate)
    const spanDays = Math.max(1, Math.round((last.getTime() - first.getTime()) / (24 * 60 * 60 * 1000)))

    if (spanDays < 1) {
      day1Retention = 0
    }
    if (spanDays < 7) {
      day7Retention = 0
    }
    if (spanDays < 30) {
      day30Retention = 0
    }
  }

  const totalClears = dungeonStore.totalClearCount
  const totalDungeonsCleared = dungeonStore.totalDungeonsCleared
  const totalStars = dungeonStore.totalStarsEarned
  const maxStars = dungeonStore.maxStarsPossible
  const starRate = maxStars > 0 ? Math.round((totalStars / maxStars) * 100) : 0

  const victories = battleHistory.filter(b => b.result === 'victory').length
  const defeats = battleHistory.filter(b => b.result === 'defeat').length
  const winRate = battleHistory.length > 0 ? Math.round((victories / battleHistory.length) * 100) : 0

  const avgBattleDuration = battleHistory.length > 0
    ? Math.round(battleHistory.reduce((sum, b) => sum + b.duration, 0) / battleHistory.length / 1000)
    : 0
  const avgBattlesPerDay = day > 0 ? (battleHistory.length / day).toFixed(1) : '0'

  const dungeonProgresses = dungeonStore.dungeonProgresses
  const unlockedDungeons = dungeonProgresses.filter(dp => dp.status !== 'locked').length
  const totalDungeons = dungeonProgresses.length || 1

  const dayPassedEvents = behaviorEvents.filter(e => e.eventType === 'day_passed')
  const gameDaysPlayed = dayPassedEvents.length
  const engagementContinuity = day > 0 ? Math.round((gameDaysPlayed / day) * 100) : 0

  return {
    day,
    totalClears,
    totalDungeonsCleared,
    starRate,
    winRate,
    victories,
    defeats,
    totalBattles: battleHistory.length,
    day1Retention,
    day7Retention,
    day30Retention,
    avgBattleDuration,
    avgBattlesPerDay,
    dungeonExploreRate: Math.round((unlockedDungeons / totalDungeons) * 100),
    engagementContinuity,
    gameDaysPlayed,
    activeCalendarDays: eventDateKeys.size,
  }
})

const dailyTrendData = computed(() => {
  const days = parseInt(selectedPeriod.value)
  const now = Date.now()
  const startTime = now - days * 24 * 60 * 60 * 1000

  const behaviorEvents = achievementStore.behaviorEvents.filter(e => e.timestamp >= startTime)
  const battleEvents = dungeonStore.battleHistory.filter(b => b.completedAt >= startTime)
  const shopOrders = shopStore.completedOrders.filter(o => o.createdAt >= startTime)
  const actEvents = activityStore.events.filter(e => e.timestamp >= startTime)

  const dailyMap = new Map<string, { actions: number; orders: number; revenue: number }>()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const key = toDateKey(date.getTime())
    const label = `${date.getMonth() + 1}/${date.getDate()}`
    dailyMap.set(key, { actions: 0, orders: 0, revenue: 0 })
  }

  behaviorEvents.forEach(e => {
    const key = toDateKey(e.timestamp)
    const entry = dailyMap.get(key)
    if (entry) entry.actions++
  })

  battleEvents.forEach(b => {
    const key = toDateKey(b.completedAt)
    const entry = dailyMap.get(key)
    if (entry) entry.actions += 1
  })

  actEvents.forEach(e => {
    const key = toDateKey(e.timestamp)
    const entry = dailyMap.get(key)
    if (entry) entry.actions += 1
  })

  const orderEvents = behaviorEvents.filter(e => e.eventType === 'order_completed')
  orderEvents.forEach(e => {
    const key = toDateKey(e.timestamp)
    const entry = dailyMap.get(key)
    if (entry) entry.orders++
  })

  shopOrders.forEach(o => {
    const key = toDateKey(o.createdAt)
    const entry = dailyMap.get(key)
    if (entry) entry.revenue += o.totalPrice.money
  })

  const data: { label: string; activity: number; orders: number; revenue: number }[] = []
  const sortedKeys = Array.from(dailyMap.keys()).sort()
  sortedKeys.forEach(key => {
    const date = new Date(key)
    const label = `${date.getMonth() + 1}/${date.getDate()}`
    const entry = dailyMap.get(key)!
    data.push({
      label,
      activity: entry.actions,
      orders: entry.orders,
      revenue: entry.revenue,
    })
  })

  return data
})

const maxTrendActivity = computed(() => Math.max(...dailyTrendData.value.map(d => d.activity), 1))
const maxTrendOrders = computed(() => Math.max(...dailyTrendData.value.map(d => d.orders), 1))
const maxTrendRevenue = computed(() => Math.max(...dailyTrendData.value.map(d => d.revenue), 1))

function calculatePoints(dataKey: 'activity' | 'orders' | 'revenue', maxVal: number) {
  const data = dailyTrendData.value
  const width = 860
  const height = 200
  const paddingTop = 20
  const paddingLeft = 50

  return data.map((d, i) => ({
    x: paddingLeft + (i / (data.length - 1 || 1)) * (width - paddingLeft),
    y: paddingTop + height - (d[dataKey] / maxVal) * height,
  }))
}

function createLinePath(points: { x: number; y: number }[]) {
  if (points.length === 0) return ''
  return points.reduce((path, point, i) => {
    return path + (i === 0 ? `M ${point.x} ${point.y}` : ` L ${point.x} ${point.y}`)
  }, '')
}

function createAreaPath(points: { x: number; y: number }[], baseY: number) {
  if (points.length === 0) return ''
  const linePath = createLinePath(points)
  const lastPoint = points[points.length - 1]
  const firstPoint = points[0]
  return `${linePath} L ${lastPoint.x} ${baseY} L ${firstPoint.x} ${baseY} Z`
}

const activityPoints = computed(() => calculatePoints('activity', maxTrendActivity.value))
const orderPoints = computed(() => calculatePoints('orders', maxTrendOrders.value))
const revenuePoints = computed(() => calculatePoints('revenue', maxTrendRevenue.value))

const activityLinePath = computed(() => createLinePath(activityPoints.value))
const activityAreaPath = computed(() => createAreaPath(activityPoints.value, 220))
const orderLinePath = computed(() => createLinePath(orderPoints.value))
const orderAreaPath = computed(() => createAreaPath(orderPoints.value, 220))
const revenueLinePath = computed(() => createLinePath(revenuePoints.value))
const revenueAreaPath = computed(() => createAreaPath(revenuePoints.value, 220))

const trendXLabels = computed(() => {
  const data = dailyTrendData.value
  const labels: { x: number; text: string }[] = []
  const step = Math.max(1, Math.ceil(data.length / 8))
  for (let i = 0; i < data.length; i += step) {
    labels.push({
      x: 50 + (i / (data.length - 1 || 1)) * 810,
      text: data[i].label,
    })
  }
  return labels
})

const recentActivities = computed(() => {
  return activityStore.activities.slice(0, 5).map(a => ({
    id: a.id,
    name: a.config.name,
    status: a.status,
    statusLabel: statusLabels[a.status] || a.status,
    updatedAt: a.updatedAt,
  }))
})

const recentBattles = computed(() => {
  return dungeonStore.getRecentBattles(5).map(b => ({
    id: b.id,
    dungeonId: b.dungeonId,
    stageId: b.stageId,
    result: b.result,
    resultLabel: battleResultLabels[b.result] || b.result,
    starRating: b.starRating,
    turnsElapsed: b.turnsElapsed,
    completedAt: b.completedAt,
  }))
})

const statusLabels: Record<string, string> = {
  draft: '草稿',
  pending: '待审核',
  active: '进行中',
  paused: '已暂停',
  ended: '已结束',
  cancelled: '已取消',
}

const battleResultLabels: Record<string, string> = {
  victory: '胜利',
  defeat: '失败',
  retreat: '撤退',
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}秒`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}分${s}秒`
}

function goBack() {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 p-6">
    <div class="max-w-7xl mx-auto space-y-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button
            @click="goBack"
            class="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft class="w-5 h-5" />
          </button>
          <div>
            <h1 class="text-2xl font-bold text-white flex items-center gap-3">
              <BarChart3 class="w-7 h-7 text-cyan-400" />
              数据统计驾驶舱
            </h1>
            <p class="text-sm text-gray-400 mt-1">核心运营指标全景监控</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <select
            v-model="selectedPeriod"
            class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="7">最近7天</option>
            <option value="14">最近14天</option>
            <option value="30">最近30天</option>
          </select>
          <div class="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 flex items-center gap-2">
            <Clock class="w-4 h-4 text-gray-400" />
            第 {{ userActivityMetrics.day }} 天
          </div>
        </div>
      </div>

      <div class="grid grid-cols-5 gap-4">
        <div class="bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-cyan-500/20 hover:border-cyan-500/40 transition-all">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-gray-400">活跃率</span>
            <div class="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center">
              <Activity class="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div class="text-2xl font-bold text-cyan-400">{{ userActivityMetrics.engagementRate }}%</div>
          <div class="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 rounded-full transition-all" :style="{ width: `${userActivityMetrics.engagementRate}%` }"></div>
          </div>
        </div>

        <div class="bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-green-500/20 hover:border-green-500/40 transition-all">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-gray-400">任务完成率</span>
            <div class="w-8 h-8 rounded-lg bg-green-500/15 flex items-center justify-center">
              <CheckCircle2 class="w-4 h-4 text-green-400" />
            </div>
          </div>
          <div class="text-2xl font-bold text-green-400">{{ taskCompletionMetrics.completionRate }}%</div>
          <div class="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-green-500 to-green-300 rounded-full transition-all" :style="{ width: `${taskCompletionMetrics.completionRate}%` }"></div>
          </div>
        </div>

        <div class="bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-amber-500/20 hover:border-amber-500/40 transition-all">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-gray-400">付费转化率</span>
            <div class="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <CreditCard class="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div class="text-2xl font-bold text-amber-400">{{ paymentConversionMetrics.payRateByActive }}%</div>
          <div class="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all" :style="{ width: `${paymentConversionMetrics.payRateByActive}%` }"></div>
          </div>
        </div>

        <div class="bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-purple-500/20 hover:border-purple-500/40 transition-all">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-gray-400">活动参与率</span>
            <div class="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
              <CalendarCheck class="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div class="text-2xl font-bold text-purple-400">{{ activityParticipationMetrics.clickRate }}%</div>
          <div class="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-purple-500 to-purple-300 rounded-full transition-all" :style="{ width: `${Math.min(activityParticipationMetrics.clickRate, 100)}%` }"></div>
          </div>
        </div>

        <div class="bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-rose-500/20 hover:border-rose-500/40 transition-all">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-gray-400">连续活跃率</span>
            <div class="w-8 h-8 rounded-lg bg-rose-500/15 flex items-center justify-center">
              <Gamepad2 class="w-4 h-4 text-rose-400" />
            </div>
          </div>
          <div class="text-2xl font-bold text-rose-400">{{ retentionMetrics.engagementContinuity }}%</div>
          <div class="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-rose-500 to-rose-300 rounded-full transition-all" :style="{ width: `${retentionMetrics.engagementContinuity}%` }"></div>
          </div>
        </div>
      </div>

      <div class="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <TrendingUp class="w-4 h-4 text-cyan-400" />
            核心指标趋势
          </h3>
          <div class="flex items-center gap-4 text-xs">
            <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-cyan-400 inline-block"></span> 活跃度</span>
            <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-green-400 inline-block"></span> 订单量</span>
            <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-amber-400 inline-block"></span> 收入</span>
          </div>
        </div>
        <div class="h-64">
          <svg width="100%" height="100%" viewBox="0 0 920 240" preserveAspectRatio="none">
            <defs>
              <linearGradient id="trendActivityGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#22d3ee" stop-opacity="0.3" />
                <stop offset="100%" stop-color="#22d3ee" stop-opacity="0" />
              </linearGradient>
              <linearGradient id="trendOrderGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#4ade80" stop-opacity="0.3" />
                <stop offset="100%" stop-color="#4ade80" stop-opacity="0" />
              </linearGradient>
              <linearGradient id="trendRevenueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#fbbf24" stop-opacity="0.3" />
                <stop offset="100%" stop-color="#fbbf24" stop-opacity="0" />
              </linearGradient>
            </defs>
            <g stroke="#374151" stroke-width="1" stroke-dasharray="3,3">
              <line x1="50" y1="20" x2="910" y2="20" />
              <line x1="50" y1="70" x2="910" y2="70" />
              <line x1="50" y1="120" x2="910" y2="120" />
              <line x1="50" y1="170" x2="910" y2="170" />
              <line x1="50" y1="220" x2="910" y2="220" />
            </g>
            <path :d="revenueAreaPath" fill="url(#trendRevenueGrad)" />
            <path :d="revenueLinePath" fill="none" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <path :d="orderAreaPath" fill="url(#trendOrderGrad)" />
            <path :d="orderLinePath" fill="none" stroke="#4ade80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <path :d="activityAreaPath" fill="url(#trendActivityGrad)" />
            <path :d="activityLinePath" fill="none" stroke="#22d3ee" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <g font-size="10" fill="#6b7280">
              <text v-for="(label, i) in trendXLabels" :key="i" :x="label.x" y="238" text-anchor="middle">
                {{ label.text }}
              </text>
            </g>
          </svg>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-6">
        <div class="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div class="flex items-center gap-2 mb-5">
            <div class="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center">
              <Users class="w-4 h-4 text-cyan-400" />
            </div>
            <h3 class="text-sm font-semibold text-gray-300">用户活跃</h3>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-gray-900/60 rounded-lg p-4">
              <p class="text-xs text-gray-500 mb-1">好友数量</p>
              <p class="text-xl font-bold text-white">{{ userActivityMetrics.friendCount }}</p>
            </div>
            <div class="bg-gray-900/60 rounded-lg p-4">
              <p class="text-xs text-gray-500 mb-1">日均订单</p>
              <p class="text-xl font-bold text-cyan-400">{{ userActivityMetrics.avgOrdersPerDay }}</p>
            </div>
            <div class="bg-gray-900/60 rounded-lg p-4">
              <p class="text-xs text-gray-500 mb-1">总行为数</p>
              <p class="text-xl font-bold text-blue-400">{{ userActivityMetrics.totalActions }}</p>
            </div>
            <div class="bg-gray-900/60 rounded-lg p-4">
              <p class="text-xs text-gray-500 mb-1">理智状态</p>
              <p class="text-xl font-bold" :class="userActivityMetrics.sanityPercent > 60 ? 'text-green-400' : userActivityMetrics.sanityPercent > 30 ? 'text-yellow-400' : 'text-red-400'">{{ userActivityMetrics.sanityPercent }}%</p>
            </div>
          </div>
          <div class="mt-4 space-y-3">
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-400">活跃天数</span>
              <span class="text-cyan-400 font-medium">{{ userActivityMetrics.activeDays }} / {{ userActivityMetrics.totalCalendarDays }}</span>
            </div>
            <div class="h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div class="h-full bg-cyan-500 rounded-full" :style="{ width: `${userActivityMetrics.engagementRate}%` }"></div>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-400">登录天数</span>
              <span class="text-cyan-400 font-medium">{{ userActivityMetrics.totalLoginDays }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-400">连续登录</span>
              <span class="text-green-400 font-medium">{{ userActivityMetrics.consecutiveLogins }} 天</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-400">活跃日均价行为</span>
              <span class="text-cyan-400 font-medium">{{ userActivityMetrics.avgActionsPerActiveDay }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-400">下单活跃天数</span>
              <span class="text-purple-400 font-medium">{{ userActivityMetrics.orderActiveDays }}</span>
            </div>
          </div>
        </div>

        <div class="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div class="flex items-center gap-2 mb-5">
            <div class="w-8 h-8 rounded-lg bg-green-500/15 flex items-center justify-center">
              <CheckCircle2 class="w-4 h-4 text-green-400" />
            </div>
            <h3 class="text-sm font-semibold text-gray-300">任务完成</h3>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-gray-900/60 rounded-lg p-4">
              <p class="text-xs text-gray-500 mb-1">订单完成数</p>
              <p class="text-xl font-bold text-green-400">{{ taskCompletionMetrics.totalOrdersCompleted }}</p>
            </div>
            <div class="bg-gray-900/60 rounded-lg p-4">
              <p class="text-xs text-gray-500 mb-1">订单完成率</p>
              <p class="text-xl font-bold text-green-400">{{ taskCompletionMetrics.completionRate }}%</p>
            </div>
            <div class="bg-gray-900/60 rounded-lg p-4">
              <p class="text-xs text-gray-500 mb-1">赛季任务</p>
              <p class="text-xl font-bold text-blue-400">{{ taskCompletionMetrics.completedTasks }}/{{ taskCompletionMetrics.totalTasks }}</p>
            </div>
            <div class="bg-gray-900/60 rounded-lg p-4">
              <p class="text-xs text-gray-500 mb-1">成就解锁</p>
              <p class="text-xl font-bold text-amber-400">{{ taskCompletionMetrics.unlockedAchievements }}/{{ taskCompletionMetrics.totalAchievements }}</p>
            </div>
          </div>
          <div class="mt-4 space-y-3">
            <div>
              <div class="flex items-center justify-between text-sm mb-1">
                <span class="text-gray-400">赛季任务完成率</span>
                <span class="text-blue-400 font-medium">{{ taskCompletionMetrics.seasonCompletionRate }}%</span>
              </div>
              <div class="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-blue-500 to-blue-300 rounded-full" :style="{ width: `${taskCompletionMetrics.seasonCompletionRate}%` }"></div>
              </div>
            </div>
            <div>
              <div class="flex items-center justify-between text-sm mb-1">
                <span class="text-gray-400">成就达成率</span>
                <span class="text-amber-400 font-medium">{{ taskCompletionMetrics.achievementRate }}%</span>
              </div>
              <div class="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full" :style="{ width: `${taskCompletionMetrics.achievementRate}%` }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-6">
        <div class="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div class="flex items-center gap-2 mb-5">
            <div class="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <CreditCard class="w-4 h-4 text-amber-400" />
            </div>
            <h3 class="text-sm font-semibold text-gray-300">付费转化</h3>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div class="bg-gray-900/60 rounded-lg p-3 text-center">
              <p class="text-xs text-gray-500 mb-1">总购买次数</p>
              <p class="text-lg font-bold text-amber-400">{{ paymentConversionMetrics.totalPurchases }}</p>
            </div>
            <div class="bg-gray-900/60 rounded-lg p-3 text-center">
              <p class="text-xs text-gray-500 mb-1">总收入</p>
              <p class="text-lg font-bold text-amber-400">{{ paymentConversionMetrics.totalRevenue }}</p>
            </div>
            <div class="bg-gray-900/60 rounded-lg p-3 text-center">
              <p class="text-xs text-gray-500 mb-1">客单价</p>
              <p class="text-lg font-bold text-amber-400">{{ paymentConversionMetrics.avgOrderValue }}</p>
            </div>
          </div>
          <div class="mt-4 space-y-3">
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-400">当前金币</span>
              <span class="text-yellow-400 font-medium">{{ paymentConversionMetrics.currentMoney }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-400">库存物品</span>
              <span class="text-white font-medium">{{ paymentConversionMetrics.inventoryCount }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-400">活跃折扣</span>
              <span class="text-green-400 font-medium">{{ paymentConversionMetrics.activeDiscounts }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-400">折扣商品</span>
              <span class="text-purple-400 font-medium">{{ paymentConversionMetrics.itemsOnSale }}</span>
            </div>
            <div class="mt-2 pt-3 border-t border-gray-700">
              <div class="flex items-center justify-between text-sm mb-1">
                <span class="text-gray-400">付费转化率 (活跃)</span>
                <span class="text-amber-400 font-medium">{{ paymentConversionMetrics.payRateByActive }}%</span>
              </div>
              <div class="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full" :style="{ width: `${paymentConversionMetrics.payRateByActive}%` }"></div>
              </div>
              <p class="text-xs text-gray-500 mt-1">付费人数 {{ paymentConversionMetrics.payingUsers }} / 活跃人数 {{ paymentConversionMetrics.activeUsers }}</p>
            </div>
            <div class="mt-2">
              <div class="flex items-center justify-between text-sm mb-1">
                <span class="text-gray-400">付费转化率 (登录)</span>
                <span class="text-amber-400 font-medium">{{ paymentConversionMetrics.payRateByLogin }}%</span>
              </div>
              <div class="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-amber-500/70 to-amber-300/70 rounded-full" :style="{ width: `${paymentConversionMetrics.payRateByLogin}%` }"></div>
              </div>
              <p class="text-xs text-gray-500 mt-1">付费人数 {{ paymentConversionMetrics.payingUsers }} / 登录人数 {{ paymentConversionMetrics.loginUsers }}</p>
            </div>
            <div v-if="paymentConversionMetrics.isSingleUser" class="mt-2 px-3 py-2 bg-gray-700/40 rounded-lg">
              <p class="text-xs text-gray-400">单用户存档：转化率 = 该用户是否曾付费</p>
              <p class="text-xs mt-1" :class="paymentConversionMetrics.payingUsers > 0 ? 'text-green-400' : 'text-gray-500'">
                {{ paymentConversionMetrics.payingUsers > 0 ? '已付费用户' : '未付费用户' }}
              </p>
            </div>
            <div class="flex items-center justify-between text-sm mt-2">
              <span class="text-gray-400">总用户数</span>
              <span class="text-white font-medium">{{ paymentConversionMetrics.totalUsers }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-400">付费用户人均购买</span>
              <span class="text-cyan-400 font-medium">{{ paymentConversionMetrics.avgPurchasesPerPayingUser }} 次</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-400">付费用户人均消费</span>
              <span class="text-amber-400 font-medium">{{ paymentConversionMetrics.avgRevenuePerPayingUser }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-400">日均消费</span>
              <span class="text-amber-400 font-medium">{{ paymentConversionMetrics.avgDailySpend }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-400">折扣利用率</span>
              <span class="text-green-400 font-medium">{{ paymentConversionMetrics.discountUtilization }}%</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-400">已购SKU</span>
              <span class="text-cyan-400 font-medium">{{ paymentConversionMetrics.uniqueSkusPurchased }} / {{ paymentConversionMetrics.totalSkus }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-400">购买覆盖天数</span>
              <span class="text-purple-400 font-medium">{{ paymentConversionMetrics.purchaseActiveDays }}</span>
            </div>
          </div>
        </div>

        <div class="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div class="flex items-center gap-2 mb-5">
            <div class="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
              <CalendarCheck class="w-4 h-4 text-purple-400" />
            </div>
            <h3 class="text-sm font-semibold text-gray-300">活动参与</h3>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div class="bg-gray-900/60 rounded-lg p-3 text-center">
              <p class="text-xs text-gray-500 mb-1">进行中</p>
              <p class="text-lg font-bold text-green-400">{{ activityParticipationMetrics.activeActivities }}</p>
            </div>
            <div class="bg-gray-900/60 rounded-lg p-3 text-center">
              <p class="text-xs text-gray-500 mb-1">总活动数</p>
              <p class="text-lg font-bold text-white">{{ activityParticipationMetrics.totalActivities }}</p>
            </div>
            <div class="bg-gray-900/60 rounded-lg p-3 text-center">
              <p class="text-xs text-gray-500 mb-1">独立玩家</p>
              <p class="text-lg font-bold text-cyan-400">{{ activityParticipationMetrics.uniquePlayers }}</p>
            </div>
          </div>
          <div class="mt-4 space-y-3">
            <div>
              <div class="flex items-center justify-between text-sm mb-1">
                <span class="text-gray-400">点击率 (CTR)</span>
                <span class="text-purple-400 font-medium">{{ activityParticipationMetrics.clickRate }}%</span>
              </div>
              <div class="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-purple-500 to-purple-300 rounded-full" :style="{ width: `${Math.min(activityParticipationMetrics.clickRate * 2, 100)}%` }"></div>
              </div>
            </div>
            <div>
              <div class="flex items-center justify-between text-sm mb-1">
                <span class="text-gray-400">领取转化率</span>
                <span class="text-yellow-400 font-medium">{{ activityParticipationMetrics.claimRate }}%</span>
              </div>
              <div class="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-full" :style="{ width: `${Math.min(activityParticipationMetrics.claimRate * 2, 100)}%` }"></div>
              </div>
            </div>
            <div>
              <div class="flex items-center justify-between text-sm mb-1">
                <span class="text-gray-400">活动完成率</span>
                <span class="text-green-400 font-medium">{{ activityParticipationMetrics.completionRate }}%</span>
              </div>
              <div class="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-green-500 to-green-300 rounded-full" :style="{ width: `${Math.min(activityParticipationMetrics.completionRate * 2, 100)}%` }"></div>
              </div>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-400">总事件数</span>
              <span class="text-white font-medium">{{ activityParticipationMetrics.totalEvents }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <div class="flex items-center gap-2 mb-5">
          <div class="w-8 h-8 rounded-lg bg-rose-500/15 flex items-center justify-center">
            <Gamepad2 class="w-4 h-4 text-rose-400" />
          </div>
          <h3 class="text-sm font-semibold text-gray-300">核心玩法留存</h3>
        </div>
        <div class="grid grid-cols-4 gap-4 mb-5">
          <div class="bg-gray-900/60 rounded-lg p-4 text-center">
            <p class="text-xs text-gray-500 mb-1">副本通关</p>
            <p class="text-xl font-bold text-rose-400">{{ retentionMetrics.totalDungeonsCleared }}</p>
          </div>
          <div class="bg-gray-900/60 rounded-lg p-4 text-center">
            <p class="text-xs text-gray-500 mb-1">战斗胜率</p>
            <p class="text-xl font-bold text-green-400">{{ retentionMetrics.winRate }}%</p>
          </div>
          <div class="bg-gray-900/60 rounded-lg p-4 text-center">
            <p class="text-xs text-gray-500 mb-1">星级达成</p>
            <p class="text-xl font-bold text-amber-400">{{ retentionMetrics.starRate }}%</p>
          </div>
          <div class="bg-gray-900/60 rounded-lg p-4 text-center">
            <p class="text-xs text-gray-500 mb-1">副本探索</p>
            <p class="text-xl font-bold text-cyan-400">{{ retentionMetrics.dungeonExploreRate }}%</p>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-6">
          <div class="space-y-3">
            <h4 class="text-xs text-gray-500 uppercase tracking-wider">留存指标</h4>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-400 flex items-center gap-2">
                <Zap class="w-3 h-3 text-green-400" />
                次日留存
              </span>
              <div class="flex items-center gap-2">
                <div class="w-24 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div class="h-full bg-green-500 rounded-full" :style="{ width: `${retentionMetrics.day1Retention}%` }"></div>
                </div>
                <span class="text-green-400 font-medium w-12 text-right">{{ retentionMetrics.day1Retention }}%</span>
              </div>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-400 flex items-center gap-2">
                <Zap class="w-3 h-3 text-blue-400" />
                7日留存
              </span>
              <div class="flex items-center gap-2">
                <div class="w-24 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div class="h-full bg-blue-500 rounded-full" :style="{ width: `${retentionMetrics.day7Retention}%` }"></div>
                </div>
                <span class="text-blue-400 font-medium w-12 text-right">{{ retentionMetrics.day7Retention }}%</span>
              </div>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-400 flex items-center gap-2">
                <Zap class="w-3 h-3 text-purple-400" />
                30日留存
              </span>
              <div class="flex items-center gap-2">
                <div class="w-24 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div class="h-full bg-purple-500 rounded-full" :style="{ width: `${retentionMetrics.day30Retention}%` }"></div>
                </div>
                <span class="text-purple-400 font-medium w-12 text-right">{{ retentionMetrics.day30Retention }}%</span>
              </div>
            </div>
            <div class="mt-2 pt-2 border-t border-gray-700/50">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-400">游戏天数活跃</span>
                <span class="text-cyan-400 font-medium">{{ retentionMetrics.gameDaysPlayed }} / {{ retentionMetrics.day }}</span>
              </div>
              <div class="flex items-center justify-between text-sm mt-1">
                <span class="text-gray-400">日历活跃天数</span>
                <span class="text-cyan-400 font-medium">{{ retentionMetrics.activeCalendarDays }}</span>
              </div>
            </div>
          </div>
          <div class="space-y-3">
            <h4 class="text-xs text-gray-500 uppercase tracking-wider">战斗数据</h4>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-400">总战斗场次</span>
              <span class="text-white font-medium">{{ retentionMetrics.totalBattles }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-400">胜利 / 失败</span>
              <span class="font-medium">
                <span class="text-green-400">{{ retentionMetrics.victories }}</span>
                <span class="text-gray-600 mx-1">/</span>
                <span class="text-red-400">{{ retentionMetrics.defeats }}</span>
              </span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-400">总通关次数</span>
              <span class="text-cyan-400 font-medium">{{ retentionMetrics.totalClears }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-400">日均战斗</span>
              <span class="text-amber-400 font-medium">{{ retentionMetrics.avgBattlesPerDay }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-400">平均战斗时长</span>
              <span class="text-amber-400 font-medium">{{ formatDuration(retentionMetrics.avgBattleDuration) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-6">
        <div class="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <CalendarCheck class="w-4 h-4 text-purple-400" />
              近期活动
            </h3>
          </div>
          <div class="space-y-3">
            <div
              v-for="act in recentActivities"
              :key="act.id"
              class="flex items-center gap-3 p-3 bg-gray-900/40 rounded-lg"
            >
              <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                :class="act.status === 'active' ? 'bg-green-500/15' : act.status === 'ended' ? 'bg-gray-500/15' : 'bg-blue-500/15'"
              >
                <CalendarCheck class="w-4 h-4"
                  :class="act.status === 'active' ? 'text-green-400' : act.status === 'ended' ? 'text-gray-400' : 'text-blue-400'"
                />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-white truncate">{{ act.name }}</p>
                <p class="text-xs text-gray-500">{{ formatTime(act.updatedAt) }}</p>
              </div>
              <span class="px-2 py-0.5 text-xs rounded flex-shrink-0"
                :class="act.status === 'active' ? 'bg-green-500/15 text-green-400' : act.status === 'ended' ? 'bg-gray-500/15 text-gray-400' : 'bg-blue-500/15 text-blue-400'"
              >{{ act.statusLabel }}</span>
            </div>
            <div v-if="recentActivities.length === 0" class="py-6 text-center">
              <p class="text-gray-500 text-sm">暂无活动数据</p>
            </div>
          </div>
        </div>

        <div class="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <Sword class="w-4 h-4 text-rose-400" />
              近期战斗
            </h3>
          </div>
          <div class="space-y-3">
            <div
              v-for="battle in recentBattles"
              :key="battle.id"
              class="flex items-center gap-3 p-3 bg-gray-900/40 rounded-lg"
            >
              <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                :class="battle.result === 'victory' ? 'bg-green-500/15' : battle.result === 'defeat' ? 'bg-red-500/15' : 'bg-gray-500/15'"
              >
                <Sword class="w-4 h-4"
                  :class="battle.result === 'victory' ? 'text-green-400' : battle.result === 'defeat' ? 'text-red-400' : 'text-gray-400'"
                />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-white">{{ battle.stageId }}</p>
                <p class="text-xs text-gray-500">{{ formatTime(battle.completedAt) }}</p>
              </div>
              <div class="flex items-center gap-1">
                <Star v-for="s in battle.starRating" :key="s" class="w-3 h-3 text-amber-400 fill-amber-400" />
              </div>
              <span class="px-2 py-0.5 text-xs rounded flex-shrink-0"
                :class="battle.result === 'victory' ? 'bg-green-500/15 text-green-400' : battle.result === 'defeat' ? 'bg-red-500/15 text-red-400' : 'bg-gray-500/15 text-gray-400'"
              >{{ battle.resultLabel }}</span>
            </div>
            <div v-if="recentBattles.length === 0" class="py-6 text-center">
              <p class="text-gray-500 text-sm">暂无战斗记录</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
