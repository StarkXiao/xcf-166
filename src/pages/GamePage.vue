<script setup lang="ts">
import { onMounted, onUnmounted, watch, ref } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { useOrderStore } from '@/stores/orderStore'
import { useEventStore } from '@/stores/eventStore'
import { useSeasonStore } from '@/stores/seasonStore'
import { useCharacterStore } from '@/stores/characterStore'
import { useTaskStore } from '@/stores/taskStore'
import { useOfflineStore } from '@/stores/offlineStore'
import { audioManager } from '@/game/audio'
import {
  createAutoSaveController,
  getActiveSlotIndex,
  setActiveSlotIndex,
  isSlotOccupied,
  checkCloudSyncPrompt,
  loadManifest,
  getAllSlotInfos
} from '@/game/saveManager'
import StatusBar from '@/components/StatusBar.vue'
import OrderPanel from '@/components/OrderPanel.vue'
import Workbench from '@/components/Workbench.vue'
import EventModal from '@/components/EventModal.vue'
import OfflineEarningsDialog from '@/components/OfflineEarningsDialog.vue'
import SaveSlotDialog from '@/components/SaveSlotDialog.vue'
import HomeSeasonCard from '@/components/season/HomeSeasonCard.vue'
import HomeTaskCard from '@/components/task/HomeTaskCard.vue'
import TaskReminder from '@/components/task/TaskReminder.vue'

const gameStore = useGameStore()
const orderStore = useOrderStore()
const eventStore = useEventStore()
const seasonStore = useSeasonStore()
const characterStore = useCharacterStore()
const taskStore = useTaskStore()
const offlineStore = useOfflineStore()

const showStartScreen = ref(true)
const hasExistingSave = ref(false)
const showSaveSlotDialog = ref(false)
const autoSaveToast = ref(false)
const autoSaveTime = ref('')
const cloudPromptMessage = ref('')

let heartbeatTimer: ReturnType<typeof setInterval> | null = null
const autoSaveController = createAutoSaveController()

function startAutoSave() {
  const activeSlot = getActiveSlotIndex()
  autoSaveController.start(() => gameStore.buildSaveData(), activeSlot)
}

function stopAutoSave() {
  autoSaveController.stop()
}

function handleNewGame(slotIndex?: number) {
  audioManager.playClick()
  audioManager.init().then(() => {
    audioManager.startAmbient()
  })
  orderStore.clearAllOrders()
  eventStore.clearAllEvents()
  characterStore.resetCharacters()
  offlineStore.resetOffline()

  if (slotIndex !== undefined) {
    setActiveSlotIndex(slotIndex)
  }

  gameStore.startGame()
  orderStore.generateNewOrders(1)
  eventStore.queueIntroEvents()
  characterStore.checkUnlockConditions()
  showStartScreen.value = false
  startHeartbeat()
  startAutoSave()
}

function handleContinue(slotIndex?: number) {
  audioManager.playClick()
  audioManager.init().then(() => {
    audioManager.startAmbient()
  })
  const saveData = gameStore.loadGame(slotIndex)
  if (saveData) {
    orderStore.clearAllOrders()
    eventStore.clearAllEvents()
    orderStore.restoreFromSave(
      saveData.pendingOrders,
      saveData.acceptedOrders,
      saveData.currentOrderId
    )
    eventStore.restoreFromSave({
      eventQueue: saveData.eventQueue,
      currentEvent: saveData.currentEvent,
      eventHistory: saveData.eventHistory,
      eventResultMessage: saveData.eventResultMessage
    })
    characterStore.checkUnlockConditions()
    showStartScreen.value = false
    startHeartbeat()
    startAutoSave()

    offlineStore.loadFromStorage()
    const earnings = offlineStore.checkOfflineEarnings()
    if (earnings) {
      setTimeout(() => {
        offlineStore.showClaimDialog = true
      }, 800)
    }

    const activeSlot = getActiveSlotIndex()
    const prompt = checkCloudSyncPrompt(activeSlot)
    if (prompt.shouldPrompt) {
      cloudPromptMessage.value = prompt.message
      setTimeout(() => { cloudPromptMessage.value = '' }, 5000)
    }
  }
}

function handleGameOverRestart() {
  audioManager.playClick()
  stopAutoSave()
  gameStore.deleteSave()
  orderStore.clearAllOrders()
  eventStore.clearAllEvents()
  gameStore.resetGame()
  orderStore.generateNewOrders(1)
  eventStore.queueIntroEvents()
}

function handleSlotSelect(slotIndex: number) {
  if (isSlotOccupied(slotIndex)) {
    handleContinue(slotIndex)
  } else {
    handleNewGame(slotIndex)
  }
}

function handleSlotDelete(_slotIndex: number) {
  hasExistingSave.value = gameStore.hasSave()
}

function handleManualSave() {
  audioManager.playClick()
  gameStore.saveGame()
  const now = new Date()
  autoSaveTime.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  autoSaveToast.value = true
  setTimeout(() => { autoSaveToast.value = false }, 2000)
}

function handleOpenSaveManager() {
  audioManager.playClick()
  showSaveSlotDialog.value = true
}

onMounted(() => {
  gameStore.tryMigrateLegacySave()
  hasExistingSave.value = gameStore.hasSave()
  seasonStore.initSeason()
  taskStore.initTaskCenter()
  offlineStore.loadFromStorage()
})

onUnmounted(() => {
  stopHeartbeat()
  stopAutoSave()
})

function startHeartbeat() {
  stopHeartbeat()
  heartbeatTimer = setInterval(() => {
    offlineStore.updateLastOnlineTime()
  }, 60000)
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
}

