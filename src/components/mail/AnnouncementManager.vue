<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMailStore } from '@/stores/mailStore'
import type { OperationalAnnouncement } from '@/types/mail'
import {
  Megaphone,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  Package,
  Tag,
  User,
} from 'lucide-vue-next'

const mailStore = useMailStore()
const isExpanded = ref(false)

const sortedAnnouncements = computed(() => {
  return [...mailStore.announcements].sort((a, b) => {
    const aPublished = mailStore.isAnnouncementPublished(a.id)
    const bPublished = mailStore.isAnnouncementPublished(b.id)
    if (aPublished !== bPublished) return aPublished ? 1 : -1
    return (b.publishedAt || 0) - (a.publishedAt || 0)
  })
})

const activeCount = computed(() =>
  mailStore.announcements.filter(a => !mailStore.isAnnouncementExpired(a.id)).length
)

const publishedCount = computed(() =>
  mailStore.announcements.filter(a => mailStore.isAnnouncementPublished(a.id)).length
)

function getStatus(ann: OperationalAnnouncement): 'active' | 'expired' | 'scheduled' {
  const now = Date.now()
  if (ann.expiresAt < now) return 'expired'
  if (ann.startsAt > now) return 'scheduled'
  return 'active'
}

function getStatusLabel(ann: OperationalAnnouncement): string {
  const status = getStatus(ann)
  const published = mailStore.isAnnouncementPublished(ann.id)
  if (status === 'expired') return '已过期'
  if (status === 'scheduled') return '待投放'
  if (published) return '已投放'
  return '未投放'
}

function getStatusStyle(ann: OperationalAnnouncement): string {
  const status = getStatus(ann)
  const published = mailStore.isAnnouncementPublished(ann.id)
  if (status === 'expired') return 'bg-gray-500/20 text-gray-400'
  if (status === 'scheduled') return 'bg-yellow-500/20 text-yellow-400'
  if (published) return 'bg-green-500/20 text-green-400'
  return 'bg-orange-500/20 text-orange-400'
}

function getStatusIcon(ann: OperationalAnnouncement) {
  const status = getStatus(ann)
  const published = mailStore.isAnnouncementPublished(ann.id)
  if (status === 'expired') return AlertTriangle
  if (status === 'scheduled') return Clock
  if (published) return CheckCircle2
  return Send
}

function formatDateTime(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getPriorityLabel(p: string): string {
  return { urgent: '紧急', important: '重要', normal: '普通' }[p] || '普通'
}

function getPriorityStyle(p: string): string {
  return { urgent: 'bg-red-500/20 text-red-400', important: 'bg-amber-500/20 text-amber-400', normal: 'bg-gray-500/20 text-gray-400' }[p] || 'bg-gray-500/20 text-gray-400'
}

const deletingId = ref<string | null>(null)
const republishingId = ref<string | null>(null)

function handleDelete(id: string) {
  deletingId.value = id
  setTimeout(() => {
    mailStore.removeAnnouncement(id)
    deletingId.value = null
  }, 200)
}

function handleRepublish(id: string) {
  republishingId.value = id
  setTimeout(() => {
    mailStore.republishAnnouncement(id)
    republishingId.value = null
  }, 300)
}
</script>

<template>
  <div class="bg-gray-900/90 rounded-xl border border-gray-700 overflow-hidden">
    <button
      @click="isExpanded = !isExpanded"
      class="w-full p-4 flex items-center gap-3 hover:bg-gray-800/50 transition-colors"
    >
      <div class="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center">
        <Megaphone class="w-5 h-5 text-purple-400" />
      </div>
      <div class="flex-1 text-left">
        <div class="flex items-center gap-2">
          <h3 class="font-bold text-white">运营公告管理</h3>
          <span class="px-2 py-0.5 rounded-full text-xs bg-purple-500/20 text-purple-400">
            {{ mailStore.announcements.length }} 条
          </span>
        </div>
        <p class="text-xs text-gray-500 mt-0.5">
          已投放 {{ publishedCount }} / 活跃 {{ activeCount }}
        </p>
      </div>
      <component
        :is="isExpanded ? ChevronUp : ChevronDown"
        class="w-5 h-5 text-gray-500 transition-transform"
      />
    </button>

    <div v-if="isExpanded" class="border-t border-gray-700">
      <div v-if="sortedAnnouncements.length === 0" class="p-8 text-center">
        <Megaphone class="w-10 h-10 text-gray-600 mx-auto mb-3" />
        <p class="text-gray-500">暂无运营公告</p>
        <p class="text-xs text-gray-600 mt-1">点击上方「发布公告」创建第一条</p>
      </div>

      <div v-else class="divide-y divide-gray-700/50">
        <div
          v-for="ann in sortedAnnouncements"
          :key="ann.id"
          class="p-4 hover:bg-gray-800/30 transition-colors"
        >
          <div class="flex items-start gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h4 class="font-medium text-white truncate">{{ ann.title }}</h4>
                <span
                  class="px-1.5 py-0.5 rounded text-xs flex items-center gap-1"
                  :class="getStatusStyle(ann)"
                >
                  <component :is="getStatusIcon(ann)" class="w-3 h-3" />
                  {{ getStatusLabel(ann) }}
                </span>
                <span
                  class="px-1.5 py-0.5 rounded text-xs"
                  :class="getPriorityStyle(ann.priority)"
                >
                  {{ getPriorityLabel(ann.priority) }}
                </span>
              </div>

              <p class="text-sm text-gray-400 mt-1.5 line-clamp-2">{{ ann.content }}</p>

              <div class="flex items-center gap-3 mt-2 text-xs text-gray-500 flex-wrap">
                <span class="flex items-center gap-1">
                  <User class="w-3 h-3" />
                  {{ ann.sender }}
                </span>
                <span class="flex items-center gap-1">
                  <Clock class="w-3 h-3" />
                  {{ formatDateTime(ann.publishedAt || ann.startsAt) }}
                </span>
                <span v-if="ann.tag" class="flex items-center gap-1">
                  <Tag class="w-3 h-3" />
                  {{ ann.tag }}
                </span>
                <span v-if="ann.attachments.length > 0" class="flex items-center gap-1 text-amber-400">
                  <Package class="w-3 h-3" />
                  {{ ann.attachments.length }} 附件
                </span>
              </div>

              <div v-if="ann.expiresAt" class="text-xs mt-1.5"
                :class="getStatus(ann) === 'expired' ? 'text-gray-600' : 'text-gray-500'"
              >
                有效期：{{ formatDateTime(ann.startsAt) }} ~ {{ formatDateTime(ann.expiresAt) }}
              </div>
            </div>

            <div class="flex flex-col gap-1.5 flex-shrink-0">
              <button
                @click="handleRepublish(ann.id)"
                :disabled="republishingId === ann.id"
                class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': republishingId === ann.id }" />
                重新投放
              </button>
              <button
                @click="handleDelete(ann.id)"
                :disabled="deletingId === ann.id"
                class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Trash2 class="w-3.5 h-3.5" />
                删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
