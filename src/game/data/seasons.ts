import type { Season } from '@/types/season'

const now = Date.now()
const thirtyDays = 30 * 24 * 60 * 60 * 1000

export const seasons: Season[] = [
  {
    id: 'season_001',
    name: '渡灵赛季',
    theme: '第一赛季 · 渡灵之旅',
    startTime: now - 7 * 24 * 60 * 60 * 1000,
    endTime: now + thirtyDays,
    status: 'active',
    description: '在这诡异的殡仪馆中，净化每一个充满怨念的遗物，帮助亡魂得到安息。完成任务获取丰厚奖励，在排行榜上留下你的传说！',
    bannerImage: '',
    maxLevel: 50,
    baseExpPerLevel: 100,
    expMultiplier: 1.2,
  },
]

export function getCurrentSeason(): Season | undefined {
  const now = Date.now()
  return seasons.find((s) => {
    if (s.status === 'settled') return true
    if (s.status === 'ended') return true
    return s.status === 'active' && s.startTime <= now && s.endTime >= now
  })
}

export function getActiveSeason(): Season | undefined {
  const now = Date.now()
  return seasons.find(
    (s) => s.status === 'active' && s.startTime <= now && s.endTime >= now
  )
}

export function getSeasonById(id: string): Season | undefined {
  return seasons.find((s) => s.id === id)
}
