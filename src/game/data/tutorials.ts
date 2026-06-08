import type { TutorialStep, TutorialPhaseConfig, TutorialPhase } from '@/types/tutorial'

function generateTutorialId(prefix: string, phase: string, index: number): string {
  return `tutorial_${prefix}_${phase}_${index.toString().padStart(3, '0')}`
}

export const tutorialPhaseConfigs: Record<TutorialPhase, TutorialPhaseConfig> = {
  welcome: {
    id: 'welcome',
    name: '欢迎来到博物馆',
    description: '欢迎加入地下二层博物馆，成为新任遗物保管员。',
    steps: [
      'tutorial_step_welcome_001',
      'tutorial_step_welcome_002'
    ],
    isMandatory: false,
    canSkipPhase: true,
    rewards: [
      { type: 'currency', id: 'tut_welcome_reward', name: '启动资金', icon: '💰', value: 500 }
    ]
  },
  game_intro: {
    id: 'game_intro',
    name: '游戏介绍',
    description: '了解游戏的基本世界观和核心玩法。',
    steps: [
      'tutorial_step_intro_001',
      'tutorial_step_intro_002',
      'tutorial_step_intro_003'
    ],
    isMandatory: false,
    canSkipPhase: true,
    rewards: [
      { type: 'exp', id: 'tut_intro_reward', name: '经验奖励', icon: '⭐', value: 100 }
    ]
  },
  order_system: {
    id: 'order_system',
    name: '订单系统',
    description: '学习如何接收和管理客户订单。',
    steps: [
      'tutorial_step_order_001',
      'tutorial_step_order_002',
      'tutorial_step_order_003'
    ],
    isMandatory: true,
    canSkipPhase: false,
    rewards: [
      { type: 'currency', id: 'tut_order_reward', name: '勤劳奖励', icon: '📋', value: 300 }
    ]
  },
  purification: {
    id: 'purification',
    name: '净化方法',
    description: '掌握五种净化遗物的方法。',
    steps: [
      'tutorial_step_purify_001',
      'tutorial_step_purify_002',
      'tutorial_step_purify_003',
      'tutorial_step_purify_004'
    ],
    isMandatory: true,
    canSkipPhase: false,
    rewards: [
      { type: 'exp', id: 'tut_purify_reward', name: '净化经验', icon: '✨', value: 150 }
    ]
  },
  relic_process: {
    id: 'relic_process',
    name: '遗物处理',
    description: '实际操作净化一件遗物。',
    steps: [
      'tutorial_step_relic_001',
      'tutorial_step_relic_002',
      'tutorial_step_relic_003',
      'tutorial_step_relic_004'
    ],
    isMandatory: true,
    canSkipPhase: false,
    rewards: [
      { type: 'badge', id: 'tut_relic_badge', name: '新手净化师', icon: '🏅', value: 1 },
      { type: 'currency', id: 'tut_relic_reward', name: '首单奖励', icon: '💰', value: 1000 }
    ]
  },
  day_night: {
    id: 'day_night',
    name: '昼夜系统',
    description: '了解白天和夜晚的不同机制。',
    steps: [
      'tutorial_step_time_001',
      'tutorial_step_time_002'
    ],
    isMandatory: true,
    canSkipPhase: false,
    rewards: [
      { type: 'exp', id: 'tut_time_reward', name: '时间认知', icon: '🌙', value: 80 }
    ]
  },
  sanity_system: {
    id: 'sanity_system',
    name: '理智系统',
    description: '学习如何管理和恢复理智值。',
    steps: [
      'tutorial_step_sanity_001',
      'tutorial_step_sanity_002',
      'tutorial_step_sanity_003'
    ],
    isMandatory: true,
    canSkipPhase: false,
    rewards: [
      { type: 'currency', id: 'tut_sanity_reward', name: '精神补助', icon: '💊', value: 200 }
    ]
  },
  character_system: {
    id: 'character_system',
    name: '角色系统',
    description: '了解角色属性和技能系统。',
    steps: [
      'tutorial_step_char_001',
      'tutorial_step_char_002'
    ],
    isMandatory: false,
    canSkipPhase: true,
    rewards: [
      { type: 'exp', id: 'tut_char_reward', name: '角色经验', icon: '👤', value: 120 }
    ]
  },
  season_intro: {
    id: 'season_intro',
    name: '赛季系统',
    description: '了解赛季通行证和等级奖励。',
    steps: [
      'tutorial_step_season_001',
      'tutorial_step_season_002'
    ],
    isMandatory: false,
    canSkipPhase: true,
    rewards: [
      { type: 'exp', id: 'tut_season_reward', name: '赛季经验', icon: '🏆', value: 200 }
    ]
  },
  achievement_intro: {
    id: 'achievement_intro',
    name: '成就系统',
    description: '了解成就和徽章收集。',
    steps: [
      'tutorial_step_ach_001',
      'tutorial_step_ach_002'
    ],
    isMandatory: false,
    canSkipPhase: true,
    rewards: [
      { type: 'exp', id: 'tut_ach_reward', name: '探索经验', icon: '🎖️', value: 100 }
    ]
  },
  shop_intro: {
    id: 'shop_intro',
    name: '道具商城',
    description: '了解如何购买和使用道具。',
    steps: [
      'tutorial_step_shop_001',
      'tutorial_step_shop_002'
    ],
    isMandatory: false,
    canSkipPhase: true,
    rewards: [
      { type: 'currency', id: 'tut_shop_reward', name: '购物津贴', icon: '🛒', value: 500 }
    ]
  },
  complete: {
    id: 'complete',
    name: '引导完成',
    description: '恭喜完成新手引导！',
    steps: [
      'tutorial_step_complete_001',
      'tutorial_step_complete_002'
    ],
    isMandatory: false,
    canSkipPhase: true,
    rewards: [
      { type: 'badge', id: 'tut_complete_badge', name: '引导完成者', icon: '🎓', value: 1 },
      { type: 'currency', id: 'tut_complete_reward', name: '毕业奖励', icon: '🎁', value: 2000 },
      { type: 'exp', id: 'tut_complete_exp', name: '毕业经验', icon: '⭐', value: 500 }
    ]
  }
}

