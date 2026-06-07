<template>
  <div class="flex h-screen bg-gray-900 text-gray-100">
    <aside class="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
      <div class="p-6 border-b border-gray-700">
        <h1 class="text-xl font-bold text-purple-400 flex items-center gap-2">
          <Settings class="w-6 h-6" />
          活动运营后台
        </h1>
      </div>
      <nav class="flex-1 p-4 space-y-2">
        <RouterLink
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200"
          :class="{
            'bg-purple-600 text-white': isActive(item.path),
            'text-gray-300 hover:bg-gray-700 hover:text-white': !isActive(item.path),
          }"
        >
          <component :is="item.icon" class="w-5 h-5" />
          <span>{{ item.label }}</span>
          <span
            v-if="item.badge"
            class="ml-auto px-2 py-0.5 text-xs bg-red-500 text-white rounded-full"
          >
            {{ item.badge }}
          </span>
        </RouterLink>
      </nav>
      <div class="p-4 border-t border-gray-700">
        <div class="flex items-center gap-3 px-4 py-2">
          <div class="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
            <User class="w-5 h-5" />
          </div>
          <div class="flex-1">
            <p class="text-sm font-medium">管理员</p>
            <p class="text-xs text-gray-400">admin@game.com</p>
          </div>
        </div>
      </div>
    </aside>

    <main class="flex-1 flex flex-col overflow-hidden">
      <header class="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6">
        <div class="flex items-center gap-4">
          <h2 class="text-lg font-semibold">{{ currentPageTitle }}</h2>
        </div>
        <div class="flex items-center gap-4">
          <div class="relative">
            <input
              type="text"
              placeholder="搜索活动..."
              class="w-64 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:outline-none focus:border-purple-500"
            />
            <Search class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          <button class="relative p-2 text-gray-400 hover:text-white transition-colors">
            <Bell class="w-5 h-5" />
            <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </header>

      <div class="flex-1 overflow-auto p-6">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink, RouterView } from 'vue-router'
import {
  Settings,
  LayoutDashboard,
  FileText,
  Layers,
  BarChart3,
  Users,
  Bell,
  Search,
  User,
  Clock,
} from 'lucide-vue-next'
import { useActivityStore } from '@/stores/activityStore'

const route = useRoute()
const activityStore = useActivityStore()

const menuItems = computed(() => [
  {
    path: '/admin/activities',
    label: '活动管理',
    icon: FileText,
    badge: activityStore.pendingActivities.length > 0 ? activityStore.pendingActivities.length : null,
  },
  {
    path: '/admin/templates',
    label: '活动模板',
    icon: Layers,
    badge: null,
  },
])

function isActive(path: string) {
  return route.path.startsWith(path)
}

const currentPageTitle = computed(() => {
  const path = route.path
  if (path.includes('/admin/activities/new')) return '创建活动'
  if (path.includes('/admin/activities/') && path.includes('/statistics')) return '数据统计'
  if (path.includes('/admin/activities/')) return '编辑活动'
  if (path.includes('/admin/activities')) return '活动管理'
  if (path.includes('/admin/templates')) return '活动模板'
  return '控制台'
})
</script>
