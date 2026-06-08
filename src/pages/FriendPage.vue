<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFriendStore } from '@/stores/friendStore'
import { friendshipMilestones } from '@/game/data/friendData'
import FriendList from '@/components/friend/FriendList.vue'
import FriendInvitePanel from '@/components/friend/FriendInvitePanel.vue'
import MutualTaskPanel from '@/components/friend/MutualTaskPanel.vue'
import { Users, UserPlus, ListTodo, Star, Heart, TrendingUp, Award, Zap, Gift } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const friendStore = useFriendStore()

function handleNavigateTo(target: string) {
  if (target === 'game') {
    router.push('/')
  }
}

const activeTab = ref<'list' | 'invites' | 'tasks' | 'rewards'>('list')
const selectedFriendId = ref<string | null>(null)

const tabs = [
  { id: 'list', name: '好友列表', icon: Users, color: 'pink' },
  { id: 'invites', name: '好友邀请', icon: UserPlus, color: 'cyan' },
  { id: 'tasks', name: '互助任务', icon: ListTodo, color: 'green' },
  { id: 'rewards', name: '友谊奖励', icon: Star, color: 'amber' }
] as const

const tabColorClasses: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
  pink: { bg: 'bg-pink-600', text: 'text-pink-400', border: 'border-pink-500', gradient: 'from-pink-500 to-rose-500' },
  cyan: { bg: 'bg-cyan-600', text: 'text-cyan-400', border: 'border-cyan-500', gradient: 'from-cyan-500 to-blue-500' },
  green: { bg: 'bg-green-600', text: 'text-green-400', border: 'border-green-500', gradient: 'from-green-500 to-emerald-500' },
  amber: { bg: 'bg-amber-600', text: 'text-amber-400', border: 'border-amber-500', gradient: 'from-amber-500 to-orange-500' }
}

const currentTabColor = computed(() => tabColorClasses[tabs.find(t => t.id === activeTab.value)?.color || 'pink'])

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

function handleSelectFriend(friendId: string) {
  selectedFriendId.value = friendId
  activeTab.value = 'tasks'
}

onMounted(() => {
  friendStore.initFriendSystem()

  const tabParam = route.query.tab as string
  if (tabParam && ['list', 'invites', 'tasks', 'rewards'].includes(tabParam)) {
    activeTab.value = tabParam as typeof activeTab.value
  }
})
</script>

