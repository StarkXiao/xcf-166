<template>
  <div class="bg-gray-800 rounded-xl border border-gray-700 p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold flex items-center gap-2">
        <Gift class="w-5 h-5 text-purple-400" />
        奖励规则配置
      </h3>
      <button
        @click="addRule"
        class="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
      >
        <Plus class="w-4 h-4" />
        添加规则
      </button>
    </div>

    <div class="space-y-4">
      <div
        v-for="rule in localModel"
        :key="rule.id"
        class="p-4 bg-gray-700/50 rounded-lg border border-gray-600"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-purple-600/30 flex items-center justify-center text-purple-400 font-semibold text-sm">
              {{ getRuleIndex(rule.id) }}
            </div>
            <input
              v-model="rule.name"
              type="text"
              class="bg-transparent text-white font-semibold focus:outline-none focus:border-b border-purple-500"
              placeholder="规则名称"
            />
            <span class="px-2 py-0.5 text-xs rounded bg-gray-600 text-gray-300">
              优先级 {{ rule.priority }}
            </span>
          </div>
          <button
            @click="removeRule(rule.id)"
            class="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded-lg transition-colors"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>

        <div class="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label class="block text-xs text-gray-400 mb-1">规则描述</label>
            <input
              v-model="rule.description"
              type="text"
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
              placeholder="规则描述"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1">领取限制</label>
            <div class="flex gap-2">
              <select
                v-model="rule.limitType"
                class="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
              >
                <option value="unlimited">无限制</option>
                <option value="daily">每日限制</option>
                <option value="weekly">每周限制</option>
                <option value="total">总限制</option>
              </select>
              <input
                v-if="rule.limitType !== 'unlimited'"
                v-model.number="rule.limitCount"
                type="number"
                min="1"
                class="w-20 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
                placeholder="次数"
              />
            </div>
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1">优先级</label>
            <input
              v-model.number="rule.priority"
              type="number"
              min="1"
              max="100"
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <label class="text-xs text-gray-400">触发条件</label>
            <button
              @click="addConditionToRule(rule)"
              class="text-xs text-purple-400 hover:text-purple-300"
            >
              + 添加条件
            </button>
          </div>
          <div class="space-y-2">
            <div
              v-for="cond in rule.conditions.conditions"
              :key="cond.id"
              class="flex items-center gap-2 p-2 bg-gray-600/50 rounded"
            >
              <select
                v-model="cond.type"
                class="px-2 py-1 bg-gray-700 border border-gray-500 rounded text-xs text-white"
              >
                <option v-for="t in conditionTypes" :key="t.value" :value="t.value">
                  {{ t.label }}
                </option>
              </select>
              <select
                v-model="cond.operator"
                class="px-2 py-1 bg-gray-700 border border-gray-500 rounded text-xs text-white"
              >
                <option v-for="op in operators" :key="op.value" :value="op.value">
                  {{ op.label }}
                </option>
              </select>
              <input
                v-model="cond.value"
                type="text"
                class="flex-1 px-2 py-1 bg-gray-700 border border-gray-500 rounded text-xs text-white"
                placeholder="值"
              />
              <button
                @click="removeConditionFromRule(rule, cond.id)"
                class="p-1 text-gray-400 hover:text-red-400"
              >
                <X class="w-3 h-3" />
              </button>
            </div>
            <p v-if="rule.conditions.conditions.length === 0" class="text-xs text-gray-500">
              无条件限制，所有用户可领取
            </p>
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-xs text-gray-400">奖励内容</label>
            <button
              @click="addRewardToRule(rule)"
              class="text-xs text-purple-400 hover:text-purple-300"
            >
              + 添加奖励
            </button>
          </div>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="reward in rule.rewards"
              :key="reward.id"
              class="flex items-center gap-2 p-2 rounded-lg"
              :class="rarityStyles[reward.rarity]"
            >
              <div class="w-8 h-8 rounded bg-black/30 flex items-center justify-center">
                <component :is="getRewardIcon(reward.type)" class="w-4 h-4" />
              </div>
              <div class="flex-1 min-w-0">
                <input
                  v-model="reward.name"
                  type="text"
                  class="w-full bg-transparent text-xs font-medium text-white focus:outline-none"
                  placeholder="奖励名称"
                />
                <div class="flex items-center gap-1 text-xs text-gray-300">
                  <span>x</span>
                  <input
                    v-model.number="reward.count"
                    type="number"
                    min="1"
                    class="w-12 bg-transparent text-xs focus:outline-none"
                  />
                </div>
              </div>
              <select
                v-model="reward.rarity"
                class="px-2 py-1 bg-black/30 border-0 rounded text-xs text-white"
              >
                <option value="common">普通</option>
                <option value="uncommon">优秀</option>
                <option value="rare">稀有</option>
                <option value="epic">史诗</option>
                <option value="legendary">传说</option>
              </select>
              <button
                @click="removeRewardFromRule(rule, reward.id)"
                class="p-1 text-gray-400 hover:text-red-400"
              >
                <X class="w-3 h-3" />
              </button>
            </div>
            <p v-if="rule.rewards.length === 0" class="text-xs text-gray-500 py-2">
              暂无奖励配置
            </p>
          </div>
        </div>
      </div>

      <div
        v-if="localModel.length === 0"
        class="py-12 text-center border-2 border-dashed border-gray-600 rounded-lg"
      >
        <Gift class="w-12 h-12 text-gray-500 mx-auto mb-3" />
        <p class="text-gray-400 mb-2">暂无奖励规则</p>
        <p class="text-sm text-gray-500">点击上方"添加规则"按钮配置奖励规则</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Gift, Plus, Trash2, X, Coins, Package, Award, Crown, Star } from 'lucide-vue-next'
