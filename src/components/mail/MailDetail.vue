<script setup lang="ts">
import { computed } from 'vue'
import { useMailStore } from '@/stores/mailStore'
import { useRouter } from 'vue-router'
import type { MailAttachment } from '@/types/mail'
import {
  ArrowLeft, Star, Trash2, MailOpen, Mail,
  Gift, Check, Clock, AlertTriangle, ExternalLink
} from 'lucide-vue-next'

const mailStore = useMailStore()
const router = useRouter()

const mail = computed(() => mailStore.selectedMail)

const rarityColors: Record<string, string> = {
  common: 'from-gray-500 to-gray-600',
  uncommon: 'from-green-500 to-emerald-600',
  rare: 'from-blue-500 to-cyan-600',
  epic: 'from-purple-500 to-violet-600',
  legendary: 'from-amber-500 to-orange-600'
}

const rarityBgColors: Record<string, string> = {
  common: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  uncommon: 'bg-green-500/20 text-green-400 border-green-500/30',
  rare: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  epic: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  legendary: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
}

const categoryLabels: Record<string, string> = {
  system: '系统通知',
  reward: '奖励邮件',
  announcement: '运营公告',
  private: '私信'
}

const categoryColors: Record<string, string> = {
  system: 'bg-blue-500/20 text-blue-400',
  reward: 'bg-green-500/20 text-green-400',
  announcement: 'bg-purple-500/20 text-purple-400',
  private: 'bg-pink-500/20 text-pink-400'
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function formatExpiry(timestamp: number): string {
  const now = Date.now()
  const diff = timestamp - now
  if (diff <= 0) return '已过期'
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  if (days > 0) return `${days}天${hours}小时后过期`
  return `${hours}小时后过期`
}

function handleClaimAttachment(attachmentId: string) {
  if (!mail.value) return
  mailStore.claimAttachment(mail.value.id, attachmentId)
}

function handleClaimAll() {
  if (!mail.value) return
  const claimed = mailStore.claimAllAttachments(mail.value.id)
  if (claimed > 0) {
    alert(`成功领取了 ${claimed} 个附件奖励！`)
  }
}

function handleDelete() {
  if (!mail.value) return
  const result = mailStore.deleteMail(mail.value.id)
  if (!result) {
    alert('该邮件还有未领取的附件，请先领取后再删除')
  }
}

function handleAction() {
  if (!mail.value?.actionUrl) return
  router.push(mail.value.actionUrl)
}

function handleClose() {
  mailStore.selectMail(null)
}
</script>

<template>
  <div v-if="mail" class="flex flex-col h-full">
    <div class="flex items-center justify-between mb-4 pb-3 border-b border-gray-700">
      <div class="flex items-center gap-3">
        <button
          @click="handleClose"
          class="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft class="w-4 h-4" />
        </button>
        <div>
          <div class="flex items-center gap-2">
            <span
              class="px-2 py-0.5 rounded text-xs font-medium"
              :class="categoryColors[mail.category]"
            >
              {{ categoryLabels[mail.category] }}
            </span>
            <span
              v-if="mail.priority === 'urgent'"
              class="px-2 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400"
            >
              紧急
            </span>
            <span
              v-else-if="mail.priority === 'important'"
              class="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-400"
            >
              重要
            </span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="mailStore.toggleStar(mail.id)"
          class="p-2 rounded-lg transition-colors"
          :class="mail.isStarred ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-800 text-gray-400 hover:text-amber-400'"
        >
          <Star class="w-4 h-4" :fill="mail.isStarred ? 'currentColor' : 'none'" />
        </button>
        <button
          v-if="!mail.isRead"
          @click="mailStore.markAsUnread(mail.id)"
          class="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors"
          title="标记为未读"
        >
          <Mail class="w-4 h-4" />
        </button>
        <button
          v-else
          @click="mailStore.markAsUnread(mail.id)"
          class="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors"
          title="标记为未读"
        >
          <MailOpen class="w-4 h-4" />
        </button>
        <button
          @click="handleDelete"
          class="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="删除"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </div>

    <div class="flex items-start gap-3 mb-4">
      <div class="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center text-2xl flex-shrink-0">
        {{ mail.senderAvatar }}
      </div>
      <div class="flex-1 min-w-0">
        <h2 class="text-xl font-bold text-white mb-1">{{ mail.title }}</h2>
        <div class="flex items-center gap-2 text-sm text-gray-400">
          <span>来自: {{ mail.sender }}</span>
          <span>·</span>
          <span>{{ formatDate(mail.createdAt) }}</span>
        </div>
        <div v-if="mail.tag" class="mt-1">
          <span class="px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-400">
            {{ mail.tag }}
          </span>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto mb-4">
      <div class="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
        {{ mail.content }}
      </div>
    </div>

    <div v-if="mail.attachments.length > 0" class="border-t border-gray-700 pt-4 mb-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-bold text-white flex items-center gap-2">
          <Gift class="w-4 h-4 text-green-400" />
          附件 ({{ mail.attachments.length }})
        </h3>
        <button
          v-if="mail.attachments.some(a => a.status === 'unclaimed')"
          @click="handleClaimAll"
          class="px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-400 hover:to-emerald-400 transition-all shadow-lg shadow-green-500/20"
        >
          一键领取全部
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div
          v-for="attachment in mail.attachments"
          :key="attachment.id"
          class="flex items-center gap-3 p-3 rounded-xl border transition-all"
          :class="[
            rarityBgColors[attachment.rarity],
            attachment.status === 'expired' ? 'opacity-50' : ''
          ]"
        >
          <div class="w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-gradient-to-br"
            :class="rarityColors[attachment.rarity]"
          >
            {{ attachment.icon }}
          </div>

          <div class="flex-1 min-w-0">
            <div class="font-medium text-sm text-white truncate">{{ attachment.name }}</div>
            <div class="text-xs text-gray-400">
              {{ typeof attachment.value === 'number' ? `×${attachment.count}` : attachment.value }}
              <template v-if="attachment.expiresAt && attachment.status !== 'claimed'">
                · {{ formatExpiry(attachment.expiresAt) }}
              </template>
            </div>
          </div>

          <div class="flex-shrink-0">
            <button
              v-if="attachment.status === 'unclaimed'"
              @click="handleClaimAttachment(attachment.id)"
              class="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600 hover:bg-green-500 text-white transition-colors"
            >
              领取
            </button>
            <div v-else-if="attachment.status === 'claimed'" class="flex items-center gap-1 text-green-400 text-xs">
              <Check class="w-4 h-4" />
              已领取
            </div>
            <div v-else class="flex items-center gap-1 text-red-400 text-xs">
              <AlertTriangle class="w-3.5 h-3.5" />
              已过期
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="mail.actionLabel && mail.actionUrl" class="border-t border-gray-700 pt-4">
      <button
        @click="handleAction"
        class="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-400 hover:to-blue-400 text-white font-medium transition-all shadow-lg shadow-indigo-500/20"
      >
        {{ mail.actionLabel }}
        <ExternalLink class="w-4 h-4" />
      </button>
    </div>

    <div v-if="mail.expiresAt" class="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
      <Clock class="w-3.5 h-3.5" />
      <span>邮件有效期至 {{ formatDate(mail.expiresAt) }}</span>
    </div>
  </div>

  <div v-else class="flex flex-col items-center justify-center h-full text-gray-500 py-12">
    <MailOpen class="w-16 h-16 mb-4 opacity-30" />
    <p class="text-lg">选择一封邮件查看详情</p>
    <p class="text-sm mt-1">点击左侧邮件列表中的邮件</p>
  </div>
</template>
