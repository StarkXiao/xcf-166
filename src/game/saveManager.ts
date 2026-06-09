import type { SaveData, SaveSlotInfo, SaveSlotManifest, CloudSyncStatus, VersionMigrationEntry } from '../game/types'

const MANIFEST_KEY = 'b2_morgue_save_manifest'
const SLOT_KEY_PREFIX = 'b2_morgue_slot_'
const BACKUP_KEY_PREFIX = 'b2_morgue_backup_'
const MAX_SLOTS = 5
const CURRENT_VERSION = '2.3.0'
const DEFAULT_AUTO_SAVE_INTERVAL_MS = 5 * 60 * 1000
const MAX_BACKUPS_PER_SLOT = 2

const VERSION_MIGRATIONS: VersionMigrationEntry[] = [
  {
    fromVersion: '2.0.0',
    toVersion: '2.1.0',
    migrate: (data) => {
      if (!data.stats) return data
      const stats = data.stats as Record<string, unknown>
      if (stats.maxSanity === undefined) {
        stats.maxSanity = 100
      }
      return data
    }
  },
  {
    fromVersion: '2.1.0',
    toVersion: '2.2.0',
    migrate: (data) => {
      if (data.eventHistory === undefined) {
        data.eventHistory = []
      }
      return data
    }
  },
  {
    fromVersion: '2.2.0',
    toVersion: '2.3.0',
    migrate: (data) => {
      if (data.characterData === undefined) {
        data.characterData = null
      }
      if (data.shopData === undefined) {
        data.shopData = null
      }
      return data
    }
  }
]

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    const na = pa[i] || 0
    const nb = pb[i] || 0
    if (na !== nb) return na - nb
  }
  return 0
}

function migrateSaveData(rawData: Record<string, unknown>): SaveData | null {
  let data = { ...rawData }
  const fromVersion = (data.version as string) || '2.0.0'

  if (compareVersions(fromVersion, CURRENT_VERSION) > 0) {
    console.warn(`存档版本 ${fromVersion} 高于当前版本 ${CURRENT_VERSION}，可能不兼容`)
    return null
  }

  let currentVer = fromVersion
  let migrated = true
  while (migrated && compareVersions(currentVer, CURRENT_VERSION) < 0) {
    migrated = false
    for (const entry of VERSION_MIGRATIONS) {
      if (compareVersions(currentVer, entry.fromVersion) >= 0 && compareVersions(currentVer, entry.toVersion) < 0) {
        try {
          data = entry.migrate(data)
          data.version = entry.toVersion
          currentVer = entry.toVersion
          migrated = true
        } catch (e) {
          console.error(`版本迁移 ${entry.fromVersion} -> ${entry.toVersion} 失败:`, e)
          return null
        }
      }
    }
  }

  data.version = CURRENT_VERSION
  return data as unknown as SaveData
}

function getDefaultManifest(): SaveSlotManifest {
  const slots: SaveSlotInfo[] = []
  for (let i = 0; i < MAX_SLOTS; i++) {
    slots.push({
      slotIndex: i,
      name: `存档 ${i + 1}`,
      timestamp: 0,
      day: 0,
      version: CURRENT_VERSION,
      isAutoSave: false,
      cloudSyncStatus: 'none' as CloudSyncStatus
    })
  }
  return {
    version: CURRENT_VERSION,
    slots,
    activeSlotIndex: 0,
    lastAutoSaveTime: 0,
    autoSaveIntervalMs: DEFAULT_AUTO_SAVE_INTERVAL_MS
  }
}

export function loadManifest(): SaveSlotManifest {
  try {
    const raw = localStorage.getItem(MANIFEST_KEY)
    if (!raw) {
      const manifest = getDefaultManifest()
      saveManifest(manifest)
      return manifest
    }
    const parsed = JSON.parse(raw) as SaveSlotManifest
    while (parsed.slots.length < MAX_SLOTS) {
      const idx = parsed.slots.length
      parsed.slots.push({
        slotIndex: idx,
        name: `存档 ${idx + 1}`,
        timestamp: 0,
        day: 0,
        version: CURRENT_VERSION,
        isAutoSave: false,
        cloudSyncStatus: 'none' as CloudSyncStatus
      })
    }
    return parsed
  } catch {
    const manifest = getDefaultManifest()
    saveManifest(manifest)
    return manifest
  }
}

export function saveManifest(manifest: SaveSlotManifest): void {
  try {
    localStorage.setItem(MANIFEST_KEY, JSON.stringify(manifest))
  } catch (e) {
    console.error('存档清单保存失败:', e)
  }
}

function slotKey(index: number): string {
  return `${SLOT_KEY_PREFIX}${index}`
}

function backupKey(index: number): string {
  return `${BACKUP_KEY_PREFIX}${index}`
}