<template>
  <div class="friend-page min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
    <div class="max-w-6xl mx-auto px-4 py-8">
      <div class="mb-8">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-xl shadow-pink-500/30">
            <Heart class="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 class="text-3xl font-bold text-white">好友协作中心</h1>
            <p class="text-gray-400 mt-1">与好友互助，共同成长</p>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="p-4 bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl">
            <div class="flex items-center gap-3 mb-2">
              <div class="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                <Users class="w-5 h-5 text-pink-400" />
              </div>
              <div>
                <div class="text-2xl font-bold text-white">{{ friendStore.statistics.totalFriends }}</div>
                <div class="text-xs text-gray-500">好友总数</div>
              </div>
            </div>
          </div>

          <div class="p-4 bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl">
            <div class="flex items-center gap-3 mb-2">
              <div class="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Zap class="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div class="text-2xl font-bold text-white">{{ friendStore.statistics.completedMutualTasks }}</div>
                <div class="text-xs text-gray-500">完成互助</div>
              </div>
            </div>
          </div>

          <div class="p-4 bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl">
            <div class="flex items-center gap-3 mb-2">
              <div class="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <TrendingUp class="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div class="text-2xl font-bold text-white">{{ friendStore.statistics.totalHelpGiven }}</div>
                <div class="text-xs text-gray-500">帮助他人</div>
              </div>
            </div>
          </div>

          <div class="p-4 bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl">
            <div class="flex items-center gap-3 mb-2">
              <div class="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Award class="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div class="text-2xl font-bold text-white">Lv.{{ friendStore.statistics.highestFriendshipLevel }}</div>
                <div class="text-xs text-gray-500">最高友谊等级</div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex gap-2 overflow-x-auto pb-2">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            class="flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all whitespace-nowrap"
            :class="activeTab === tab.id
              ? `bg-gradient-to-r ${tabColorClasses[tab.color].gradient} text-white shadow-lg`
              : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-white'"
          >
            <component :is="tab.icon" class="w-5 h-5" />
            {{ tab.name }}
            <span
              v-if="tab.id === 'invites' && friendStore.pendingInviteCount > 0"
              class="px-2 py-0.5 rounded-full text-xs bg-red-500 text-white font-bold"
            >
              {{ friendStore.pendingInviteCount }}
            </span>
            <span
              v-if="tab.id === 'tasks' && friendStore.unclaimedRewardCount > 0"
              class="px-2 py-0.5 rounded-full text-xs bg-red-500 text-white font-bold"
            >
              {{ friendStore.unclaimedRewardCount }}
            </span>
          </button>
        </div>
      </div>

      <div class="bg-gray-800/30 backdrop-blur border border-gray-700 rounded-2xl p-6">
        <Transition name="fade" mode="out-in">
          <div v-if="activeTab === 'list'" key="list">
            <FriendList @select-friend="handleSelectFriend" />
          </div>

          <div v-else-if="activeTab === 'invites'" key="invites">
            <FriendInvitePanel />
          </div>

          <div v-else-if="activeTab === 'tasks'" key="tasks">
            <MutualTaskPanel :friend-id="selectedFriendId || undefined" @navigate-to="handleNavigateTo" />
          </div>

          <div v-else-if="activeTab === 'rewards'" key="rewards">
            <div>
              <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Star class="w-5 h-5 text-amber-400" />
                友谊里程碑
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <div
                  v-for="milestone in friendshipMilestones"
                  :key="milestone.id"
                  class="p-4 rounded-xl border-2 transition-all"
                  :class="milestone.level <= friendStore.statistics.highestFriendshipLevel
                    ? 'border-amber-500/50 bg-amber-500/10'
                    : 'border-gray-700 bg-gray-800/50 opacity-60'"
                >
                  <div class="flex items-center gap-3 mb-3">
                    <div
                      class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      :class="milestone.level <= friendStore.statistics.highestFriendshipLevel
                        ? `bg-gradient-to-br ${rarityColors[milestone.rewards[0]?.rarity || 'common']}`
                        : 'bg-gray-700'"
                    >
                      {{ milestone.icon }}
                    </div>
                    <div>
                      <div class="font-bold text-white">{{ milestone.name }}</div>
                      <div class="text-xs text-gray-500">Lv.{{ milestone.level }}</div>
                    </div>
                  </div>
                  <p class="text-sm text-gray-400 mb-3">{{ milestone.description }}</p>
                  <div v-if="milestone.rewards.length > 0">
                    <div class="text-xs text-gray-500 mb-2">达到奖励</div>
                    <div class="flex flex-wrap gap-1.5">
                      <div
                        v-for="reward in milestone.rewards"
                        :key="reward.id"
                        class="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
                        :class="rarityBgColors[reward.rarity]"
                      >
                        <span>{{ reward.icon }}</span>
                        <span>{{ reward.name }}</span>
                      </div>
                    </div>
                  </div>
                  <div
                    v-if="milestone.level <= friendStore.statistics.highestFriendshipLevel"
                    class="mt-3 flex items-center gap-1 text-xs text-amber-400"
                  >
                    <Award class="w-3.5 h-3.5" />
                    已解锁
                  </div>
                </div>
              </div>

              <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Gift class="w-5 h-5 text-green-400" />
                协作奖励记录
              </h3>

              <div v-if="friendStore.activities.filter(a => a.activityType === 'reward_claimed').length === 0" class="text-center py-8 text-gray-500">
                <Star class="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>暂无奖励记录</p>
                <p class="text-xs mt-1">完成互助任务后可领取奖励</p>
              </div>

              <div v-else class="space-y-2">
                <div
                  v-for="activity in friendStore.activities.filter(a => a.activityType === 'reward_claimed').slice(0, 10)"
                  :key="activity.id"
                  class="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl"
                >
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      🎁
                    </div>
                    <div>
                      <div class="text-sm text-white">{{ activity.description }}</div>
                      <div class="text-xs text-gray-500">{{ new Date(activity.timestamp).toLocaleString() }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
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
