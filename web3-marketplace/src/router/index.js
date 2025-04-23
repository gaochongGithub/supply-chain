import Vue from 'vue'
import VueRouter from 'vue-router'
import { baseRoutes, roleRoutes } from './routes'

Vue.use(VueRouter)

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    ...baseRoutes,
    ...roleRoutes,
    { path: '*', redirect: '/login' } // 默认跳转登录
  ]
})

// 简单路由守卫（后续可扩展权限校验）
router.beforeEach((to, from, next) => {
  const isLoggedIn = !!localStorage.getItem('userToken')
  
  if (!to.meta.public && !isLoggedIn) {
    return next('/login')
  }
  
  next()
})

export default router