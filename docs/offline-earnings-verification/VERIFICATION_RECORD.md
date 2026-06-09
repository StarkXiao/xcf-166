# 离线收益本地实跑验证记录

- 验证日期: 2026-06-09
- 验证环境: Windows + Vite dev server (localhost:5176)
- 验证方式: 通过 test-offline.html 注入 localStorage 模拟离线时长，在浏览器中真实触发弹窗 → 领取入账 → 日志落库

---

## 场景一：离线 30 分钟（未达上限）

### 测试参数
- offlineMinutes = 30
- day = 10, reputation = 50, money = 2000, sanity = 80

### 费率计算
- 金钱/时 = 50 + 50×2 + 10×10 = 250
- 声望/时 = 1 + 10×0.5 = 6
- 理智/时 = 5

### 弹窗展示 (截图: scenario1-offline-dialog-30min.png)
- 头部: "累计时长 30分钟"
- 无"已达时长上限"提示（30min < 12h 上限）
- 提示语: "在你离开的时间里，地下二层依然在运转。以下是累积的收益："
- 💰 金钱: +125（无封顶标签）
- ⭐ 声望: +3（无封顶标签）
- 🧠 理智: +2（无封顶标签）

### 领取入账 (截图: scenario1-after-claim.png)
| 资源 | 领取前 | 领取后 | 变化 |
|------|--------|--------|------|
| 金钱 | 2,000 | 2,125 | +125 ✅ |
| 声望 | 50 | 53 | +3 ✅ |
| 理智 | 80 | 82 | +2 ✅ |

### 日志落库 (截图: scenario1-log-reader.png)
```
Log #2:
  id: offline_1749483267074
  offlineMinutes: 30
  effectiveMinutes: 30
  timeCapped: false
  earnings: money=125, reputation=3, sanity=2
  rawEarnings: money=125, reputation=3, sanity=2
  capInfo: moneyCapped=false [上限 5000]
           reputationCapped=false [上限 50]
           sanityCapped=false [上限 60]
```

### 口径一致性
- 弹窗展示 "30分钟" = 日志 effectiveMinutes = 30 ✅
- 弹窗收益 = 日志 earnings = 实际入账金额 ✅
- 无封顶场景: earnings = rawEarnings ✅
- timeCapped = false（离线30min < 12h上限）✅

---

## 场景二：离线 24 小时（超过时长上限 + 值上限）

### 测试参数
- offlineMinutes = 1440（24h）
- day = 30, reputation = 80, money = 5000, sanity = 50

### 费率计算
- 金钱/时 = 50 + 80×2 + 30×10 = 510
- 声望/时 = 1 + 30×0.5 = 16
- 理智/时 = 5

### 弹窗展示 (截图: scenario2-offline-dialog-24h.png)
- 头部: "累计时长 12小时 （离线 24小时，已达时长上限）" ✅
- 提示语: "部分资源已达离线收益上限，仅按上限值发放：" ✅
- 💰 金钱: +5,000 原可获 +6,120 [上限 5,000] ✅
- ⭐ 声望: +50 原可获 +192 [上限 50] ✅
- 🧠 理智: +60（无封顶标签，恰好等于上限值60，5×12=60，>不触发封顶标记）✅

### 领取入账 (截图: scenario2-after-claim.png)
| 资源 | 领取前 | 领取后 | 离线收益 | 备注 |
|------|--------|--------|----------|------|
| 金钱 | 5,000 | 10,000 | +5,000 | 上限裁减（原6,120→5,000）|
| 声望 | 80 | 100 | +50→实际+20 | gameStore 声望上限100（80+50=130→100）|
| 理智 | 50 | 100 | +60→实际+50 | gameStore 理智上限= maxSanity=100（50+60=110→100）|

### 日志落库 (截图: scenario2-log-reader.png)
```
Log #1:
  id: offline_1749483937xxx
  offlineMinutes: 1440
  effectiveMinutes: 720
  timeCapped: true
  earnings: money=5000, reputation=50, sanity=60
  rawEarnings: money=6120, reputation=192, sanity=60
  capInfo: moneyCapped=true [上限 5000]
           reputationCapped=true [上限 50]
           sanityCapped=false [上限 60]
```

### 口径一致性
- 弹窗展示 "12小时" = 日志 effectiveMinutes = 720min = 12h ✅
- 弹窗"已达时长上限" = 日志 timeCapped = true ✅
- 弹窗金钱 +5,000 [上限 5,000] = 日志 earnings.money = 5000, capInfo.moneyCapped = true ✅
- 弹窗声望 +50 [上限 50] = 日志 earnings.reputation = 50, capInfo.reputationCapped = true ✅
- 弹窗理智 +60（无封顶）= 日志 sanityCapped = false (5×12=60=上限，未超过) ✅
- rawEarnings 忠实记录原始计算值（6120, 192, 60）✅

### 额外发现
- gameStore 声望上限为 100（Math.min(100, ...)），离线收益系统发放 +50 后实际只增加了 20（80→100）
- gameStore 理智上限为 maxSanity（默认100），离线收益系统发放 +60 后实际只增加了 50（50→100）
- 此为 gameStore 自身的上限逻辑，与离线收益封顶无关；离线日志正确记录了离线系统实际发放的 +50/+60

---

## 附件截图清单

| 文件名 | 内容 |
|--------|------|
| scenario1-offline-dialog-30min.png | 场景一：30分钟离线收益弹窗 |
| scenario1-after-claim.png | 场景一：领取后游戏界面 |
| scenario1-log-reader.png | 场景一：日志落库记录 |
| scenario2-offline-dialog-24h.png | 场景二：24小时离线收益弹窗（含封顶标注） |
| scenario2-after-claim.png | 场景二：领取后游戏界面 |
| scenario2-log-reader.png | 场景二：日志落库记录（含 capInfo） |

## 结论

两个场景均已真实触发弹窗、领取入账、日志落库，弹窗展示与日志口径一致：
1. **未达上限场景**：离线时长 = 生效时长，无封顶标签，earnings = rawEarnings
2. **超过上限场景**：生效时长封顶于 12h，值超上限的显示"原可获"和"上限 N"标签，日志 timeCapped/capInfo 正确标记
3. **口径对齐**：弹窗主展示"生效累计时长"（非原始离线时长），日志 effectiveMinutes 与弹窗一致
