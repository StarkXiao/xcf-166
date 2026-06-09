<script setup lang="ts">
import type { MailCategory } from '@/types/mail'
import { useMailStore } from '@/stores/mailStore'
import { computed } from 'vue'
import {
  Mail,
  Bell,
  Gift,
  Megaphone,
  User,
  Star,
} from 'lucide-vue-next'

const mailStore = useMailStore()

const props = defineProps<{
  modelValue: MailCategory | 'all' | 'starred'
}>()

const emit = defineEmits<{
  'update:modelValue': [value: MailCategory | 'all' | 'starred']
}>()

const activeTab = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const tabs = computed(() => [
  {
    id: 'all' as const,
    name: '全部',
    icon: Mail,
    color: 'blue',
    badge: mailStore.unreadCount,
  },
  {
    id: 'system' as const,
    name: '系统通知',
    icon: Bell,
    color: 'cyan',
    badge: mailStore.statistics.byCategory.system.unread,
  },
  {
    id: 'reward' as const,
    name: '奖励附件',
    icon: Gift,
    color: 'green',
    badge: mailStore.statistics.byCategory.reward.unread,
  },
  {
    id: 'announcement' as const,
    name: '运营公告',
    icon: Megaphone,
    color: 'purple',
    badge: mailStore.statistics.byCategory.announcement.unread,
  },
  {
    id: 'private' as const,
    name: '私人信件',
    icon: User,
    color: 'pink',
    badge: mailStore.statistics.byCategory.private.unread,
  },
  {
    id: 'starred' as const,
    name: '星标',
    icon: Star,
    color: 'amber',
    badge: mailStore.starredMails.filter(m => !m.isRead).length,
  },
])

const colorClasses: Record<string, { gradient: string }> = {
  blue: { gradient: 'from-blue-500 to-indigo-500' },
  cyan: { gradient: 'from-cyan-500 to-blue-500' },
  green: { gradient: 'from-green-500 to-emerald-500' },
  purple: { gradient: 'from-purple-500 to-violet-500' },
  pink: { gradient: 'from-pink-500 to-rose-500' },
  amber: { gradient: 'from-amber-500 to-orange-500' },
}
</script>

<template>
  <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      @click="activeTab = tab.id"
      class="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap text-sm"
      :class="activeTab === tab.id
        ? `bg-gradient-to-r ${colorClasses[tab.color].gradient} text-white shadow-lg`
        : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-white'"
    >
      <component :is="tab.icon" class="w-4 h-4" />
      {{ tab.name }}
      <span
        v-if="tab.badge > 0"
        class="px-1.5 py-0.5 rounded-full text-xs font-bold"
        :class="activeTab === tab.id ? 'bg-white/20' : 'bg-red-500 text-white'"
      >
        {{ tab.badge }}
      </span>
    </button>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
