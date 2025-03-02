<template>
  <main-layout>
    <router-view />
  </main-layout>
</template>

<script setup>
import { ref, onErrorCaptured, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { User, Place, Goods, Money } from '@element-plus/icons-vue';
import MainLayout from './layouts/MainLayout.vue'

const router = useRouter();
const isCollapse = ref(false);

const username = computed(() => {
  return localStorage.getItem('username') || '未登录';
});

const handleCommand = (command) => {
  if (command === 'logout') {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    router.push('/login');
    ElMessage.success('已退出登录');
  }
};

// 错误处理
onErrorCaptured((err, instance, info) => {
  console.error('Captured error:', err);
  ElMessage.error('页面加载出错，请刷新重试');
  return false; // 阻止错误继续传播
});
</script>

<style>
body {
  margin: 0;
  font-family: 'Helvetica Neue', Arial, sans-serif;
}

.el-container {
  height: 100vh;
}

.el-aside {
  background-color: #f5f7fa;
}

.el-header {
  background-color: #fff;
  border-bottom: 1px solid #dcdfe6;
  padding: 0 20px;
}

.header-content {
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h1 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.user-info {
  display: flex;
  align-items: center;
}

.el-dropdown-link {
  cursor: pointer;
  display: flex;
  align-items: center;
  color: #409EFF;
}

.el-main {
  padding: 20px;
  background-color: #f5f7fa;
}

.el-menu {
  border-right: none;
  height: 100%;
}

.el-menu-item [class^="el-icon"] {
  margin-right: 5px;
  width: 24px;
  text-align: center;
  font-size: 18px;
}
</style>