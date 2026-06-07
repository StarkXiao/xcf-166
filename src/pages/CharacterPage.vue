<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCharacterStore } from '@/stores/characterStore'
import { useGameStore } from '@/stores/gameStore'
import { audioManager } from '@/game/audio'
import type { Character, CharacterSkill } from '@/game/characterTypes'

const router = useRouter()
const characterStore = useCharacterStore()
const gameStore = useGameStore()

const selectedCharacterId = ref<string | null>(characterStore.activeCharacterId)
const showLevelUpAnimation = ref(false)
const levelUpMessage = ref('')
const showSkillResult = ref(false)
const skillResultMessage = ref('')
const selectedSkillType = ref<'all' | 'passive' | 'active' | 'combat'>('all')

const rarityColors: Record<string, string> = {
  common: 'from-gray-600 to-gray-700 border-gray-500',
  rare: 'from-blue-600 to-blue-700 border-blue-400',
  epic: 'from-purple-600 to-purple-700 border-purple-400',
  legendary: 'from-amber-500 to-orange-600 border-amber-400'
}

const rarityBgColors: Record<string, string> = {
  common: 'bg-gray-900/50',
  rare: 'bg-blue-900/30',
  epic: 'bg-purple-900/30',
  legendary: 'bg-amber-900/30'
}

const rarityNames: Record<string, string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说'
}

const skillTypeNames: Record<string, string> = {
  passive: '被动',
  active: '主动',
  combat: '战斗'
}

const selectedCharacter = computed(() => {
  return characterStore.characters.find(c => c.id === selectedCharacterId.value) || null
})

const filteredSkills = computed(() => {
  if (!selectedCharacter.value) return []
  if (selectedSkillType.value === 'all') return selectedCharacter.value.skills
  return selectedCharacter.value.skills.filter(s => s.type === selectedSkillType.value)
})

function goBack() {
  audioManager.playClick()
  router.push('/')
}

function selectCharacter(charId: string) {
  audioManager.playClick()
  const char = characterStore.characters.find(c => c.id === charId)
  if (!char) return

  if (!char.unlocked) {
    showSkillResultMessage(`解锁条件：${char.unlockCondition.description}`)
    return
  }

  selectedCharacterId.value = charId
}

function activateCharacter(charId: string) {
  audioManager.playClick()
  const success = characterStore.switchCharacter(charId)
  if (success) {
    showSkillResultMessage(`已切换到 ${characterStore.activeCharacter?.name}`)
  }
}

function handleUpgradeSkill(skillId: string) {
  if (!selectedCharacter.value) return
  audioManager.playClick()

  const result = characterStore.upgradeSkill(selectedCharacter.value.id, skillId)
  if (result.success && result.newLevel) {
    showLevelUp(result.message)
  } else {
    showSkillResultMessage(result.message)
  }
}

function handleUseSkill(skillId: string) {
  if (!selectedCharacter.value) return
  audioManager.playClick()

  const result = characterStore.useSkill(skillId)
  showSkillResultMessage(result.message)
}

function handleEquipSkill(skillId: string) {
  if (!selectedCharacter.value) return
  audioManager.playClick()

  const success = characterStore.equipSkill(skillId)
  if (success) {
    showSkillResultMessage('已装备该技能')
  }
}

function handleUseEquippedSkill() {
  audioManager.playClick()
  const result = characterStore.useEquippedSkill()
  showSkillResultMessage(result.message)
  if (result.success && result.newLevel) {
    showLevelUp(result.message)
  }
}

function showLevelUp(message: string) {
  levelUpMessage.value = message
  showLevelUpAnimation.value = true
  setTimeout(() => {
    showLevelUpAnimation.value = false
  }, 2000)
}

function showSkillResultMessage(message: string) {
  skillResultMessage.value = message
  showSkillResult.value = true
  setTimeout(() => {
    showSkillResult.value = false
  }, 2000)
}

