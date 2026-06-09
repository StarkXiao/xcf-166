export interface OfflineEarnings {
  money: number
  reputation: number
  sanity: number
}

export interface OfflineEarningsLog {
  id: string
  claimedAt: number
  offlineMinutes: number
  earnings: OfflineEarnings
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
): OfflineEarnings {
  const effectiveMinutes = Math.min(offlineMinutes, config.maxAccumulationHours * 60)
  const hours = effectiveMinutes / 60

  const moneyRate = 50 + currentReputation * 2 + currentDay * 10
  const reputationRate = 1 + currentDay * 0.5
  const sanityRate = config.sanityPerHour

  let money = Math.floor(moneyRate * hours)
  let reputation = Math.floor(reputationRate * hours)
  let sanity = Math.floor(sanityRate * hours)

  money = Math.min(money, config.moneyCap)
  reputation = Math.min(reputation, config.reputationCap)
  sanity = Math.min(sanity, config.sanityCap)

  return { money, reputation, sanity }
}
