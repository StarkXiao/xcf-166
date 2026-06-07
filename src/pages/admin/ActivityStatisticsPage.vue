<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button
          @click="goBack"
          class="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h2 class="text-xl font-semibold">数据统计</h2>
          <p class="text-sm text-gray-400">{{ activity?.config.name || '活动数据统计' }}</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <select
          v-model="timeRange"
          class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
        >
          <option value="7">最近7天</option>
          <option value="14">最近14天</option>
          <option value="30">最近30天</option>
        </select>
        <button
          @click="exportData"
          class="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          <Download class="w-4 h-4" />
          导出数据
        </button>
      </div>
    </div>

    <div v-if="activity && aggregatedStats" class="space-y-6">
      <div class="grid grid-cols-4 gap-4">
        <div class="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-400">总曝光量</p>
              <p class="text-2xl font-bold text-white mt-1">{{ aggregatedStats.totalExposures.toLocaleString() }}</p>
            </div>
            <div class="w-12 h-12 rounded-lg bg-gray-500/20 flex items-center justify-center">
              <Eye class="w-6 h-6 text-gray-400" />
            </div>
          </div>
        </div>
        <div class="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-400">总点击量</p>
              <p class="text-2xl font-bold text-purple-400 mt-1">{{ aggregatedStats.totalClicks.toLocaleString() }}</p>
            </div>
            <div class="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <MousePointerClick class="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <div class="mt-3 flex items-center text-xs">
            <span class="text-gray-400">点击率:</span>
            <span class="text-purple-400 font-medium ml-1">{{ aggregatedStats.clickThroughRate }}%</span>
          </div>
        </div>
        <div class="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-400">总领取量</p>
              <p class="text-2xl font-bold text-yellow-400 mt-1">{{ aggregatedStats.totalClaims.toLocaleString() }}</p>
            </div>
            <div class="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Gift class="w-6 h-6 text-yellow-400" />
            </div>
          </div>
          <div class="mt-3 flex items-center text-xs">
            <span class="text-gray-400">转化率:</span>
            <span class="text-green-400 font-medium ml-1">{{ aggregatedStats.conversionRate }}%</span>
          </div>
        </div>
        <div class="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-400">独立访客</p>
              <p class="text-2xl font-bold text-green-400 mt-1">{{ aggregatedStats.uniqueVisitors.toLocaleString() }}</p>
            </div>
            <div class="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
              <UserCheck class="w-6 h-6 text-green-400" />
            </div>
          </div>
          <div class="mt-3 flex items-center text-xs">
            <span class="text-gray-400">完成数:</span>
            <span class="text-blue-400 font-medium ml-1">{{ aggregatedStats.totalCompletions.toLocaleString() }}</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-6">
        <div class="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 class="text-sm font-semibold text-gray-300 mb-4">曝光/点击趋势（日）</h3>
          <div class="h-64">
            <svg width="100%" height="100%" viewBox="0 0 600 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="exposureGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#6b7280" stop-opacity="0.5" />
                  <stop offset="100%" stop-color="#6b7280" stop-opacity="0" />
                </linearGradient>
                <linearGradient id="clickGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#a855f7" stop-opacity="0.5" />
                  <stop offset="100%" stop-color="#a855f7" stop-opacity="0" />
                </linearGradient>
              </defs>
              <g stroke="#374151" stroke-width="1" stroke-dasharray="3,3">
                <line x1="40" y1="30" x2="580" y2="30" />
                <line x1="40" y1="80" x2="580" y2="80" />
                <line x1="40" y1="130" x2="580" y2="130" />
                <line x1="40" y1="180" x2="580" y2="180" />
              </g>
              <path
                :d="exposureAreaPath"
                fill="url(#exposureGradient)"
                stroke="none"
              />
              <path
                :d="exposureLinePath"
                fill="none"
                stroke="#6b7280"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                :d="clickAreaPath"
                fill="url(#clickGradient)"
                stroke="none"
              />
              <path
                :d="clickLinePath"
                fill="none"
                stroke="#a855f7"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <g font-size="10" fill="#6b7280">
                <text v-for="(label, i) in xAxisLabels" :key="i" :x="label.x" y="195" text-anchor="middle">
                  {{ label.text }}
                </text>
              </g>
              <g font-size="10" fill="#9ca3af">
                <text x="100" y="20" class="fill-gray-400">● 曝光</text>
                <text x="160" y="20" class="fill-purple-400">● 点击</text>
              </g>
            </svg>
          </div>
        </div>

        <div class="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 class="text-sm font-semibold text-gray-300 mb-4">领取趋势（日）</h3>
          <div class="h-64">
            <svg width="100%" height="100%" viewBox="0 0 600 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="claimGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#eab308" stop-opacity="0.5" />
                  <stop offset="100%" stop-color="#eab308" stop-opacity="0" />
                </linearGradient>
              </defs>
              <g stroke="#374151" stroke-width="1" stroke-dasharray="3,3">
                <line x1="40" y1="30" x2="580" y2="30" />
                <line x1="40" y1="80" x2="580" y2="80" />
                <line x1="40" y1="130" x2="580" y2="130" />
                <line x1="40" y1="180" x2="580" y2="180" />
              </g>
              <path
                :d="claimAreaPath"
                fill="url(#claimGradient)"
                stroke="none"
              />
              <path
                :d="claimLinePath"
                fill="none"
                stroke="#eab308"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <circle
                v-for="(point, i) in claimPoints"
                :key="i"
                :cx="point.x"
                :cy="point.y"
                r="4"
                fill="#eab308"
              />
              <g font-size="10" fill="#6b7280">
                <text v-for="(label, i) in xAxisLabels" :key="i" :x="label.x" y="195" text-anchor="middle">
                  {{ label.text }}
                </text>
              </g>
            </svg>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-6">
        <div class="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 class="text-sm font-semibold text-gray-300 mb-4">点击元素分布</h3>
          <div class="space-y-4">
            <div
              v-for="item in aggregatedStats.topClickedElements"
              :key="item.elementId"
              class="space-y-2"
            >
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-300">{{ item.elementId }}</span>
                <span class="text-white font-medium">{{ item.count.toLocaleString() }}</span>
              </div>
              <div class="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                  :style="{ width: `${(item.count / maxClickCount) * 100}%` }"
                ></div>
              </div>
            </div>
            <div v-if="aggregatedStats.topClickedElements.length === 0" class="py-8 text-center">
              <p class="text-gray-500 text-sm">暂无点击数据</p>
            </div>
          </div>
        </div>

        <div class="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-gray-300">操作日志</h3>
            <div class="flex items-center gap-2">
              <select
                v-model="eventTypeFilter"
                class="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">全部类型</option>
                <option value="exposure">曝光</option>
                <option value="click">点击</option>
                <option value="claim">领取</option>
                <option value="complete">完成</option>
              </select>
              <input
                v-model="playerIdFilter"
                type="text"
                placeholder="搜索玩家ID"
                class="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-white focus:outline-none focus:border-purple-500 w-28"
              />
            </div>
          </div>
          <div class="space-y-3 max-h-80 overflow-auto">
            <div
              v-for="event in filteredEvents"
              :key="event.id"
              class="flex items-start gap-3 p-3 bg-gray-700/30 rounded-lg"
            >
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                :class="trackEventTypeStyles[event.eventType].bg"
              >
                <component :is="trackEventTypeStyles[event.eventType].icon" class="w-4 h-4" :class="trackEventTypeStyles[event.eventType].color" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-sm text-white">{{ event.playerId }}</span>
                  <span
                    class="px-1.5 py-0.5 text-xs rounded"
                    :class="trackEventTypeStyles[event.eventType].badge"
                  >
                    {{ trackEventTypeLabels[event.eventType] }}
                  </span>
                  <span v-if="event.elementId" class="text-xs text-purple-400">{{ event.elementId }}</span>
                </div>
                <p class="text-xs text-gray-400 mt-1 truncate">
                  {{ formatEventMetadata(event) }}
                </p>
                <p class="text-xs text-gray-500 mt-0.5">{{ formatDate(event.timestamp) }}</p>
              </div>
            </div>
            <div v-if="filteredEvents.length === 0" class="py-8 text-center">
              <p class="text-gray-500 text-sm">暂无日志数据</p>
            </div>
          </div>
          <div v-if="eventsPageInfo.total > eventsPageInfo.pageSize" class="mt-4 flex items-center justify-center gap-2">
            <button
              @click="prevPage"
              :disabled="eventsPageInfo.page <= 1"
              class="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm text-white transition-colors"
            >
              上一页
            </button>
            <span class="text-sm text-gray-400">{{ eventsPageInfo.page }} / {{ totalPages }}</span>
            <button
              @click="nextPage"
              :disabled="eventsPageInfo.page >= totalPages"
              class="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm text-white transition-colors"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="py-20 text-center">
      <BarChart3 class="w-16 h-16 text-gray-600 mx-auto mb-4" />
      <p class="text-gray-400">暂无统计数据</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Download,
  Eye,
  UserCheck,
  TrendingUp,
  TrendingDown,
  BarChart3,
  MousePointerClick,
  Gift,
  FileText,
  AlertCircle,
  Layout,
} from 'lucide-vue-next'
import { useActivityStore } from '@/stores/activityStore'
import type { ActivityStatus, ActivityEvent, TrackEventType } from '@/types/activity'

