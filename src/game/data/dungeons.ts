import type { Dungeon, DungeonStage, DropItem, Enemy, EnemySkill } from '@/types/dungeon'

function makeSkill(id: string, name: string, damage: number, description: string, cooldown: number): EnemySkill {
  return { id, name, damage, description, cooldown, currentCooldown: 0 }
}

function makeEnemy(id: string, name: string, icon: string, hp: number, attack: number, defense: number, speed: number, skills: EnemySkill[]): Enemy {
  return { id, name, icon, hp, attack, defense, speed, skills }
}

function makeDrop(id: string, name: string, icon: string, rarity: DropItem['rarity'], dropRate: number, minQ: number, maxQ: number, guaranteed: boolean, desc: string): DropItem {
  return { id, name, icon, rarity, dropRate: dropRate / 100, minQuantity: minQ, maxQuantity: maxQ, isGuaranteed: guaranteed, description: desc }
}

const d1_s1_enemies: Enemy[] = [
  makeEnemy('e_1_1_1', '游荡怨灵', '👻', 80, 12, 3, 5, [
    makeSkill('sk_1_1', '阴风侵蚀', 15, '阴冷之风侵蚀你的理智', 2),
  ]),
  makeEnemy('e_1_1_2', '残影', '👤', 60, 10, 2, 6, [
    makeSkill('sk_1_2', '幻影突袭', 18, '模糊的残影发起突然袭击', 3),
  ]),
]

const d1_s2_enemies: Enemy[] = [
  makeEnemy('e_1_2_1', '怨念集合体', '🌀', 150, 18, 5, 4, [
    makeSkill('sk_2_1', '怨念爆发', 25, '凝聚的怨念猛烈爆发', 2),
    makeSkill('sk_2_2', '吞噬', 30, '吞噬你的生命力', 4),
  ]),
  makeEnemy('e_1_2_2', '低语亡魂', '🗣️', 70, 14, 3, 7, [
    makeSkill('sk_2_3', '哀嚎', 20, '刺耳的哀嚎直击灵魂', 2),
  ]),
]

const d1_s3_enemies: Enemy[] = [
  makeEnemy('e_1_3_1', '怨灵女王', '👑', 300, 25, 8, 4, [
    makeSkill('sk_3_1', '灵魂收割', 40, '女王的终极收割', 3),
    makeSkill('sk_3_2', '亡灵召唤', 20, '召唤亡灵协助作战', 2),
    makeSkill('sk_3_3', '暗影拥抱', 35, '暗影将你完全包裹', 4),
  ]),
]

const d2_s1_enemies: Enemy[] = [
  makeEnemy('e_2_1_1', '熔岩焦尸', '🔥', 120, 20, 6, 4, [
    makeSkill('sk_4_1', '灼烧', 25, '烈焰灼烧你的身体', 2),
  ]),
  makeEnemy('e_2_1_2', '余烬之灵', '💫', 90, 16, 4, 6, [
    makeSkill('sk_4_2', '火星飞溅', 20, '四溅的火星造成持续伤害', 2),
  ]),
]

const d2_s2_enemies: Enemy[] = [
  makeEnemy('e_2_2_1', '炎魔守卫', '👹', 200, 28, 10, 3, [
    makeSkill('sk_5_1', '烈焰斩击', 35, '附带火焰的强力斩击', 2),
    makeSkill('sk_5_2', '火焰壁垒', 15, '以火焰构筑防御', 3),
  ]),
]

const d2_s3_enemies: Enemy[] = [
  makeEnemy('e_2_3_1', '灰烬领主', '🌋', 400, 35, 12, 3, [
    makeSkill('sk_6_1', '末日烈焰', 50, '毁天灭地的终极火焰', 4),
    makeSkill('sk_6_2', '熔岩喷涌', 35, '大地裂开喷涌出灼热岩浆', 2),
    makeSkill('sk_6_3', '余烬重生', 0, '从灰烬中再次复活', 5),
  ]),
]

const d3_s1_enemies: Enemy[] = [
  makeEnemy('e_3_1_1', '深渊触手', '🐙', 180, 30, 8, 5, [
    makeSkill('sk_7_1', '缠绕', 35, '深渊触手紧紧缠绕', 2),
  ]),
  makeEnemy('e_3_1_2', '深海亡灵', '💀', 140, 22, 6, 4, [
    makeSkill('sk_7_2', '溺水之苦', 28, '感受溺水的恐惧', 2),
  ]),
]

