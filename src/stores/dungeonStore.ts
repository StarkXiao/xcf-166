import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  DungeonProgress,
  StageProgress,
  BattleRecord,
  BattleReward,
  BattleEvent,
  ReplayAnalysis,
  StarRating,
  BattleResult,
  DungeonSaveData,
} from '@/types/dungeon'
import { dungeons, getDungeonById, getStageById } from '@/game/data/dungeons'
import { useGameStore } from './gameStore'
import { useMailStore } from './mailStore'

const STORAGE_KEY = 'dungeon_center_data'

function generateId(): string {
  return 'dgn_' + Math.random().toString(36).substr(2, 9)
}

export const useDungeonStore = defineStore('dungeon', () => {
  const dungeonProgresses = ref<DungeonProgress[]>([])
  const battleHistory = ref<BattleRecord[]>([])
  const currentBattleStageId = ref<string | null>(null)
  const currentBattleDungeonId = ref<string | null>(null)
  const isBattleInProgress = ref(false)

  const totalClearCount = computed(() =>
    dungeonProgresses.value.reduce((sum, dp) => sum + dp.totalClearCount, 0)
  )

  const totalDungeonsCleared = computed(() =>
    dungeonProgresses.value.filter((dp) => dp.status === 'cleared').length
  )

  const totalStarsEarned = computed(() => {
    let total = 0
    dungeonProgresses.value.forEach((dp) => {
      dp.stageProgresses.forEach((sp) => {
        total += sp.bestStarRating
      })
    })
    return total
  })

  const maxStarsPossible = computed(() => {
    let total = 0
    dungeons.forEach((d) => {
      total += d.stages.length * 3
    })
    return total
  })

  function getDungeonProgress(dungeonId: string): DungeonProgress | undefined {
    return dungeonProgresses.value.find((dp) => dp.dungeonId === dungeonId)
  }

  function getStageProgress(stageId: string): StageProgress | undefined {
    for (const dp of dungeonProgresses.value) {
      const sp = dp.stageProgresses.find((s) => s.stageId === stageId)
      if (sp) return sp
    }
    return undefined
  }

  function isDungeonUnlocked(dungeonId: string): boolean {
    const dungeon = getDungeonById(dungeonId)
    if (!dungeon) return false
    if (dungeon.unlockConditions.length === 0) return true
    return dungeon.unlockConditions.every((condition) => checkUnlockCondition(condition))
  }

  function isStageUnlocked(dungeonId: string, stageId: string): boolean {
    const stage = getStageById(dungeonId, stageId)
    if (!stage) return false
    if (!isDungeonUnlocked(dungeonId)) return false
    if (stage.unlockConditions.length === 0) return true
    return stage.unlockConditions.every((condition) => checkUnlockCondition(condition))
  }

  function checkUnlockCondition(condition: { type: string; params: Record<string, any> }): boolean {
    switch (condition.type) {
      case 'stage_cleared': {
        const sp = getStageProgress(condition.params.stageId)
        return sp !== undefined && (sp.status === 'cleared' || sp.status === 'perfect')
      }
      case 'dungeon_cleared': {
        const dp = getDungeonProgress(condition.params.dungeonId)
        return dp !== undefined && dp.status === 'cleared'
      }
      case 'player_level': {
        const gameStore = useGameStore()
        return gameStore.stats.day >= condition.params.level
      }
      case 'reputation': {
        const gameStore = useGameStore()
        return gameStore.stats.reputation >= condition.params.minReputation
      }
      default:
        return true
    }
  }

  function getUnmetConditions(dungeonId: string, stageId?: string): string[] {
    const unmet: string[] = []
    const dungeon = getDungeonById(dungeonId)
    if (!dungeon) return ['副本不存在']

    if (!isDungeonUnlocked(dungeonId)) {
      dungeon.unlockConditions.forEach((c) => {
        if (!checkUnlockCondition(c)) unmet.push(c.description)
      })
      return unmet
    }

    if (stageId) {
      const stage = getStageById(dungeonId, stageId)
      if (!stage) return ['关卡不存在']
      stage.unlockConditions.forEach((c) => {
        if (!checkUnlockCondition(c)) unmet.push(c.description)
      })
    }
    return unmet
  }

  function ensureDungeonProgress(dungeonId: string): DungeonProgress {
    let dp = getDungeonProgress(dungeonId)
    if (dp) return dp

    const dungeon = getDungeonById(dungeonId)
    if (!dungeon) throw new Error('Dungeon not found')

    dp = {
      dungeonId,
      status: isDungeonUnlocked(dungeonId) ? 'unlocked' : 'locked',
      stageProgresses: dungeon.stages.map((stage) => ({
        stageId: stage.id,
        dungeonId,
        status: isStageUnlocked(dungeonId, stage.id) ? 'available' : 'locked',
        bestStarRating: 0 as StarRating,
        clearCount: 0,
        todayClearCount: 0,
        lastResetDate: new Date().toDateString(),
      })),
      totalClearCount: 0,
      todayClearCount: 0,
      lastResetDate: new Date().toDateString(),
    }
    dungeonProgresses.value.push(dp)
    saveToStorage()
    return dp
  }

  function initDungeon() {
    dungeons.forEach((d) => ensureDungeonProgress(d.id))
    loadFromStorage()
    checkDailyReset()
  }

  function checkDailyReset() {
    const today = new Date().toDateString()
    dungeonProgresses.value.forEach((dp) => {
      if (dp.lastResetDate !== today) {
        dp.todayClearCount = 0
        dp.stageProgresses.forEach((sp) => {
          sp.todayClearCount = 0
        })
        dp.lastResetDate = today
      }
    })
    saveToStorage()
  }

  function canChallengeStage(dungeonId: string, stageId: string): { canChallenge: boolean; reason?: string } {
    const dungeon = getDungeonById(dungeonId)
    if (!dungeon) return { canChallenge: false, reason: '副本不存在' }

    if (!isDungeonUnlocked(dungeonId)) return { canChallenge: false, reason: '副本未解锁' }
    if (!isStageUnlocked(dungeonId, stageId)) return { canChallenge: false, reason: '关卡未解锁' }

    const dp = getDungeonProgress(dungeonId)
    if (dp) {
      const sp = dp.stageProgresses.find((s) => s.stageId === stageId)
      if (sp && sp.todayClearCount >= dungeon.dailyResetLimit) {
        return { canChallenge: false, reason: `今日挑战次数已达上限(${dungeon.dailyResetLimit}次)` }
      }
    }

    if (isBattleInProgress.value) return { canChallenge: false, reason: '战斗进行中' }

    return { canChallenge: true }
  }

  function startBattle(dungeonId: string, stageId: string): boolean {
    const check = canChallengeStage(dungeonId, stageId)
    if (!check.canChallenge) return false

    currentBattleDungeonId.value = dungeonId
    currentBattleStageId.value = stageId
    isBattleInProgress.value = true

    const dp = getDungeonProgress(dungeonId)
    if (dp) {
      const sp = dp.stageProgresses.find((s) => s.stageId === stageId)
      if (sp) sp.status = 'in_progress'
    }

    return true
  }

  function simulateBattle(dungeonId: string, stageId: string): BattleRecord {
    const stage = getStageById(dungeonId, stageId)
    if (!stage) throw new Error('Stage not found')

    const gameStore = useGameStore()
    const playerHp = gameStore.stats.sanity
    const playerMaxHp = gameStore.stats.maxSanity
    const playerAttack = 15 + gameStore.stats.reputation * 0.3
    const playerDefense = 5 + gameStore.stats.totalOrdersCompleted * 0.5

    const events: BattleEvent[] = []
    let currentHp = playerHp
    let turn = 0
    const enemyHps = stage.enemies.map((e) => ({ ...e, currentHp: e.hp }))

    const totalEnemyHp = enemyHps.reduce((s, e) => s + e.currentHp, 0)
    const isWin = playerHp > totalEnemyHp * 0.3

    const maxTurns = Math.min(stage.timeLimit / 5, 20)
    let remainingEnemyHp = totalEnemyHp
    let totalDamageDealt = 0
    let totalDamageTaken = 0

    for (let i = 0; i < maxTurns && currentHp > 0 && remainingEnemyHp > 0; i++) {
      turn++
      const playerDmg = Math.max(1, Math.floor(playerAttack * (0.8 + Math.random() * 0.4) - enemyHps[0].defense * 0.3))
      remainingEnemyHp -= playerDmg
      totalDamageDealt += playerDmg
      events.push({
        turn,
        timestamp: Date.now() + i * 1000,
        actor: 'player',
        action: '攻击',
        damage: playerDmg,
        targetId: enemyHps[0].id,
        targetName: enemyHps[0].name,
        remainingHp: Math.max(0, remainingEnemyHp),
        description: `你对${enemyHps[0].name}造成了${playerDmg}点伤害`,
      })

      if (remainingEnemyHp <= 0) break

      for (const enemy of enemyHps) {
        if (enemy.currentHp <= 0) continue
        const enemyDmg = Math.max(1, Math.floor(enemy.attack * (0.8 + Math.random() * 0.4) - playerDefense * 0.3))
        currentHp -= enemyDmg
        totalDamageTaken += enemyDmg
        events.push({
          turn,
          timestamp: Date.now() + i * 1000 + 500,
          actor: 'enemy',
          action: enemy.skills[0]?.name || '攻击',
          damage: enemyDmg,
          targetId: 'player',
          targetName: '渡灵者',
          remainingHp: Math.max(0, currentHp),
          description: `${enemy.name}使用${enemy.skills[0]?.name || '攻击'}对你造成了${enemyDmg}点伤害`,
        })
        if (currentHp <= 0) break
      }
    }

    const result: BattleResult = currentHp > 0 && remainingEnemyHp <= 0 ? 'victory' : 'defeat'
    let starRating: StarRating = 0
    if (result === 'victory') {
      const hpPercent = currentHp / playerMaxHp
      if (hpPercent >= 0.8) starRating = 3
      else if (hpPercent >= 0.5) starRating = 2
      else starRating = 1
    }

    return {
      id: generateId(),
      dungeonId,
      stageId,
      result,
      starRating,
      events,
      playerHp: Math.max(0, currentHp),
      playerMaxHp,
      totalDamageDealt,
      totalDamageTaken,
      turnsElapsed: turn,
      duration: turn * 5 * 1000,
      completedAt: Date.now(),
    }
  }

  function calculateDrops(stageId: string, starRating: StarRating): BattleReward[] {
    const allStages = dungeons.flatMap((d) => d.stages)
    const stage = allStages.find((s) => s.id === stageId)
    if (!stage) return []

    const rewards: BattleReward[] = []
    const multiplier = starRating >= 3 ? 1.5 : starRating >= 2 ? 1.2 : 1.0

    stage.drops.forEach((drop) => {
      let shouldDrop = drop.isGuaranteed
      if (!shouldDrop) {
        shouldDrop = Math.random() < drop.dropRate * multiplier
      }

      if (shouldDrop) {
        const baseQuantity = drop.minQuantity + Math.floor(Math.random() * (drop.maxQuantity - drop.minQuantity + 1))
        const quantity = Math.max(1, Math.floor(baseQuantity * multiplier))
        rewards.push({
          id: generateId(),
          itemId: drop.id,
          itemName: drop.name,
          itemIcon: drop.icon,
          rarity: drop.rarity,
          quantity,
          isGuaranteed: drop.isGuaranteed,
        })
      }
    })

    return rewards
  }

  function completeBattle(record: BattleRecord): BattleReward[] {
    isBattleInProgress.value = false
    currentBattleDungeonId.value = null
    currentBattleStageId.value = null

    battleHistory.value.unshift(record)
    if (battleHistory.value.length > 100) {
      battleHistory.value = battleHistory.value.slice(0, 100)
    }

    const dp = getDungeonProgress(record.dungeonId)
    if (!dp) return []

    const sp = dp.stageProgresses.find((s) => s.stageId === record.stageId)
    if (!sp) return []

    const mailStore = useMailStore()
    const dungeon = getDungeonById(record.dungeonId)

    if (record.result === 'victory') {
      sp.clearCount++
      sp.todayClearCount++
      sp.lastClearAt = record.completedAt
      sp.lastBattleRecord = record

      if (!sp.firstClearAt) {
        sp.firstClearAt = record.completedAt
        if (dungeon) {
          mailStore.sendRewardMail({
            title: `首通奖励：${dungeon.name}`,
            sender: '副本系统',
            senderAvatar: '⚔️',
            content: `恭喜你首次通关「${dungeon.name}」！首通奖励 ${dungeon.firstClearBonus} 金币已发放，请及时领取。`,
            tag: '副本首通',
            source: `dungeon_first_clear_${record.dungeonId}`,
            attachments: [{
              type: 'currency',
              itemId: `dungeon_first_clear_${record.dungeonId}`,
              name: '首通奖金',
              icon: '🪙',
              rarity: 'rare',
              value: dungeon.firstClearBonus,
              count: 1,
            }],
          })
        }
      }

      if (record.starRating > sp.bestStarRating) {
        sp.bestStarRating = record.starRating
      }

      if (record.starRating === 3) {
        sp.status = 'perfect'
      } else {
        sp.status = 'cleared'
      }

      dp.totalClearCount++
      dp.todayClearCount++

      const allCleared = dp.stageProgresses.every((s) => s.status === 'cleared' || s.status === 'perfect')
      if (allCleared) {
        dp.status = 'cleared'
      } else {
        dp.status = 'in_progress'
      }

      const gameStore = useGameStore()
      gameStore.addReputation(record.starRating * 5)
    } else {
      sp.status = sp.clearCount > 0 ? (sp.bestStarRating === 3 ? 'perfect' : 'cleared') : 'available'
      sp.lastBattleRecord = record
    }

    const rewards = record.result === 'victory' ? calculateDrops(record.stageId, record.starRating) : []

    if (rewards.length > 0 && dungeon) {
      mailStore.sendRewardMail({
        title: `副本掉落：${dungeon.name}`,
        sender: '副本系统',
        senderAvatar: '⚔️',
        content: `你在「${dungeon.name}」中获得了 ${rewards.length} 件战利品，请及时领取。${record.starRating === 3 ? '\n🌟 完美通关！掉落已获得1.5倍加成！' : ''}`,
        tag: '副本掉落',
        source: `dungeon_drop_${record.stageId}`,
        attachments: rewards.map(r => ({
          type: 'item' as const,
          itemId: r.itemId,
          name: r.itemName,
          icon: r.itemIcon,
          rarity: r.rarity as any,
          value: r.quantity,
          count: r.quantity,
        })),
      })
    }

    if (dungeon) {
      const nextStages = dungeon.stages.filter(
        (s) => s.unlockConditions.some((c) => c.type === 'stage_cleared' && c.params.stageId === record.stageId)
      )
      nextStages.forEach((ns) => {
        const nsp = dp.stageProgresses.find((s) => s.stageId === ns.id)
        if (nsp && nsp.status === 'locked' && isStageUnlocked(record.dungeonId, ns.id)) {
          nsp.status = 'available'
        }
      })
    }

    saveToStorage()
    return rewards
  }

  function retreatBattle(): BattleRecord | null {
    if (!currentBattleDungeonId.value || !currentBattleStageId.value) return null

    const record: BattleRecord = {
      id: generateId(),
      dungeonId: currentBattleDungeonId.value,
      stageId: currentBattleStageId.value,
      result: 'retreat',
      starRating: 0,
      events: [],
      playerHp: 0,
      playerMaxHp: 0,
      totalDamageDealt: 0,
      totalDamageTaken: 0,
      turnsElapsed: 0,
      duration: 0,
      completedAt: Date.now(),
    }

    isBattleInProgress.value = false
    currentBattleDungeonId.value = null
    currentBattleStageId.value = null

    battleHistory.value.unshift(record)

    const dp = getDungeonProgress(record.dungeonId)
    if (dp) {
      const sp = dp.stageProgresses.find((s) => s.stageId === record.stageId)
      if (sp) {
        sp.status = sp.clearCount > 0 ? (sp.bestStarRating === 3 ? 'perfect' : 'cleared') : 'available'
      }
    }

    saveToStorage()
    return record
  }

  function analyzeDefeat(stageId: string, dungeonId: string): ReplayAnalysis | null {
    const dp = getDungeonProgress(dungeonId)
    if (!dp) return null

    const sp = dp.stageProgresses.find((s) => s.stageId === stageId)
    if (!sp || !sp.lastBattleRecord || sp.lastBattleRecord.result !== 'defeat') return null

    const record = sp.lastBattleRecord
    const deathTurn = record.events.filter((e) => e.actor === 'enemy').length
    const avgDamagePerTurn = record.totalDamageTaken / Math.max(1, record.turnsElapsed)

    const criticalMoments = record.events.filter((e) =>
      e.actor === 'enemy' && e.damage > avgDamagePerTurn * 1.5
    )

    const suggestions: string[] = []
    if (record.turnsElapsed < 3) {
      suggestions.push('战斗结束过快，考虑提升防御能力')
    }
    if (avgDamagePerTurn > 20) {
      suggestions.push('每回合承受伤害过高，建议提升防御属性')
    }
    if (record.playerHp / record.playerMaxHp < 0.2) {
      suggestions.push('血量过低，建议在进入副本前恢复理智值')
    }
    if (criticalMoments.length > 2) {
      suggestions.push('存在多个高伤害关键时刻，注意规避敌人的强力技能')
    }
    if (record.turnsElapsed > 8) {
      suggestions.push('战斗时间较长，考虑提升攻击力以快速击杀敌人')
    }

    const enemyDamageMap = new Map<string, { name: string; taken: number; dealt: number }>()
    record.events.forEach((e) => {
      if (e.actor === 'enemy') {
        const existing = enemyDamageMap.get(e.targetId) || { name: '', taken: 0, dealt: 0 }
        enemyDamageMap.set(e.targetId, { name: e.targetName || existing.name, taken: existing.taken, dealt: existing.dealt + e.damage })
      }
      if (e.actor === 'player') {
        const existing = enemyDamageMap.get(e.targetId)
        if (existing) {
          existing.dealt = existing.dealt + e.damage
          enemyDamageMap.set(e.targetId, existing)
        }
      }
    })

    const enemyBreakdown = Array.from(enemyDamageMap.entries()).map(([enemyId, data]) => ({
      enemyId,
      enemyName: data.name,
      damageTaken: data.taken,
      damageDealt: data.dealt,
    }))

    return {
      stageId,
      dungeonId,
      battleRecord: record,
      deathTurn,
      totalDamageTaken: record.totalDamageTaken,
      avgDamagePerTurn: Math.round(avgDamagePerTurn * 10) / 10,
      criticalMoments,
      suggestions,
      enemyBreakdown,
    }
  }

  function retryChallenge(dungeonId: string, stageId: string): boolean {
    const check = canChallengeStage(dungeonId, stageId)
    return check.canChallenge
  }

  function getRecentBattles(limit: number = 10): BattleRecord[] {
    return battleHistory.value.slice(0, limit)
  }

  function getDefeatRecords(): BattleRecord[] {
    return battleHistory.value.filter((r) => r.result === 'defeat')
  }

  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const data: DungeonSaveData = JSON.parse(raw)
      if (data.dungeonProgresses) {
        dungeonProgresses.value = data.dungeonProgresses
      }
      if (data.battleHistory) {
        battleHistory.value = data.battleHistory
      }
    } catch (e) {
      console.error('Failed to load dungeon data:', e)
    }
  }

  function saveToStorage() {
    try {
      const data: DungeonSaveData = {
        version: '1.0',
        timestamp: Date.now(),
        dungeonProgresses: dungeonProgresses.value,
        battleHistory: battleHistory.value,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (e) {
      console.error('Failed to save dungeon data:', e)
    }
  }

  return {
    dungeonProgresses,
    battleHistory,
    currentBattleStageId,
    currentBattleDungeonId,
    isBattleInProgress,
    totalClearCount,
    totalDungeonsCleared,
    totalStarsEarned,
    maxStarsPossible,
    getDungeonProgress,
    getStageProgress,
    isDungeonUnlocked,
    isStageUnlocked,
    getUnmetConditions,
    ensureDungeonProgress,
    initDungeon,
    checkDailyReset,
    canChallengeStage,
    startBattle,
    simulateBattle,
    calculateDrops,
    completeBattle,
    retreatBattle,
    analyzeDefeat,
    retryChallenge,
    getRecentBattles,
    getDefeatRecords,
    loadFromStorage,
    saveToStorage,
  }
})
