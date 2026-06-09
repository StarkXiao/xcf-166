<script setup lang="ts">
import { ref, computed } from 'vue'
import type { MailPriority, MailAttachment } from '@/types/mail'
import { useMailStore } from '@/stores/mailStore'
import {
  Send,
  Plus,
  Trash2,
  X,
  Package,
} from 'lucide-vue-next'

const mailStore = useMailStore()

const show = ref(false)
const title = ref('')
const content = ref('')
const sender = ref('运营团队')
const senderAvatar = ref('📢')
const priority = ref<MailPriority>('important')
const tag = ref('')
const actionLabel = ref('')
const actionUrl = ref('')
const expiresDays = ref(7)
const tempAttachments = ref<Array<Omit<MailAttachment, 'id' | 'status' | 'claimedAt'>>>([])

const canPublish = computed(() =>
  title.value.trim() && content.value.trim()
)

function addAttachment() {
  tempAttachments.value.push({
    type: 'currency',
    itemId: `custom_att_${Date.now()}`,
    name: '',
    icon: '🎁',
    rarity: 'common',
    value: 100,
    count: 1,
  })
}

function removeAttachment(index: number) {
  tempAttachments.value.splice(index, 1)
}

function publish() {
  if (!canPublish.value) return

  const now = Date.now()
  mailStore.announce({
    title: title.value.trim(),
    content: content.value.trim(),
    sender: sender.value.trim() || '运营团队',
    senderAvatar: senderAvatar.value || '📢',
    priority: priority.value,
    tag: tag.value.trim() || undefined,
    actionLabel: actionLabel.value.trim() || undefined,
    actionUrl: actionUrl.value.trim() || undefined,
    attachments: tempAttachments.value.filter(a => a.name.trim()).map(a => ({
      ...a,
      id: `ann_att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      status: 'unclaimed' as const,
    })),
    startsAt: now,
    expiresAt: now + expiresDays.value * 86400000,
    targetSegment: 'all',
    publishedBy: 'admin',
  })

  resetForm()
  show.value = false
}

function resetForm() {
  title.value = ''
  content.value = ''
  sender.value = '运营团队'
  senderAvatar.value = '📢'
  priority.value = 'important'
  tag.value = ''
  actionLabel.value = ''
  actionUrl.value = ''
  expiresDays.value = 7
  tempAttachments.value = []
}
</script>

<template>
  <div>
    <button
      @click="show = true"
      class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 transition-colors"
    >
      <Send class="w-3.5 h-3.5" />
      发布公告
    </button>

    <Teleport to="body">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        @click.self="show = false"
      >
        <div class="w-full max-w-lg mx-4 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
          <div class="flex items-center justify-between p-5 border-b border-gray-700">
            <h3 class="text-lg font-bold text-white">发布运营公告</h3>
            <button
              @click="show = false"
              class="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-700 transition-colors"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-5 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs text-gray-400 mb-1">标题 *</label>
                <input
                  v-model="title"
                  class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="公告标题"
                />
              </div>
              <div>
                <label class="block text-xs text-gray-400 mb-1">优先级</label>
                <select
                  v-model="priority"
                  class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="normal">普通</option>
                  <option value="important">重要</option>
                  <option value="urgent">紧急</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-xs text-gray-400 mb-1">发送者</label>
                <input
                  v-model="sender"
                  class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label class="block text-xs text-gray-400 mb-1">头像</label>
                <input
                  v-model="senderAvatar"
                  class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm text-center focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label class="block text-xs text-gray-400 mb-1">标签</label>
                <input
                  v-model="tag"
                  class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="如：限时活动"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs text-gray-400 mb-1">公告内容 *</label>
              <textarea
                v-model="content"
                rows="5"
                class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                placeholder="公告正文..."
              ></textarea>
            </div>

            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-xs text-gray-400 mb-1">按钮文字</label>
                <input
                  v-model="actionLabel"
                  class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="如：前往活动"
                />
              </div>
              <div>
                <label class="block text-xs text-gray-400 mb-1">跳转路由</label>
                <input
                  v-model="actionUrl"
                  class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="/season"
                />
              </div>
              <div>
                <label class="block text-xs text-gray-400 mb-1">有效天数</label>
                <input
                  v-model.number="expiresDays"
                  type="number"
                  min="1"
                  max="90"
                  class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-xs text-gray-400 flex items-center gap-1.5">
                  <Package class="w-3.5 h-3.5" />
                  附件奖励
                </label>
                <button
                  @click="addAttachment"
                  class="flex items-center gap-1 px-2 py-1 rounded text-xs bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                >
                  <Plus class="w-3 h-3" />
                  添加
                </button>
              </div>

              <div v-if="tempAttachments.length > 0" class="space-y-2">
                <div
                  v-for="(att, i) in tempAttachments"
                  :key="i"
                  class="flex items-center gap-2 p-2 bg-gray-800/50 rounded-lg"
                >
                  <select
                    v-model="att.type"
                    class="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-white focus:outline-none"
                  >
                    <option value="currency">货币</option>
                    <option value="exp">经验</option>
                    <option value="season_exp">赛季经验</option>
                    <option value="item">道具</option>
                    <option value="badge">徽章</option>
                    <option value="title">称号</option>
                  </select>

                  <input
                    v-model="att.name"
                    class="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-white focus:outline-none"
                    placeholder="名称"
                  />

                  <input
                    v-model="att.icon"
                    class="w-10 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-white text-center focus:outline-none"
                  />

                  <input
                    v-model.number="att.value"
                    type="number"
                    class="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-white focus:outline-none"
                  />

                  <select
                    v-model="att.rarity"
                    class="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-white focus:outline-none"
                  >
                    <option value="common">普通</option>
                    <option value="uncommon">优秀</option>
                    <option value="rare">稀有</option>
                    <option value="epic">史诗</option>
                    <option value="legendary">传说</option>
                  </select>

                  <button
                    @click="removeAttachment(i)"
                    class="p-1 text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p v-else class="text-xs text-gray-600">无附件</p>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 p-5 border-t border-gray-700">
            <button
              @click="show = false"
              class="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            >
              取消
            </button>
            <button
              @click="publish"
              :disabled="!canPublish"
              class="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 text-white text-sm font-medium hover:from-indigo-400 hover:to-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send class="w-4 h-4" />
              发布公告
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
