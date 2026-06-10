import type {
  SeasonReward,
  RankRewardTier,
  LeaderboardEntry,
  Region,
  LeaderboardRewardType,
  LeaderboardRewardConfig,
  PlayerSeason,
} from '@/types/season'

export interface PlayerSeasonProfile {
  playerId: string
  playerName: string
  playerAvatar: string
  regionId: string
  regionName: string
  playerSeason: PlayerSeason
}

function createPlayerSeason(
  playerId: string,
  level: number,
  totalExp: number,
  rankScore: number
): PlayerSeason {
  const seasonId = 'season_001'
  let exp = 0
  let prevLevelExp = 0
  for (let l = 1; l < level; l++) {
    prevLevelExp += Math.floor(100 * Math.pow(l, 1.5))
  }
  exp = totalExp - prevLevelExp
  if (exp < 0) exp = 0
  return {
    id: `ps_${playerId}`,
    playerId,
    seasonId,
    level,
    exp,
    totalExp,
    rankScore,
    joinedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    lastResetDaily: Date.now() - 3600 * 1000,
    lastResetWeekly: Date.now() - 3600 * 1000,
  }
}

export const playerSeasonProfiles: PlayerSeasonProfile[] = [
  {
    playerId: 'player_001',
    playerName: '守夜人老张',
    playerAvatar: '👴',
    regionId: 'region_001',
    regionName: '华东区',
    playerSeason: createPlayerSeason('player_001', 15, 12450, 25653),
  },
  {
    playerId: 'player_002',
    playerName: '遗物猎人小李',
    playerAvatar: '🧑',
    regionId: 'region_002',
    regionName: '华北区',
    playerSeason: createPlayerSeason('player_002', 8, 4560, 13384),
  },
  {
    playerId: 'player_003',
    playerName: '殡仪馆学徒',
    playerAvatar: '👧',
    regionId: 'region_003',
    regionName: '华南区',
    playerSeason: createPlayerSeason('player_003', 22, 35680, 29042),
  },
  {
    playerId: 'player_004',
    playerName: '午夜来客',
    playerAvatar: '🕵️',
    regionId: 'region_001',
    regionName: '华东区',
    playerSeason: createPlayerSeason('player_004', 30, 68900, 38721),
  },
  {
    playerId: 'player_005',
    playerName: '安静的守护者',
    playerAvatar: '🧙',
    regionId: 'region_004',
    regionName: '西南区',
    playerSeason: createPlayerSeason('player_005', 12, 8230, 21739),
  },
  {
    playerId: 'player_006',
    playerName: '追忆者',
    playerAvatar: '👩',
    regionId: 'region_002',
    regionName: '华北区',
    playerSeason: createPlayerSeason('player_006', 5, 1250, 8760),
  },
  {
    playerId: 'player_007',
    playerName: '灵魂摆渡人',
    playerAvatar: '🧔',
    regionId: 'region_005',
    regionName: '华中区',
    playerSeason: createPlayerSeason('player_007', 45, 156800, 52430),
  },
  {
    playerId: 'player_008',
    playerName: '新来的助手',
    playerAvatar: '🧒',
    regionId: 'region_003',
    regionName: '华南区',
    playerSeason: createPlayerSeason('player_008', 3, 680, 5420),
  },
  {
    playerId: 'player_009',
    playerName: '幽冥渡者',
    playerAvatar: '👻',
    regionId: 'region_001',
    regionName: '华东区',
    playerSeason: createPlayerSeason('player_009', 48, 172300, 58900),
  },
  {
    playerId: 'player_010',
    playerName: '暗夜猎手',
    playerAvatar: '🦇',
    regionId: 'region_001',
    regionName: '华东区',
    playerSeason: createPlayerSeason('player_010', 42, 135600, 45280),
  },
  {
    playerId: 'player_011',
    playerName: '灵魂收割者',
    playerAvatar: '💀',
    regionId: 'region_002',
    regionName: '华北区',
    playerSeason: createPlayerSeason('player_011', 40, 125400, 42100),
  },
  {
    playerId: 'player_012',
    playerName: '月下独行者',
    playerAvatar: '🌙',
    regionId: 'region_001',
    regionName: '华东区',
    playerSeason: createPlayerSeason('player_012', 35, 98700, 35680),
  },
  {
    playerId: 'player_013',
    playerName: '彼岸花盛开',
    playerAvatar: '🌸',
    regionId: 'region_003',
    regionName: '华南区',
    playerSeason: createPlayerSeason('player_013', 32, 86200, 31250),
  },
  {
    playerId: 'player_014',
    playerName: '黄泉引路人',
    playerAvatar: '🔥',
    regionId: 'region_002',
    regionName: '华北区',
    playerSeason: createPlayerSeason('player_014', 28, 72300, 28430),
  },
  {
    playerId: 'player_015',
    playerName: '忘川摆渡人',
    playerAvatar: '⛵',
    regionId: 'region_004',
    regionName: '西南区',
    playerSeason: createPlayerSeason('player_015', 25, 58900, 24560),
  },
]

