import type { ActivityTemplate, Activity, ActivityStatistics, ActivityLog, ActivityEvent, TrackEventType } from '@/types/activity'

const now = Date.now()
const day = 24 * 60 * 60 * 1000

export const mockTemplates: ActivityTemplate[] = [
  {
    id: 'tpl_season',
    name: '赛季活动',
    type: 'season',
    description: '标准赛季活动模板，包含任务、等级、奖励系统',
    icon: 'Trophy',
    createdAt: now - 30 * day,
    updatedAt: now - 7 * day,
    defaultConfig: {
      priority: 10,
      isEnabled: true,
      audience: {},
    },
  },
  {
    id: 'tpl_signin',
    name: '签到活动',
    type: 'signin',
    description: '连续签到奖励模板，支持累计签到和连续签到',
    icon: 'Calendar',
    createdAt: now - 25 * day,
    updatedAt: now - 5 * day,
    defaultConfig: {
      priority: 5,
      isEnabled: true,
      audience: {},
    },
  },
  {
    id: 'tpl_task',
    name: '任务活动',
    type: 'task',
    description: '限时任务活动模板，完成任务获取奖励',
    icon: 'CheckSquare',
    createdAt: now - 20 * day,
    updatedAt: now - 3 * day,
    defaultConfig: {
      priority: 8,
      isEnabled: true,
      audience: {},
    },
  },
  {
    id: 'tpl_gacha',
    name: '抽奖活动',
    type: 'gacha',
    description: '概率抽奖模板，支持多档位奖励池',
    icon: 'Gift',
    createdAt: now - 15 * day,
    updatedAt: now - 2 * day,
    defaultConfig: {
      priority: 12,
      isEnabled: true,
      audience: {},
    },
  },
  {
    id: 'tpl_shop',
    name: '限时商店',
    type: 'limited_shop',
    description: '限时兑换商店模板，使用活动货币兑换道具',
    icon: 'ShoppingBag',
    createdAt: now - 10 * day,
    updatedAt: now - 1 * day,
    defaultConfig: {
      priority: 6,
      isEnabled: true,
      audience: {},
    },
  },
  {
    id: 'tpl_custom',
    name: '自定义活动',
    type: 'custom',
    description: '空白模板，完全自定义活动配置',
    icon: 'Layout',
    createdAt: now - 5 * day,
    updatedAt: now,
    defaultConfig: {
      priority: 1,
      isEnabled: true,
      audience: {},
    },
  },
]

function generateMockActivity(id: string, templateId: string, status: string, offsetDays: number): Activity {
  const template = mockTemplates.find(t => t.id === templateId)!
  return {
    id,
    status: status as any,
    createdBy: 'admin',
    createdAt: now - (offsetDays + 7) * day,
    updatedAt: now - offsetDays * day,
    startedAt: status === 'active' || status === 'ended' ? now - offsetDays * day : undefined,
    endedAt: status === 'ended' ? now - (offsetDays - 3) * day : undefined,
    approvedAt: status !== 'draft' ? now - (offsetDays + 5) * day : undefined,
    approvedBy: status !== 'draft' ? 'super_admin' : undefined,
    config: {
      templateId,
      name: `${template.name} - ${id.slice(-4)}`,
      description: `这是一个${template.name}活动`,
      schedule: {
        type: 'fixed',
        startTime: now - offsetDays * day,
        endTime: now + (30 - offsetDays) * day,
        timezone: 'Asia/Shanghai',
      },
      triggerConditions: {
        id: `cond_${id}`,
        logic: 'AND',
        conditions: [
          {
            id: `c_${id}_1`,
            type: 'player_level',
            operator: 'gte',
            value: 5,
            description: '玩家等级>=5',
          },
        ],
      },
      rewardRules: [
        {
          id: `rr_${id}_1`,
          name: '参与奖励',
          description: '首次参与活动奖励',
          priority: 1,
          limitType: 'total',
          limitCount: 1,
          conditions: {
            id: `rc_${id}_1`,
            logic: 'AND',
            conditions: [
              {
                id: `rc_c_${id}_1`,
                type: 'first_login',
                operator: 'eq',
                value: 'true',
                description: '首次登录活动',
              },
            ],
          },
          rewards: [
            {
              id: `rw_${id}_1`,
              type: 'currency',
              name: '金币',
              icon: 'Coins',
              rarity: 'common',
              value: 1000,
              count: 1,
            },
          ],
        },
      ],
      pageConfig: {
        id: `page_${id}`,
        name: '活动页面',
        theme: 'dark',
        backgroundColor: '#1a1a2e',
        elements: [
          {
            id: `el_${id}_banner`,
            type: 'banner',
            x: 0,
            y: 0,
            width: 750,
            height: 200,
            props: {
              imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=dark%20fantasy%20game%20event%20banner&image_size=landscape_16_9',
              title: template.name,
            },
            style: {},
          },
          {
            id: `el_${id}_btn`,
            type: 'button',
            x: 275,
            y: 400,
            width: 200,
            height: 60,
            props: {
              text: '立即参与',
              variant: 'primary',
            },
            style: {},
            action: {
              type: 'claim',
              params: { ruleId: `rr_${id}_1` },
            },
          },
        ],
      },
      isEnabled: true,
      priority: template.defaultConfig.priority || 1,
      audience: {},
    },
  }
}

