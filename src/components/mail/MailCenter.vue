<script setup lang="ts">
import { computed } from 'vue'
import { useMailStore } from '@/stores/mailStore'
import MailList from './MailList.vue'
import MailDetail from './MailDetail.vue'
import BatchClaimPanel from './BatchClaimPanel.vue'
import { Mail, Bell, Gift, Megaphone, User, Star } from 'lucide-vue-next'

const mailStore = useMailStore()

const showBatchPanel = computed(() => mailStore.unclaimedAttachmentCount > 0)

const statCards = computed(() => [
  {
    label: '未读邮件',
    value: mailStore.unreadCount,
    icon: Bell,
    color: 'indigo',
    bgColor: 'bg-indigo-500/20',
    textColor: 'text-indigo-400'
  },
  {
    label: '待领附件',
    value: mailStore.unclaimedAttachmentCount,
    icon: Gift,
    color: 'green',
    bgColor: 'bg-green-500/20',
    textColor: 'text-green-400'
  },
  {
    label: '运营公告',
    value: mailStore.statistics.byCategory.announcement.total,
    icon: Megaphone,
    color: 'purple',
    bgColor: 'bg-purple-500/20',
    textColor: 'text-purple-400'
  },
  {
    label: '已收藏',
    value: mailStore.statistics.starredCount,
    icon: Star,
    color: 'amber',
    bgColor: 'bg-amber-500/20',
    textColor: 'text-amber-400'
  }
])
</script>

<template>
  <div class="mail-center h-full flex flex-col">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      <div
        v-for="stat in statCards"
        :key="stat.label"
        class="p-3 bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl"
      >
        <div class="flex items-center gap-2">
          <div
            class="w-8 h-8 rounded-lg flex items-center justify-center"
            :class="stat.bgColor"
          >
            <component :is="stat.icon" class="w-4 h-4" :class="stat.textColor" />
          </div>
          <div>
            <div class="text-xl font-bold text-white">{{ stat.value }}</div>
            <div class="text-xs text-gray-500">{{ stat.label }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-1 flex gap-4 min-h-0">
      <div class="w-full lg:w-1/2 flex flex-col min-h-0">
        <MailList />
      </div>

      <div class="hidden lg:flex flex-col gap-4 w-1/2 min-h-0">
        <div class="flex-1 min-h-0 overflow-y-auto">
          <MailDetail />
        </div>
        <BatchClaimPanel v-if="showBatchPanel" />
      </div>
    </div>

    <div class="lg:hidden mt-4">
      <Transition name="slide-up">
        <div v-if="mailStore.selectedMail" class="fixed inset-0 z-50 bg-gray-900 p-4 overflow-y-auto">
          <MailDetail />
          <BatchClaimPanel v-if="showBatchPanel" class="mt-4" />
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
