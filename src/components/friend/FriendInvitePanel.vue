<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFriendStore } from '@/stores/friendStore'
import { Search, UserPlus, X, Check, Send, Clock, User } from 'lucide-vue-next'

const friendStore = useFriendStore()

const searchQuery = ref('')
const inviteMessage = ref('')
const showInviteModal = ref(false)
const selectedPlayer = ref<{ id: string; name: string; avatar: string } | null>(null)

const searchResults = computed(() => {
  if (!searchQuery.value.trim()) {
    return friendStore.getRecommendedPlayers()
  }
  return friendStore.searchPlayers(searchQuery.value)
})

function formatTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  if (diff < 60 * 1000) return '刚刚'
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))} 分钟前`
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))} 小时前`
  return `${Math.floor(diff / (24 * 60 * 60 * 1000))} 天前`
}

function formatExpireTime(expiresAt: number): string {
  const diff = expiresAt - Date.now()
  if (diff <= 0) return '已过期'
  const hours = Math.floor(diff / (60 * 60 * 1000))
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000))
  if (hours > 0) return `${hours}小时${minutes}分钟后过期`
  return `${minutes}分钟后过期`
}

function openInviteModal(player: { id: string; name: string; avatar: string }) {
  selectedPlayer.value = player
  inviteMessage.value = `你好！我是殡仪馆的工作人员，想加个好友互相帮助~`
  showInviteModal.value = true
}

function closeInviteModal() {
  showInviteModal.value = false
  selectedPlayer.value = null
  inviteMessage.value = ''
}

function sendInvite() {
  if (!selectedPlayer.value) return

  const success = friendStore.sendFriendInvite(
    selectedPlayer.value.id,
    inviteMessage.value.trim() || undefined
  )

  if (success) {
    closeInviteModal()
  } else {
    alert('发送邀请失败，请稍后重试')
  }
}

function acceptInvite(inviteId: string) {
  friendStore.acceptFriendInvite(inviteId)
}

function rejectInvite(inviteId: string) {
  if (confirm('确定要拒绝这个好友邀请吗？')) {
    friendStore.rejectFriendInvite(inviteId)
  }
}

function cancelInvite(inviteId: string) {
  friendStore.cancelFriendInvite(inviteId)
}

const rarityColors: Record<string, string> = {
  common: 'bg-gray-500/20 text-gray-400',
  uncommon: 'bg-green-500/20 text-green-400',
  rare: 'bg-blue-500/20 text-blue-400',
  epic: 'bg-purple-500/20 text-purple-400',
  legendary: 'bg-amber-500/20 text-amber-400'
}
</script>

<template>
  <div class="friend-invite-panel">
    <div class="mb-6">
      <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <UserPlus class="w-5 h-5 text-cyan-400" />
        添加好友
      </h3>

      <div class="relative mb-4">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索玩家ID或昵称..."
          class="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
        />
      </div>

      <div class="space-y-2">
        <div
          v-for="player in searchResults"
          :key="player.id"
          class="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors"
        >
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-2xl">
              {{ player.avatar }}
            </div>
            <div>
              <div class="font-medium text-white">{{ player.name }}</div>
              <div class="text-xs text-gray-500">
                存活 {{ player.day }} 天 · 完成 {{ player.totalOrders }} 单
                <span v-if="player.isOnline" class="ml-2 text-green-400">● 在线</span>
              </div>
            </div>
          </div>
          <button
            @click="openInviteModal(player)"
            class="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white text-sm font-medium transition-colors flex items-center gap-1"
          >
            <UserPlus class="w-4 h-4" />
            添加
          </button>
        </div>

        <div v-if="searchResults.length === 0" class="text-center py-8 text-gray-500">
          <User class="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>没有找到匹配的玩家</p>
        </div>
      </div>
    </div>

    <div v-if="friendStore.pendingInvites.length > 0" class="mb-6">
      <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Clock class="w-5 h-5 text-amber-400" />
        收到的邀请
        <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white">
          {{ friendStore.pendingInvites.length }}
        </span>
      </h3>

      <div class="space-y-3">
        <div
          v-for="invite in friendStore.pendingInvites"
          :key="invite.id"
          class="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl"
        >
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-2xl">
                {{ invite.fromPlayerAvatar }}
              </div>
              <div>
                <div class="font-medium text-white">{{ invite.fromPlayerName }}</div>
                <div class="text-xs text-gray-500">{{ formatTime(invite.createdAt) }}</div>
              </div>
            </div>
            <div class="text-xs text-amber-400 flex items-center gap-1">
              <Clock class="w-3 h-3" />
              {{ formatExpireTime(invite.expiresAt) }}
            </div>
          </div>

          <p v-if="invite.message" class="text-sm text-gray-400 mb-3 p-2 bg-gray-800/50 rounded-lg">
            "{{ invite.message }}"
          </p>

          <div class="flex gap-2">
            <button
              @click="acceptInvite(invite.id)"
              class="flex-1 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white text-sm font-medium transition-colors flex items-center justify-center gap-1"
            >
              <Check class="w-4 h-4" />
              接受
            </button>
            <button
              @click="rejectInvite(invite.id)"
              class="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 text-sm font-medium transition-colors flex items-center justify-center gap-1"
            >
              <X class="w-4 h-4" />
              拒绝
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="friendStore.sentInvites.length > 0">
      <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Send class="w-5 h-5 text-blue-400" />
        已发送的邀请
      </h3>

      <div class="space-y-2">
        <div
          v-for="invite in friendStore.sentInvites"
          :key="invite.id"
          class="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xl">
              {{ invite.fromPlayerAvatar }}
            </div>
            <div>
              <div class="font-medium text-white">{{ invite.toPlayerId }}</div>
              <div class="text-xs text-gray-500">{{ formatExpireTime(invite.expiresAt) }}</div>
            </div>
          </div>
          <button
            @click="cancelInvite(invite.id)"
            class="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 rounded-lg text-red-400 text-xs font-medium transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showInviteModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            class="absolute inset-0 bg-black/70 backdrop-blur-sm"
            @click="closeInviteModal"
          ></div>

          <div class="relative w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl p-6 shadow-2xl">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-xl font-bold text-white">发送好友邀请</h3>
              <button
                @click="closeInviteModal"
                class="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <div v-if="selectedPlayer" class="flex items-center gap-3 p-4 bg-gray-800/50 rounded-xl mb-4">
              <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-3xl">
                {{ selectedPlayer.avatar }}
              </div>
              <div>
                <div class="font-bold text-white text-lg">{{ selectedPlayer.name }}</div>
                <div class="text-sm text-gray-400">ID: {{ selectedPlayer.id }}</div>
              </div>
            </div>

            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-400 mb-2">留言（可选）</label>
              <textarea
                v-model="inviteMessage"
                placeholder="输入邀请留言..."
                rows="3"
                class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
              ></textarea>
            </div>

            <div class="flex gap-3">
              <button
                @click="closeInviteModal"
                class="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300 font-medium transition-colors"
              >
                取消
              </button>
              <button
                @click="sendInvite"
                class="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Send class="w-5 h-5" />
                发送邀请
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
