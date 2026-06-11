<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useSeasonStore } from '@/stores/seasonStore'
import { useActivityStore } from '@/stores/activityStore'
import { useCharacterStore } from '@/stores/characterStore'
import TaskCard from './TaskCard.vue'
import { ListTodo, Calendar, Trophy, Target } from 'lucide-vue-next'

const props = defineProps<{
  highlightedTaskId?: string | null
}>()

const seasonStore = useSeasonStore()
const activityStore = useActivityStore()
const characterStore = useCharacterStore()

const SEASON_ACTIVITY_ID = 'act_001'

function getPlayerId(): string {
  return characterStore.activeCharacter?.id || 'player_local'
}

const activeTab = ref<'daily' | 'weekly' | 'challenge'>('daily')

const tabs = [
  { id: 'daily' as const, label: '每日任务', icon: Calendar, description: '每日0点重置' },
  { id: 'weekly' as const, label: '每周任务', icon: ListTodo, description: '每周一0点重置' },
  { id: 'challenge' as const, label: '赛季挑战', icon: Trophy, description: '赛季内完成' },
]

function switchTab(tabId: 'daily' | 'weekly' | 'challenge') {
  activeTab.value = tabId
  activityStore.trackClick(SEASON_ACTIVITY_ID, getPlayerId(), `task_tab_${tabId}`, {
    tabName: tabs.find(t => t.id === tabId)?.label,
  })
}

watch(() => props.highlightedTaskId, (id) => {
  if (!id) return
  const daily = seasonStore.dailyTasks.find(t => t.id === id)
  const weekly = seasonStore.weeklyTasks.find(t => t.id === id)
  const challenge = seasonStore.challengeTasks.find(t => t.id === id)
  if (daily) activeTab.value = 'daily'
  else if (weekly) activeTab.value = 'weekly'
  else if (challenge) activeTab.value = 'challenge'

  nextTick(() => {
    setTimeout(() => {
      const el = document.querySelector(`[data-task-id="${id}"]`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 300)
  })
}, { immediate: true })

function getTasksForTab(tab: 'daily' | 'weekly' | 'challenge') {
  switch (tab) {
    case 'daily':
      return seasonStore.dailyTasks
    case 'weekly':
      return seasonStore.weeklyTasks
    case 'challenge':
      return seasonStore.challengeTasks
    default:
      return []
  }
}

function getProgressForTab(tab: 'daily' | 'weekly' | 'challenge') {
  const tasks = getTasksForTab(tab)
  const completed = tasks.filter((t) => {
    const p = seasonStore.getTaskProgress(t.id)
    return p?.completed
  }).length
  return { completed, total: tasks.length }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-white flex items-center gap-3">
          <Target :size="28" class="text-purple-400" />
          任务列表
        </h2>
        <p class="text-gray-500 mt-1">完成任务获取赛季经验和丰厚奖励</p>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-4">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="switchTab(tab.id)"
        class="task-tab relative p-5 rounded-2xl text-left transition-all duration-300"
        :class="{
          'bg-gradient-to-br from-purple-900/50 to-red-900/30 border-2 border-purple-500/50 shadow-lg shadow-purple-500/10':
            activeTab === tab.id,
          'bg-gray-900/60 border border-gray-800 hover:border-gray-700': activeTab !== tab.id,
        }"
      >
        <div class="flex items-start justify-between">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center"
               :class="tab.id === 'daily' ? 'from-blue-500 to-cyan-500' : tab.id === 'weekly' ? 'from-purple-500 to-pink-500' : 'from-amber-500 to-orange-500'">
            <component :is="tab.icon" :size="24" class="text-white" />
          </div>
          <div v-if="getProgressForTab(tab.id).total > 0"
               class="text-sm font-bold"
               :class="getProgressForTab(tab.id).completed === getProgressForTab(tab.id).total ? 'text-green-400' : 'text-gray-400'">
            {{ getProgressForTab(tab.id).completed }}/{{ getProgressForTab(tab.id).total }}
          </div>
        </div>
        <h3 class="text-lg font-bold text-white mt-4">{{ tab.label }}</h3>
        <p class="text-sm text-gray-500 mt-1">{{ tab.description }}</p>

        <div v-if="activeTab === tab.id" class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-red-500 rounded-b-2xl"></div>
      </button>
    </div>

    <div class="space-y-4">
      <TransitionGroup name="task-list" tag="div" class="space-y-4">
        <TaskCard
          v-for="task in getTasksForTab(activeTab)"
          :key="task.id"
          :task="task"
          :progress="seasonStore.getTaskProgress(task.id)"
          :highlighted="highlightedTaskId === task.id"
        />
      </TransitionGroup>

      <div v-if="getTasksForTab(activeTab).length === 0" class="text-center py-16">
        <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-800/50 flex items-center justify-center">
          <ListTodo :size="40" class="text-gray-600" />
        </div>
        <p class="text-gray-500">暂无任务</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.task-tab {
  position: relative;
  overflow: hidden;
}

.task-tab::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent);
  transform: translateX(-100%);
  transition: transform 0.6s;
}

.task-tab:hover::before {
  transform: translateX(100%);
}

.task-list-enter-active,
.task-list-leave-active {
  transition: all 0.4s ease;
}

.task-list-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.task-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.task-list-move {
  transition: transform 0.4s ease;
}
</style>
