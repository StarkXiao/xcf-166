<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { rankRewards } from '@/game/data/seasonRewards'
import type { LeaderboardType } from '@/types/season'
import {
  Trophy,
  Crown,
  Medal,
  Award,
  ArrowLeft,
  MapPin,
  Globe,
  Users,
  Gift,
  Sparkles,
  Share2,
  Link,
  Check,
  Play,
} from 'lucide-vue-next'
import { ref } from 'vue'

const route = useRoute()
const router = useRouter()

const shareLinkCopied = ref(false)

const typeNames: Record<LeaderboardType, string> = {
  global: '全服榜',
  region: '分区榜',
  friend: '好友榜',
}

const typeIcons: Record<LeaderboardType, any> = {
  global: Globe,
  region: MapPin,
  friend: Users,
}

const shareData = computed(() => {
  const query = route.query
  return {
    type: (query.type as LeaderboardType) || 'global',
    playerId: (query.playerId as string) || '',
    playerName: (query.playerName as string) || '神秘玩家',
    playerAvatar: (query.playerAvatar as string) || '🎭',
    rank: parseInt(query.rank as string) || 999,
    score: parseInt(query.score as string) || 0,
    seasonId: (query.seasonId as string) || '',
    seasonName: (query.seasonName as string) || '赛季',
    regionName: (query.regionName as string) || '',
    timestamp: parseInt(query.timestamp as string) || Date.now(),
  }
})

const isValid = computed(() => {
  return shareData.value.playerId && shareData.value.rank > 0
})

function getRankStyle(rank: number) {
  if (rank === 1) {
    return {
      bg: 'bg-gradient-to-r from-amber-500/20 to-yellow-500/10',
      border: 'border-amber-500/40',
      rankBg: 'bg-gradient-to-br from-amber-400 to-yellow-500',
      rankColor: 'text-amber-400',
      avatarRing: 'ring-4 ring-amber-400/50',
      avatarGlow: 'drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]',
    }
  }
  if (rank === 2) {
    return {
      bg: 'bg-gradient-to-r from-gray-400/20 to-gray-300/10',
      border: 'border-gray-400/40',
      rankBg: 'bg-gradient-to-br from-gray-300 to-gray-400',
      rankColor: 'text-gray-300',
      avatarRing: 'ring-4 ring-gray-400/50',
      avatarGlow: 'drop-shadow-[0_0_15px_rgba(156,163,175,0.5)]',
    }
  }
  if (rank === 3) {
    return {
      bg: 'bg-gradient-to-r from-orange-600/20 to-amber-600/10',
      border: 'border-orange-500/40',
      rankBg: 'bg-gradient-to-br from-orange-400 to-amber-600',
      rankColor: 'text-orange-400',
      avatarRing: 'ring-4 ring-orange-400/50',
      avatarGlow: 'drop-shadow-[0_0_15px_rgba(251,146,60,0.5)]',
    }
  }
  if (rank <= 10) {
    return {
      bg: 'bg-gradient-to-r from-purple-600/20 to-violet-600/10',
      border: 'border-purple-500/40',
      rankBg: 'bg-gradient-to-br from-purple-500 to-violet-600',
      rankColor: 'text-purple-400',
      avatarRing: 'ring-4 ring-purple-400/50',
      avatarGlow: 'drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]',
    }
  }
  return {
    bg: 'bg-gray-900/40',
    border: 'border-gray-700/30',
    rankBg: 'bg-gray-700',
    rankColor: 'text-gray-400',
    avatarRing: '',
    avatarGlow: '',
  }
}

