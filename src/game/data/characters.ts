import type { Character, CharacterSkill, CharacterAttribute, AttributeType } from '../characterTypes'

const createAttribute = (type: AttributeType, value: number): CharacterAttribute => {
  const attributeConfig: Record<AttributeType, { name: string; description: string; icon: string }> = {
    sanity: { name: '理智', description: '影响最大理智值', icon: '🧠' },
    reputation: { name: '声望', description: '影响声望获取效率', icon: '⭐' },
    money: { name: '财运', description: '影响金钱收益', icon: '💰' },
    efficiency: { name: '效率', description: '影响处理速度', icon: '⚡' },
    luck: { name: '幸运', description: '影响异常事件抵抗', icon: '🍀' }
  }
  return {
    type,
    ...attributeConfig[type],
    value
  }
}

const createSkill = (
  id: string,
  name: string,
  description: string,
  type: 'passive' | 'active' | 'combat',
  icon: string,
  maxLevel: number,
  cooldown: number,
  effect: CharacterSkill['effect'],
  baseCost: number
): CharacterSkill => ({
  id,
  name,
  description,
  type,
  icon,
  level: 0,
  maxLevel,
  unlocked: false,
  cooldown,
  currentCooldown: 0,
  effect,
  upgradeCost: {
    money: baseCost,
    exp: baseCost * 2
  }
})

