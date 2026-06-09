import { calculateOfflineEarnings, DEFAULT_OFFLINE_CONFIG } from '../src/types/offline'

function formatOfflineTime(minutes: number): string {
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) return `${hours}小时`
  return `${hours}小时${mins}分钟`
}

let passCount = 0
let failCount = 0

function assert(condition: boolean, label: string) {
  if (condition) {
    passCount++
    console.log(`  ✅ ${label}`)
  } else {
    failCount++
    console.log(`  ❌ ${label}`)
  }
}

function assertEq(actual: unknown, expected: unknown, label: string) {
  const ok = actual === expected
  if (!ok) {
    failCount++
    console.log(`  ❌ ${label} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
  } else {
    passCount++
    console.log(`  ✅ ${label}`)
  }
}

const CONFIG = { ...DEFAULT_OFFLINE_CONFIG }

console.log('========================================================')
console.log('  离线收益本地实跑验证')
console.log('========================================================')
console.log(`\n配置: maxAccumulationHours=${CONFIG.maxAccumulationHours}, ` +
  `minOfflineMinutes=${CONFIG.minOfflineMinutes}, ` +
  `moneyCap=${CONFIG.moneyCap}, reputationCap=${CONFIG.reputationCap}, sanityCap=${CONFIG.sanityCap}`)
console.log(`公式: 金钱/时 = 50 + 声望×2 + 天数×10`)
console.log(`公式: 声望/时 = 1 + 天数×0.5`)
console.log(`公式: 理智/时 = ${CONFIG.sanityPerHour}\n`)

// ========== Scenario 1 ==========
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('  场景一：离线 30 分钟 / day=10 / rep=50（未达上限）')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

const day1 = 10, rep1 = 50
const offlineMin1 = 30
const result1 = calculateOfflineEarnings(offlineMin1, CONFIG, day1, rep1)

const moneyRate1 = 50 + rep1 * 2 + day1 * 10
const repRate1 = 1 + day1 * 0.5
console.log(`▶ 费率: 金钱=${moneyRate1}/h, 声望=${repRate1}/h, 理智=${CONFIG.sanityPerHour}/h`)
console.log(`  离线时长:       ${offlineMin1} 分钟 → "${formatOfflineTime(offlineMin1)}"`)
console.log(`  实际生效时长:   ${result1.effectiveMinutes} 分钟 → "${formatOfflineTime(result1.effectiveMinutes)}"`)
console.log(`  实际收益:  金钱=${result1.earnings.money}, 声望=${result1.earnings.reputation}, 理智=${result1.earnings.sanity}`)
console.log(`  原始收益:  金钱=${result1.rawEarnings.money}, 声望=${result1.rawEarnings.reputation}, 理智=${result1.rawEarnings.sanity}`)

const timeCapped1 = offlineMin1 > result1.effectiveMinutes
const anyCap1 = result1.capInfo.moneyCapped || result1.capInfo.reputationCapped || result1.capInfo.sanityCapped
console.log('\n▶ 弹窗展示:')
console.log(`  头部: "累计时长 ${formatOfflineTime(result1.effectiveMinutes)}"${timeCapped1 ? '（离线 ' + formatOfflineTime(offlineMin1) + '，已达时长上限）' : ''}"`)
console.log(`  提示: "${anyCap1 ? '部分资源已达离线收益上限...' : '在你离开的时间里...'}"`)
console.log(`  💰 金钱: +${result1.earnings.money.toLocaleString()}${result1.capInfo.moneyCapped ? ` [上限 ${result1.capInfo.moneyCapValue.toLocaleString()}]` : ''}`)
console.log(`  ⭐ 声望: +${result1.earnings.reputation}${result1.capInfo.reputationCapped ? ` [上限 ${result1.capInfo.reputationCapValue}]` : ''}`)
console.log(`  🧠 理智: +${result1.earnings.sanity}${result1.capInfo.sanityCapped ? ` [上限 ${result1.capInfo.sanityCapValue}]` : ''}`)

console.log('\n▶ 断言:')
assertEq(result1.effectiveMinutes, offlineMin1, '生效时长 = 离线时长')
assert(!timeCapped1, '弹窗不显示"已达时长上限"')
assert(!result1.capInfo.moneyCapped, '金钱未封顶')
assert(!result1.capInfo.reputationCapped, '声望未封顶')
assert(!result1.capInfo.sanityCapped, '理智未封顶')
assertEq(result1.earnings.money, result1.rawEarnings.money, '金钱 实际=原始')
assertEq(result1.earnings.reputation, result1.rawEarnings.reputation, '声望 实际=原始')
assertEq(result1.earnings.sanity, result1.rawEarnings.sanity, '理智 实际=原始')

console.log('\n▶ 日志落库:')
const log1 = { offlineMinutes: offlineMin1, effectiveMinutes: result1.effectiveMinutes, timeCapped: offlineMin1 > result1.effectiveMinutes, earnings: result1.earnings, rawEarnings: result1.rawEarnings, capInfo: result1.capInfo }
console.log(`  offline=${log1.offlineMinutes}, effective=${log1.effectiveMinutes}, timeCapped=${log1.timeCapped}`)
console.log(`  earnings: 金钱=${log1.earnings.money}, 声望=${log1.earnings.reputation}, 理智=${log1.earnings.sanity}`)
assertEq(log1.timeCapped, false, 'timeCapped=false')
assertEq(log1.effectiveMinutes, log1.offlineMinutes, '生效=离线')
assertEq(log1.earnings.money, result1.rawEarnings.money, '入账金钱=原始金钱')

// ========== Scenario 2 ==========
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('  场景二：离线 24 小时 / day=30 / rep=80（超过时长上限 + 值上限）')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

const day2 = 30, rep2 = 80
const offlineMin2 = 24 * 60
const result2 = calculateOfflineEarnings(offlineMin2, CONFIG, day2, rep2)

const moneyRate2 = 50 + rep2 * 2 + day2 * 10
const repRate2 = 1 + day2 * 0.5
console.log(`▶ 费率: 金钱=${moneyRate2}/h, 声望=${repRate2}/h, 理智=${CONFIG.sanityPerHour}/h`)
console.log(`  离线时长:       ${offlineMin2} 分钟 → "${formatOfflineTime(offlineMin2)}"`)
console.log(`  实际生效时长:   ${result2.effectiveMinutes} 分钟 → "${formatOfflineTime(result2.effectiveMinutes)}"`)
console.log(`  实际收益(封顶后): 金钱=${result2.earnings.money}, 声望=${result2.earnings.reputation}, 理智=${result2.earnings.sanity}`)
console.log(`  原始收益(未封顶): 金钱=${result2.rawEarnings.money}, 声望=${result2.rawEarnings.reputation}, 理智=${result2.rawEarnings.sanity}`)

const timeCapped2 = offlineMin2 > result2.effectiveMinutes
const anyCap2 = result2.capInfo.moneyCapped || result2.capInfo.reputationCapped || result2.capInfo.sanityCapped
console.log('\n▶ 弹窗展示:')
console.log(`  头部: "累计时长 ${formatOfflineTime(result2.effectiveMinutes)}（离线 ${formatOfflineTime(offlineMin2)}，已达时长上限）"`)
console.log(`  提示: "${anyCap2 ? '部分资源已达离线收益上限，仅按上限值发放：' : '在你离开的时间里...'}"`)
if (result2.capInfo.moneyCapped && result2.rawEarnings) {
  console.log(`  💰 金钱: +${result2.earnings.money.toLocaleString()}  原可获 +${result2.rawEarnings.money.toLocaleString()}  [上限 ${result2.capInfo.moneyCapValue.toLocaleString()}]`)
} else {
  console.log(`  💰 金钱: +${result2.earnings.money.toLocaleString()}`)
}
if (result2.capInfo.reputationCapped && result2.rawEarnings) {
  console.log(`  ⭐ 声望: +${result2.earnings.reputation}  原可获 +${result2.rawEarnings.reputation}  [上限 ${result2.capInfo.reputationCapValue}]`)
} else {
  console.log(`  ⭐ 声望: +${result2.earnings.reputation}`)
}
if (result2.capInfo.sanityCapped && result2.rawEarnings) {
  console.log(`  🧠 理智: +${result2.earnings.sanity}  原可获 +${result2.rawEarnings.sanity}  [上限 ${result2.capInfo.sanityCapValue}]`)
} else {
  console.log(`  🧠 理智: +${result2.earnings.sanity} (未封顶, 恰好等于上限)`)
}

console.log('\n▶ 断言:')
assertEq(result2.effectiveMinutes, CONFIG.maxAccumulationHours * 60, `生效时长封顶于 ${CONFIG.maxAccumulationHours}h = ${CONFIG.maxAccumulationHours * 60}min`)
assert(timeCapped2, '弹窗显示"已达时长上限"')
assert(result2.capInfo.moneyCapped, '金钱触发值封顶')
assert(result2.capInfo.reputationCapped, '声望触发值封顶')
assertEq(result2.capInfo.sanityCapped, false, '理智不封顶 (5/h×12h=60=上限, 无需裁减)')
assertEq(result2.earnings.money, CONFIG.moneyCap, `金钱实际=上限 ${CONFIG.moneyCap}`)
assertEq(result2.earnings.reputation, CONFIG.reputationCap, `声望实际=上限 ${CONFIG.reputationCap}`)
assertEq(result2.earnings.sanity, CONFIG.sanityCap, `理智实际=上限 ${CONFIG.sanityCap} (恰好)`)
assert(result2.rawEarnings.money > CONFIG.moneyCap, `金钱原始(${result2.rawEarnings.money}) > 上限(${CONFIG.moneyCap})`)
assert(result2.rawEarnings.reputation > CONFIG.reputationCap, `声望原始(${result2.rawEarnings.reputation}) > 上限(${CONFIG.reputationCap})`)
assertEq(result2.rawEarnings.sanity, CONFIG.sanityCap, `理智原始=${CONFIG.sanityCap} (恰好=上限, 不算封顶)`)

console.log('\n▶ 日志落库:')
const log2 = { offlineMinutes: offlineMin2, effectiveMinutes: result2.effectiveMinutes, timeCapped: offlineMin2 > result2.effectiveMinutes, earnings: result2.earnings, rawEarnings: result2.rawEarnings, capInfo: result2.capInfo }
console.log(`  offline=${log2.offlineMinutes}, effective=${log2.effectiveMinutes}, timeCapped=${log2.timeCapped}`)
console.log(`  earnings: 金钱=${log2.earnings.money}, 声望=${log2.earnings.reputation}, 理智=${log2.earnings.sanity}`)
console.log(`  rawEarnings: 金钱=${log2.rawEarnings.money}, 声望=${log2.rawEarnings.reputation}, 理智=${log2.rawEarnings.sanity}`)
console.log(`  capInfo: moneyCapped=${log2.capInfo.moneyCapped}[上限${log2.capInfo.moneyCapValue}], reputationCapped=${log2.capInfo.reputationCapped}[上限${log2.capInfo.reputationCapValue}], sanityCapped=${log2.capInfo.sanityCapped}[上限${log2.capInfo.sanityCapValue}]`)
assertEq(log2.timeCapped, true, 'timeCapped=true')
assertEq(log2.effectiveMinutes, CONFIG.maxAccumulationHours * 60, '生效=最大累计')
assertEq(log2.earnings.money, CONFIG.moneyCap, '入账金钱=上限')
assertEq(log2.earnings.reputation, CONFIG.reputationCap, '入账声望=上限')
assertEq(log2.earnings.sanity, CONFIG.sanityCap, '入账理智=上限(恰好)')

// ========== 口径一致性校验 ==========
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('  跨场景口径一致性校验')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

assert(log1.earnings.money === log1.rawEarnings.money, '场景一: 实际收益=原始收益 (无封顶时一致)')
assert(log2.earnings.money <= log2.rawEarnings.money, '场景二: 实际收益<=原始收益 (封顶后不超)')
assert(log2.earnings.reputation <= log2.rawEarnings.reputation, '场景二: 声望实际<=原始')
assert(log2.earnings.sanity <= log2.rawEarnings.sanity, '场景二: 理智实际<=原始')
assert(log2.capInfo.moneyCapValue === CONFIG.moneyCap, 'capInfo.moneyCapValue 与配置一致')
assert(log2.capInfo.reputationCapValue === CONFIG.reputationCap, 'capInfo.reputationCapValue 与配置一致')
assert(log2.capInfo.sanityCapValue === CONFIG.sanityCap, 'capInfo.sanityCapValue 与配置一致')

console.log('\n========================================================')
console.log(`  验证结果: ${passCount} 通过, ${failCount} 失败`)
console.log('========================================================\n')

if (failCount > 0) {
  process.exit(1)
}
