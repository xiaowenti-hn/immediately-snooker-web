<template>
  <div class="customer-management">
    <div class="header">
      <h1>客户管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="showRegisterModal">
          <el-icon><Plus /></el-icon>注册新客户
        </el-button>
        <el-button @click="exportCustomerData">
          <el-icon><Download /></el-icon>导出数据
        </el-button>
      </div>
    </div>

    <div class="search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索客户（姓名/电话/邮箱）"
        @input="handleSearch"
        clearable
        style="width: 300px"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-select v-model="memberFilter" placeholder="会员状态" style="width: 120px; margin-left: 10px">
        <el-option label="全部" value="" />
        <el-option label="会员" value="true" />
        <el-option label="非会员" value="false" />
      </el-select>
    </div>

    <el-table
      :data="filteredCustomers"
      style="width: 100%"
      v-loading="loading"
      @sort-change="handleSortChange"
    >
      <el-table-column prop="id" label="ID" width="80" sortable />
      <el-table-column prop="name" label="姓名" sortable />
      <el-table-column prop="phone" label="电话" />
      <el-table-column prop="email" label="邮箱" />
      <el-table-column prop="member" label="会员状态" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.member ? 'success' : 'info'">
            {{ scope.row.member ? '会员' : '非会员' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="balance" label="余额" sortable>
        <template #default="scope">
          <span>¥{{ scope.row.balance.toFixed(2) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280">
        <template #default="scope">
          <el-button-group>
            <el-button size="small" @click="showCustomerDetail(scope.row)">
              <el-icon><View /></el-icon>详情
            </el-button>
            <el-button size="small" type="primary" @click="showEditModal(scope.row)">
              <el-icon><Edit /></el-icon>编辑
            </el-button>
            <el-button size="small" type="success" @click="showRechargeModal(scope.row)">
              <el-icon><Money /></el-icon>充值
            </el-button>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      :model-value="currentPage"
      @update:model-value="currentPage = $event"
      :page-size="pageSize"
      @update:page-size="pageSize = $event"
      :total="totalCustomers"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      class="pagination"
    />

    <!-- 注册新客户对话框 -->
    <el-dialog v-model="isRegisterModalVisible" title="注册新客户" width="500px">
      <el-form
        ref="registerForm"
        :model="newCustomer"
        :rules="customerRules"
        label-width="80px"
      >
        <el-form-item label="姓名" prop="name">
          <el-input v-model="newCustomer.name" />
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="newCustomer.phone" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="newCustomer.email" />
        </el-form-item>
        <el-form-item label="会员">
          <el-switch v-model="newCustomer.member" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="isRegisterModalVisible = false">取消</el-button>
        <el-button type="primary" @click="registerCustomer">确认</el-button>
      </template>
    </el-dialog>

    <!-- 编辑客户对话框 -->
    <el-dialog v-model="isEditModalVisible" title="编辑客户信息" width="500px">
      <el-form
        ref="editForm"
        :model="editingCustomer"
        :rules="customerRules"
        label-width="80px"
      >
        <el-form-item label="姓名" prop="name">
          <el-input v-model="editingCustomer.name" />
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="editingCustomer.phone" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="editingCustomer.email" />
        </el-form-item>
        <el-form-item label="会员">
          <el-switch v-model="editingCustomer.member" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="isEditModalVisible = false">取消</el-button>
        <el-button type="primary" @click="updateCustomer">保存</el-button>
      </template>
    </el-dialog>

    <!-- 充值对话框 -->
    <el-dialog v-model="isRechargeModalVisible" title="账户充值" width="400px">
      <el-form ref="rechargeForm" :model="rechargeForm" label-width="80px">
        <el-form-item label="当前余额">
          <span>¥{{ selectedCustomer?.balance?.toFixed(2) || '0.00' }}</span>
        </el-form-item>
        <el-form-item label="充值金额" prop="amount">
          <el-input-number
            v-model="rechargeForm.amount"
            :min="0"
            :precision="2"
            :step="100"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="isRechargeModalVisible = false">取消</el-button>
        <el-button type="primary" @click="rechargeAccount">确认充值</el-button>
      </template>
    </el-dialog>

    <!-- 客户详情对话框 -->
    <el-dialog v-model="isDetailModalVisible" title="客户详情" width="800px">
      <template v-if="selectedCustomer">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="ID">{{ selectedCustomer.id }}</el-descriptions-item>
          <el-descriptions-item label="姓名">{{ selectedCustomer.name }}</el-descriptions-item>
          <el-descriptions-item label="电话">{{ selectedCustomer.phone }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ selectedCustomer.email }}</el-descriptions-item>
          <el-descriptions-item label="会员状态">
            <el-tag :type="selectedCustomer.member ? 'success' : 'info'">
              {{ selectedCustomer.member ? '会员' : '非会员' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="账户余额">
            ¥{{ selectedCustomer.balance?.toFixed(2) || '0.00' }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="consumption-records" v-loading="loadingRecords">
          <h3>消费记录</h3>
          <el-table :data="customerRecords" style="width: 100%">
            <el-table-column prop="timestamp" label="时间" :formatter="formatDate" />
            <el-table-column prop="amount" label="金额">
              <template #default="scope">
                ¥{{ scope.row.amount.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="venueId" label="场地" />
            <el-table-column prop="productId" label="商品" />
          </el-table>
          <el-pagination
            :model-value="recordsPage"
            @update:model-value="recordsPage = $event"
            :page-size="10"
            :total="totalRecords"
            layout="prev, pager, next"
            @current-change="fetchCustomerRecords"
            class="records-pagination"
          />
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import axios from 'axios';
import { Plus, Edit, View, Download, Search, Money } from '@element-plus/icons-vue';

// 数据状态
const customers = ref([]);
const loading = ref(false);
const loadingRecords = ref(false);
const searchQuery = ref('');
const memberFilter = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const totalCustomers = ref(0);
const sortBy = ref({ prop: '', order: '' });

// 表单数据
const newCustomer = ref({
  name: '',
  phone: '',
  email: '',
  member: false,
  balance: 0
});

const editingCustomer = ref({});
const selectedCustomer = ref(null);
const customerRecords = ref([]);
const recordsPage = ref(1);
const totalRecords = ref(0);

const rechargeForm = ref({
  amount: 100
});

// 对话框状态
const isRegisterModalVisible = ref(false);
const isEditModalVisible = ref(false);
const isRechargeModalVisible = ref(false);
const isDetailModalVisible = ref(false);

// 表单验证规则
const customerRules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入电话号码', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
};

// 计算属性
const filteredCustomers = computed(() => {
  let result = customers.value;
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(customer => 
      customer.name.toLowerCase().includes(query) ||
      customer.phone.includes(query) ||
      customer.email.toLowerCase().includes(query)
    );
  }

  if (memberFilter.value !== '') {
    result = result.filter(customer => 
      customer.member === (memberFilter.value === 'true')
    );
  }

  return result;
});

// 方法
const fetchCustomers = async () => {
  loading.value = true;
  try {
    const response = await axios.get('/api/customers');
    if (response.data && Array.isArray(response.data)) {
      customers.value = response.data;
      totalCustomers.value = response.data.length;
    } else {
      customers.value = [];
      totalCustomers.value = 0;
      ElMessage.warning('获取到的客户数据格式不正确');
    }
  } catch (error) {
    customers.value = [];
    totalCustomers.value = 0;
    ElMessage.error('获取客户列表失败');
    console.error('Error fetching customers:', error);
  } finally {
    loading.value = false;
  }
};

const fetchCustomerRecords = async (customerId) => {
  loadingRecords.value = true;
  try {
    const response = await axios.get(`/api/consumption-records?customerId=${customerId}&page=${recordsPage.value}`);
    customerRecords.value = response.data;
    totalRecords.value = response.headers['x-total-count'] || 0;
  } catch (error) {
    ElMessage.error('获取消费记录失败');
    console.error('Error fetching records:', error);
  } finally {
    loadingRecords.value = false;
  }
};

const registerCustomer = async () => {
  try {
    await axios.post('/api/customers', newCustomer.value);
    ElMessage.success('客户注册成功');
    isRegisterModalVisible.value = false;
    fetchCustomers();
    newCustomer.value = { name: '', phone: '', email: '', member: false, balance: 0 };
  } catch (error) {
    ElMessage.error('客户注册失败');
    console.error('Error registering customer:', error);
  }
};

const updateCustomer = async () => {
  try {
    await axios.put(`/api/customers/${editingCustomer.value.id}`, editingCustomer.value);
    ElMessage.success('客户信息更新成功');
    isEditModalVisible.value = false;
    fetchCustomers();
  } catch (error) {
    ElMessage.error('客户信息更新失败');
    console.error('Error updating customer:', error);
  }
};

const rechargeAccount = async () => {
  if (rechargeForm.value.amount <= 0) {
    ElMessage.error('充值金额必须大于0');
    return;
  }
  try {
    console.log('Recharge amount:', rechargeForm.value.amount);
    await axios.post(`/api/customers/${selectedCustomer.value.id}/recharge`, {
      amount: rechargeForm.value.amount
    });
    ElMessage.success('充值成功');
    isRechargeModalVisible.value = false;
    fetchCustomers();
  } catch (error) {
    ElMessage.error('充值失败');
    console.error('Error recharging account:', error);
  }
};

const showCustomerDetail = (customer) => {
  selectedCustomer.value = customer;
  isDetailModalVisible.value = true;
  recordsPage.value = 1;
  fetchCustomerRecords(customer.id);
};

const showEditModal = (customer) => {
  editingCustomer.value = { ...customer };
  isEditModalVisible.value = true;
};

const showRechargeModal = (customer) => {
  selectedCustomer.value = customer;
  rechargeForm.value.amount = 100;
  isRechargeModalVisible.value = true;
};

const showRegisterModal = () => {
  isRegisterModalVisible.value = true;
  newCustomer.value = {
    name: '',
    phone: '',
    email: '',
    member: false,
    balance: 0
  };
};

const handleSearch = () => {
  currentPage.value = 1;
};

const handleSortChange = ({ prop, order }) => {
  sortBy.value = { prop, order };
};

const handleSizeChange = (val) => {
  pageSize.value = val;
  currentPage.value = 1;
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
};

const formatDate = (row) => {
  return new Date(row.timestamp).toLocaleString();
};

const exportCustomerData = async () => {
  try {
    const response = await axios.get('/api/customers/export', {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'customers.xlsx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    ElMessage.error('导出失败');
    console.error('Error exporting data:', error);
  }
};

// 生命周期钩子
onMounted(() => {
  fetchCustomers();
});
</script>

<style scoped>
.customer-management {
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

.search-bar {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.consumption-records {
  margin-top: 20px;
}

.records-pagination {
  margin-top: 10px;
  display: flex;
  justify-content: center;
}

.el-descriptions {
  margin-bottom: 20px;
}
</style>