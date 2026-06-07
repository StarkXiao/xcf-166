<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAchievementStore } from '@/stores/achievementStore'
import { useSeasonStore } from '@/stores/seasonStore'
import { useCharacterStore } from '@/stores/characterStore'
import AchievementUnlockPopup from '@/components/achievement/AchievementUnlockPopup.vue'
import NotificationCenter from '@/components/achievement/NotificationCenter.vue'
import { Bell, Trophy } from 'lucide-vue-next'
import { useRouter, useRoute } from 'vue-router'

const achievementStore = useAchievementStore()
const seasonStore = useSeasonStore()
const characterStore = useCharacterStore()
const router = useRouter()
const route = useRoute()

const showNotificationCenter = ref(false)
const showNav = ref(true)

onMounted(() => {
  seasonStore.initSeason()
  achievementStore.initAchievements(characterStore.activeCharacter?.id || 'player_local')
  achievementStore.resyncProgress()
})

function toggleNotificationCenter() {
  showNotificationCenter.value = !showNotificationCenter.value
}

function goToAchievements() {
  router.push('/achievements')
}
</script>

<template>
  <div class="app-container">
    <div
      v-if="showNav"
      class="fixed top-4 right-4 z-40 flex items-center gap-3"
    >
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