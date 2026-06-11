import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LocationQueryValue } from 'vue-router'
import { useAchievementStore } from './achievementStore'
import { useShopStore } from './shopStore'
import { useCharacterStore } from './characterStore'
import { useDungeonStore } from './dungeonStore'
import { useSeasonStore } from './seasonStore'
import { useGameStore } from './gameStore'
import { achievements } from '@/game/data/achievements'
import { dungeons } from '@/game/data/dungeons'
import { getInitialShopItems } from '@/game/data/shopItems'
import { getAllCharacters } from '@/game/data/characters'
import { getTasksBySeasonId } from '@/game/data/seasonTasks'
import type { AchievementCategory } from '@/types/achievement'
import type { ItemCategory } from '@/types/shop'

export type SearchCategory = 'page' | 'achievement' | 'item' | 'character' | 'dungeon' | 'task'

export interface SearchRouteQuery {
  [key: string]: LocationQueryValue | LocationQueryValue[]
}

export interface SearchItem {
  id: string
  title: string
  description: string
  category: SearchCategory
  icon: string
  route?: string
  routeQuery?: SearchRouteQuery
  targetId?: string
  keywords: string[]
  rarity?: string
}

export type { ItemCategory, AchievementCategory }

const HISTORY_KEY = 'global_search_history'
const MAX_HISTORY = 20

const categoryLabels: Record<SearchCategory, string> = {
  page: '页面',
  achievement: '成就',
  item: '道具',
  character: '角色',
  dungeon: '副本',
  task: '任务',
}

const categoryOrder: SearchCategory[] = ['page', 'achievement', 'character', 'item', 'dungeon', 'task']

const categoryColors: Record<SearchCategory, string> = {
  page: 'text-cyan-400',
  achievement: 'text-amber-400',
  item: 'text-green-400',
  character: 'text-purple-400',
  dungeon: 'text-red-400',
  task: 'text-blue-400',
}

const categoryBgColors: Record<SearchCategory, string> = {
  page: 'bg-cyan-500/10',
  achievement: 'bg-amber-500/10',
  item: 'bg-green-500/10',
  character: 'bg-purple-500/10',
  dungeon: 'bg-red-500/10',
  task: 'bg-blue-500/10',
}

