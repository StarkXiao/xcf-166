import type { SynergyRule, SynergyRarity } from '../characterTypes'

export const synergyRules: SynergyRule[] = [
  {
    id: 'syn_spirit_seer',
    name: '灵媒共鸣',
    description: '通灵者与学徒同时解锁时，通灵者异常抵抗额外提升',
    icon: '🌀',
    rarity: 'common',
    activationMode: 'character_pair',
    requiredCharacterIds: ['medium', 'apprentice'],
    effect: {
      combatBonus: { anomalyResistance: 8 },
      description: '通灵者异常抵抗+8%'
    },
    lore: '学徒的好奇心与通灵者的灵力产生了微妙的共鸣，令灵界感知更加敏锐。'
  },
  {
    id: 'syn_alchemist_medium',
    name: '灵药交融',
    description: '炼金术士与通灵者同时解锁时，净化效率与奖励同步提升',
    icon: '⚗️',
    rarity: 'rare',
    activationMode: 'character_pair',
    requiredCharacterIds: ['alchemist', 'medium'],
    effect: {
      combatBonus: { processingSpeed: 10, rewardMultiplier: 8 },
      description: '处理速度+10%，奖励加成+8%'
    },
    lore: '炼金的药剂与通灵的灵力在净化仪式中完美融合，遗物中的怨念被更彻底地净化。'
  },
  {
    id: 'syn_exorcist_alchemist',
    name: '符药合一',
    description: '驱魔师的符箓与炼金术士的药剂结合，战斗效率倍增',
    icon: '🧿',
    rarity: 'rare',
    activationMode: 'character_pair',
    requiredCharacterIds: ['exorcist', 'alchemist'],
    effect: {
      combatBonus: { processingSpeed: 8, sanityProtection: 12 },
      description: '处理速度+8%，理智保护+12%'
    },
    lore: '符纸浸入炼金药水后威力大增，原本需要数小时的净化仪式转瞬即成。'
  },
  {
    id: 'syn_reaper_exorcist',
    name: '死生轮回',
    description: '引魂人与驱魔师同时解锁时，生死之力交相辉映',
    icon: '♾️',
    rarity: 'epic',
    activationMode: 'character_pair',
    requiredCharacterIds: ['reaper', 'exorcist'],
    effect: {
      combatBonus: { processingSpeed: 12, sanityProtection: 15, anomalyResistance: 10 },
      description: '处理速度+12%，理智保护+15%，异常抵抗+10%'
    },
    lore: '引魂人引导亡魂，驱魔师镇压邪灵。二者联手，生死之间的界限清晰如镜。'
  },
  {
    id: 'syn_reaper_medium',
    name: '幽冥之眼',
    description: '引魂人与通灵者同时解锁时，灵界感知大幅增强',
    icon: '👁️',
    rarity: 'epic',
    activationMode: 'character_pair',
    requiredCharacterIds: ['reaper', 'medium'],
    effect: {
      combatBonus: { anomalyResistance: 20, successRateBonus: 10 },
      description: '异常抵抗+20%，成功率+10%'
    },
    lore: '死亡使者与灵界使者的感知交织，世间再无隐匿的怨念能逃过这双幽冥之眼。'
  },
  {
    id: 'syn_reaper_alchemist',
    name: '生死熔炉',
    description: '引魂人与炼金术士同时解锁时，对遗物的理解达到极致',
    icon: '🔥',
    rarity: 'epic',
    activationMode: 'character_pair',
    requiredCharacterIds: ['reaper', 'alchemist'],
    effect: {
      combatBonus: { rewardMultiplier: 20, processingSpeed: 10 },
      description: '奖励加成+20%，处理速度+10%'
    },
    lore: '死亡的真谛与物质的转化在熔炉中合而为一，每件遗物都释放出最大的价值。'
  },
  {
    id: 'syn_all_unlocked',
    name: '万灵归一',
    description: '所有角色全部解锁时，获得终极加成',
    icon: '🌟',
    rarity: 'legendary',
    activationMode: 'character_pair',
    requiredCharacterIds: ['apprentice', 'medium', 'alchemist', 'exorcist', 'reaper'],
    effect: {
      combatBonus: { processingSpeed: 15, sanityProtection: 15, rewardMultiplier: 15, anomalyResistance: 15, successRateBonus: 15 },
      description: '全战斗属性+15%'
    },
    lore: '当所有渡灵者齐聚殡仪馆，生与死、灵与药、符与魂的力量汇聚成永恒之光。'
  },
  {
    id: 'syn_medium_purify_item',
    name: '灵媒净化',
    description: '通灵者装备净化类物品时，异常抵抗大幅提升',
    icon: '✨',
    rarity: 'common',
    activationMode: 'character_item',
    requiredCharacterIds: ['medium'],
    requiredItemCategory: 'material',
    requiredItemCount: 3,
    effect: {
      combatBonus: { anomalyResistance: 12 },
      description: '异常抵抗+12%'
    },
    lore: '通灵者将材料中的灵力凝聚成护盾，将一切邪祟隔绝在外。'
  },
  {
    id: 'syn_alchemist_material',
    name: '炼金精通',
    description: '炼金术士持有5个以上材料时，处理效率暴增',
    icon: '⚗️',
    rarity: 'rare',
    activationMode: 'character_item',
    requiredCharacterIds: ['alchemist'],
    requiredItemCategory: 'material',
    requiredItemCount: 5,
    effect: {
      combatBonus: { processingSpeed: 15, rewardMultiplier: 10 },
      description: '处理速度+15%，奖励加成+10%'
    },
    lore: '丰富的材料储备让炼金术士如鱼得水，每一滴药剂都堪称杰作。'
  },
  {
    id: 'syn_exorcist_rare_item',
    name: '法器加持',
    description: '驱魔师持有稀有以上材料时，战斗加成全面提升',
    icon: '⚔️',
    rarity: 'rare',
    activationMode: 'character_item',
    requiredCharacterIds: ['exorcist'],
    requiredItemCategory: 'material',
    requiredItemRarity: 'rare',
    requiredItemCount: 2,
    effect: {
      combatBonus: { processingSpeed: 8, sanityProtection: 10, anomalyResistance: 8 },
      description: '处理速度+8%，理智保护+10%，异常抵抗+8%'
    },
    lore: '珍贵的法器为驱魔师的符咒注入了更强的灵力，邪灵闻之色变。'
  },
  {
    id: 'syn_item_set_purify',
    name: '净化三件套',
    description: '同时持有净化符纸、灵力碎片和怨念结晶时触发',
    icon: '📜',
    rarity: 'rare',
    activationMode: 'item_set',
    requiredItemIds: ['drop_1_1', 'drop_1_2', 'drop_1_3'],
    effect: {
      combatBonus: { processingSpeed: 10, anomalyResistance: 10 },
      attributeBonus: { sanity: 10 },
      description: '处理速度+10%，异常抵抗+10%，理智+10'
    },
    lore: '符纸、碎片与结晶构成完整的净化闭环，怨念在其中被彻底消融。'
  },
  {
    id: 'syn_item_set_fire',
    name: '烈焰套装',
    description: '同时持有火焰精华、灼热之核和烈焰之心时触发',
    icon: '🔥',
    rarity: 'epic',
    activationMode: 'item_set',
    requiredItemIds: ['drop_2_1', 'drop_2_3', 'drop_2_6'],
    effect: {
      combatBonus: { processingSpeed: 15, rewardMultiplier: 12 },
      attributeBonus: { efficiency: 8 },
      description: '处理速度+15%，奖励加成+12%，效率+8'
    },
    lore: '三种火焰精华聚合为永不熄灭的烈焰之心，焚尽一切不净之物。'
  },
  {
    id: 'syn_item_set_deep',
    name: '深渊套装',
    description: '同时持有深海水滴、海妖之鳞和女巫咒书时触发',
    icon: '🌊',
    rarity: 'epic',
    activationMode: 'item_set',
    requiredItemIds: ['drop_3_1', 'drop_3_3', 'drop_3_6'],
    effect: {
      combatBonus: { sanityProtection: 18, anomalyResistance: 15 },
      attributeBonus: { luck: 8 },
      description: '理智保护+18%，异常抵抗+15%，幸运+8'
    },
    lore: '深渊的力量既是毁灭也是庇护，深海的低语为你抵御世间的疯狂。'
  },
  {
    id: 'syn_skill_anomaly_combo',
    name: '灵域结界',
    description: '通灵者的灵魂共鸣与驱魔师的邪不胜正同时激活',
    icon: '🛡️',
    rarity: 'epic',
    activationMode: 'skill_combo',
    requiredCharacterIds: ['medium', 'exorcist'],
    requiredSkillIds: ['skill_medium_1', 'skill_exorcist_1'],
    effect: {
      combatBonus: { anomalyResistance: 25, sanityProtection: 10 },
      description: '异常抵抗+25%，理智保护+10%'
    },
    lore: '灵魂共鸣与邪不胜正形成双重结界，灵域之中邪灵寸步难行。'
  },
  {
    id: 'syn_skill_economy_combo',
    name: '财源广进',
    description: '学徒的讨价还价与炼金术士的财运亨通同时激活',
    icon: '💰',
    rarity: 'rare',
    activationMode: 'skill_combo',
    requiredCharacterIds: ['apprentice', 'alchemist'],
    requiredSkillIds: ['skill_apprentice_3', 'skill_alchemist_2'],
    effect: {
      combatBonus: { rewardMultiplier: 18 },
      description: '奖励加成+18%'
    },
    lore: '讨价还价的技巧加上财运亨通的加持，每个订单都能获得令人满意的报酬。'
  },
  {
    id: 'syn_apprentice_material',
    name: '勤学苦练',
    description: '学徒持有2个以上材料时，所有属性小幅提升',
    icon: '📚',
    rarity: 'common',
    activationMode: 'character_item',
    requiredCharacterIds: ['apprentice'],
    requiredItemCategory: 'material',
    requiredItemCount: 2,
    effect: {
      attributeBonus: { efficiency: 5, luck: 3 },
      combatBonus: { processingSpeed: 5 },
      description: '效率+5，幸运+3，处理速度+5%'
    },
    lore: '学徒从收集的材料中不断学习，虽然进步缓慢，但根基却越来越扎实。'
  }
]

export function getSynergyRuleById(id: string): SynergyRule | undefined {
  return synergyRules.find(r => r.id === id)
}

export function getSynergiesByRarity(rarity: SynergyRule['rarity']): SynergyRule[] {
  return synergyRules.filter(r => r.rarity === rarity)
}

export function getSynergiesByMode(mode: SynergyRule['activationMode']): SynergyRule[] {
  return synergyRules.filter(r => r.activationMode === mode)
}
