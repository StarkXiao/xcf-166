import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Character,
  CharacterSkill,
  LevelUpResult,
  CombatBonus,
  CharacterSaveData,
  AttributeType
} from '../game/characterTypes'
import { getAllCharacters, getExpForLevel, getAttributeGainPerLevel } from '../game/data/characters'
import { useGameStore } from './gameStore'

const CHAR_SAVE_KEY = 'b2_morgue_characters'
const SAVE_VERSION = '1.0.0'

export const useCharacterStore = defineStore('character', () => {
  const characters = ref<Character[]>(getAllCharacters())
  const activeCharacterId = ref<string | null>('apprentice')
  const totalExp = ref(0)
  const totalSpent = ref({ money: 0, reputation: 0 })

  const activeCharacter = computed(() => {
    return characters.value.find(c => c.id === activeCharacterId.value) || null
  })

  const unlockedCharacters = computed(() => {
    return characters.value.filter(c => c.unlocked)
  })

  const lockedCharacters = computed(() => {
    return characters.value.filter(c => !c.unlocked)
  })

  const totalCombatBonus = computed((): CombatBonus => {
    const char = activeCharacter.value
    if (!char) {
      return {
        processingSpeed: 0,
        sanityProtection: 0,
        rewardMultiplier: 0,
        anomalyResistance: 0,
        successRateBonus: 0
      }
    }

    let bonus: CombatBonus = {
      processingSpeed: char.combatBonus.processingSpeed,
      sanityProtection: char.combatBonus.sanityProtection,
      rewardMultiplier: char.combatBonus.rewardMultiplier,
      anomalyResistance: char.combatBonus.anomalyResistance,
      successRateBonus: char.combatBonus.successRateBonus
    }

    const efficiencyAttr = char.currentAttributes.find(a => a.type === 'efficiency')
    if (efficiencyAttr) {
      bonus.processingSpeed += Math.floor((efficiencyAttr.value - 50) / 2)
    }

    const luckAttr = char.currentAttributes.find(a => a.type === 'luck')
    if (luckAttr) {
      bonus.anomalyResistance += Math.floor((luckAttr.value - 50) / 2)
    }

    const moneyAttr = char.currentAttributes.find(a => a.type === 'money')
    if (moneyAttr) {
      bonus.rewardMultiplier += Math.floor((moneyAttr.value - 50) / 3)
    }

    const reputationAttr = char.currentAttributes.find(a => a.type === 'reputation')
    if (reputationAttr) {
      bonus.successRateBonus += Math.floor((reputationAttr.value - 50) / 4)
    }

    char.skills.forEach(skill => {
      if (skill.unlocked && skill.level > 0 && skill.type === 'passive') {
        const effectValue = skill.effect.value || 0
        switch (skill.effect.special) {
          case 'anomaly_resistance':
            bonus.anomalyResistance += effectValue * skill.level
            break
          case 'sanity_protection':
            bonus.sanityProtection += effectValue * skill.level
            break
          case 'sanity_cost_reduction':
            bonus.sanityProtection += 5 * skill.level
            break
          case 'all_attribute_bonus':
            bonus.processingSpeed += Math.floor(effectValue / 2) * skill.level
            bonus.anomalyResistance += Math.floor(effectValue / 2) * skill.level
            bonus.rewardMultiplier += Math.floor(effectValue / 2) * skill.level
            break
        }
        if (skill.effect.attribute === 'efficiency') {
          bonus.processingSpeed += effectValue * skill.level
        }
        if (skill.effect.attribute === 'money') {
          bonus.rewardMultiplier += effectValue * skill.level
        }
      }
    })

    return bonus
  })

  function getAttributeValue(attrType: AttributeType): number {
    const char = activeCharacter.value
    if (!char) return 0
    const attr = char.currentAttributes.find(a => a.type === attrType)
    return attr?.value || 0
  }

  function checkUnlockConditions() {
    const gameStore = useGameStore()
    const orderStore = useGameStore()

    characters.value.forEach(char => {
      if (char.unlocked) return

      const condition = char.unlockCondition
      let canUnlock = false

      switch (condition.type) {
        case 'money':
          canUnlock = gameStore.stats.money >= condition.value
          break
        case 'reputation':
          canUnlock = gameStore.stats.reputation >= condition.value
          break
        case 'day':
          canUnlock = gameStore.day >= condition.value
          break
        case 'order_complete':
          canUnlock = gameStore.stats.totalOrdersCompleted >= condition.value
          break
        case 'special':
          canUnlock = true
          break
      }

      if (canUnlock) {
        unlockCharacter(char.id)
      }
    })
  }

  function unlockCharacter(characterId: string): boolean {
    const char = characters.value.find(c => c.id === characterId)
    if (!char || char.unlocked) return false

    char.unlocked = true
    if (char.skills.length > 0) {
      char.skills[0].unlocked = true
    }

    return true
  }

  function switchCharacter(characterId: string): boolean {
    const char = characters.value.find(c => c.id === characterId)
    if (!char || !char.unlocked) return false

    activeCharacterId.value = characterId
    const gameStore = useGameStore()
    const sanityAttr = char.currentAttributes.find(a => a.type === 'sanity')
    if (sanityAttr && sanityAttr.value > gameStore.stats.maxSanity) {
      gameStore.stats.maxSanity = sanityAttr.value
    }

    return true
  }

  function addExp(amount: number): LevelUpResult[] {
    const char = activeCharacter.value
    if (!char) return []

    const results: LevelUpResult[] = []
    let expToAdd = amount
    totalExp.value += amount

    const expBonusSkill = char.skills.find(s => s.effect.special === 'exp_bonus' && s.unlocked && s.level > 0)
    if (expBonusSkill) {
      const bonus = 1 + (expBonusSkill.level * (expBonusSkill.effect.value || 20)) / 100
      expToAdd = Math.floor(expToAdd * bonus)
    }

    char.exp += expToAdd

    while (char.exp >= char.expToNextLevel && char.level < char.maxLevel) {
      char.exp -= char.expToNextLevel
      char.level++
      char.expToNextLevel = getExpForLevel(char.level, characterTemplates.find(t => t.id === char.id)!.expToNextLevel)

      const gains = getAttributeGainPerLevel(char.rarity)
      char.currentAttributes.forEach(attr => {
        attr.value += gains[attr.type] || 0
      })

      const newSkill = char.skills.find(s => !s.unlocked)
      if (newSkill) {
        newSkill.unlocked = true
      }

      results.push({
        success: true,
        newLevel: char.level,
        newAttributes: char.currentAttributes.map(a => ({ ...a })),
        unlockedSkill: newSkill || undefined,
        message: `升级到 ${char.level} 级！`
      })
    }

    return results
  }

  function upgradeSkill(characterId: string, skillId: string): LevelUpResult {
    const char = characters.value.find(c => c.id === characterId)
    if (!char) return { success: false, message: '角色不存在' }

    const skill = char.skills.find(s => s.id === skillId)
    if (!skill) return { success: false, message: '技能不存在' }
    if (!skill.unlocked) return { success: false, message: '技能未解锁' }
    if (skill.level >= skill.maxLevel) return { success: false, message: '技能已满级' }

    const gameStore = useGameStore()
    const cost = skill.upgradeCost
    const levelMultiplier = skill.level + 1

    const moneyCost = (cost.money || 0) * levelMultiplier
    const expCost = (cost.exp || 0) * levelMultiplier

    if (gameStore.stats.money < moneyCost) {
      return { success: false, message: `金钱不足，需要 ${moneyCost}` }
    }
    if (char.exp < expCost) {
      return { success: false, message: `经验不足，需要 ${expCost}` }
    }

    gameStore.addMoney(-moneyCost)
    char.exp -= expCost
    skill.level++
    totalSpent.value.money += moneyCost

    return {
      success: true,
      message: `${skill.name} 升级到 ${skill.level} 级！`,
      newLevel: skill.level
    }
  }

  function equipSkill(skillId: string): boolean {
    const char = activeCharacter.value
    if (!char) return false

    const skill = char.skills.find(s => s.id === skillId)
    if (!skill || !skill.unlocked) return false
    if (skill.type === 'passive') return false

    char.equippedSkillId = skillId
    return true
  }

  function useSkill(skillId: string): LevelUpResult {
    const char = activeCharacter.value
    if (!char) return { success: false, message: '没有激活的角色' }

    const skill = char.skills.find(s => s.id === skillId)
    if (!skill) return { success: false, message: '技能不存在' }
    if (!skill.unlocked) return { success: false, message: '技能未解锁' }
    if (skill.level === 0) return { success: false, message: '技能未升级' }
    if (skill.currentCooldown > 0) {
      return { success: false, message: `技能冷却中，还需 ${skill.currentCooldown} 回合` }
    }

    const gameStore = useGameStore()
    const effectValue = (skill.effect.value || 0) * skill.level

    switch (skill.effect.special) {
      case 'anomaly_immunity':
        return { success: true, message: '下一次处理不会触发异常事件', newLevel: 0 }
      case 'double_reward':
        return { success: true, message: '当前订单将获得150%报酬', newLevel: 0 }
      case 'triple_reward':
        return { success: true, message: '当前订单将获得3倍报酬和声望', newLevel: 0 }
      case 'complete_step':
        return { success: true, message: '立即完成当前处理步骤', newLevel: 0 }
      case 'perfect_complete':
        return { success: true, message: '下一个订单将自动完美完成', newLevel: 0 }
      case 'purification_boost':
        return { success: true, message: '本夜净化效率大幅提升', newLevel: 0 }
      case 'invincible':
        gameStore.stats.sanity = gameStore.stats.maxSanity
        skill.currentCooldown = skill.cooldown
        return { success: true, message: '理智已恢复满，本夜无敌！', newLevel: 0 }
      case 'permanent_sanity_bonus':
        gameStore.stats.maxSanity += 5
        skill.currentCooldown = skill.cooldown
        return { success: true, message: '最大理智值永久+5！', newLevel: 0 }
      case 'double_all':
        skill.currentCooldown = skill.cooldown
        return { success: true, message: '接下来3天，所有效果翻倍！', newLevel: 0 }
    }

    if (skill.effect.attribute) {
      switch (skill.effect.attribute) {
        case 'sanity':
          gameStore.addSanity(effectValue)
          break
        case 'reputation':
          gameStore.addReputation(effectValue)
          break
        case 'money':
          gameStore.addMoney(effectValue)
          break
      }
    }

    if (skill.type !== 'passive') {
      skill.currentCooldown = skill.cooldown
    }

    return {
      success: true,
      message: `使用了 ${skill.name}！`
    }
  }

  function reduceCooldowns() {
    characters.value.forEach(char => {
      char.skills.forEach(skill => {
        if (skill.currentCooldown > 0) {
          skill.currentCooldown--
        }
      })
    })
  }

  function calculateProcessingSpeed(baseDuration: number): number {
    const bonus = totalCombatBonus.value.processingSpeed
    const multiplier = 1 + bonus / 100
    return Math.max(baseDuration * 0.3, baseDuration / multiplier)
  }

  function calculateSanityCost(baseCost: number): number {
    const bonus = totalCombatBonus.value.sanityProtection
    const reduction = bonus / 100
    return Math.max(0, baseCost * (1 - reduction))
  }

  function calculateReward(baseReward: number): number {
    const bonus = totalCombatBonus.value.rewardMultiplier
    const multiplier = 1 + bonus / 100
    return Math.floor(baseReward * multiplier)
  }

  function calculateAnomalyResistance(baseChance: number): number {
    const bonus = totalCombatBonus.value.anomalyResistance
    const reduction = bonus / 100
    return Math.max(0, baseChance * (1 - reduction))
  }

  function saveCharacters(): CharacterSaveData {
    const saveData: CharacterSaveData = {
      characters: characters.value.map(char => ({
        id: char.id,
        unlocked: char.unlocked,
        level: char.level,
        exp: char.exp,
        skills: char.skills.map(skill => ({
          id: skill.id,
          level: skill.level,
          unlocked: skill.unlocked,
          currentCooldown: skill.currentCooldown
        })),
        equippedSkillId: char.equippedSkillId
      })),
      activeCharacterId: activeCharacterId.value,
      totalExp: totalExp.value,
      totalSpent: { ...totalSpent.value }
    }

    localStorage.setItem(CHAR_SAVE_KEY, JSON.stringify({
      ...saveData,
      timestamp: Date.now(),
      version: SAVE_VERSION
    }))

    return saveData
  }

  function loadCharacters(): CharacterSaveData | null {
    const raw = localStorage.getItem(CHAR_SAVE_KEY)
    if (!raw) return null

    try {
      const data = JSON.parse(raw)
      if (data.version !== SAVE_VERSION) {
        console.warn('角色存档版本不兼容')
        return null
      }

      characters.value = getAllCharacters()

      data.characters.forEach((savedChar: CharacterSaveData['characters'][0]) => {
        const char = characters.value.find(c => c.id === savedChar.id)
        if (!char) return

        char.unlocked = savedChar.unlocked
        char.level = savedChar.level
        char.exp = savedChar.exp
        char.equippedSkillId = savedChar.equippedSkillId

        const template = characterTemplates.find(t => t.id === char.id)
        if (template) {
          char.expToNextLevel = getExpForLevel(char.level, template.expToNextLevel)
        }

        const gains = getAttributeGainPerLevel(char.rarity)
        char.currentAttributes = char.baseAttributes.map(attr => ({
          ...attr,
          value: attr.value + (gains[attr.type] || 0) * (char.level - 1)
        }))

        savedChar.skills.forEach(savedSkill => {
          const skill = char.skills.find(s => s.id === savedSkill.id)
          if (skill) {
            skill.level = savedSkill.level
            skill.unlocked = savedSkill.unlocked
            skill.currentCooldown = savedSkill.currentCooldown
          }
        })
      })

      activeCharacterId.value = data.activeCharacterId
      totalExp.value = data.totalExp
      totalSpent.value = data.totalSpent

      return data
    } catch {
      console.error('角色存档读取失败')
      return null
    }
  }

  function hasCharacterSave(): boolean {
    return localStorage.getItem(CHAR_SAVE_KEY) !== null
  }

  function deleteCharacterSave() {
    localStorage.removeItem(CHAR_SAVE_KEY)
  }

  function resetCharacters() {
    characters.value = getAllCharacters()
    activeCharacterId.value = 'apprentice'
    totalExp.value = 0
    totalSpent.value = { money: 0, reputation: 0 }
  }

  return {
    characters,
    activeCharacterId,
    activeCharacter,
    unlockedCharacters,
    lockedCharacters,
    totalExp,
    totalSpent,
    totalCombatBonus,
    getAttributeValue,
    checkUnlockConditions,
    unlockCharacter,
    switchCharacter,
    addExp,
    upgradeSkill,
    equipSkill,
    useSkill,
    reduceCooldowns,
    calculateProcessingSpeed,
    calculateSanityCost,
    calculateReward,
    calculateAnomalyResistance,
    saveCharacters,
    loadCharacters,
    hasCharacterSave,
    deleteCharacterSave,
    resetCharacters
  }
})

import { characterTemplates } from '../game/data/characters'
