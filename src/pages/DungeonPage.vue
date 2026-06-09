<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDungeonStore } from '@/stores/dungeonStore'
import type { BattleRecord, BattleReward } from '@/types/dungeon'
import DungeonList from '@/components/dungeon/DungeonList.vue'
import StageMap from '@/components/dungeon/StageMap.vue'
import BattleArena from '@/components/dungeon/BattleArena.vue'
import BattleResult from '@/components/dungeon/BattleResult.vue'
import DefeatReplay from '@/components/dungeon/DefeatReplay.vue'
import DungeonStats from '@/components/dungeon/DungeonStats.vue'
import { Swords, Map, BarChart3, ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const dungeonStore = useDungeonStore()

type ViewMode = 'list' | 'stages' | 'battle' | 'result' | 'replay' | 'stats'

const activeTab = ref<'list' | 'stats'>('list')
const viewMode = ref<ViewMode>('list')
const selectedDungeonId = ref<string | null>(null)
const selectedStageId = ref<string | null>(null)
const lastBattleRecord = ref<BattleRecord | null>(null)
const lastBattleRewards = ref<BattleReward[]>([])

const tabs = [
  { id: 'list' as const, name: '副本列表', icon: Map },
  { id: 'stats' as const, name: '挑战统计', icon: BarChart3 },
]

onMounted(() => {
  dungeonStore.initDungeon()
  const tab = route.query.tab as string
  if (tab === 'stats') activeTab.value = 'stats'
  const dungeon = route.query.dungeon as string
  const stage = route.query.stage as string
  if (dungeon) {
    selectedDungeonId.value = dungeon
    viewMode.value = stage ? 'battle' : 'stages'
    selectedStageId.value = stage || null
  }
})

function handleSelectDungeon(dungeonId: string) {
  selectedDungeonId.value = dungeonId
  selectedStageId.value = null
  viewMode.value = 'stages'
}

function handleSelectStage(dungeonId: string, stageId: string) {
  const check = dungeonStore.canChallengeStage(dungeonId, stageId)
  if (!check.canChallenge) return
  selectedDungeonId.value = dungeonId
  selectedStageId.value = stageId
  viewMode.value = 'battle'
}

function handleBattleComplete(record: BattleRecord, rewards: BattleReward[]) {
  lastBattleRecord.value = record
  lastBattleRewards.value = rewards
  viewMode.value = 'result'
}

function handleRetreat() {
  if (dungeonStore.isBattleInProgress) {
    dungeonStore.retreatBattle()
  }
  viewMode.value = selectedDungeonId.value ? 'stages' : 'list'
}

function handleRetry() {
  if (!selectedDungeonId.value || !selectedStageId.value) return
  const ok = dungeonStore.retryChallenge(selectedDungeonId.value, selectedStageId.value)
  if (!ok) return
  viewMode.value = 'battle'
}

function handleContinue() {
  if (lastBattleRecord.value?.result === 'defeat') {
    viewMode.value = 'stages'
  } else {
    viewMode.value = 'stages'
  }
}

function handleReviewDefeat() {
  viewMode.value = 'replay'
}

function handleBackFromStages() {
  viewMode.value = 'list'
  selectedDungeonId.value = null
}

function handleBackFromReplay() {
  viewMode.value = 'stages'
}

function goBack() {
  if (viewMode.value === 'battle') {
    viewMode.value = 'stages'
  } else if (viewMode.value === 'result') {
    viewMode.value = 'stages'
  } else if (viewMode.value === 'replay') {
    viewMode.value = 'stages'
  } else if (viewMode.value === 'stages') {
    viewMode.value = 'list'
    selectedDungeonId.value = null
  } else {
    router.push('/')
  }
}
</script>

<template>
  <div class="dungeon-page min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
    <div class="max-w-6xl mx-auto px-4 py-8">
      <div class="mb-8">
        <div class="flex items-center gap-4 mb-6">
          <button
            @click="goBack"
            class="p-2 rounded-lg bg-gray-800/60 hover:bg-gray-700/60 text-gray-300 hover:text-white transition-all"
          >
            <ArrowLeft :size="20" />
          </button>
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-xl shadow-red-500/30">
            <Swords class="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 class="text-3xl font-bold text-white">挑战副本</h1>
            <p class="text-gray-400 mt-1">探索深渊，征服未知的领域</p>
          </div>
          <div class="ml-auto flex items-center gap-4">
            <div class="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <span class="text-amber-400 text-sm">⭐</span>
              <span class="text-amber-300 font-bold">{{ dungeonStore.totalStarsEarned }}</span>
              <span class="text-gray-500 text-sm">/ {{ dungeonStore.maxStarsPossible }}</span>
            </div>
            <div class="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-xl">
              <span class="text-green-400 text-sm">✓</span>
              <span class="text-green-300 font-bold">{{ dungeonStore.totalDungeonsCleared }}</span>
              <span class="text-gray-500 text-sm">/ 3 副本通关</span>
            </div>
          </div>
        </div>

        <div v-if="viewMode === 'list' || viewMode === 'stats'" class="flex gap-2 overflow-x-auto pb-2">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            class="flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all whitespace-nowrap"
            :class="activeTab === tab.id
              ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/20'
              : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-white'"
          >
            <component :is="tab.icon" class="w-5 h-5" />
            {{ tab.name }}
          </button>
        </div>
      </div>

      <Transition name="fade" mode="out-in">
        <div v-if="viewMode === 'list'" key="list">
          <DungeonList @select-dungeon="handleSelectDungeon" />
        </div>

        <div v-else-if="viewMode === 'stages' && selectedDungeonId" key="stages">
          <StageMap
            :dungeon-id="selectedDungeonId"
            @select-stage="handleSelectStage"
            @back="handleBackFromStages"
          />
        </div>

        <div v-else-if="viewMode === 'battle' && selectedDungeonId && selectedStageId" key="battle">
          <BattleArena
            :dungeon-id="selectedDungeonId"
            :stage-id="selectedStageId"
            @battle-complete="handleBattleComplete"
            @retreat="handleRetreat"
          />
        </div>

        <div v-else-if="viewMode === 'result' && lastBattleRecord" key="result">
          <BattleResult
            :record="lastBattleRecord"
            :rewards="lastBattleRewards"
            @retry="handleRetry"
            @continue="handleContinue"
            @review-defeat="handleReviewDefeat"
          />
        </div>

        <div v-else-if="viewMode === 'replay' && selectedDungeonId && selectedStageId" key="replay">
          <DefeatReplay
            :dungeon-id="selectedDungeonId"
            :stage-id="selectedStageId"
            @retry="handleRetry"
            @back="handleBackFromReplay"
          />
        </div>

        <div v-else-if="viewMode === 'stats'" key="stats">
          <DungeonStats />
        </div>
      </Transition>
    </div>
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
