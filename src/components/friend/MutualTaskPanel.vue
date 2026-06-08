<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFriendStore } from '@/stores/friendStore'
import type { MutualTask, MutualTaskProgress } from '@/types/friend'
import { ListTodo, Users, Clock, Gift, ChevronRight, Check, Zap } from 'lucide-vue-next'

const props = defineProps<{
  friendId?: string
}>()

const friendStore = useFriendStore()

const showTaskSelectModal = ref(false)
const selectedTask = ref<MutualTask | null>(null)
const selectedHelper = ref<string | null>(null)

const taskTypeLabels: Record<string, string> = {
  order_help: '订单援助',
  relic_purify: '遗物净化',
  sanity_recover: '心灵慰藉',
  reputation_boost: '声望提携',
  money_gift: '资金拆借'
}

const rarityColors: Record<string, string> = {
  common: 'from-gray-500 to-gray-600',
  uncommon: 'from-green-500 to-emerald-600',
  rare: 'from-blue-500 to-cyan-600',
  epic: 'from-purple-500 to-violet-600',
  legendary: 'from-amber-500 to-orange-600'
}

const rarityBgColors: Record<string, string> = {
  common: 'bg-gray-500/20 text-gray-400',
  uncommon: 'bg-green-500/20 text-green-400',
  rare: 'bg-blue-500/20 text-blue-400',
  epic: 'bg-purple-500/20 text-purple-400',
  legendary: 'bg-amber-500/20 text-amber-400'
}

const rarityGradientClasses: Record<string, string> = {
  common: 'from-gray-500 to-gray-600',
  uncommon: 'from-green-500 to-emerald-600',
  rare: 'from-blue-500 to-cyan-600',
  epic: 'from-purple-500 to-violet-600',
  legendary: 'from-amber-500 to-orange-600'
}

const availableHelpers = computed(() => {
  if (props.friendId) {
    const friend = friendStore.getFriendById(props.friendId)
    return friend ? [friend] : []
  }
  return friendStore.acceptedFriends
})

const displayedTasks = computed(() => {
  if (props.friendId) {
    return friendStore.mutualTaskProgresses.filter(
      t => t.helperId === props.friendId || t.initiatorId === props.friendId
    )
  }
  return friendStore.activeMutualTasks
})

function formatDuration(seconds: number): string {
  if (seconds === 0) return '立即完成'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} 分钟`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} 小时`
  return `${Math.floor(seconds / 86400)} 天`
}

function formatTimeRemaining(expiresAt: number): string {
  const diff = expiresAt - Date.now()
  if (diff <= 0) return '已过期'
  const hours = Math.floor(diff / (60 * 60 * 1000))
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000))
  if (hours > 0) return `${hours}小时${Math.floor(minutes)}分钟`
  return `${Math.floor(minutes)}分钟`
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function getTaskInfo(taskId: string): MutualTask | undefined {
  return friendStore.availableMutualTasks.find(t => t.id === taskId)
}

function getTaskTarget(taskId: string): number {
  const task = getTaskInfo(taskId)
  return task?.target || 1
}

function getTaskRewards(taskId: string) {
  const task = getTaskInfo(taskId)
  return task?.rewards || []
}

function getProgressPercentage(progress: number, taskId: string): number {
  const target = getTaskTarget(taskId)
  return Math.min(100, (progress / target) * 100)
}

function getHelperName(helperId: string): string {
  const friend = friendStore.getFriendById(helperId)
  return friend?.friendName || helperId
}

function getHelperAvatar(helperId: string): string {
  const friend = friendStore.getFriendById(helperId)
  return friend?.friendAvatar || '👤'
}

function isFriendLevelRequirement(task: MutualTask): boolean {
  if (!selectedHelper.value) return true
  const friend = friendStore.getFriendById(selectedHelper.value)
  return friend ? friend.friendshipLevel >= task.minFriendshipLevel : false
}

function getRarityGradientClass(rarity: string): string {
  return rarityGradientClasses[rarity] || rarityGradientClasses.common
}

