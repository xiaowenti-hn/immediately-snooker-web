// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import { ElMessage } from 'element-plus';
import CustomerManagement from '../views/CustomerManagement.vue';
import VenueManagement from '../views/VenueManagement.vue';
import ProductManagement from '../views/ProductManagement.vue';
import FinanceManagement from '../views/FinanceManagement.vue';
import Login from '../views/Login.vue';

const routes = [
  {
    path: '/',
    redirect: '/venues'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { title: '登录', public: true }
  },
  {
    path: '/customers',
    name: 'CustomerManagement',
    component: CustomerManagement,
    meta: { title: '客户管理', requiresAuth: true }
  },
  {
    path: '/venues',
    name: 'VenueManagement',
    component: VenueManagement,
    meta: { title: '场地管理', requiresAuth: true }
  },
  {
    path: '/products',
    name: 'ProductManagement',
    component: ProductManagement,
    meta: { title: '商品管理', requiresAuth: true }
  },
  {
    path: '/finance',
    name: 'FinancialManagement',
    component: FinanceManagement,
    meta: { title: '财务结算', requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 全局导航守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 台球馆管理系统` : '台球馆管理系统';
  
  // 检查是否是公开路由
  if (to.meta.public) {
    next();
    return;
  }

  // 检查是否已登录
  const token = localStorage.getItem('token');
  if (!token && to.path !== '/login') {
    ElMessage.warning('请先登录');
    next('/login');
    return;
  }

  // 检查是否需要认证
  if (to.meta.requiresAuth && !token) {
    ElMessage.warning('需要认证才能访问');
    next('/login');
    return;
  }

  next();
});

// 错误处理
router.onError((error) => {
  console.error('Router error:', error);
  ElMessage.error('页面加载失败，请刷新重试');
});

export default router;