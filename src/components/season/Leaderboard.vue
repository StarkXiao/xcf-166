<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSeasonStore } from '@/stores/seasonStore'
import { rankRewards } from '@/game/data/seasonRewards'
import type { LeaderboardType, LeaderboardShareData } from '@/types/season'
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Crown,
  Medal,
  Award,
  Gift,
  Clock,
  RefreshCw,
  Share2,
  Globe,
  MapPin,
  Users,
  Link,
  Check,
  X,
  AlertCircle,
} from 'lucide-vue-next'

const router = useRouter()
const seasonStore = useSeasonStore()

const leaderboardTabs = [
  { id: 'global' as LeaderboardType, label: '全服榜', icon: Globe },
  { id: 'region' as LeaderboardType, label: '分区榜', icon: MapPin },
  { id: 'friend' as LeaderboardType, label: '好友榜', icon: Users },
]

const showShareModal = ref(false)
const shareLinkCopied = ref(false)
const generatedShareData = ref<LeaderboardShareData | null>(null)

const activeTab = computed(() => seasonStore.activeLeaderboardType)

const sortedLeaderboard = computed(() => {
  return [...seasonStore.currentLeaderboard].sort((a, b) => a.rank - b.rank)
})

const playerEntry = computed(() => {
  if (!seasonStore.playerSeason) return null
  return seasonStore.currentLeaderboard.find(
    (e) => e.playerId === seasonStore.playerSeason!.playerId
  )
})

const currentRankForReward = computed(() => {
  return playerEntry.value?.displayRank || 999
})

const tabLabel = computed(() => {
  return leaderboardTabs.find((t) => t.id === activeTab.value)?.label || ''
})

function switchTab(tabId: LeaderboardType) {
  seasonStore.setActiveLeaderboardType(tabId)
}

function getRankChange(current: number, previous?: number) {
  if (!previous) return { icon: Minus, color: 'text-gray-500', text: '-' }
  const diff = previous - current
  if (diff > 0) return { icon: TrendingUp, color: 'text-green-400', text: '+' + diff }
  if (diff < 0) return { icon: TrendingDown, color: 'text-red-400', text: diff.toString() }
  return { icon: Minus, color: 'text-gray-500', text: '-' }
}

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

function getRankDisplay(rank: number, isTied: boolean, tieCount?: number) {
  if (isTied && tieCount && tieCount > 1) {
    return `#${rank} (并列)`
  }
  return `#${rank}`
}

async function handleRefresh() {
  if (!seasonStore.canRefreshLeaderboard) return
  await seasonStore.refreshLeaderboard(activeTab.value, true)
}