export const characterTemplates: Omit<Character, 'unlocked' | 'level' | 'exp' | 'currentAttributes' | 'equippedSkillId'>[] = [
  {
    id: 'apprentice',
    name: '学徒入殓师',
    title: '殡仪馆学徒',
    description: '刚刚踏入这个行业的年轻人，充满好奇心但缺乏经验。',
    story: '你从殡葬专业毕业后来到这家殡仪馆工作。虽然对地下二层的传闻早有耳闻，但真正面对那些"不对劲"的遗物时，你才明白这份工作的真正含义。',
    rarity: 'common',
    icon: '👨‍🔧',
    maxLevel: 30,
    expToNextLevel: 100,
    unlockCondition: {
      type: 'special',
      value: 0,
      description: '初始角色，开局即解锁'
    },
    baseAttributes: [
      createAttribute('sanity', 100),
      createAttribute('reputation', 50),
      createAttribute('money', 50),
      createAttribute('efficiency', 50),
      createAttribute('luck', 50)
    ],
    skills: [
      createSkill('skill_apprentice_1', '心灵手巧', '处理速度提升5%', 'passive', '🔧', 5, 0, { attribute: 'efficiency', value: 5 }, 500),
      createSkill('skill_apprentice_2', '谨慎行事', '每夜理智消耗减少1点', 'passive', '🛡️', 5, 0, { special: 'sanity_cost_reduction' }, 800),
      createSkill('skill_apprentice_3', '讨价还价', '订单报酬提升10%', 'active', '💹', 3, 3, { attribute: 'money', value: 10, duration: 1 }, 1500)
    ],
    combatBonus: {
      processingSpeed: 0,
      sanityProtection: 0,
      rewardMultiplier: 0,
      anomalyResistance: 0,
      successRateBonus: 0
    }
  },
  {
    id: 'medium',
    name: '通灵者',
    title: '灵界使者',
    description: '拥有感知亡灵的能力，能够与遗物中的残魂沟通。',
    story: '你从小就能看到一些"别人看不到的东西"。这份天赋让你饱受困扰，直到你发现殡仪馆地下二层的工作能够让你的能力发挥真正的作用。',
    rarity: 'rare',
    icon: '🔮',
    maxLevel: 40,
    expToNextLevel: 150,
    unlockCondition: {
      type: 'reputation',
      value: 70,
      description: '声望达到70点解锁'
    },
    baseAttributes: [
      createAttribute('sanity', 120),
      createAttribute('reputation', 60),
      createAttribute('money', 40),
      createAttribute('efficiency', 40),
      createAttribute('luck', 80)
    ],
    skills: [
      createSkill('skill_medium_1', '灵魂共鸣', '异常事件概率降低10%', 'passive', '✨', 5, 0, { special: 'anomaly_resistance' }, 1000),
      createSkill('skill_medium_2', '精神屏障', '最大理智值+20', 'passive', '🛡️', 5, 0, { attribute: 'sanity', value: 20 }, 1500),
      createSkill('skill_medium_3', '安抚亡灵', '立即恢复15点理智', 'active', '💖', 3, 2, { attribute: 'sanity', value: 15 }, 2500),
      createSkill('skill_medium_4', '预知危险', '下一次处理不会触发异常', 'combat', '👁️', 2, 5, { special: 'anomaly_immunity' }, 4000)
    ],
    combatBonus: {
      processingSpeed: 5,
      sanityProtection: 10,
      rewardMultiplier: 0,
      anomalyResistance: 15,
      successRateBonus: 5
    }
  },
  {
    id: 'alchemist',
    name: '炼金术士',
    title: '净化大师',
    description: '精通古老的净化仪式，能够调配特殊的净化药剂。',
    story: '你是家族传承的炼金术传人，祖上世代从事神秘学研究。你发现现代科学无法解释的遗物污染，反而需要古老的炼金知识来净化。',
    rarity: 'rare',
    icon: '⚗️',
    maxLevel: 40,
    expToNextLevel: 150,
    unlockCondition: {
      type: 'money',
      value: 10000,
      description: '累计获得10000金钱解锁'
    },
    baseAttributes: [
      createAttribute('sanity', 90),
      createAttribute('reputation', 70),
      createAttribute('money', 80),
      createAttribute('efficiency', 60),
      createAttribute('luck', 40)
    ],
    skills: [
      createSkill('skill_alchemist_1', '高效净化', '处理速度提升10%', 'passive', '⚡', 5, 0, { attribute: 'efficiency', value: 10 }, 1000),
      createSkill('skill_alchemist_2', '财运亨通', '订单报酬提升15%', 'passive', '💎', 5, 0, { attribute: 'money', value: 15 }, 1500),
      createSkill('skill_alchemist_3', '浓缩药剂', '本夜处理速度+30%', 'active', '🧪', 3, 3, { attribute: 'efficiency', value: 30, duration: 1 }, 2500),
      createSkill('skill_alchemist_4', '点石成金', '立即获得当前订单150%报酬', 'combat', '🪙', 2, 4, { special: 'double_reward' }, 4000)
    ],
    combatBonus: {
      processingSpeed: 10,
      sanityProtection: 0,
      rewardMultiplier: 15,
      anomalyResistance: 5,
      successRateBonus: 5
    }
  },
  {
    id: 'exorcist',
    name: '驱魔师',
    title: '阴司判官',
    description: '传承千年的驱魔血脉，对邪恶气息有着天然的压制力。',
    story: '你是道教正一派传人，从小修习符箓和咒语。当你第一次接触到地下二层的遗物时，体内的血脉开始沸腾——你知道，这就是你要面对的战场。',
    rarity: 'epic',
    icon: '⚔️',
    maxLevel: 50,
    expToNextLevel: 200,
    unlockCondition: {
      type: 'order_complete',
      value: 20,
      description: '完成20个订单解锁'
    },
    baseAttributes: [
      createAttribute('sanity', 130),
      createAttribute('reputation', 80),
      createAttribute('money', 60),
      createAttribute('efficiency', 70),
      createAttribute('luck', 60)
    ],
    skills: [
      createSkill('skill_exorcist_1', '邪不胜正', '异常抵抗+20%', 'passive', '🛡️', 5, 0, { special: 'anomaly_resistance' }, 2000),
      createSkill('skill_exorcist_2', '金光护体', '理智消耗-30%', 'passive', '✨', 5, 0, { special: 'sanity_protection' }, 3000),
      createSkill('skill_exorcist_3', '雷霆万钧', '立即完成当前处理步骤', 'active', '⚡', 3, 4, { special: 'complete_step' }, 5000),
      createSkill('skill_exorcist_4', '净化之光', '本夜所有处理效率+50%，理智消耗-50%', 'combat', '🌟', 2, 6, { special: 'purification_boost' }, 8000),
      createSkill('skill_exorcist_5', '天师下凡', '下一个订单自动完美完成', 'combat', '👑', 1, 10, { special: 'perfect_complete' }, 15000)
    ],
    combatBonus: {
      processingSpeed: 10,
      sanityProtection: 15,
      rewardMultiplier: 10,
      anomalyResistance: 20,
      successRateBonus: 10
    }
  },
  {
    id: 'reaper',
    name: '引魂人',
    title: '死亡使者',
    description: '能够引导亡魂前往彼岸，是最神秘的存在。',
    story: '你已经不记得自己活了多久。有人说你是死神的化身，也有人说你是第一个入殓师。你存在的意义，就是帮助那些迷途的亡魂找到归宿。',
    rarity: 'legendary',
    icon: '💀',
    maxLevel: 60,
    expToNextLevel: 300,
    unlockCondition: {
      type: 'day',
      value: 30,
      description: '存活30天解锁'
    },
    baseAttributes: [
      createAttribute('sanity', 150),
      createAttribute('reputation', 100),
      createAttribute('money', 100),
      createAttribute('efficiency', 100),
      createAttribute('luck', 100)
    ],
    skills: [
      createSkill('skill_reaper_1', '死亡凝视', '所有属性+10%', 'passive', '👁️', 5, 0, { special: 'all_attribute_bonus' }, 5000),
      createSkill('skill_reaper_2', '灵魂收割', '完成订单额外获得20%经验', 'passive', '⚔️', 5, 0, { special: 'exp_bonus' }, 7500),
      createSkill('skill_reaper_3', '生与死', '立即恢复满理智，本夜无敌', 'active', '💫', 3, 5, { special: 'invincible' }, 10000),
      createSkill('skill_reaper_4', '轮回之门', '当前订单获得3倍报酬和声望', 'combat', '🚪', 2, 8, { special: 'triple_reward' }, 15000),
      createSkill('skill_reaper_5', '永恒安息', '净化一件遗物，永久+5最大理智', 'combat', '⚰️', 1, 15, { special: 'permanent_sanity_bonus' }, 30000),
      createSkill('skill_reaper_6', '死神降临', '接下来3天，所有效果翻倍', 'combat', '👑', 1, 30, { special: 'double_all' }, 50000)
    ],
    combatBonus: {
      processingSpeed: 20,
      sanityProtection: 25,
      rewardMultiplier: 25,
      anomalyResistance: 30,
      successRateBonus: 20
    }
  }
]

