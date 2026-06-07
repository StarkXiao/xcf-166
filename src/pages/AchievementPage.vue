<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAchievementStore } from '@/stores/achievementStore'
import { useSeasonStore } from '@/stores/seasonStore'
import { useCharacterStore } from '@/stores/characterStore'
import { audioManager } from '@/game/audio'
import AchievementCard from '@/components/achievement/AchievementCard.vue'
import BadgeDisplay from '@/components/achievement/BadgeDisplay.vue'
import type { AchievementCategory, AchievementRarity } from '@/types/achievement'
import {
  Trophy,
  Gift,
  Target,
  Layers,
  Calendar,
  Sparkles,
  ChevronLeft,
  Crown,
  Medal,
  Award,
  TrendingUp,
  BarChart3
} from 'lucide-vue-next'

const router = useRouter()
const achievementStore = useAchievementStore()
const seasonStore = useSeasonStore()
const characterStore = useCharacterStore()

const activeTab = ref<AchievementCategory | 'all'>('all')
const showClaimAnimation = ref(false)
const claimMessage = ref('')

const tabs = [
  { id: 'all', name: '全部', icon: Trophy },
  { id: 'gameplay', name: '游戏', icon: Target },
  { id: 'collection', name: '收集', icon: Layers },
  { id: 'seasonal', name: '赛季', icon: Calendar },
  { id: 'social', name: '社交', icon: Sparkles }
] as const

const categoryNames: Record<AchievementCategory, string> = {
  gameplay: '游戏玩法',
  collection: '收集成就',
  seasonal: '赛季成就',
  social: '社交成就',
  hidden: '隐藏成就'
}

const rarityNames: Record<AchievementRarity, string> = {
  common: '普通',
  uncommon: '优秀',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说'
}

const filteredAchievements = computed(() => {
  let achievements = [...achievementStore.allAchievements]

  if (activeTab.value !== 'all') {
    achievements = achievements.filter(a => a.category === activeTab.value)
  }

  return achievements.sort((a, b) => {
    const pa = achievementStore.getPlayerAchievement(a.id)
    const pb = achievementStore.getPlayerAchievement(b.id)

    if (pa?.unlocked && !pb?.unlocked) return -1
    if (!pa?.unlocked && pb?.unlocked) return 1
    if (pa?.unlocked && pb?.unlocked) {
      return (pb.unlockedAt || 0) - (pa.unlockedAt || 0)
    }
    if (pa && pb) {
      const progressA = pa.progress / a.condition.target
      const progressB = pb.progress / b.condition.target
      return progressB - progressA
    }
    return a.order - b.order
  })
})

const recentUnlocked = computed(() => {
  return achievementStore.unlockedAchievements
    .slice()
    .sort((a, b) => (b.unlockedAt || 0) - (a.unlockedAt || 0))
    .slice(0, 3)
})

function goBack() {
  audioManager.playClick()
  router.push('/')
}

function handleClaim(achievementId: string) {
  audioManager.playClick()
  const success = achievementStore.claimAchievementReward(achievementId)
  if (success) {
    showClaimAnimation.value = true
    claimMessage.value = '🎁 奖励已发放！'
    setTimeout(() => {
      showClaimAnimation.value = false
    }, 2000)
  }
}

function handleClaimAll() {
  audioManager.playClick()
  const count = achievementStore.claimAllRewards()
  if (count > 0) {
    showClaimAnimation.value = true
    claimMessage.value = `🎁 已领取 ${count} 个成就奖励！`
    setTimeout(() => {
      showClaimAnimation.value = false
    }, 2000)
  }
}

onMounted(() => {
  seasonStore.initSeason()
  achievementStore.initAchievements(characterStore.activeCharacter?.id || 'player_local')
  achievementStore.resyncProgress()
})
</script>

