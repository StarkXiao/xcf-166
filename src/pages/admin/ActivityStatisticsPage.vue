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

    <div v-if="activity && statistics" class="space-y-6">
      <div class="grid grid-cols-4 gap-4">
        <div class="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-400">总参与人数</p>
              <p class="text-2xl font-bold text-white mt-1">{{ statistics.totalParticipants.toLocaleString() }}</p>
            </div>
            <div class="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Users class="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <div class="mt-3 flex items-center text-xs">
            <TrendingUp class="w-3 h-3 text-green-400 mr-1" />
            <span class="text-green-400">+12.5%</span>
            <span class="text-gray-500 ml-2">较上周</span>
          </div>
        </div>
        <div class="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-400">页面浏览量</p>
              <p class="text-2xl font-bold text-white mt-1">{{ statistics.pageViews.toLocaleString() }}</p>
            </div>
            <div class="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Eye class="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <div class="mt-3 flex items-center text-xs">
            <TrendingUp class="w-3 h-3 text-green-400 mr-1" />
            <span class="text-green-400">+8.3%</span>
            <span class="text-gray-500 ml-2">较上周</span>
          </div>
        </div>
        <div class="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-400">独立访客</p>
              <p class="text-2xl font-bold text-white mt-1">{{ statistics.uniqueVisitors.toLocaleString() }}</p>
            </div>
            <div class="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
              <UserCheck class="w-6 h-6 text-green-400" />
            </div>
          </div>
          <div class="mt-3 flex items-center text-xs">
            <TrendingUp class="w-3 h-3 text-green-400 mr-1" />
            <span class="text-green-400">+5.2%</span>
            <span class="text-gray-500 ml-2">较上周</span>
          </div>
        </div>
        <div class="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-400">完成率</p>
              <p class="text-2xl font-bold text-white mt-1">{{ (statistics.completionRate * 100).toFixed(1) }}%</p>
            </div>
            <div class="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Target class="w-6 h-6 text-yellow-400" />
            </div>
          </div>
          <div class="mt-3 flex items-center text-xs">
            <TrendingDown class="w-3 h-3 text-red-400 mr-1" />
            <span class="text-red-400">-2.1%</span>
            <span class="text-gray-500 ml-2">较上周</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-4 gap-4">
        <div class="bg-gray-800 rounded-xl p-5 border border-gray-700 col-span-2">
          <h3 class="text-sm font-semibold text-gray-300 mb-4">奖励统计</h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-400">奖励领取次数</span>
              <span class="text-white font-semibold">{{ statistics.rewardClaimedCount.toLocaleString() }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-400">奖励总价值</span>
              <span class="text-yellow-400 font-semibold">{{ statistics.rewardClaimedValue.toLocaleString() }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-400">平均停留时长</span>
              <span class="text-white font-semibold">{{ formatDuration(statistics.averageDuration) }}</span>
            </div>
          </div>
        </div>
        <div class="bg-gray-800 rounded-xl p-5 border border-gray-700 col-span-2">
          <h3 class="text-sm font-semibold text-gray-300 mb-4">活动信息</h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-400">活动状态</span>
              <span
                class="px-2 py-0.5 text-xs rounded-full"
                :class="statusStyles[activity.status]"
              >
                {{ statusLabels[activity.status] }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-400">开始时间</span>
              <span class="text-white text-sm">{{ formatDate(activity.config.schedule.startTime) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-400">结束时间</span>
              <span class="text-white text-sm">{{ formatDate(activity.config.schedule.endTime) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-6">
        <div class="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-gray-300">新增参与用户</h3>
            <span class="text-xs text-gray-500">最近{{ timeRange }}天</span>
          </div>
          <div class="h-64">
            <svg width="100%" height="100%" viewBox="0 0 600 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="newUsersGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.5" />
                  <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0" />
                </linearGradient>
              </defs>
              <g stroke="#374151" stroke-width="1" stroke-dasharray="3,3">
                <line x1="40" y1="30" x2="580" y2="30" />
                <line x1="40" y1="80" x2="580" y2="80" />
                <line x1="40" y1="130" x2="580" y2="130" />
                <line x1="40" y1="180" x2="580" y2="180" />
              </g>
              <path
                :d="newUsersAreaPath"
                fill="url(#newUsersGradient)"
                stroke="none"
              />
              <path
                :d="newUsersLinePath"
                fill="none"
                stroke="#8b5cf6"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <circle
                v-for="(point, i) in newUsersPoints"
                :key="i"
                :cx="point.x"
                :cy="point.y"
                r="4"
                fill="#8b5cf6"
              />
              <g font-size="10" fill="#6b7280">
                <text v-for="(label, i) in xAxisLabels" :key="i" :x="label.x" y="195" text-anchor="middle">
                  {{ label.text }}
                </text>
              </g>
            </svg>
          </div>
        </div>

        <div class="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-gray-300">活跃用户</h3>
            <span class="text-xs text-gray-500">最近{{ timeRange }}天</span>
          </div>
          <div class="h-64">
            <svg width="100%" height="100%" viewBox="0 0 600 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="activeUsersGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#10b981" stop-opacity="0.5" />
                  <stop offset="100%" stop-color="#10b981" stop-opacity="0" />
                </linearGradient>
              </defs>
              <g stroke="#374151" stroke-width="1" stroke-dasharray="3,3">
                <line x1="40" y1="30" x2="580" y2="30" />
                <line x1="40" y1="80" x2="580" y2="80" />
                <line x1="40" y1="130" x2="580" y2="130" />
                <line x1="40" y1="180" x2="580" y2="180" />
              </g>
              <path
                :d="activeUsersAreaPath"
                fill="url(#activeUsersGradient)"
                stroke="none"
              />
              <path
                :d="activeUsersLinePath"
                fill="none"
                stroke="#10b981"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <circle
                v-for="(point, i) in activeUsersPoints"
                :key="i"
                :cx="point.x"
                :cy="point.y"
                r="4"
                fill="#10b981"
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
          <h3 class="text-sm font-semibold text-gray-300 mb-4">点击事件分布</h3>
          <div class="space-y-4">
            <div
              v-for="(count, eventId) in statistics.clickEvents"
              :key="eventId"
              class="space-y-2"
            >
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-300">{{ eventId }}</span>
                <span class="text-white font-medium">{{ count.toLocaleString() }}</span>
              </div>
              <div class="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                  :style="{ width: `${(count / maxClickCount) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 class="text-sm font-semibold text-gray-300 mb-4">操作日志</h3>
          <div class="space-y-3 max-h-80 overflow-auto">
            <div
              v-for="log in activityLogs"
              :key="log.id"
              class="flex items-start gap-3 p-3 bg-gray-700/30 rounded-lg"
            >
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                :class="eventTypeStyles[log.eventType].bg"
              >
                <component :is="eventTypeStyles[log.eventType].icon" class="w-4 h-4" :class="eventTypeStyles[log.eventType].color" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-sm text-white">{{ log.playerId }}</span>
                  <span
                    class="px-1.5 py-0.5 text-xs rounded"
                    :class="eventTypeStyles[log.eventType].badge"
                  >
                    {{ eventTypeLabels[log.eventType] }}
                  </span>
                </div>
                <p class="text-xs text-gray-400 mt-1 truncate">
                  {{ log.metadata.page || log.metadata.button || log.metadata.reward || '无详情' }}
                </p>
                <p class="text-xs text-gray-500 mt-0.5">{{ formatDate(log.timestamp) }}</p>
              </div>
            </div>
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
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Download,
  Users,
  Eye,
  UserCheck,
  Target,
  TrendingUp,
  TrendingDown,
  BarChart3,
  MousePointerClick,
  Gift,
  FileText,
  AlertCircle,
} from 'lucide-vue-next'
import { useActivityStore } from '@/stores/activityStore'
import type { ActivityStatus, ActivityLog } from '@/types/activity'

const route = useRoute()
const router = useRouter()
const activityStore = useActivityStore()

const activityId = computed(() => route.params.id as string)
const activity = computed(() => activityStore.getActivityById(activityId.value))
const statistics = computed(() => activityStore.getStatistics(activityId.value))
const activityLogs = computed(() => activityStore.getLogs(activityId.value))

const timeRange = ref('7')

const statusLabels: Record<ActivityStatus, string> = {
  draft: '草稿',
  pending: '待审核',
  active: '进行中',
  paused: '已暂停',
  ended: '已结束',
  cancelled: '已取消',
}

const statusStyles: Record<ActivityStatus, string> = {
  draft: 'bg-gray-500/20 text-gray-300',
  pending: 'bg-yellow-500/20 text-yellow-400',
  active: 'bg-green-500/20 text-green-400',
  paused: 'bg-orange-500/20 text-orange-400',
  ended: 'bg-red-500/20 text-red-400',
  cancelled: 'bg-gray-500/20 text-gray-400',
}

const eventTypeLabels: Record<ActivityLog['eventType'], string> = {
  view: '浏览',
  click: '点击',
  claim: '领取',
  complete: '完成',
  error: '错误',
}

const eventTypeStyles: Record<ActivityLog['eventType'], { bg: string; color: string; badge: string; icon: any }> = {
  view: { bg: 'bg-blue-500/20', color: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-400', icon: Eye },
  click: { bg: 'bg-purple-500/20', color: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-400', icon: MousePointerClick },
  claim: { bg: 'bg-yellow-500/20', color: 'text-yellow-400', badge: 'bg-yellow-500/20 text-yellow-400', icon: Gift },
  complete: { bg: 'bg-green-500/20', color: 'text-green-400', badge: 'bg-green-500/20 text-green-400', icon: FileText },
  error: { bg: 'bg-red-500/20', color: 'text-red-400', badge: 'bg-red-500/20 text-red-400', icon: AlertCircle },
}

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

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}分${secs}秒`
}

function exportData() {
  const data = {
    activity: activity.value,
    statistics: statistics.value,
    logs: activityLogs.value,
    exportedAt: Date.now(),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `activity_${activityId.value}_${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const maxClickCount = computed(() => {
  if (!statistics.value) return 1
  return Math.max(...Object.values(statistics.value.clickEvents), 1)
})

const chartData = computed(() => {
  if (!statistics.value) return { newUsers: [], activeUsers: [] }
  
  const days = parseInt(timeRange.value)
  const newUsers = statistics.value.newParticipants.slice(-days)
  const activeUsers = statistics.value.activeUsers.slice(-days)
  
  return { newUsers, activeUsers }
})

const maxValue = computed(() => {
  const allValues = [
    ...chartData.value.newUsers.map((d: any) => d.value),
    ...chartData.value.activeUsers.map((d: any) => d.value),
  ]
  return Math.max(...allValues, 1)
})

function calculatePoints(data: any[]) {
  const width = 540
  const height = 150
  const paddingTop = 30
  
  return data.map((d, i) => ({
    x: 40 + (i / (data.length - 1)) * width,
    y: paddingTop + height - (d.value / maxValue.value) * height,
  }))
}

const newUsersPoints = computed(() => calculatePoints(chartData.value.newUsers))
const activeUsersPoints = computed(() => calculatePoints(chartData.value.activeUsers))

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

const newUsersLinePath = computed(() => createLinePath(newUsersPoints.value))
const newUsersAreaPath = computed(() => createAreaPath(newUsersPoints.value))
const activeUsersLinePath = computed(() => createLinePath(activeUsersPoints.value))
const activeUsersAreaPath = computed(() => createAreaPath(activeUsersPoints.value))

const xAxisLabels = computed(() => {
  const days = parseInt(timeRange.value)
  const labels = []
  const step = Math.ceil(days / 7)
  
  for (let i = 0; i < days; i += step) {
    const date = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000)
    labels.push({
      x: 40 + (i / (days - 1)) * 540,
      text: `${date.getMonth() + 1}/${date.getDate()}`,
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
