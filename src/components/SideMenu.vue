<template>
  <el-menu
    :default-active="activeIndex"
    class="el-menu-vertical"
    :collapse="isCollapse"
    router
  >
    <!-- 移除Dashboard菜单项 -->
    <!-- <el-menu-item index="/dashboard">
      <el-icon><HomeFilled /></el-icon>
      <span>首页</span>
    </el-menu-item> -->
    
    <el-menu-item index="/venues">
      <el-icon><Place /></el-icon>
      <span>场地管理</span>
    </el-menu-item>
    
    <el-menu-item index="/customers">
      <el-icon><User /></el-icon>
      <span>客户管理</span>
    </el-menu-item>
    
    <el-menu-item index="/products">
      <el-icon><Goods /></el-icon>
      <span>商品管理</span>
    </el-menu-item>
    
    <el-menu-item index="/finance">
      <el-icon><Money /></el-icon>
      <span>财务管理</span>
    </el-menu-item>
  </el-menu>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
// 移除未使用的图标
// import { HomeFilled, User, Place, Goods, Money } from '@element-plus/icons-vue'
import { User, Place, Goods, Money } from '@element-plus/icons-vue'

const props = defineProps({
  isCollapse: {
    type: Boolean,
    default: false
  }
})

const route = useRoute()
const activeIndex = ref('/customers') // 默认选中客户管理

onMounted(() => {
  activeIndex.value = route.path
})
</script> 