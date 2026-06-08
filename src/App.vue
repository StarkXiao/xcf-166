<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useAchievementStore } from '@/stores/achievementStore'
import { useSeasonStore } from '@/stores/seasonStore'
import { useCharacterStore } from '@/stores/characterStore'
import { useTutorialStore } from '@/stores/tutorialStore'
import { useGameStore } from '@/stores/gameStore'
import AchievementUnlockPopup from '@/components/achievement/AchievementUnlockPopup.vue'
import NotificationCenter from '@/components/achievement/NotificationCenter.vue'
import TutorialGuide from '@/components/tutorial/TutorialGuide.vue'
import { Bell, Trophy, Store, HelpCircle } from 'lucide-vue-next'
import { useRouter, useRoute } from 'vue-router'

const achievementStore = useAchievementStore()
const seasonStore = useSeasonStore()
const characterStore = useCharacterStore()
const tutorialStore = useTutorialStore()
const gameStore = useGameStore()
const router = useRouter()
const route = useRoute()

const showNotificationCenter = ref(false)
const showNav = ref(true)
const tutorialGuideRef = ref<InstanceType<typeof TutorialGuide> | null>(null)

onMounted(() => {
  seasonStore.initSeason()
  achievementStore.initAchievements(characterStore.activeCharacter?.id || 'player_local')
  achievementStore.resyncProgress()
  tutorialStore.initTutorial(characterStore.activeCharacter?.id || 'player_local')

  if (!tutorialStore.isCompleted && tutorialStore.analytics.firstLogin) {
    setTimeout(() => {
      tutorialStore.startTutorial()
    }, 500)
  }
})

function restartTutorial() {
  tutorialStore.resetTutorial()
  tutorialStore.startTutorial()
}

watch(
  () => gameStore.stats.totalOrdersCompleted,
  (newCount, oldCount) => {
    if (newCount > oldCount && tutorialGuideRef.value) {
      tutorialGuideRef.value.handleBehaviorEvent('order_completed', { count: newCount })
    }
  }
)

watch(
  () => gameStore.stats.totalRelicsProcessed,
  (newCount, oldCount) => {
    if (newCount > oldCount && tutorialGuideRef.value) {
      tutorialGuideRef.value.handleBehaviorEvent('relic_purified', { count: newCount })
    }
  }
)

watch(
  () => achievementStore.behaviorEvents.length,
  () => {
    if (!tutorialGuideRef.value || !tutorialStore.state.isActive) return

    const lastEvent = achievementStore.behaviorEvents[achievementStore.behaviorEvents.length - 1]
    if (lastEvent) {
      const eventMap: Record<string, string> = {
        'order_accepted': 'order_accepted',
        'order_completed': 'order_completed',
        'relic_purified': 'relic_purified'
      }

      const mappedEvent = eventMap[lastEvent.eventType]
      if (mappedEvent) {
        tutorialGuideRef.value.handleBehaviorEvent(mappedEvent, lastEvent.metadata)
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
</script>

<template>
  <div class="app-container">
    <div
      v-if="showNav"
      class="fixed top-4 right-4 z-40 flex items-center gap-3"
    >
      <button
        @click="goToShop"
        class="relative p-3 bg-gray-900/90 backdrop-blur-sm rounded-xl border border-gray-700 hover:bg-gray-800 transition-colors group"
        :class="{ 'ring-2 ring-amber-500': route.name === 'shop' }"
        title="道具商城"
      >
        <Store class="w-5 h-5 text-amber-400 group-hover:text-amber-300" />
      </button>

      <button
        @click="goToAchievements"
        class="relative p-3 bg-gray-900/90 backdrop-blur-sm rounded-xl border border-gray-700 hover:bg-gray-800 transition-colors group"
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

    <TutorialGuide ref="tutorialGuideRef" />

    <button
      v-if="!tutorialStore.isCompleted && !tutorialStore.state.isActive"
      @click="restartTutorial"
      class="fixed bottom-6 left-6 z-40 p-3 bg-gray-900/90 backdrop-blur-sm border border-gray-700 hover:bg-gray-800 rounded-xl transition-all text-gray-400 hover:text-white flex items-center gap-2"
      title="重新开始新手引导"
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