<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTaskStore } from '@/stores/taskStore'
import { Bell, Check, X, ChevronRight, AlertCircle, Gift } from 'lucide-vue-next'

const router = useRouter()
const taskStore = useTaskStore()
const isExpanded = ref(false)

const unreadReminders = computed(() =>
  taskStore.reminders.filter(r => !r.read).slice(0, 5)
)

const unreadCount = computed(() => taskStore.unreadReminderCount)

const triggerIconMap: Record<string, any> = {
  almost_complete: AlertCircle,
  new_available: Bell,
  expiring_soon: AlertCircle,
  reward_available: Gift,
}

const triggerColorMap: Record<string, string> = {
  almost_complete: 'text-amber-400 bg-amber-500/20',
  new_available: 'text-blue-400 bg-blue-500/20',
  expiring_soon: 'text-red-400 bg-red-500/20',
  reward_available: 'text-green-400 bg-green-500/20',
}

function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

function handleReminderClick(reminderId: string, taskType: string) {
  taskStore.markReminderRead(reminderId)
  router.push({ path: '/season', query: { tab: taskType === 'weekly' ? 'weekly_tasks' : 'growth_tasks' } })
  isExpanded.value = false
}

function dismissReminder(reminderId: string) {
  taskStore.markReminderRead(reminderId)
}

function handleMarkAllRead() {
  taskStore.markAllRemindersRead()
}
</script>

<template>
  <div v-if="unreadCount > 0" class="task-reminder fixed top-20 right-6 z-40">
    <Transition name="slide-down">
      <div
        v-if="isExpanded"
        class="absolute top-16 right-0 w-80 rounded-2xl bg-gray-900/95 backdrop-blur-xl border border-amber-500/30 shadow-2xl shadow-amber-500/20 overflow-hidden"
      >
        <div class="p-4 border-b border-gray-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Bell :size="18" class="text-amber-400" />
            <span class="font-bold text-white text-sm">任务提醒</span>
            <span class="px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400 font-bold">{{ unreadCount }}</span>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="handleMarkAllRead"
              class="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              全部已读
            </button>
            <button @click="isExpanded = false" class="text-gray-500 hover:text-white transition-colors">
              <X :size="16" />
            </button>
          </div>
        </div>

        <div class="max-h-80 overflow-y-auto">
          <div
            v-for="reminder in unreadReminders"
            :key="reminder.id"
            class="p-4 border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors cursor-pointer"
            @click="handleReminderClick(reminder.id, reminder.taskType)"
          >
            <div class="flex items-start gap-3">
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                :class="triggerColorMap[reminder.triggerCondition] || 'text-gray-400 bg-gray-500/20'"
              >
                <component :is="triggerIconMap[reminder.triggerCondition] || Bell" :size="16" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-white leading-snug">{{ reminder.message }}</p>
                <p class="text-xs text-gray-500 mt-1">
                  {{ reminder.taskType === 'weekly' ? '周常任务' : '成长任务' }}
                  · {{ new Date(reminder.createdAt).toLocaleTimeString() }}
                </p>
              </div>
              <button
                @click.stop="dismissReminder(reminder.id)"
                class="text-gray-600 hover:text-gray-300 transition-colors flex-shrink-0"
              >
                <X :size="14" />
              </button>
            </div>
          </div>

          <div v-if="unreadReminders.length === 0" class="p-6 text-center">
            <Bell :size="24" class="text-gray-600 mx-auto mb-2" />
            <p class="text-gray-500 text-sm">暂无新提醒</p>
          </div>
        </div>
      </div>
    </Transition>

    <button
      @click="toggleExpand"
      class="reminder-toggle relative w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 to-orange-600 shadow-lg shadow-amber-500/30 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
    >
      <div class="absolute -top-1 -right-1 min-w-[18px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </div>
      <Bell :size="20" class="text-white" />
    </button>
  </div>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.animate-bounce {
  animation: bounce 1s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}
</style>
