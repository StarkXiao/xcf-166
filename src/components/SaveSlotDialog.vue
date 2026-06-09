<script setup lang="ts">
import { ref, computed } from 'vue'
import type { SaveSlotInfo, CloudSyncStatus } from '@/game/types'
import {
  getAllSlotInfos,
  isSlotOccupied,
  deleteSlot as deleteSlotFn,
  renameSlot as renameSlotFn,
  simulateCloudSync,
  checkCloudSyncPrompt,
  exportSlot,
  importSlot,
  MAX_SLOTS,
  CURRENT_VERSION
} from '@/game/saveManager'
import { audioManager } from '@/game/audio'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'select', slotIndex: number): void
  (e: 'delete', slotIndex: number): void
}>()

const slots = ref<SaveSlotInfo[]>([])
const renamingSlot = ref<number | null>(null)
const renameInput = ref('')
const syncingSlot = ref<number | null>(null)
const cloudPrompt = ref<{ slotIndex: number; message: string } | null>(null)
const showExportToast = ref(false)
const showImportToast = ref(false)
const importToastMsg = ref('')

function refreshSlots() {
  slots.value = getAllSlotInfos()
}

function openImportDialog(slotIndex: number) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const success = importSlot(slotIndex, text)
      if (success) {
        importToastMsg.value = '导入成功'
        showImportToast.value = true
        refreshSlots()
        setTimeout(() => { showImportToast.value = false }, 2000)
      } else {
        importToastMsg.value = '导入失败：格式或版本不兼容'
        showImportToast.value = true
        setTimeout(() => { showImportToast.value = false }, 3000)
      }
    } catch {
      importToastMsg.value = '导入失败：文件读取错误'
      showImportToast.value = true
      setTimeout(() => { showImportToast.value = false }, 3000)
    }
  }
  input.click()
}

