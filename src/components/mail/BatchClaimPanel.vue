<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMailStore } from '@/stores/mailStore'
import type { MailCategory } from '@/types/mail'
import { Gift, Package, Sparkles, Check, Loader2 } from 'lucide-vue-next'

const mailStore = useMailStore()
const isClaiming = ref(false)
const claimResult = ref<{ total: number; byCategory: Record<string, number> } | null>(null)

const claimOptions = computed(() => {
  const options: { id: string; label: string; count: number; icon: any; color: string }[] = []

  const total = mailStore.unclaimedAttachmentCount
  if (total > 0) {
    options.push({
      id: 'all',
      label: '全部邮件',
      count: total,
      icon: Sparkles,
      color: 'from-indigo-500 to-blue-500'
    })
  }

  const categories: { cat: MailCategory; label: string; icon: any; color: string }[] = [
    { cat: 'system', label: '系统通知', icon: Package, color: 'from-blue-500 to-cyan-500' },
    { cat: 'reward', label: '奖励邮件', icon: Gift, color: 'from-green-500 to-emerald-500' },
    { cat: 'announcement', label: '运营公告', icon: Sparkles, color: 'from-purple-500 to-violet-500' },
    { cat: 'private', label: '私信', icon: Package, color: 'from-pink-500 to-rose-500' }
  ]

  categories.forEach(({ cat, label, icon, color }) => {
    const catCount = mailStore.activeMails
      .filter(m => m.category === cat)
      .reduce((sum, m) => sum + m.attachments.filter(a => a.status === 'unclaimed').length, 0)
    if (catCount > 0) {
      options.push({ id: cat, label, count: catCount, icon, color })
    }
  })

  return options
})

const hasUnclaimed = computed(() => mailStore.unclaimedAttachmentCount > 0)

async function handleBatchClaim(type: string) {
  isClaiming.value = true
  claimResult.value = null

  await new Promise(r => setTimeout(r, 500))

  let claimed = 0
  const byCategory: Record<string, number> = {}

  if (type === 'all') {
    claimed = mailStore.batchClaimAll()
    byCategory['all'] = claimed
  } else {
    claimed = mailStore.batchClaimByCategory(type as MailCategory)
    byCategory[type] = claimed
  }

  claimResult.value = { total: claimed, byCategory }
  isClaiming.value = false

  setTimeout(() => {
    claimResult.value = null
  }, 3000)
}
</script>

<template>
  <div class="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-4">
    <h3 class="text-sm font-bold text-white mb-3 flex items-center gap-2">
      <Gift class="w-4 h-4 text-green-400" />
      批量领取
    </h3>

    <div v-if="!hasUnclaimed" class="text-center py-4 text-gray-500 text-sm">
      <Check class="w-8 h-8 mx-auto mb-2 text-green-500 opacity-50" />
      <p>所有附件已领取</p>
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="option in claimOptions"
        :key="option.id"
        class="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl border border-gray-700/50 hover:border-gray-600 transition-colors"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br"
            :class="option.color"
          >
            <component :is="option.icon" class="w-4 h-4 text-white" />
          </div>
          <div>
            <div class="text-sm text-white font-medium">{{ option.label }}</div>
            <div class="text-xs text-gray-400">{{ option.count }} 个附件待领取</div>
          </div>
        </div>

        <button
          @click="handleBatchClaim(option.id)"
          :disabled="isClaiming"
          class="px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-400 hover:to-emerald-400 transition-all shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="isClaiming" class="flex items-center gap-1">
            <Loader2 class="w-3 h-3 animate-spin" />
            领取中
          </span>
          <span v-else>一键领取</span>
        </button>
      </div>
    </div>

    <div
      v-if="claimResult && claimResult.total > 0"
      class="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-sm text-green-400 text-center"
    >
      🎉 成功领取了 {{ claimResult.total }} 个附件奖励！
    </div>

    <div class="mt-3 text-xs text-gray-500 text-center">
      领取的奖励将直接发放至对应系统
    </div>
  </div>
</template>
