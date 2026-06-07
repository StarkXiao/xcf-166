<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useShopStore } from '@/stores/shopStore'
import { Tag, Clock, Zap } from 'lucide-vue-next'

const shopStore = useShopStore()

const currentTime = ref(Date.now())
let timer: number | null = null

onMounted(() => {
  timer = window.setInterval(() => {
    currentTime.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})

const activeDiscounts = computed(() => {
  return shopStore.activeDiscounts
})

const upcomingDiscounts = computed(() => {
  return shopStore.upcomingDiscounts
})

function formatTimeLeft(endTime: number): string {
  const left = endTime - currentTime.value
  if (left <= 0) return '已结束'
  
  const days = Math.floor(left / (1000 * 60 * 60 * 24))
  const hours = Math.floor((left % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((left % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((left % (1000 * 60)) / 1000)
  
  if (days > 0) {
    return `${days}天${hours}小时${minutes}分`
  }
  if (hours > 0) {
    return `${hours}小时${minutes}分${seconds}秒`
  }
  return `${minutes}分${seconds}秒`
}

function formatStartTime(startTime: number): string {
  const date = new Date(startTime)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div class="space-y-4">
    <div v-if="activeDiscounts.length > 0" class="space-y-3">
      <div class="flex items-center gap-2">
        <Zap class="w-5 h-5 text-yellow-400" />
        <h3 class="font-bold text-white">限时活动</h3>
      </div>
      
      <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <div 
          v-for="discount in activeDiscounts"
          :key="discount.id"
          class="relative overflow-hidden p-4 bg-gradient-to-r from-red-900/50 to-orange-900/50 border border-red-700/50 rounded-xl group hover:scale-102 transition-transform duration-300"
        >
          <div class="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-red-500/30 to-transparent rounded-bl-full"></div>
          
          <div class="relative">
            <div class="flex items-center gap-2 mb-2">
              <span class="px-2 py-1 bg-red-500 rounded-full text-xs font-bold text-white">
                -{{ discount.discountPercent }}%
              </span>
              <Tag class="w-4 h-4 text-orange-400" />
            </div>
            
            <h4 class="font-bold text-white mb-1">{{ discount.name }}</h4>
            <p class="text-sm text-gray-300 mb-3">{{ discount.description }}</p>
            
            <div class="flex items-center gap-2 text-sm">
              <Clock class="w-4 h-4 text-red-400" />
              <span class="text-red-300 font-mono">
                {{ formatTimeLeft(discount.endTime) }}
              </span>
            </div>
            
            <div class="mt-3 flex flex-wrap gap-1">
              <span 
                v-for="itemId in discount.itemIds.slice(0, 3)"
                :key="itemId"
                class="px-2 py-0.5 bg-gray-800/50 rounded text-xs text-gray-300"
              >
                {{ shopStore.getItemById(itemId)?.name || itemId }}
              </span>
              <span 
                v-if="discount.itemIds.length > 3"
                class="px-2 py-0.5 bg-gray-800/50 rounded text-xs text-gray-400"
              >
                +{{ discount.itemIds.length - 3 }}件
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="upcomingDiscounts.length > 0" class="space-y-3">
      <div class="flex items-center gap-2">
        <Clock class="w-5 h-5 text-blue-400" />
        <h3 class="font-bold text-white">即将开始</h3>
      </div>
      
      <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <div 
          v-for="discount in upcomingDiscounts"
          :key="discount.id"
          class="p-4 bg-gray-800/50 border border-gray-700/50 rounded-xl opacity-75"
        >
          <div class="flex items-center gap-2 mb-2">
            <span class="px-2 py-1 bg-blue-500/50 rounded-full text-xs font-bold text-blue-300">
              -{{ discount.discountPercent }}%
            </span>
            <span class="text-xs text-blue-400">即将开始</span>
          </div>
          
          <h4 class="font-bold text-gray-300 mb-1">{{ discount.name }}</h4>
          <p class="text-sm text-gray-500 mb-3">{{ discount.description }}</p>
          
          <div class="text-sm text-gray-400">
            开始时间: {{ formatStartTime(discount.startTime) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
