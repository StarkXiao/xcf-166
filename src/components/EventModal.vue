<script setup lang="ts">
import { computed, watch } from 'vue'
import { useEventStore } from '@/stores/eventStore'
import { useGameStore } from '@/stores/gameStore'
import { audioManager } from '@/game/audio'

const eventStore = useEventStore()
const gameStore = useGameStore()

const currentEvent = computed(() => eventStore.currentEvent)
const resultMessage = computed(() => eventStore.eventResultMessage)
const hasChoices = computed(() => currentEvent.value?.choices || [])

const eventTypeStyle = computed(() => {
  switch (currentEvent.value?.type) {
    case 'anomaly': return 'border-red-500 bg-red-950/90'
    case 'choice': return 'border-purple-500 bg-purple-950/90'
    default: return 'border-gray-500 bg-gray-950/90'
  }
})

const eventIcon = computed(() => {
  switch (currentEvent.value?.type) {
    case 'anomaly': return '👻'
    case 'choice': return '❓'
    default: return '📜'
  }
})

function handleDismiss() {
  audioManager.playClick()
  eventStore.dismissEvent()
}

function handleChoice(choiceId: string) {
  audioManager.playClick()
  eventStore.makeChoice(choiceId)
}

watch(() => currentEvent.value, (event) => {
  if (event?.type === 'anomaly') {
    audioManager.playAnomaly()
    if (Math.random() < 0.5) {
      audioManager.playWhisper()
    }
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="currentEvent"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      >
        <div
          class="max-w-lg w-full border-2 rounded-lg overflow-hidden shadow-2xl shadow-black/50"
          :class="eventTypeStyle"
        >
          <div class="p-6">
            <div class="flex items-start gap-4">
              <span class="text-4xl">{{ eventIcon }}</span>
              <div class="flex-1">
                <h2 class="text-xl font-bold text-white mb-2">{{ currentEvent.title }}</h2>
                <div class="text-gray-300 whitespace-pre-line text-sm leading-relaxed">
                  {{ currentEvent.content }}
                </div>
              </div>
            </div>

            <div
              v-if="resultMessage"
              class="mt-4 p-3 bg-black/40 rounded border border-amber-500/50"
            >
              <p class="text-amber-400 text-sm text-center font-medium">
                {{ resultMessage }}
              </p>
            </div>

            <div class="mt-6 space-y-2">
              <template v-if="hasChoices.length > 0 && !resultMessage">
                <button
                  v-for="choice in hasChoices"
                  :key="choice.id"
                  @click="handleChoice(choice.id)"
                  class="w-full p-3 text-left bg-gray-800/80 hover:bg-gray-700 border border-gray-600 rounded text-gray-200 transition-colors text-sm"
                >
                  {{ choice.text }}
                </button>
              </template>
              <template v-else-if="!resultMessage">
                <button
                  @click="handleDismiss"
                  class="w-full p-3 bg-gray-800 hover:bg-gray-700 rounded text-white font-medium transition-colors"
                >
                  继续
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.9) translateY(20px);
  opacity: 0;
}
</style>