function formatRefreshTime(timestamp: number) {
  if (!timestamp) return '从未刷新'
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function formatCooldown(ms: number) {
  return Math.ceil(ms / 1000) + 's'
}

function openShareModal() {
  const shareData = seasonStore.generateShareData(activeTab.value)
  if (shareData) {
    generatedShareData.value = shareData
    showShareModal.value = true
    shareLinkCopied.value = false
  }
}

function closeShareModal() {
  showShareModal.value = false
  generatedShareData.value = null
  shareLinkCopied.value = false
}

function getShareLink(): string {
  if (!generatedShareData.value) return ''
  const params = new URLSearchParams({
    type: generatedShareData.value.type,
    playerId: generatedShareData.value.playerId,
    playerName: generatedShareData.value.playerName,
    playerAvatar: generatedShareData.value.playerAvatar,
    rank: String(generatedShareData.value.rank),
    score: String(generatedShareData.value.score),
    seasonId: generatedShareData.value.seasonId,
    seasonName: generatedShareData.value.seasonName,
    regionName: generatedShareData.value.regionName || '',
    timestamp: String(generatedShareData.value.timestamp),
  })
  return `${window.location.origin}/leaderboard/share?${params.toString()}`
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

function navigateToSharePage() {
  if (!generatedShareData.value) return
  router.push({
    path: '/leaderboard/share',
    query: {
      type: generatedShareData.value.type,
      playerId: generatedShareData.value.playerId,
      playerName: generatedShareData.value.playerName,
      playerAvatar: generatedShareData.value.playerAvatar,
      rank: String(generatedShareData.value.rank),
      score: String(generatedShareData.value.score),
      seasonId: generatedShareData.value.seasonId,
      seasonName: generatedShareData.value.seasonName,
      regionName: generatedShareData.value.regionName || '',
    },
  })
  closeShareModal()
}

function getShareTitle() {
  if (!generatedShareData.value) return ''
  const typeNames: Record<LeaderboardType, string> = {
    global: '全服榜',
    region: '分区榜',
    friend: '好友榜',
  }
  return `我在${seasonStore.currentSeason?.name || '赛季'}${typeNames[generatedShareData.value.type]}中排名第${generatedShareData.value.rank}名！`
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-white flex items-center gap-3">
          <Trophy :size="28" class="text-amber-400" />
          赛季排行榜
        </h2>
        <p class="text-gray-500 mt-1">与全服玩家一较高下，赢取丰厚奖励</p>
      </div>

      <div class="flex items-center gap-4">
        <div v-if="seasonStore.isLeaderboardFrozen" class="flex items-center gap-2 px-4 py-2 bg-amber-500/20 rounded-xl border border-amber-500/40">
          <Clock :size="18" class="text-amber-400" />
          <span class="text-sm text-amber-400 font-medium">排行榜已冻结</span>
          <span class="text-xs text-amber-300">赛季已结算</span>
        </div>
        <div v-else-if="seasonStore.isSeasonEnded" class="flex items-center gap-2 px-4 py-2 bg-red-500/20 rounded-xl border border-red-500/40">
          <Clock :size="18" class="text-red-400" />
          <span class="text-sm text-red-400 font-medium">赛季已结束</span>
          <span class="text-xs text-red-300">等待结算中</span>
        </div>
        <div v-else class="flex items-center gap-2 px-4 py-2 bg-gray-800/60 rounded-xl border border-gray-700/50">
          <Clock :size="18" class="text-gray-500" />
          <span class="text-sm text-gray-400">结算倒计时</span>
          <span class="text-amber-400 font-mono font-bold">
            {{ seasonStore.timeRemaining.days }}天 {{ String(seasonStore.timeRemaining.hours).padStart(2, '0') }}:{{ String(seasonStore.timeRemaining.minutes).padStart(2, '0') }}
          </span>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <button
          v-for="tab in leaderboardTabs"
          :key="tab.id"
          @click="switchTab(tab.id)"
          class="flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-300"
          :class="{
            'bg-gradient-to-r from-purple-600/50 to-red-600/50 text-white shadow-lg shadow-purple-500/20 border border-purple-400/30':
              activeTab === tab.id,
            'text-gray-400 hover:text-white hover:bg-gray-800/50 border border-transparent': activeTab !== tab.id,
          }"
        >
          <component :is="tab.icon" :size="18" />
          <span class="font-medium">{{ tab.label }}</span>
        </button>

        <div v-if="activeTab === 'region' && seasonStore.playerRegion" class="ml-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <MapPin :size="14" class="text-blue-400" />
          <span class="text-sm text-blue-300">{{ seasonStore.playerRegion.name }} · {{ seasonStore.playerRegion.serverName }}</span>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <div class="text-xs text-gray-500">
          上次刷新: {{ formatRefreshTime(seasonStore.currentRefreshState.lastRefreshTime) }}
        </div>

        <button
          @click="handleRefresh"
          :disabled="!seasonStore.canRefreshLeaderboard"
          class="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300"
          :class="{
            'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/30 active:scale-95':
              seasonStore.canRefreshLeaderboard,
            'bg-gray-700/50 text-gray-500 cursor-not-allowed': !seasonStore.canRefreshLeaderboard,
          }"
        >
          <RefreshCw :size="16" :class="{ 'animate-spin': seasonStore.currentRefreshState.status === 'loading' }" />
          <span class="text-sm font-medium">
            {{ seasonStore.currentRefreshState.status === 'loading' ? '刷新中...' : seasonStore.currentRefreshState.cooldownRemaining > 0 ? formatCooldown(seasonStore.currentRefreshState.cooldownRemaining) : '刷新' }}
          </span>
        </button>

        <button
          v-if="playerEntry"
          @click="openShareModal"
          class="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg hover:shadow-green-500/30 transition-all duration-300 active:scale-95"
        >
          <Share2 :size="16" />
          <span class="text-sm font-medium">分享</span>
        </button>
      </div>
    </div>

    <div v-if="seasonStore.currentRefreshState.status === 'error'" class="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30">
      <AlertCircle :size="18" class="text-red-400" />
      <span class="text-sm text-red-300">{{ seasonStore.currentRefreshState.errorMessage || '刷新失败，请重试' }}</span>
    </div>

    <div v-if="playerEntry" class="player-rank-card relative p-6 rounded-2xl overflow-hidden"
         :class="[getRankStyle(playerEntry.displayRank).bg, 'border-2 ' + getRankStyle(playerEntry.displayRank).border]">
      <div class="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>

      <div class="relative z-10 flex items-center gap-6">
        <div class="relative">
          <div
            class="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-red-600 flex items-center justify-center text-4xl"
            :class="[getRankStyle(playerEntry.displayRank).avatarRing, getRankStyle(playerEntry.displayRank).avatarGlow]"
          >
            {{ playerEntry.playerAvatar }}
          </div>
          <div
            class="absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-lg shadow-lg"
            :class="getRankStyle(playerEntry.displayRank).rankBg"
          >
            <Crown v-if="playerEntry.displayRank === 1" :size="20" />
            <Medal v-else-if="playerEntry.displayRank <= 3" :size="20" />
            <span v-else>{{ playerEntry.displayRank }}</span>
          </div>
        </div>

        <div class="flex-1">
          <div class="flex items-center gap-3 mb-2 flex-wrap">
            <h3 class="text-2xl font-bold text-white">{{ playerEntry.playerName }}</h3>
            <span class="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm font-medium border border-purple-500/30">
              我的{{ tabLabel }}排名
            </span>
            <span v-if="playerEntry.isTied" class="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-sm font-medium border border-amber-500/30">
              {{ playerEntry.tieCount }}人并列
            </span>
            <div v-if="activeTab === 'global' && playerEntry.regionName" class="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/10 text-blue-300 text-xs border border-blue-500/20">
              <MapPin :size="12" />
              {{ playerEntry.regionName }}
            </div>
            <div class="flex items-center gap-1" :class="getRankChange(playerEntry.displayRank, playerEntry.previousRank).color">
              <component :is="getRankChange(playerEntry.displayRank, playerEntry.previousRank).icon" :size="16" />
              <span class="text-sm font-medium">{{ getRankChange(playerEntry.displayRank, playerEntry.previousRank).text }}</span>
            </div>
          </div>
          <div class="flex items-center gap-6 flex-wrap">
            <div>
              <div class="text-sm text-gray-500">{{ tabLabel }}排名</div>
              <div class="text-2xl font-bold text-amber-400">{{ getRankDisplay(playerEntry.displayRank, playerEntry.isTied, playerEntry.tieCount) }}</div>
            </div>
            <div>
              <div class="text-sm text-gray-500">赛季积分</div>
              <div class="text-2xl font-bold text-purple-400">{{ playerEntry.score.toLocaleString() }}</div>
            </div>
            <div v-if="activeTab === 'global'">
              <div class="text-sm text-gray-500">分区排名</div>
              <div class="text-2xl font-bold text-blue-400">{{ seasonStore.playerRegionRank > 0 ? '#' + seasonStore.playerRegionRank : '未上榜' }}</div>
            </div>
            <div v-if="activeTab === 'global'">
              <div class="text-sm text-gray-500">好友排名</div>
              <div class="text-2xl font-bold text-green-400">{{ seasonStore.playerFriendRank > 0 ? '#' + seasonStore.playerFriendRank : '未上榜' }}</div>
            </div>
            <div>
              <div class="text-sm text-gray-500">赛季等级</div>
              <div class="text-2xl font-bold text-purple-400">Lv.{{ seasonStore.playerSeason?.level || 1 }}</div>
            </div>
            <div>
              <div class="text-sm text-gray-500">完成任务</div>
              <div class="text-2xl font-bold text-green-400">{{ seasonStore.completedTasksCount }}</div>
            </div>
            <div v-if="getRankReward(currentRankForReward)" class="ml-auto">
              <div class="text-sm text-gray-500">当前档位奖励</div>
              <div class="text-lg font-medium text-amber-300">{{ getRankReward(currentRankForReward)?.reward }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-6">
      <div class="col-span-2">
        <div class="p-6 rounded-2xl bg-gray-900/60 border border-gray-800">
          <h3 class="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <Trophy :size="24" class="text-amber-400" />
            {{ tabLabel }}
            <span v-if="activeTab === 'region' && seasonStore.playerRegion" class="text-sm font-normal text-gray-400">
              ({{ seasonStore.playerRegion.name }})
            </span>
          </h3>

          <div v-if="sortedLeaderboard.length === 0" class="py-12 text-center text-gray-500">
            <Trophy :size="48" class="mx-auto mb-4 opacity-30" />
            <p>暂无排行数据</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="entry in sortedLeaderboard"
              :key="entry.id"
              class="rank-item relative flex items-center gap-4 p-4 rounded-xl transition-all duration-300"
              :class="[
                getRankStyle(entry.displayRank).bg,
                'border ' + getRankStyle(entry.displayRank).border,
                entry.playerId === seasonStore.playerSeason?.playerId ? 'ring-2 ring-purple-500/50' : '',
              ]"
            >
              <div class="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-xl flex-shrink-0"
                   :class="getRankStyle(entry.displayRank).rankBg">
                <Crown v-if="entry.displayRank === 1" :size="24" />
                <Medal v-else-if="entry.displayRank === 2" :size="24" />
                <Award v-else-if="entry.displayRank === 3" :size="24" />
                <span v-else>{{ entry.displayRank }}</span>
              </div>

              <div
                class="w-14 h-14 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-2xl flex-shrink-0"
                :class="[getRankStyle(entry.displayRank).avatarRing, getRankStyle(entry.displayRank).avatarGlow]"
              >
                {{ entry.playerAvatar }}
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1 flex-wrap">
                  <span class="font-bold text-white" :class="entry.playerId === seasonStore.playerSeason?.playerId ? 'text-purple-300' : ''">
                    {{ entry.playerName }}
                    <span v-if="entry.playerId === seasonStore.playerSeason?.playerId" class="text-xs text-purple-400">(你)</span>
                  </span>
                  <span v-if="entry.isTied" class="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-xs border border-amber-500/20">
                    并列
                  </span>
                  <span v-if="activeTab === 'global' && entry.regionName" class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 text-xs border border-blue-500/20">
                    <MapPin :size="10" />
                    {{ entry.regionName }}
                  </span>
                  <span v-if="entry.isFriend && activeTab !== 'friend'" class="px-2 py-0.5 rounded-full bg-green-500/10 text-green-300 text-xs border border-green-500/20">
                    好友
                  </span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-sm" :class="getRankStyle(entry.displayRank).rankColor">
                    {{ getRankReward(entry.displayRank)?.name }}
                  </span>
                  <div class="flex items-center gap-1" :class="getRankChange(entry.displayRank, entry.previousRank).color">
                    <component :is="getRankChange(entry.displayRank, entry.previousRank).icon" :size="14" />
                    <span class="text-xs font-medium">{{ getRankChange(entry.displayRank, entry.previousRank).text }}</span>
                  </div>
                </div>
              </div>

              <div class="text-right flex-shrink-0">
                <div class="text-2xl font-bold text-amber-400">{{ entry.score.toLocaleString() }}</div>
                <div class="text-xs text-gray-500">积分</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div class="p-6 rounded-2xl bg-gray-900/60 border border-gray-800 h-full">
          <h3 class="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <Gift :size="24" class="text-amber-400" />
            排行奖励
          </h3>

          <div class="space-y-3">
            <div
              v-for="reward in rankRewards"
              :key="reward.rank"
              class="reward-tier p-4 rounded-xl bg-gray-800/40 border border-gray-700/30 transition-all duration-300 hover:border-purple-500/30"
              :class="{
                'border-amber-500/50 bg-amber-500/10': reward.rank === 1,
                'border-gray-400/50 bg-gray-400/10': reward.rank === 2,
                'border-orange-500/50 bg-orange-500/10': reward.rank === 3,
                'border-purple-500/50 bg-purple-500/10': getRankReward(currentRankForReward)?.rank === reward.rank,
              }"
            >
              <div class="flex items-center gap-3 mb-2">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                     :class="{
                       'bg-gradient-to-br from-amber-400 to-yellow-500': reward.rank === 1,
                       'bg-gradient-to-br from-gray-300 to-gray-400': reward.rank === 2,
                       'bg-gradient-to-br from-orange-400 to-amber-600': reward.rank === 3,
                       'bg-gray-700': typeof reward.rank !== 'number',
                     }">
                  <Crown v-if="reward.rank === 1" :size="20" />
                  <Medal v-else-if="reward.rank === 2" :size="20" />
                  <Award v-else-if="reward.rank === 3" :size="20" />
                  <span v-else>#{{ reward.rank }}</span>
                </div>
                <div class="flex-1">
                  <span class="font-bold text-white">{{ reward.name }}</span>
                  <div v-if="getRankReward(currentRankForReward)?.rank === reward.rank" class="text-xs text-purple-300">当前档位</div>
                </div>
              </div>
              <p class="text-sm text-gray-400 ml-13">{{ reward.reward }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showShareModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="closeShareModal"></div>

          <div class="relative w-full max-w-lg rounded-2xl bg-gray-900 border border-gray-700 shadow-2xl overflow-hidden">
            <div class="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>

            <div class="relative z-10 p-6">
              <div class="flex items-center justify-between mb-6">
                <h3 class="text-xl font-bold text-white flex items-center gap-2">
                  <Share2 :size="22" class="text-green-400" />
                  分享我的排名
                </h3>
                <button
                  @click="closeShareModal"
                  class="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                >
                  <X :size="20" />
                </button>
              </div>

              <div v-if="generatedShareData" class="mb-6">
                <div class="share-preview p-6 rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700">
                  <div class="text-center mb-4">
                    <div class="text-sm text-gray-400 mb-2">{{ seasonStore.currentSeason?.name }}</div>
                    <div class="text-lg font-bold text-amber-400">{{ getShareTitle() }}</div>
                  </div>

                  <div class="flex items-center justify-center gap-4 mb-4">
                    <div class="relative">
                      <div
                        class="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-red-600 flex items-center justify-center text-3xl"
                        :class="getRankStyle(generatedShareData.rank).avatarRing"
                      >
                        {{ generatedShareData.playerAvatar }}
                      </div>
                      <div
                        class="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-lg"
                        :class="getRankStyle(generatedShareData.rank).rankBg"
                      >
                        <Crown v-if="generatedShareData.rank === 1" :size="16" />
                        <Medal v-else-if="generatedShareData.rank <= 3" :size="16" />
                        <span v-else>{{ generatedShareData.rank }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="text-center">
                    <div class="text-lg font-bold text-white mb-1">{{ generatedShareData.playerName }}</div>
                    <div class="flex items-center justify-center gap-4 text-sm">
                      <div>
                        <span class="text-gray-500">积分: </span>
                        <span class="text-amber-400 font-bold">{{ generatedShareData.score.toLocaleString() }}</span>
                      </div>
                      <div v-if="generatedShareData.regionName">
                        <span class="text-gray-500">分区: </span>
                        <span class="text-blue-400">{{ generatedShareData.regionName }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="mb-6">
                <label class="block text-sm font-medium text-gray-400 mb-2">分享链接</label>
                <div class="flex gap-2">
                  <div class="flex-1 px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm text-gray-300 font-mono truncate">
                    {{ getShareLink() }}
                  </div>
                  <button
                    @click="copyShareLink"
                    class="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300"
                    :class="{
                      'bg-green-500 text-white': shareLinkCopied,
                      'bg-gray-700 text-gray-300 hover:bg-gray-600': !shareLinkCopied,
                    }"
                  >
                    <Check v-if="shareLinkCopied" :size="16" />
                    <Link v-else :size="16" />
                    <span class="text-sm font-medium">{{ shareLinkCopied ? '已复制' : '复制' }}</span>
                  </button>
                </div>
              </div>

              <div class="flex gap-3">
                <button
                  @click="closeShareModal"
                  class="flex-1 px-6 py-3 rounded-xl bg-gray-700 text-gray-300 hover:bg-gray-600 font-medium transition-all duration-300"
                >
                  取消
                </button>
                <button
                  @click="navigateToSharePage"
                  class="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg hover:shadow-green-500/30 font-medium transition-all duration-300 active:scale-95"
                >
                  查看分享页
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.rank-item {
  position: relative;
  overflow: hidden;
}

.rank-item::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.03), transparent);
  transform: translateX(-100%);
  transition: transform 0.6s;
}

.rank-item:hover::before {
  transform: translateX(100%);
}

.rank-item:hover {
  transform: translateX(4px);
}

.player-rank-card {
  animation: glow 3s ease-in-out infinite;
}

@keyframes glow {
  0%, 100% {
    box-shadow: 0 0 30px rgba(139, 92, 246, 0.2);
  }
  50% {
    box-shadow: 0 0 60px rgba(139, 92, 246, 0.4);
  }
}

.reward-tier {
  transition: all 0.3s ease;
}

.reward-tier:hover {
  transform: translateY(-2px);
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div:last-child,
.modal-leave-to > div:last-child {
  transform: scale(0.9) translateY(20px);
}

.share-preview {
  background-image:
    radial-gradient(circle at 20% 30%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(220, 38, 38, 0.08) 0%, transparent 50%);
}
</style>