const pageItems: SearchItem[] = [
  { id: 'page_game', title: '游戏主页', description: '返回游戏主界面', category: 'page', icon: '🏠', route: '/', keywords: ['主页', '游戏', '首页', 'home', 'game'] },
  { id: 'page_shop', title: '道具商城', description: '浏览和购买道具', category: 'page', icon: '🏪', route: '/shop', keywords: ['商城', '商店', '道具', '购买', 'shop', 'store'] },
  { id: 'page_shop_orders', title: '订单记录', description: '查看购买订单历史', category: 'page', icon: '📦', route: '/shop', routeQuery: { tab: 'orders' }, keywords: ['订单', '购买历史', '订单记录', 'orders'] },
  { id: 'page_shop_inventory', title: '背包道具', description: '查看背包已拥有的道具', category: 'page', icon: '🎒', route: '/shop', routeQuery: { tab: 'inventory' }, keywords: ['背包', '我的道具', '已拥有', 'inventory', 'backpack'] },
  { id: 'page_season', title: '赛季中心', description: '查看赛季任务与排行', category: 'page', icon: '🏆', route: '/season', keywords: ['赛季', '排行', '赛季任务', 'season', 'rank'] },
  { id: 'page_season_tasks', title: '赛季任务', description: '当前赛季所有任务', category: 'page', icon: '📋', route: '/season', routeQuery: { tab: 'tasks' }, keywords: ['赛季任务', '任务'] },
  { id: 'page_season_weekly', title: '周常任务', description: '每周刷新的任务', category: 'page', icon: '📅', route: '/season', routeQuery: { tab: 'weekly_tasks' }, keywords: ['周常', '每周', '周常任务', 'weekly'] },
  { id: 'page_season_growth', title: '成长任务', description: '一次性成长目标任务', category: 'page', icon: '📈', route: '/season', routeQuery: { tab: 'growth_tasks' }, keywords: ['成长', '成长任务', '目标', 'growth'] },
  { id: 'page_season_reward_pool', title: '奖励池', description: '赛季奖励池兑换', category: 'page', icon: '🎁', route: '/season', routeQuery: { tab: 'reward_pool' }, keywords: ['奖励池', '兑换', 'reward'] },
  { id: 'page_season_leaderboard', title: '赛季排行榜', description: '全服玩家赛季排名', category: 'page', icon: '🥇', route: '/season', routeQuery: { tab: 'leaderboard' }, keywords: ['排行', '排行榜', 'leaderboard', 'rank'] },
  { id: 'page_season_progress', title: '进度追踪', description: '赛季进度与奖励线', category: 'page', icon: '🎯', route: '/season', routeQuery: { tab: 'progress' }, keywords: ['进度', '进度追踪', 'progress'] },
  { id: 'page_season_rewards', title: '奖励中心', description: '赛季奖励领取中心', category: 'page', icon: '💰', route: '/season', routeQuery: { tab: 'rewards' }, keywords: ['奖励', '奖励中心', 'rewards'] },
  { id: 'page_character', title: '角色养成', description: '管理和升级角色', category: 'page', icon: '🎭', route: '/character', keywords: ['角色', '养成', '技能', 'character'] },
  { id: 'page_character_skills', title: '角色技能', description: '查看并升级角色技能', category: 'page', icon: '✨', route: '/character', routeQuery: { profile: 'skills' }, keywords: ['技能', '升级技能', 'skills'] },
  { id: 'page_character_synergies', title: '组合加成', description: '角色之间的组合效果', category: 'page', icon: '🔗', route: '/character', routeQuery: { profile: 'synergies' }, keywords: ['组合', '组合加成', '协同', 'synergy'] },
  { id: 'page_character_achievements', title: '角色成就沉淀', description: '该角色的成就与徽章', category: 'page', icon: '🏅', route: '/character', routeQuery: { profile: 'achievements' }, keywords: ['角色成就', '成就沉淀'] },
  { id: 'page_achievements', title: '成就中心', description: '查看成就与徽章', category: 'page', icon: '🏅', route: '/achievements', keywords: ['成就', '徽章', 'achievement', 'badge'] },
  { id: 'page_achievements_gameplay', title: '游戏玩法成就', description: '游戏玩法相关成就', category: 'page', icon: '🎯', route: '/achievements', routeQuery: { category: 'gameplay' }, keywords: ['玩法', '游戏玩法', 'gameplay'] },
  { id: 'page_achievements_collection', title: '收集成就', description: '收集类成就', category: 'page', icon: '📚', route: '/achievements', routeQuery: { category: 'collection' }, keywords: ['收集', 'collection'] },
  { id: 'page_achievements_seasonal', title: '赛季成就', description: '赛季限定成就', category: 'page', icon: '📅', route: '/achievements', routeQuery: { category: 'seasonal' }, keywords: ['赛季成就', 'seasonal'] },
  { id: 'page_achievements_social', title: '社交成就', description: '好友与社交相关成就', category: 'page', icon: '💬', route: '/achievements', routeQuery: { category: 'social' }, keywords: ['社交', '好友', 'social'] },
  { id: 'page_friends', title: '好友协作', description: '好友系统与社交', category: 'page', icon: '👫', route: '/friends', keywords: ['好友', '社交', '协作', 'friend'] },
  { id: 'page_dungeon', title: '挑战副本', description: '进入副本战斗', category: 'page', icon: '⚔️', route: '/dungeon', keywords: ['副本', '战斗', '挑战', 'dungeon', 'battle'] },
  { id: 'page_dungeon_stats', title: '副本挑战统计', description: '副本通关与战斗统计', category: 'page', icon: '📊', route: '/dungeon', routeQuery: { tab: 'stats' }, keywords: ['副本统计', '挑战统计', '统计'] },
  { id: 'page_mail', title: '邮件中心', description: '查看邮件与附件', category: 'page', icon: '📬', route: '/mail', keywords: ['邮件', '信件', '附件', 'mail'] },
  { id: 'page_dashboard', title: '数据驾驶舱', description: '游戏数据统计', category: 'page', icon: '📊', route: '/dashboard', keywords: ['数据', '统计', '驾驶舱', 'dashboard'] },
]

