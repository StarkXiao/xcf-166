import type { Relic, RelicType, AnomalyType, ProcessingStep } from '../types'

const relicTemplates: Record<RelicType, Omit<Relic, 'id'>> = {
  photo: {
    type: 'photo',
    name: '老照片',
    description: '一张边缘泛黄的黑白照片，照片里的人似乎在看着你',
    anomaly: 'shadow',
    story: '照片拍摄于1947年的春天，照片中的女子穿着碎花旗袍站在桃树下。她至死都在等待丈夫从战场归来。',
    processingSteps: generateSteps('photo')
  },
  watch: {
    type: 'watch',
    name: '停摆的怀表',
    description: '指针永远停在凌晨3点33分，偶尔会自己转动',
    anomaly: 'echo',
    story: '这是一位铁路工程师的怀表，他在一次事故中殉职。怀表停止的那一刻，正是他生命结束的瞬间。',
    processingSteps: generateSteps('watch')
  },
  letter: {
    type: 'letter',
    name: '未寄出的信',
    description: '墨迹时隐时现，仿佛有人在上面重新书写',
    anomaly: 'whisper',
    story: '这是一封写给父亲的信，儿子在信中说"爸，我原谅你了"。但他还没来得及寄出，父亲就已经走了。',
    processingSteps: generateSteps('letter')
  },
  jewelry: {
    type: 'jewelry',
    name: '订婚戒指',
    description: '戒指内侧刻着两个名字，触摸时能感受到微弱的脉搏',
    anomaly: 'cold_spot',
    story: '她在订婚典礼前一天病逝，未婚夫将戒指随她下葬。这枚戒指承载了太多未完成的誓言。',
    processingSteps: generateSteps('jewelry')
  },
  toy: {
    type: 'toy',
    name: '布娃娃',
    description: '娃娃的眼睛会跟随人移动，夜里会听到孩童的笑声',
    anomaly: 'flicker',
    story: '这是一个死于白血病的小女孩最爱的玩具。她说娃娃会保护她，现在轮到她保护娃娃了。',
    processingSteps: generateSteps('toy')
  },
  book: {
    type: 'book',
    name: '旧日记',
    description: '翻到某一页时，字迹会变得血红',
    anomaly: 'poltergeist',
    story: '日记的主人是一位民国时期的文人，他在日记中记录了自己看到的"另一个世界"。',
    processingSteps: generateSteps('book')
  },
  music_box: {
    type: 'music_box',
    name: '八音盒',
    description: '无人触碰时会自己响起，曲调颠倒错乱',
    anomaly: 'echo',
    story: '这是母亲送给女儿的生日礼物。母亲早逝后，八音盒成了母女之间唯一的联结。',
    processingSteps: generateSteps('music_box')
  },
  mirror: {
    type: 'mirror',
    name: '古铜镜',
    description: '镜中映出的不是你的脸，而是另一个时代的房间',
    anomaly: 'shadow',
    story: '传说这面镜子是一位清朝宫女所有，她将自己的灵魂封存在镜中，寻找替代者。',
    processingSteps: generateSteps('mirror')
  }
}

function generateSteps(type: RelicType): ProcessingStep[] {
  const baseSteps: ProcessingStep[] = [
    { id: 'step-1', name: '清洁', description: '用特制的溶液清洁遗物表面', type: 'clean', duration: 5000, requiredFocus: 10, completed: false },
    { id: 'step-2', name: '修复', description: '修复遗物的破损之处', type: 'repair', duration: 8000, requiredFocus: 15, completed: false },
    { id: 'step-3', name: '净化', description: '用香薰和符咒净化残留的阴气', type: 'purify', duration: 10000, requiredFocus: 20, completed: false },
    { id: 'step-4', name: '封存', description: '将遗物放入特制的收纳盒中', type: 'store', duration: 3000, requiredFocus: 5, completed: false }
  ]
  return baseSteps.map(s => ({ ...s, id: `${type}-${s.id}` }))
}

const namePool = {
  firstNames: ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗'],
  lastNames: ['明', '华', '强', '磊', '洋', '勇', '军', '杰', '静', '丽', '敏', '芳', '燕', '玲', '桂', '娣', '秀', '英', '梅', '兰'],
  causes: ['心脏病', '车祸', '癌症', '年老', '意外', '病逝', '溺水', '火灾', '自杀', '他杀', '不详']
}

const relicTypes: RelicType[] = ['photo', 'watch', 'letter', 'jewelry', 'toy', 'book', 'music_box', 'mirror']
const anomalyTypes: AnomalyType[] = ['whisper', 'cold_spot', 'shadow', 'flicker', 'echo', 'poltergeist']

export function generateRelic(type?: RelicType): Relic {
  const selectedType = type || relicTypes[Math.floor(Math.random() * relicTypes.length)]
  const template = relicTemplates[selectedType]
  const anomaly = anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)]
  return {
    ...template,
    id: `relic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    anomaly
  }
}

export function generateOrder(day: number): { order: any, relic: Relic } {
  const relic = generateRelic()
  const difficulty = Math.min(3, Math.max(1, Math.floor(Math.random() * day) + 1)) as 1 | 2 | 3
  const baseReward = 500 + (difficulty - 1) * 300
  const reward = baseReward + Math.floor(Math.random() * 200)

  const firstName = namePool.firstNames[Math.floor(Math.random() * namePool.firstNames.length)]
  const lastName = namePool.lastNames[Math.floor(Math.random() * namePool.lastNames.length)]
  const deceasedName = firstName + lastName
  const clientName = namePool.firstNames[Math.floor(Math.random() * namePool.firstNames.length)] + 
    namePool.lastNames[Math.floor(Math.random() * namePool.lastNames.length)]
  const cause = namePool.causes[Math.floor(Math.random() * namePool.causes.length)]

  const descriptions = [
    `我家${deceasedName}走得太突然，留下这个东西让我们全家都不安宁...`,
    `这是${deceasedName}生前最珍视的物品，希望能让它好好安息。`,
    `${deceasedName}临终前一直握着这个，我们不敢留在家中。`,
    `自从${deceasedName}走后，这个东西就开始不对劲了...`
  ]

  const order = {
    id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    clientName,
    deceasedName,
    deceasedAge: 30 + Math.floor(Math.random() * 60),
    description: descriptions[Math.floor(Math.random() * descriptions.length)] + `（死因：${cause}）`,
    reward,
    reputationReward: 10 + difficulty * 5,
    difficulty,
    deadline: day + 2 + difficulty,
    status: 'pending' as const,
    createdAt: Date.now()
  }

  return { order, relic }
}

export function getInitialOrders(day: number) {
  const count = 2 + Math.floor(Math.random() * 2)
  return Array.from({ length: count }, () => generateOrder(day))
}