import type { RewardRule, RewardItem } from '@/types/activity'
import { useActivityStore } from '@/stores/activityStore'

const props = defineProps<{
  modelValue: RewardRule[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: RewardRule[]]
}>()

const activityStore = useActivityStore()

const localModel = ref<RewardRule[]>([...props.modelValue])

const conditionTypes = [
  { value: 'player_level', label: '玩家等级' },
  { value: 'login_days', label: '登录天数' },
  { value: 'order_count', label: '完成订单' },
  { value: 'total_payment', label: '累计充值' },
  { value: 'first_login', label: '首次登录' },
]

const operators = [
  { value: 'gte', label: '>=' },
  { value: 'lte', label: '<=' },
  { value: 'eq', label: '=' },
  { value: 'gt', label: '>' },
  { value: 'lt', label: '<' },
]

const rarityStyles: Record<string, string> = {
  common: 'bg-gray-700 border border-gray-600',
  uncommon: 'bg-green-900/30 border border-green-700',
  rare: 'bg-blue-900/30 border border-blue-700',
  epic: 'bg-purple-900/30 border border-purple-700',
  legendary: 'bg-yellow-900/30 border border-yellow-600',
}

watch(
  () => props.modelValue,
  (val) => {
    localModel.value = [...val]
  },
  { deep: true }
)

watch(
  localModel,
  (val) => {
    emit('update:modelValue', [...val])
  },
  { deep: true }
)

function getRuleIndex(id: string) {
  return localModel.value.findIndex(r => r.id === id) + 1
}

function getRewardIcon(type: string) {
  const icons: Record<string, any> = {
    currency: Coins,
    item: Package,
    badge: Award,
    title: Crown,
    season_exp: Star,
  }
  return icons[type] || Package
}

function addRule() {
  const newRule: RewardRule = {
    id: activityStore.generateId('rr'),
    name: '新奖励规则',
    description: '',
    priority: localModel.value.length + 1,
    limitType: 'total',
    limitCount: 1,
    conditions: {
      id: activityStore.generateId('rc'),
      logic: 'AND',
      conditions: [],
    },
    rewards: [],
  }
  localModel.value.push(newRule)
}

function removeRule(id: string) {
  const index = localModel.value.findIndex(r => r.id === id)
  if (index > -1) {
    localModel.value.splice(index, 1)
  }
}

function addConditionToRule(rule: RewardRule) {
  rule.conditions.conditions.push({
    id: activityStore.generateId('rc_c'),
    type: 'player_level',
    operator: 'gte',
    value: 1,
    description: '',
  })
}

function removeConditionFromRule(rule: RewardRule, condId: string) {
  const index = rule.conditions.conditions.findIndex(c => c.id === condId)
  if (index > -1) {
    rule.conditions.conditions.splice(index, 1)
  }
}

function addRewardToRule(rule: RewardRule) {
  const newReward: RewardItem = {
    id: activityStore.generateId('rw'),
    type: 'currency',
    name: '金币',
    icon: 'Coins',
    rarity: 'common',
    value: 1000,
    count: 1,
  }
  rule.rewards.push(newReward)
}

function removeRewardFromRule(rule: RewardRule, rewardId: string) {
  const index = rule.rewards.findIndex(r => r.id === rewardId)
  if (index > -1) {
    rule.rewards.splice(index, 1)
  }
}
</script>
