<script setup lang="ts">
import { computed, ref, nextTick, watch } from 'vue'
import { Swords, Heart, Shield, Zap, Clock, ArrowLeft, X, Star } from 'lucide-vue-next'
import { getStageById } from '@/game/data/dungeons'
import { useDungeonStore } from '@/stores/dungeonStore'
import { useGameStore } from '@/stores/gameStore'
import type { BattleRecord, BattleReward, BattleEvent, DropRarity } from '@/types/dungeon'

const props = defineProps({
  dungeonId: { type: String, required: true },
  stageId: { type: String, required: true },
})

const emit = defineEmits<{
  (e: 'battle-complete', record: BattleRecord, rewards: BattleReward[]): void
  (e: 'retreat'): void
}>()

const dungeonStore = useDungeonStore()
const gameStore = useGameStore()

const stage = computed(() => getStageById(props.dungeonId, props.stageId))

type BattlePhase = 'idle' | 'simulating' | 'complete'
const battlePhase = ref<BattlePhase>('idle')
const battleRecord = ref<BattleRecord | null>(null)
const battleRewards = ref<BattleReward[]>([])
const visibleEvents = ref<BattleEvent[]>([])
const logContainer = ref<HTMLElement | null>(null)

const playerMaxHp = computed(() => gameStore.stats.maxSanity)
const playerCurrentHp = ref(gameStore.stats.sanity)
const playerAttack = computed(() => Math.floor(15 + gameStore.stats.reputation * 0.3))
const playerDefense = computed(() => Math.floor(5 + gameStore.stats.totalOrdersCompleted * 0.5))

interface EnemyHpState {
  id: string
  name: string
  icon: string
  currentHp: number
  maxHp: number
}
const enemyHpStates = ref<EnemyHpState[]>([])

const displayEnemies = computed<EnemyHpState[]>(() => {
  if (enemyHpStates.value.length > 0) return enemyHpStates.value
  if (!stage.value) return []
  return stage.value.enemies.map((e) => ({
    id: e.id,
    name: e.name,
    icon: e.icon,
    currentHp: e.hp,
    maxHp: e.hp,
  }))
})

watch(stage, () => { enemyHpStates.value = [] }, { immediate: true })

const rarityColors: Record<DropRarity, string> = {
  common: 'text-gray-300 bg-gray-500/20 border-gray-500/30',
  uncommon: 'text-green-300 bg-green-500/20 border-green-500/30',
  rare: 'text-blue-300 bg-blue-500/20 border-blue-500/30',
  epic: 'text-purple-300 bg-purple-500/20 border-purple-500/30',
  legendary: 'text-amber-300 bg-amber-500/20 border-amber-500/30',
}

const rarityBadgeColors: Record<DropRarity, string> = {
  common: 'bg-gray-500 text-gray-100',
  uncommon: 'bg-green-500 text-green-100',
  rare: 'bg-blue-500 text-blue-100',
  epic: 'bg-purple-500 text-purple-100',
  legendary: 'bg-amber-500 text-amber-100',
}

function getHpBarColor(ratio: number): string {
  if (ratio > 0.6) return 'bg-green-500'
  if (ratio > 0.3) return 'bg-yellow-500'
  return 'bg-red-500'
}

function initEnemyStates() {
  if (!stage.value) return
  enemyHpStates.value = stage.value.enemies.map((e) => ({
    id: e.id,
    name: e.name,
    icon: e.icon,
    currentHp: e.hp,
    maxHp: e.hp,
  }))
}

function startBattle() {
  if (!stage.value) return

  initEnemyStates()
  playerCurrentHp.value = gameStore.stats.sanity
  visibleEvents.value = []
  battlePhase.value = 'simulating'

  const record = dungeonStore.simulateBattle(props.dungeonId, props.stageId)
  battleRecord.value = record

  revealEvents(record.events, 0)
}

function revealEvents(events: BattleEvent[], index: number) {
  if (index >= events.length) {
    finishBattle()
    return
  }

  const event = events[index]
  visibleEvents.value.push(event)

  if (event.actor === 'enemy') {
    playerCurrentHp.value = event.remainingHp
  } else if (event.actor === 'player') {
    distributeDamageToEnemies(event.damage)
  }

  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight
    }
  })

  setTimeout(() => revealEvents(events, index + 1), 150)
}

function distributeDamageToEnemies(damage: number) {
  let remaining = damage
  for (const enemy of enemyHpStates.value) {
    if (enemy.currentHp <= 0 || remaining <= 0) continue
    const applied = Math.min(enemy.currentHp, remaining)
    enemy.currentHp -= applied
    remaining -= applied
  }
}

