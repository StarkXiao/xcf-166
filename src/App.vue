<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAchievementStore } from '@/stores/achievementStore'
import { useSeasonStore } from '@/stores/seasonStore'
import { useCharacterStore } from '@/stores/characterStore'
import { useTutorialStore } from '@/stores/tutorialStore'
import { useGameStore } from '@/stores/gameStore'
import { useFriendStore } from '@/stores/friendStore'
import { useMailStore } from '@/stores/mailStore'
import { useOfflineStore } from '@/stores/offlineStore'
import AchievementUnlockPopup from '@/components/achievement/AchievementUnlockPopup.vue'
import NotificationCenter from '@/components/achievement/NotificationCenter.vue'
import FriendNotificationCenter from '@/components/friend/FriendNotificationCenter.vue'
import FriendEntryCard from '@/components/friend/FriendEntryCard.vue'
import TutorialGuide from '@/components/tutorial/TutorialGuide.vue'
import { Bell, Trophy, Store, HelpCircle, Heart, Users, Mail, BarChart3 } from 'lucide-vue-next'
import { useRouter, useRoute } from 'vue-router'

const achievementStore = useAchievementStore()
const seasonStore = useSeasonStore()
const characterStore = useCharacterStore()
const tutorialStore = useTutorialStore()
const gameStore = useGameStore()
const friendStore = useFriendStore()
const mailStore = useMailStore()
const offlineStore = useOfflineStore()
const router = useRouter()
const route = useRoute()

const showNotificationCenter = ref(false)
const showFriendNotificationCenter = ref(false)
const showNav = computed(() => route.name === 'game')
const showFriendEntry = computed(() => route.name === 'game')
const tutorialGuideRef = ref<InstanceType<typeof TutorialGuide> | null>(null)

