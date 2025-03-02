<template>
  <el-container>
    <el-aside width="auto">
      <div class="logo-container" :class="{ 'collapsed': isCollapse }">
        <img src="../assets/logo.png" alt="Logo" class="logo" />
        <span v-if="!isCollapse">台球馆管理系统</span>
      </div>
      <side-menu :is-collapse="isCollapse" />
    </el-aside>
    
    <el-container>
      <el-header>
        <div class="header-content">
          <el-icon class="toggle-icon" @click="toggleSidebar">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          
          <div class="user-info">
            <el-dropdown @command="handleCommand">
              <span class="el-dropdown-link">
                {{ username }} <el-icon><arrow-down /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-header>
      
      <el-main>
        <slot></slot>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Fold, Expand, ArrowDown } from '@element-plus/icons-vue'
import SideMenu from '../components/SideMenu.vue'

const router = useRouter()
const isCollapse = ref(false)

const username = computed(() => {
  return localStorage.getItem('username') || '未登录'
})

const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value
}

const handleCommand = (command) => {
  if (command === 'logout') {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('role')
    router.push('/login')
    ElMessage.success('已退出登录')
  }
}
</script>

<style scoped>
.logo-container {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  color: #409EFF;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid #dcdfe6;
}

.logo-container.collapsed {
  padding: 0;
  justify-content: center;
}

.logo {
  width: 30px;
  height: 30px;
  margin-right: 10px;
}

.toggle-icon {
  font-size: 20px;
  cursor: pointer;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
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
</style> 