function openTaskSelectModal() {
  if (props.friendId && availableHelpers.value.length > 0) {
    selectedHelper.value = availableHelpers.value[0].friendId
  }
  showTaskSelectModal.value = true
}

function closeTaskSelectModal() {
  showTaskSelectModal.value = false
  selectedTask.value = null
  selectedHelper.value = null
}

function selectTask(task: MutualTask) {
  selectedTask.value = task
}

function startTask() {
  if (!selectedTask.value || !selectedHelper.value) return

  const success = friendStore.startMutualTask(selectedTask.value.id, selectedHelper.value)
  if (success) {
    closeTaskSelectModal()
  } else {
    alert('发起互助任务失败，请检查好友等级或任务限制')
  }
}

function claimReward(taskProgressId: string) {
  friendStore.claimMutualTaskReward(taskProgressId)
}

function simulateHelperComplete(taskProgressId: string) {
  if (confirm('模拟好友帮助完成任务？')) {
    friendStore.completeTaskHelper(taskProgressId)
  }
}

const statusLabels: Record<string, { text: string; color: string }> = {
  available: { text: '可发起', color: 'text-green-400' },
  in_progress: { text: '进行中', color: 'text-blue-400' },
  completed: { text: '待领取', color: 'text-amber-400' },
  claimed: { text: '已领取', color: 'text-gray-500' },
  expired: { text: '已过期', color: 'text-red-400' }
}
</script>

