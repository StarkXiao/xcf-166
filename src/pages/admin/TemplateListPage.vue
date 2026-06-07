<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold">活动模板管理</h2>
        <p class="text-sm text-gray-400 mt-1">管理所有可用的活动模板，可基于模板快速创建活动</p>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-6">
      <div
        v-for="template in activityStore.templates"
        :key="template.id"
        class="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:border-purple-500 transition-all group"
      >
        <div class="p-6">
          <div class="flex items-start justify-between mb-4">
            <div class="w-14 h-14 rounded-xl bg-purple-600/20 flex items-center justify-center group-hover:bg-purple-600/40 transition-colors">
              <component :is="getIcon(template.icon)" class="w-7 h-7 text-purple-400" />
            </div>
            <span class="px-3 py-1 text-xs rounded-full bg-gray-700 text-gray-300">
              {{ template.type }}
            </span>
          </div>
          <h3 class="text-lg font-semibold mb-2">{{ template.name }}</h3>
          <p class="text-sm text-gray-400 mb-4">{{ template.description }}</p>
          <div class="flex items-center gap-4 text-xs text-gray-500">
            <span class="flex items-center gap-1">
              <Clock class="w-3 h-3" />
              创建于 {{ formatDate(template.createdAt) }}
            </span>
          </div>
        </div>
        <div class="px-6 py-4 bg-gray-700/30 border-t border-gray-700 flex items-center justify-between">
          <span class="text-sm text-gray-400">默认优先级: P{{ template.defaultConfig.priority }}</span>
          <button
            @click="useTemplate(template.id)"
            class="flex items-center gap-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
          >
            <Plus class="w-4 h-4" />
            使用模板
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Plus, Clock, Trophy, Calendar, CheckSquare, Gift, ShoppingBag, Layout } from 'lucide-vue-next'
import { useActivityStore } from '@/stores/activityStore'

const router = useRouter()
const activityStore = useActivityStore()

function getIcon(iconName: string) {
  const icons: Record<string, any> = {
    Trophy,
    Calendar,
    CheckSquare,
    Gift,
    ShoppingBag,
    Layout,
  }
  return icons[iconName] || Layout
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString('zh-CN')
}

function useTemplate(templateId: string) {
  const newActivity = activityStore.createActivity(templateId)
  router.push(`/admin/activities/${newActivity.id}`)
}
</script>
