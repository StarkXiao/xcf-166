import type { GameEvent } from '../types'

export const narrativeEvents: GameEvent[] = [
  {
    id: 'intro-1',
    type: 'narrative',
    title: '殡仪馆地下二层',
    content: `你是这份工作的新入职者。
馆长告诉你，这里表面上是殡仪馆的遗物整理处，
但实际上，地下二层专门处理那些"不太对劲"的遗物。

"白天接单，夜里处理。"
他推给你一把锈迹斑斑的钥匙，
"记住，凌晨三点前必须离开。"

电梯缓缓下降，数字停在"B2"。
门开了，一股寒气扑面而来...`
  },
  {
    id: 'intro-2',
    type: 'narrative',
    title: '工作台',
    content: `工作台在房间中央，上面摆满了各种工具：
特制的清洁剂、用于修复的精密仪器、
还有一些你叫不出名字的符纸和香薰。

墙上的钟指向早上8点。
新的一天开始了。

桌上的电话突然响起，
是第一批订单来了。`
  }
]

export const anomalyEvents: GameEvent[] = [
  {
    id: 'anomaly-whisper-1',
    type: 'anomaly',
    title: '低语',
    content: `你听到耳边有人在低语。
声音很轻，但你能听清：
"帮帮我...告诉他们..."

你猛地回头，身后空无一人。
工作台前的遗物微微颤动着。`
  },
  {
    id: 'anomaly-cold-1',
    type: 'anomaly',
    title: '寒意',
    content: `房间的温度突然下降。
你呼出的空气变成了白雾。
工作台的边缘结了一层薄薄的霜。

遗物上散发着刺骨的寒意。`
  },
  {
    id: 'anomaly-shadow-1',
    type: 'anomaly',
    title: '影子',
    content: `你看到墙上的影子在动。
那不是你的影子。
它慢慢地、慢慢地，
向你的方向爬来。

你紧紧握住了手中的符咒。`
  },
  {
    id: 'anomaly-flicker-1',
    type: 'anomaly',
    title: '闪烁',
    content: `电灯开始疯狂闪烁。
明灭之间，你看到房间里
站满了模糊的人影。

灯亮了。
人影消失了。
只有遗物静静地躺在工作台上。`
  },
  {
    id: 'anomaly-echo-1',
    type: 'anomaly',
    title: '回声',
    content: `你听到了音乐声。
是一首很老的歌，
像是从很远很远的地方传来。

"如果有来生，要做一棵树..."

声音消失在黑暗中。`
  },
  {
    id: 'anomaly-poltergeist-1',
    type: 'anomaly',
    title: '骚动',
    content: `架子上的工具开始抖动。
一支钢笔飞了起来，
重重地砸在墙上。

遗物开始自己旋转。
你必须立刻做出反应！`
  }
]

export const choiceEvents: GameEvent[] = [
  {
    id: 'choice-old-man',
    type: 'choice',
    title: '神秘老人',
    content: `一个你从未见过的老人出现在门口。
他穿着老式的长袍，眼神深邃。

"年轻人，你在这里做什么？
这些东西不是活人应该碰的。

我可以教你一个法子，
但你要付出一点代价..."`,
    choices: [
      { id: 'accept', text: '接受他的帮助', effect: { sanity: -10, money: 200 } },
      { id: 'refuse', text: '拒绝，让他离开', effect: { sanity: 5, reputation: -5 } }
    ]
  },
  {
    id: 'choice-photo',
    type: 'choice',
    title: '照片中的秘密',
    content: `在处理一张老照片时，
你发现照片背面写着一行小字：

"如果有人看到这张照片，
请帮我告诉我的女儿，
爸爸对不起她。"

照片中的人似乎在看着你，
眼神中满是期盼。`,
    choices: [
      { id: 'help', text: '想办法联系他的女儿', effect: { reputation: 20, money: -100 } },
      { id: 'ignore', text: '装作没看到，继续工作', effect: { sanity: -15 } }
    ]
  },
  {
    id: 'choice-doll',
    type: 'choice',
    title: '娃娃的请求',
    content: `你听到一个小女孩的声音：
"叔叔，你能帮我找到我的小熊吗？
它丢在走廊里了，我好害怕..."

走廊一片漆黑，
不知道里面有什么在等着你。`,
    choices: [
      { id: 'go', text: '去走廊找小熊', effect: { sanity: -20, reputation: 30 } },
      { id: 'stay', text: '安抚她但不去', effect: { sanity: -5, reputation: -10 } }
    ]
  },
  {
    id: 'choice-mirror',
    type: 'choice',
    title: '镜中世界',
    content: `处理古铜镜时，
你看到镜中出现了一扇门。
门缓缓打开，
里面传来你母亲的声音：
"孩子，过来让妈妈看看你..."

你知道那不是真的，
但声音是如此熟悉...`,
    choices: [
      { id: 'break', text: '立刻打碎镜子', effect: { money: -500, sanity: 10 } },
      { id: 'close', text: '用布盖住镜子', effect: { sanity: -5 } },
      { id: 'stare', text: '再看一会儿', effect: { sanity: -25, reputation: 15 } }
    ]
  }
]

export const dayEndEvents: Record<number, GameEvent> = {
  3: {
    id: 'day-3',
    type: 'narrative',
    title: '第三天晚上',
    content: `你注意到墙上多了一道划痕。
昨天还没有的。

划痕像是指甲抓出来的，
一共有五道，
很深，深到能看到里面的水泥。

你检查了所有的门窗，
都锁得好好的。

那划痕是从里面抓的。`
  },
  7: {
    id: 'day-7',
    type: 'narrative',
    title: '第七天',
    content: `馆长打来电话，
语气很奇怪：

"你...你还好吧？
有没有看到什么...不该看到的东西？

记住，地下二层有它自己的规矩。
你对它好，它也会对你好。
但是如果你惹它生气了..."

电话突然断了。
你听到听筒里传来很多人的哭声。`
  },
  14: {
    id: 'day-14',
    type: 'narrative',
    title: '两周',
    content: `你开始习惯这里的一切。
低语不再让你感到害怕，
影子你也能视而不见。

直到今天早上，
你在镜子里看到了自己。

但是...镜子里的你，
在微笑。

而你脸上没有任何表情。`
  }
}

export function getRandomAnomalyEvent(): GameEvent {
  return anomalyEvents[Math.floor(Math.random() * anomalyEvents.length)]
}

export function getRandomChoiceEvent(): GameEvent {
  return choiceEvents[Math.floor(Math.random() * choiceEvents.length)]
}

export function getDayEndEvent(day: number): GameEvent | null {
  return dayEndEvents[day] || null
}
