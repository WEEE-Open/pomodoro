import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: '/',
			name: 'Pomodoro',
			component: () => import('../views/PomodoroView.vue')
		},
		{
			path: '/dashboard',
			name: 'Dashboard',
			component: () => import('../views/DashboardView.vue')
		},
		{
			path: '/:pathMatch(.*)*',
			redirect: {
				path: '/1'
			}
		}
	]
})

export default router