export const tutorialSteps: TutorialStep[] = [
  {
    id: 'tutorial_step_welcome_001',
    phase: 'welcome',
    order: 1,
    title: '欢迎来到博物馆',
    content: '你好，新任保管员！',
    description: '我是这座地下二层博物馆的馆长。从今天起，你将负责净化那些被怨念侵蚀的遗物，帮助它们安息。',
    triggerType: 'auto',
    actionType: 'show_modal',
    position: 'center',
    canSkip: true,
    isBlocking: true,
    rewards: [
      { type: 'currency', id: 'tut_welcome_1_reward', name: '欢迎礼金', icon: '💰', value: 200 }
    ]
  },
  {
    id: 'tutorial_step_welcome_002',
    phase: 'welcome',
    order: 2,
    title: '你的使命',
    content: '净化遗物，安抚灵魂',
    description: '每一件遗物都承载着生前的记忆和怨念。你的工作是使用不同的净化方法，消除怨念，让遗物得到安息。完成客户的订单，获取报酬，提升声望。',
    triggerType: 'auto',
    actionType: 'show_modal',
    position: 'center',
    canSkip: true,
    isBlocking: true,
    nextStepDelay: 500
  },
  {
    id: 'tutorial_step_intro_001',
    phase: 'game_intro',
    order: 1,
    title: '游戏核心循环',
    content: '接单 → 净化 → 交付 → 奖励',
    description: '游戏的核心玩法非常简单：接收客户订单 → 选择合适的净化方法处理遗物 → 完成交付获得报酬 → 用收益提升自己。',
    triggerType: 'auto',
    actionType: 'show_modal',
    position: 'center',
    canSkip: true,
    isBlocking: true
  },
  {
    id: 'tutorial_step_intro_002',
    phase: 'game_intro',
    order: 2,
    title: '核心数值',
    content: '金钱、声望、理智值',
    description: '你需要关注三个核心数值：\n\n💰 **金钱** - 用于购买道具和维持生计\n⭐ **声望** - 影响订单品质和稀有度\n💚 **理智值** - 处理被污染遗物会消耗理智，归零则游戏结束',
    triggerType: 'auto',
    actionType: 'show_modal',
    position: 'center',
    canSkip: true,
    isBlocking: true
  },
  {
    id: 'tutorial_step_intro_003',
    phase: 'game_intro',
    order: 3,
    title: '准备好了吗？',
    content: '让我们开始吧！',
    description: '接下来我们会逐一介绍各个系统。你可以随时跳过引导，但建议新手完整看完。每个阶段完成后都会有奖励哦！',
    triggerType: 'auto',
    actionType: 'show_modal',
    position: 'center',
    canSkip: true,
    isBlocking: true
  },
  {
    id: 'tutorial_step_order_001',
    phase: 'order_system',
    order: 1,
    title: '订单面板',
    content: '查看可用订单',
    description: '左侧的订单面板显示了当前可用的订单。每个订单都包含：遗物信息、客户名称、截止日期和报酬。点击「接受」按钮来接取订单。',
    triggerType: 'auto',
    actionType: 'highlight_element',
    targetSelector: '.order-panel',
    position: 'right',
    canSkip: false,
    isBlocking: true,
    validation: {
      type: 'event',
      eventType: 'order_accepted',
      maxRetries: 3
    }
  },
  {
    id: 'tutorial_step_order_002',
    phase: 'order_system',
    order: 2,
    title: '接取订单',
    content: '点击「接受」按钮',
    description: '请在左侧订单面板中选择一个订单并点击「接受」按钮。注意订单的截止日期，逾期未完成会损失声望。',
    triggerType: 'auto',
    actionType: 'highlight_element',
    targetSelector: '.accept-order-btn',
    position: 'right',
    canSkip: false,
    isBlocking: true,
    validation: {
      type: 'event',
      eventType: 'order_accepted',
      maxRetries: 3
    }
  },
  {
    id: 'tutorial_step_order_003',
    phase: 'order_system',
    order: 3,
    title: '订单管理',
    content: '管理已接订单',
    description: '已接取的订单会显示在「进行中」标签页。你可以同时接取多个订单，但要注意时间管理。点击订单卡片可以查看详细信息。',
    triggerType: 'auto',
    actionType: 'highlight_element',
    targetSelector: '.accepted-orders-tab',
    position: 'right',
    canSkip: true,
    isBlocking: true
  },
  {
    id: 'tutorial_step_purify_001',
    phase: 'purification',
    order: 1,
    title: '净化方法',
    content: '五种净化方式',
    description: '遗物有五种净化方法，每种都需要不同的操作技巧：\n\n🧻 **擦拭** - 用鼠标滑动擦拭表面\n✍️ **画符** - 按照提示绘制符咒\n💧 **浸泡** - 选择正确的净化配方\n🔥 **焚烧** - 把握时机点击\n🔮 **组合** - 多种方法组合使用',
    triggerType: 'auto',
    actionType: 'show_modal',
    position: 'center',
    canSkip: true,
    isBlocking: true
  },
  {
    id: 'tutorial_step_purify_002',
    phase: 'purification',
    order: 2,
    title: '净化难度',
    content: '污染度与怨念值',
    description: '每件遗物都有两个关键属性：\n\n📊 **污染度** - 影响净化所需时间和难度\n👻 **怨念值** - 越高的遗物会消耗更多理智值\n\n净化得分 = 操作精度 × 0.6 + 时间奖励 × 0.2 + 工具加成 × 0.2',
    triggerType: 'auto',
    actionType: 'show_modal',
    position: 'center',
    canSkip: true,
    isBlocking: true
  },
  {
    id: 'tutorial_step_purify_003',
    phase: 'purification',
    order: 3,
    title: '工作台',
    content: '中央净化区域',
    description: '中央的工作台是你净化遗物的地方。接受订单后，遗物会出现在这里。选择正确的净化方法，按照提示完成操作。',
    triggerType: 'auto',
    actionType: 'highlight_element',
    targetSelector: '.workbench-area',
    position: 'top',
    canSkip: true,
    isBlocking: true
  },
  {
    id: 'tutorial_step_purify_004',
    phase: 'purification',
    order: 4,
    title: '净化进度',
    content: '查看净化状态',
    description: '净化过程中，进度条会显示当前进度。注意屏幕边缘的粒子效果——那是怨念在消散。完成净化后会获得评分和奖励。',
    triggerType: 'auto',
    actionType: 'highlight_element',
    targetSelector: '.purification-progress',
    position: 'bottom',
    canSkip: true,
    isBlocking: true
  },
  {
    id: 'tutorial_step_relic_001',
    phase: 'relic_process',
    order: 1,
    title: '选择遗物',
    content: '开始净化第一件遗物',
    description: '现在让我们实际操作一下！如果你还没有接取订单，请先在左侧面板接取一个。然后点击中央工作台上的遗物开始净化。',
    triggerType: 'auto',
    actionType: 'highlight_element',
    targetSelector: '.relic-on-workbench',
    position: 'top',
    canSkip: false,
    isBlocking: true,
    validation: {
      type: 'event',
      eventType: 'relic_purified',
      maxRetries: 5
    }
  },
  {
    id: 'tutorial_step_relic_002',
    phase: 'relic_process',
    order: 2,
    title: '净化操作',
    content: '按照提示完成操作',
    description: '根据遗物的净化方法，按照屏幕提示完成操作。注意观察进度条和操作评分。不要着急，稳扎稳打才能获得高分！',
    triggerType: 'auto',
    actionType: 'show_modal',
    position: 'center',
    canSkip: false,
    isBlocking: true,
    validation: {
      type: 'event',
      eventType: 'relic_purified',
      maxRetries: 5
    }
  },
  {
    id: 'tutorial_step_relic_003',
    phase: 'relic_process',
    order: 3,
    title: '完成交付',
    content: '交付完成的订单',
    description: '净化完成后，订单状态会变为「可交付」。点击「交付」按钮完成订单，获得报酬和声望。客户的满意度会影响你的声望增长。',
    triggerType: 'auto',
    actionType: 'highlight_element',
    targetSelector: '.deliver-order-btn',
    position: 'right',
    canSkip: false,
    isBlocking: true,
    validation: {
      type: 'event',
      eventType: 'order_completed',
      maxRetries: 3
    }
  },
  {
    id: 'tutorial_step_relic_004',
    phase: 'relic_process',
    order: 4,
    title: '干得漂亮！',
    content: '你完成了第一单！',
    description: '恭喜你成功净化了第一件遗物并完成交付！看到右上角的数值变化了吗？继续努力，你会成为最优秀的遗物净化师！',
    triggerType: 'auto',
    actionType: 'show_modal',
    position: 'center',
    canSkip: true,
    isBlocking: true
  },
  {
    id: 'tutorial_step_time_001',
    phase: 'day_night',
    order: 1,
    title: '昼夜交替',
    content: '白天工作，夜晚休息',
    description: '游戏有昼夜交替机制：\n\n☀️ **白天** - 可以接收和处理订单，理智值会缓慢恢复\n🌙 **夜晚** - 会触发随机事件，可能有危险也可能有机遇\n\n点击「进入夜晚」或「新的一天」来切换时间。',
    triggerType: 'auto',
    actionType: 'show_modal',
    position: 'center',
    canSkip: true,
    isBlocking: true
  },
  {
    id: 'tutorial_step_time_002',
    phase: 'day_night',
    order: 2,
    title: '时间控制',
    content: '管理你的时间',
    description: '右上角显示当前时间和天数。合理安排时间很重要：\n\n• 订单有截止日期，注意不要逾期\n• 每晚理智值会消耗，白天会恢复\n• 特定事件只在特定时间触发',
    triggerType: 'auto',
    actionType: 'highlight_element',
    targetSelector: '.time-display',
    position: 'left',
    canSkip: true,
    isBlocking: true
  },
  {
    id: 'tutorial_step_sanity_001',
    phase: 'sanity_system',
    order: 1,
    title: '理智系统',
    content: '保护你的精神',
    description: '💚 **理智值**是最重要的生存指标：\n\n• 处理高污染遗物会消耗理智\n• 遇到恐怖事件也会损失理智\n• 白天自然恢复，也可以用道具恢复\n• 理智值归零 = 游戏结束',
    triggerType: 'auto',
    actionType: 'show_modal',
    position: 'center',
    canSkip: true,
    isBlocking: true
  },
  {
    id: 'tutorial_step_sanity_002',
    phase: 'sanity_system',
    order: 2,
    title: '理智恢复',
    content: '保持精神健康',
    description: '恢复理智的方法：\n\n☀️ 白天自然恢复 10 点\n🛒 在商店购买恢复道具\n😴 某些随机事件可以恢复\n👤 角色技能可以提升恢复效率\n\n注意：理智值低于30时会出现警告效果。',
    triggerType: 'auto',
    actionType: 'show_modal',
    position: 'center',
    canSkip: true,
    isBlocking: true
  },
  {
    id: 'tutorial_step_sanity_003',
    phase: 'sanity_system',
    order: 3,
    title: '理智指示器',
    content: '关注你的状态',
    description: '右上角的状态条显示理智值。颜色会根据数值变化：\n\n🟢 绿色 - 70以上，状态良好\n🟡 黄色 - 40-70，轻微消耗\n🔴 红色 - 40以下，危险状态\n\n保持绿色，远离红色！',
    triggerType: 'auto',
    actionType: 'highlight_element',
    targetSelector: '.sanity-bar',
    position: 'left',
    canSkip: true,
    isBlocking: true
  },
  {
    id: 'tutorial_step_char_001',
    phase: 'character_system',
    order: 1,
    title: '角色系统',
    content: '角色属性和技能',
    description: '点击顶部的角色头像可以查看角色信息：\n\n👤 **属性** - 理智、净化效率、声望加成等\n⚔️ **技能** - 解锁后提供各种被动加成\n⭐ **经验等级** - 完成订单获得经验升级\n\n升级会提升属性并解锁新技能。',
    triggerType: 'auto',
    actionType: 'highlight_element',
    targetSelector: '.character-avatar',
    position: 'left',
    canSkip: true,
    isBlocking: true
  },
  {
    id: 'tutorial_step_char_002',
    phase: 'character_system',
    order: 2,
    title: '角色解锁',
    content: '收集更多角色',
    description: '游戏中有多个可解锁角色，每个角色都有独特的属性和技能。完成特定成就或达到一定声望可以解锁新角色。不同角色适合不同的游戏风格！',
    triggerType: 'auto',
    actionType: 'show_modal',
    position: 'center',
    canSkip: true,
    isBlocking: true
  },
  {
    id: 'tutorial_step_season_001',
    phase: 'season_intro',
    order: 1,
    title: '赛季系统',
    content: '赛季通行证',
    description: '🏆 **赛季系统**提供长期目标和丰厚奖励：\n\n• 完成赛季任务获得经验\n• 提升赛季等级解锁奖励\n• 免费和付费奖励轨道\n• 限定时间内完成\n\n点击右上角的赛季图标查看详情。',
    triggerType: 'auto',
    actionType: 'highlight_element',
    targetSelector: '.season-icon',
    position: 'left',
    canSkip: true,
    isBlocking: true
  },
  {
    id: 'tutorial_step_season_002',
    phase: 'season_intro',
    order: 2,
    title: '赛季任务',
    content: '完成任务获取奖励',
    description: '赛季中心有每日和每周任务：\n\n📅 **每日任务** - 每天刷新，简单易完成\n📆 **每周任务** - 每周刷新，奖励更丰厚\n🎯 **赛季挑战** - 赛季内完成，稀有奖励\n\n完成所有任务可以拿到全部赛季奖励！',
    triggerType: 'auto',
    actionType: 'show_modal',
    position: 'center',
    canSkip: true,
    isBlocking: true
  },
  {
    id: 'tutorial_step_ach_001',
    phase: 'achievement_intro',
    order: 1,
    title: '成就系统',
    content: '收集成就和徽章',
    description: '🏆 **成就系统**记录你的游戏历程：\n\n• 完成各种游戏行为解锁成就\n• 成就分为普通、稀有、史诗、传说\n• 解锁成就可以领取奖励\n• 收集徽章和称号展示你的成就',
    triggerType: 'auto',
    actionType: 'highlight_element',
    targetSelector: '.achievement-icon',
    position: 'left',
    canSkip: true,
    isBlocking: true
  },
  {
    id: 'tutorial_step_ach_002',
    phase: 'achievement_intro',
    order: 2,
    title: '隐藏成就',
    content: '探索更多内容',
    description: '游戏中还有很多隐藏成就等待你发现：\n\n🔍 **隐藏成就** - 不显示达成条件\n🎭 **稀有成就** - 需要特定操作触发\n📖 **剧情成就** - 跟随故事线解锁\n\n多多探索，发现所有秘密吧！',
    triggerType: 'auto',
    actionType: 'show_modal',
    position: 'center',
    canSkip: true,
    isBlocking: true
  },
  {
    id: 'tutorial_step_shop_001',
    phase: 'shop_intro',
    order: 1,
    title: '道具商城',
    content: '购买有用的道具',
    description: '🛒 **道具商城**提供各种辅助道具：\n\n💊 理智恢复道具\n✨ 净化加成道具\n🎲 随机事件刷新券\n🎁 神秘礼包\n\n合理使用道具可以让游戏更轻松！',
    triggerType: 'auto',
    actionType: 'highlight_element',
    targetSelector: '.shop-icon',
    position: 'left',
    canSkip: true,
    isBlocking: true
  },
  {
    id: 'tutorial_step_shop_002',
    phase: 'shop_intro',
    order: 2,
    title: '道具使用',
    content: '管理你的库存',
    description: '购买的道具会存入库存：\n\n• 点击道具图标使用\n• 某些道具有冷却时间\n• 关注折扣活动\n• 每日特价商品\n\n理智不足时记得来商店看看！',
    triggerType: 'auto',
    actionType: 'show_modal',
    position: 'center',
    canSkip: true,
    isBlocking: true
  },
  {
    id: 'tutorial_step_complete_001',
    phase: 'complete',
    order: 1,
    title: '🎉 恭喜完成引导！',
    content: '你已经掌握了基本玩法',
    description: '太棒了！你已经完成了全部新手引导，现在可以独立进行游戏了。\n\n你已经学会了：\n✅ 如何接收和处理订单\n✅ 五种净化遗物的方法\n✅ 如何管理理智和金钱\n✅ 赛季、成就、商店等系统',
    triggerType: 'auto',
    actionType: 'show_modal',
    position: 'center',
    canSkip: true,
    isBlocking: true
  },
  {
    id: 'tutorial_step_complete_002',
    phase: 'complete',
    order: 2,
    title: '开始你的旅程',
    content: '博物馆的大门已经敞开',
    description: '现在，地下二层博物馆的大门已经为你敞开。去吧，净化更多的遗物，安抚更多的灵魂，成为传说中的遗物净化师！\n\n⭐ 新手引导奖励已发放到你的账户\n\n祝你好运，保管员！',
    triggerType: 'auto',
    actionType: 'show_modal',
    position: 'center',
    canSkip: true,
    isBlocking: true,
    nextStepDelay: 1000
  }
]

export function getTutorialStepById(stepId: string): TutorialStep | undefined {
  return tutorialSteps.find(step => step.id === stepId)
}

export function getTutorialStepsByPhase(phase: TutorialPhase): TutorialStep[] {
  return tutorialSteps
    .filter(step => step.phase === phase)
    .sort((a, b) => a.order - b.order)
}

export function getPhaseConfig(phase: TutorialPhase): TutorialPhaseConfig | undefined {
  return tutorialPhaseConfigs[phase]
}

export function getTotalStepCount(): number {
  return tutorialSteps.length
}

export function getPhaseStepCount(phase: TutorialPhase): number {
  return tutorialPhaseConfigs[phase]?.steps.length || 0
}
