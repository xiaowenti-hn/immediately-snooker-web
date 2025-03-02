<template>
  <div class="finance-management">
    <div class="header">
      <h1>财务管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="showAddExpenseModal">
          <el-icon><Plus /></el-icon>记录支出
        </el-button>
        <el-button @click="exportData">
          <el-icon><Download /></el-icon>导出数据
        </el-button>
      </div>
    </div>

    <!-- 财务统计卡片 -->
    <div class="statistics-cards">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-card class="today-income">
            <template #header>
              <div class="card-header">
                <span>今日收入</span>
                <el-tag :type="statistics.todayIncomeGrowth >= 0 ? 'success' : 'danger'" size="small">
                  {{ (statistics.todayIncomeGrowth || 0).toFixed(2) }}%
                </el-tag>
              </div>
            </template>
            <h2>¥{{ (statistics.todayIncome || 0).toFixed(2) }}</h2>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="month-profit">
            <template #header>
              <div class="card-header">
                <span>本月利润</span>
                <el-tag :type="statistics.monthProfitGrowth >= 0 ? 'success' : 'danger'" size="small">
                  {{ (statistics.monthProfitGrowth || 0).toFixed(2) }}%
                </el-tag>
              </div>
            </template>
            <h2>¥{{ (statistics.monthProfit || 0).toFixed(2) }}</h2>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="month-expense">
            <template #header>
              <div class="card-header">
                <span>本月支出</span>
                <el-tag :type="statistics.monthExpenseGrowth <= 0 ? 'success' : 'danger'" size="small">
                  {{ (statistics.monthExpenseGrowth || 0).toFixed(2) }}%
                </el-tag>
              </div>
            </template>
            <h2>¥{{ (statistics.monthExpense || 0).toFixed(2) }}</h2>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 收入支出分类统计 -->
    <div class="category-statistics">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card class="income-categories">
            <template #header>
              <div class="card-header">
                <span>本月收入构成</span>
                <span class="total">总计：¥{{ (statistics.monthIncome || 0).toFixed(2) }}</span>
              </div>
            </template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="场地收入">¥{{ (statistics.venueIncome || 0).toFixed(2) }}</el-descriptions-item>
              <el-descriptions-item label="商品收入">¥{{ (statistics.productIncome || 0).toFixed(2) }}</el-descriptions-item>
              <el-descriptions-item label="会员收入">¥{{ (statistics.memberIncome || 0).toFixed(2) }}</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="expense-categories">
            <template #header>
              <div class="card-header">
                <span>本月支出构成</span>
                <span class="total">总计：¥{{ (statistics.monthExpense || 0).toFixed(2) }}</span>
              </div>
            </template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="水电费用">¥{{ (statistics.utilityExpense || 0).toFixed(2) }}</el-descriptions-item>
              <el-descriptions-item label="租金费用">¥{{ (statistics.rentExpense || 0).toFixed(2) }}</el-descriptions-item>
              <el-descriptions-item label="工资费用">¥{{ (statistics.salaryExpense || 0).toFixed(2) }}</el-descriptions-item>
              <el-descriptions-item label="采购费用">¥{{ (statistics.purchaseExpense || 0).toFixed(2) }}</el-descriptions-item>
              <el-descriptions-item label="维护费用">¥{{ (statistics.maintenanceExpense || 0).toFixed(2) }}</el-descriptions-item>
              <el-descriptions-item label="其他费用">¥{{ (statistics.otherExpense || 0).toFixed(2) }}</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 交易记录列表 -->
    <div class="transaction-list">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>交易记录</span>
            <div class="filters">
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                @change="handleSearch"
              />
              <el-select v-model="typeFilter" placeholder="交易类型" style="width: 120px; margin-left: 10px">
                <el-option label="全部" value="" />
                <el-option label="收入" value="INCOME" />
                <el-option label="支出" value="EXPENSE" />
              </el-select>
              <el-select v-model="categoryFilter" placeholder="交易类别" style="width: 120px; margin-left: 10px">
                <el-option label="全部" value="" />
                <el-option-group label="收入类别">
                  <el-option label="场地" value="VENUE" />
                  <el-option label="商品" value="PRODUCT" />
                  <el-option label="会员" value="MEMBER" />
                </el-option-group>
                <el-option-group label="支出类别">
                  <el-option label="水电" value="UTILITY" />
                  <el-option label="租金" value="RENT" />
                  <el-option label="工资" value="SALARY" />
                  <el-option label="采购" value="PURCHASE" />
                  <el-option label="维护" value="MAINTENANCE" />
                  <el-option label="其他" value="OTHER" />
                </el-option-group>
              </el-select>
            </div>
          </div>
        </template>

        <el-table
          :data="transactions"
          style="width: 100%"
          v-loading="loading"
        >
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="type" label="类型" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.type === 'INCOME' ? 'success' : 'danger'">
                {{ scope.row.type === 'INCOME' ? '收入' : '支出' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="category" label="类别" width="100">
            <template #default="scope">
              {{ getCategoryText(scope.row.category) }}
            </template>
          </el-table-column>
          <el-table-column prop="amount" label="金额">
            <template #default="scope">
              <span :class="scope.row.type === 'INCOME' ? 'income-amount' : 'expense-amount'">
                {{ scope.row.type === 'INCOME' ? '+' : '-' }}¥{{ formatAmount(scope.row.amount) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" />
          <el-table-column prop="operator" label="操作人" width="120" />
          <el-table-column prop="createTime" label="时间" :formatter="formatDate" width="180" />
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="scope">
              <el-button
                v-if="scope.row.type === 'EXPENSE' && isToday(scope.row.createTime)"
                type="danger"
                size="small"
                @click="deleteTransaction(scope.row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
    </el-table>

        <el-pagination
          :model-value="currentPage"
          @update:model-value="currentPage = $event"
          :page-size="pageSize"
          @update:page-size="pageSize = $event"
          :total="totalTransactions"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          class="pagination"
        />
      </el-card>
    </div>

    <!-- 添加支出对话框 -->
    <el-dialog v-model="isExpenseModalVisible" title="记录支出" width="500px">
      <el-form
        ref="expenseForm"
        :model="newExpense"
        :rules="expenseRules"
        label-width="80px"
      >
        <el-form-item label="类别" prop="category">
          <el-select v-model="newExpense.category" placeholder="请选择支出类别" style="width: 100%">
            <el-option label="水电" value="UTILITY" />
            <el-option label="租金" value="RENT" />
            <el-option label="工资" value="SALARY" />
            <el-option label="采购" value="PURCHASE" />
            <el-option label="维护" value="MAINTENANCE" />
            <el-option label="其他" value="OTHER" />
          </el-select>
        </el-form-item>
        <el-form-item label="金额" prop="amount">
          <el-input-number
            v-model="newExpense.amount"
            :min="0"
            :precision="2"
            :step="100"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="newExpense.description"
            type="textarea"
            :rows="3"
            placeholder="请输入支出描述"
          />
        </el-form-item>
        <el-form-item label="操作人" prop="operator">
          <el-input v-model="newExpense.operator" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="isExpenseModalVisible = false">取消</el-button>
        <el-button type="primary" @click="addExpense">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Download } from '@element-plus/icons-vue';
import axios from 'axios';

// 数据状态
const transactions = ref([]);
const statistics = ref({
  todayIncome: 0,
  todayIncomeGrowth: 0,
  monthIncome: 0,
  monthIncomeGrowth: 0,
  monthExpense: 0,
  monthExpenseGrowth: 0,
  monthProfit: 0,
  monthProfitGrowth: 0,
  venueIncome: 0,
  productIncome: 0,
  memberIncome: 0,
  utilityExpense: 0,
  rentExpense: 0,
  salaryExpense: 0,
  purchaseExpense: 0,
  maintenanceExpense: 0,
  otherExpense: 0
});
const loading = ref(false);
const dateRange = ref([]);
const typeFilter = ref('');
const categoryFilter = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const totalTransactions = ref(0);

// 表单数据
const newExpense = ref({
  category: '',
  amount: 100,
  description: '',
  operator: ''
});

// 对话框状态
const isExpenseModalVisible = ref(false);

// 表单验证规则
const expenseRules = {
  category: [
    { required: true, message: '请选择支出类别', trigger: 'change' }
  ],
  amount: [
    { required: true, message: '请输入支出金额', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入支出描述', trigger: 'blur' }
  ],
  operator: [
    { required: true, message: '请输入操作人', trigger: 'blur' }
  ]
};

// 方法
const fetchTransactions = async () => {
  if (!dateRange.value || !dateRange.value[0] || !dateRange.value[1]) {
    ElMessage.warning('请选择日期范围');
    return;
  }

  loading.value = true;
  try {
    const response = await axios.get('/api/finance/transactions', {
      params: {
        startDate: dateRange.value[0].toISOString(),
        endDate: dateRange.value[1].toISOString(),
        type: typeFilter.value || null,
        category: categoryFilter.value || null,
        page: currentPage.value,
        size: pageSize.value
      }
    });

    if (response.data) {
      transactions.value = response.data;
      totalTransactions.value = parseInt(response.headers['x-total-count'] || '0');
    }
  } catch (error) {
    console.error('Error fetching transactions:', error);
    ElMessage.error('获取交易记录失败');
    transactions.value = [];
    totalTransactions.value = 0;
  } finally {
    loading.value = false;
  }
};

const fetchStatistics = async () => {
  try {
    const response = await axios.get('/api/finance/statistics');
    if (response.data) {
      statistics.value = {
        ...statistics.value, // 保留默认值
        ...response.data // 使用服务器返回的数据覆盖
      };
    }
  } catch (error) {
    console.error('Error fetching statistics:', error);
    ElMessage.error('获取统计数据失败');
  }
};

const addExpense = async () => {
  try {
    await axios.post('/api/finance/expenses', newExpense.value);
    ElMessage.success('支出记录添加成功');
    isExpenseModalVisible.value = false;
    fetchTransactions();
    fetchStatistics();
    newExpense.value = { category: '', amount: 100, description: '', operator: '' };
  } catch (error) {
    ElMessage.error('支出记录添加失败');
    console.error('Error adding expense:', error);
  }
};

const deleteTransaction = async (transaction) => {
  try {
    await ElMessageBox.confirm('确定要删除这条支出记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    await axios.delete(`/api/finance/expenses/${transaction.id}`);
    ElMessage.success('支出记录删除成功');
    fetchTransactions();
    fetchStatistics();
      } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('支出记录删除失败');
      console.error('Error deleting transaction:', error);
    }
  }
};

const exportData = async () => {
  if (!dateRange.value || !dateRange.value[0] || !dateRange.value[1]) {
    ElMessage.warning('请选择导出日期范围');
    return;
  }

  try {
    const response = await axios.get('/api/finance/export', {
      params: {
        startDate: dateRange.value[0].toISOString(),
        endDate: dateRange.value[1].toISOString(),
        type: typeFilter.value || null,
        category: categoryFilter.value || null
      },
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'finance.xlsx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    ElMessage.error('导出失败');
    console.error('Error exporting data:', error);
  }
};

const showAddExpenseModal = () => {
  isExpenseModalVisible.value = true;
};

const handleSearch = () => {
  currentPage.value = 1;
  fetchTransactions();
};

const handleSizeChange = (val) => {
  pageSize.value = val;
  currentPage.value = 1;
  fetchTransactions();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchTransactions();
};

const formatDate = (row) => {
  return new Date(row.createTime).toLocaleString();
};

const isToday = (date) => {
  const today = new Date();
  const target = new Date(date);
  return today.toDateString() === target.toDateString();
};

const getCategoryText = (category) => {
  const categoryMap = {
    VENUE: '场地',
    PRODUCT: '商品',
    MEMBER: '会员',
    UTILITY: '水电',
    RENT: '租金',
    SALARY: '工资',
    PURCHASE: '采购',
    MAINTENANCE: '维护',
    OTHER: '其他'
  };
  return categoryMap[category] || category;
};

const formatAmount = (amount) => {
  if (typeof amount === 'number') {
    return amount.toFixed(2);
  }
  return '0.00';
};

// 生命周期钩子
onMounted(() => {
  // 设置默认日期范围为本月
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  dateRange.value = [start, end];

  fetchStatistics();
  fetchTransactions();
});
</script>

<style scoped>
.finance-management {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h1 {
  margin: 0;
}

.statistics-cards {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-statistics {
  margin-bottom: 20px;
}

.total {
  font-size: 14px;
  color: #666;
}

.transaction-list {
  margin-bottom: 20px;
}

.filters {
  display: flex;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.income-amount {
  color: #67c23a;
}

.expense-amount {
  color: #f56c6c;
}

:deep(.el-card__header) {
  padding: 15px 20px;
}

:deep(.el-descriptions__label) {
  width: 120px;
}
</style>