const d3_s2_enemies: Enemy[] = [
  makeEnemy('e_3_2_1', '海妖女巫', '🧙‍♀️', 250, 35, 10, 4, [
    makeSkill('sk_8_1', '诅咒', 40, '施加恐怖的诅咒', 3),
    makeSkill('sk_8_2', '漩涡', 30, '制造致命漩涡', 2),
  ]),
]

const d3_s3_enemies: Enemy[] = [
  makeEnemy('e_3_3_1', '深渊之主', '🐋', 550, 45, 15, 3, [
    makeSkill('sk_9_1', '深渊吞噬', 60, '深渊本身的吞噬力量', 4),
    makeSkill('sk_9_2', '潮汐之力', 45, '操控海洋的潮汐之力', 2),
    makeSkill('sk_9_3', '虚空凝视', 55, '来自虚空的凝视侵蚀灵魂', 3),
  ]),
]

const stage1_1: DungeonStage = {
  id: 'stage_1_1',
  dungeonId: 'dungeon_1',
  order: 1,
  name: '低语回廊',
  description: '走廊中回荡着低沉的呢喃声，初入者多在此迷失方向。',
  icon: '🚪',
  difficulty: 'normal',
  unlockConditions: [],
  enemies: d1_s1_enemies,
  drops: [
    makeDrop('drop_1_1', '净化符纸', '📜', 'common', 80, 1, 2, true, '用于净化怨念的基础符纸'),
    makeDrop('drop_1_2', '灵力碎片', '💎', 'uncommon', 40, 1, 1, false, '蕴含微弱灵力的碎片'),
    makeDrop('drop_1_3', '怨念结晶', '🔮', 'rare', 15, 1, 1, false, '凝聚了纯净怨念的结晶'),
  ],
  staminaCost: 10,
  recommendedPower: 50,
  timeLimit: 120,
}

const stage1_2: DungeonStage = {
  id: 'stage_1_2',
  dungeonId: 'dungeon_1',
  order: 2,
  name: '怨念深渊',
  description: '无数怨念在此汇聚，形成了可怖的实体。',
  icon: '🕳️',
  difficulty: 'normal',
  unlockConditions: [
    { type: 'stage_cleared', params: { stageId: 'stage_1_1' }, description: '通关低语回廊' },
  ],
  enemies: d1_s2_enemies,
  drops: [
    makeDrop('drop_1_4', '净化符纸', '📜', 'common', 80, 1, 3, true, '用于净化怨念的基础符纸'),
    makeDrop('drop_1_5', '灵力碎片', '💎', 'uncommon', 50, 1, 2, false, '蕴含微弱灵力的碎片'),
    makeDrop('drop_1_6', '怨念精华', '⚗️', 'rare', 20, 1, 1, false, '高纯度的怨念精华'),
    makeDrop('drop_1_7', '亡魂之泪', '💧', 'epic', 8, 1, 1, false, '亡魂流下的珍贵泪滴'),
  ],
  staminaCost: 15,
  recommendedPower: 80,
  timeLimit: 150,
  bossId: 'e_1_2_1',
}

const stage1_3: DungeonStage = {
  id: 'stage_1_3',
  dungeonId: 'dungeon_1',
  order: 3,
  name: '女王祭坛',
  description: '怨灵女王的居所，只有最勇敢的渡灵者才敢踏足。',
  icon: '👸',
  difficulty: 'hard',
  unlockConditions: [
    { type: 'stage_cleared', params: { stageId: 'stage_1_2' }, description: '通关怨念深渊' },
  ],
  enemies: d1_s3_enemies,
  drops: [
    makeDrop('drop_1_8', '灵力碎片', '💎', 'uncommon', 60, 2, 3, true, '蕴含微弱灵力的碎片'),
    makeDrop('drop_1_9', '怨念精华', '⚗️', 'rare', 35, 1, 2, false, '高纯度的怨念精华'),
    makeDrop('drop_1_10', '亡魂之泪', '💧', 'epic', 15, 1, 1, false, '亡魂流下的珍贵泪滴'),
    makeDrop('drop_1_11', '女王权杖', '🪄', 'legendary', 5, 1, 1, false, '怨灵女王遗留的权杖'),
  ],
  staminaCost: 20,
  recommendedPower: 120,
  timeLimit: 180,
  bossId: 'e_1_3_1',
}

