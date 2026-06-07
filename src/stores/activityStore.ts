import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type {
  Activity,
  ActivityTemplate,
  ActivityConfig,
  ActivityStatistics,
  ActivityLog,
  ActivityStatus,
  ActivityEvent,
  TrackEventType,
  EventQueryParams,
  AggregatedStatistics,
} from '@/types/activity'
import { mockTemplates, mockActivities, mockStatistics, mockLogs, generateMockEvents } from '@/game/data/activityTemplates'

const STORAGE_KEYS = {
  ACTIVITIES: 'activity_activities',
  EVENTS: 'activity_events',
  LOGS: 'activity_logs',
  STATISTICS: 'activity_statistics',
}

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key)
    if (stored) {
      return JSON.parse(stored) as T
    }
  } catch (e) {
    console.error(`Failed to load ${key} from localStorage:`, e)
  }
  return defaultValue
}

function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error(`Failed to save ${key} to localStorage:`, e)
  }
}

export const useActivityStore = defineStore('activity', () => {
  const templates = ref<ActivityTemplate[]>([...mockTemplates])
  const activities = ref<Activity[]>(loadFromStorage(STORAGE_KEYS.ACTIVITIES, [...mockActivities]))
  const currentActivity = ref<Activity | null>(null)
  const statistics = ref<Record<string, ActivityStatistics>>(loadFromStorage(STORAGE_KEYS.STATISTICS, { ...mockStatistics }))
  const logs = ref<ActivityLog[]>(loadFromStorage(STORAGE_KEYS.LOGS, [...mockLogs]))
  const events = ref<ActivityEvent[]>(loadFromStorage(STORAGE_KEYS.EVENTS, generateMockEvents()))
  const loading = ref(false)

  watch(activities, (val) => saveToStorage(STORAGE_KEYS.ACTIVITIES, val), { deep: true })
  watch(events, (val) => saveToStorage(STORAGE_KEYS.EVENTS, val), { deep: true })
  watch(logs, (val) => saveToStorage(STORAGE_KEYS.LOGS, val), { deep: true })
  watch(statistics, (val) => saveToStorage(STORAGE_KEYS.STATISTICS, val), { deep: true })

  const activeActivities = computed(() =>
    activities.value.filter(a => a.status === 'active'),
  )

  const draftActivities = computed(() =>
    activities.value.filter(a => a.status === 'draft'),
  )

  const pendingActivities = computed(() =>
    activities.value.filter(a => a.status === 'pending'),
  )

  const endedActivities = computed(() =>
    activities.value.filter(a => a.status === 'ended'),
  )

  function generateId(prefix: string) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
  }

  function loadTemplates() {
    loading.value = true
    setTimeout(() => {
      loading.value = false
    }, 300)
  }

  function loadActivities() {
    loading.value = true
    setTimeout(() => {
      loading.value = false
    }, 300)
  }

  function getActivityById(id: string) {
    return activities.value.find(a => a.id === id) || null
  }

  function setCurrentActivity(id: string | null) {
    if (id) {
      currentActivity.value = getActivityById(id)
    } else {
      currentActivity.value = null
    }
  }

  function createActivity(templateId: string): Activity {
    const template = templates.value.find(t => t.id === templateId)
    if (!template) throw new Error('Template not found')

    const now = Date.now()
    const newActivity: Activity = {
      id: generateId('act'),
      status: 'draft',
      createdBy: 'admin',
      createdAt: now,
      updatedAt: now,
      config: {
        templateId,
        name: `${template.name} - 新活动`,
        description: '',
        schedule: {
          type: 'fixed',
          startTime: now,
          endTime: now + 30 * 24 * 60 * 60 * 1000,
          timezone: 'Asia/Shanghai',
        },
        triggerConditions: {
          id: generateId('cond'),
          logic: 'AND',
          conditions: [],
        },
        rewardRules: [],
        pageConfig: {
          id: generateId('page'),
          name: '活动页面',
          theme: 'dark',
          backgroundColor: '#1a1a2e',
          elements: [],
        },
        isEnabled: true,
        priority: template.defaultConfig.priority || 1,
        audience: {},
        ...template.defaultConfig,
      },
    }

    activities.value.unshift(newActivity)

    statistics.value[newActivity.id] = {
      activityId: newActivity.id,
      totalParticipants: 0,
      newParticipants: [],
      activeUsers: [],
      completionRate: 0,
      rewardClaimedCount: 0,
      rewardClaimedValue: 0,
      clickEvents: {},
      pageViews: 0,
      uniqueVisitors: 0,
      averageDuration: 0,
    }

    return newActivity
  }

  function updateActivity(id: string, updates: Partial<Activity | Activity['config']>) {
    const index = activities.value.findIndex(a => a.id === id)
    if (index === -1) return

    const activity = activities.value[index]

    if ('config' in updates && typeof updates.config === 'object' && updates.config !== null) {
      activities.value[index] = {
        ...activity,
        ...updates,
        config: { ...activity.config, ...updates.config },
        updatedAt: Date.now(),
      }
    } else {
      activities.value[index] = {
        ...activity,
        ...updates,
        updatedAt: Date.now(),
      }
    }

    if (currentActivity.value?.id === id) {
      currentActivity.value = activities.value[index]
    }

    addLog({
      activityId: id,
      playerId: 'admin',
      eventType: 'view',
      metadata: { action: 'update_activity', updates },
    })
  }

  function updateActivityConfig(id: string, configUpdates: Partial<ActivityConfig>) {
    const activity = activities.value.find(a => a.id === id)
    if (!activity) return

    activity.config = { ...activity.config, ...configUpdates }
    activity.updatedAt = Date.now()

    if (currentActivity.value?.id === id) {
      currentActivity.value = { ...activity }
    }

    addLog({
      activityId: id,
      playerId: 'admin',
      eventType: 'view',
      metadata: { action: 'update_config', configUpdates },
    })
  }

  function deleteActivity(id: string) {
    const index = activities.value.findIndex(a => a.id === id)
    if (index !== -1) {
      activities.value.splice(index, 1)
      if (currentActivity.value?.id === id) {
        currentActivity.value = null
      }
      delete statistics.value[id]
    }
  }

  function updateActivityStatus(id: string, status: ActivityStatus) {
    const activity = activities.value.find(a => a.id === id)
    if (!activity) return

    const oldStatus = activity.status
    activity.status = status
    activity.updatedAt = Date.now()

    if (status === 'active') {
      activity.startedAt = Date.now()
    } else if (status === 'ended') {
      activity.endedAt = Date.now()
    }

    if (currentActivity.value?.id === id) {
      currentActivity.value = { ...activity }
    }

    addLog({
      activityId: id,
      playerId: 'admin',
      eventType: 'view',
      metadata: { action: 'status_change', oldStatus, newStatus: status },
    })
  }

  function submitForApproval(id: string) {
    updateActivityStatus(id, 'pending')
  }

  function approveActivity(id: string) {
    const activity = activities.value.find(a => a.id === id)
    if (!activity) return

    activity.status = 'active'
    activity.approvedBy = 'super_admin'
    activity.approvedAt = Date.now()
    activity.startedAt = Date.now()
    activity.updatedAt = Date.now()

    if (currentActivity.value?.id === id) {
      currentActivity.value = { ...activity }
    }

    addLog({
      activityId: id,
      playerId: 'admin',
      eventType: 'view',
      metadata: { action: 'approve' },
    })
  }

  function pauseActivity(id: string) {
    updateActivityStatus(id, 'paused')
  }

  function resumeActivity(id: string) {
    updateActivityStatus(id, 'active')
  }

  function endActivity(id: string) {
    updateActivityStatus(id, 'ended')
  }

  function getStatistics(activityId: string) {
    return statistics.value[activityId] || null
  }

  function getLogs(activityId?: string) {
    if (activityId) {
      return logs.value.filter(l => l.activityId === activityId)
    }
    return logs.value
  }

  function getTemplateById(id: string) {
    return templates.value.find(t => t.id === id) || null
  }

  function trackEvent(event: Omit<ActivityEvent, 'id' | 'timestamp'>) {
    const newEvent: ActivityEvent = {
      ...event,
      id: generateId('evt'),
      timestamp: Date.now(),
    }
    events.value.push(newEvent)

    const stats = statistics.value[event.activityId]
    if (stats) {
      if (event.eventType === 'exposure') {
        stats.pageViews++
      } else if (event.eventType === 'click') {
        if (event.elementId) {
          stats.clickEvents[event.elementId] = (stats.clickEvents[event.elementId] || 0) + 1
        }
      } else if (event.eventType === 'claim') {
        stats.rewardClaimedCount++
        if (event.metadata?.value) {
          stats.rewardClaimedValue += Number(event.metadata.value) || 0
        }
      } else if (event.eventType === 'complete') {
        stats.totalParticipants++
        stats.completionRate = stats.totalParticipants > 0
          ? Math.round((stats.totalParticipants / Math.max(stats.pageViews, 1)) * 1000) / 10
          : 0
      }
    }
  }

  function trackExposure(activityId: string, playerId: string, metadata: Record<string, any> = {}) {
    trackEvent({
      activityId,
      playerId,
      eventType: 'exposure',
      pageUrl: window.location.href,
      userAgent: navigator.userAgent,
      metadata,
    })

    addLog({
      activityId,
      playerId,
      eventType: 'exposure',
      metadata,
    })
  }

  function trackClick(activityId: string, playerId: string, elementId: string, metadata: Record<string, any> = {}) {
    trackEvent({
      activityId,
      playerId,
      eventType: 'click',
      elementId,
      pageUrl: window.location.href,
      userAgent: navigator.userAgent,
      metadata,
    })

    addLog({
      activityId,
      playerId,
      eventType: 'click',
      elementId,
      metadata,
    })
  }

  function trackClaim(activityId: string, playerId: string, rewardId?: string, metadata: Record<string, any> = {}) {
    trackEvent({
      activityId,
      playerId,
      eventType: 'claim',
      rewardId,
      metadata,
    })

    addLog({
      activityId,
      playerId,
      eventType: 'claim',
      rewardId,
      metadata: { ...metadata, rewardName: metadata.rewardName || '未知奖励' },
    })
  }

  function trackComplete(activityId: string, playerId: string, metadata: Record<string, any> = {}) {
    trackEvent({
      activityId,
      playerId,
      eventType: 'complete',
      metadata,
    })

    addLog({
      activityId,
      playerId,
      eventType: 'complete',
      metadata,
    })
  }

  function addLog(log: Omit<ActivityLog, 'id' | 'timestamp'>) {
    const newLog: ActivityLog = {
      ...log,
      id: generateId('log'),
      timestamp: Date.now(),
    }
    logs.value.unshift(newLog)
  }

  function queryEvents(params: EventQueryParams) {
    let result = [...events.value]

    if (params.activityId) {
      result = result.filter(e => e.activityId === params.activityId)
    }
    if (params.playerId) {
      result = result.filter(e => e.playerId === params.playerId)
    }
    if (params.eventType) {
      result = result.filter(e => e.eventType === params.eventType)
    }
    if (params.startTime) {
      result = result.filter(e => e.timestamp >= params.startTime!)
    }
    if (params.endTime) {
      result = result.filter(e => e.timestamp <= params.endTime!)
    }
    if (params.elementId) {
      result = result.filter(e => e.elementId === params.elementId)
    }

    result.sort((a, b) => b.timestamp - a.timestamp)

    const page = params.page || 1
    const pageSize = params.pageSize || 50
    const total = result.length
    const paginated = result.slice((page - 1) * pageSize, page * pageSize)

    return {
      total,
      page,
      pageSize,
      data: paginated,
    }
  }

  function getAggregatedStatistics(activityId: string, days: number = 7): AggregatedStatistics {
    const now = Date.now()
    const startTime = now - days * 24 * 60 * 60 * 1000

    const activityEvents = events.value.filter(
      e => e.activityId === activityId && e.timestamp >= startTime
    )

    const totalExposures = activityEvents.filter(e => e.eventType === 'exposure').length
    const totalClicks = activityEvents.filter(e => e.eventType === 'click').length
    const totalClaims = activityEvents.filter(e => e.eventType === 'claim').length
    const totalCompletions = activityEvents.filter(e => e.eventType === 'complete').length
    const totalPageViews = totalExposures

    const uniquePlayers = new Set(activityEvents.map(e => e.playerId))
    const uniqueVisitors = uniquePlayers.size

    const clickThroughRate = totalExposures > 0 ? Math.round((totalClicks / totalExposures) * 1000) / 10 : 0
    const conversionRate = totalClicks > 0 ? Math.round((totalCompletions / totalClicks) * 1000) / 10 : 0

    const elementClickCounts: Record<string, number> = {}
    const rewardDistribution: Record<string, number> = {}

    activityEvents.forEach(event => {
      if (event.eventType === 'click' && event.elementId) {
        elementClickCounts[event.elementId] = (elementClickCounts[event.elementId] || 0) + 1
      }
      if (event.eventType === 'claim' && event.rewardId) {
        rewardDistribution[event.rewardId] = (rewardDistribution[event.rewardId] || 0) + 1
      }
    })

    const topClickedElements = Object.entries(elementClickCounts)
      .map(([elementId, count]) => ({ elementId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const hourlyData: Array<{ hour: string; exposures: number; clicks: number; claims: number }> = []
    const dailyData: Array<{ date: string; exposures: number; clicks: number; claims: number }> = []

    const hourlyMap: Record<string, { exposures: number; clicks: number; claims: number }> = {}
    const dailyMap: Record<string, { exposures: number; clicks: number; claims: number }> = {}

    activityEvents.forEach(event => {
      const date = new Date(event.timestamp)
      const hourKey = `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:00`
      const dayKey = `${date.getMonth() + 1}/${date.getDate()}`

      if (!hourlyMap[hourKey]) {
        hourlyMap[hourKey] = { exposures: 0, clicks: 0, claims: 0 }
      }
      if (!dailyMap[dayKey]) {
        dailyMap[dayKey] = { exposures: 0, clicks: 0, claims: 0 }
      }

      if (event.eventType === 'exposure') {
        hourlyMap[hourKey].exposures++
        dailyMap[dayKey].exposures++
      } else if (event.eventType === 'click') {
        hourlyMap[hourKey].clicks++
        dailyMap[dayKey].clicks++
      } else if (event.eventType === 'claim') {
        hourlyMap[hourKey].claims++
        dailyMap[dayKey].claims++
      }
    })

    Object.entries(hourlyMap).forEach(([hour, data]) => {
      hourlyData.push({ hour, ...data })
    })
    Object.entries(dailyMap).forEach(([date, data]) => {
      dailyData.push({ date, ...data })
    })

    hourlyData.sort((a, b) => a.hour.localeCompare(b.hour))
    dailyData.sort((a, b) => a.date.localeCompare(b.date))

    return {
      activityId,
      totalExposures,
      totalClicks,
      totalClaims,
      totalCompletions,
      totalPageViews,
      uniqueVisitors,
      clickThroughRate,
      conversionRate,
      averageDuration: 180,
      rewardDistribution,
      topClickedElements,
      hourlyData,
      dailyData,
    }
  }

  function clearStorage() {
    localStorage.removeItem(STORAGE_KEYS.ACTIVITIES)
    localStorage.removeItem(STORAGE_KEYS.EVENTS)
    localStorage.removeItem(STORAGE_KEYS.LOGS)
    localStorage.removeItem(STORAGE_KEYS.STATISTICS)
    activities.value = [...mockActivities]
    events.value = generateMockEvents()
    logs.value = [...mockLogs]
    statistics.value = { ...mockStatistics }
  }

  return {
    templates,
    activities,
    currentActivity,
    statistics,
    logs,
    events,
    loading,
    activeActivities,
    draftActivities,
    pendingActivities,
    endedActivities,
    loadTemplates,
    loadActivities,
    getActivityById,
    setCurrentActivity,
    createActivity,
    updateActivity,
    updateActivityConfig,
    deleteActivity,
    updateActivityStatus,
    submitForApproval,
    approveActivity,
    pauseActivity,
    resumeActivity,
    endActivity,
    getStatistics,
    getLogs,
    getTemplateById,
    generateId,
    trackEvent,
    trackExposure,
    trackClick,
    trackClaim,
    trackComplete,
    addLog,
    queryEvents,
    getAggregatedStatistics,
    clearStorage,
  }
})
