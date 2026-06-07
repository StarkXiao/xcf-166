<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div class="flex gap-2">
          <button
            v-for="tab in statusTabs"
            :key="tab.value"
            @click="currentStatus = tab.value"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            :class="currentStatus === tab.value
              ? 'bg-purple-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'"
          >
            {{ tab.label }}
            <span class="ml-2 px-2 py-0.5 text-xs rounded-full"
              :class="currentStatus === tab.value ? 'bg-purple-500' : 'bg-gray-600'"
            >
              {{ getStatusCount(tab.value) }}
            </span>
          </button>
        </div>
      </div>
      <button
        @click="showCreateModal = true"
        class="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
      >
        <Plus class="w-4 h-4" />
        新建活动
      </button>
    </div>

    <div class="grid grid-cols-4 gap-4">
      <div class="bg-gray-800 rounded-xl p-5 border border-gray-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-400">进行中活动</p>
            <p class="text-2xl font-bold text-green-400 mt-1">{{ activityStore.activeActivities.length }}</p>
          </div>
          <div class="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
            <Play class="w-6 h-6 text-green-400" />
          </div>
        </div>
      </div>
      <div class="bg-gray-800 rounded-xl p-5 border border-gray-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-400">待审核</p>
            <p class="text-2xl font-bold text-yellow-400 mt-1">{{ activityStore.pendingActivities.length }}</p>
          </div>
          <div class="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
            <Clock class="w-6 h-6 text-yellow-400" />
          </div>
        </div>
      </div>
      <div class="bg-gray-800 rounded-xl p-5 border border-gray-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-400">草稿</p>
            <p class="text-2xl font-bold text-gray-400 mt-1">{{ activityStore.draftActivities.length }}</p>
          </div>
          <div class="w-12 h-12 rounded-lg bg-gray-500/20 flex items-center justify-center">
            <FileText class="w-6 h-6 text-gray-400" />
          </div>
        </div>
      </div>
      <div class="bg-gray-800 rounded-xl p-5 border border-gray-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-400">已结束</p>
            <p class="text-2xl font-bold text-red-400 mt-1">{{ activityStore.endedActivities.length }}</p>
          </div>
          <div class="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
            <Square class="w-6 h-6 text-red-400" />
          </div>
        </div>
      </div>
    </div>

    <div class="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-700/50">
          <tr>
            <th class="px-6 py-4 text-left text-sm font-medium text-gray-300">活动名称</th>
            <th class="px-6 py-4 text-left text-sm font-medium text-gray-300">模板类型</th>
            <th class="px-6 py-4 text-left text-sm font-medium text-gray-300">状态</th>
            <th class="px-6 py-4 text-left text-sm font-medium text-gray-300">时间范围</th>
            <th class="px-6 py-4 text-left text-sm font-medium text-gray-300">优先级</th>
            <th class="px-6 py-4 text-left text-sm font-medium text-gray-300">创建人</th>
            <th class="px-6 py-4 text-right text-sm font-medium text-gray-300">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-700">
          <tr
            v-for="activity in filteredActivities"
            :key="activity.id"
            class="hover:bg-gray-700/30 transition-colors"
          >
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                  <component :is="getTemplateIcon(activity.config.templateId)" class="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p class="font-medium text-white">{{ activity.config.name }}</p>
                  <p class="text-xs text-gray-400">{{ activity.id }}</p>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 text-sm text-gray-300">
              {{ getTemplateName(activity.config.templateId) }}
            </td>
            <td class="px-6 py-4">
              <span
                class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
                :class="statusStyles[activity.status]"
              >
                <component :is="statusIcons[activity.status]" class="w-3 h-3" />
                {{ statusLabels[activity.status] }}
              </span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-300">
              <div>
                <p>{{ formatDate(activity.config.schedule.startTime) }}</p>
                <p class="text-gray-500">至 {{ formatDate(activity.config.schedule.endTime) }}</p>
              </div>
            </td>
            <td class="px-6 py-4">
              <span class="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300">
                P{{ activity.config.priority }}
              </span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-300">{{ activity.createdBy }}</td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-2">
                <button
                  @click="editActivity(activity.id)"
                  class="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  title="编辑"
                >
                  <Edit2 class="w-4 h-4" />
                </button>
                <button
                  @click="viewStatistics(activity.id)"
                  class="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded-lg transition-colors"
                  title="数据统计"
                >
                  <BarChart3 class="w-4 h-4" />
                </button>
                <div class="relative" v-if="activity.status === 'active' || activity.status === 'paused'">
                  <button
                    @click="toggleActivity(activity)"
                    class="p-2 text-gray-400 hover:text-yellow-400 hover:bg-gray-700 rounded-lg transition-colors"
                    :title="activity.status === 'active' ? '暂停' : '恢复'"
                  >
                    <component :is="activity.status === 'active' ? Pause : Play" class="w-4 h-4" />
                  </button>
                </div>
                <button
                  v-if="activity.status === 'pending'"
                  @click="approveActivity(activity.id)"
                  class="p-2 text-gray-400 hover:text-green-400 hover:bg-gray-700 rounded-lg transition-colors"
                  title="审核通过"
                >
                  <Check class="w-4 h-4" />
                </button>
                <button
                  v-if="activity.status === 'draft'"
                  @click="submitActivity(activity.id)"
                  class="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded-lg transition-colors"
                  title="提交审核"
                >
                  <Send class="w-4 h-4" />
                </button>
                <button
                  @click="deleteActivity(activity.id)"
                  class="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                  title="删除"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="showCreateModal"
      class="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      @click.self="showCreateModal = false"
    >
      <div class="bg-gray-800 rounded-2xl w-full max-w-2xl border border-gray-700 overflow-hidden">
        <div class="p-6 border-b border-gray-700 flex items-center justify-between">
          <h3 class="text-lg font-semibold">选择活动模板</h3>
          <button
            @click="showCreateModal = false"
            class="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-2 gap-4">
            <div
              v-for="template in activityStore.templates"
              :key="template.id"
              @click="selectTemplate(template.id)"
              class="p-5 bg-gray-700/50 rounded-xl border-2 border-transparent hover:border-purple-500 cursor-pointer transition-all group"
            >
              <div class="flex items-center gap-4 mb-3">
                <div class="w-12 h-12 rounded-lg bg-purple-600/20 flex items-center justify-center group-hover:bg-purple-600/40 transition-colors">
                  <component :is="getTemplateIconComponent(template.icon)" class="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h4 class="font-medium text-white">{{ template.name }}</h4>
                  <p class="text-xs text-gray-400">{{ template.type }}</p>
                </div>
              </div>
              <p class="text-sm text-gray-400">{{ template.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Plus,
  Play,
  Pause,
  Square,
  Clock,
  FileText,
  Edit2,
  Trash2,
  BarChart3,
  Check,
  Send,
  X,
  Trophy,
  Calendar,
  CheckSquare,
  Gift,
  ShoppingBag,
  Layout,
} from 'lucide-vue-next'
import { useActivityStore } from '@/stores/activityStore'
import type { ActivityStatus, Activity } from '@/types/activity'

const router = useRouter()
const activityStore = useActivityStore()

const currentStatus = ref<string>('all')
const showCreateModal = ref(false)

const statusTabs = [
  { label: '全部', value: 'all' },
  { label: '进行中', value: 'active' },
  { label: '待审核', value: 'pending' },
  { label: '草稿', value: 'draft' },
  { label: '已结束', value: 'ended' },
]

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

const statusIcons: Record<ActivityStatus, any> = {
  draft: FileText,
  pending: Clock,
  active: Play,
  paused: Pause,
  ended: Square,
  cancelled: Square,
}

const filteredActivities = computed(() => {
  if (currentStatus.value === 'all') {
    return activityStore.activities
  }
  return activityStore.activities.filter(a => a.status === currentStatus.value)
})

function getStatusCount(status: string) {
  if (status === 'all') return activityStore.activities.length
  return activityStore.activities.filter(a => a.status === status).length
}

function getTemplateName(templateId: string) {
  const template = activityStore.getTemplateById(templateId)
  return template?.name || '未知模板'
}

function getTemplateIcon(templateId: string) {
  const template = activityStore.getTemplateById(templateId)
  return getTemplateIconComponent(template?.icon || 'Layout')
}

function getTemplateIconComponent(iconName: string) {
  const icons: Record<string, any> = {
    Trophy,
    Calendar,
    CheckSquare,
    Gift,
    ShoppingBag,
    Layout,
  }
  return icons[iconName] || Layout
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function editActivity(id: string) {
  router.push(`/admin/activities/${id}`)
}

function viewStatistics(id: string) {
  router.push(`/admin/activities/${id}/statistics`)
}

function toggleActivity(activity: Activity) {
  if (activity.status === 'active') {
    activityStore.pauseActivity(activity.id)
  } else if (activity.status === 'paused') {
    activityStore.resumeActivity(activity.id)
  }
}

function approveActivity(id: string) {
  if (confirm('确定要审核通过此活动吗？')) {
    activityStore.approveActivity(id)
  }
}

function submitActivity(id: string) {
  if (confirm('确定要提交审核吗？')) {
    activityStore.submitForApproval(id)
  }
}

function deleteActivity(id: string) {
  if (confirm('确定要删除此活动吗？此操作不可撤销。')) {
    activityStore.deleteActivity(id)
  }
}

function selectTemplate(templateId: string) {
  const newActivity = activityStore.createActivity(templateId)
  showCreateModal.value = false
  router.push(`/admin/activities/${newActivity.id}`)
}
</script>