<template>
  <div class="achievement-page min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white">
    <div class="container mx-auto px-4 py-6 max-w-7xl">
      <div class="flex items-center justify-between mb-6">
        <button
          @click="goBack"
          class="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ChevronLeft class="w-5 h-5" />
          <span>返回</span>
        </button>
        <h1 class="text-3xl font-bold text-amber-400 flex items-center gap-2">
          <Trophy class="w-8 h-8" />
          成就中心
        </h1>
        <div class="w-32"></div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-gradient-to-br from-amber-900/30 to-orange-900/30 rounded-2xl p-5 border border-amber-500/30">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Trophy class="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div class="text-sm text-gray-400">成就完成度</div>
              <div class="text-2xl font-bold text-amber-400">{{ achievementStore.statistics.completionRate }}%</div>
            </div>
          </div>
          <div class="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
              :style="{ width: `${achievementStore.statistics.completionRate}%` }"
            ></div>
          </div>
          <div class="text-xs text-gray-500 mt-2">
            {{ achievementStore.statistics.totalUnlocked }} / {{ achievementStore.statistics.totalCount }}
          </div>
        </div>

        <div class="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-2xl p-5 border border-blue-500/30">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Gift class="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div class="text-sm text-gray-400">待领取奖励</div>
              <div class="text-2xl font-bold text-blue-400">{{ achievementStore.unclaimedCount }}</div>
            </div>
          </div>
          <button
            v-if="achievementStore.unclaimedCount > 0"
            @click="handleClaimAll"
            class="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Gift class="w-4 h-4" />
            一键领取
          </button>
          <div v-else class="w-full py-2 bg-gray-800/50 rounded-lg text-sm text-gray-500 text-center">
            暂无待领取
          </div>
        </div>

        <div class="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-2xl p-5 border border-purple-500/30">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Medal class="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <div class="text-sm text-gray-400">获得徽章</div>
              <div class="text-2xl font-bold text-purple-400">{{ achievementStore.getUnlockedBadges().length }}</div>
            </div>
          </div>
          <div class="flex gap-1.5 flex-wrap">
            <div
              v-for="badge in achievementStore.getUnlockedBadges().slice(0, 5)"
              :key="badge.id"
              class="w-8 h-8 rounded-lg bg-gray-800/50 flex items-center justify-center text-sm"
              :title="badge.name"
            >
              {{ badge.icon }}
            </div>
            <div
              v-if="achievementStore.getUnlockedBadges().length > 5"
              class="w-8 h-8 rounded-lg bg-gray-800/50 flex items-center justify-center text-xs text-gray-500"
            >
              +{{ achievementStore.getUnlockedBadges().length - 5 }}
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-2xl p-5 border border-green-500/30">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Crown class="w-6 h-6 text-green-400" />
            </div>
            <div>
              <div class="text-sm text-gray-400">获得称号</div>
              <div class="text-2xl font-bold text-green-400">{{ achievementStore.getUnlockedTitles().length }}</div>
            </div>
          </div>
          <div class="flex gap-1.5 flex-wrap">
            <div
              v-for="title in achievementStore.getUnlockedTitles().slice(0, 3)"
              :key="title.id"
              class="px-2 py-1 rounded-lg bg-gray-800/50 text-xs flex items-center gap-1"
            >
              <span>{{ title.icon }}</span>
              <span class="truncate max-w-20">{{ title.name }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div class="lg:col-span-2 bg-gray-900/60 rounded-2xl p-6 border border-gray-700">
          <h3 class="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
            <BarChart3 class="w-5 h-5" />
            成就分类统计
          </h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div
              v-for="(stats, category) in achievementStore.statistics.byCategory"
              :key="category"
              v-show="category !== 'hidden'"
              class="bg-gray-800/50 rounded-xl p-4"
            >
              <div class="text-sm text-gray-400 mb-1">{{ categoryNames[category as AchievementCategory] }}</div>
              <div class="text-xl font-bold text-white mb-2">
                {{ stats.unlocked }} <span class="text-gray-500 text-sm">/ {{ stats.total }}</span>
              </div>
              <div class="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                  :style="{ width: `${stats.total > 0 ? (stats.unlocked / stats.total) * 100 : 0}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-gray-900/60 rounded-2xl p-6 border border-gray-700">
          <h3 class="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
            <TrendingUp class="w-5 h-5" />
            稀有度统计
          </h3>
          <div class="space-y-3">
            <div
              v-for="(stats, rarity) in achievementStore.statistics.byRarity"
              :key="rarity"
              class="flex items-center gap-3"
            >
              <div class="w-20 text-sm text-gray-400">{{ rarityNames[rarity as AchievementRarity] }}</div>
              <div class="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r"
                  :class="{
                    'from-gray-500 to-gray-600': rarity === 'common',
                    'from-green-500 to-emerald-600': rarity === 'uncommon',
                    'from-blue-500 to-cyan-600': rarity === 'rare',
                    'from-purple-500 to-pink-600': rarity === 'epic',
                    'from-amber-500 to-orange-600': rarity === 'legendary'
                  }"
                  :style="{ width: `${stats.total > 0 ? (stats.unlocked / stats.total) * 100 : 0}%` }"
                ></div>
              </div>
              <div class="w-12 text-right text-sm text-gray-400">
                {{ stats.unlocked }}/{{ stats.total }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="recentUnlocked.length > 0" class="bg-gradient-to-r from-amber-900/20 to-orange-900/20 rounded-2xl p-6 border border-amber-500/20 mb-8">
        <h3 class="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
          <Sparkles class="w-5 h-5" />
          最近解锁
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            v-for="pa in recentUnlocked"
            :key="pa.id"
            class="bg-black/30 rounded-xl p-4 border border-amber-500/20"
          >
            <div v-if="achievementStore.allAchievements.find(a => a.id === pa.achievementId)" class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-2xl"
                :class="{
                  'from-gray-500 to-gray-600': achievementStore.allAchievements.find(a => a.id === pa.achievementId)?.rarity === 'common',
                  'from-green-500 to-emerald-600': achievementStore.allAchievements.find(a => a.id === pa.achievementId)?.rarity === 'uncommon',
                  'from-blue-500 to-cyan-600': achievementStore.allAchievements.find(a => a.id === pa.achievementId)?.rarity === 'rare',
                  'from-purple-500 to-pink-600': achievementStore.allAchievements.find(a => a.id === pa.achievementId)?.rarity === 'epic',
                  'from-amber-500 to-orange-600': achievementStore.allAchievements.find(a => a.id === pa.achievementId)?.rarity === 'legendary'
                }"
              >
                {{ achievementStore.allAchievements.find(a => a.id === pa.achievementId)?.icon }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-bold text-white truncate">
                  {{ achievementStore.allAchievements.find(a => a.id === pa.achievementId)?.name }}
                </div>
                <div class="text-xs text-gray-400">
                  {{ pa.unlockedAt ? new Date(pa.unlockedAt).toLocaleDateString() : '' }}
                </div>
              </div>
              <Award class="w-5 h-5 text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      <div class="bg-gray-900/60 rounded-2xl border border-gray-700 overflow-hidden">
        <div class="flex gap-2 p-4 border-b border-gray-700 overflow-x-auto">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors"
            :class="activeTab === tab.id
              ? 'bg-amber-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'"
          >
            <component :is="tab.icon" class="w-4 h-4" />
            {{ tab.name }}
          </button>
        </div>

        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AchievementCard
              v-for="achievement in filteredAchievements"
              :key="achievement.id"
              :achievement="achievement"
              :player-achievement="achievementStore.getPlayerAchievement(achievement.id)"
              @claim="handleClaim"
            />
          </div>

          <div v-if="filteredAchievements.length === 0" class="py-12 text-center text-gray-500">
            <Trophy class="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>暂无成就</p>
          </div>
        </div>
      </div>

      <div class="mt-8 bg-gray-900/60 rounded-2xl p-6 border border-gray-700">
        <h3 class="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
          <Medal class="w-5 h-5" />
          徽章收藏
        </h3>
        <div v-if="achievementStore.getUnlockedBadges().length > 0" class="flex flex-wrap gap-4">
          <BadgeDisplay
            v-for="badge in achievementStore.getUnlockedBadges()"
            :key="badge.id"
            :name="badge.name"
            :icon="badge.icon"
            :rarity="badge.rarity"
            size="lg"
            :show-name="true"
          />
        </div>
        <div v-else class="py-8 text-center text-gray-500">
          <Medal class="w-12 h-12 mx-auto mb-2 opacity-20" />
          <p>暂无徽章，完成成就来解锁吧！</p>
        </div>
      </div>
    </div>

    <Transition name="fade">
      <div
        v-if="showClaimAnimation"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-none"
      >
        <div class="text-center animate-bounce">
          <div class="text-6xl mb-4">🎁</div>
          <div class="text-2xl font-bold text-amber-400">{{ claimMessage }}</div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