export function getPlayerSeasonProfile(playerId: string): PlayerSeasonProfile | undefined {
  return playerSeasonProfiles.find((p) => p.playerId === playerId)
}

export function getPlayerRankScore(playerId: string): number {
  const profile = getPlayerSeasonProfile(playerId)
  return profile ? profile.playerSeason.rankScore : 0
}

export const globalRankRewardTiers: RankRewardTier[] = [
  { minRank: 1, maxRank: 1, rewardId: 'reward_rank_global_1', tierName: '全服至尊' },
  { minRank: 2, maxRank: 2, rewardId: 'reward_rank_global_2', tierName: '全服荣耀' },
  { minRank: 3, maxRank: 3, rewardId: 'reward_rank_global_3', tierName: '全服璀璨' },
  { minRank: 4, maxRank: 10, rewardId: 'reward_rank_global_4_10', tierName: '全服铂金' },
  { minRank: 11, maxRank: 50, rewardId: 'reward_rank_global_11_50', tierName: '全服黄金' },
  { minRank: 51, maxRank: 100, rewardId: 'reward_rank_global_51_100', tierName: '全服白银' },
  { minRank: 101, rewardId: 'reward_rank_global_101_plus', tierName: '全服青铜' },
]

export const regionRankRewardTiers: RankRewardTier[] = [
  { minRank: 1, maxRank: 1, rewardId: 'reward_rank_region_1', tierName: '分区霸主' },
  { minRank: 2, maxRank: 3, rewardId: 'reward_rank_region_2_3', tierName: '分区精英' },
  { minRank: 4, maxRank: 10, rewardId: 'reward_rank_region_4_10', tierName: '分区铂金' },
  { minRank: 11, maxRank: 30, rewardId: 'reward_rank_region_11_30', tierName: '分区黄金' },
  { minRank: 31, rewardId: 'reward_rank_region_31_plus', tierName: '分区白银' },
]

export const friendRankRewardTiers: RankRewardTier[] = [
  { minRank: 1, maxRank: 1, rewardId: 'reward_rank_friend_1', tierName: '好友之王' },
  { minRank: 2, maxRank: 3, rewardId: 'reward_rank_friend_2_3', tierName: '好友精英' },
  { minRank: 4, maxRank: 5, rewardId: 'reward_rank_friend_4_5', tierName: '好友黄金' },
  { minRank: 6, rewardId: 'reward_rank_friend_6_plus', tierName: '好友白银' },
]

export const rankRewardTiers = globalRankRewardTiers

export const leaderboardRewardConfigs: Record<LeaderboardRewardType, LeaderboardRewardConfig> = {
  global: {
    type: 'global',
    tiers: globalRankRewardTiers,
    name: '全服榜奖励',
  },
  region: {
    type: 'region',
    tiers: regionRankRewardTiers,
    name: '分区榜奖励',
  },
  friend: {
    type: 'friend',
    tiers: friendRankRewardTiers,
    name: '好友榜奖励',
  },
}

export const rankRewards = [
  { rank: 1, name: '至尊王者', reward: '10000金钱 + 传说称号' },
  { rank: 2, name: '荣耀大师', reward: '5000金钱 + 史诗称号' },
  { rank: 3, name: '璀璨钻石', reward: '3000金钱 + 史诗徽章' },
  { rank: '4-10', name: '尊贵铂金', reward: '2000金钱 + 稀有徽章' },
  { rank: '11-50', name: '坚韧黄金', reward: '1000金钱 + 稀有道具' },
  { rank: '51-100', name: '不屈白银', reward: '500金钱' },
  { rank: '101+', name: '英勇青铜', reward: '200金钱' },
]