<template>
  <div class="mutual-task-panel">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-bold text-white flex items-center gap-2">
        <ListTodo class="w-5 h-5 text-green-400" />
        互助任务
      </h3>
      <button
        v-if="!friendId && availableHelpers.length > 0"
        @click="openTaskSelectModal"
        class="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white text-sm font-medium transition-colors flex items-center gap-1"
      >
        <Zap class="w-4 h-4" />
        发起互助
      </button>
    </div>

    <div v-if="displayedTasks.length === 0" class="text-center py-8 text-gray-500">
      <ListTodo class="w-12 h-12 mx-auto mb-2 opacity-30" />
      <p>暂无互助任务</p>
      <p class="text-xs mt-1">点击右上角发起互助任务</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="progress in displayedTasks"
        :key="progress.id"
        class="p-4 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors"
      >
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-2xl">
              {{ getTaskInfo(progress.taskId)?.icon || '📋' }}
            </div>
            <div>
              <div class="font-medium text-white flex items-center gap-2">
                {{ getTaskInfo(progress.taskId)?.title || '未知任务' }}
              </div>
              <div class="text-xs text-gray-500 flex items-center gap-1">
                <Users class="w-3 h-3" />
                {{ getHelperName(progress.helperId) }}
                <span class="mx-1">·</span>
                <span :class="statusLabels[progress.status].color">
                  {{ statusLabels[progress.status].text }}
                </span>
              </div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-xs text-gray-500">
              <Clock class="w-3 h-3 inline mr-1" />
              {{ formatTime(progress.startedAt) }}
            </div>
            <div v-if="progress.status === 'in_progress'" class="text-xs text-amber-400 mt-1">
              {{ formatTimeRemaining(progress.expiresAt) }}
            </div>
          </div>
        </div>

        <div class="mb-3">
          <div class="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>进度</span>
            <span>{{ progress.progress }}/{{ getTaskTarget(progress.taskId) }}</span>
          </div>
          <div class="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
              :style="{ width: getProgressPercentage(progress.progress, progress.taskId) + '%' }"
            ></div>
          </div>
        </div>

        <div v-if="getTaskRewards(progress.taskId).length > 0" class="mb-3">
          <div class="text-xs text-gray-500 mb-2">奖励</div>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="reward in getTaskRewards(progress.taskId)"
              :key="reward.id"
              class="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
              :class="rarityBgColors[reward.rarity]"
            >
              <span>{{ reward.icon }}</span>
              <span>{{ reward.name }}</span>
              <span>x{{ reward.value }}</span>
              <span v-if="reward.isShared" class="text-[10px] opacity-70">共享</span>
            </div>
          </div>
        </div>

        <div class="flex gap-2">
          <button
            v-if="progress.status === 'completed' && !progress.claimedAt"
            @click="claimReward(progress.id)"
            class="flex-1 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 rounded-lg text-white text-sm font-medium transition-all flex items-center justify-center gap-1"
          >
            <Gift class="w-4 h-4" />
            领取奖励
          </button>
          <button
            v-if="progress.status === 'in_progress'"
            @click="simulateHelperComplete(progress.id)"
            class="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm font-medium transition-colors"
          >
            模拟好友帮助
          </button>
          <button
            v-if="progress.status === 'in_progress'"
            class="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 text-sm font-medium transition-colors flex items-center justify-center gap-1"
          >
            <ChevronRight class="w-4 h-4" />
            查看详情
          </button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showTaskSelectModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            class="absolute inset-0 bg-black/70 backdrop-blur-sm"
            @click="closeTaskSelectModal"
          ></div>

          <div class="relative w-full max-w-2xl bg-gray-900 border border-gray-700 rounded-2xl p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-xl font-bold text-white">发起互助任务</h3>
              <button
                @click="closeTaskSelectModal"
                class="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div v-if="!props.friendId" class="mb-6">
              <label class="block text-sm font-medium text-gray-400 mb-2">选择好友</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="friend in availableHelpers"
                  :key="friend.friendId"
                  @click="selectedHelper = friend.friendId"
                  class="flex items-center gap-3 p-3 rounded-xl border-2 transition-all"
                  :class="selectedHelper === friend.friendId
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'"
                >
                  <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-xl">
                    {{ friend.friendAvatar }}
                  </div>
                  <div class="text-left">
                    <div class="font-medium text-white text-sm">{{ friend.friendName }}</div>
                    <div class="text-xs text-gray-500">
                      Lv.{{ friend.friendshipLevel }} · {{ friend.isOnline ? '在线' : '离线' }}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-400 mb-2">选择任务</label>
              <div class="grid grid-cols-1 gap-3">
                <div
                  v-for="task in friendStore.availableMutualTasks"
                  :key="task.id"
                  @click="selectTask(task)"
                  class="p-4 rounded-xl border-2 cursor-pointer transition-all"
                  :class="[
                    selectedTask?.id === task.id
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-gray-700 bg-gray-800/50 hover:border-gray-600',
                    !isFriendLevelRequirement(task) ? 'opacity-50 cursor-not-allowed' : ''
                  ]"
                >
                  <div class="flex items-start gap-3">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-2xl"
                      :class="getRarityGradientClass(task.rewards[0]?.rarity || 'common')"
                    >
                      {{ task.icon }}
                    </div>
                    <div class="flex-1">
                      <div class="flex items-center justify-between">
                        <div class="font-medium text-white">{{ task.title }}</div>
                        <div class="text-xs text-gray-500 flex items-center gap-1">
                          <Clock class="w-3 h-3" />
                          {{ formatDuration(task.duration) }}
                        </div>
                      </div>
                      <p class="text-sm text-gray-400 mt-1">{{ task.description }}</p>
                      <div class="flex items-center gap-2 mt-2 text-xs">
                        <span class="text-gray-500">需要好友等级: Lv.{{ task.minFriendshipLevel }}</span>
                        <span v-if="!isFriendLevelRequirement(task)" class="text-red-400">
                          (等级不足)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex gap-3 mt-6">
              <button
                @click="closeTaskSelectModal"
                class="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300 font-medium transition-colors"
              >
                取消
              </button>
              <button
                @click="startTask"
                :disabled="!selectedTask || !selectedHelper || !isFriendLevelRequirement(selectedTask!)"
                class="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-all flex items-center justify-center gap-2"
              >
                <Zap class="w-5 h-5" />
                发起互助
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
