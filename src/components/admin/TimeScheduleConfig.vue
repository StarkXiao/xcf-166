<template>
  <div class="bg-gray-800 rounded-xl border border-gray-700 p-6">
    <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
      <Clock class="w-5 h-5 text-purple-400" />
      时间投放配置
    </h3>

    <div class="space-y-5">
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-3">投放类型</label>
        <div class="flex gap-3">
          <button
            v-for="type in scheduleTypes"
            :key="type.value"
            @click="localModel.type = type.value"
            class="flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all border-2"
            :class="localModel.type === type.value
              ? 'border-purple-500 bg-purple-500/20 text-purple-300'
              : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'"
          >
            <component :is="type.icon" class="w-5 h-5 mx-auto mb-1" />
            {{ type.label }}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">开始时间</label>
          <input
            :value="formatDateTime(localModel.startTime)"
            @input="updateStartTime($event)"
            type="datetime-local"
            class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">结束时间</label>
          <input
            :value="formatDateTime(localModel.endTime)"
            @input="updateEndTime($event)"
            type="datetime-local"
            class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      <div v-if="localModel.type === 'recurring'" class="space-y-4 p-4 bg-gray-700/50 rounded-lg">
        <label class="block text-sm font-medium text-gray-300">重复规则</label>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs text-gray-400 mb-2">重复频率</label>
            <select
              v-model="recurringConfig.frequency"
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              <option value="daily">每天</option>
              <option value="weekly">每周</option>
              <option value="monthly">每月</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-2">时区</label>
            <select
              v-model="localModel.timezone"
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              <option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York (UTC-5)</option>
            </select>
          </div>
        </div>

        <div v-if="recurringConfig.frequency === 'weekly'" class="space-y-2">
          <label class="block text-xs text-gray-400">选择星期</label>
          <div class="flex gap-2">
            <button
              v-for="day in weekDays"
              :key="day.value"
              @click="toggleWeekday(day.value)"
              class="w-10 h-10 rounded-lg text-sm font-medium transition-all"
              :class="isWeekdaySelected(day.value)
                ? 'bg-purple-600 text-white'
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'"
            >
              {{ day.label }}
            </button>
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="block text-xs text-gray-400">投放时段</label>
            <button
              @click="addTimeSlot"
              class="text-xs text-purple-400 hover:text-purple-300"
            >
              + 添加时段
            </button>
          </div>
          <div
            v-for="(slot, index) in recurringConfig.times"
            :key="index"
            class="flex items-center gap-3"
          >
            <input
              v-model="slot.start"
              type="time"
              class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
            <span class="text-gray-400">-</span>
            <input
              v-model="slot.end"
              type="time"
              class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
            <button
              v-if="recurringConfig.times.length > 1"
              @click="removeTimeSlot(index)"
              class="p-1 text-gray-400 hover:text-red-400"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div v-else class="space-y-2">
        <label class="block text-xs text-gray-400">时区</label>
        <select
          v-model="localModel.timezone"
          class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
        >
          <option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</option>
          <option value="UTC">UTC</option>
          <option value="America/New_York">America/New_York (UTC-5)</option>
        </select>
      </div>

      <div class="p-4 bg-purple-900/20 rounded-lg border border-purple-700/50">
        <div class="flex items-start gap-3">
          <Info class="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
          <div class="text-sm">
            <p class="text-purple-300 font-medium mb-1">投放预览</p>
            <p class="text-gray-400">{{ schedulePreview }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { Clock, Calendar, Repeat, Zap, X, Info } from 'lucide-vue-next'
import type { TimeSchedule, ScheduleType } from '@/types/activity'

const props = defineProps<{
  modelValue: TimeSchedule
}>()

const emit = defineEmits<{
  'update:modelValue': [value: TimeSchedule]
}>()

const localModel = reactive<TimeSchedule>({ ...props.modelValue })

const scheduleTypes: Array<{ value: ScheduleType; label: string; icon: any }> = [
  { value: 'fixed', label: '固定时段', icon: Calendar },
  { value: 'recurring', label: '周期投放', icon: Repeat },
  { value: 'trigger', label: '触发投放', icon: Zap },
]

const weekDays = [
  { value: 0, label: '日' },
  { value: 1, label: '一' },
  { value: 2, label: '二' },
  { value: 3, label: '三' },
  { value: 4, label: '四' },
  { value: 5, label: '五' },
  { value: 6, label: '六' },
]

const recurringConfig = reactive({
  frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
  times: [{ start: '00:00', end: '23:59' }],
  weekdays: [1, 2, 3, 4, 5] as number[],
  days: [1] as number[],
})

watch(
  () => props.modelValue,
  (val) => {
    Object.assign(localModel, val)
    if (val.recurring) {
      recurringConfig.frequency = val.recurring.frequency
      recurringConfig.times = [...val.recurring.times]
      recurringConfig.weekdays = val.recurring.weekdays || [1, 2, 3, 4, 5]
      recurringConfig.days = val.recurring.days || [1]
    }
  },
  { deep: true }
)

watch(
  localModel,
  (val) => {
    if (localModel.type === 'recurring') {
      val.recurring = { ...recurringConfig }
    } else {
      delete val.recurring
    }
    emit('update:modelValue', { ...val })
  },
  { deep: true }
)

function formatDateTime(timestamp: number) {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function updateStartTime(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.value) {
    localModel.startTime = new Date(target.value).getTime()
  }
}

function updateEndTime(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.value) {
    localModel.endTime = new Date(target.value).getTime()
  }
}

function toggleWeekday(day: number) {
  const index = recurringConfig.weekdays.indexOf(day)
  if (index > -1) {
    recurringConfig.weekdays.splice(index, 1)
  } else {
    recurringConfig.weekdays.push(day)
    recurringConfig.weekdays.sort()
  }
}

function isWeekdaySelected(day: number) {
  return recurringConfig.weekdays.includes(day)
}

function addTimeSlot() {
  recurringConfig.times.push({ start: '00:00', end: '23:59' })
}

function removeTimeSlot(index: number) {
  recurringConfig.times.splice(index, 1)
}

const schedulePreview = computed(() => {
  const startStr = new Date(localModel.startTime).toLocaleString('zh-CN')
  const endStr = new Date(localModel.endTime).toLocaleString('zh-CN')

  if (localModel.type === 'fixed') {
    return `活动将从 ${startStr} 开始，至 ${endStr} 结束，全天开放。`
  } else if (localModel.type === 'recurring') {
    const freqText = { daily: '每天', weekly: '每周', monthly: '每月' }[recurringConfig.frequency]
    const timeSlots = recurringConfig.times.map(t => `${t.start}-${t.end}`).join('、')
    return `活动周期为 ${startStr} 至 ${endStr}，${freqText} ${timeSlots} 开放。`
  } else {
    return `活动将在满足触发条件后开放，持续至 ${endStr}。`
  }
})
</script>
