<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useDungeonStore } from '@/stores/dungeonStore'
import type { ReplayAnalysis } from '@/types/dungeon'
import { Skull, AlertTriangle, Lightbulb, Heart, Swords, Clock, TrendingUp, ArrowLeft, RotateCcw, Eye } from 'lucide-vue-next'

const props = defineProps({
  dungeonId: { type: String, required: true },
  stageId: { type: String, required: true },
})

const emit = defineEmits<{
  (e: 'retry'): void
  (e: 'back'): void
}>()

const dungeonStore = useDungeonStore()
const analysis = ref<ReplayAnalysis | null>(null)

onMounted(() => {
  analysis.value = dungeonStore.analyzeDefeat(props.stageId, props.dungeonId)
})

const hasAnalysis = computed(() => analysis.value !== null)

const battleEvents = computed(() => analysis.value?.battleRecord.events ?? [])

function isCritical(event: { actor: string; damage: number }): boolean {
  if (!analysis.value) return false
  return event.actor === 'enemy' && event.damage > analysis.value.avgDamagePerTurn * 1.5
}
</script>

<template>
  <div class="min-h-full flex flex-col bg-gradient-to-b from-gray-950 via-red-950/20 to-gray-950">
    <div class="p-6 rounded-2xl border-2 border-red-500/30 bg-gradient-to-b from-red-500/10 to-gray-900/60 mb-6">
      <div class="flex items-center gap-3 mb-2">
        <Skull class="w-8 h-8 text-red-400" />
        <h2 class="text-2xl font-bold text-red-400">失败复盘</h2>
      </div>
      <p class="text-gray-500 text-sm">分析战斗数据，寻找突破之道</p>
    </div>

    <div v-if="!hasAnalysis" class="flex-1 flex items-center justify-center py-16">
      <div class="text-center">
        <Eye class="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p class="text-gray-500 text-lg">暂无复盘数据</p>
      </div>
    </div>

    <template v-else>
      <div class="space-y-4 flex-1 overflow-y-auto pr-1">
        <div class="p-5 rounded-xl border border-red-500/20 bg-gray-900/60">
          <h3 class="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <Swords class="w-5 h-5 text-red-400" />
            战斗概览
          </h3>
          <div class="grid grid-cols-3 gap-3">
            <div class="p-3 rounded-lg bg-gray-800/50 border border-gray-700/50 text-center">
              <div class="text-xs text-gray-500 mb-1 flex items-center justify-center gap-1">
                <Skull class="w-3 h-3" />
                死亡回合
              </div>
              <div class="text-xl font-bold text-red-400">{{ analysis!.deathTurn }}</div>
            </div>
            <div class="p-3 rounded-lg bg-gray-800/50 border border-gray-700/50 text-center">
              <div class="text-xs text-gray-500 mb-1 flex items-center justify-center gap-1">
                <Heart class="w-3 h-3" />
                总承受伤害
              </div>
              <div class="text-xl font-bold text-orange-400">{{ analysis!.totalDamageTaken }}</div>
            </div>
            <div class="p-3 rounded-lg bg-gray-800/50 border border-gray-700/50 text-center">
              <div class="text-xs text-gray-500 mb-1 flex items-center justify-center gap-1">
                <TrendingUp class="w-3 h-3" />
                每回合伤害
              </div>
              <div class="text-xl font-bold text-amber-400">{{ analysis!.avgDamagePerTurn }}</div>
            </div>
          </div>
        </div>

        <div class="p-5 rounded-xl border border-red-500/20 bg-gray-900/60">
          <h3 class="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <AlertTriangle class="w-5 h-5 text-orange-400" />
            敌方分析
          </h3>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-700/50">
                  <th class="text-left py-2 px-3 text-gray-400 font-medium">敌人</th>
                  <th class="text-right py-2 px-3 text-red-400 font-medium">对我伤害</th>
                  <th class="text-right py-2 px-3 text-blue-400 font-medium">我方伤害</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="enemy in analysis!.enemyBreakdown"
                  :key="enemy.enemyId"
                  class="border-b border-gray-800/50"
                >
                  <td class="py-2.5 px-3 text-white font-medium">{{ enemy.enemyName }}</td>
                  <td class="py-2.5 px-3 text-right text-red-400 font-bold">{{ enemy.damageDealt }}</td>
                  <td class="py-2.5 px-3 text-right text-blue-400 font-bold">{{ enemy.damageTaken }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="p-5 rounded-xl border border-red-500/20 bg-gray-900/60">
          <h3 class="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <Clock class="w-5 h-5 text-red-400" />
            关键时刻
          </h3>
          <div v-if="analysis!.criticalMoments.length === 0" class="text-gray-500 text-sm text-center py-3">
            无显著高伤害事件
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="(moment, idx) in analysis!.criticalMoments"
              :key="idx"
              class="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
            >
              <div class="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400 text-xs font-bold shrink-0">
                {{ moment.turn }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm text-white font-medium">{{ moment.targetName || moment.description }}</div>
                <div class="text-xs text-gray-400">{{ moment.action }}</div>
              </div>
              <div class="text-red-400 font-bold shrink-0">-{{ moment.damage }}</div>
            </div>
          </div>
        </div>

        <div class="p-5 rounded-xl border border-amber-500/20 bg-gray-900/60">
          <h3 class="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <Lightbulb class="w-5 h-5 text-amber-400" />
            改进建议
          </h3>
          <div v-if="analysis!.suggestions.length === 0" class="text-gray-500 text-sm text-center py-3">
            继续努力，胜利就在前方
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="(suggestion, idx) in analysis!.suggestions"
              :key="idx"
              class="flex items-start gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10"
            >
              <Lightbulb class="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <span class="text-sm text-amber-200">{{ suggestion }}</span>
            </div>
          </div>
        </div>

        <div class="p-5 rounded-xl border border-gray-700/30 bg-gray-900/60">
          <h3 class="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <Eye class="w-5 h-5 text-gray-400" />
            战斗事件记录
          </h3>
          <div class="max-h-80 overflow-y-auto space-y-1.5 pr-1">
            <div
              v-for="(event, idx) in battleEvents"
              :key="idx"
              class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
              :class="[
                isCritical(event)
                  ? 'bg-red-500/15 border border-red-500/20'
                  : 'bg-gray-800/30',
              ]"
            >
              <span class="w-7 text-center text-xs font-bold text-gray-500 shrink-0">
                {{ event.turn }}
              </span>
              <span
                class="text-xs font-medium px-1.5 py-0.5 rounded shrink-0"
                :class="event.actor === 'player' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'"
              >
                {{ event.actor === 'player' ? '玩家' : '敌方' }}
              </span>
              <span class="flex-1 min-w-0 text-gray-300 truncate">{{ event.description }}</span>
              <span
                v-if="event.damage > 0"
                class="font-bold shrink-0"
                :class="event.actor === 'player' ? 'text-blue-400' : 'text-red-400'"
              >
                -{{ event.damage }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="sticky bottom-0 pt-4 pb-2 bg-gradient-to-t from-gray-950 via-gray-950 to-transparent">
        <div class="flex gap-3">
          <button
            @click="emit('retry')"
            class="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-bold text-base hover:shadow-lg hover:shadow-red-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <RotateCcw class="w-5 h-5" />
            再次挑战
          </button>
          <button
            @click="emit('back')"
            class="flex-1 py-3.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold text-base border border-gray-700/50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <ArrowLeft class="w-5 h-5" />
            返回
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
