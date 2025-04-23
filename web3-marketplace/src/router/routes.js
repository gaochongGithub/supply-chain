export const baseRoutes = [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
      meta: { public: true } // 无需登录
    },
    {
      path: '/product/:id',
      name: 'ProductDetail',
      component: () => import('@/views/ProductDetail.vue'),
      props: true
    }
  ]
  
  // 需要登录后访问的路由
  export const roleRoutes = [
    {
      path: '/admin',
      name: 'Admin',
      component: () => import('@/views/Admin.vue'),
      meta: { role: 'admin' }
    },
    {
      path: '/buyer',
      name: 'Buyer',
      component: () => import('@/views/Buyer.vue'),
      meta: { role: 'buyer' }
    },
    {
      path: '/seller',
      name: 'Seller',
      component: () => import('@/views/Seller.vue'),
      meta: { role: 'seller' }
    }
  ]