function finishBattle() {
  if (!battleRecord.value) return
  const rewards = dungeonStore.completeBattle(battleRecord.value)
  battleRewards.value = rewards
  battlePhase.value = 'complete'
  emit('battle-complete', battleRecord.value, rewards)
}
</script>

<template>
  <div class="min-h-screen bg-gray-950 text-white flex flex-col">
    <div class="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/80">
      <div class="flex items-center gap-3">
        <button
          @click="emit('retreat')"
          class="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-all"
          :disabled="battlePhase === 'simulating'"
        >
          <ArrowLeft :size="20" />
        </button>
        <div v-if="stage">
          <h2 class="text-lg font-bold text-white">{{ stage.name }}</h2>
          <div class="flex items-center gap-3 text-xs text-gray-400">
            <span class="flex items-center gap-1">
              <Swords :size="12" class="text-purple-400" />
              战力 {{ stage.recommendedPower }}
            </span>
            <span class="flex items-center gap-1">
              <Clock :size="12" class="text-amber-400" />
              {{ stage.timeLimit }}秒
            </span>
          </div>
        </div>
      </div>
      <button
        @click="emit('retreat')"
        class="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-all"
        :disabled="battlePhase === 'simulating'"
      >
        <X :size="20" />
      </button>
    </div>

    <div class="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
      <div class="flex-1 flex gap-4 min-h-0">
        <div class="w-1/3 flex flex-col gap-3">
          <div class="p-4 rounded-xl bg-gray-900/80 border border-gray-700/50">
            <h3 class="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2">
              <Heart :size="14" class="text-red-400" />
              渡灵者
            </h3>
            <div class="mb-3">
              <div class="flex justify-between text-xs mb-1">
                <span class="text-gray-400">HP</span>
                <span class="font-mono">{{ playerCurrentHp }} / {{ playerMaxHp }}</span>
              </div>
              <div class="h-3 rounded-full bg-gray-700 overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-300"
                  :class="getHpBarColor(playerCurrentHp / playerMaxHp)"
                  :style="{ width: `${Math.max(0, (playerCurrentHp / playerMaxHp) * 100)}%` }"
                />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div class="p-2 rounded-lg bg-gray-800/60 text-center">
                <div class="flex items-center justify-center gap-1 text-xs text-gray-500">
                  <Zap :size="10" />
                  攻击
                </div>
                <div class="text-sm font-bold text-red-400">{{ playerAttack }}</div>
              </div>
              <div class="p-2 rounded-lg bg-gray-800/60 text-center">
                <div class="flex items-center justify-center gap-1 text-xs text-gray-500">
                  <Shield :size="10" />
                  防御
                </div>
                <div class="text-sm font-bold text-blue-400">{{ playerDefense }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex-1 flex flex-col gap-3 overflow-y-auto">
          <div
            v-for="enemy in displayEnemies"
            :key="enemy.id"
            class="p-3 rounded-xl bg-gray-900/80 border border-gray-700/50"
            :class="stage?.bossId === enemy.id ? 'border-red-500/30' : ''"
          >
            <div class="flex items-center gap-3 mb-2">
              <div
                class="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
                :class="stage?.bossId === enemy.id ? 'bg-gradient-to-br from-red-500 to-purple-600' : 'bg-gray-700'"
              >
                {{ enemy.icon }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-bold text-white">{{ enemy.name }}</span>
                  <span v-if="stage?.bossId === enemy.id" class="px-1.5 py-0.5 rounded text-xs bg-red-500/20 text-red-400 font-bold">BOSS</span>
                </div>
                <div class="flex justify-between text-xs text-gray-500 mt-0.5">
                  <span>HP</span>
                  <span class="font-mono">{{ enemy.currentHp }} / {{ enemy.maxHp }}</span>
                </div>
              </div>
            </div>
            <div class="h-2 rounded-full bg-gray-700 overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-300"
                :class="getHpBarColor(enemy.currentHp / enemy.maxHp)"
                :style="{ width: `${Math.max(0, (enemy.currentHp / enemy.maxHp) * 100)}%` }"
              />
            </div>
          </div>

          <div v-if="!stage" class="flex-1 flex items-center justify-center text-gray-500">
            关卡数据未找到
          </div>
        </div>
      </div>

      <div
        v-if="battlePhase === 'simulating' || battlePhase === 'complete'"
        class="h-48 rounded-xl bg-gray-900/80 border border-gray-700/50 flex flex-col overflow-hidden shrink-0"
      >
        <div class="px-4 py-2 border-b border-gray-700/50 text-xs font-bold text-gray-400 flex items-center gap-2">
          <Clock :size="12" />
          战斗日志
        </div>
        <div ref="logContainer" class="flex-1 overflow-y-auto p-3 space-y-1">
          <div
            v-for="(event, i) in visibleEvents"
            :key="i"
            class="text-xs py-1 px-2 rounded"
            :class="event.actor === 'player' ? 'bg-blue-500/10 text-blue-300' : 'bg-red-500/10 text-red-300'"
          >
            <span class="text-gray-500 font-mono mr-2">[回合{{ event.turn }}]</span>
            {{ event.description }}
          </div>
        </div>
      </div>

      <div v-if="battlePhase === 'idle'" class="mt-auto">
        <button
          @click="startBattle"
          class="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 text-white font-bold text-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all active:scale-[0.98]"
        >
          <Swords class="w-5 h-5 inline mr-2" />
          开始战斗
        </button>
      </div>
    </div>

    <div
      v-if="battlePhase === 'complete' && battleRecord"
      class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
    >
      <div
        class="w-full max-w-lg p-8 rounded-2xl border-2 animate-in"
        :class="battleRecord.result === 'victory' ? 'border-amber-500/30 bg-gradient-to-b from-amber-500/10 to-gray-900' : 'border-red-500/30 bg-gradient-to-b from-red-500/10 to-gray-900'"
      >
        <div class="text-center mb-6">
          <div class="text-6xl mb-4">{{ battleRecord.result === 'victory' ? '⚔️' : '💀' }}</div>
          <h2
            class="text-3xl font-bold mb-2"
            :class="battleRecord.result === 'victory' ? 'text-amber-400' : 'text-red-400'"
          >
            {{ battleRecord.result === 'victory' ? 'VICTORY' : 'DEFEAT' }}
          </h2>
        </div>

        <div v-if="battleRecord.result === 'victory'" class="flex justify-center gap-2 mb-6">
          <Star
            v-for="i in 3"
            :key="i"
            class="w-10 h-10 transition-all duration-500"
            :class="i <= battleRecord.starRating ? 'text-amber-400 fill-amber-400 scale-110' : 'text-gray-600'"
            :style="{ transitionDelay: `${i * 200}ms` }"
          />
        </div>

        <div class="grid grid-cols-3 gap-3 mb-6">
          <div class="p-3 rounded-xl bg-gray-900/60 border border-gray-700/50 text-center">
            <div class="text-xs text-gray-500 mb-1">造成伤害</div>
            <div class="text-xl font-bold text-red-400">{{ battleRecord.totalDamageDealt }}</div>
          </div>
          <div class="p-3 rounded-xl bg-gray-900/60 border border-gray-700/50 text-center">
            <div class="text-xs text-gray-500 mb-1">承受伤害</div>
            <div class="text-xl font-bold text-orange-400">{{ battleRecord.totalDamageTaken }}</div>
          </div>
          <div class="p-3 rounded-xl bg-gray-900/60 border border-gray-700/50 text-center">
            <div class="text-xs text-gray-500 mb-1">回合数</div>
            <div class="text-xl font-bold text-purple-400">{{ battleRecord.turnsElapsed }}</div>
          </div>
        </div>

        <div v-if="battleRecord.result === 'victory' && battleRewards.length > 0" class="mb-6">
          <h3 class="text-sm font-bold text-gray-400 mb-3">掉落奖励</h3>
          <div class="space-y-2">
            <div
              v-for="reward in battleRewards"
              :key="reward.id"
              class="flex items-center gap-3 p-3 rounded-xl border"
              :class="rarityColors[reward.rarity]"
            >
              <span class="text-2xl">{{ reward.itemIcon }}</span>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium truncate">{{ reward.itemName }}</div>
                <div class="text-xs opacity-70">x{{ reward.quantity }}</div>
              </div>
              <span
                class="px-2 py-0.5 rounded text-xs font-bold"
                :class="rarityBadgeColors[reward.rarity]"
              >
                {{ reward.rarity }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="battleRecord.result === 'defeat'" class="mb-6">
          <button
            @click="emit('retreat')"
            class="w-full py-3 rounded-xl bg-gradient-to-r from-red-500 to-orange-600 text-white font-bold hover:shadow-lg hover:shadow-red-500/30 transition-all active:scale-95"
          >
            失败复盘
          </button>
        </div>

        <div class="flex justify-center gap-4">
          <button
            @click="emit('retreat')"
            class="px-6 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-bold transition-all active:scale-95"
          >
            <ArrowLeft class="w-4 h-4 inline mr-2" />
            返回
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-in {
  animation: fadeInScale 0.5s ease-out;
}

@keyframes fadeInScale {
  0% {
    opacity: 0;
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
