<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/gameStore'
import { useOrderStore } from '@/stores/orderStore'
import { useEventStore } from '@/stores/eventStore'
import { useCharacterStore } from '@/stores/characterStore'
import { audioManager } from '@/game/audio'

const router = useRouter()
const gameStore = useGameStore()
const orderStore = useOrderStore()
const eventStore = useEventStore()
const characterStore = useCharacterStore()

const isMuted = ref(false)
const showSaveMenu = ref(false)

function togglePhase() {
  audioManager.playClick()

  if (gameStore.timePhase === 'day') {
    if (orderStore.getAcceptedCount() === 0) {
      eventStore.queueEvent({
        id: 'no-orders-warning',
        type: 'narrative',
        title: '没有订单',
        content: '你还没有接受任何订单。\n至少接受一个订单才能进入夜晚处理。'
      })
      return
    }
    gameStore.advancePhase()
    eventStore.triggerDayEndEvent(gameStore.day)
  } else {
    gameStore.advancePhase()
    orderStore.generateNewOrders(gameStore.day)
    eventStore.triggerRandomChoice()
  }
}

function toggleAudio() {
  const unmuted = audioManager.toggleMute()
  isMuted.value = !unmuted
  if (unmuted) {
    audioManager.startAmbient()
  }
}

function handleSave() {
  audioManager.playClick()
  gameStore.saveGame()
  showSaveMenu.value = false
  eventStore.queueEvent({
    id: 'save-success',
    type: 'narrative',
    title: '已保存',
    content: '游戏进度已保存到本地。'
  })
}

function handleRestart() {
  audioManager.playClick()
  if (confirm('确定要重新开始吗？当前进度将丢失。')) {
    gameStore.deleteSave()
    location.reload()
  }
  showSaveMenu.value = false
}

async function initAudio() {
  await audioManager.init()
  audioManager.startAmbient()
}

function goToCharacter() {
  audioManager.playClick()
  router.push('/character')
}

function goToShop() {
  audioManager.playClick()
  router.push('/shop')
}

function handleGoToCharacter() {
  audioManager.playClick()
  showSaveMenu.value = false
  router.push('/character')
}

function handleGoToShop() {
  audioManager.playClick()
  showSaveMenu.value = false
  router.push('/shop')
}

const phaseButtonText = () => {
  if (gameStore.timePhase === 'day') {
    return '🌙 进入夜晚'
  }
  return '☀️ 结束夜晚'
}
</script>

<template>
  <div class="status-bar bg-gray-900 border-b border-gray-800 px-4 py-3">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-6">
        <div class="flex items-center gap-2">
          <span class="text-yellow-400 text-lg">💰</span>
          <span class="text-yellow-400 font-bold">{{ gameStore.stats.money.toLocaleString() }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-purple-400 text-lg">⭐</span>
          <div class="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all"
              :style="{ width: `${gameStore.stats.reputation}%` }"
            ></div>
          </div>
          <span class="text-purple-400 text-sm">{{ gameStore.stats.reputation }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-lg">🧠</span>
          <div class="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              class="h-full transition-all"
              :style="{
                width: `${gameStore.stats.sanity}%`,
                backgroundColor: gameStore.sanityColor
              }"
            ></div>
          </div>
          <span class="text-sm" :style="{ color: gameStore.sanityColor }">
            {{ gameStore.stats.sanity }}/{{ gameStore.stats.maxSanity }}
          </span>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <div class="text-center px-4 py-1 bg-gray-800 rounded">
          <div class="text-xs text-gray-500">第 {{ gameStore.day }} 天</div>
          <div
            class="text-sm font-medium"
            :class="gameStore.isNight ? 'text-blue-400' : 'text-amber-400'"
          >
            {{ gameStore.isNight ? '🌙 夜晚' : '☀️ 白天' }}
          </div>
        </div>

        <button
          @click="goToShop"
          class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 rounded text-sm font-medium text-white transition-colors"
          :disabled="gameStore.isProcessing"
          :class="{ 'opacity-50 cursor-not-allowed': gameStore.isProcessing }"
          title="道具商城"
        >
          <span>🏪</span>
          <span class="hidden sm:inline">商城</span>
        </button>

        <button
          @click="goToCharacter"
          class="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded text-sm font-medium text-white transition-colors"
          :disabled="gameStore.isProcessing"
          :class="{ 'opacity-50 cursor-not-allowed': gameStore.isProcessing }"
          title="角色养成"
        >
          <span>🎭</span>
          <span class="hidden sm:inline">{{ characterStore.activeCharacter?.name }}</span>
          <span class="text-xs text-purple-200">Lv.{{ characterStore.activeCharacter?.level }}</span>
        </button>

        <button
          @click="togglePhase"
          class="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded text-sm font-medium text-white transition-colors"
          :disabled="gameStore.isProcessing"
          :class="{ 'opacity-50 cursor-not-allowed': gameStore.isProcessing }"
        >
          {{ phaseButtonText() }}
        </button>

        <div class="relative">
          <button
            @click="showSaveMenu = !showSaveMenu"
            class="p-2 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
            title="菜单"
          >
            <span class="text-lg">☰</span>
          </button>

          <Transition name="dropdown">
            <div
              v-if="showSaveMenu"
              class="absolute right-0 mt-2 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50"
            >
              <button
                @click="handleSave"
                class="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors"
              >
                💾 保存游戏
              </button>
              <button
                @click="handleGoToShop"
                class="w-full px-4 py-2 text-left text-sm text-amber-400 hover:bg-amber-900/30 transition-colors"
              >
                🏪 道具商城
              </button>
              <button
                @click="handleGoToCharacter"
                class="w-full px-4 py-2 text-left text-sm text-purple-400 hover:bg-purple-900/30 transition-colors"
              >
                🎭 角色养成
              </button>
              <button
                @click="handleRestart"
                class="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-900/30 transition-colors"
              >
                🔄 重新开始
              </button>
              <button
                @click="initAudio"
                class="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors"
              >
                🔊 初始化音频
              </button>
            </div>
          </Transition>
        </div>

        <button
          @click="toggleAudio"
          class="p-2 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
          :title="isMuted ? '取消静音' : '静音'"
        >
          <span class="text-lg">{{ isMuted ? '🔇' : '🔊' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