export const seasonRewards: SeasonReward[] = [
  {
    id: 'reward_level_1',
    seasonId: 'season_001',
    type: 'currency',
    level: 1,
    name: '启动资金',
    description: '赛季初始奖励',
    icon: 'Coins',
    rarity: 'common',
    value: 500,
    isFree: true,
  },
  {
    id: 'reward_level_5',
    seasonId: 'season_001',
    type: 'item',
    level: 5,
    name: '净化符咒',
    description: '一次性完美净化道具',
    icon: 'Scroll',
    rarity: 'uncommon',
    value: 'purify_talisman',
    isFree: true,
  },
  {
    id: 'reward_level_10',
    seasonId: 'season_001',
    type: 'badge',
    level: 10,
    name: '见习净化师',
    description: '赛季等级10徽章',
    icon: 'Award',
    rarity: 'uncommon',
    value: 'badge_apprentice',
    isFree: true,
  },
  {
    id: 'reward_level_15',
    seasonId: 'season_001',
    type: 'currency',
    level: 15,
    name: '勤勉奖励',
    description: '继续努力！',
    icon: 'Coins',
    rarity: 'uncommon',
    value: 2000,
    isFree: true,
  },
  {
    id: 'reward_level_20',
    seasonId: 'season_001',
    type: 'title',
    level: 20,
    name: '渡灵人',
    description: '赛季限定称号',
    icon: 'Crown',
    rarity: 'rare',
    value: 'title_soul_guide',
    isFree: true,
  },
  {
    id: 'reward_level_25',
    seasonId: 'season_001',
    type: 'item',
    level: 25,
    name: '高级净化符咒',
    description: '完美净化任意遗物',
    icon: 'ScrollText',
    rarity: 'rare',
    value: 'purify_talisman_advanced',
    isFree: true,
  },
  {
    id: 'reward_level_30',
    seasonId: 'season_001',
    type: 'badge',
    level: 30,
    name: '资深净化师',
    description: '赛季等级30徽章',
    icon: 'Medal',
    rarity: 'rare',
    value: 'badge_senior',
    isFree: true,
  },
  {
    id: 'reward_level_35',
    seasonId: 'season_001',
    type: 'currency',
    level: 35,
    name: '精英奖励',
    description: '你是真正的精英！',
    icon: 'Coins',
    rarity: 'rare',
    value: 5000,
    isFree: true,
  },
  {
    id: 'reward_level_40',
    seasonId: 'season_001',
    type: 'cosmetic',
    level: 40,
    name: '幽冥工作台',
    description: '工作台外观皮肤',
    icon: 'Palette',
    rarity: 'epic',
    value: 'skin_ghost_workbench',
    isFree: true,
  },
  {
    id: 'reward_level_45',
    seasonId: 'season_001',
    type: 'title',
    level: 45,
    name: '幽冥行者',
    description: '赛季限定传说称号',
    icon: 'Sparkles',
    rarity: 'epic',
    value: 'title_ghost_walker',
    isFree: true,
  },
  {
    id: 'reward_level_50',
    seasonId: 'season_001',
    type: 'badge',
    level: 50,
    name: '传奇净化师',
    description: '赛季满级纪念徽章',
    icon: 'Trophy',
    rarity: 'legendary',
    value: 'badge_legendary',
    isFree: true,
  },
  {
    id: 'reward_title_001',
    seasonId: 'season_001',
    type: 'title',
    level: 0,
    name: '渡灵行者',
    description: '完成"渡灵行者"挑战获得',
    icon: 'Crown',
    rarity: 'epic',
    value: 'title_soul_walker',
    isFree: true,
  },
  {
    id: 'reward_badge_001',
    seasonId: 'season_001',
    type: 'badge',
    level: 0,
    name: '传奇商人',
    description: '完成"传奇商人"挑战获得',
    icon: 'Star',
    rarity: 'epic',
    value: 'badge_legendary_merchant',
    isFree: true,
  },
  {
    id: 'reward_cosmetic_001',
    seasonId: 'season_001',
    type: 'cosmetic',
    level: 0,
    name: '永恒之夜',
    description: '完成"长生不死"挑战获得',
    icon: 'Moon',
    rarity: 'legendary',
    value: 'skin_eternal_night',
    isFree: true,
  },
  {
    id: 'reward_item_001',
    seasonId: 'season_001',
    type: 'item',
    level: 0,
    name: '神秘宝箱',
    description: '完成"富可敌国"挑战获得',
    icon: 'Gift',
    rarity: 'legendary',
    value: 'mystery_box',
    isFree: true,
  },
  {
    id: 'reward_rank_1',
    seasonId: 'season_001',
    type: 'title',
    level: 0,
    rank: 1,
    name: '至尊王者',
    description: '赛季排行榜第1名奖励',
    icon: 'Crown',
    rarity: 'legendary',
    value: 'title_rank_1',
    isFree: true,
  },
  {
    id: 'reward_rank_2',
    seasonId: 'season_001',
    type: 'title',
    level: 0,
    rank: 2,
    name: '荣耀大师',
    description: '赛季排行榜第2名奖励',
    icon: 'Medal',
    rarity: 'epic',
    value: 'title_rank_2',
    isFree: true,
  },
  {
    id: 'reward_rank_3',
    seasonId: 'season_001',
    type: 'badge',
    level: 0,
    rank: 3,
    name: '璀璨钻石',
    description: '赛季排行榜第3名奖励',
    icon: 'Award',
    rarity: 'epic',
    value: 'badge_rank_3',
    isFree: true,
  },
  {
    id: 'reward_rank_4_10',
    seasonId: 'season_001',
    type: 'badge',
    level: 0,
    rank: 10,
    name: '尊贵铂金',
    description: '赛季排行榜4-10名奖励',
    icon: 'Star',
    rarity: 'rare',
    value: 'badge_rank_4_10',
    isFree: true,
  },
  {
    id: 'reward_rank_11_50',
    seasonId: 'season_001',
    type: 'item',
    level: 0,
    rank: 50,
    name: '坚韧黄金',
    description: '赛季排行榜11-50名奖励',
    icon: 'Gift',
    rarity: 'rare',
    value: 'item_rank_11_50',
    isFree: true,
  },
  {
    id: 'reward_rank_51_100',
    seasonId: 'season_001',
    type: 'currency',
    level: 0,
    rank: 100,
    name: '不屈白银',
    description: '赛季排行榜51-100名奖励',
    icon: 'Coins',
    rarity: 'uncommon',
    value: 500,
    isFree: true,
  },
  {
    id: 'reward_rank_global_1',
    seasonId: 'season_001',
    type: 'title',
    level: 0,
    rank: 1,
    name: '全服至尊',
    description: '全服排行榜第1名奖励',
    icon: 'Crown',
    rarity: 'legendary',
    value: 'title_global_1',
    isFree: true,
  },
  {
    id: 'reward_rank_global_2',
    seasonId: 'season_001',
    type: 'title',
    level: 0,
    rank: 2,
    name: '全服荣耀',
    description: '全服排行榜第2名奖励',
    icon: 'Medal',
    rarity: 'epic',
    value: 'title_global_2',
    isFree: true,
  },
  {
    id: 'reward_rank_global_3',
    seasonId: 'season_001',
    type: 'badge',
    level: 0,
    rank: 3,
    name: '全服璀璨',
    description: '全服排行榜第3名奖励',
    icon: 'Award',
    rarity: 'epic',
    value: 'badge_global_3',
    isFree: true,
  },
  {
    id: 'reward_rank_global_4_10',
    seasonId: 'season_001',
    type: 'badge',
    level: 0,
    rank: 10,
    name: '全服铂金',
    description: '全服排行榜4-10名奖励',
    icon: 'Star',
    rarity: 'rare',
    value: 'badge_global_4_10',
    isFree: true,
  },
  {
    id: 'reward_rank_global_11_50',
    seasonId: 'season_001',
    type: 'item',
    level: 0,
    rank: 50,
    name: '全服黄金',
    description: '全服排行榜11-50名奖励',
    icon: 'Gift',
    rarity: 'rare',
    value: 'item_global_11_50',
    isFree: true,
  },
  {
    id: 'reward_rank_global_51_100',
    seasonId: 'season_001',
    type: 'currency',
    level: 0,
    rank: 100,
    name: '全服白银',
    description: '全服排行榜51-100名奖励',
    icon: 'Coins',
    rarity: 'uncommon',
    value: 1000,
    isFree: true,
  },
  {
    id: 'reward_rank_global_101_plus',
    seasonId: 'season_001',
    type: 'currency',
    level: 0,
    rank: 999,
    name: '全服青铜',
    description: '全服排行榜101名及以后奖励',
    icon: 'Coins',
    rarity: 'common',
    value: 500,
    isFree: true,
  },
  {
    id: 'reward_rank_region_1',
    seasonId: 'season_001',
    type: 'title',
    level: 0,
    rank: 1,
    name: '分区霸主',
    description: '分区排行榜第1名奖励',
    icon: 'Crown',
    rarity: 'epic',
    value: 'title_region_1',
    isFree: true,
  },
  {
    id: 'reward_rank_region_2_3',
    seasonId: 'season_001',
    type: 'badge',
    level: 0,
    rank: 3,
    name: '分区精英',
    description: '分区排行榜2-3名奖励',
    icon: 'Award',
    rarity: 'rare',
    value: 'badge_region_2_3',
    isFree: true,
  },
  {
    id: 'reward_rank_region_4_10',
    seasonId: 'season_001',
    type: 'badge',
    level: 0,
    rank: 10,
    name: '分区铂金',
    description: '分区排行榜4-10名奖励',
    icon: 'Star',
    rarity: 'rare',
    value: 'badge_region_4_10',
    isFree: true,
  },
  {
    id: 'reward_rank_region_11_30',
    seasonId: 'season_001',
    type: 'item',
    level: 0,
    rank: 30,
    name: '分区黄金',
    description: '分区排行榜11-30名奖励',
    icon: 'Gift',
    rarity: 'uncommon',
    value: 'item_region_11_30',
    isFree: true,
  },
  {
    id: 'reward_rank_region_31_plus',
    seasonId: 'season_001',
    type: 'currency',
    level: 0,
    rank: 999,
    name: '分区白银',
    description: '分区排行榜31名及以后奖励',
    icon: 'Coins',
    rarity: 'common',
    value: 300,
    isFree: true,
  },
  {
    id: 'reward_rank_friend_1',
    seasonId: 'season_001',
    type: 'title',
    level: 0,
    rank: 1,
    name: '好友之王',
    description: '好友排行榜第1名奖励',
    icon: 'Crown',
    rarity: 'rare',
    value: 'title_friend_1',
    isFree: true,
  },
  {
    id: 'reward_rank_friend_2_3',
    seasonId: 'season_001',
    type: 'badge',
    level: 0,
    rank: 3,
    name: '好友精英',
    description: '好友排行榜2-3名奖励',
    icon: 'Award',
    rarity: 'uncommon',
    value: 'badge_friend_2_3',
    isFree: true,
  },
  {
    id: 'reward_rank_friend_4_5',
    seasonId: 'season_001',
    type: 'item',
    level: 0,
    rank: 5,
    name: '好友黄金',
    description: '好友排行榜4-5名奖励',
    icon: 'Gift',
    rarity: 'uncommon',
    value: 'item_friend_4_5',
    isFree: true,
  },
  {
    id: 'reward_rank_friend_6_plus',
    seasonId: 'season_001',
    type: 'currency',
    level: 0,
    rank: 999,
    name: '好友白银',
    description: '好友排行榜6名及以后奖励',
    icon: 'Coins',
    rarity: 'common',
    value: 100,
    isFree: true,
  },
]