export function loadSlot(index: number): SaveData | null {
  const key = slotKey(index)
  const raw = localStorage.getItem(key)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const version = parsed.version as string | undefined

    if (version && version !== CURRENT_VERSION) {
      const migrated = migrateSaveData(parsed)
      if (migrated) {
        saveSlot(index, migrated)
        return migrated
      }
      const backup = loadBackup(index)
      if (backup) {
        console.warn(`槽位 ${index} 存档迁移失败，尝试恢复备份`)
        return backup
      }
      console.warn(`槽位 ${index} 存档版本不兼容且无可用备份`)
      return null
    }

    return parsed as unknown as SaveData
  } catch (e) {
    console.error(`槽位 ${index} 存档读取失败:`, e)
    const backup = loadBackup(index)
    if (backup) {
      console.warn(`槽位 ${index} 存档损坏，已恢复备份`)
      return backup
    }
    return null
  }
}

export function saveSlot(index: number, data: SaveData, isAutoSave: boolean = false): boolean {
  const key = slotKey(index)

  const existingRaw = localStorage.getItem(key)
  if (existingRaw) {
    try {
      createBackup(index, existingRaw)
    } catch {
      console.warn(`槽位 ${index} 备份创建失败`)
    }
  }

  try {
    localStorage.setItem(key, JSON.stringify(data))
    updateManifestSlot(index, data, isAutoSave)
    return true
  } catch (e) {
    console.error(`槽位 ${index} 存档保存失败:`, e)
    return false
  }
}

function createBackup(index: number, rawData: string): void {
  const key = backupKey(index)

  const backupsRaw = localStorage.getItem(key)
  let backups: string[] = []

  if (backupsRaw) {
    try {
      backups = JSON.parse(backupsRaw) as string[]
    } catch {
      backups = []
    }
  }

  backups.unshift(rawData)
  if (backups.length > MAX_BACKUPS_PER_SLOT) {
    backups = backups.slice(0, MAX_BACKUPS_PER_SLOT)
  }

  localStorage.setItem(key, JSON.stringify(backups))
}

function loadBackup(index: number): SaveData | null {
  const key = backupKey(index)
  const raw = localStorage.getItem(key)
  if (!raw) return null

  try {
    const backups = JSON.parse(raw) as string[]
    for (const backupRaw of backups) {
      try {
        const parsed = JSON.parse(backupRaw) as Record<string, unknown>
        const version = parsed.version as string | undefined
        if (!version || version === CURRENT_VERSION) {
          return parsed as unknown as SaveData
        }
        const migrated = migrateSaveData(parsed)
        if (migrated) return migrated
      } catch {
        continue
      }
    }
  } catch {
    return null
  }
  return null
}

function updateManifestSlot(index: number, data: SaveData, isAutoSave: boolean): void {
  const manifest = loadManifest()
  const slot = manifest.slots[index]
  slot.timestamp = data.timestamp
  slot.day = data.day
  slot.version = data.version
  slot.isAutoSave = isAutoSave
  saveManifest(manifest)
}

export function deleteSlot(index: number): void {
  localStorage.removeItem(slotKey(index))
  localStorage.removeItem(backupKey(index))

  const manifest = loadManifest()
  const slot = manifest.slots[index]
  slot.timestamp = 0
  slot.day = 0
  slot.version = CURRENT_VERSION
  slot.isAutoSave = false
  slot.cloudSyncStatus = 'none' as CloudSyncStatus
  saveManifest(manifest)
}

export function renameSlot(index: number, newName: string): void {
  const manifest = loadManifest()
  manifest.slots[index].name = newName
  saveManifest(manifest)
}

export function getSlotInfo(index: number): SaveSlotInfo | null {
  const manifest = loadManifest()
  return manifest.slots[index] || null
}

export function getAllSlotInfos(): SaveSlotInfo[] {
  return loadManifest().slots
}

export function getActiveSlotIndex(): number {
  return loadManifest().activeSlotIndex
}

export function setActiveSlotIndex(index: number): void {
  const manifest = loadManifest()
  if (index >= 0 && index < MAX_SLOTS) {
    manifest.activeSlotIndex = index
    saveManifest(manifest)
  }
}

export function hasSlotData(index: number): boolean {
  return localStorage.getItem(slotKey(index)) !== null
}

export function isSlotOccupied(index: number): boolean {
  const info = getSlotInfo(index)
  return info !== null && info.timestamp > 0
}

export function migrateLegacySave(): boolean {
  const legacyKey = 'b2_morgue_save'
  const raw = localStorage.getItem(legacyKey)
  if (!raw) return false

  try {
    const data = JSON.parse(raw) as Record<string, unknown>
    let saveData: SaveData

    const version = data.version as string | undefined
    if (version && version !== CURRENT_VERSION) {
      const migrated = migrateSaveData(data)
      if (!migrated) {
        console.warn('旧版存档迁移失败')
        return false
      }
      saveData = migrated
    } else {
      saveData = data as unknown as SaveData
    }

    const manifest = loadManifest()
    const emptySlot = manifest.slots.findIndex(s => s.timestamp === 0)
    const targetSlot = emptySlot >= 0 ? emptySlot : 0

    saveData.version = CURRENT_VERSION
    saveSlot(targetSlot, saveData)
    setActiveSlotIndex(targetSlot)
    localStorage.removeItem(legacyKey)

    console.log(`旧版存档已迁移至槽位 ${targetSlot + 1}`)
    return true
  } catch (e) {
    console.error('旧版存档迁移失败:', e)
    return false
  }
}