export const mockActivities: Activity[] = [
  generateMockActivity('act_001', 'tpl_season', 'active', 5),
  generateMockActivity('act_002', 'tpl_signin', 'active', 3),
  generateMockActivity('act_003', 'tpl_task', 'pending', 2),
  generateMockActivity('act_004', 'tpl_gacha', 'ended', 10),
  generateMockActivity('act_005', 'tpl_shop', 'draft', 1),
]

function generateDataPoints(days: number, base: number, variance: number): { timestamp: number; value: number }[] {
  const points = []
  for (let i = days; i >= 0; i--) {
    points.push({
      timestamp: now - i * day,
      value: Math.floor(base + (Math.random() - 0.5) * variance),
    })
  }
  return points
}

export const mockStatistics: Record<string, ActivityStatistics> = {
  act_001: {
    activityId: 'act_001',
    totalParticipants: 12580,
    newParticipants: generateDataPoints(7, 800, 300),
    activeUsers: generateDataPoints(7, 1500, 500),
    completionRate: 0.68,
    rewardClaimedCount: 45230,
    rewardClaimedValue: 1250000,
    clickEvents: {
      'el_act_001_btn': 8920,
      'tab_rewards': 5670,
      'tab_tasks': 4320,
    },
    pageViews: 156800,
    uniqueVisitors: 23450,
    averageDuration: 180,
  },
  act_002: {
    activityId: 'act_002',
    totalParticipants: 8920,
    newParticipants: generateDataPoints(7, 500, 200),
    activeUsers: generateDataPoints(7, 1200, 400),
    completionRate: 0.85,
    rewardClaimedCount: 52340,
    rewardClaimedValue: 850000,
    clickEvents: {
      'signin_btn': 15680,
    },
    pageViews: 89200,
    uniqueVisitors: 15680,
    averageDuration: 60,
  },
  act_004: {
    activityId: 'act_004',
    totalParticipants: 25680,
    newParticipants: generateDataPoints(14, 1200, 500),
    activeUsers: generateDataPoints(14, 2000, 800),
    completionRate: 0.45,
    rewardClaimedCount: 128500,
    rewardClaimedValue: 5680000,
    clickEvents: {
      'gacha_btn_1': 45680,
      'gacha_btn_10': 32560,
    },
    pageViews: 356800,
    uniqueVisitors: 45230,
    averageDuration: 240,
  },
}

export const mockLogs: ActivityLog[] = [
  {
    id: 'log_001',
    activityId: 'act_001',
    playerId: 'p_10001',
    eventType: 'view',
    metadata: { page: 'home', source: 'banner' },
    timestamp: now - 3600 * 1000,
  },
  {
    id: 'log_002',
    activityId: 'act_001',
    playerId: 'p_10001',
    eventType: 'click',
    elementId: 'el_act_001_btn',
    metadata: { button: 'join' },
    timestamp: now - 3590 * 1000,
  },
  {
    id: 'log_003',
    activityId: 'act_001',
    playerId: 'p_10001',
    eventType: 'claim',
    rewardId: 'rw_act_001_1',
    metadata: { reward: '1000金币' },
    timestamp: now - 3580 * 1000,
  },
  {
    id: 'log_004',
    activityId: 'act_002',
    playerId: 'p_10002',
    eventType: 'complete',
    metadata: { task: 'signin_7' },
    timestamp: now - 7200 * 1000,
  },
  {
    id: 'log_005',
    activityId: 'act_001',
    playerId: 'p_10003',
    eventType: 'view',
    metadata: { page: 'season' },
    timestamp: now - 10800 * 1000,
  },
]

export function generateMockEvents(): ActivityEvent[] {
  const events: ActivityEvent[] = []
  const activityIds = ['act_001', 'act_002', 'act_004']
  const eventTypes: TrackEventType[] = ['exposure', 'click', 'claim', 'complete']
  const elementIds = ['el_act_001_btn', 'tab_rewards', 'tab_tasks', 'signin_btn', 'gacha_btn_1', 'gacha_btn_10']
  const rewardIds = ['rw_act_001_1', 'rw_act_001_2', 'rw_act_002_1']

  let eventId = 0

  for (let i = 0; i < 500; i++) {
    const activityId = activityIds[Math.floor(Math.random() * activityIds.length)]
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)]
    const playerId = `p_${10000 + Math.floor(Math.random() * 1000)}`
    const timestamp = now - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)

    const event: ActivityEvent = {
      id: `evt_${++eventId}`,
      activityId,
      playerId,
      eventType,
      metadata: {
        source: ['banner', 'push', 'direct', 'menu'][Math.floor(Math.random() * 4)],
      device: ['mobile', 'desktop'][Math.floor(Math.random() * 2)],
      sessionId: `sess_${Math.random().toString(36).slice(2, 10)}`,
      },
      timestamp,
    }

    if (eventType === 'click') {
      event.elementId = elementIds[Math.floor(Math.random() * elementIds.length)]
      event.metadata.x = Math.floor(Math.random() * 400)
      event.metadata.y = Math.floor(Math.random() * 800)
    }

    if (eventType === 'claim') {
      event.rewardId = rewardIds[Math.floor(Math.random() * rewardIds.length)]
      event.metadata.value = Math.floor(Math.random() * 1000)
      event.metadata.rewardName = ['100金币', '50钻石', '稀有道具'][Math.floor(Math.random() * 3)]
    }

    if (eventType === 'complete') {
      event.metadata.taskId = `task_${Math.floor(Math.random() * 10)}`
      event.metadata.duration = Math.floor(Math.random() * 600)
    }

    events.push(event)
  }

  events.sort((a, b) => b.timestamp - a.timestamp)

  return events
}