export function getRewardsBySeasonId(seasonId: string): SeasonReward[] {
  return seasonRewards.filter((r) => r.seasonId === seasonId && r.level > 0)
}

export function getRewardById(id: string): SeasonReward | undefined {
  return seasonRewards.find((r) => r.id === id)
}

export function getRewardsByLevel(
  seasonId: string,
  level: number
): SeasonReward[] {
  return seasonRewards.filter((r) => r.seasonId === seasonId && r.level <= level)
}

export const regions: Region[] = [
  { id: 'region_001', name: '华东区', code: 'east', serverName: '幽冥地府' },
  { id: 'region_002', name: '华北区', code: 'north', serverName: '黄泉路' },
  { id: 'region_003', name: '华南区', code: 'south', serverName: '奈何桥' },
  { id: 'region_004', name: '西南区', code: 'southwest', serverName: '三生石' },
  { id: 'region_005', name: '华中区', code: 'central', serverName: '望乡台' },
]

export function createLeaderboardEntryFromProfile(
  profile: PlayerSeasonProfile,
  previousRankMap: Map<string, number>,
  isFriend: boolean = false
): LeaderboardEntry {
  return {
    id: `entry_${profile.playerId}`,
    playerId: profile.playerId,
    seasonId: 'season_001',
    playerName: profile.playerName,
    playerAvatar: profile.playerAvatar,
    rank: 0,
    displayRank: 0,
    isTied: false,
    score: profile.playerSeason.rankScore,
    previousRank: previousRankMap.get(profile.playerId) || 0,
    regionId: profile.regionId,
    regionName: profile.regionName,
    isFriend,
    updatedAt: Date.now(),
  }
}