function buildSearchIndex(): SearchItem[] {
  const items: SearchItem[] = [...pageItems]

  achievements.forEach(ach => {
    const query: SearchRouteQuery = {}
    if (ach.category && ach.category !== 'hidden') {
      query.category = ach.category
    }
    query.id = ach.id
    items.push({
      id: `ach_${ach.id}`,
      title: ach.name,
      description: ach.description,
      category: 'achievement',
      icon: ach.icon,
      route: '/achievements',
      routeQuery: query,
      targetId: ach.id,
      keywords: [ach.name, ach.description, ach.category, ach.rarity, '成就'],
      rarity: ach.rarity,
    })
  })

  const shopItems = getInitialShopItems()
  shopItems.forEach(item => {
    items.push({
      id: `item_${item.id}`,
      title: item.name,
      description: item.description,
      category: 'item',
      icon: item.icon,
      route: '/shop',
      routeQuery: {
        tab: 'shop',
        category: item.category,
        id: item.id,
      },
      targetId: item.id,
      keywords: [item.name, item.description, item.category, item.rarity, '道具', '商品'],
      rarity: item.rarity,
    })
  })

  const characters = getAllCharacters()
  characters.forEach(char => {
    items.push({
      id: `char_${char.id}`,
      title: char.name,
      description: char.title,
      category: 'character',
      icon: char.icon || '🎭',
      route: '/character',
      routeQuery: {
        character: char.id,
      },
      targetId: char.id,
      keywords: [char.name, char.title, '角色'],
    })
  })

  dungeons.forEach(dg => {
    items.push({
      id: `dgn_${dg.id}`,
      title: dg.name,
      description: dg.description,
      category: 'dungeon',
      icon: '⚔️',
      route: '/dungeon',
      routeQuery: {
        tab: 'list',
        dungeon: dg.id,
      },
      targetId: dg.id,
      keywords: [dg.name, dg.description, '副本', '挑战'],
    })
  })

  try {
    const seasonStore = useSeasonStore()
    if (seasonStore.currentSeason) {
      const tasks = getTasksBySeasonId(seasonStore.currentSeason.id)
      tasks.forEach(task => {
        let tab = 'tasks'
        if (task.type === 'weekly') tab = 'weekly_tasks'
        if (task.type === 'growth') tab = 'growth_tasks'
        items.push({
          id: `task_${task.id}`,
          title: task.title,
          description: task.description,
          category: 'task',
          icon: '📋',
          route: '/season',
          routeQuery: {
            tab,
            id: task.id,
          },
          targetId: task.id,
          keywords: [task.title, task.description, task.type, '任务'],
        })
      })
    }
  } catch {}

  return items
}

function matchScore(item: SearchItem, query: string): number {
  const q = query.toLowerCase().trim()
  if (!q) return 0

  if (item.title.toLowerCase().includes(q)) return 100
  if (item.title.toLowerCase().startsWith(q)) return 95

  for (const kw of item.keywords) {
    if (kw.toLowerCase() === q) return 90
    if (kw.toLowerCase().startsWith(q)) return 80
    if (kw.toLowerCase().includes(q)) return 70
  }

  if (item.description.toLowerCase().includes(q)) return 50

  return 0
}