const route = useRoute()
const router = useRouter()
const activityStore = useActivityStore()

const activityId = computed(() => route.params.id as string)
const activity = computed(() => activityStore.getActivityById(activityId.value))

const timeRange = ref('7')
const eventTypeFilter = ref<TrackEventType | ''>('')
const playerIdFilter = ref('')
const eventsPage = ref(1)
const eventsPageSize = ref(10)

const aggregatedStats = computed(() =>
  activityStore.getAggregatedStatistics(activityId.value, parseInt(timeRange.value))
)

const statusLabels: Record<ActivityStatus, string> = {
  draft: '草稿',
  pending: '待审核',
  active: '进行中',
  paused: '已暂停',
  ended: '已结束',
  cancelled: '已取消',
}

const trackEventTypeLabels: Record<TrackEventType, string> = {
  exposure: '曝光',
  click: '点击',
  claim: '领取',
  complete: '完成',
  view: '浏览',
  error: '错误',
}

const trackEventTypeStyles: Record<TrackEventType, { bg: string; color: string; badge: string; icon: any }> = {
  exposure: { bg: 'bg-gray-500/20', color: 'text-gray-400', badge: 'bg-gray-500/20 text-gray-400', icon: Eye },
  click: { bg: 'bg-purple-500/20', color: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-400', icon: MousePointerClick },
  claim: { bg: 'bg-yellow-500/20', color: 'text-yellow-400', badge: 'bg-yellow-500/20 text-yellow-400', icon: Gift },
  complete: { bg: 'bg-green-500/20', color: 'text-green-400', badge: 'bg-green-500/20 text-green-400', icon: FileText },
  view: { bg: 'bg-blue-500/20', color: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-400', icon: Eye },
  error: { bg: 'bg-red-500/20', color: 'text-red-400', badge: 'bg-red-500/20 text-red-400', icon: AlertCircle },
}

const maxClickCount = computed(() => {
  if (!aggregatedStats.value) return 1
  const counts = aggregatedStats.value.topClickedElements.map(e => e.count)
  return Math.max(...counts, 1)
})

const eventsQuery = computed(() => ({
  activityId: activityId.value,
  eventType: eventTypeFilter.value || undefined,
  playerId: playerIdFilter.value || undefined,
  page: eventsPage.value,
  pageSize: eventsPageSize.value,
}))

const eventsQueryResult = computed(() => activityStore.queryEvents(eventsQuery.value))
const filteredEvents = computed(() => eventsQueryResult.value.data)
const eventsPageInfo = computed(() => ({
  page: eventsQueryResult.value.page,
  pageSize: eventsQueryResult.value.pageSize,
  total: eventsQueryResult.value.total,
}))
const totalPages = computed(() => Math.ceil(eventsPageInfo.value.total / eventsPageInfo.value.pageSize))

function prevPage() {
  if (eventsPage.value > 1) eventsPage.value--
}

function nextPage() {
  if (eventsPage.value < totalPages.value) eventsPage.value++
}

watch([eventTypeFilter, playerIdFilter], () => {
  eventsPage.value = 1
})

function goBack() {
  router.push('/admin/activities')
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatEventMetadata(event: ActivityEvent) {
  const parts: string[] = []
  if (event.metadata?.source) parts.push(`来源: ${event.metadata.source}`)
  if (event.metadata?.device) parts.push(`设备: ${event.metadata.device}`)
  if (event.metadata?.rewardName) parts.push(event.metadata.rewardName)
  if (event.metadata?.taskId) parts.push(`任务: ${event.metadata.taskId}`)
  if (event.metadata?.duration) parts.push(`时长: ${event.metadata.duration}s`)
  if (event.metadata?.x !== undefined && event.metadata?.y !== undefined) {
    parts.push(`坐标: (${event.metadata.x}, ${event.metadata.y})`)
  }
  return parts.length > 0 ? parts.join(' | ') : '无详情'
}

function exportData() {
  const data = {
    activity: activity.value,
    aggregatedStats: aggregatedStats.value,
    rawEvents: activityStore.queryEvents({ activityId: activityId.value, pageSize: 10000 }),
    exportedAt: Date.now(),
    exportedBy: 'admin',
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `activity_${activityId.value}_${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const maxChartValue = computed(() => {
  if (!aggregatedStats.value) return 1
  const allValues: number[] = []
  aggregatedStats.value.dailyData.forEach(d => {
    allValues.push(d.exposures, d.clicks, d.claims)
  })
  return Math.max(...allValues, 1)
})

function calculateChartPoints(dataKey: 'exposures' | 'clicks' | 'claims') {
  if (!aggregatedStats.value) return []
  const data = aggregatedStats.value.dailyData
  const width = 540
  const height = 150
  const paddingTop = 30
  
  return data.map((d, i) => ({
    x: 40 + (i / (data.length - 1 || 1)) * width,
    y: paddingTop + height - (d[dataKey] / maxChartValue.value) * height,
  }))
}

const exposurePoints = computed(() => calculateChartPoints('exposures'))
const clickPoints = computed(() => calculateChartPoints('clicks'))
const claimPoints = computed(() => calculateChartPoints('claims'))

function createLinePath(points: { x: number; y: number }[]) {
  if (points.length === 0) return ''
  return points.reduce((path, point, i) => {
    return path + (i === 0 ? `M ${point.x} ${point.y}` : ` L ${point.x} ${point.y}`)
  }, '')
}

function createAreaPath(points: { x: number; y: number }[]) {
  if (points.length === 0) return ''
  const linePath = createLinePath(points)
  const lastPoint = points[points.length - 1]
  const firstPoint = points[0]
  return `${linePath} L ${lastPoint.x} 180 L ${firstPoint.x} 180 Z`
}

const exposureLinePath = computed(() => createLinePath(exposurePoints.value))
const exposureAreaPath = computed(() => createAreaPath(exposurePoints.value))
const clickLinePath = computed(() => createLinePath(clickPoints.value))
const clickAreaPath = computed(() => createAreaPath(clickPoints.value))
const claimLinePath = computed(() => createLinePath(claimPoints.value))
const claimAreaPath = computed(() => createAreaPath(claimPoints.value))

const xAxisLabels = computed(() => {
  if (!aggregatedStats.value) return []
  const data = aggregatedStats.value.dailyData
  const labels = []
  const step = Math.ceil(data.length / 7)
  
  for (let i = 0; i < data.length; i += step) {
    labels.push({
      x: 40 + (i / (data.length - 1 || 1)) * 540,
      text: data[i].date,
    })
  }
  return labels
})

onMounted(() => {
  if (!activity.value) {
    router.push('/admin/activities')
  }
})
</script>