export interface AutoSaveController {
  start: (saveFn: () => SaveData, activeSlot: number) => void
  stop: () => void
  isRunning: () => boolean
  triggerSave: () => void
}

export function createAutoSaveController(): AutoSaveController {
  let timer: ReturnType<typeof setInterval> | null = null
  let _saveFn: (() => SaveData) | null = null
  let _activeSlot = 0
  let _running = false

  function start(saveFn: () => SaveData, activeSlot: number) {
    stop()
    _saveFn = saveFn
    _activeSlot = activeSlot
    _running = true

    const manifest = loadManifest()
    const interval = manifest.autoSaveIntervalMs || DEFAULT_AUTO_SAVE_INTERVAL_MS

    timer = setInterval(() => {
      triggerSave()
    }, interval)
  }

  function stop() {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
    _running = false
  }

  function isRunning() {
    return _running
  }

  function triggerSave() {
    if (!_saveFn) return
    try {
      const data = _saveFn()
      data.timestamp = Date.now()
      saveSlot(_activeSlot, data, true)
      const manifest = loadManifest()
      manifest.lastAutoSaveTime = Date.now()
      saveManifest(manifest)
    } catch (e) {
      console.error('自动保存失败:', e)
    }
  }

  return { start, stop, isRunning, triggerSave }
}

export function setAutoSaveInterval(ms: number): void {
  const manifest = loadManifest()
  manifest.autoSaveIntervalMs = Math.max(60000, ms)
  saveManifest(manifest)
}

export function getLastAutoSaveTime(): number {
  return loadManifest().lastAutoSaveTime
}

export function updateCloudSyncStatus(index: number, status: CloudSyncStatus): void {
  const manifest = loadManifest()
  if (manifest.slots[index]) {
    manifest.slots[index].cloudSyncStatus = status
    saveManifest(manifest)
  }
}

export function getCloudSyncStatus(index: number): CloudSyncStatus {
  const manifest = loadManifest()
  return manifest.slots[index]?.cloudSyncStatus || 'none'
}

export interface CloudSyncPrompt {
  shouldPrompt: boolean
  message: string
  lastSyncTime: number
}

export function checkCloudSyncPrompt(index: number): CloudSyncPrompt {
  const status = getCloudSyncStatus(index)
  const slotInfo = getSlotInfo(index)

  if (status === 'none' && slotInfo && slotInfo.timestamp > 0) {
    return {
      shouldPrompt: true,
      message: '此存档尚未同步至云端，建议开启云存档以防数据丢失',
      lastSyncTime: 0
    }
  }

  if (status === 'failed' && slotInfo && slotInfo.timestamp > 0) {
    return {
      shouldPrompt: true,
      message: '云存档同步失败，请检查网络后重试',
      lastSyncTime: 0
    }
  }

  if (status === 'synced' && slotInfo) {
    const now = Date.now()
    const hoursSinceSync = (now - slotInfo.timestamp) / (1000 * 60 * 60)
    if (hoursSinceSync > 24) {
      return {
        shouldPrompt: true,
        message: `云存档已超过 ${Math.floor(hoursSinceSync)} 小时未同步，建议手动同步`,
        lastSyncTime: slotInfo.timestamp
      }
    }
  }

  return {
    shouldPrompt: false,
    message: '',
    lastSyncTime: slotInfo?.timestamp || 0
  }
}

export function simulateCloudSync(index: number): Promise<CloudSyncStatus> {
  updateCloudSyncStatus(index, 'syncing')

  return new Promise((resolve) => {
    setTimeout(() => {
      const success = Math.random() > 0.1
      const status: CloudSyncStatus = success ? 'synced' : 'failed'
      updateCloudSyncStatus(index, status)
      resolve(status)
    }, 1500)
  })
}

export function exportSlot(index: number): string | null {
  const data = loadSlot(index)
  if (!data) return null
  try {
    return JSON.stringify(data)
  } catch {
    return null
  }
}

export function importSlot(index: number, jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString) as SaveData
    if (!data.stats || !data.version) {
      console.error('导入数据格式无效')
      return false
    }

    if (data.version !== CURRENT_VERSION) {
      const migrated = migrateSaveData(data as unknown as Record<string, unknown>)
      if (!migrated) {
        console.error('导入存档版本迁移失败')
        return false
      }
      return saveSlot(index, migrated)
    }

    return saveSlot(index, data)
  } catch (e) {
    console.error('导入存档失败:', e)
    return false
  }
}

export { MAX_SLOTS, CURRENT_VERSION, DEFAULT_AUTO_SAVE_INTERVAL_MS }
