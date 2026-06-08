<script setup lang="ts">
import { X, AlertTriangle, CheckCircle } from 'lucide-vue-next'

const props = defineProps<{
  show: boolean
  canSkipAll?: boolean
}>()

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

function handleConfirm() {
  emit('confirm')
}

function handleCancel() {
  emit('cancel')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 z-[70] flex items-center justify-center p-4"
      >
        <div
          class="absolute inset-0 bg-black/70 backdrop-blur-sm"
          @click="handleCancel"
        />

        <div class="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
            <h3 class="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle class="w-5 h-5 text-amber-400" />
              确认跳过
            </h3>
            <button
              @click="handleCancel"
              class="p-1 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <div class="px-6 py-5">
            <div class="mb-4">
              <div class="flex items-start gap-3 mb-4">
                <div class="p-2 bg-amber-500/20 rounded-xl flex-shrink-0">
                  <AlertTriangle class="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p class="text-white font-medium mb-1">确定要跳过新手引导吗？</p>
                  <p class="text-gray-400 text-sm">
                    跳过引导将标记所有引导步骤为已完成，但你将错过：
                  </p>
                </div>
              </div>

              <div class="space-y-2 ml-11">
                <div class="flex items-center gap-2 text-sm text-gray-400">
                  <CheckCircle class="w-4 h-4 text-amber-400" />
                  <span>新手引导专属奖励（约 5000+ 金币）</span>
                </div>
                <div class="flex items-center gap-2 text-sm text-gray-400">
                  <CheckCircle class="w-4 h-4 text-amber-400" />
                  <span>「引导完成者」专属徽章</span>
                </div>
                <div class="flex items-center gap-2 text-sm text-gray-400">
                  <CheckCircle class="w-4 h-4 text-amber-400" />
                  <span>赛季经验加成</span>
                </div>
              </div>
            </div>

            <div class="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <p class="text-amber-300 text-sm">
                <strong>提示：</strong>你可以随时在设置中重新开启新手引导。
                建议新手玩家完整完成引导以获得最佳游戏体验。
              </p>
            </div>
          </div>

          <div class="px-6 py-4 border-t border-gray-800 flex gap-3">
            <button
              @click="handleCancel"
              class="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl transition-colors"
            >
              继续引导
            </button>
            <button
              @click="handleConfirm"
              class="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-gray-900 font-semibold rounded-xl transition-all shadow-lg shadow-amber-500/30"
            >
              确认跳过
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
</style>
