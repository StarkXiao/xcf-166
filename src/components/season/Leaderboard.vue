<script setup lang="ts">
import { computed } from 'vue'
import { useSeasonStore } from '@/stores/seasonStore'
import { rankRewards } from '@/game/data/seasonRewards'
import { Trophy, TrendingUp, TrendingDown, Minus, Crown, Medal, Award, Gift, Clock } from 'lucide-vue-next'

const seasonStore = useSeasonStore()

const sortedLeaderboard = computed(() => {
  return [...seasonStore.displayLeaderboard].sort((a, b) => a.rank - b.rank)
})

const playerEntry = computed(() => {
  if (!seasonStore.playerSeason) return null
  return seasonStore.displayLeaderboard.find(
    (e) => e.playerId === seasonStore.playerSeason!.playerId
  )
})

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
          <span class="text-xs text-amber-300">
            赛季已结算
          </span>
        </div>
        <div v-else-if="seasonStore.isSeasonEnded" class="flex items-center gap-2 px-4 py-2 bg-red-500/20 rounded-xl border border-red-500/40">
          <Clock :size="18" class="text-red-400" />
          <span class="text-sm text-red-400 font-medium">赛季已结束</span>
          <span class="text-xs text-red-300">
            等待结算中
          </span>
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

    <div v-if="playerEntry" class="player-rank-card relative p-6 rounded-2xl overflow-hidden"
         :class="[getRankStyle(playerEntry.rank).bg, 'border-2 ' + getRankStyle(playerEntry.rank).border]">
      <div class="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>

      <div class="relative z-10 flex items-center gap-6">
        <div class="relative">
          <div
            class="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-red-600 flex items-center justify-center text-4xl"
            :class="[getRankStyle(playerEntry.rank).avatarRing, getRankStyle(playerEntry.rank).avatarGlow]"
          >
            {{ playerEntry.playerAvatar }}
          </div>
          <div
            class="absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-lg shadow-lg"
            :class="getRankStyle(playerEntry.rank).rankBg"
          >
            <Crown v-if="playerEntry.rank === 1" :size="20" />
            <Medal v-else-if="playerEntry.rank <= 3" :size="20" />
            <span v-else>{{ playerEntry.rank }}</span>
          </div>
        </div>

        <div class="flex-1">
          <div class="flex items-center gap-3 mb-2">
            <h3 class="text-2xl font-bold text-white">{{ playerEntry.playerName }}</h3>
            <span class="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm font-medium border border-purple-500/30">
              我的排名
            </span>
            <div class="flex items-center gap-1" :class="getRankChange(playerEntry.rank, playerEntry.previousRank).color">
              <component :is="getRankChange(playerEntry.rank, playerEntry.previousRank).icon" :size="16" />
              <span class="text-sm font-medium">{{ getRankChange(playerEntry.rank, playerEntry.previousRank).text }}</span>
            </div>
          </div>
          <div class="flex items-center gap-6">
            <div>
              <div class="text-sm text-gray-500">赛季积分</div>
              <div class="text-2xl font-bold text-amber-400">{{ playerEntry.score.toLocaleString() }}</div>
            </div>
            <div>
              <div class="text-sm text-gray-500">赛季等级</div>
              <div class="text-2xl font-bold text-purple-400">Lv.{{ seasonStore.playerSeason?.level || 1 }}</div>
            </div>
            <div>
              <div class="text-sm text-gray-500">完成任务</div>
              <div class="text-2xl font-bold text-green-400">{{ seasonStore.completedTasksCount }}</div>
            </div>
            <div v-if="getRankReward(playerEntry.rank)" class="ml-auto">
              <div class="text-sm text-gray-500">当前档位奖励</div>
              <div class="text-lg font-medium text-amber-300">{{ getRankReward(playerEntry.rank)?.reward }}</div>
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
            全服排行
          </h3>

          <div class="space-y-3">
            <div
              v-for="entry in sortedLeaderboard"
              :key="entry.id"
              class="rank-item relative flex items-center gap-4 p-4 rounded-xl transition-all duration-300"
              :class="[
                getRankStyle(entry.rank).bg,
                'border ' + getRankStyle(entry.rank).border,
                entry.playerId === seasonStore.playerSeason?.playerId ? 'ring-2 ring-purple-500/50' : '',
              ]"
            >
              <div class="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-xl flex-shrink-0"
                   :class="getRankStyle(entry.rank).rankBg">
                <Crown v-if="entry.rank === 1" :size="24" />
                <Medal v-else-if="entry.rank === 2" :size="24" />
                <Award v-else-if="entry.rank === 3" :size="24" />
                <span v-else>{{ entry.rank }}</span>
              </div>

              <div
                class="w-14 h-14 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-2xl flex-shrink-0"
                :class="[getRankStyle(entry.rank).avatarRing, getRankStyle(entry.rank).avatarGlow]"
              >
                {{ entry.playerAvatar }}
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-bold text-white" :class="entry.playerId === seasonStore.playerSeason?.playerId ? 'text-purple-300' : ''">
                    {{ entry.playerName }}
                    <span v-if="entry.playerId === seasonStore.playerSeason?.playerId" class="text-xs text-purple-400">(你)</span>
                  </span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-sm" :class="getRankStyle(entry.rank).rankColor">
                    {{ getRankReward(entry.rank)?.name }}
                  </span>
                  <div class="flex items-center gap-1" :class="getRankChange(entry.rank, entry.previousRank).color">
                    <component :is="getRankChange(entry.rank, entry.previousRank).icon" :size="14" />
                    <span class="text-xs font-medium">{{ getRankChange(entry.rank, entry.previousRank).text }}</span>
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
                <span class="font-bold text-white">{{ reward.name }}</span>
              </div>
              <p class="text-sm text-gray-400 ml-13">{{ reward.reward }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
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
</style>
