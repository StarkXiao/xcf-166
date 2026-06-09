<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useMailStore } from '@/stores/mailStore'
import { useCharacterStore } from '@/stores/characterStore'
import MailCenter from '@/components/mail/MailCenter.vue'
import {
  Mail,
  Bell,
  Gift,
  PackageOpen,
  ArrowLeft,
  Gift as ClaimAll,
} from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const mailStore = useMailStore()
const characterStore = useCharacterStore()
const router = useRouter()

onMounted(() => {
  mailStore.initMailSystem(characterStore.activeCharacter?.id || 'player_local')
})

const isClaiming = computed(() => false)

function handleBatchClaimAll() {
  mailStore.batchClaimAll()
}
</script>

<template>
  <div class="mail-page min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="mb-6">
        <div class="flex items-center gap-4 mb-6">
          <button
            @click="router.push('/')"
            class="p-2 rounded-lg bg-gray-800/50 border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft class="w-5 h-5" />
          </button>
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-xl shadow-indigo-500/30">
            <Mail class="w-7 h-7 text-white" />
          </div>
          <div class="flex-1">
            <h1 class="text-3xl font-bold text-white">邮件与公告中心</h1>
            <p class="text-gray-400 mt-1">系统通知、奖励附件、运营消息一站管理</p>
          </div>
          <button
            v-if="mailStore.unclaimedAttachmentCount > 0"
            @click="handleBatchClaimAll"
            class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium hover:from-green-400 hover:to-emerald-400 transition-all shadow-lg shadow-green-500/20"
          >
            <ClaimAll class="w-5 h-5" />
            一键领取全部 ({{ mailStore.unclaimedAttachmentCount }})
          </button>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="p-4 bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Mail class="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div class="text-2xl font-bold text-white">{{ mailStore.statistics.totalMails }}</div>
                <div class="text-xs text-gray-500">邮件总数</div>
              </div>
            </div>
          </div>

          <div class="p-4 bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Bell class="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <div class="text-2xl font-bold text-white">{{ mailStore.unreadCount }}</div>
                <div class="text-xs text-gray-500">未读邮件</div>
              </div>
            </div>
          </div>

          <div class="p-4 bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Gift class="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div class="text-2xl font-bold text-white">{{ mailStore.unclaimedAttachmentCount }}</div>
                <div class="text-xs text-gray-500">待领附件</div>
              </div>
            </div>
          </div>

          <div class="p-4 bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <PackageOpen class="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div class="text-2xl font-bold text-white">{{ mailStore.statistics.starredCount }}</div>
                <div class="text-xs text-gray-500">星标邮件</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-gray-800/30 backdrop-blur border border-gray-700 rounded-2xl p-6 min-h-[600px]">
        <MailCenter />
      </div>
    </div>
  </div>
</template>
