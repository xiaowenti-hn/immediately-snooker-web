<template>
  <div class="dashboard-container">
    <h1>台球馆管理系统</h1>
    
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="dashboard-card">
          <template #header>
            <div class="card-header">
              <span>场地使用情况</span>
              <el-button class="button" text @click="navigateTo('/venues')">查看详情</el-button>
            </div>
          </template>
          <div class="card-content">
            <el-statistic :value="venueSummary.total">
              <template #title>
                <div style="display: inline-flex; align-items: center">
                  总场地数
                </div>
              </template>
            </el-statistic>
            <div class="status-list">
              <div class="status-item">
                <div class="status-label">使用中:</div>
                <div class="status-value">{{ venueSummary.inUse }}</div>
              </div>
              <div class="status-item">
                <div class="status-label">空闲:</div>
                <div class="status-value">{{ venueSummary.available }}</div>
              </div>
              <div class="status-item">
                <div class="status-label">维护中:</div>
                <div class="status-value">{{ venueSummary.maintenance }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="dashboard-card">
          <template #header>
            <div class="card-header">
              <span>客户统计</span>
              <el-button class="button" text @click="navigateTo('/customers')">查看详情</el-button>
            </div>
          </template>
          <div class="card-content">
            <el-statistic :value="customerSummary.total">
              <template #title>
                <div style="display: inline-flex; align-items: center">
                  总客户数
                </div>
              </template>
            </el-statistic>
            <div class="status-list">
              <div class="status-item">
                <div class="status-label">会员:</div>
                <div class="status-value">{{ customerSummary.members }}</div>
              </div>
              <div class="status-item">
                <div class="status-label">非会员:</div>
                <div class="status-value">{{ customerSummary.nonMembers }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="dashboard-card">
          <template #header>
            <div class="card-header">
              <span>商品库存</span>
              <el-button class="button" text @click="navigateTo('/products')">查看详情</el-button>
            </div>
          </template>
          <div class="card-content">
            <el-statistic :value="productSummary.total">
              <template #title>
                <div style="display: inline-flex; align-items: center">
                  商品种类
                </div>
              </template>
            </el-statistic>
            <div class="status-list">
              <div class="status-item">
                <div class="status-label">低库存:</div>
                <div class="status-value">{{ productSummary.lowStock }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="dashboard-card">
          <template #header>
            <div class="card-header">
              <span>今日收入</span>
              <el-button class="button" text @click="navigateTo('/finance')">查看详情</el-button>
            </div>
          </template>
          <div class="card-content">
            <el-statistic :value="financeSummary.todayIncome" :precision="2" :value-style="{ color: '#409EFF' }">
              <template #title>
                <div style="display: inline-flex; align-items: center">
                  收入(元)
                </div>
              </template>
            </el-statistic>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// 模拟数据
const venueSummary = ref({
  total: 10,
  inUse: 3,
  available: 6,
  maintenance: 1
});

const customerSummary = ref({
  total: 120,
  members: 45,
  nonMembers: 75
});

const productSummary = ref({
  total: 25,
  lowStock: 3
});

const financeSummary = ref({
  todayIncome: 2580.50
});

// 导航到指定路由
const navigateTo = (path) => {
  router.push(path);
};

onMounted(() => {
  // 这里可以添加实际的API调用来获取数据
  console.log('Dashboard mounted');
});
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.dashboard-card {
  margin-bottom: 20px;
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-content {
  padding: 10px 0;
}

.status-list {
  margin-top: 20px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.status-label {
  color: #606266;
}

.status-value {
  font-weight: bold;
}
</style> 