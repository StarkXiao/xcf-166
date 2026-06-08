<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFriendStore } from '@/stores/friendStore'
import { friendshipMilestones, getMutualTaskById } from '@/game/data/friendData'
import type { Friend } from '@/types/friend'
import { Users, Heart, Star, Trash2, Ban, MoreVertical, X, Check, Gift, ListTodo, Clock, Zap } from 'lucide-vue-next'

const emit = defineEmits<{
  selectFriend: [friendId: string]
}>()

const friendStore = useFriendStore()

const sortBy = ref<'name' | 'level' | 'online' | 'recent'>('online')
const filterStatus = ref<'all' | 'online' | 'offline'>('all')
const showFriendDetailModal = ref(false)
const selectedFriend = ref<Friend | null>(null)
const showMoreMenu = ref<string | null>(null)
const showRemoveConfirm = ref(false)
const showBlockConfirm = ref(false)

const sortedFriends = computed(() => {
  let result = [...friendStore.acceptedFriends]

  if (filterStatus.value === 'online') {
    result = result.filter(f => f.isOnline)
  } else if (filterStatus.value === 'offline') {
    result = result.filter(f => !f.isOnline)
  }

  switch (sortBy.value) {
    case 'name':
      result.sort((a, b) => a.friendName.localeCompare(b.friendName))
      break
    case 'level':
      result.sort((a, b) => b.friendshipLevel - a.friendshipLevel)
      break
    case 'online':
      result.sort((a, b) => {
        if (a.isOnline && !b.isOnline) return -1
        if (!a.isOnline && b.isOnline) return 1
        return b.lastInteractAt - a.lastInteractAt
      })
      break
    case 'recent':
      result.sort((a, b) => b.lastInteractAt - a.lastInteractAt)
      break
  }

  return result
})

function formatTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  if (diff < 60 * 1000) return '刚刚'
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))} 分钟前`
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))} 小时前`
  if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / (24 * 60 * 60 * 1000))} 天前`
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function getMilestoneName(level: number): string {
  const milestone = friendshipMilestones.find(m => m.level === level)
  return milestone?.name || '初识'
}

function getMilestoneIcon(level: number): string {
  const milestone = friendshipMilestones.find(m => m.level === level)
  return milestone?.icon || '🤝'
}

function getFriendshipProgress(friend: Friend) {
  return friendStore.getFriendshipProgress(friend)
}

function openFriendDetail(friend: Friend) {
  selectedFriend.value = friend
  showFriendDetailModal.value = true
  showMoreMenu.value = null
}

function closeFriendDetail() {
  showFriendDetailModal.value = false
  selectedFriend.value = null
  showMoreMenu.value = null
}

function toggleMoreMenu(friendId: string) {
  showMoreMenu.value = showMoreMenu.value === friendId ? null : friendId
}

function confirmRemoveFriend() {
  if (selectedFriend.value) {
    friendStore.removeFriend(selectedFriend.value.friendId)
    closeFriendDetail()
    showRemoveConfirm.value = false
  }
}

function confirmBlockFriend() {
  if (selectedFriend.value) {
    friendStore.blockFriend(selectedFriend.value.friendId)
    closeFriendDetail()
    showBlockConfirm.value = false
  }
}

function selectFriendForDetail(friend: Friend) {
  emit('selectFriend', friend.friendId)
}

function getActiveTasksForFriend(friendId: string) {
  return friendStore.mutualTaskProgresses.filter(
    t => (t.helperId === friendId || t.initiatorId === friendId) &&
         (t.status === 'in_progress' || t.status === 'completed')
  )
}

function getRecentActivities(friendId: string, limit: number = 5) {
  return friendStore.activities.filter(
    a => a.friendId === friendId
  ).slice(0, limit)
}

function getTaskTargetSafe(taskId: string): number {
  const task = getMutualTaskById(taskId)
  return task?.target || 1
}

function getTaskTitleSafe(taskId: string): string {
  const task = getMutualTaskById(taskId)
  return task?.title || '未知任务'
}

function getTaskIconSafe(taskId: string): string {
  const task = getMutualTaskById(taskId)
  return task?.icon || '📋'
}

function getTaskProgressPercentage(taskProgress: number, taskId: string): number {
  const target = getTaskTargetSafe(taskId)
  return Math.min(100, (taskProgress / target) * 100)
}

const activityTypeIcons: Record<string, string> = {
  help_sent: '📤',
  help_received: '📥',
  task_completed: '✅',
  milestone_unlocked: '🎉',
  reward_claimed: '🎁'
}

const rarityColors: Record<string, string> = {
  common: 'bg-gray-500/20 text-gray-400',
  uncommon: 'bg-green-500/20 text-green-400',
  rare: 'bg-blue-500/20 text-blue-400',
  epic: 'bg-purple-500/20 text-purple-400',
  legendary: 'bg-amber-500/20 text-amber-400'
}
</script>

<template>
  <div class="friend-list-panel">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-bold text-white flex items-center gap-2">
        <Users class="w-5 h-5 text-pink-400" />
        好友列表
        <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-pink-500/20 text-pink-400">
          {{ friendStore.statistics.onlineFriends }}/{{ friendStore.statistics.totalFriends }}
        </span>
      </h3>
    </div>

    <div class="flex items-center gap-2 mb-4">
      <div class="flex gap-1">
        <button
          v-for="status in ['all', 'online', 'offline'] as const"
          :key="status"
          @click="filterStatus = status"
          class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          :class="filterStatus === status
            ? 'bg-pink-600 text-white'
            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'"
        >
          {{ status === 'all' ? '全部' : status === 'online' ? '在线' : '离线' }}
        </button>
      </div>
      <div class="flex-1"></div>
      <select
        v-model="sortBy"
        class="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-pink-500"
      >
        <option value="online">按在线状态</option>
        <option value="level">按友谊等级</option>
        <option value="name">按名称</option>
        <option value="recent">按最近互动</option>
      </select>
    </div>

    <div v-if="sortedFriends.length === 0" class="text-center py-8 text-gray-500">
      <Users class="w-12 h-12 mx-auto mb-2 opacity-30" />
      <p>暂无好友</p>
      <p class="text-xs mt-1">去添加好友开始互助之旅吧</p>
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="friend in sortedFriends"
        :key="friend.friendId"
        class="relative"
      >
        <div
          @click="openFriendDetail(friend)"
          class="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <div class="flex items-center gap-3">
            <div class="relative">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-2xl">
                {{ friend.friendAvatar }}
              </div>
              <div
                class="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-gray-900"
                :class="friend.isOnline ? 'bg-green-500' : 'bg-gray-500'"
              ></div>
            </div>
            <div>
              <div class="font-medium text-white flex items-center gap-2">
                {{ friend.friendName }}
                <span class="text-xs px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-400">
                  {{ getMilestoneIcon(friend.friendshipLevel) }} Lv.{{ friend.friendshipLevel }}
                </span>
              </div>
              <div class="text-xs text-gray-500">
                {{ getMilestoneName(friend.friendshipLevel) }} · 互助 {{ friend.mutualHelpCount }} 次
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <div class="text-right mr-2">
              <div class="text-xs text-gray-500">{{ friend.isOnline ? '在线' : '离线' }}</div>
              <div class="text-[10px] text-gray-600">{{ formatTime(friend.lastInteractAt) }}</div>
            </div>
            <button
              @click.stop="toggleMoreMenu(friend.friendId)"
              class="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            >
              <MoreVertical class="w-4 h-4" />
            </button>
          </div>
        </div>

        <Transition name="slide-down">
          <div
            v-if="showMoreMenu === friend.friendId"
            class="absolute right-2 top-14 z-20 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden"
          >
            <button
              @click.stop="selectFriendForDetail(friend); showMoreMenu = null"
              class="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <ListTodo class="w-4 h-4" />
              查看互助任务
            </button>
            <button
              @click.stop="openFriendDetail(friend)"
              class="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <Heart class="w-4 h-4" />
              查看详情
            </button>
            <button
              @click.stop="selectedFriend = friend; showBlockConfirm = true; showMoreMenu = null"
              class="w-full px-4 py-2.5 text-left text-sm text-orange-400 hover:bg-orange-500/10 transition-colors flex items-center gap-2"
            >
              <Ban class="w-4 h-4" />
              拉黑好友
            </button>
            <button
              @click.stop="selectedFriend = friend; showRemoveConfirm = true; showMoreMenu = null"
              class="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
            >
              <Trash2 class="w-4 h-4" />
              删除好友
            </button>
          </div>
        </Transition>

        <div
          v-if="showMoreMenu === friend.friendId"
          @click="showMoreMenu = null"
          class="fixed inset-0 z-10"
        ></div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showFriendDetailModal && selectedFriend"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            class="absolute inset-0 bg-black/70 backdrop-blur-sm"
            @click="closeFriendDetail"
          ></div>

          <div class="relative w-full max-w-lg bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto">
            <div class="relative h-32 bg-gradient-to-br from-pink-600 to-rose-700 rounded-t-2xl">
              <button
                @click="closeFriendDetail"
                class="absolute top-4 right-4 p-2 rounded-lg bg-black/30 hover:bg-black/50 text-white transition-colors"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <div class="px-6 pb-6 -mt-12">
              <div class="relative">
                <div class="w-24 h-24 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 border-4 border-gray-900 flex items-center justify-center text-5xl">
                  {{ selectedFriend.friendAvatar }}
                </div>
                <div
                  class="absolute bottom-2 right-2 w-5 h-5 rounded-full border-2 border-gray-900"
                  :class="selectedFriend.isOnline ? 'bg-green-500' : 'bg-gray-500'"
                ></div>
              </div>

              <div class="mt-4">
                <div class="flex items-center gap-2">
                  <h2 class="text-2xl font-bold text-white">{{ selectedFriend.friendName }}</h2>
                  <span class="px-2 py-0.5 rounded-lg bg-pink-500/20 text-pink-400 text-sm font-medium">
                    {{ getMilestoneIcon(selectedFriend.friendshipLevel) }}
                    {{ getMilestoneName(selectedFriend.friendshipLevel) }}
                  </span>
                </div>
                <div class="text-gray-500 text-sm mt-1">ID: {{ selectedFriend.friendId }}</div>
              </div>

              <div class="mt-6 grid grid-cols-3 gap-3">
                <div class="text-center p-3 bg-gray-800/50 rounded-xl">
                  <div class="text-2xl font-bold text-pink-400">{{ selectedFriend.friendshipLevel }}</div>
                  <div class="text-xs text-gray-500">友谊等级</div>
                </div>
                <div class="text-center p-3 bg-gray-800/50 rounded-xl">
                  <div class="text-2xl font-bold text-green-400">{{ selectedFriend.mutualHelpCount }}</div>
                  <div class="text-xs text-gray-500">互助次数</div>
                </div>
                <div class="text-center p-3 bg-gray-800/50 rounded-xl">
                  <div class="text-2xl font-bold text-amber-400">{{ selectedFriend.currentDay }}</div>
                  <div class="text-xs text-gray-500">存活天数</div>
                </div>
              </div>

              <div class="mt-6">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium text-gray-400 flex items-center gap-1">
                    <Heart class="w-4 h-4 text-pink-400" />
                    友谊进度
                  </span>
                  <span class="text-sm text-pink-400">
                    {{ getFriendshipProgress(selectedFriend).current }}/{{ getFriendshipProgress(selectedFriend).next }}
                  </span>
                </div>
                <div class="h-2.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full transition-all duration-500"
                    :style="{ width: `${getFriendshipProgress(selectedFriend).percentage}%` }"
                  ></div>
                </div>
              </div>

              <div class="mt-6">
                <h4 class="text-sm font-medium text-gray-400 mb-3">游戏数据</h4>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-500">累计完成订单</span>
                    <span class="text-white">{{ selectedFriend.totalOrdersCompleted }} 单</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500">成为好友</span>
                    <span class="text-white">{{ formatTime(selectedFriend.createdAt) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500">最近互动</span>
                    <span class="text-white">{{ formatTime(selectedFriend.lastInteractAt) }}</span>
                  </div>
                </div>
              </div>

              <div v-if="getActiveTasksForFriend(selectedFriend.friendId).length > 0" class="mt-6">
                <h4 class="text-sm font-medium text-gray-400 mb-3 flex items-center gap-1">
                  <ListTodo class="w-4 h-4" />
                  进行中的互助
                </h4>
                <div class="space-y-2">
                  <div
                    v-for="taskProgress in getActiveTasksForFriend(selectedFriend.friendId)"
                    :key="taskProgress.id"
                    class="p-3 bg-gray-800/50 rounded-lg"
                  >
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center gap-2">
                        <span class="text-lg">{{ getTaskIconSafe(taskProgress.taskId) }}</span>
                        <span class="text-sm text-white">{{ getTaskTitleSafe(taskProgress.taskId) }}</span>
                      </div>
                      <span class="text-xs text-gray-500">{{ taskProgress.progress }}/{{ getTaskTargetSafe(taskProgress.taskId) }}</span>
                    </div>
                    <div class="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        class="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                        :style="{ width: getTaskProgressPercentage(taskProgress.progress, taskProgress.taskId) + '%' }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="getRecentActivities(selectedFriend.friendId).length > 0" class="mt-6">
                <h4 class="text-sm font-medium text-gray-400 mb-3 flex items-center gap-1">
                  <Clock class="w-4 h-4" />
                  最近动态
                </h4>
                <div class="space-y-2">
                  <div
                    v-for="activity in getRecentActivities(selectedFriend.friendId)"
                    :key="activity.id"
                    class="flex items-start gap-2 text-sm"
                  >
                    <span class="text-lg">{{ activityTypeIcons[activity.activityType] || '📝' }}</span>
                    <div class="flex-1">
                      <div class="text-gray-300">{{ activity.description }}</div>
                      <div class="text-xs text-gray-600">{{ formatTime(activity.timestamp) }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="mt-6 grid grid-cols-2 gap-3">
                <button
                  @click="selectFriendForDetail(selectedFriend); closeFriendDetail()"
                  class="py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-xl text-white font-medium transition-all flex items-center justify-center gap-2"
                >
                  <Zap class="w-5 h-5" />
                  发起互助
                </button>
                <button
                  @click="showRemoveConfirm = true"
                  class="py-3 bg-gray-800 hover:bg-red-600/20 rounded-xl text-gray-400 hover:text-red-400 font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 class="w-5 h-5" />
                  删除好友
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <Transition name="fade">
        <div
          v-if="showRemoveConfirm"
          class="fixed inset-0 z-[60] flex items-center justify-center p-4"
        >
          <div
            class="absolute inset-0 bg-black/70"
            @click="showRemoveConfirm = false"
          ></div>
          <div class="relative w-full max-w-sm bg-gray-900 border border-gray-700 rounded-2xl p-6">
            <h3 class="text-lg font-bold text-white mb-2">确认删除好友</h3>
            <p class="text-gray-400 text-sm mb-6">
              删除好友后，所有互助记录和友谊进度将被清除，且无法恢复。确定要删除 <span class="text-white font-medium">{{ selectedFriend?.friendName }}</span> 吗？
            </p>
            <div class="flex gap-3">
              <button
                @click="showRemoveConfirm = false"
                class="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300 font-medium transition-colors"
              >
                取消
              </button>
              <button
                @click="confirmRemoveFriend"
                class="flex-1 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-1"
              >
                <Trash2 class="w-4 h-4" />
                确认删除
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <Transition name="fade">
        <div
          v-if="showBlockConfirm"
          class="fixed inset-0 z-[60] flex items-center justify-center p-4"
        >
          <div
            class="absolute inset-0 bg-black/70"
            @click="showBlockConfirm = false"
          ></div>
          <div class="relative w-full max-w-sm bg-gray-900 border border-gray-700 rounded-2xl p-6">
            <h3 class="text-lg font-bold text-white mb-2">确认拉黑好友</h3>
            <p class="text-gray-400 text-sm mb-6">
              拉黑后将无法接收对方的消息和互助请求。确定要拉黑 <span class="text-white font-medium">{{ selectedFriend?.friendName }}</span> 吗？
            </p>
            <div class="flex gap-3">
              <button
                @click="showBlockConfirm = false"
                class="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300 font-medium transition-colors"
              >
                取消
              </button>
              <button
                @click="confirmBlockFriend"
                class="flex-1 py-2.5 bg-orange-600 hover:bg-orange-500 rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-1"
              >
                <Ban class="w-4 h-4" />
                确认拉黑
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

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
