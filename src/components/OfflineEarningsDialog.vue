<script setup lang="ts">
import { computed } from 'vue'
import { useOfflineStore } from '@/stores/offlineStore'
import { audioManager } from '@/game/audio'

const offlineStore = useOfflineStore()

const earnings = computed(() => offlineStore.pendingEarnings)
const offlineTime = computed(() => offlineStore.formatOfflineTime(offlineStore.pendingOfflineMinutes))

const hasEarnings = computed(() => {
  if (!earnings.value) return false
  return earnings.value.money > 0 || earnings.value.reputation > 0 || earnings.value.sanity > 0
})

function handleClaim() {
  audioManager.playClick()
  offlineStore.claimEarnings()
}

function handleDismiss() {
  audioManager.playClick()
  offlineStore.dismissEarnings()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="offlineStore.showClaimDialog && hasEarnings"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
      >
        <div class="max-w-md w-full border-2 border-amber-500/60 bg-gray-950/95 rounded-xl overflow-hidden shadow-2xl shadow-amber-900/30">
          <div class="bg-gradient-to-r from-amber-900/40 to-orange-900/30 px-6 py-4 border-b border-amber-500/30">
            <div class="flex items-center gap-3">
              <span class="text-3xl">🌙</span>
              <div>
                <h2 class="text-xl font-bold text-amber-300">离线收益</h2>
                <p class="text-amber-400/70 text-sm">你离开了 {{ offlineTime }}</p>
              </div>
            </div>
          </div>

          <div class="p-6">
            <p class="text-gray-400 text-sm mb-5 leading-relaxed">
              在你离开的时间里，地下二层依然在运转。以下是累积的收益：
            </p>

            <div class="space-y-3">
              <div
                v-if="earnings && earnings.money > 0"
                class="flex items-center justify-between p-3 bg-yellow-950/30 border border-yellow-700/30 rounded-lg"
              >
                <div class="flex items-center gap-3">
                  <span class="text-2xl">💰</span>
                  <span class="text-gray-300">金钱</span>
                </div>
                <span class="text-yellow-400 font-bold text-lg">+{{ earnings.money.toLocaleString() }}</span>
              </div>

              <div
                v-if="earnings && earnings.reputation > 0"
                class="flex items-center justify-between p-3 bg-purple-950/30 border border-purple-700/30 rounded-lg"
              >
                <div class="flex items-center gap-3">
                  <span class="text-2xl">⭐</span>
                  <span class="text-gray-300">声望</span>
                </div>
                <span class="text-purple-400 font-bold text-lg">+{{ earnings.reputation }}</span>
              </div>

              <div
                v-if="earnings && earnings.sanity > 0"
                class="flex items-center justify-between p-3 bg-green-950/30 border border-green-700/30 rounded-lg"
              >
                <div class="flex items-center gap-3">
                  <span class="text-2xl">🧠</span>
                  <span class="text-gray-300">理智</span>
                </div>
                <span class="text-green-400 font-bold text-lg">+{{ earnings.sanity }}</span>
              </div>
            </div>

            <div class="mt-5 flex gap-3">
              <button
                @click="handleClaim"
                class="flex-1 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 rounded-lg text-white font-bold text-base transition-all hover:scale-105 shadow-lg shadow-amber-900/40"
              >
                📦 领取收益
              </button>
              <button
                @click="handleDismiss"
                class="px-5 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-gray-400 text-sm transition-colors"
              >
                放弃
              </button>
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
  transition: all 0.4s ease;
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
