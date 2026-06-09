export interface OfflineEarnings {
  money: number
  reputation: number
  sanity: number
}

export interface OfflineEarningsCapInfo {
  moneyCapped: boolean
  reputationCapped: boolean
  sanityCapped: boolean
  moneyCapValue: number
  reputationCapValue: number
  sanityCapValue: number
}

export interface OfflineEarningsResult {
  earnings: OfflineEarnings
  rawEarnings: OfflineEarnings
  effectiveMinutes: number
  capInfo: OfflineEarningsCapInfo
}

export interface OfflineEarningsLog {
  id: string
  claimedAt: number
  offlineMinutes: number
  effectiveMinutes: number
  timeCapped: boolean
  capInfo: OfflineEarningsCapInfo
  earnings: OfflineEarnings
  rawEarnings: OfflineEarnings
}

export interface OfflineEarningsConfig {
  moneyPerHour: number
  reputationPerHour: number
  sanityPerHour: number
  maxAccumulationHours: number
  minOfflineMinutes: number
  moneyCap: number
  reputationCap: number
  sanityCap: number
}

export interface OfflineEarningsState {
  lastOnlineTime: number
  logs: OfflineEarningsLog[]
}

export const DEFAULT_OFFLINE_CONFIG: OfflineEarningsConfig = {
  moneyPerHour: 0,
  reputationPerHour: 0,
  sanityPerHour: 5,
  maxAccumulationHours: 12,
  minOfflineMinutes: 5,
  moneyCap: 5000,
  reputationCap: 50,
  sanityCap: 60,
}

export function calculateOfflineEarnings(
  offlineMinutes: number,
  config: OfflineEarningsConfig,
  currentDay: number,
  currentReputation: number
): OfflineEarningsResult {
  const effectiveMinutes = Math.min(offlineMinutes, config.maxAccumulationHours * 60)
  const hours = effectiveMinutes / 60

  const moneyRate = 50 + currentReputation * 2 + currentDay * 10
  const reputationRate = 1 + currentDay * 0.5
  const sanityRate = config.sanityPerHour

  const rawMoney = Math.floor(moneyRate * hours)
  const rawReputation = Math.floor(reputationRate * hours)
  const rawSanity = Math.floor(sanityRate * hours)

  const money = Math.min(rawMoney, config.moneyCap)
  const reputation = Math.min(rawReputation, config.reputationCap)
  const sanity = Math.min(rawSanity, config.sanityCap)

  const moneyCapped = rawMoney > config.moneyCap
  const reputationCapped = rawReputation > config.reputationCap
  const sanityCapped = rawSanity > config.sanityCap

  return {
    earnings: { money, reputation, sanity },
    rawEarnings: { money: rawMoney, reputation: rawReputation, sanity: rawSanity },
    effectiveMinutes,
    capInfo: {
      moneyCapped,
      reputationCapped,
      sanityCapped,
      moneyCapValue: config.moneyCap,
      reputationCapValue: config.reputationCap,
      sanityCapValue: config.sanityCap,
    },
  }
}