export const useSearchStore = defineStore('search', () => {
  const isOpen = ref(false)
  const query = ref('')
  const searchIndex = ref<SearchItem[]>([])
  const selectedIndex = ref(0)
  const searchHistory = ref<string[]>([])
  const navigationTick = ref(0)

  const categorizedResults = computed(() => {
    const q = query.value.trim()
    if (!q) return []

    const scored = searchIndex.value
      .map(item => ({ item, score: matchScore(item, q) }))
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)

    const groups = new Map<SearchCategory, SearchItem[]>()
    for (const { item } of scored) {
      if (!groups.has(item.category)) {
        groups.set(item.category, [])
      }
      groups.get(item.category)!.push(item)
    }

    const result: { category: SearchCategory; label: string; color: string; bgColor: string; items: SearchItem[] }[] = []
    for (const cat of categoryOrder) {
      const catItems = groups.get(cat)
      if (catItems && catItems.length > 0) {
        result.push({
          category: cat,
          label: categoryLabels[cat],
          color: categoryColors[cat],
          bgColor: categoryBgColors[cat],
          items: catItems.slice(0, 8),
        })
      }
    }

    return result
  })

  const totalResultCount = computed(() => {
    return categorizedResults.value.reduce((sum, g) => sum + g.items.length, 0)
  })

  const flatResults = computed(() => {
    const flat: SearchItem[] = []
    for (const group of categorizedResults.value) {
      flat.push(...group.items)
    }
    return flat
  })

  const suggestions = computed(() => {
    const q = query.value.trim().toLowerCase()
    if (!q) return []

    const matchedKeywords = new Set<string>()
    for (const item of searchIndex.value) {
      for (const kw of item.keywords) {
        if (kw.toLowerCase().startsWith(q) && kw.toLowerCase() !== q) {
          matchedKeywords.add(kw)
          if (matchedKeywords.size >= 6) break
        }
      }
      if (matchedKeywords.size >= 6) break
    }
    return Array.from(matchedKeywords)
  })

  function buildIndex() {
    searchIndex.value = buildSearchIndex()
  }

  function openSearch() {
    isOpen.value = true
    query.value = ''
    selectedIndex.value = 0
    if (searchIndex.value.length === 0) {
      buildIndex()
    }
  }

  function closeSearch() {
    isOpen.value = false
    query.value = ''
    selectedIndex.value = 0
  }

  function toggleSearch() {
    if (isOpen.value) {
      closeSearch()
    } else {
      openSearch()
    }
  }

  function addToHistory(term: string) {
    const trimmed = term.trim()
    if (!trimmed) return
    searchHistory.value = [trimmed, ...searchHistory.value.filter(h => h !== trimmed)].slice(0, MAX_HISTORY)
    saveHistory()
  }

  function clearHistory() {
    searchHistory.value = []
    saveHistory()
  }

  function removeHistoryItem(term: string) {
    searchHistory.value = searchHistory.value.filter(h => h !== term)
    saveHistory()
  }

  function loadHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY)
      if (raw) {
        searchHistory.value = JSON.parse(raw)
      }
    } catch {}
  }

  function saveHistory() {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(searchHistory.value))
    } catch {}
  }

  function moveSelection(delta: number) {
    const total = flatResults.value.length
    if (total === 0) return
    selectedIndex.value = ((selectedIndex.value + delta) % total + total) % total
  }

  function resetSelection() {
    selectedIndex.value = 0
  }

  return {
    isOpen,
    query,
    searchIndex,
    selectedIndex,
    searchHistory,
    navigationTick,
    categorizedResults,
    totalResultCount,
    flatResults,
    suggestions,
    categoryLabels,
    categoryOrder,
    categoryColors,
    categoryBgColors,
    buildIndex,
    openSearch,
    closeSearch,
    toggleSearch,
    addToHistory,
    clearHistory,
    removeHistoryItem,
    loadHistory,
    moveSelection,
    resetSelection,
  }
})
