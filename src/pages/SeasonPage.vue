<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSeasonStore } from '@/stores/seasonStore'
import { Trophy, ListTodo, TrendingUp, Gift, ArrowLeft } from 'lucide-vue-next'
import SeasonCenter from '@/components/season/SeasonCenter.vue'
import TaskList from '@/components/season/TaskList.vue'
import ProgressTracker from '@/components/season/ProgressTracker.vue'
import Leaderboard from '@/components/season/Leaderboard.vue'
import RewardCenter from '@/components/season/RewardCenter.vue'

const route = useRoute()
const router = useRouter()
const seasonStore = useSeasonStore()

const activeTab = ref('center')

const tabs = [
  { id: 'center', label: '赛季中心', icon: Trophy },
  { id: 'tasks', label: '任务列表', icon: ListTodo },
  { id: 'progress', label: '进度追踪', icon: TrendingUp },
  { id: 'rewards', label: '奖励中心', icon: Gift },
  { id: 'leaderboard', label: '排行榜', icon: Trophy },
]

onMounted(() => {
  seasonStore.initSeason()
  const tab = route.query.tab as string
  if (tab && tabs.some((t) => t.id === tab)) {
    activeTab.value = tab
  }
})

function switchTab(tabId: string) {
  activeTab.value = tabId
  router.replace({ query: { tab: tabId } })
}

function goBack() {
  router.push('/')
}
</script>

<template>
  <div class="season-page min-h-screen w-full overflow-hidden bg-season-bg">
    <div class="absolute inset-0 season-particles pointer-events-none"></div>

    <div class="relative z-10 flex flex-col h-screen">
      <div class="flex-shrink-0 px-6 py-4 border-b border-purple-900/30 bg-black/40 backdrop-blur-sm">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <button
              @click="goBack"
              class="p-2 rounded-lg bg-gray-800/60 hover:bg-gray-700/60 text-gray-300 hover:text-white transition-all"
            >
              <ArrowLeft :size="20" />
            </button>
            <div>
              <h1 class="text-2xl font-bold bg-gradient-to-r from-purple-400 via-red-400 to-amber-400 bg-clip-text text-transparent">
                {{ seasonStore.currentSeason?.name || '任务赛季中心' }}
              </h1>
              <p class="text-sm text-gray-500">{{ seasonStore.currentSeason?.theme }}</p>
            </div>
          </div>

          <div class="flex items-center gap-6">
            <div class="text-right">
              <div class="text-xs text-gray-500 mb-1">
                {{ seasonStore.isSeasonSettled ? '赛季状态' : seasonStore.isSeasonEnded ? '赛季状态' : '赛季剩余' }}
              </div>
              <div v-if="seasonStore.isSeasonSettled" class="flex items-center gap-2">
                <span class="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 font-bold text-sm border border-amber-500/30">
                  已结算
                </span>
              </div>
              <div v-else-if="seasonStore.isSeasonEnded" class="flex items-center gap-2">
                <span class="px-3 py-1 rounded-full bg-red-500/20 text-red-400 font-bold text-sm border border-red-500/30">
                  结算中
                </span>
              </div>
              <div v-else class="flex items-center gap-1 font-mono text-lg">
                <span class="text-red-400 font-bold">{{ seasonStore.timeRemaining.days }}</span>
                <span class="text-gray-500">天</span>
                <span class="text-amber-400 font-bold">{{ String(seasonStore.timeRemaining.hours).padStart(2, '0') }}</span>
                <span class="text-gray-500">:</span>
                <span class="text-amber-400 font-bold">{{ String(seasonStore.timeRemaining.minutes).padStart(2, '0') }}</span>
                <span class="text-gray-500">:</span>
                <span class="text-amber-400 font-bold animate-pulse">{{ String(seasonStore.timeRemaining.seconds).padStart(2, '0') }}</span>
              </div>
            </div>

            <div class="flex items-center gap-3 bg-purple-900/30 rounded-xl px-4 py-2 border border-purple-700/30">
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-red-500 flex items-center justify-center text-white font-bold">
                {{ seasonStore.playerSeason?.level || 1 }}
              </div>
              <div>
                <div class="text-xs text-gray-500">赛季等级</div>
                <div class="text-purple-300 font-bold">Lv.{{ seasonStore.playerSeason?.level || 1 }}</div>
              </div>
            </div>
          </div>
        </div>

        <nav class="flex gap-2 mt-4">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="switchTab(tab.id)"
            class="season-tab-btn flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all duration-300"
            :class="{
              'bg-gradient-to-r from-purple-600/50 to-red-600/50 text-white shadow-lg shadow-purple-500/20 border border-purple-400/30':
                activeTab === tab.id,
              'text-gray-400 hover:text-white hover:bg-gray-800/50': activeTab !== tab.id,
            }"
          >
            <component :is="tab.icon" :size="18" />
            <span class="font-medium">{{ tab.label }}</span>
            <span
              v-if="tab.id === 'tasks' && seasonStore.unclaimedCount > 0"
              class="season-red-dot"
            >
              {{ seasonStore.unclaimedCount }}
            </span>
          </button>
        </nav>
      </div>

      <div class="flex-1 overflow-y-auto p-6">
        <Transition name="fade-slide" mode="out-in">
          <SeasonCenter v-if="activeTab === 'center'" :key="'center'" />
          <TaskList v-else-if="activeTab === 'tasks'" :key="'tasks'" />
          <ProgressTracker v-else-if="activeTab === 'progress'" :key="'progress'" />
          <RewardCenter v-else-if="activeTab === 'rewards'" :key="'rewards'" />
          <Leaderboard v-else-if="activeTab === 'leaderboard'" :key="'leaderboard'" />
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.season-bg {
  background: radial-gradient(ellipse at top, #1a0f2e 0%, #0d0a1a 50%, #05030a 100%);
}

.season-particles {
  background-image:
    radial-gradient(circle at 20% 30%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(220, 38, 38, 0.08) 0%, transparent 50%);
}

.season-tab-btn {
  position: relative;
  overflow: hidden;
}

.season-tab-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transform: translateX(-100%);
  transition: transform 0.5s;
}

.season-tab-btn:hover::before {
  transform: translateX(100%);
}

.season-red-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  font-size: 11px;
  font-weight: bold;
  color: white;
  background: linear-gradient(135deg, #dc2626, #ef4444);
  border-radius: 10px;
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