const stage2_1: DungeonStage = {
  id: 'stage_2_1',
  dungeonId: 'dungeon_2',
  order: 1,
  name: '焦灼前厅',
  description: '灼热的空气令人窒息，未燃尽的灰烬随处可见。',
  icon: '🔥',
  difficulty: 'hard',
  unlockConditions: [
    { type: 'dungeon_cleared', params: { dungeonId: 'dungeon_1' }, description: '通关幽暗回廊' },
  ],
  enemies: d2_s1_enemies,
  drops: [
    makeDrop('drop_2_1', '火焰精华', '🔥', 'common', 75, 1, 2, true, '从焦灼中提取的火焰精华'),
    makeDrop('drop_2_2', '耐火碎片', '🛡️', 'uncommon', 45, 1, 1, false, '具有耐火特性的碎片'),
    makeDrop('drop_2_3', '灼热之核', '☀️', 'rare', 18, 1, 1, false, '极高温度的核心'),
  ],
  staminaCost: 15,
  recommendedPower: 100,
  timeLimit: 120,
}

const stage2_2: DungeonStage = {
  id: 'stage_2_2',
  dungeonId: 'dungeon_2',
  order: 2,
  name: '炎魔殿堂',
  description: '炎魔守卫在此巡逻，任何入侵者都将化为灰烬。',
  icon: '👹',
  difficulty: 'hard',
  unlockConditions: [
    { type: 'stage_cleared', params: { stageId: 'stage_2_1' }, description: '通关焦灼前厅' },
  ],
  enemies: d2_s2_enemies,
  drops: [
    makeDrop('drop_2_4', '火焰精华', '🔥', 'common', 80, 1, 3, true, '从焦灼中提取的火焰精华'),
    makeDrop('drop_2_5', '炎魔之角', '🔶', 'rare', 25, 1, 1, false, '炎魔守卫的坚硬之角'),
    makeDrop('drop_2_6', '烈焰之心', '❤️‍🔥', 'epic', 10, 1, 1, false, '燃烧不息的烈焰之心'),
  ],
  staminaCost: 20,
  recommendedPower: 150,
  timeLimit: 150,
  bossId: 'e_2_2_1',
}

const stage2_3: DungeonStage = {
  id: 'stage_2_3',
  dungeonId: 'dungeon_2',
  order: 3,
  name: '灰烬王座',
  description: '灰烬领主的王座所在，此处温度高得足以融化钢铁。',
  icon: '🌋',
  difficulty: 'hell',
  unlockConditions: [
    { type: 'stage_cleared', params: { stageId: 'stage_2_2' }, description: '通关炎魔殿堂' },
  ],
  enemies: d2_s3_enemies,
  drops: [
    makeDrop('drop_2_7', '火焰精华', '🔥', 'common', 85, 2, 4, true, '从焦灼中提取的火焰精华'),
    makeDrop('drop_2_8', '炎魔之角', '🔶', 'rare', 40, 1, 2, false, '炎魔守卫的坚硬之角'),
    makeDrop('drop_2_9', '烈焰之心', '❤️‍🔥', 'epic', 20, 1, 1, false, '燃烧不息的烈焰之心'),
    makeDrop('drop_2_10', '灰烬王冠', '👑', 'legendary', 4, 1, 1, false, '灰烬领主的至高王冠'),
  ],
  staminaCost: 25,
  recommendedPower: 200,
  timeLimit: 200,
  bossId: 'e_2_3_1',
}

const stage3_1: DungeonStage = {
  id: 'stage_3_1',
  dungeonId: 'dungeon_3',
  order: 1,
  name: '潮汐通道',
  description: '幽暗的海底通道，不时有触手从墙壁缝隙中探出。',
  icon: '🌊',
  difficulty: 'hell',
  unlockConditions: [
    { type: 'dungeon_cleared', params: { dungeonId: 'dungeon_2' }, description: '通关灼热炼狱' },
  ],
  enemies: d3_s1_enemies,
  drops: [
    makeDrop('drop_3_1', '深海水滴', '💧', 'common', 75, 1, 2, true, '来自深渊的冰冷海水'),
    makeDrop('drop_3_2', '珊瑚碎片', '🪸', 'uncommon', 50, 1, 1, false, '深渊珊瑚的碎片'),
    makeDrop('drop_3_3', '海妖之鳞', '🐟', 'rare', 20, 1, 1, false, '海妖身上的坚硬鳞片'),
  ],
  staminaCost: 20,
  recommendedPower: 180,
  timeLimit: 130,
}

