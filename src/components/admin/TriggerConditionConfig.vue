<template>
  <div class="bg-gray-800 rounded-xl border border-gray-700 p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold flex items-center gap-2">
        <Zap class="w-5 h-5 text-purple-400" />
        条件触发配置
      </h3>
      <button
        @click="addCondition"
        class="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
      >
        <Plus class="w-4 h-4" />
        添加条件
      </button>
    </div>

    <div class="space-y-4">
      <div
        v-for="condition in localModel.conditions"
        :key="condition.id"
        class="p-4 bg-gray-700/50 rounded-lg border border-gray-600"
      >
        <div class="flex items-start gap-4">
          <div class="flex-1 grid grid-cols-4 gap-3">
            <div>
              <label class="block text-xs text-gray-400 mb-1">条件类型</label>
              <select
                v-model="condition.type"
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
              >
                <option v-for="type in conditionTypes" :key="type.value" :value="type.value">
                  {{ type.label }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-gray-400 mb-1">比较符</label>
              <select
                v-model="condition.operator"
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
              >
                <option v-for="op in operators" :key="op.value" :value="op.value">
                  {{ op.label }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-gray-400 mb-1">目标值</label>
              <input
                v-if="condition.operator !== 'between'"
                v-model="condition.value"
                type="text"
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
                placeholder="输入值"
              />
              <div v-else class="flex gap-2">
                <input
                  v-model="condition.value[0]"
                  type="number"
                  class="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
                  placeholder="最小值"
                />
                <input
                  v-model="condition.value[1]"
                  type="number"
                  class="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
                  placeholder="最大值"
                />
              </div>
            </div>
            <div>
              <label class="block text-xs text-gray-400 mb-1">逻辑关系</label>
              <select
                v-model="localModel.logic"
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
              >
                <option value="AND">AND (全部满足)</option>
                <option value="OR">OR (任一满足)</option>
              </select>
            </div>
          </div>
          <button
            @click="removeCondition(condition.id)"
            class="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded-lg transition-colors"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
        <div class="mt-3">
          <input
            v-model="condition.description"
            type="text"
            class="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-purple-500"
            placeholder="条件描述（可选，用于备注说明）"
          />
        </div>
      </div>

      <div
        v-if="localModel.conditions.length === 0"
        class="py-12 text-center border-2 border-dashed border-gray-600 rounded-lg"
      >
        <Filter class="w-12 h-12 text-gray-500 mx-auto mb-3" />
        <p class="text-gray-400 mb-2">暂无触发条件</p>
        <p class="text-sm text-gray-500">点击上方"添加条件"按钮设置活动触发条件</p>
        <p class="text-xs text-gray-600 mt-2">不设置条件则所有用户都可以参与</p>
      </div>

      <div v-if="localModel.conditions.length > 0" class="p-4 bg-purple-900/20 rounded-lg border border-purple-700/50">
        <div class="flex items-start gap-3">
          <Info class="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
          <div class="text-sm">
            <p class="text-purple-300 font-medium mb-1">条件预览</p>
            <p class="text-gray-400">{{ conditionPreview }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, watch } from 'vue'
import { Zap, Plus, Trash2, Filter, Info } from 'lucide-vue-next'
import type { ConditionGroup, TriggerCondition } from '@/types/activity'
import { useActivityStore } from '@/stores/activityStore'

const props = defineProps<{
  modelValue: ConditionGroup
}>()

const emit = defineEmits<{
  'update:modelValue': [value: ConditionGroup]
}>()

const activityStore = useActivityStore()

const localModel = reactive<ConditionGroup>({ ...props.modelValue, conditions: [...props.modelValue.conditions] })

const conditionTypes = [
  { value: 'player_level', label: '玩家等级' },
  { value: 'player_vip', label: 'VIP等级' },
  { value: 'login_days', label: '登录天数' },
  { value: 'order_count', label: '订单数量' },
  { value: 'total_payment', label: '累计充值' },
  { value: 'first_login', label: '首次登录' },
  { value: 'date_range', label: '日期范围' },
  { value: 'custom_event', label: '自定义事件' },
]

const operators = [
  { value: 'gt', label: '大于 (>)' },
  { value: 'gte', label: '大于等于 (>=)' },
  { value: 'lt', label: '小于 (<)' },
  { value: 'lte', label: '小于等于 (<=)' },
  { value: 'eq', label: '等于 (=)' },
  { value: 'ne', label: '不等于 (!=)' },
  { value: 'between', label: '区间内' },
  { value: 'contains', label: '包含' },
]

watch(
  () => props.modelValue,
  (val) => {
    Object.assign(localModel, val)
    localModel.conditions = [...val.conditions]
  },
  { deep: true }
)

watch(
  localModel,
  (val) => {
    emit('update:modelValue', { ...val, conditions: [...val.conditions] })
  },
  { deep: true }
)

function addCondition() {
  const newCondition: TriggerCondition = {
    id: activityStore.generateId('cond'),
    type: 'player_level',
    operator: 'gte',
    value: 1,
    description: '',
  }
  localModel.conditions.push(newCondition)
}

function removeCondition(id: string) {
  const index = localModel.conditions.findIndex(c => c.id === id)
  if (index > -1) {
    localModel.conditions.splice(index, 1)
  }
}

const conditionPreview = computed(() => {
  if (localModel.conditions.length === 0) {
    return '不设置触发条件，所有用户均可参与活动'
  }

  const logicText = localModel.logic === 'AND' ? '且' : '或'
  const conditions = localModel.conditions.map(c => {
    const typeLabel = conditionTypes.find(t => t.value === c.type)?.label || c.type
    const opLabel = operators.find(o => o.value === c.operator)?.label || c.operator
    
    if (c.operator === 'between' && Array.isArray(c.value)) {
      return `${typeLabel} ${opLabel} [${c.value[0]}, ${c.value[1]}]`
    }
    return `${typeLabel} ${opLabel} ${c.value}`
  })

  return `活动触发条件：${conditions.join(` ${logicText} `)}`
})
</script>
