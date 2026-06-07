<script setup lang="ts">
import { ref, computed } from 'vue'
import { useShopStore } from '../../stores/shopStore'
import { useCharacterStore } from '../../stores/characterStore'
import type { ShopItem } from '../../types/shop'
import { rarityColors, rarityBgColors, categoryNames } from '../../game/data/shopItems'
import { Backpack, Zap, Clock, CheckCircle, XCircle } from 'lucide-vue-next'

const shopStore = useShopStore()
const characterStore = useCharacterStore()

const activeBuffs = computed(() => characterStore.activeBuffs)

const inventoryItems = computed(() => shopStore.inventoryWithDetails)

const consumableItems = computed(() =>
  inventoryItems.value.filter(inv => inv.item?.category === 'consumable')
)

const materialItems = computed(() =>
  inventoryItems.value.filter(inv => inv.item?.category === 'material')
)

const cosmeticItems = computed(() =>
  inventoryItems.value.filter(inv => inv.item?.category === 'cosmetic')
)

const useResult = ref<{ success: boolean; message: string } | null>(null)
const isUsing = ref(false)
const selectedItem = ref<ShopItem | null>(null)

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric'
  })
}

function getBuffTypeName(type: string): string {
  const names: Record<string, string> = {
    processing_speed: '处理速度',
    sanity_protection: '理智保护',
    reward_multiplier: '报酬加成',
    anomaly_resistance: '异常抗性',
    anomaly_immunity: '异常免疫'
  }
  return names[type] || type
}

function getBuffValueText(type: string, value: number): string {
  if (type === 'anomaly_immunity') return '免疫'
  return `+${value}%`
}

async function handleUseItem(itemId: string) {
  if (isUsing.value) return

  isUsing.value = true
  useResult.value = null

  await new Promise(resolve => setTimeout(resolve, 300))

  const result = shopStore.useItem(itemId, 1)
  useResult.value = {
    success: result.success,
    message: result.message
  }

  isUsing.value = false

  setTimeout(() => {
    useResult.value = null
  }, 2000)
}

function canUseItem(item: ShopItem): boolean {
  if (item.category === 'material' || item.category === 'cosmetic') return false
  return true
}
</script>

<template>
  <div class="space-y-6">
    <div v-if="activeBuffs.length > 0" class="bg-gray-900/90 rounded-xl border border-gray-700 overflow-hidden">
      <div class="p-4 border-b border-gray-700 flex items-center gap-2">
        <Zap class="w-5 h-5 text-blue-400" />
        <h3 class="font-bold text-white">当前增益</h3>
        <span class="ml-auto text-sm text-gray-400">{{ activeBuffs.length }} 个生效中</span>
      </div>
      <div class="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div
          v-for="buff in activeBuffs"
          :key="buff.id"
          class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3"
        >
          <div class="flex items-center gap-2 mb-2">
            <span class="text-2xl">{{ buff.icon }}</span>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-white text-sm truncate">{{ buff.name }}</div>
              <div class="text-xs text-blue-400">
                {{ getBuffTypeName(buff.type) }} {{ getBuffValueText(buff.type, buff.value) }}
              </div>
            </div>
          </div>
          <div class="flex items-center gap-1 text-xs text-gray-400">
            <Clock class="w-3 h-3" />
            <span>剩余 {{ buff.remainingTurns }} 天</span>
          </div>
          <p class="text-xs text-gray-500 mt-1 line-clamp-1">{{ buff.description }}</p>
        </div>
      </div>
    </div>

    <div v-if="useResult" class="p-4 rounded-xl flex items-center gap-3" :class="useResult.success ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/20 border border-red-500/50'">
      <component :is="useResult.success ? CheckCircle : XCircle" class="w-6 h-6 flex-shrink-0" :class="useResult.success ? 'text-green-400' : 'text-red-400'" />
      <span class="font-medium" :class="useResult.success ? 'text-green-400' : 'text-red-400'">{{ useResult.message }}</span>
    </div>

    <div class="bg-gray-900/90 rounded-xl border border-gray-700 overflow-hidden">
      <div class="p-4 border-b border-gray-700 flex items-center gap-2">
        <Backpack class="w-5 h-5 text-amber-400" />
        <h3 class="font-bold text-white">我的背包</h3>
        <span class="ml-auto text-sm text-gray-400">{{ inventoryItems.length }} 种物品</span>
      </div>

      <div v-if="inventoryItems.length === 0" class="p-12 text-center">
        <Backpack class="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <p class="text-gray-500 text-lg">背包空空如也</p>
        <p class="text-sm text-gray-600 mt-2">在商城购买道具后会存放在这里</p>
      </div>

      <div v-else class="divide-y divide-gray-700">
        <div v-if="consumableItems.length > 0">
          <div class="px-4 py-2 bg-gray-800/50 text-sm text-gray-400">
            消耗品 ({{ consumableItems.length }})
          </div>
          <div class="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div
              v-for="inv in consumableItems"
              :key="inv.itemId"
              class="rounded-lg border-2 p-3 transition-all hover:scale-[1.02]"
              :class="[
                rarityColors[inv.item!.rarity],
                rarityBgColors[inv.item!.rarity]
              ]"
            >
              <div class="flex items-start gap-3">
                <div class="text-3xl flex-shrink-0">{{ inv.item!.icon }}</div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-white truncate">{{ inv.item!.name }}</span>
                    <span class="px-1.5 py-0.5 bg-gray-700 rounded text-xs text-gray-300">x{{ inv.quantity }}</span>
                  </div>
                  <p class="text-xs text-gray-400 mt-1 line-clamp-2">{{ inv.item!.description }}</p>
                  <div class="text-xs text-gray-500 mt-1">
                    获得于 {{ formatDate(inv.acquiredAt) }}
                  </div>
                </div>
              </div>
              <button
                v-if="canUseItem(inv.item!)"
                @click="handleUseItem(inv.itemId)"
                :disabled="isUsing"
                class="w-full mt-3 py-1.5 px-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Zap class="w-3 h-3" />
                使用
              </button>
            </div>
          </div>
        </div>

        <div v-if="materialItems.length > 0">
          <div class="px-4 py-2 bg-gray-800/50 text-sm text-gray-400">
            材料 ({{ materialItems.length }})
          </div>
          <div class="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div
              v-for="inv in materialItems"
              :key="inv.itemId"
              class="rounded-lg border p-3 text-center"
              :class="[
                rarityColors[inv.item!.rarity],
                rarityBgColors[inv.item!.rarity]
              ]"
            >
              <div class="text-3xl mb-1">{{ inv.item!.icon }}</div>
              <div class="text-xs font-medium text-white truncate">{{ inv.item!.name }}</div>
              <div class="text-xs text-gray-400">x{{ inv.quantity }}</div>
            </div>
          </div>
        </div>

        <div v-if="cosmeticItems.length > 0">
          <div class="px-4 py-2 bg-gray-800/50 text-sm text-gray-400">
            外观 ({{ cosmeticItems.length }})
          </div>
          <div class="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div
              v-for="inv in cosmeticItems"
              :key="inv.itemId"
              class="rounded-lg border p-3 text-center"
              :class="[
                rarityColors[inv.item!.rarity],
                rarityBgColors[inv.item!.rarity]
              ]"
            >
              <div class="text-3xl mb-1">{{ inv.item!.icon }}</div>
              <div class="text-xs font-medium text-white truncate">{{ inv.item!.name }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