const stage3_2: DungeonStage = {
  id: 'stage_3_2',
  dungeonId: 'dungeon_3',
  order: 2,
  name: '女巫石窟',
  description: '海妖女巫在此施展着古老的诅咒魔法。',
  icon: '🧙‍♀️',
  difficulty: 'hell',
  unlockConditions: [
    { type: 'stage_cleared', params: { stageId: 'stage_3_1' }, description: '通关潮汐通道' },
  ],
  enemies: d3_s2_enemies,
  drops: [
    makeDrop('drop_3_4', '深海水滴', '💧', 'common', 80, 1, 3, true, '来自深渊的冰冷海水'),
    makeDrop('drop_3_5', '海妖之鳞', '🐟', 'rare', 35, 1, 2, false, '海妖身上的坚硬鳞片'),
    makeDrop('drop_3_6', '女巫咒书', '📖', 'epic', 12, 1, 1, false, '记载着禁忌咒语的古书'),
  ],
  staminaCost: 25,
  recommendedPower: 230,
  timeLimit: 160,
  bossId: 'e_3_2_1',
}

const stage3_3: DungeonStage = {
  id: 'stage_3_3',
  dungeonId: 'dungeon_3',
  order: 3,
  name: '深渊核心',
  description: '深渊之主的领域，凡人踏入即刻被无尽的黑暗吞噬。',
  icon: '🐋',
  difficulty: 'hell',
  unlockConditions: [
    { type: 'stage_cleared', params: { stageId: 'stage_3_2' }, description: '通关女巫石窟' },
  ],
  enemies: d3_s3_enemies,
  drops: [
    makeDrop('drop_3_7', '深海水滴', '💧', 'common', 85, 2, 4, true, '来自深渊的冰冷海水'),
    makeDrop('drop_3_8', '海妖之鳞', '🐟', 'rare', 45, 1, 2, false, '海妖身上的坚硬鳞片'),
    makeDrop('drop_3_9', '女巫咒书', '📖', 'epic', 22, 1, 1, false, '记载着禁忌咒语的古书'),
    makeDrop('drop_3_10', '深渊之眼', '👁️', 'legendary', 3, 1, 1, false, '深渊之主的全视之眼'),
  ],
  staminaCost: 30,
  recommendedPower: 280,
  timeLimit: 210,
  bossId: 'e_3_3_1',
}

export const dungeons: Dungeon[] = [
  {
    id: 'dungeon_1',
    name: '幽暗回廊',
    description: '殡仪馆地下的幽暗走廊，怨灵在此游荡，等待着渡灵者的到来。适合初入挑战的渡灵者。',
    icon: '🏚️',
    theme: '幽暗·怨灵',
    background: 'from-gray-800 via-purple-900 to-gray-900',
    difficulty: 'normal',
    stages: [stage1_1, stage1_2, stage1_3],
    unlockConditions: [],
    dailyResetLimit: 5,
    firstClearBonus: 500,
  },
  {
    id: 'dungeon_2',
    name: '灼热炼狱',
    description: '地下深处的火焰领域，炎魔盘踞于此，只有击败幽暗回廊的渡灵者才有资格进入。',
    icon: '🔥',
    theme: '灼热·炎魔',
    background: 'from-red-900 via-orange-800 to-amber-900',
    difficulty: 'hard',
    stages: [stage2_1, stage2_2, stage2_3],
    unlockConditions: [
      { type: 'dungeon_cleared', params: { dungeonId: 'dungeon_1' }, description: '通关幽暗回廊' },
    ],
    dailyResetLimit: 3,
    firstClearBonus: 1000,
  },
  {
    id: 'dungeon_3',
    name: '深渊海沟',
    description: '最深处的禁忌领域，深渊之主的领地。传说中无人能从此处生还……',
    icon: '🌊',
    theme: '深渊·海沟',
    background: 'from-blue-900 via-cyan-900 to-gray-900',
    difficulty: 'hell',
    stages: [stage3_1, stage3_2, stage3_3],
    unlockConditions: [
      { type: 'dungeon_cleared', params: { dungeonId: 'dungeon_2' }, description: '通关灼热炼狱' },
    ],
    dailyResetLimit: 2,
    firstClearBonus: 2000,
  },
]

export function getDungeonById(id: string): Dungeon | undefined {
  return dungeons.find((d) => d.id === id)
}

export function getStageById(dungeonId: string, stageId: string): DungeonStage | undefined {
  const dungeon = getDungeonById(dungeonId)
  return dungeon?.stages.find((s) => s.id === stageId)
}

export function getAllStages(): DungeonStage[] {
  return dungeons.flatMap((d) => d.stages)
}