function getUnlockProgress(char: Character): number {
  const gameStore = useGameStore()
  const condition = char.unlockCondition

  switch (condition.type) {
    case 'money':
      return Math.min(100, (gameStore.stats.money / condition.value) * 100)
    case 'reputation':
      return Math.min(100, (gameStore.stats.reputation / condition.value) * 100)
    case 'day':
      return Math.min(100, (gameStore.day / condition.value) * 100)
    case 'order_complete':
      return Math.min(100, (gameStore.stats.totalOrdersCompleted / condition.value) * 100)
    case 'special':
      return 100
    default:
      return 0
  }
}
</script>

<template>
  <div class="character-page min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white">
    <div class="container mx-auto px-4 py-6 max-w-7xl">
      <div class="flex items-center justify-between mb-6">
        <button
          @click="goBack"
          class="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <span>←</span>
          <span>返回游戏</span>
        </button>
        <h1 class="text-3xl font-bold text-amber-400">🎭 角色养成</h1>
        <div class="w-32"></div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div class="lg:col-span-1 space-y-4">
          <h2 class="text-xl font-bold text-gray-300 mb-4">角色列表</h2>
          <div class="space-y-3">
            <div
              v-for="char in characterStore.characters"
              :key="char.id"
              @click="selectCharacter(char.id)"
              class="relative p-4 rounded-xl cursor-pointer transition-all hover:scale-102 border-2"
              :class="[
                rarityBgColors[char.rarity],
                selectedCharacterId === char.id ? 'border-amber-400 ring-2 ring-amber-400/50' : 'border-transparent',
                !char.unlocked && 'opacity-60'
              ]"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-12 h-12 rounded-lg flex items-center justify-center text-2xl bg-gradient-to-br"
                  :class="rarityColors[char.rarity]"
                >
                  {{ char.icon }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-bold truncate" :class="char.unlocked ? 'text-white' : 'text-gray-500'">
                      {{ char.name }}
                    </span>
                    <span
                      class="text-xs px-2 py-0.5 rounded"
                      :class="{
                        'bg-gray-700 text-gray-300': char.rarity === 'common',
                        'bg-blue-900 text-blue-300': char.rarity === 'rare',
                        'bg-purple-900 text-purple-300': char.rarity === 'epic',
                        'bg-amber-900 text-amber-300': char.rarity === 'legendary'
                      }"
                    >
                      {{ rarityNames[char.rarity] }}
                    </span>
                  </div>
                  <div class="text-xs text-gray-400">
                    <span v-if="char.unlocked">Lv.{{ char.level }}</span>
                    <span v-else>🔒 未解锁</span>
                  </div>
                </div>
                <div
                  v-if="characterStore.activeCharacterId === char.id"
                  class="w-3 h-3 rounded-full bg-green-500 animate-pulse"
                ></div>
              </div>

              <div v-if="!char.unlocked" class="mt-3">
                <div class="text-xs text-gray-400 mb-1">{{ char.unlockCondition.description }}</div>
                <div class="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
                    :style="{ width: `${getUnlockProgress(char)}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="lg:col-span-3 space-y-6">
          <div
            v-if="characterStore.activeBuffs.length > 0 || characterStore.pendingAnomalyImmunity || characterStore.pendingPerfectComplete || characterStore.doubleAllRemainingDays > 0"
            class="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-2xl p-4 border border-purple-500/30"
          >
            <h3 class="text-lg font-bold text-amber-400 mb-3">✨ 当前激活效果</h3>
            <div class="flex flex-wrap gap-3">
              <div
                v-if="characterStore.pendingAnomalyImmunity"
                class="flex items-center gap-2 px-4 py-2 bg-blue-900/60 rounded-lg border border-blue-400/50"
              >
                <span class="text-xl">🛡️</span>
                <div>
                  <div class="text-sm font-medium text-blue-200">异常免疫</div>
                  <div class="text-xs text-blue-300">下一次处理有效</div>
                </div>
              </div>
              <div
                v-if="characterStore.pendingPerfectComplete"
                class="flex items-center gap-2 px-4 py-2 bg-amber-900/60 rounded-lg border border-amber-400/50"
              >
                <span class="text-xl">⭐</span>
                <div>
                  <div class="text-sm font-medium text-amber-200">完美完成</div>
                  <div class="text-xs text-amber-300">下一个订单双倍奖励</div>
                </div>
              </div>
              <div
                v-if="characterStore.doubleAllRemainingDays > 0"
                class="flex items-center gap-2 px-4 py-2 bg-red-900/60 rounded-lg border border-red-400/50"
              >
                <span class="text-xl">🔥</span>
                <div>
                  <div class="text-sm font-medium text-red-200">效果翻倍</div>
                  <div class="text-xs text-red-300">剩余 {{ characterStore.doubleAllRemainingDays }} 天</div>
                </div>
              </div>
              <div
                v-for="buff in characterStore.activeBuffs"
                :key="buff.id"
                class="flex items-center gap-2 px-4 py-2 bg-gray-800/80 rounded-lg border border-gray-500/50"
              >
                <span class="text-xl">{{ buff.icon }}</span>
                <div>
                  <div class="text-sm font-medium text-gray-200">{{ buff.name }}</div>
                  <div class="text-xs text-gray-400">+{{ buff.value }}% · 剩余 {{ buff.remainingTurns }} 回合</div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="characterStore.equippedSkill" class="bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-2xl p-4 border border-green-500/30">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="w-14 h-14 rounded-xl flex items-center justify-center text-3xl bg-green-800/50 border border-green-500/50">
                  {{ characterStore.equippedSkill.icon }}
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-lg font-bold text-green-300">{{ characterStore.equippedSkill.name }}</span>
                    <span class="text-xs px-2 py-0.5 bg-green-700 text-green-200 rounded">
                      已装备
                    </span>
                    <span class="text-xs text-green-400">Lv.{{ characterStore.equippedSkill.level }}/{{ characterStore.equippedSkill.maxLevel }}</span>
                  </div>
                  <p class="text-sm text-gray-400">{{ characterStore.equippedSkill.description }}</p>
                  <div v-if="characterStore.equippedSkill.currentCooldown > 0" class="text-xs text-red-400 mt-1">
                    ⏳ 冷却中：还需 {{ characterStore.equippedSkill.currentCooldown }} 天
                  </div>
                </div>
              </div>
              <button
                @click="handleUseEquippedSkill"
                class="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="characterStore.equippedSkill.currentCooldown > 0 || characterStore.equippedSkill.level === 0"
              >
                ⚡ 使用技能
              </button>
            </div>
          </div>

          <div v-if="selectedCharacter" class="rounded-2xl overflow-hidden border border-gray-700">
            <div
              class="p-6 bg-gradient-to-r"
              :class="rarityColors[selectedCharacter.rarity]"
            >
              <div class="flex items-start gap-6">
                <div class="w-24 h-24 rounded-2xl flex items-center justify-center text-5xl bg-black/30 border-2 border-white/20">
                  {{ selectedCharacter.icon }}
                </div>
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-2">
                    <h2 class="text-3xl font-bold">{{ selectedCharacter.name }}</h2>
                    <span
                      class="px-3 py-1 rounded-full text-sm font-medium"
                      :class="{
                        'bg-gray-700 text-gray-200': selectedCharacter.rarity === 'common',
                        'bg-blue-800 text-blue-200': selectedCharacter.rarity === 'rare',
                        'bg-purple-800 text-purple-200': selectedCharacter.rarity === 'epic',
                        'bg-amber-700 text-amber-200': selectedCharacter.rarity === 'legendary'
                      }"
                    >
                      {{ rarityNames[selectedCharacter.rarity] }}
                    </span>
                  </div>
                  <p class="text-lg text-white/80 mb-2">{{ selectedCharacter.title }}</p>
                  <p class="text-sm text-white/60">{{ selectedCharacter.description }}</p>

                  <div class="flex items-center gap-4 mt-4">
                    <div class="text-center">
                      <div class="text-3xl font-bold">{{ selectedCharacter.level }}</div>
                      <div class="text-xs text-white/60">等级</div>
                    </div>
                    <div class="flex-1">
                      <div class="flex justify-between text-sm mb-1">
                        <span class="text-white/60">经验值</span>
                        <span>{{ selectedCharacter.exp }} / {{ selectedCharacter.expToNextLevel }}</span>
                      </div>
                      <div class="h-3 bg-black/30 rounded-full overflow-hidden">
                        <div
                          class="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all"
                          :style="{ width: `${(selectedCharacter.exp / selectedCharacter.expToNextLevel) * 100}%` }"
                        ></div>
                      </div>
                    </div>
                    <button
                      v-if="selectedCharacter.unlocked && characterStore.activeCharacterId !== selectedCharacter.id"
                      @click="activateCharacter(selectedCharacter.id)"
                      class="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-medium transition-colors"
                    >
                      切换角色
                    </button>
                    <div
                      v-if="characterStore.activeCharacterId === selectedCharacter.id"
                      class="px-6 py-2 bg-green-900/50 rounded-lg font-medium text-green-400 border border-green-500/50"
                    >
                      ✓ 当前角色
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="p-6 bg-gray-900/80">
              <h3 class="text-lg font-bold text-amber-400 mb-4">📖 角色故事</h3>
              <p class="text-gray-300 leading-relaxed text-sm">{{ selectedCharacter.story }}</p>
            </div>
          </div>

          <div v-if="selectedCharacter && selectedCharacter.unlocked" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-gray-900/80 rounded-2xl p-6 border border-gray-700">
              <h3 class="text-lg font-bold text-amber-400 mb-4">📊 属性面板</h3>
              <div class="space-y-4">
                <div
                  v-for="attr in selectedCharacter.currentAttributes"
                  :key="attr.type"
                  class="flex items-center gap-3"
                >
                  <div class="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-xl">
                    {{ attr.icon }}
                  </div>
                  <div class="flex-1">
                    <div class="flex justify-between items-center mb-1">
                      <span class="font-medium text-gray-300">{{ attr.name }}</span>
                      <span class="text-amber-400 font-bold">{{ attr.value }}</span>
                    </div>
                    <div class="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        class="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                        :style="{ width: `${Math.min(100, attr.value / 2)}%` }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-gray-900/80 rounded-2xl p-6 border border-gray-700">
              <h3 class="text-lg font-bold text-amber-400 mb-4">⚔️ 战斗加成</h3>
              <div class="space-y-3">
                <div class="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <span class="text-gray-400">处理速度</span>
                  <span class="text-green-400 font-bold">+{{ characterStore.totalCombatBonus.processingSpeed }}%</span>
                </div>
                <div class="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <span class="text-gray-400">理智保护</span>
                  <span class="text-blue-400 font-bold">+{{ characterStore.totalCombatBonus.sanityProtection }}%</span>
                </div>
                <div class="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <span class="text-gray-400">奖励加成</span>
                  <span class="text-yellow-400 font-bold">+{{ characterStore.totalCombatBonus.rewardMultiplier }}%</span>
                </div>
                <div class="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <span class="text-gray-400">异常抵抗</span>
                  <span class="text-purple-400 font-bold">+{{ characterStore.totalCombatBonus.anomalyResistance }}%</span>
                </div>
                <div class="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <span class="text-gray-400">成功率</span>
                  <span class="text-emerald-400 font-bold">+{{ characterStore.totalCombatBonus.successRateBonus }}%</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="selectedCharacter && selectedCharacter.unlocked" class="bg-gray-900/80 rounded-2xl p-6 border border-gray-700">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg font-bold text-amber-400">✨ 技能列表</h3>
              <div class="flex gap-2">
                <button
                  v-for="type in ['all', 'passive', 'active', 'combat']"
                  :key="type"
                  @click="selectedSkillType = type as any"
                  class="px-3 py-1 rounded text-sm transition-colors"
                  :class="selectedSkillType === type ? 'bg-amber-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'"
                >
                  {{ type === 'all' ? '全部' : skillTypeNames[type] }}
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                v-for="skill in filteredSkills"
                :key="skill.id"
                class="p-4 rounded-xl border transition-all"
                :class="[
                  skill.unlocked ? 'bg-gray-800/50 border-gray-600' : 'bg-gray-900/50 border-gray-700 opacity-50',
                  selectedCharacter.equippedSkillId === skill.id && 'border-amber-500 ring-1 ring-amber-500/50'
                ]"
              >
                <div class="flex items-start gap-3">
                  <div
                    class="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                    :class="skill.unlocked ? 'bg-gray-700' : 'bg-gray-800'"
                  >
                    {{ skill.icon }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="font-bold text-white">{{ skill.name }}</span>
                      <span
                        class="text-xs px-2 py-0.5 rounded"
                        :class="{
                          'bg-gray-600 text-gray-300': skill.type === 'passive',
                          'bg-blue-800 text-blue-300': skill.type === 'active',
                          'bg-red-800 text-red-300': skill.type === 'combat'
                        }"
                      >
                        {{ skillTypeNames[skill.type] }}
                      </span>
                      <span class="text-xs text-amber-400">
                        Lv.{{ skill.level }}/{{ skill.maxLevel }}
                      </span>
                    </div>
                    <p class="text-sm text-gray-400 mb-2">{{ skill.description }}</p>

                    <div v-if="skill.level > 0 && skill.currentCooldown > 0" class="text-xs text-red-400 mb-2">
                      ⏳ 冷却中：还需 {{ skill.currentCooldown }} 天
                    </div>

                    <div v-if="skill.unlocked && skill.level < skill.maxLevel" class="text-xs text-gray-500 mb-2">
                      升级消耗：💰 {{ (skill.upgradeCost.money || 0) * (skill.level + 1) }} | ⚡ {{ (skill.upgradeCost.exp || 0) * (skill.level + 1) }} EXP
                    </div>

                    <div v-if="skill.unlocked" class="flex gap-2 flex-wrap">
                      <button
                        v-if="skill.level < skill.maxLevel"
                        @click="handleUpgradeSkill(skill.id)"
                        class="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 rounded text-sm font-medium transition-colors"
                        :disabled="gameStore.stats.money < (skill.upgradeCost.money || 0) * (skill.level + 1)"
                        :class="{ 'opacity-50 cursor-not-allowed': gameStore.stats.money < (skill.upgradeCost.money || 0) * (skill.level + 1) }"
                      >
                        ⬆️ 升级
                      </button>
                      <button
                        v-if="skill.type !== 'passive' && skill.level > 0 && skill.currentCooldown === 0"
                        @click="handleUseSkill(skill.id)"
                        class="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium transition-colors"
                      >
                        ⚡ 使用
                      </button>
                      <button
                        v-if="skill.type !== 'passive' && selectedCharacter.equippedSkillId !== skill.id"
                        @click="handleEquipSkill(skill.id)"
                        class="px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded text-sm font-medium transition-colors"
                      >
                        🎯 装备
                      </button>
                    </div>
                    <div v-else class="text-xs text-gray-500">
                      {{ skill.level >= skill.maxLevel ? '已满级' : '提升等级后解锁' }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="!selectedCharacter" class="bg-gray-900/80 rounded-2xl p-12 border border-gray-700 text-center">
            <div class="text-6xl mb-4">🎭</div>
            <h3 class="text-xl font-bold text-gray-400 mb-2">选择一个角色</h3>
            <p class="text-gray-500">从左侧选择角色查看详情</p>
          </div>
        </div>
      </div>
    </div>

    <Transition name="fade">
      <div
        v-if="showLevelUpAnimation"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      >
        <div class="text-center animate-bounce">
          <div class="text-8xl mb-4">🎉</div>
          <div class="text-4xl font-bold text-amber-400 mb-2">{{ levelUpMessage }}</div>
          <div class="text-xl text-gray-300">属性提升！</div>
        </div>
      </div>
    </Transition>

    <Transition name="slide-up">
      <div
        v-if="showSkillResult"
        class="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
      >
        <div class="px-6 py-3 bg-gray-800 border border-gray-600 rounded-xl shadow-xl text-white">
          {{ skillResultMessage }}
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

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}
</style>