onMounted(() => {
  seasonStore.initSeason()
  achievementStore.initAchievements(characterStore.activeCharacter?.id || 'player_local')
  achievementStore.resyncProgress()
  tutorialStore.initTutorial(characterStore.activeCharacter?.id || 'player_local')
  friendStore.initFriendSystem(characterStore.activeCharacter?.id || 'player_local')
  mailStore.initMailSystem(characterStore.activeCharacter?.id || 'player_local')

  if (!tutorialStore.isCompleted && tutorialStore.analytics.firstLogin) {
    setTimeout(() => {
      tutorialStore.startTutorial()
    }, 500)
  }

  window.addEventListener('beforeunload', handleBeforeUnload)
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

function handleBeforeUnload() {
  if (gameStore.gameStarted && !gameStore.gameOver) {
    offlineStore.updateLastOnlineTime()
  }
}

function restartTutorial() {
  tutorialStore.resetTutorial()
  tutorialStore.startTutorial()
}

watch(
  () => achievementStore.behaviorEvents.length,
  (newLen, oldLen) => {
    if (!tutorialGuideRef.value || !tutorialStore.state.isActive) return
    if (newLen <= oldLen) return

    const lastEvent = achievementStore.behaviorEvents[newLen - 1]
    if (lastEvent) {
      const validEvents = ['order_accepted', 'order_completed', 'relic_purified']
      if (validEvents.includes(lastEvent.eventType)) {
        tutorialGuideRef.value.handleBehaviorEvent(lastEvent.eventType, lastEvent.metadata)
      }
    }
  }
)

function toggleNotificationCenter() {
  showNotificationCenter.value = !showNotificationCenter.value
}

function goToAchievements() {
  router.push('/achievements')
}

function goToShop() {
  router.push('/shop')
}

function goToFriends() {
  router.push('/friends')
}

function goToMail() {
  router.push('/mail')
}

function goToDashboard() {
  router.push('/dashboard')
}

function toggleFriendNotificationCenter() {
  showFriendNotificationCenter.value = !showFriendNotificationCenter.value
}
</script>

<template>
  <div class="app-container">
    <div
      v-if="showNav"
      class="fixed top-4 right-4 z-40 flex items-center gap-3"
    >
      <button
        @click="goToShop"
        class="shop-entry-btn relative p-3 bg-gray-900/90 backdrop-blur-sm rounded-xl border border-gray-700 hover:bg-gray-800 transition-colors group"
        :class="{ 'ring-2 ring-amber-500': route.name === 'shop' }"
        title="道具商城"
      >
        <Store class="w-5 h-5 text-amber-400 group-hover:text-amber-300" />
      </button>

      <button
        @click="goToDashboard"
        class="relative p-3 bg-gray-900/90 backdrop-blur-sm rounded-xl border border-gray-700 hover:bg-gray-800 transition-colors group"
        :class="{ 'ring-2 ring-cyan-500': route.name === 'dashboard' }"
        title="数据驾驶舱"
      >
        <BarChart3 class="w-5 h-5 text-cyan-400 group-hover:text-cyan-300" />
      </button>

      <button
        @click="goToAchievements"
        class="achievement-entry-btn relative p-3 bg-gray-900/90 backdrop-blur-sm rounded-xl border border-gray-700 hover:bg-gray-800 transition-colors group"
        :class="{ 'ring-2 ring-amber-500': route.name === 'achievements' }"
        title="成就中心"
      >
        <Trophy class="w-5 h-5 text-amber-400 group-hover:text-amber-300" />
        <span
          v-if="achievementStore.unclaimedCount > 0"
          class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse"
        >
          {{ achievementStore.unclaimedCount }}
        </span>
      </button>

      <button
        @click="goToFriends"
        class="friend-entry-btn relative p-3 bg-gray-900/90 backdrop-blur-sm rounded-xl border border-gray-700 hover:bg-gray-800 transition-colors group"
        :class="{ 'ring-2 ring-pink-500': route.name === 'friends' }"
        title="好友协作"
      >
        <Heart class="w-5 h-5 text-pink-400 group-hover:text-pink-300" />
        <span
          v-if="friendStore.totalUnreadCount > 0"
          class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse"
        >
          {{ friendStore.totalUnreadCount }}
        </span>
      </button>

      <button
        @click="goToMail"
        class="relative p-3 bg-gray-900/90 backdrop-blur-sm rounded-xl border border-gray-700 hover:bg-gray-800 transition-colors group"
        :class="{ 'ring-2 ring-blue-500': route.name === 'mail' }"
        title="邮件中心"
      >
        <Mail class="w-5 h-5 text-blue-400 group-hover:text-blue-300" />
        <span
          v-if="mailStore.unreadCount > 0"
          class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse"
        >
          {{ mailStore.unreadCount }}
        </span>
        <span
          v-if="mailStore.unclaimedAttachmentCount > 0"
          class="absolute -bottom-1 -left-1 w-4 h-4 bg-amber-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold"
        >
          {{ mailStore.unclaimedAttachmentCount }}
        </span>
      </button>

      <button
        @click="toggleFriendNotificationCenter"
        class="relative p-3 bg-gray-900/90 backdrop-blur-sm rounded-xl border border-gray-700 hover:bg-gray-800 transition-colors"
        title="好友消息"
      >
        <Users class="w-5 h-5 text-gray-400 hover:text-white" />
        <span
          v-if="friendStore.unreadNotificationCount > 0"
          class="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
        >
          {{ friendStore.unreadNotificationCount }}
        </span>
      </button>

      <button
        @click="toggleNotificationCenter"
        class="relative p-3 bg-gray-900/90 backdrop-blur-sm rounded-xl border border-gray-700 hover:bg-gray-800 transition-colors"
        title="消息中心"
      >
        <Bell class="w-5 h-5 text-gray-400 hover:text-white" />
        <span
          v-if="achievementStore.unreadNotificationCount > 0"
          class="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
        >
          {{ achievementStore.unreadNotificationCount }}
        </span>
      </button>
    </div>

    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>

    <AchievementUnlockPopup
      :achievement="achievementStore.currentUnlockAchievement"
      :show="achievementStore.showUnlockAnimation"
    />

    <NotificationCenter
      :show="showNotificationCenter"
      @close="showNotificationCenter = false"
    />

    <FriendNotificationCenter
      :show="showFriendNotificationCenter"
      @close="showFriendNotificationCenter = false"
    />

    <TutorialGuide ref="tutorialGuideRef" />

    <FriendEntryCard v-if="showFriendEntry" />

    <button
      v-if="!tutorialStore.isCompleted && !tutorialStore.state.isActive"
      class="fixed bottom-6 left-24 z-40 p-3 bg-gray-900/90 backdrop-blur-sm border border-gray-700 hover:bg-gray-800 rounded-xl transition-all text-gray-400 hover:text-white flex items-center gap-2"
      title="重新开始新手引导"
      @click="restartTutorial"
    >
      <HelpCircle class="w-5 h-5" />
      <span class="text-sm">新手引导</span>
    </button>
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>