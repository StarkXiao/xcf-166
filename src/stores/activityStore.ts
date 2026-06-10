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
  CountdownInfo,
  CountdownWarningLevel,
  ActivityStage,
  ConditionValidation,
  ConditionValidationReport,
  RewardReissueRecord,
  RewardReissueStatus,
  ActivityArchive,
  ArchiveStatus,
  TriggerCondition,
  ConditionGroup,
} from '@/types/activity'
import { mockTemplates, mockActivities, mockStatistics, mockLogs, generateMockEvents } from '@/game/data/activityTemplates'

const STORAGE_KEYS = {
  ACTIVITIES: 'activity_activities',
  EVENTS: 'activity_events',
  LOGS: 'activity_logs',
  STATISTICS: 'activity_statistics',
  STAGES: 'activity_stages',
  REISSUE_RECORDS: 'activity_reissue_records',
  ARCHIVES: 'activity_archives',
}

const WARNING_THRESHOLDS = {
  URGENT: 24 * 60 * 60 * 1000,
  WARNING: 3 * 24 * 60 * 60 * 1000,
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
  const stages = ref<Record<string, ActivityStage[]>>(loadFromStorage(STORAGE_KEYS.STAGES, {}))
  const reissueRecords = ref<RewardReissueRecord[]>(loadFromStorage(STORAGE_KEYS.REISSUE_RECORDS, []))
  const archives = ref<ActivityArchive[]>(loadFromStorage(STORAGE_KEYS.ARCHIVES, []))

  watch(activities, (val) => saveToStorage(STORAGE_KEYS.ACTIVITIES, val), { deep: true })
  watch(events, (val) => saveToStorage(STORAGE_KEYS.EVENTS, val), { deep: true })
  watch(logs, (val) => saveToStorage(STORAGE_KEYS.LOGS, val), { deep: true })
  watch(statistics, (val) => saveToStorage(STORAGE_KEYS.STATISTICS, val), { deep: true })
  watch(stages, (val) => saveToStorage(STORAGE_KEYS.STAGES, val), { deep: true })
  watch(reissueRecords, (val) => saveToStorage(STORAGE_KEYS.REISSUE_RECORDS, val), { deep: true })
  watch(archives, (val) => saveToStorage(STORAGE_KEYS.ARCHIVES, val), { deep: true })

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

    const activityStages = stages.value[id]
    if (activityStages && activityStages.length > 0) {
      const firstStage = activityStages[0]
      if (!firstStage.isUnlocked) {
        firstStage.isUnlocked = true
        firstStage.unlockedAt = Date.now()
        stages.value[id] = [...activityStages]
        activity.config.stages = [...activityStages]

        addLog({
          activityId: id,
          playerId: 'system',
          eventType: 'view',
          metadata: {
            action: 'auto_unlock_stage',
            stageId: firstStage.id,
            stageName: firstStage.name,
            reason: '活动上线首阶段自动解锁',
          },
        })
      }
    }

    checkStageUnlocks(id)
  }

  function pauseActivity(id: string) {
    updateActivityStatus(id, 'paused')
  }

  function resumeActivity(id: string) {
    updateActivityStatus(id, 'active')
  }

  function endActivity(id: string) {
    const activity = activities.value.find(a => a.id === id)
    if (!activity) return
    if (activity.status === 'ended' || activity.status === 'archived') return

    updateActivityStatus(id, 'ended')

    addLog({
      activityId: id,
      playerId: 'system',
      eventType: 'view',
      metadata: { action: 'auto_end_activity', reason: '活动到期自动结束' },
    })

    setTimeout(() => {
      const current = activities.value.find(a => a.id === id)
      if (current && current.status === 'ended' && !current.archiveStatus) {
        archiveActivity(id, 'system')
      }
    }, 1000)
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

  const archivedActivities = computed(() =>
    activities.value.filter(a => a.archiveStatus === 'archived'),
  )

  function getCountdownInfo(activityId: string): CountdownInfo {
    const activity = activities.value.find(a => a.id === activityId)
    if (!activity) {
      return { remainingMs: 0, days: 0, hours: 0, minutes: 0, seconds: 0, warningLevel: 'expired', isExpired: true }
    }

    const now = Date.now()
    const endTime = activity.config.schedule.endTime
    const remainingMs = Math.max(0, endTime - now)
    const isExpired = remainingMs <= 0

    const days = Math.floor(remainingMs / (24 * 60 * 60 * 1000))
    const hours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
    const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000))
    const seconds = Math.floor((remainingMs % (60 * 1000)) / 1000)

    const customThreshold = activity.config.countdownWarningThresholdMs
    let warningLevel: CountdownWarningLevel = 'safe'
    if (isExpired) {
      warningLevel = 'expired'
    } else if (remainingMs <= (customThreshold ?? WARNING_THRESHOLDS.URGENT)) {
      warningLevel = 'urgent'
    } else if (remainingMs <= WARNING_THRESHOLDS.WARNING) {
      warningLevel = 'warning'
    }

    return { remainingMs, days, hours, minutes, seconds, warningLevel, isExpired }
  }

  function getActivitiesWithWarnings(): Array<Activity & { countdown: CountdownInfo }> {
    return activities.value
      .filter(a => a.status === 'active')
      .map(a => ({ ...a, countdown: getCountdownInfo(a.id) }))
      .filter(a => a.countdown.warningLevel !== 'safe')
      .sort((a, b) => a.countdown.remainingMs - b.countdown.remainingMs)
  }

  function addStage(activityId: string, stage: Omit<ActivityStage, 'id' | 'isUnlocked' | 'unlockedAt'>) {
    if (!stages.value[activityId]) {
      stages.value[activityId] = []
    }
    const newStage: ActivityStage = {
      ...stage,
      id: generateId('stage'),
      isUnlocked: stage.unlockType === 'manual' ? false : false,
    }
    stages.value[activityId].push(newStage)

    const activity = activities.value.find(a => a.id === activityId)
    if (activity) {
      activity.config.stages = [...(stages.value[activityId] || [])]
      activity.updatedAt = Date.now()
    }

    addLog({
      activityId,
      playerId: 'admin',
      eventType: 'view',
      metadata: { action: 'add_stage', stageName: stage.name },
    })
  }

  function updateStage(activityId: string, stageId: string, updates: Partial<ActivityStage>) {
    const activityStages = stages.value[activityId]
    if (!activityStages) return

    const index = activityStages.findIndex(s => s.id === stageId)
    if (index === -1) return

    activityStages[index] = { ...activityStages[index], ...updates }
    stages.value[activityId] = [...activityStages]

    const activity = activities.value.find(a => a.id === activityId)
    if (activity) {
      activity.config.stages = [...activityStages]
      activity.updatedAt = Date.now()
    }
  }

  function removeStage(activityId: string, stageId: string) {
    const activityStages = stages.value[activityId]
    if (!activityStages) return

    stages.value[activityId] = activityStages.filter(s => s.id !== stageId)

    const activity = activities.value.find(a => a.id === activityId)
    if (activity) {
      activity.config.stages = [...(stages.value[activityId] || [])]
      activity.updatedAt = Date.now()
    }
  }

  function unlockStage(activityId: string, stageId: string) {
    const activityStages = stages.value[activityId]
    if (!activityStages) return

    const stage = activityStages.find(s => s.id === stageId)
    if (!stage || stage.isUnlocked) return

    stage.isUnlocked = true
    stage.unlockedAt = Date.now()
    stages.value[activityId] = [...activityStages]

    const activity = activities.value.find(a => a.id === activityId)
    if (activity) {
      activity.config.stages = [...activityStages]
      activity.updatedAt = Date.now()
    }

    addLog({
      activityId,
      playerId: 'admin',
      eventType: 'view',
      metadata: { action: 'unlock_stage', stageId, stageName: stage.name },
    })
  }

  function validateConditionGroup(
    group: ConditionGroup,
    playerData: Record<string, number | string | boolean>,
  ): boolean {
    const results = group.conditions.map(cond => {
      const actualValue = playerData[cond.type]
      if (actualValue === undefined) return false
      const numActual = Number(actualValue)
      switch (cond.operator) {
        case 'gt': return numActual > Number(cond.value)
        case 'gte': return numActual >= Number(cond.value)
        case 'lt': return numActual < Number(cond.value)
        case 'lte': return numActual <= Number(cond.value)
        case 'eq': return String(actualValue) === String(cond.value)
        case 'ne': return String(actualValue) !== String(cond.value)
        case 'between': {
          const range = cond.value as [number, number]
          return numActual >= range[0] && numActual <= range[1]
        }
        case 'contains': return String(actualValue).includes(String(cond.value))
        default: return false
      }
    })

    const childResults = (group.children ?? []).map(child =>
      validateConditionGroup(child, playerData),
    )

    const allResults = [...results, ...childResults]
    if (allResults.length === 0) return false

    return group.logic === 'AND'
      ? allResults.every(Boolean)
      : allResults.some(Boolean)
  }

  function checkStageUnlocks(
    activityId: string,
    playerData: Record<string, number | string | boolean> = {},
  ) {
    const activityStages = stages.value[activityId]
    if (!activityStages) return

    const now = Date.now()
    let changed = false

    activityStages.forEach(stage => {
      if (stage.isUnlocked) return

      let shouldUnlock = false

      if (stage.unlockType === 'time' && stage.unlockTime && now >= stage.unlockTime) {
        shouldUnlock = true
      }

      if (stage.unlockType === 'condition' && stage.unlockConditions) {
        if (validateConditionGroup(stage.unlockConditions, playerData)) {
          shouldUnlock = true
        }
      }

      if (shouldUnlock) {
        stage.isUnlocked = true
        stage.unlockedAt = now
        changed = true

        addLog({
          activityId,
          playerId: 'system',
          eventType: 'view',
          metadata: {
            action: 'auto_unlock_stage',
            stageId: stage.id,
            stageName: stage.name,
            unlockType: stage.unlockType,
          },
        })
      }
    })

    if (changed) {
      stages.value[activityId] = [...activityStages]

      const activity = activities.value.find(a => a.id === activityId)
      if (activity) {
        activity.config.stages = [...activityStages]
        activity.updatedAt = Date.now()
      }
    }
  }

  function getStages(activityId: string): ActivityStage[] {
    return stages.value[activityId] || []
  }

  function validateConditions(
    activityId: string,
    playerId: string,
    playerData: Record<string, number | string | boolean> = {},
  ): ConditionValidationReport {
    const activity = activities.value.find(a => a.id === activityId)
    if (!activity) {
      return {
        activityId,
        playerId,
        validatedAt: Date.now(),
        overallResult: false,
        results: [{
          conditionId: '0',
          conditionType: 'custom_event',
          description: '活动不存在',
          result: 'error',
          message: '找不到指定活动',
        }],
      }
    }

    const conditions = activity.config.triggerConditions
    const results: ConditionValidation[] = []

    function validateCondition(condition: TriggerCondition): ConditionValidation {
      const actualValue = playerData[condition.type]
      const result: ConditionValidation = {
        conditionId: condition.id,
        conditionType: condition.type,
        description: condition.description,
        result: 'fail',
        expectedValue: condition.value,
        operator: condition.operator,
        message: '',
      }

      if (actualValue === undefined) {
        result.result = 'skipped'
        result.message = `缺少玩家数据: ${condition.type}`
        return result
      }

      result.actualValue = typeof actualValue === 'boolean' ? String(actualValue) : actualValue

      const numActual = Number(actualValue)
      let passed = false

      switch (condition.operator) {
        case 'gt': passed = numActual > Number(condition.value); break
        case 'gte': passed = numActual >= Number(condition.value); break
        case 'lt': passed = numActual < Number(condition.value); break
        case 'lte': passed = numActual <= Number(condition.value); break
        case 'eq': passed = String(actualValue) === String(condition.value); break
        case 'ne': passed = String(actualValue) !== String(condition.value); break
        case 'between': {
          const range = condition.value as [number, number]
          passed = numActual >= range[0] && numActual <= range[1]
          break
        }
        case 'contains': passed = String(actualValue).includes(String(condition.value)); break
      }

      result.result = passed ? 'pass' : 'fail'
      result.message = passed
        ? `${condition.description} - 通过`
        : `${condition.description} - 未满足 (当前值: ${actualValue})`

      return result
    }

    function validateGroup(group: typeof conditions): ConditionValidation[] {
      const groupResults: ConditionValidation[] = []
      for (const condition of group.conditions) {
        groupResults.push(validateCondition(condition))
      }
      if (group.children) {
        for (const child of group.children) {
          groupResults.push(...validateGroup(child))
        }
      }
      return groupResults
    }

    results.push(...validateGroup(conditions))

    const logic = conditions.logic
    const passCount = results.filter(r => r.result === 'pass').length
    const failCount = results.filter(r => r.result === 'fail').length
    const skipCount = results.filter(r => r.result === 'skipped').length
    const actionableResults = results.filter(r => r.result !== 'skipped')

    let overallResult = false
    if (logic === 'AND') {
      overallResult = actionableResults.length > 0 && actionableResults.every(r => r.result === 'pass')
    } else {
      overallResult = actionableResults.some(r => r.result === 'pass')
    }

    if (skipCount > 0 && failCount === 0 && passCount === 0) {
      overallResult = false
    }

    return {
      activityId,
      playerId,
      validatedAt: Date.now(),
      overallResult,
      results,
    }
  }

  function reissueReward(
    activityId: string,
    playerId: string,
    rewardId: string,
    rewardName: string,
    reason: string,
  ): RewardReissueRecord {
    const record: RewardReissueRecord = {
      id: generateId('reissue'),
      activityId,
      playerId,
      rewardId,
      rewardName,
      originalClaimAt: Date.now() - 60000,
      reissueAt: Date.now(),
      status: 'pending',
      reason,
      retryCount: 0,
      metadata: {},
    }

    reissueRecords.value.unshift(record)

    addLog({
      activityId,
      playerId,
      eventType: 'view',
      metadata: { action: 'reissue_reward', rewardId, rewardName, reason, reissueId: record.id },
    })

    processReissue(record.id)

    return record
  }

  function processReissue(recordId: string) {
    const record = reissueRecords.value.find(r => r.id === recordId)
    if (!record || record.status === 'success') return

    record.status = 'processing'
    record.lastRetryAt = Date.now()

    setTimeout(() => {
      const success = Math.random() > 0.1
      record.status = success ? 'success' : 'failed'
      record.retryCount++
      record.metadata.processedAt = Date.now()

      if (success) {
        const activity = activities.value.find(a => a.id === record.activityId)
        if (activity) {
          const stats = statistics.value[record.activityId]
          if (stats) {
            stats.rewardClaimedCount++
          }
        }

        addLog({
          activityId: record.activityId,
          playerId: record.playerId,
          eventType: 'claim',
          rewardId: record.rewardId,
          metadata: { action: 'reissue_success', rewardName: record.rewardName, reissueId: record.id },
        })
      }
    }, 1500)
  }

  function retryReissue(recordId: string) {
    const record = reissueRecords.value.find(r => r.id === recordId)
    if (!record || record.status !== 'failed') return

    if (record.retryCount >= 5) return

    processReissue(recordId)
  }

  function batchReissueRewards(
    activityId: string,
    records: Array<{ playerId: string; rewardId: string; rewardName: string }>,
    reason: string,
  ): RewardReissueRecord[] {
    return records.map(r => reissueReward(activityId, r.playerId, r.rewardId, r.rewardName, reason))
  }

  function getReissueRecords(activityId?: string): RewardReissueRecord[] {
    if (activityId) {
      return reissueRecords.value.filter(r => r.activityId === activityId)
    }
    return reissueRecords.value
  }

  function archiveActivity(activityId: string, archivedBy: string = 'admin'): ActivityArchive {
    const activity = activities.value.find(a => a.id === activityId)
    if (!activity) throw new Error('Activity not found')

    const existing = archives.value.find(a => a.activityId === activityId)
    if (existing && existing.archiveStatus === 'archived') {
      return existing
    }

    const archive: ActivityArchive = {
      id: generateId('archive'),
      activityId,
      activitySnapshot: JSON.parse(JSON.stringify(activity)),
      statisticsSnapshot: statistics.value[activityId]
        ? JSON.parse(JSON.stringify(statistics.value[activityId]))
        : null,
      eventsSnapshot: events.value.filter(e => e.activityId === activityId).map(e => ({ ...e })),
      logsSnapshot: logs.value.filter(l => l.activityId === activityId).map(l => ({ ...l })),
      aggregatedSnapshot: getAggregatedStatistics(activityId, 30),
      archiveStatus: 'archiving',
      archivedBy,
      archiveSize: 0,
    }

    const archiveDataStr = JSON.stringify(archive)
    archive.archiveSize = new Blob([archiveDataStr]).size

    archives.value.unshift(archive)
    activity.archiveStatus = 'archiving'

    setTimeout(() => {
      const archiveRef = archives.value.find(a => a.id === archive.id)
      if (!archiveRef) return

      archiveRef.archiveStatus = 'archived'
      archiveRef.archivedAt = Date.now()

      const activityRef = activities.value.find(a => a.id === activityId)
      if (activityRef) {
        activityRef.archiveStatus = 'archived'
        activityRef.status = 'archived'
        activityRef.updatedAt = Date.now()
      }

      events.value = events.value.filter(e => e.activityId !== activityId)
      logs.value = logs.value.filter(l => l.activityId !== activityId)
      delete statistics.value[activityId]

      addLog({
        activityId,
        playerId: 'admin',
        eventType: 'view',
        metadata: { action: 'archive_activity', archiveId: archive.id, archivedBy },
      })
    }, 2000)

    return archive
  }

  function getArchive(activityId: string): ActivityArchive | null {
    return archives.value.find(a => a.activityId === activityId) || null
  }

  function restoreFromArchive(activityId: string): boolean {
    const archive = archives.value.find(a => a.activityId === activityId)
    if (!archive || archive.archiveStatus !== 'archived') return false

    const restoredActivity = JSON.parse(JSON.stringify(archive.activitySnapshot))
    restoredActivity.archiveStatus = undefined
    restoredActivity.status = 'ended'
    restoredActivity.updatedAt = Date.now()

    const index = activities.value.findIndex(a => a.id === activityId)
    if (index !== -1) {
      activities.value[index] = restoredActivity
    } else {
      activities.value.push(restoredActivity)
    }

    if (archive.statisticsSnapshot) {
      statistics.value[activityId] = JSON.parse(JSON.stringify(archive.statisticsSnapshot))
    }

    archive.eventsSnapshot.forEach(e => {
      if (!events.value.find(ex => ex.id === e.id)) {
        events.value.push({ ...e })
      }
    })

    archive.logsSnapshot.forEach(l => {
      if (!logs.value.find(lx => lx.id === l.id)) {
        logs.value.unshift({ ...l })
      }
    })

    addLog({
      activityId,
      playerId: 'admin',
      eventType: 'view',
      metadata: { action: 'restore_from_archive' },
    })

    return true
  }

  function exportArchive(activityId: string): string | null {
    const archive = archives.value.find(a => a.activityId === activityId)
    if (!archive) return null

    const exportData = {
      archive: {
        id: archive.id,
        activityId: archive.activityId,
        archivedAt: archive.archivedAt,
        archivedBy: archive.archivedBy,
        archiveSize: archive.archiveSize,
      },
      activity: archive.activitySnapshot,
      statistics: archive.statisticsSnapshot,
      aggregated: archive.aggregatedSnapshot,
      eventCount: archive.eventsSnapshot.length,
      logCount: archive.logsSnapshot.length,
      exportedAt: Date.now(),
    }

    return JSON.stringify(exportData, null, 2)
  }

  let lifecycleTimer: ReturnType<typeof setInterval> | null = null

  function resolveGameStores() {
    try {
      const gameStore = (globalThis as any).__pinia_gameStore as any
      const charStore = (globalThis as any).__pinia_charStore as any
      const shopStore = (globalThis as any).__pinia_shopStore as any
      if (gameStore) return { gameStore, charStore, shopStore }
    } catch {}
    return null
  }

  function getPlayerSnapshot(playerId: string): Record<string, number | string | boolean> {
    const snapshot: Record<string, number | string | boolean> = {}

    const stores = resolveGameStores()
    if (!stores) {
      snapshot.player_level = 0
      snapshot.player_vip = 0
      snapshot.login_days = 1
      snapshot.order_count = 0
      snapshot.total_payment = 0
      snapshot.first_login = false
      return snapshot
    }

    const { gameStore, charStore, shopStore } = stores

    const char = charStore?.activeCharacter
    snapshot.player_level = char?.level ?? 0
    snapshot.login_days = gameStore?.day ?? 1
    snapshot.order_count = gameStore?.stats?.totalOrdersCompleted ?? 0
    snapshot.total_payment = charStore?.totalSpent?.money ?? 0
    snapshot.first_login = gameStore?.gameStarted ?? false

    if (char) {
      const findAttr = (type: string) => char.currentAttributes?.find((a: any) => a.type === type)
      snapshot.player_vip = char.level
      snapshot.attribute_efficiency = findAttr('efficiency')?.value ?? 0
      snapshot.attribute_luck = findAttr('luck')?.value ?? 0
      snapshot.attribute_money = findAttr('money')?.value ?? 0
      snapshot.attribute_reputation = findAttr('reputation')?.value ?? 0
      snapshot.attribute_sanity = findAttr('sanity')?.value ?? 0
    } else {
      snapshot.player_vip = 0
    }

    if (shopStore) {
      const hist: Record<string, number> = shopStore.purchaseHistory ?? {}
      const totalPurchases = Object.values(hist).reduce(
        (s, v) => s + (v || 0), 0,
      )
      snapshot.shop_purchase_count = totalPurchases
    }

    snapshot.money = gameStore?.stats?.money ?? 0
    snapshot.reputation = gameStore?.stats?.reputation ?? 0
    snapshot.sanity = gameStore?.stats?.sanity ?? 0
    snapshot.total_relics = gameStore?.stats?.totalRelicsProcessed ?? 0

    return snapshot
  }

  function registerGameStores(gameStore: any, charStore: any, shopStore: any) {
    (globalThis as any).__pinia_gameStore = gameStore
    (globalThis as any).__pinia_charStore = charStore
    (globalThis as any).__pinia_shopStore = shopStore
  }

  function initLifecycle() {
    if (lifecycleTimer) return

    lifecycleTimer = setInterval(() => {
      runLifecycleTick()
    }, 60 * 1000)

    runLifecycleTick()
  }

  function stopLifecycle() {
    if (lifecycleTimer) {
      clearInterval(lifecycleTimer)
      lifecycleTimer = null
    }
  }

  function runLifecycleTick() {
    const now = Date.now()
    const playerData = getPlayerSnapshot('current_player')

    const activitiesToCheck = activities.value.filter(
      a => a.status === 'active' || a.status === 'paused',
    )

    for (const activity of activitiesToCheck) {
      if (activity.config.schedule.endTime <= now) {
        endActivity(activity.id)
        continue
      }

      checkStageUnlocks(activity.id, playerData)
    }

    for (const activity of activities.value) {
      if (activity.status === 'ended' && !activity.archiveStatus) {
        archiveActivity(activity.id, 'system')
      }
    }
  }

  function onPlayerEvent(eventType: string, extraData: Record<string, any> = {}) {
    const playerData = getPlayerSnapshot('current_player')

    for (const key of Object.keys(extraData)) {
      playerData[key] = extraData[key]
    }

    const activeIds = activities.value
      .filter(a => a.status === 'active')
      .map(a => a.id)

    for (const id of activeIds) {
      const activityStages = stages.value[id]
      if (!activityStages) continue

      const hasConditionStages = activityStages.some(
        s => !s.isUnlocked && s.unlockType === 'condition',
      )
      if (!hasConditionStages) continue

      checkStageUnlocks(id, playerData)
    }
  }

  function clearStorage() {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key))
    activities.value = [...mockActivities]
    events.value = generateMockEvents()
    logs.value = [...mockLogs]
    statistics.value = { ...mockStatistics }
    stages.value = {}
    reissueRecords.value = []
    archives.value = []
  }

  return {
    templates,
    activities,
    currentActivity,
    statistics,
    logs,
    events,
    loading,
    stages,
    reissueRecords,
    archives,
    activeActivities,
    draftActivities,
    pendingActivities,
    endedActivities,
    archivedActivities,
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
    getCountdownInfo,
    getActivitiesWithWarnings,
    addStage,
    updateStage,
    removeStage,
    unlockStage,
    checkStageUnlocks,
    getStages,
    validateConditions,
    reissueReward,
    processReissue,
    retryReissue,
    batchReissueRewards,
    getReissueRecords,
    archiveActivity,
    getArchive,
    restoreFromArchive,
    exportArchive,
    initLifecycle,
    stopLifecycle,
    getPlayerSnapshot,
    registerGameStores,
    onPlayerEvent,
    clearStorage,
  }
})
