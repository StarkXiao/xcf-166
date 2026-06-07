import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Activity,
  ActivityTemplate,
  ActivityConfig,
  ActivityStatistics,
  ActivityLog,
  ActivityStatus,
} from '@/types/activity'
import { mockTemplates, mockActivities, mockStatistics, mockLogs } from '@/game/data/activityTemplates'

export const useActivityStore = defineStore('activity', () => {
  const templates = ref<ActivityTemplate[]>([...mockTemplates])
  const activities = ref<Activity[]>([...mockActivities])
  const currentActivity = ref<Activity | null>(null)
  const statistics = ref<Record<string, ActivityStatistics>>({ ...mockStatistics })
  const logs = ref<ActivityLog[]>([...mockLogs])
  const loading = ref(false)

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
  }

  function updateActivityConfig(id: string, configUpdates: Partial<ActivityConfig>) {
    const activity = activities.value.find(a => a.id === id)
    if (!activity) return

    activity.config = { ...activity.config, ...configUpdates }
    activity.updatedAt = Date.now()

    if (currentActivity.value?.id === id) {
      currentActivity.value = { ...activity }
    }
  }

  function deleteActivity(id: string) {
    const index = activities.value.findIndex(a => a.id === id)
    if (index !== -1) {
      activities.value.splice(index, 1)
      if (currentActivity.value?.id === id) {
        currentActivity.value = null
      }
    }
  }

  function updateActivityStatus(id: string, status: ActivityStatus) {
    const activity = activities.value.find(a => a.id === id)
    if (!activity) return

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

  return {
    templates,
    activities,
    currentActivity,
    statistics,
    logs,
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
  }
})
