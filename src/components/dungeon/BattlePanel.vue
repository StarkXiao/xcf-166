<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDungeonStore } from '@/stores/dungeonStore'
import { useCharacterStore } from '@/stores/characterStore'
import { getDungeonById, getStageById } from '@/game/data/dungeons'
import type { BattleRecord, BattleReward } from '@/types/dungeon'
import { Swords, Star, Package, Coins, X, RotateCcw, Link2 } from 'lucide-vue-next'

const props = defineProps<{
  dungeonId: string
  stageId: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'retry'): void
}>()

const dungeonStore = useDungeonStore()
const characterStore = useCharacterStore()

const synergyPreviewParts = computed(() => {
  const bonuses = characterStore.synergyCombatBonus
  const parts: string[] = []
  if (bonuses.processingSpeed > 0) parts.push(`处理速度+${bonuses.processingSpeed}%`)
  if (bonuses.sanityProtection > 0) parts.push(`理智保护+${bonuses.sanityProtection}%`)
  if (bonuses.rewardMultiplier > 0) parts.push(`奖励加成+${bonuses.rewardMultiplier}%`)
  if (bonuses.anomalyResistance > 0) parts.push(`异常抵抗+${bonuses.anomalyResistance}%`)
  if (bonuses.successRateBonus > 0) parts.push(`成功率+${bonuses.successRateBonus}%`)
  return parts
})

const dungeon = computed(() => getDungeonById(props.dungeonId))
const stage = computed(() => getStageById(props.dungeonId, props.stageId))

const isSimulating = ref(false)
const battleResult = ref<BattleRecord | null>(null)
const battleRewards = ref<BattleReward[]>([])
const showRewards = ref(false)

const rarityColors: Record<string, string> = {
  common: 'text-gray-300 bg-gray-500/20 border-gray-500/30',
  uncommon: 'text-green-300 bg-green-500/20 border-green-500/30',
  rare: 'text-blue-300 bg-blue-500/20 border-blue-500/30',
  epic: 'text-purple-300 bg-purple-500/20 border-purple-500/30',
  legendary: 'text-amber-300 bg-amber-500/20 border-amber-500/30',
}

function startChallenge() {
  if (!dungeonStore.canChallengeStage(props.dungeonId, props.stageId).canChallenge) return

  isSimulating.value = true
  setTimeout(() => {
    const record = dungeonStore.simulateBattle(props.dungeonId, props.stageId)
    const rewards = dungeonStore.completeBattle(record)

    battleResult.value = record
    battleRewards.value = rewards
    isSimulating.value = false
    showRewards.value = true
  }, 1500)
}

function handleRetry() {
  showRewards.value = false
  battleResult.value = null
  battleRewards.value = []
  emit('retry')
}

function handleRetryFromResult() {
  showRewards.value = false
  battleResult.value = null
  battleRewards.value = []
  startChallenge()
}
</script>

