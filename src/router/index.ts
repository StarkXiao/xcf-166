import { createRouter, createWebHistory } from 'vue-router'
import GamePage from '@/pages/GamePage.vue'
import SeasonPage from '@/pages/SeasonPage.vue'

const routes = [
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
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