function getRankReward(rank: number) {
  const reward = rankRewards.find((r) => {
    if (typeof r.rank === 'number') return r.rank === rank
    const [min, max] = r.rank.split('-').map(Number)
    if (r.rank === '101+') return rank >= 101
    return rank >= min && rank <= max
  })
  return reward
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getShareLink(): string {
  return window.location.href
}

async function copyShareLink() {
  const link = getShareLink()
  try {
    await navigator.clipboard.writeText(link)
    shareLinkCopied.value = true
    setTimeout(() => {
      shareLinkCopied.value = false
    }, 2000)
  } catch (e) {
    console.error('Failed to copy link:', e)
  }
}

function goBack() {
  router.back()
}

function goToSeason() {
  router.push({ path: '/season', query: { tab: 'leaderboard' } })
}

function goToGame() {
  router.push('/')
}

const shareTitle = computed(() => {
  return `我在${shareData.value.seasonName}${typeNames[shareData.value.type]}中排名第${shareData.value.rank}名！`
})
</script>

<template>
  <div class="min-h-screen w-full share-page-bg">
    <div class="absolute inset-0 share-particles pointer-events-none"></div>

    <div class="relative z-10 flex flex-col min-h-screen">
      <div class="flex-shrink-0 px-6 py-4 border-b border-purple-900/30 bg-black/40 backdrop-blur-sm">
        <div class="flex items-center justify-between max-w-4xl mx-auto">
          <button
            @click="goBack"
            class="p-2 rounded-lg bg-gray-800/60 hover:bg-gray-700/60 text-gray-300 hover:text-white transition-all"
          >
            <ArrowLeft :size="20" />
          </button>

          <div class="text-center">
            <h1 class="text-xl font-bold bg-gradient-to-r from-purple-400 via-red-400 to-amber-400 bg-clip-text text-transparent">
              排行榜分享
            </h1>
          </div>

          <div class="w-10"></div>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-6">
        <div class="max-w-2xl mx-auto space-y-6">
          <div v-if="!isValid" class="p-8 rounded-2xl bg-gray-900/60 border border-gray-800 text-center">
            <Trophy :size="64" class="mx-auto mb-4 text-gray-600" />
            <h2 class="text-xl font-bold text-white mb-2">分享链接无效</h2>
            <p class="text-gray-500 mb-6">该分享链接已过期或参数不正确</p>
            <button
              @click="goToSeason"
              class="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-red-500 text-white font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all active:scale-95"
            >
              返回排行榜
            </button>
          </div>

          <template v-else>
            <div class="share-hero-card relative overflow-hidden rounded-3xl p-8 border-2"
                 :class="[getRankStyle(shareData.rank).bg, getRankStyle(shareData.rank).border]">
              <div class="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/20 via-purple-500/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
              <div class="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-red-500/20 to-transparent rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>

              <div class="relative z-10">
                <div class="flex items-center justify-center gap-2 mb-4">
                  <div class="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
                    <Sparkles :size="14" class="text-amber-400" />
                    <span class="text-sm font-medium text-gray-300">{{ shareData.seasonName }}</span>
                  </div>
                  <div class="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
                    <component :is="typeIcons[shareData.type]" :size="14" class="text-purple-400" />
                    <span class="text-sm font-medium text-gray-300">{{ typeNames[shareData.type] }}</span>
                  </div>
                </div>

                <div class="text-center mb-8">
                  <h1 class="text-3xl md:text-4xl font-bold text-white mb-3">
                    {{ shareTitle }}
                  </h1>
                  <p class="text-gray-400">快来挑战我吧！</p>
                </div>

                <div class="flex flex-col items-center">
                  <div class="relative mb-6">
                    <div
                      class="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-purple-600 via-red-600 to-amber-600 flex items-center justify-center text-6xl md:text-7xl"
                      :class="[getRankStyle(shareData.rank).avatarRing, getRankStyle(shareData.rank).avatarGlow]"
                    >
                      {{ shareData.playerAvatar }}
                    </div>
                    <div
                      class="absolute -bottom-3 -right-3 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center font-bold text-white text-2xl md:text-3xl shadow-2xl"
                      :class="getRankStyle(shareData.rank).rankBg"
                    >
                      <Crown v-if="shareData.rank === 1" :size="28" />
                      <Medal v-else-if="shareData.rank === 2" :size="28" />
                      <Award v-else-if="shareData.rank === 3" :size="28" />
                      <span v-else>{{ shareData.rank }}</span>
                    </div>
                  </div>

                  <div class="text-center mb-4">
                    <div class="text-2xl md:text-3xl font-bold text-white mb-2">{{ shareData.playerName }}</div>
                    <div class="flex items-center justify-center gap-4 text-gray-400">
                      <div class="flex items-center gap-1">
                        <Trophy :size="16" class="text-amber-400" />
                        <span class="text-amber-300 font-bold text-lg">{{ shareData.score.toLocaleString() }}</span>
                        <span>积分</span>
                      </div>
                      <div v-if="shareData.regionName" class="flex items-center gap-1">
                        <MapPin :size="16" class="text-blue-400" />
                        <span class="text-blue-300">{{ shareData.regionName }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="getRankReward(shareData.rank)" class="p-6 rounded-2xl bg-gray-900/60 border border-gray-800">
              <div class="flex items-center gap-3 mb-4">
                <Gift :size="24" class="text-amber-400" />
                <h3 class="text-xl font-bold text-white">获得奖励</h3>
              </div>

              <div class="reward-highlight p-5 rounded-xl border-2"
                   :class="{
                     'border-amber-500/50 bg-amber-500/10': shareData.rank === 1,
                     'border-gray-400/50 bg-gray-400/10': shareData.rank === 2,
                     'border-orange-500/50 bg-orange-500/10': shareData.rank === 3,
                     'border-purple-500/50 bg-purple-500/10': shareData.rank > 3,
                   }">
                <div class="flex items-center gap-4">
                  <div class="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                       :class="getRankStyle(shareData.rank).rankBg">
                    <Crown v-if="shareData.rank === 1" :size="28" />
                    <Medal v-else-if="shareData.rank === 2" :size="28" />
                    <Award v-else-if="shareData.rank === 3" :size="28" />
                    <span v-else>#{{ shareData.rank }}</span>
                  </div>
                  <div>
                    <div class="text-lg font-bold text-white">{{ getRankReward(shareData.rank)?.name }}</div>
                    <div class="text-amber-300">{{ getRankReward(shareData.rank)?.reward }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <button
                @click="goToGame"
                class="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-red-600 text-white font-bold text-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all active:scale-95"
              >
                <Play :size="22" />
                立即挑战
              </button>
              <button
                @click="goToSeason"
                class="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-gray-800/60 border border-gray-700 text-white font-bold text-lg hover:bg-gray-700/60 hover:border-purple-500/30 transition-all active:scale-95"
              >
                <Trophy :size="22" />
                查看排行
              </button>
            </div>

            <div class="p-6 rounded-2xl bg-gray-900/60 border border-gray-800">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2">
                  <Share2 :size="20" class="text-green-400" />
                  <h3 class="text-lg font-bold text-white">分享给好友</h3>
                </div>
                <span class="text-xs text-gray-500">{{ formatDate(shareData.timestamp) }}</span>
              </div>

              <div class="flex gap-2">
                <div class="flex-1 px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-sm text-gray-300 font-mono truncate">
                  {{ getShareLink() }}
                </div>
                <button
                  @click="copyShareLink"
                  class="flex items-center gap-2 px-5 py-3 rounded-xl transition-all duration-300"
                  :class="{
                    'bg-green-500 text-white': shareLinkCopied,
                    'bg-gray-700 text-gray-300 hover:bg-gray-600': !shareLinkCopied,
                  }"
                >
                  <Check v-if="shareLinkCopied" :size="18" />
                  <Link v-else :size="18" />
                  <span class="font-medium">{{ shareLinkCopied ? '已复制' : '复制链接' }}</span>
                </button>
              </div>
            </div>

            <div class="p-6 rounded-2xl border-2 border-dashed border-gray-700/50 text-center">
              <p class="text-gray-500 text-sm">
                分享你的排名，邀请好友一起比拼！
              </p>
              <p class="text-gray-600 text-xs mt-2">
                根据最终排名获得不同档位的赛季奖励
              </p>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.share-page-bg {
  background: radial-gradient(ellipse at top, #1a0f2e 0%, #0d0a1a 50%, #05030a 100%);
}

.share-particles {
  background-image:
    radial-gradient(circle at 20% 30%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(251, 191, 36, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 60% 80%, rgba(220, 38, 38, 0.1) 0%, transparent 50%);
}

.share-hero-card {
  animation: share-glow 3s ease-in-out infinite;
}

@keyframes share-glow {
  0%, 100% {
    box-shadow: 0 0 40px rgba(139, 92, 246, 0.2), 0 0 60px rgba(251, 191, 36, 0.1);
  }
  50% {
    box-shadow: 0 0 60px rgba(139, 92, 246, 0.4), 0 0 80px rgba(251, 191, 36, 0.2);
  }
}

.reward-highlight {
  transition: all 0.3s ease;
}

.reward-highlight:hover {
  transform: translateY(-2px);
}
</style>
