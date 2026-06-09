<script setup lang="ts">
import { computed } from 'vue'
import { useOfflineStore } from '@/stores/offlineStore'
import { audioManager } from '@/game/audio'

const offlineStore = useOfflineStore()

const earnings = computed(() => offlineStore.pendingEarnings)
const rawEarnings = computed(() => offlineStore.pendingRawEarnings)
const effectiveTime = computed(() => offlineStore.formatOfflineTime(offlineStore.pendingEffectiveMinutes))
const rawOfflineTime = computed(() => offlineStore.formatOfflineTime(offlineStore.pendingOfflineMinutes))
const timeCapped = computed(() => offlineStore.isTimeCapped)
const anyCap = computed(() => offlineStore.anyValueCapped)
const capInfo = computed(() => offlineStore.pendingCapInfo)

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
                <p class="text-amber-400/70 text-sm">
                  累计时长
                  <span class="text-amber-300 font-medium">{{ effectiveTime }}</span>
                  <template v-if="timeCapped">
                    <span class="text-amber-500/60">（离线 {{ rawOfflineTime }}，已达时长上限）</span>
                  </template>
                </p>
              </div>
            </div>
          </div>

          <div class="p-6">
            <p class="text-gray-400 text-sm mb-5 leading-relaxed">
              <template v-if="anyCap">
                部分资源已达离线收益上限，仅按上限值发放：
              </template>
              <template v-else>
                在你离开的时间里，地下二层依然在运转。以下是累积的收益：
              </template>
            </p>

            <div class="space-y-3">
              <div
                v-if="earnings && earnings.money > 0"
                class="flex items-center justify-between p-3 bg-yellow-950/30 border border-yellow-700/30 rounded-lg"
              >
                <div class="flex items-center gap-3">
                  <span class="text-2xl">💰</span>
                  <div class="flex flex-col">
                    <span class="text-gray-300">金钱</span>
                    <span
                      v-if="capInfo.moneyCapped && rawEarnings"
                      class="text-yellow-600/60 text-xs"
                    >原可获 +{{ rawEarnings.money.toLocaleString() }}</span>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span
                    v-if="capInfo.moneyCapped"
                    class="px-1.5 py-0.5 bg-amber-600/30 border border-amber-500/50 text-amber-300 text-[10px] rounded font-medium"
                  >上限 {{ capInfo.moneyCapValue.toLocaleString() }}</span>
                  <span class="text-yellow-400 font-bold text-lg">+{{ earnings.money.toLocaleString() }}</span>
                </div>
              </div>

              <div
                v-if="earnings && earnings.reputation > 0"
                class="flex items-center justify-between p-3 bg-purple-950/30 border border-purple-700/30 rounded-lg"
              >
                <div class="flex items-center gap-3">
                  <span class="text-2xl">⭐</span>
                  <div class="flex flex-col">
                    <span class="text-gray-300">声望</span>
                    <span
                      v-if="capInfo.reputationCapped && rawEarnings"
                      class="text-purple-600/60 text-xs"
                    >原可获 +{{ rawEarnings.reputation }}</span>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span
                    v-if="capInfo.reputationCapped"
                    class="px-1.5 py-0.5 bg-purple-600/30 border border-purple-500/50 text-purple-300 text-[10px] rounded font-medium"
                  >上限 {{ capInfo.reputationCapValue }}</span>
                  <span class="text-purple-400 font-bold text-lg">+{{ earnings.reputation }}</span>
                </div>
              </div>

              <div
                v-if="earnings && earnings.sanity > 0"
                class="flex items-center justify-between p-3 bg-green-950/30 border border-green-700/30 rounded-lg"
              >
                <div class="flex items-center gap-3">
                  <span class="text-2xl">🧠</span>
                  <div class="flex flex-col">
                    <span class="text-gray-300">理智</span>
                    <span
                      v-if="capInfo.sanityCapped && rawEarnings"
                      class="text-green-600/60 text-xs"
                    >原可获 +{{ rawEarnings.sanity }}</span>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span
                    v-if="capInfo.sanityCapped"
                    class="px-1.5 py-0.5 bg-green-600/30 border border-green-500/50 text-green-300 text-[10px] rounded font-medium"
                  >上限 {{ capInfo.sanityCapValue }}</span>
                  <span class="text-green-400 font-bold text-lg">+{{ earnings.sanity }}</span>
                </div>
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
