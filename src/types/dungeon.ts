export type DungeonDifficulty = 'normal' | 'hard' | 'hell'

export type DungeonStatus = 'locked' | 'unlocked' | 'in_progress' | 'cleared'

export type StageStatus = 'locked' | 'available' | 'in_progress' | 'cleared' | 'perfect'

export type UnlockConditionType =
  | 'stage_cleared'
  | 'player_level'
  | 'reputation'
  | 'item_owned'
  | 'dungeon_cleared'
  | 'stage_count'

export type BattleResult = 'victory' | 'defeat' | 'retreat'

export type StarRating = 0 | 1 | 2 | 3

export type DropRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export interface UnlockCondition {
  type: UnlockConditionType
  params: Record<string, any>
  description: string
}

export interface Enemy {
  id: string
  name: string
  icon: string
  hp: number
  attack: number
  defense: number
  speed: number
  skills: EnemySkill[]
}

export interface EnemySkill {
  id: string
  name: string
  damage: number
  description: string
  cooldown: number
  currentCooldown: number
}

export interface DropItem {
  id: string
  name: string
  icon: string
  rarity: DropRarity
  dropRate: number
  minQuantity: number
  maxQuantity: number
  isGuaranteed: boolean
  description: string
}

export interface DungeonStage {
  id: string
  dungeonId: string
  order: number
  name: string
  description: string
  icon: string
  difficulty: DungeonDifficulty
  unlockConditions: UnlockCondition[]
  enemies: Enemy[]
  drops: DropItem[]
  staminaCost: number
  recommendedPower: number
  timeLimit: number
  bossId?: string
}

export interface Dungeon {
  id: string
  name: string
  description: string
  icon: string
  theme: string
  background: string
  difficulty: DungeonDifficulty
  stages: DungeonStage[]
  unlockConditions: UnlockCondition[]
  dailyResetLimit: number
  firstClearBonus: number
}

export interface BattleEvent {
  turn: number
  timestamp: number
  actor: 'player' | 'enemy'
  action: string
  damage: number
  targetId: string
  targetName: string
  remainingHp: number
  description: string
}

export interface BattleRecord {
  id: string
  dungeonId: string
  stageId: string
  result: BattleResult
  starRating: StarRating
  events: BattleEvent[]
  playerHp: number
  playerMaxHp: number
  totalDamageDealt: number
  totalDamageTaken: number
  turnsElapsed: number
  duration: number
  completedAt: number
}

export interface BattleReward {
  id: string
  itemId: string
  itemName: string
  itemIcon: string
  rarity: DropRarity
  quantity: number
  isGuaranteed: boolean
}

export interface StageProgress {
  stageId: string
  dungeonId: string
  status: StageStatus
  bestStarRating: StarRating
  clearCount: number
  todayClearCount: number
  firstClearAt?: number
  lastClearAt?: number
  lastBattleRecord?: BattleRecord
}

export interface DungeonProgress {
  dungeonId: string
  status: DungeonStatus
  stageProgresses: StageProgress[]
  totalClearCount: number
  todayClearCount: number
  lastResetDate: string
}

export interface ReplayAnalysis {
  stageId: string
  dungeonId: string
  battleRecord: BattleRecord
  deathTurn: number
  totalDamageTaken: number
  avgDamagePerTurn: number
  criticalMoments: BattleEvent[]
  suggestions: string[]
  enemyBreakdown: {
    enemyId: string
    enemyName: string
    damageTaken: number
    damageDealt: number
  }[]
}

export interface DungeonSaveData {
  version: string
  timestamp: number
  dungeonProgresses: DungeonProgress[]
  battleHistory: BattleRecord[]
}