watch(() => gameStore.gameStarted, (started) => {
  if (started) {
    showStartScreen.value = false
  }
})

const bgClass = () => {
  if (!gameStore.gameStarted) return ''
  return gameStore.isNight
    ? 'bg-gradient-to-b from-gray-950 via-gray-900 to-black'
    : 'bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900'
}
</script>

<template>
  <div class="game-app h-screen w-screen overflow-hidden flex flex-col" :class="bgClass()">
    <Transition name="fade">
      <div
        v-if="showStartScreen"
        class="absolute inset-0 z-50 flex items-center justify-center bg-black"
      >
        <div class="text-center max-w-lg px-8">
          <div class="mb-8">
            <h1 class="text-5xl font-bold text-red-500 mb-2 tracking-wider">
              殡仪馆地下二层
            </h1>
            <p class="text-gray-500 text-sm tracking-widest">MORGUE B2</p>
          </div>

          <div class="h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent mb-8"></div>

          <p class="text-gray-400 mb-8 leading-relaxed text-sm">
            白天接单，夜里处理。<br>
            那些"不太对劲"的遗物，在等着你的到来。<br>
            <span class="text-red-400">记住，凌晨三点前必须离开。</span>
          </p>

          <div class="space-y-3">
            <button
              @click="handleNewGame()"
              class="w-full py-4 bg-red-600 hover:bg-red-500 rounded text-white font-medium text-lg transition-all hover:scale-105"
            >
              🏛️ 开始新游戏
            </button>
            <button
              v-if="hasExistingSave"
              @click="handleContinue()"
              class="w-full py-3 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 font-medium transition-colors"
            >
              📂 继续游戏
            </button>
            <button
              @click="handleOpenSaveManager"
              class="w-full py-3 bg-gray-900 hover:bg-gray-800 border border-gray-700/50 rounded text-gray-400 font-medium transition-colors"
            >
              💾 存档管理
            </button>
          </div>

          <div class="mt-12 text-xs text-gray-600">
            <p>技术栈：Vue 3 + Canvas API + Pinia + Vite</p>
            <p class="mt-1">提示：点击菜单中的"初始化音频"可开启氛围音效</p>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="fade">
      <div
        v-if="gameStore.gameOver"
        class="absolute inset-0 z-50 flex items-center justify-center bg-black/95"
      >
        <div class="text-center max-w-lg px-8">
          <h1 class="text-4xl font-bold text-red-500 mb-6">游戏结束</h1>
          <p class="text-gray-400 mb-8 leading-relaxed">{{ gameStore.gameOverReason }}</p>

          <div class="bg-gray-900 rounded-lg p-4 mb-8">
            <h3 class="text-amber-400 font-medium mb-3">最终记录</h3>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div class="text-gray-500">存活天数</div>
                <div class="text-white font-bold text-xl">{{ gameStore.day }}</div>
              </div>
              <div>
                <div class="text-gray-500">处理订单</div>
                <div class="text-white font-bold text-xl">{{ gameStore.stats.totalOrdersCompleted }}</div>
              </div>
              <div>
                <div class="text-gray-500">剩余金钱</div>
                <div class="text-yellow-400 font-bold text-xl">{{ gameStore.stats.money }}</div>
              </div>
              <div>
                <div class="text-gray-500">最终声望</div>
                <div class="text-purple-400 font-bold text-xl">{{ gameStore.stats.reputation }}</div>
              </div>
            </div>
          </div>

          <button
            @click="handleGameOverRestart"
            class="w-full py-4 bg-red-600 hover:bg-red-500 rounded text-white font-medium text-lg transition-colors"
          >
            🔄 重新开始
          </button>
        </div>
      </div>
    </Transition>

    <template v-if="gameStore.gameStarted && !gameStore.gameOver">
      <StatusBar />

      <div class="flex-1 flex overflow-hidden">
        <div class="w-80 flex-shrink-0">
          <OrderPanel />
        </div>
        <div class="flex-1">
          <Workbench />
        </div>
      </div>

      <div class="fixed bottom-3 right-3 flex items-center gap-2 z-40">
        <button
          @click="handleManualSave"
          class="px-3 py-1.5 bg-gray-900/80 hover:bg-gray-800 border border-gray-700/50 rounded text-gray-400 hover:text-gray-200 text-xs transition-colors backdrop-blur-sm"
        >
          💾 保存
        </button>
        <button
          @click="handleOpenSaveManager"
          class="px-3 py-1.5 bg-gray-900/80 hover:bg-gray-800 border border-gray-700/50 rounded text-gray-400 hover:text-gray-200 text-xs transition-colors backdrop-blur-sm"
        >
          📂 存档
        </button>
      </div>
    </template>

    <EventModal />
    <OfflineEarningsDialog />
    <SaveSlotDialog
      v-model="showSaveSlotDialog"
      @select="handleSlotSelect"
      @delete="handleSlotDelete"
    />
    <HomeSeasonCard />
    <HomeTaskCard />
    <TaskReminder />

    <Transition name="fade">
      <div
        v-if="autoSaveToast"
        class="fixed top-4 right-4 z-50 bg-blue-900/90 text-blue-300 px-4 py-2 rounded-lg text-sm border border-blue-700/50 shadow-lg"
      >
        ✅ 已保存 {{ autoSaveTime }}
      </div>
    </Transition>

    <Transition name="fade">
      <div
        v-if="cloudPromptMessage"
        class="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-900/90 text-amber-300 px-4 py-2 rounded-lg text-sm border border-amber-700/50 shadow-lg max-w-sm text-center"
      >
        ☁️ {{ cloudPromptMessage }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