<template>
  <div class="space-y-6">
    <div v-if="showRewards && battleResult" class="battle-settlement">
      <div class="p-8 rounded-2xl border-2" :class="battleResult.result === 'victory' ? 'border-amber-500/30 bg-gradient-to-b from-amber-500/10 to-transparent' : 'border-red-500/30 bg-gradient-to-b from-red-500/10 to-transparent'">
        <div class="text-center mb-6">
          <div class="text-6xl mb-4">{{ battleResult.result === 'victory' ? '⚔️' : '💀' }}</div>
          <h2 class="text-3xl font-bold mb-2" :class="battleResult.result === 'victory' ? 'text-amber-400' : 'text-red-400'">
            {{ battleResult.result === 'victory' ? '挑战成功' : '挑战失败' }}
          </h2>
          <p class="text-gray-400">{{ stage?.name }} · {{ dungeon?.name }}</p>
        </div>

        <div v-if="battleResult.result === 'victory'" class="flex justify-center gap-2 mb-6">
          <Star
            v-for="i in 3"
            :key="i"
            class="w-10 h-10 transition-all duration-500"
            :class="i <= battleResult.starRating ? 'text-amber-400 fill-amber-400 scale-110' : 'text-gray-600'"
            :style="{ transitionDelay: `${i * 200}ms` }"
          />
        </div>

        <div class="grid grid-cols-3 gap-4 mb-6">
          <div class="p-4 rounded-xl bg-gray-900/60 border border-gray-700/50 text-center">
            <div class="text-sm text-gray-500 mb-1">造成伤害</div>
            <div class="text-2xl font-bold text-red-400">{{ battleResult.totalDamageDealt }}</div>
          </div>
          <div class="p-4 rounded-xl bg-gray-900/60 border border-gray-700/50 text-center">
            <div class="text-sm text-gray-500 mb-1">承受伤害</div>
            <div class="text-2xl font-bold text-orange-400">{{ battleResult.totalDamageTaken }}</div>
          </div>
          <div class="p-4 rounded-xl bg-gray-900/60 border border-gray-700/50 text-center">
            <div class="text-sm text-gray-500 mb-1">战斗回合</div>
            <div class="text-2xl font-bold text-purple-400">{{ battleResult.turnsElapsed }}</div>
          </div>
        </div>

        <div v-if="battleResult.synergyBonus && battleResult.synergyBonus.names.length > 0" class="mb-6 p-3 rounded-xl bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30">
          <h4 class="text-sm font-bold text-green-400 mb-2 flex items-center gap-2">
            <Link2 class="w-4 h-4" />
            组合加成生效
          </h4>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="name in battleResult.synergyBonus.names"
              :key="name"
              class="px-2 py-1 bg-green-900/50 rounded text-xs text-green-300 border border-green-500/20"
            >
              {{ name }}
            </span>
          </div>
        </div>

        <div v-if="battleResult.result === 'victory' && battleRewards.length > 0" class="mb-6">
          <h3 class="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <Package class="w-5 h-5 text-amber-400" />
            掉落奖励
          </h3>
          <div class="grid grid-cols-2 gap-3">
            <div
              v-for="reward in battleRewards"
              :key="reward.id"
              class="p-3 rounded-xl border flex items-center gap-3"
              :class="rarityColors[reward.rarity]"
            >
              <span class="text-2xl">{{ reward.itemIcon }}</span>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium truncate">{{ reward.itemName }}</div>
                <div class="text-xs opacity-70">x{{ reward.quantity }}{{ reward.isGuaranteed ? ' (保底)' : '' }}</div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="battleResult.result === 'victory' && dungeon" class="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
          <Coins class="w-6 h-6 text-amber-400" />
          <div>
            <div class="text-sm text-amber-300">首通奖励</div>
            <div class="text-lg font-bold text-amber-400">+{{ dungeon.firstClearBonus }} 金币</div>
          </div>
        </div>

        <div class="flex justify-center gap-4">
          <button
            @click="handleRetryFromResult"
            class="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 text-white font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all active:scale-95"
          >
            <RotateCcw class="w-4 h-4 inline mr-2" />
            再次挑战
          </button>
          <button
            @click="emit('close')"
            class="px-6 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-bold transition-all active:scale-95"
          >
            返回
          </button>
        </div>
      </div>
    </div>

    <div v-else-if="isSimulating" class="text-center py-16">
      <div class="battle-animation mb-6">
        <Swords class="w-16 h-16 text-purple-400 mx-auto animate-pulse" />
      </div>
      <h3 class="text-xl font-bold text-white mb-2">战斗进行中...</h3>
      <p class="text-gray-400">正在与 {{ stage?.name }} 的敌人交战</p>
      <div class="mt-4 flex justify-center gap-2">
        <div class="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style="animation-delay: 0ms"></div>
        <div class="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style="animation-delay: 150ms"></div>
        <div class="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style="animation-delay: 300ms"></div>
      </div>
    </div>

    <div v-else-if="stage && dungeon">
      <div class="p-6 rounded-2xl border-2 border-gray-700/50 bg-gray-900/60">
        <div class="flex items-start justify-between mb-6">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-3xl shadow-lg shadow-purple-500/20">
              {{ stage.icon }}
            </div>
            <div>
              <h3 class="text-xl font-bold text-white">{{ stage.name }}</h3>
              <p class="text-sm text-gray-400">{{ dungeon.name }} · {{ stage.description }}</p>
            </div>
          </div>
          <button @click="emit('close')" class="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-all">
            <X :size="20" />
          </button>
        </div>

        <div class="mb-6">
          <h4 class="text-sm font-bold text-gray-400 mb-3">敌人信息</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              v-for="enemy in stage.enemies"
              :key="enemy.id"
              class="flex items-center gap-3 p-3 rounded-xl bg-gray-800/50 border border-gray-700/50"
              :class="stage.bossId === enemy.id ? 'border-red-500/30 bg-red-500/5' : ''"
            >
              <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" :class="stage.bossId === enemy.id ? 'bg-gradient-to-br from-red-500 to-purple-600' : 'bg-gray-700'">
                {{ enemy.icon }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-bold text-white">{{ enemy.name }}</span>
                  <span v-if="stage.bossId === enemy.id" class="px-1.5 py-0.5 rounded text-xs bg-red-500/20 text-red-400 font-bold">BOSS</span>
                </div>
                <div class="flex items-center gap-3 text-xs text-gray-500 mt-1">
                  <span>HP {{ enemy.hp }}</span>
                  <span>ATK {{ enemy.attack }}</span>
                  <span>DEF {{ enemy.defense }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mb-6">
          <h4 class="text-sm font-bold text-gray-400 mb-3">可能掉落</h4>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="drop in stage.drops"
              :key="drop.id"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border"
              :class="rarityColors[drop.rarity]"
            >
              <span>{{ drop.icon }}</span>
              <span>{{ drop.name }}</span>
              <span class="opacity-60">{{ Math.round(drop.dropRate * 100) }}%</span>
              <span v-if="drop.isGuaranteed" class="text-green-400">保底</span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-3 mb-6">
          <div class="p-3 rounded-xl bg-gray-800/50 border border-gray-700/50 text-center">
            <div class="text-xs text-gray-500 mb-1">推荐战力</div>
            <div class="text-lg font-bold text-purple-400">{{ stage.recommendedPower }}</div>
          </div>
          <div class="p-3 rounded-xl bg-gray-800/50 border border-gray-700/50 text-center">
            <div class="text-xs text-gray-500 mb-1">体力消耗</div>
            <div class="text-lg font-bold text-blue-400">{{ stage.staminaCost }}</div>
          </div>
          <div class="p-3 rounded-xl bg-gray-800/50 border border-gray-700/50 text-center">
            <div class="text-xs text-gray-500 mb-1">时间限制</div>
            <div class="text-lg font-bold text-amber-400">{{ stage.timeLimit }}秒</div>
          </div>
        </div>

        <div v-if="characterStore.activeSynergies.length > 0" class="mb-6 p-3 rounded-xl bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30">
          <h4 class="text-sm font-bold text-green-400 mb-2 flex items-center gap-2">
            <Link2 class="w-4 h-4" />
            组合加成预览
          </h4>
          <div class="flex flex-wrap gap-2 mb-2">
            <span
              v-for="syn in characterStore.activeSynergies"
              :key="syn.ruleId"
              class="px-2 py-1 bg-green-900/50 rounded text-xs text-green-300 border border-green-500/20"
            >
              {{ syn.icon }} {{ syn.name }}
            </span>
          </div>
          <div v-if="synergyPreviewParts.length > 0" class="flex flex-wrap gap-2 text-xs">
            <span v-for="(part, idx) in synergyPreviewParts" :key="idx" class="text-emerald-400">{{ part }}</span>
          </div>
        </div>

        <button
          @click="startChallenge"
          class="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 text-white font-bold text-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all active:scale-[0.98]"
        >
          <Swords class="w-5 h-5 inline mr-2" />
          开始挑战
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.battle-settlement {
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