export function createCharacter(templateId: string): Character | null {
  const template = characterTemplates.find(t => t.id === templateId)
  if (!template) return null

  const isInitial = templateId === 'apprentice'

  return {
    ...template,
    unlocked: isInitial,
    level: 1,
    exp: 0,
    currentAttributes: template.baseAttributes.map(attr => ({ ...attr })),
    equippedSkillId: null,
    skills: template.skills.map(skill => ({
      ...skill,
      unlocked: isInitial && skill.id === 'skill_apprentice_1'
    }))
  }
}

export function getAllCharacters(): Character[] {
  return characterTemplates.map(template => {
    const char = createCharacter(template.id)!
    return char
  })
}

export function getExpForLevel(level: number, baseExp: number): number {
  return Math.floor(baseExp * Math.pow(1.2, level - 1))
}

export function getAttributeGainPerLevel(rarity: string): Record<AttributeType, number> {
  const gains: Record<string, Record<AttributeType, number>> = {
    common: { sanity: 3, reputation: 2, money: 2, efficiency: 2, luck: 2 },
    rare: { sanity: 4, reputation: 3, money: 3, efficiency: 3, luck: 3 },
    epic: { sanity: 5, reputation: 4, money: 4, efficiency: 4, luck: 4 },
    legendary: { sanity: 8, reputation: 6, money: 6, efficiency: 6, luck: 6 }
  }
  return gains[rarity] || gains.common
}
