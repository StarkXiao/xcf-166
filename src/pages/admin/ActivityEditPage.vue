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
          <h2 class="text-xl font-semibold">{{ activity?.config.name || '新建活动' }}</h2>
          <p class="text-sm text-gray-400">{{ activityId ? `活动ID: ${activityId}` : '' }}</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <button
          v-if="activity?.status === 'draft'"
          @click="saveActivity"
          class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          保存草稿
        </button>
        <button
          v-if="activity?.status === 'draft'"
          @click="submitForApproval"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          提交审核
        </button>
        <button
          v-if="activity?.status === 'pending'"
          @click="approve"
          class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          审核通过
        </button>
        <button
          v-if="activity?.status === 'active' || activity?.status === 'paused'"
          @click="toggleStatus"
          class="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
        >
          {{ activity?.status === 'active' ? '暂停活动' : '恢复活动' }}
        </button>
        <button
          v-if="activity?.status === 'active' || activity?.status === 'paused'"
          @click="endActivity"
          class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          结束活动
        </button>
      </div>
    </div>

    <div v-if="activity" class="flex gap-4">
      <div class="flex-1 space-y-6">
        <div class="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText class="w-5 h-5 text-purple-400" />
            基本信息
          </h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">活动名称</label>
              <input
                v-model="activity.config.name"
                type="text"
                class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                placeholder="请输入活动名称"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">优先级</label>
              <input
                v-model.number="activity.config.priority"
                type="number"
                min="1"
                max="100"
                class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-300 mb-2">活动描述</label>
              <textarea
                v-model="activity.config.description"
                rows="3"
                class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 resize-none"
                placeholder="请输入活动描述"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">活动Banner图片URL</label>
              <input
                v-model="activity.config.bannerImage"
                type="text"
                class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                placeholder="可选"
              />
            </div>
          </div>
        </div>

        <TimeScheduleConfig
          :model-value="activity.config.schedule"
          @update:model-value="updateSchedule"
        />

        <TriggerConditionConfig
          :model-value="activity.config.triggerConditions"
          @update:model-value="updateTriggerConditions"
        />

        <RewardRuleConfig
          :model-value="activity.config.rewardRules"
          @update:model-value="updateRewardRules"
        />

        <PageConfigEditor
          :model-value="activity.config.pageConfig"
          @update:model-value="updatePageConfig"
        />
      </div>

      <div class="w-72 space-y-6">
        <div class="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <h3 class="text-sm font-semibold text-gray-400 mb-4">活动状态</h3>
          <div class="flex items-center gap-3 mb-4">
            <span
              class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
              :class="statusStyles[activity.status]"
            >
              <component :is="statusIcons[activity.status]" class="w-3 h-3" />
              {{ statusLabels[activity.status] }}
            </span>
          </div>
          <div class="space-y-3 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-400">创建人</span>
              <span class="text-white">{{ activity.createdBy }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">创建时间</span>
              <span class="text-white">{{ formatDate(activity.createdAt) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">更新时间</span>
              <span class="text-white">{{ formatDate(activity.updatedAt) }}</span>
            </div>
            <div v-if="activity.approvedBy" class="flex justify-between">
              <span class="text-gray-400">审核人</span>
              <span class="text-white">{{ activity.approvedBy }}</span>
            </div>
          </div>
        </div>

        <div class="bg-gray-800 rounded-xl border border-gray-700 border-dashed p-5">
          <h3 class="text-sm font-semibold text-gray-400 mb-4">目标人群</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-xs text-gray-500 mb-1">玩家等级范围</label>
              <div class="flex gap-2">
                <input
                  v-model.number="playerLevelMin"
                  type="number"
                  placeholder="最低"
                  class="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-purple-500"
                />
                <span class="text-gray-500 flex items-center">-</span>
                <input
                  v-model.number="playerLevelMax"
                  type="number"
                  placeholder="最高"
                  class="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">VIP等级范围</label>
              <div class="flex gap-2">
                <input
                  v-model.number="vipLevelMin"
                  type="number"
                  placeholder="最低"
                  class="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-purple-500"
                />
                <span class="text-gray-500 flex items-center">-</span>
                <input
                  v-model.number="vipLevelMax"
                  type="number"
                  placeholder="最高"
                  class="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">用户标签</label>
              <input
                v-model="audienceTags"
                type="text"
                placeholder="多个标签用逗号分隔"
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, FileText, Play, Pause, Square, Clock, FileText as FileTextIcon } from 'lucide-vue-next'
import { useActivityStore } from '@/stores/activityStore'
import type { ActivityStatus, TimeSchedule, ConditionGroup, RewardRule, PageConfig } from '@/types/activity'
import TimeScheduleConfig from '@/components/admin/TimeScheduleConfig.vue'
import TriggerConditionConfig from '@/components/admin/TriggerConditionConfig.vue'
import RewardRuleConfig from '@/components/admin/RewardRuleConfig.vue'
import PageConfigEditor from '@/components/admin/PageConfigEditor.vue'

const route = useRoute()
const router = useRouter()
const activityStore = useActivityStore()

const activityId = computed(() => route.params.id as string)
const activity = ref(activityStore.getActivityById(activityId.value))

const audienceTags = ref('')
const playerLevelMin = ref<number | undefined>(undefined)
const playerLevelMax = ref<number | undefined>(undefined)
const vipLevelMin = ref<number | undefined>(undefined)
const vipLevelMax = ref<number | undefined>(undefined)

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
  draft: FileTextIcon,
  pending: Clock,
  active: Play,
  paused: Pause,
  ended: Square,
  cancelled: Square,
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function goBack() {
  router.push('/admin/activities')
}

function updateSchedule(schedule: TimeSchedule) {
  if (activity.value) {
    activity.value.config.schedule = schedule
  }
}

function updateTriggerConditions(conditions: ConditionGroup) {
  if (activity.value) {
    activity.value.config.triggerConditions = conditions
  }
}

function updateRewardRules(rules: RewardRule[]) {
  if (activity.value) {
    activity.value.config.rewardRules = rules
  }
}

function updatePageConfig(config: PageConfig) {
  if (activity.value) {
    activity.value.config.pageConfig = config
  }
}

function saveActivity() {
  if (activity.value) {
    activityStore.updateActivity(activity.value.id, { config: activity.value.config })
    alert('保存成功！')
  }
}

function submitForApproval() {
  if (activity.value && confirm('确定要提交审核吗？')) {
    activityStore.submitForApproval(activity.value.id)
    alert('已提交审核！')
  }
}

function approve() {
  if (activity.value && confirm('确定要审核通过此活动吗？')) {
    activityStore.approveActivity(activity.value.id)
    alert('活动已上线！')
  }
}

function toggleStatus() {
  if (!activity.value) return
  if (activity.value.status === 'active') {
    if (confirm('确定要暂停此活动吗？')) {
      activityStore.pauseActivity(activity.value.id)
    }
  } else if (activity.value.status === 'paused') {
    activityStore.resumeActivity(activity.value.id)
  }
}

function endActivity() {
  if (activity.value && confirm('确定要结束此活动吗？此操作不可撤销。')) {
    activityStore.endActivity(activity.value.id)
  }
}

watch(
  () => activity.value,
  (act) => {
    if (act) {
      audienceTags.value = act.config.audience.tags?.join(', ') || ''
      playerLevelMin.value = act.config.audience.playerLevel?.[0]
      playerLevelMax.value = act.config.audience.playerLevel?.[1]
      vipLevelMin.value = act.config.audience.vipLevel?.[0]
      vipLevelMax.value = act.config.audience.vipLevel?.[1]
    }
  },
  { immediate: true }
)

watch(audienceTags, (val) => {
  if (activity.value) {
    activity.value.config.audience.tags = val
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t)
  }
})

watch([playerLevelMin, playerLevelMax], ([min, max]) => {
  if (activity.value) {
    if (min !== undefined || max !== undefined) {
      activity.value.config.audience.playerLevel = [
        min ?? 1,
        max ?? 999,
      ]
    } else {
      delete activity.value.config.audience.playerLevel
    }
  }
})

watch([vipLevelMin, vipLevelMax], ([min, max]) => {
  if (activity.value) {
    if (min !== undefined || max !== undefined) {
      activity.value.config.audience.vipLevel = [
        min ?? 1,
        max ?? 999,
      ]
    } else {
      delete activity.value.config.audience.vipLevel
    }
  }
})

onMounted(() => {
  if (!activity.value) {
    router.push('/admin/activities')
  }
})
</script>