export function buildPreviousRankMap(profiles: PlayerSeasonProfile[]): Map<string, number> {
  const sorted = [...profiles].sort(
    (a, b) =>
      b.playerSeason.rankScore - a.playerSeason.rankScore ||
      b.playerSeason.totalExp - a.playerSeason.totalExp
  )
  const map = new Map<string, number>()
  sorted.forEach((profile, index) => {
    const offset = (index % 3) - 1
    const prevRank = Math.max(1, Math.min(sorted.length, index + 1 + offset))
    map.set(profile.playerId, prevRank)
  })
  return map
}

export function buildGlobalLeaderboard(): LeaderboardEntry[] {
  const sortedProfiles = [...playerSeasonProfiles].sort(
    (a, b) =>
      b.playerSeason.rankScore - a.playerSeason.rankScore ||
      b.playerSeason.totalExp - a.playerSeason.totalExp
  )
  const previousRankMap = buildPreviousRankMap(playerSeasonProfiles)
  return sortedProfiles.map((profile) =>
    createLeaderboardEntryFromProfile(profile, previousRankMap, false)
  )
}

export const mockLeaderboard = buildGlobalLeaderboard()

export function calculateTiedRanks(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  const sorted = [...entries].sort((a, b) => b.score - a.score)
  const result: LeaderboardEntry[] = []
  let actualRank = 1

  for (let i = 0; i < sorted.length; i++) {
    const current = { ...sorted[i] }
    if (i > 0 && sorted[i].score === sorted[i - 1].score) {
      current.isTied = true
      current.displayRank = result[i - 1].displayRank
    } else {
      current.isTied = false
      current.displayRank = actualRank
    }
    current.rank = actualRank
    result.push(current)
    actualRank++
  }

  result.forEach((entry) => {
    if (entry.isTied) {
      entry.tieCount = result.filter((e) => e.displayRank === entry.displayRank).length
    }
  })

  return result
}

export function getRandomRegion(): Region {
  return regions[Math.floor(Math.random() * regions.length)]
}

export function getRegionById(id: string): Region | undefined {
  return regions.find((r) => r.id === id)
}

export function getRankRewardTier(rank: number, type: LeaderboardRewardType = 'global'): RankRewardTier | undefined {
  const tiers = leaderboardRewardConfigs[type].tiers
  return tiers.find((t) => {
    if (t.maxRank !== undefined) {
      return rank >= t.minRank && rank <= t.maxRank
    }
    return rank >= t.minRank
  })
}

export function getRankRewardId(rank: number, type: LeaderboardRewardType = 'global'): string | null {
  const tier = getRankRewardTier(rank, type)
  return tier ? tier.rewardId : null
}

export function getRankTierName(rank: number, type: LeaderboardRewardType = 'global'): string | null {
  const tier = getRankRewardTier(rank, type)
  return tier ? tier.tierName : null
}
