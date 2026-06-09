<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMailStore } from '@/stores/mailStore'
import type { MailCategory, Mail } from '@/types/mail'
import {
  Bell, Gift, Megaphone, User, Star, Trash2,
  CheckCheck, AlertCircle, ArrowRight
} from 'lucide-vue-next'

const mailStore = useMailStore()

const activeTab = ref<MailCategory | 'all'>('all')

const tabs = [
  { id: 'all' as const, name: '全部', icon: Bell, color: 'indigo' },
  { id: 'system' as const, name: '系统', icon: AlertCircle, color: 'blue' },
  { id: 'reward' as const, name: '奖励', icon: Gift, color: 'green' },
  { id: 'announcement' as const, name: '公告', icon: Megaphone, color: 'purple' },
  { id: 'private' as const, name: '私信', icon: User, color: 'pink' }
] as const

const tabColorClasses: Record<string, { gradient: string; active: string }> = {
  indigo: { gradient: 'from-indigo-500 to-blue-500', active: 'bg-indigo-600 text-white' },
  blue: { gradient: 'from-blue-500 to-cyan-500', active: 'bg-blue-600 text-white' },
  green: { gradient: 'from-green-500 to-emerald-500', active: 'bg-green-600 text-white' },
  purple: { gradient: 'from-purple-500 to-violet-500', active: 'bg-purple-600 text-white' },
  pink: { gradient: 'from-pink-500 to-rose-500', active: 'bg-pink-600 text-white' }
}

const filteredMails = computed(() => {
  if (activeTab.value === 'all') {
    return [...mailStore.activeMails].sort((a, b) => {
      if (a.isStarred !== b.isStarred) return a.isStarred ? -1 : 1
      if (a.priority !== b.priority) {
        const order: Record<string, number> = { urgent: 0, important: 1, normal: 2 }
        return (order[a.priority] || 2) - (order[b.priority] || 2)
      }
      return b.createdAt - a.createdAt
    })
  }
  return mailStore.getMailsByCategory(activeTab.value)
})

const categoryIcons: Record<string, any> = {
  system: AlertCircle,
  reward: Gift,
  announcement: Megaphone,
  private: User
}

const categoryColors: Record<string, string> = {
  system: 'bg-blue-500/20 text-blue-400',
  reward: 'bg-green-500/20 text-green-400',
  announcement: 'bg-purple-500/20 text-purple-400',
  private: 'bg-pink-500/20 text-pink-400'
}

const priorityIndicators: Record<string, string> = {
  urgent: 'bg-red-500',
  important: 'bg-amber-500',
  normal: ''
}

function formatTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp

  if (diff < 60 * 1000) return '刚刚'
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}分钟前`
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}小时前`
  if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function getUnreadForCategory(cat: MailCategory | 'all'): number {
  if (cat === 'all') return mailStore.unreadCount
  return mailStore.statistics.byCategory[cat]?.unread || 0
}
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex gap-1.5 overflow-x-auto pb-2 mb-3">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
        :class="activeTab === tab.id
          ? `bg-gradient-to-r ${tabColorClasses[tab.color].gradient} text-white shadow-lg`
          : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-white'"
      >
        <component :is="tab.icon" class="w-4 h-4" />
        {{ tab.name }}
        <span
          v-if="getUnreadForCategory(tab.id) > 0"
          class="px-1.5 py-0.5 rounded-full text-xs font-bold"
          :class="activeTab === tab.id ? 'bg-white/20' : 'bg-red-500 text-white'"
        >
          {{ getUnreadForCategory(tab.id) }}
        </span>
      </button>
    </div>

    <div class="flex items-center justify-between mb-3 px-1">
      <span class="text-sm text-gray-500">
        共 {{ filteredMails.length }} 封邮件
      </span>
      <div class="flex gap-2">
        <button
          @click="mailStore.markAllAsRead()"
          class="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          :disabled="mailStore.unreadCount === 0"
          :class="{ 'opacity-40 cursor-not-allowed': mailStore.unreadCount === 0 }"
        >
          <CheckCheck class="w-3.5 h-3.5" />
          全部已读
        </button>
        <button
          @click="mailStore.deleteReadMails()"
          class="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 class="w-3.5 h-3.5" />
          清除已读
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto space-y-1.5">
      <div
        v-if="filteredMails.length === 0"
        class="flex flex-col items-center justify-center h-full text-gray-500 py-12"
      >
        <Bell class="w-12 h-12 mb-3 opacity-30" />
        <p>暂无邮件</p>
        <p class="text-xs mt-1">所有消息都在这里</p>
      </div>

      <div
        v-for="mail in filteredMails"
        :key="mail.id"
        class="group relative p-3 rounded-xl border transition-all cursor-pointer"
        :class="[
          mailStore.selectedMailId === mail.id
            ? 'bg-indigo-500/10 border-indigo-500/50 ring-1 ring-indigo-500/30'
            : mail.isRead
              ? 'bg-gray-800/30 border-gray-700/50 hover:bg-gray-800/60'
              : 'bg-gray-800/60 border-gray-600/50 hover:bg-gray-800/80',
          !mail.isRead ? 'border-l-4' : ''
        ]"
        @click="mailStore.selectMail(mail.id)"
      >
        <div
          v-if="!mail.isRead && priorityIndicators[mail.priority]"
          class="absolute left-0 top-3 w-1 h-6 rounded-r"
          :class="priorityIndicators[mail.priority]"
        ></div>

        <div class="flex items-start gap-3">
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
            :class="categoryColors[mail.category]"
          >
            <component :is="categoryIcons[mail.category]" class="w-5 h-5" />
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-0.5">
              <h4
                class="font-medium truncate flex-1"
                :class="mail.isRead ? 'text-gray-300' : 'text-white'"
              >
                {{ mail.title }}
              </h4>
              <span
                v-if="mail.priority === 'urgent'"
                class="px-1.5 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400 flex-shrink-0"
              >
                紧急
              </span>
              <span
                v-else-if="mail.priority === 'important'"
                class="px-1.5 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-400 flex-shrink-0"
              >
                重要
              </span>
            </div>

            <div class="flex items-center gap-2 text-xs text-gray-500">
              <span>{{ mail.sender }}</span>
              <span>·</span>
              <span>{{ formatTime(mail.createdAt) }}</span>
            </div>

            <p class="text-sm text-gray-400 mt-1 line-clamp-2">{{ mail.content }}</p>

            <div class="flex items-center gap-2 mt-2">
              <span
                v-if="mail.attachments.length > 0"
                class="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400"
              >
                <Gift class="w-3 h-3" />
                {{ mail.attachments.filter(a => a.status === 'unclaimed').length }} 附件待领
              </span>
              <span
                v-if="mail.tag"
                class="px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-400"
              >
                {{ mail.tag }}
              </span>
              <button
                v-if="mail.actionLabel"
                class="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors"
              >
                {{ mail.actionLabel }}
                <ArrowRight class="w-3 h-3" />
              </button>
            </div>
          </div>

          <div class="flex flex-col items-center gap-1 flex-shrink-0">
            <button
              @click.stop="mailStore.toggleStar(mail.id)"
              class="p-1 rounded transition-colors"
              :class="mail.isStarred ? 'text-amber-400' : 'text-gray-600 hover:text-amber-400'"
            >
              <Star class="w-4 h-4" :fill="mail.isStarred ? 'currentColor' : 'none'" />
            </button>
            <div
              v-if="!mail.isRead"
              class="w-2 h-2 rounded-full bg-indigo-500 mt-1"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
