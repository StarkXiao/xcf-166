import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Character,
  LevelUpResult,
  CombatBonus,
  CharacterSaveData,
  AttributeType,
  ActiveBuff,
  BuffType,
  ActiveSynergy
} from '../game/characterTypes'
import { getAllCharacters, getExpForLevel, getAttributeGainPerLevel } from '../game/data/characters'
import { synergyRules } from '../game/data/synergies'
import { useGameStore } from './gameStore'
import { useAchievementStore } from './achievementStore'
import { useShopStore } from './shopStore'

const SAVE_VERSION = '1.1.0'

export const useCharacterStore = defineStore('character', () => {
  const characters = ref<Character[]>(getAllCharacters())
  const activeCharacterId = ref<string | null>('apprentice')
  const totalExp = ref(0)
  const totalSpent = ref({ money: 0, reputation: 0 })

  const activeBuffs = ref<ActiveBuff[]>([])
  const pendingPerfectComplete = ref(false)
  const pendingAnomalyImmunity = ref(false)
  const currentOrderRewardMultiplier = ref(1.0)
  const doubleAllRemainingDays = ref(0)
  const isInvincible = ref(false)
  const triggerCompleteStep = ref(false)

  const activeCharacter = computed(() => {
    return characters.value.find(c => c.id === activeCharacterId.value) || null
  })

  const unlockedCharacters = computed(() => {
    return characters.value.filter(c => c.unlocked)
  })

  const lockedCharacters = computed(() => {
    return characters.value.filter(c => !c.unlocked)
  })

  const equippedSkill = computed(() => {
    const char = activeCharacter.value
    if (!char || !char.equippedSkillId) return null
    return char.skills.find(s => s.id === char.equippedSkillId) || null
  })

  const hasAnomalyImmunity = computed(() => {
    if (pendingAnomalyImmunity.value) return true
    if (isInvincible.value) return true
    return activeBuffs.value.some(b => b.type === 'anomaly_immunity' && b.remainingTurns > 0)
  })

  const hasPerfectComplete = computed(() => {
    return pendingPerfectComplete.value
  })

  const activeSynergies = computed((): ActiveSynergy[] => {
    const result: ActiveSynergy[] = []
    const unlockedIds = new Set(
      characters.value.filter(c => c.unlocked).map(c => c.id)
    )
    const activeId = activeCharacterId.value
    let inventoryItemCount = 0
    const inventoryItemIds = new Set<string>()
    try {
      const shopStore = useShopStore()
      for (const item of shopStore.inventory) {
        inventoryItemCount += item.quantity
        inventoryItemIds.add(item.itemId)
      }
    } catch {}

    const unlockedSkillIds = new Set<string>()
    characters.value.forEach(c => {
      if (c.unlocked) {
        c.skills.forEach(s => {
          if (s.unlocked && s.level > 0) {
            unlockedSkillIds.add(s.id)
          }
        })
      }
    })

    for (const rule of synergyRules) {
      let activated = false
      let sourceDesc = ''

      switch (rule.activationMode) {
        case 'character_pair': {
          const required = rule.requiredCharacterIds || []
          if (required.every(id => unlockedIds.has(id))) {
            activated = true
            const names = required
              .map(id => characters.value.find(c => c.id === id)?.name || id)
              .join(' + ')
            sourceDesc = `角色组合：${names}`
          }
          break
        }
        case 'character_item': {
          const requiredChars = rule.requiredCharacterIds || []
          if (activeId && requiredChars.includes(activeId)) {
            const count = rule.requiredItemCount || 0
            if (count <= inventoryItemCount) {
              activated = true
              const charName = characters.value.find(c => c.id === activeId)?.name || activeId
              sourceDesc = `${charName} + ${count}件材料`
            }
          }
          break
        }
        case 'item_set': {
          const requiredItems = rule.requiredItemIds || []
          let allFound = true
          for (const itemId of requiredItems) {
            let found = false
            try {
              const shopStore = useShopStore()
              found = shopStore.inventory.some(i => i.itemId === itemId && i.quantity > 0)
            } catch {}
            if (!found) {
              allFound = false
              break
            }
          }
          if (allFound) {
            activated = true
            sourceDesc = `物品套装：${requiredItems.length}件组合`
          }
          break
        }
        case 'skill_combo': {
          const requiredSkills = rule.requiredSkillIds || []
          const requiredChars = rule.requiredCharacterIds || []
          if (requiredChars.every(id => unlockedIds.has(id)) &&
              requiredSkills.every(id => unlockedSkillIds.has(id))) {
            activated = true
            sourceDesc = `技能联动：${requiredSkills.length}个技能`
          }
          break
        }
      }

      if (activated) {
        result.push({
          ruleId: rule.id,
          name: rule.name,
          icon: rule.icon,
          rarity: rule.rarity,
          effect: rule.effect,
          sourceDescription: sourceDesc
        })
      }
    }

    return result
  })

  const synergyCombatBonus = computed((): CombatBonus => {
    const bonus: CombatBonus = {
      processingSpeed: 0,
      sanityProtection: 0,
      rewardMultiplier: 0,
      anomalyResistance: 0,
      successRateBonus: 0
    }
    for (const synergy of activeSynergies.value) {
      const cb = synergy.effect.combatBonus
      if (cb) {
        bonus.processingSpeed += cb.processingSpeed || 0
        bonus.sanityProtection += cb.sanityProtection || 0
        bonus.rewardMultiplier += cb.rewardMultiplier || 0
        bonus.anomalyResistance += cb.anomalyResistance || 0
        bonus.successRateBonus += cb.successRateBonus || 0
      }
    }
    return bonus
  })

  const synergyAttributeBonus = computed((): Partial<Record<AttributeType, number>> => {
    const result: Partial<Record<AttributeType, number>> = {}
    for (const synergy of activeSynergies.value) {
      const ab = synergy.effect.attributeBonus
      if (ab) {
        for (const key of Object.keys(ab) as AttributeType[]) {
          result[key] = (result[key] || 0) + (ab[key] || 0)
        }
      }
    }
    return result
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

    activeBuffs.value.forEach(buff => {
      if (buff.remainingTurns <= 0) return
      switch (buff.type) {
        case 'processing_speed':
          bonus.processingSpeed += buff.value
          break
        case 'sanity_protection':
          bonus.sanityProtection += buff.value
          break
        case 'reward_multiplier':
          bonus.rewardMultiplier += buff.value
          break
        case 'anomaly_resistance':
          bonus.anomalyResistance += buff.value
          break
      }
    })

    const sBonus = synergyCombatBonus.value
    bonus.processingSpeed += sBonus.processingSpeed
    bonus.sanityProtection += sBonus.sanityProtection
    bonus.rewardMultiplier += sBonus.rewardMultiplier
    bonus.anomalyResistance += sBonus.anomalyResistance
    bonus.successRateBonus += sBonus.successRateBonus

    if (doubleAllRemainingDays.value > 0) {
      bonus.processingSpeed *= 2
      bonus.sanityProtection *= 2
      bonus.rewardMultiplier *= 2
      bonus.anomalyResistance *= 2
      bonus.successRateBonus *= 2
    }

    return bonus
  })

  function getAttributeValue(attrType: AttributeType): number {
    const char = activeCharacter.value
    if (!char) return 0
    const attr = char.currentAttributes.find(a => a.type === attrType)
    return attr?.value || 0
  }

  function addBuff(buff: ActiveBuff) {
    const existingIndex = activeBuffs.value.findIndex(b => b.type === buff.type && b.sourceSkillId === buff.sourceSkillId)
    if (existingIndex >= 0) {
      activeBuffs.value[existingIndex] = buff
    } else {
      activeBuffs.value.push(buff)
    }
  }

  function removeBuff(buffId: string) {
    activeBuffs.value = activeBuffs.value.filter(b => b.id !== buffId)
  }

  function checkUnlockConditions() {
    const gameStore = useGameStore()

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

    const gameStore = useGameStore()
    gameStore.addSanity(0)

    const achievementStore = useAchievementStore()
    achievementStore.trackBehavior('character_unlocked', {
      characterId,
      characterName: char.name,
      characterRarity: char.rarity,
      totalUnlocked: characters.value.filter(c => c.unlocked).length
    })

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

    const previousLevel = char.level
    let leveledUp = false

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

      leveledUp = true
      results.push({
        success: true,
        newLevel: char.level,
        newAttributes: char.currentAttributes.map(a => ({ ...a })),
        unlockedSkill: newSkill || undefined,
        message: `升级到 ${char.level} 级！`
      })
    }

    const achievementStore = useAchievementStore()
    achievementStore.trackBehavior('exp_gained', {
      amount: expToAdd,
      characterId: char.id,
      characterLevel: char.level,
      previousLevel,
      leveledUp
    })

    if (leveledUp) {
      achievementStore.trackBehavior('level_up', {
        characterId: char.id,
        characterLevel: char.level,
        previousLevel
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

    const achievementStore = useAchievementStore()
    achievementStore.trackBehavior('skill_upgraded', {
      characterId,
      skillId,
      skillName: skill.name,
      skillType: skill.type,
      newLevel: skill.level,
      moneyCost,
      expCost
    })

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
    if (skill.level === 0) return false

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
      return { success: false, message: `技能冷却中，还需 ${skill.currentCooldown} 天` }
    }
    if (skill.type === 'passive') return { success: false, message: '被动技能无需主动使用' }

    const gameStore = useGameStore()
    const effectValue = (skill.effect.value || 0) * skill.level
    const duration = skill.effect.duration || 1

    switch (skill.effect.special) {
      case 'anomaly_immunity':
        pendingAnomalyImmunity.value = true
        skill.currentCooldown = skill.cooldown
        return { success: true, message: '下一次处理不会触发异常事件', newLevel: 0 }

      case 'double_reward':
        currentOrderRewardMultiplier.value = 1.5
        skill.currentCooldown = skill.cooldown
        return { success: true, message: '当前订单将获得150%报酬', newLevel: 0 }

      case 'triple_reward':
        currentOrderRewardMultiplier.value = 3.0
        skill.currentCooldown = skill.cooldown
        return { success: true, message: '当前订单将获得3倍报酬和声望', newLevel: 0 }

      case 'complete_step':
        triggerCompleteStep.value = true
        skill.currentCooldown = skill.cooldown
        return { success: true, message: '立即完成当前处理步骤', newLevel: 0 }

      case 'perfect_complete':
        pendingPerfectComplete.value = true
        skill.currentCooldown = skill.cooldown
        return { success: true, message: '下一个订单将自动完美完成', newLevel: 0 }

      case 'purification_boost':
        addBuff({
          id: `buff_${Date.now()}`,
          name: skill.name,
          icon: skill.icon,
          type: 'processing_speed',
          value: 50 + (skill.level * 10),
          remainingTurns: duration,
          sourceSkillId: skillId,
          description: '净化效率大幅提升'
        })
        addBuff({
          id: `buff_san_${Date.now()}`,
          name: skill.name,
          icon: skill.icon,
          type: 'sanity_protection',
          value: 50 + (skill.level * 10),
          remainingTurns: duration,
          sourceSkillId: skillId,
          description: '理智消耗大幅降低'
        })
        skill.currentCooldown = skill.cooldown
        return { success: true, message: '本夜净化效率大幅提升，理智消耗降低50%', newLevel: 0 }

      case 'invincible':
        gameStore.stats.sanity = gameStore.stats.maxSanity
        isInvincible.value = true
        addBuff({
          id: `buff_inv_${Date.now()}`,
          name: skill.name,
          icon: skill.icon,
          type: 'anomaly_immunity',
          value: 100,
          remainingTurns: duration,
          sourceSkillId: skillId,
          description: '本夜免疫所有异常'
        })
        skill.currentCooldown = skill.cooldown
        return { success: true, message: '理智已恢复满，本夜无敌！', newLevel: 0 }

      case 'permanent_sanity_bonus':
        gameStore.stats.maxSanity += 5
        skill.currentCooldown = skill.cooldown
        return { success: true, message: '最大理智值永久+5！', newLevel: 0 }

      case 'double_all':
        doubleAllRemainingDays.value = 3
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

    skill.currentCooldown = skill.cooldown

    return {
      success: true,
      message: `使用了 ${skill.name}！`
    }
  }

  function useEquippedSkill(): LevelUpResult {
    const char = activeCharacter.value
    if (!char || !char.equippedSkillId) {
      return { success: false, message: '没有装备的技能' }
    }
    return useSkill(char.equippedSkillId)
  }

  function consumeAnomalyImmunity(): boolean {
    if (pendingAnomalyImmunity.value) {
      pendingAnomalyImmunity.value = false
      return true
    }
    if (isInvincible.value) {
      return true
    }
    const buffIndex = activeBuffs.value.findIndex(b => b.type === 'anomaly_immunity' && b.remainingTurns > 0)
    if (buffIndex >= 0) {
      activeBuffs.value[buffIndex].remainingTurns--
      if (activeBuffs.value[buffIndex].remainingTurns <= 0) {
        activeBuffs.value.splice(buffIndex, 1)
      }
      return true
    }
    return false
  }

  function consumePerfectComplete(): boolean {
    if (pendingPerfectComplete.value) {
      pendingPerfectComplete.value = false
      return true
    }
    return false
  }

  function consumeCompleteStepTrigger(): boolean {
    if (triggerCompleteStep.value) {
      triggerCompleteStep.value = false
      return true
    }
    return false
  }

  function getAndResetRewardMultiplier(): number {
    const multiplier = currentOrderRewardMultiplier.value
    currentOrderRewardMultiplier.value = 1.0
    return multiplier
  }

  function reduceCooldowns() {
    characters.value.forEach(char => {
      char.skills.forEach(skill => {
        if (skill.currentCooldown > 0) {
          skill.currentCooldown--
        }
      })
    })

    activeBuffs.value = activeBuffs.value.filter(buff => {
      buff.remainingTurns--
      return buff.remainingTurns > 0
    })

    if (doubleAllRemainingDays.value > 0) {
      doubleAllRemainingDays.value--
    }

    isInvincible.value = false
  }

  function calculateProcessingSpeed(baseDuration: number): number {
    const bonus = totalCombatBonus.value.processingSpeed
    const multiplier = 1 + bonus / 100
    return Math.max(baseDuration * 0.3, baseDuration / multiplier)
  }

  function calculateSanityCost(baseCost: number): number {
    if (isInvincible.value) return 0
    const bonus = totalCombatBonus.value.sanityProtection
    const reduction = bonus / 100
    return Math.max(0, baseCost * (1 - reduction))
  }

  function calculateReward(baseReward: number): number {
    const bonus = totalCombatBonus.value.rewardMultiplier
    const multiplier = 1 + bonus / 100
    const orderMultiplier = currentOrderRewardMultiplier.value
    return Math.floor(baseReward * multiplier * orderMultiplier)
  }

  function calculateAnomalyResistance(baseChance: number): number {
    if (hasAnomalyImmunity.value) return 0
    const bonus = totalCombatBonus.value.anomalyResistance
    const reduction = bonus / 100
    return Math.max(0, baseChance * (1 - reduction))
  }

  function restoreFromSaveData(saveData: CharacterSaveData) {
    characters.value = getAllCharacters()

    saveData.characters.forEach((savedChar) => {
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

    activeCharacterId.value = saveData.activeCharacterId
    totalExp.value = saveData.totalExp
    totalSpent.value = saveData.totalSpent
    activeBuffs.value = saveData.activeBuffs || []
    pendingPerfectComplete.value = saveData.pendingPerfectComplete || false
    pendingAnomalyImmunity.value = saveData.pendingAnomalyImmunity || false
    currentOrderRewardMultiplier.value = saveData.currentOrderRewardMultiplier || 1.0
    doubleAllRemainingDays.value = saveData.doubleAllRemainingDays || 0
    isInvincible.value = saveData.isInvincible || false
  }

  function getSaveData(): CharacterSaveData {
    return {
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
      totalSpent: { ...totalSpent.value },
      activeBuffs: [...activeBuffs.value],
      pendingPerfectComplete: pendingPerfectComplete.value,
      pendingAnomalyImmunity: pendingAnomalyImmunity.value,
      currentOrderRewardMultiplier: currentOrderRewardMultiplier.value,
      doubleAllRemainingDays: doubleAllRemainingDays.value,
      isInvincible: isInvincible.value
    }
  }

  function hasCharacterSave(): boolean {
    return false
  }

  function deleteCharacterSave() {
  }

  function resetCharacters() {
    characters.value = getAllCharacters()
    activeCharacterId.value = 'apprentice'
    totalExp.value = 0
    totalSpent.value = { money: 0, reputation: 0 }
    activeBuffs.value = []
    pendingPerfectComplete.value = false
    pendingAnomalyImmunity.value = false
    currentOrderRewardMultiplier.value = 1.0
    doubleAllRemainingDays.value = 0
    isInvincible.value = false
    triggerCompleteStep.value = false
  }

  return {
    characters,
    activeCharacterId,
    activeCharacter,
    unlockedCharacters,
    lockedCharacters,
    activeBuffs,
    equippedSkill,
    hasAnomalyImmunity,
    hasPerfectComplete,
    pendingAnomalyImmunity,
    pendingPerfectComplete,
    currentOrderRewardMultiplier,
    doubleAllRemainingDays,
    isInvincible,
    triggerCompleteStep,
    totalExp,
    totalSpent,
    totalCombatBonus,
    activeSynergies,
    synergyCombatBonus,
    synergyAttributeBonus,
    getAttributeValue,
    addBuff,
    removeBuff,
    checkUnlockConditions,
    unlockCharacter,
    switchCharacter,
    addExp,
    upgradeSkill,
    equipSkill,
    useSkill,
    useEquippedSkill,
    consumeAnomalyImmunity,
    consumePerfectComplete,
    consumeCompleteStepTrigger,
    getAndResetRewardMultiplier,
    reduceCooldowns,
    calculateProcessingSpeed,
    calculateSanityCost,
    calculateReward,
    calculateAnomalyResistance,
    restoreFromSaveData,
    getSaveData,
    hasCharacterSave,
    deleteCharacterSave,
    resetCharacters
  }
})

import { characterTemplates } from '../game/data/characters'
