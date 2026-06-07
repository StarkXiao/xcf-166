import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import GamePage from '@/pages/GamePage.vue'
import SeasonPage from '@/pages/SeasonPage.vue'
import CharacterPage from '@/pages/CharacterPage.vue'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import ActivityListPage from '@/pages/admin/ActivityListPage.vue'
import ActivityEditPage from '@/pages/admin/ActivityEditPage.vue'
import ActivityStatisticsPage from '@/pages/admin/ActivityStatisticsPage.vue'
import TemplateListPage from '@/pages/admin/TemplateListPage.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'game',
    component: GamePage,
  },
  {
    path: '/season',
    name: 'season',
    component: SeasonPage,
  },
  {
    path: '/character',
    name: 'character',
    component: CharacterPage,
  },
  {
    path: '/admin',
    component: AdminLayout,
    children: [
      {
        path: '',
        redirect: '/admin/activities',
      },
      {
        path: 'activities',
        name: 'admin-activities',
        component: ActivityListPage,
      },
      {
        path: 'activities/new',
        name: 'admin-activity-new',
        component: ActivityEditPage,
      },
      {
        path: 'activities/:id',
        name: 'admin-activity-edit',
        component: ActivityEditPage,
      },
      {
        path: 'activities/:id/statistics',
        name: 'admin-activity-statistics',
        component: ActivityStatisticsPage,
      },
      {
        path: 'templates',
        name: 'admin-templates',
        component: TemplateListPage,
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
