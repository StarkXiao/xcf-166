export type CharacterRarity = 'common' | 'rare' | 'epic' | 'legendary'

export type AttributeType = 'sanity' | 'reputation' | 'money' | 'efficiency' | 'luck'

export type SkillType = 'passive' | 'active' | 'combat'

export type BuffType = 'processing_speed' | 'sanity_protection' | 'reward_multiplier' | 'anomaly_resistance' | 'anomaly_immunity' | 'perfect_complete' | 'double_all' | 'invincible'

export interface CharacterAttribute {
  type: AttributeType
  name: string
  value: number
  description: string
  icon: string
}

export interface CharacterSkill {
  id: string
  name: string
  description: string
  type: SkillType
  icon: string
  level: number
  maxLevel: number
  unlocked: boolean
  cooldown: number
  currentCooldown: number
  effect: {
    attribute?: AttributeType
    value?: number
    duration?: number
    special?: string
  }
  upgradeCost: ResourceCost
}

export interface ActiveBuff {
  id: string
  name: string
  icon: string
  type: BuffType
  value: number
  remainingTurns: number
  sourceSkillId: string
  description: string
}

export interface ResourceCost {
  money?: number
  reputation?: number
  exp?: number
  specialItems?: Array<{ id: string; name: string; amount: number }>
}

export interface Character {
  id: string
  name: string
  title: string
  description: string
  story: string
  rarity: CharacterRarity
  icon: string
  unlocked: boolean
  unlockCondition: {
    type: 'money' | 'reputation' | 'day' | 'order_complete' | 'special'
    value: number
    description: string
  }
  level: number
  maxLevel: number
  exp: number
  expToNextLevel: number
  baseAttributes: CharacterAttribute[]
  currentAttributes: CharacterAttribute[]
  skills: CharacterSkill[]
  equippedSkillId: string | null
  combatBonus: CombatBonus
}

export interface CombatBonus {
  processingSpeed: number
  sanityProtection: number
  rewardMultiplier: number
  anomalyResistance: number
  successRateBonus: number
}

export interface LevelUpResult {
  success: boolean
  newLevel?: number
  newAttributes?: CharacterAttribute[]
  unlockedSkill?: CharacterSkill
  message: string
}

export type SynergyActivationMode = 'character_pair' | 'character_item' | 'item_set' | 'skill_combo'

export type SynergyRarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface SynergyEffect {
  combatBonus?: Partial<CombatBonus>
  attributeBonus?: Partial<Record<AttributeType, number>>
  specialEffect?: string
  description: string
}

export interface SynergyRule {
  id: string
  name: string
  description: string
  icon: string
  rarity: SynergyRarity
  activationMode: SynergyActivationMode
  requiredCharacterIds?: string[]
  requiredItemIds?: string[]
  requiredSkillIds?: string[]
  requiredItemCategory?: string
  requiredItemCount?: number
  effect: SynergyEffect
  lore: string
}

export interface ActiveSynergy {
  ruleId: string
  name: string
  icon: string
  rarity: SynergyRarity
  effect: SynergyEffect
  sourceDescription: string
}

export interface CharacterSaveData {
  characters: Array<{
    id: string
    unlocked: boolean
    level: number
    exp: number
    skills: Array<{
      id: string
      level: number
      unlocked: boolean
      currentCooldown: number
    }>
    equippedSkillId: string | null
  }>
  activeCharacterId: string | null
  totalExp: number
  totalSpent: {
    money: number
    reputation: number
  }
  activeBuffs: ActiveBuff[]
  pendingPerfectComplete: boolean
  pendingAnomalyImmunity: boolean
  currentOrderRewardMultiplier: number
  doubleAllRemainingDays: number
  isInvincible: boolean
}