function handleExport(slotIndex: number) {
  const data = exportSlot(slotIndex)
  if (!data) return
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `morgue_b2_slot_${slotIndex + 1}_${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  showExportToast.value = true
  setTimeout(() => { showExportToast.value = false }, 2000)
}

function handleClose() {
  audioManager.playClick()
  renamingSlot.value = null
  cloudPrompt.value = null
  emit('update:modelValue', false)
}

function handleSelectSlot(index: number) {
  audioManager.playClick()
  if (isSlotOccupied(index)) {
    emit('select', index)
  } else {
    emit('select', index)
  }
  handleClose()
}

function handleDeleteSlot(index: number) {
  audioManager.playClick()
  deleteSlotFn(index)
  emit('delete', index)
  refreshSlots()
}

function startRename(index: number) {
  const info = slots.value[index]
  renameInput.value = info.name
  renamingSlot.value = index
}

function confirmRename() {
  if (renamingSlot.value !== null && renameInput.value.trim()) {
    renameSlotFn(renamingSlot.value, renameInput.value.trim())
    refreshSlots()
  }
  renamingSlot.value = null
}

function cancelRename() {
  renamingSlot.value = null
}

async function handleCloudSync(index: number) {
  audioManager.playClick()
  syncingSlot.value = index
  const status: CloudSyncStatus = await simulateCloudSync(index)
  syncingSlot.value = null
  refreshSlots()
  if (status === 'failed') {
    cloudPrompt.value = { slotIndex: index, message: '云同步失败，请检查网络后重试' }
  }
}

function checkCloud(index: number) {
  const prompt = checkCloudSyncPrompt(index)
  if (prompt.shouldPrompt) {
    cloudPrompt.value = { slotIndex: index, message: prompt.message }
  } else {
    cloudPrompt.value = null
  }
}

function dismissCloudPrompt() {
  cloudPrompt.value = null
}

function formatDate(ts: number): string {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function syncStatusIcon(status: CloudSyncStatus): string {
  switch (status) {
    case 'synced': return '☁️'
    case 'syncing': return '⏳'
    case 'failed': return '⚠️'
    default: return '📁'
  }
}

function syncStatusLabel(status: CloudSyncStatus): string {
  switch (status) {
    case 'synced': return '已同步'
    case 'syncing': return '同步中...'
    case 'failed': return '同步失败'
    default: return '未同步'
  }
}

const show = computed(() => props.modelValue)

refreshSlots()
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
        @click.self="handleClose"
      >
        <div class="max-w-lg w-full border-2 border-red-500/40 bg-gray-950/95 rounded-xl overflow-hidden shadow-2xl shadow-red-900/20">
          <div class="bg-gradient-to-r from-red-900/40 to-gray-900/30 px-6 py-4 border-b border-red-500/30">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="text-3xl">💾</span>
                <div>
                  <h2 class="text-xl font-bold text-red-300">存档管理</h2>
                  <p class="text-red-400/70 text-sm">当前版本 v{{ CURRENT_VERSION }}</p>
                </div>
              </div>
              <button
                @click="handleClose"
                class="text-gray-500 hover:text-gray-300 transition-colors text-xl"
              >✕</button>
            </div>
          </div>

          <div class="p-4 max-h-[65vh] overflow-y-auto space-y-2">
            <div
              v-for="(slot, idx) in slots"
              :key="idx"
              class="group relative border rounded-lg transition-all"
              :class="isSlotOccupied(idx) ? 'border-gray-700/60 bg-gray-900/50 hover:border-gray-500/60' : 'border-gray-800/40 bg-gray-950/30 hover:border-gray-700/40'"
            >
              <div class="p-3">
                <div class="flex items-center justify-between mb-1">
                  <div class="flex items-center gap-2">
                    <template v-if="renamingSlot === idx">
                      <input
                        v-model="renameInput"
                        class="bg-gray-800 border border-gray-600 text-gray-200 text-sm px-2 py-0.5 rounded w-32 focus:outline-none focus:border-red-500"
                        @keyup.enter="confirmRename"
                        @keyup.escape="cancelRename"
                        autofocus
                      />
                      <button @click="confirmRename" class="text-green-400 text-xs hover:text-green-300">✓</button>
                      <button @click="cancelRename" class="text-red-400 text-xs hover:text-red-300">✕</button>
                    </template>
                    <template v-else>
                      <span class="text-gray-200 font-medium text-sm">{{ slot.name }}</span>
                      <button
                        @click="startRename(idx)"
                        class="text-gray-600 hover:text-gray-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >✏️</button>
                    </template>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <span class="text-xs" :title="syncStatusLabel(slot.cloudSyncStatus)">
                      {{ syncStatusIcon(slot.cloudSyncStatus) }}
                    </span>
                    <span
                      v-if="slot.isAutoSave && isSlotOccupied(idx)"
                      class="px-1.5 py-0.5 bg-blue-600/20 border border-blue-500/40 text-blue-300 text-[10px] rounded"
                    >自动</span>
                    <span
                      v-if="slot.version !== CURRENT_VERSION && isSlotOccupied(idx)"
                      class="px-1.5 py-0.5 bg-amber-600/20 border border-amber-500/40 text-amber-300 text-[10px] rounded"
                    >v{{ slot.version }}</span>
                  </div>
                </div>

                <template v-if="isSlotOccupied(idx)">
                  <div class="flex items-center gap-3 text-xs text-gray-500">
                    <span>📅 第{{ slot.day }}天</span>
                    <span>🕐 {{ formatDate(slot.timestamp) }}</span>
                  </div>

                  <div class="flex items-center gap-2 mt-2">
                    <button
                      @click="handleSelectSlot(idx)"
                      class="flex-1 py-1.5 bg-red-600/80 hover:bg-red-500 rounded text-white text-xs font-medium transition-all hover:scale-[1.02]"
                    >
                      📂 读取
                    </button>
                    <button
                      @click="handleDeleteSlot(idx)"
                      class="px-3 py-1.5 bg-gray-800 hover:bg-red-900/60 border border-gray-700 hover:border-red-700/50 rounded text-gray-400 hover:text-red-300 text-xs transition-colors"
                    >
                      🗑️
                    </button>
                    <button
                      @click="handleCloudSync(idx)"
                      :disabled="syncingSlot === idx"
                      class="px-3 py-1.5 bg-gray-800 hover:bg-blue-900/60 border border-gray-700 hover:border-blue-700/50 rounded text-gray-400 hover:text-blue-300 text-xs transition-colors disabled:opacity-50"
                    >
                      {{ syncingSlot === idx ? '⏳' : '☁️' }}
                    </button>
                    <button
                      @click="handleExport(idx)"
                      class="px-3 py-1.5 bg-gray-800 hover:bg-green-900/60 border border-gray-700 hover:border-green-700/50 rounded text-gray-400 hover:text-green-300 text-xs transition-colors"
                    >
                      📤
                    </button>
                    <button
                      @click="openImportDialog(idx)"
                      class="px-3 py-1.5 bg-gray-800 hover:bg-purple-900/60 border border-gray-700 hover:border-purple-700/50 rounded text-gray-400 hover:text-purple-300 text-xs transition-colors"
                    >
                      📥
                    </button>
                    <button
                      @click="checkCloud(idx)"
                      class="px-3 py-1.5 bg-gray-800 hover:bg-amber-900/60 border border-gray-700 hover:border-amber-700/50 rounded text-gray-400 hover:text-amber-300 text-xs transition-colors"
                    >
                      🔍
                    </button>
                  </div>
                </template>
                <template v-else>
                  <div class="flex items-center gap-2 mt-2">
                    <button
                      @click="handleSelectSlot(idx)"
                      class="flex-1 py-1.5 bg-gray-800 hover:bg-red-600/60 border border-gray-700 hover:border-red-600/50 rounded text-gray-400 hover:text-white text-xs font-medium transition-all"
                    >
                      ✨ 新存档
                    </button>
                    <button
                      @click="openImportDialog(idx)"
                      class="px-3 py-1.5 bg-gray-800 hover:bg-purple-900/60 border border-gray-700 hover:border-purple-700/50 rounded text-gray-400 hover:text-purple-300 text-xs transition-colors"
                    >
                      📥
                    </button>
                  </div>
                </template>
              </div>
            </div>
          </div>

          <div
            v-if="cloudPrompt"
            class="mx-4 mb-3 p-3 bg-amber-950/40 border border-amber-500/40 rounded-lg"
          >
            <p class="text-amber-300 text-sm mb-2">{{ cloudPrompt.message }}</p>
            <button
              @click="dismissCloudPrompt"
              class="text-amber-400/70 hover:text-amber-300 text-xs"
            >知道了</button>
          </div>

          <div class="px-4 pb-4">
            <div class="flex items-center justify-between text-[10px] text-gray-600 mt-1 mb-2 px-1">
              <span>最多 {{ MAX_SLOTS }} 个槽位</span>
              <span>自动保存每5分钟执行一次</span>
            </div>
            <button
              @click="handleClose"
              class="w-full py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 font-medium text-sm transition-colors"
            >
              关闭
            </button>
          </div>

          <div
            v-if="showExportToast"
            class="fixed bottom-8 left-1/2 -translate-x-1/2 bg-green-900/90 text-green-300 px-4 py-2 rounded-lg text-sm border border-green-700/50 shadow-lg"
          >
            导出成功
          </div>
          <div
            v-if="showImportToast"
            class="fixed bottom-8 left-1/2 -translate-x-1/2 bg-blue-900/90 text-blue-300 px-4 py-2 rounded-lg text-sm border border-blue-700/50 shadow-lg"
          >
            {{ importToastMsg }}
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
