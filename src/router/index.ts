import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import GamePage from '@/pages/GamePage.vue'
import SeasonPage from '@/pages/SeasonPage.vue'
import CharacterPage from '@/pages/CharacterPage.vue'
import AchievementPage from '@/pages/AchievementPage.vue'
import ShopPage from '@/pages/ShopPage.vue'
import FriendPage from '@/pages/FriendPage.vue'
import MailPage from '@/pages/MailPage.vue'
import DungeonPage from '@/pages/DungeonPage.vue'
import DashboardPage from '@/pages/DashboardPage.vue'
import LeaderboardSharePage from '@/pages/LeaderboardSharePage.vue'
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
    path: '/shop',
    name: 'shop',
    component: ShopPage,
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
    path: '/achievements',
    name: 'achievements',
    component: AchievementPage,
  },
  {
    path: '/friends',
    name: 'friends',
    component: FriendPage,
  },
  {
    path: '/dungeon',
    name: 'dungeon',
    component: DungeonPage,
  },
  {
    path: '/mail',
    name: 'mail',
    component: MailPage,
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardPage,
  },
  {
    path: '/leaderboard/share',
    name: 'leaderboard-share',
    component: LeaderboardSharePage,
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
