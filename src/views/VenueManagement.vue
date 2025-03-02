<template>
  <div class="venue-management">
    <div class="header">
    <h1>场地管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="showAddVenueModal">
          <el-icon><Plus /></el-icon>添加场地
        </el-button>
        <el-button @click="exportVenueData">
          <el-icon><Download /></el-icon>导出数据
        </el-button>
      </div>
    </div>

    <div class="search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索场地（编号/类型）"
        @input="handleSearch"
        clearable
        style="width: 300px"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-select v-model="statusFilter" placeholder="场地状态" style="width: 120px; margin-left: 10px">
        <el-option label="全部" value="" />
        <el-option label="空闲" value="AVAILABLE" />
        <el-option label="使用中" value="IN_USE" />
        <el-option label="维护中" value="MAINTENANCE" />
        <el-option label="预订中" value="RESERVED" />
      </el-select>
      <el-select v-model="typeFilter" placeholder="场地类型" style="width: 120px; margin-left: 10px">
        <el-option label="全部" value="" />
        <el-option label="斯诺克" value="SNOOKER" />
        <el-option label="美式台球" value="POOL" />
        <el-option label="中式八球" value="CHINESE_8_BALL" />
      </el-select>
    </div>

    <div class="venue-grid">
      <el-row :gutter="20">
        <el-col :span="6" v-for="(venue, index) in filteredVenues" :key="venue?.id || index">
          <el-card :class="['venue-card', getCardClass(venue?.status)]">
            <template #header>
              <div class="card-header">
                <span>{{ getVenueTypeText(venue?.venueType) }} - {{ venue?.id || '未知' }}号台</span>
                <el-tag :type="getStatusType(venue?.status)">{{ getStatusText(venue?.status) }}</el-tag>
              </div>
            </template>
            <div class="card-content">
              <div class="venue-info">
                <p>当前费率：¥{{ venue?.hourlyRate?.toFixed(2) || '0.00' }}/小时</p>
                <p v-if="venue?.status === 'IN_USE'">已使用：{{ getUsedTime(venue?.startTime) }}</p>
                <p v-if="venue?.status === 'RESERVED'">预订时间：{{ formatDateTime(venue?.reservationTime) }}</p>
              </div>
              <div class="card-actions">
                <el-button-group>
                  <el-button 
                    size="small" 
                    :type="venue?.status === 'AVAILABLE' ? 'primary' : 'info'"
                    :disabled="venue?.status !== 'AVAILABLE'"
                    @click="showStartGameModal(venue)"
                  >
                    开始计费
                  </el-button>
                  <el-button 
                    size="small" 
                    type="success" 
                    :disabled="venue?.status !== 'IN_USE'"
                    @click="endGame(venue)"
                  >
                    结束计费
                  </el-button>
                </el-button-group>
                <el-dropdown trigger="click" @command="handleCommand($event, venue)">
                  <el-button size="small">
                    更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="edit">编辑信息</el-dropdown-item>
                      <el-dropdown-item command="reserve" :disabled="venue?.status !== 'AVAILABLE'">
                        预订场地
                      </el-dropdown-item>
                      <el-dropdown-item command="maintain" :disabled="venue?.status !== 'AVAILABLE' && venue?.status !== 'MAINTENANCE'">
                        {{ venue?.status === 'MAINTENANCE' ? '结束维护' : '开始维护' }}
                      </el-dropdown-item>
                      <el-dropdown-item command="purchase" :disabled="venue?.status !== 'IN_USE'">
                        购买商品
                      </el-dropdown-item>
                      <el-dropdown-item command="records">
                        查看消费记录
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 添加场地对话框 -->
    <el-dialog v-model="isAddVenueModalVisible" title="添加场地" width="500px">
      <el-form
        ref="venueForm"
        :model="newVenue"
        :rules="venueRules"
        label-width="100px"
      >
        <el-form-item label="场地类型" prop="venueType">
          <el-select v-model="newVenue.venueType" placeholder="请选择场地类型">
            <el-option label="斯诺克" value="SNOOKER" />
            <el-option label="美式台球" value="POOL" />
            <el-option label="中式八球" value="CHINESE_8_BALL" />
          </el-select>
        </el-form-item>
        <el-form-item label="每小时费率" prop="hourlyRate">
          <el-input-number 
            v-model="newVenue.hourlyRate" 
            :min="0" 
            :precision="2" 
            :step="10"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="isAddVenueModalVisible = false">取消</el-button>
        <el-button type="primary" @click="addVenue">确认</el-button>
      </template>
    </el-dialog>

    <!-- 开始计费对话框 -->
    <el-dialog v-model="isStartGameModalVisible" title="开始计费" width="400px">
      <el-form ref="startGameForm" :model="gameForm" label-width="100px">
        <el-form-item label="场地">
          <span>{{ getVenueTypeText(selectedVenue.venueType) }} - {{ selectedVenue.id }}号台</span>
        </el-form-item>
        <el-form-item label="当前费率">
          <span>¥{{ selectedVenue.hourlyRate.toFixed(2) }}/小时</span>
        </el-form-item>
        <el-form-item label="客户类型">
          <el-select v-model="gameForm.customerType" placeholder="选择客户或游客">
            <el-option label="客户" value="member" />
            <el-option label="游客" value="guest" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="gameForm.customerType === 'member'" label="手机号" prop="phone">
          <el-input v-model="gameForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="限时">
          <el-switch v-model="gameForm.isLimitedTime" active-text="是" inactive-text="否" />
        </el-form-item>
        <el-form-item v-if="gameForm.isLimitedTime" label="限时（分钟）" prop="limitTime">
          <el-input-number v-model="gameForm.limitTime" :min="1" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="gameForm.notes" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="isStartGameModalVisible = false">取消</el-button>
        <el-button type="primary" @click="startGame">确认</el-button>
      </template>
    </el-dialog>

    <!-- 结束计费对话框 -->
    <el-dialog v-model="isEndGameModalVisible" title="结束计费" width="500px">
      <template v-if="selectedVenue">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="场地">
            {{ getVenueTypeText(selectedVenue.venueType) }} - {{ selectedVenue.id }}号台
          </el-descriptions-item>
          <el-descriptions-item label="开始时间">
            {{ formatDateTime(selectedVenue.startTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="使用时长">
            {{ getUsedTime(selectedVenue.startTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="场地费用">
            ¥{{ calculateFee(selectedVenue.startTime, selectedVenue.hourlyRate) }}
          </el-descriptions-item>
          
          <!-- 显示购买的商品 -->
          <el-descriptions-item v-if="selectedVenue.purchasedProducts && selectedVenue.purchasedProducts.length > 0" label="购买商品">
            <el-table :data="selectedVenue.purchasedProducts" size="small">
              <el-table-column prop="name" label="商品名称" />
              <el-table-column prop="price" label="单价">
                <template #default="scope">
                  ¥{{ scope.row.price.toFixed(2) }}
                </template>
              </el-table-column>
              <el-table-column prop="quantity" label="数量" />
              <el-table-column label="小计">
                <template #default="scope">
                  ¥{{ (scope.row.price * (scope.row.quantity || 1)).toFixed(2) }}
                </template>
              </el-table-column>
            </el-table>
          </el-descriptions-item>
          
          <el-descriptions-item label="总费用">
            <span class="total-fee">
              ¥{{ calculateTotalFee(selectedVenue) }}
            </span>
          </el-descriptions-item>
        </el-descriptions>
      </template>
      <template #footer>
        <el-button @click="isEndGameModalVisible = false">取消</el-button>
        <el-button type="primary" @click="endGame">确认结算</el-button>
      </template>
    </el-dialog>

    <!-- 预订场地对话框 -->
    <el-dialog v-model="isReserveModalVisible" title="预订场地" width="500px">
      <el-form ref="reserveForm" :model="reserveForm" :rules="reserveRules" label-width="100px">
        <el-form-item label="客户" prop="customerId">
          <el-select
            v-model="reserveForm.customerId"
            filterable
            remote
            placeholder="请输入客户名称搜索"
            :remote-method="searchCustomers"
            :loading="loading"
          >
            <el-option
              v-for="customer in customers"
              :key="customer.id"
              :label="customer.name"
              :value="customer.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="预订时间" prop="reservationTime">
          <el-date-picker
            v-model="reserveForm.reservationTime"
            type="datetime"
            placeholder="选择预订时间"
            :disabled-date="disabledDate"
            :disabled-time="disabledTime"
          />
        </el-form-item>
        <el-form-item label="预计时长" prop="duration">
          <el-input-number
            v-model="reserveForm.duration"
            :min="1"
            :max="24"
            :step="0.5"
          />
          <span class="unit">小时</span>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="reserveForm.notes" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="isReserveModalVisible = false">取消</el-button>
        <el-button type="primary" @click="reserveVenue">确认预订</el-button>
      </template>
    </el-dialog>

    <!-- 购买商品对话框 -->
    <el-dialog v-model="isPurchaseModalVisible" title="购买商品" width="800px">
      <div class="product-search-bar">
        <el-input
          v-model="productSearchQuery"
          placeholder="搜索商品（名称/类别）"
          @input="handleProductSearch"
          clearable
          style="width: 300px"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="productCategoryFilter" placeholder="商品类别" style="width: 120px; margin-left: 10px">
          <el-option label="全部" value="" />
          <el-option label="饮料" value="BEVERAGE" />
          <el-option label="零食" value="SNACK" />
          <el-option label="器材" value="EQUIPMENT" />
          <el-option label="其他" value="OTHER" />
        </el-select>
        <el-select v-model="productStatusFilter" placeholder="商品状态" style="width: 120px; margin-left: 10px">
          <el-option label="全部" value="" />
          <el-option label="在售" value="true" />
          <el-option label="下架" value="false" />
        </el-select>
      </div>

      <div class="product-list" v-loading="loadingProducts">
        <el-table :data="filteredProducts" style="width: 100%">
          <el-table-column prop="name" label="商品名称" />
          <el-table-column prop="category" label="类别">
            <template #default="scope">
              <el-tag :type="getCategoryType(scope.row.category)">
                {{ getCategoryText(scope.row.category) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="price" label="价格">
            <template #default="scope">
              ¥{{ scope.row.price.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="stock" label="库存" />
          <el-table-column label="操作" width="120">
            <template #default="scope">
              <el-button 
                size="small" 
                type="primary" 
                :disabled="scope.row.stock <= 0 || !scope.row.active"
                @click="addToCart(scope.row)"
              >
                加入购物车
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="cart-section" v-if="cart.length > 0">
        <h3>购物车</h3>
        <el-table :data="cart" style="width: 100%">
          <el-table-column prop="name" label="商品名称" />
          <el-table-column prop="price" label="单价">
            <template #default="scope">
              ¥{{ scope.row.price.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量">
            <template #default="scope">
              <el-input-number 
                v-model="scope.row.quantity" 
                :min="1" 
                :max="scope.row.stock"
                size="small"
                @change="updateCartTotal"
              />
            </template>
          </el-table-column>
          <el-table-column label="小计">
            <template #default="scope">
              ¥{{ (scope.row.price * scope.row.quantity).toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80">
            <template #default="scope">
              <el-button 
                size="small" 
                type="danger" 
                @click="removeFromCart(scope.$index)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="cart-total">
          <span>总计: ¥{{ cartTotal.toFixed(2) }}</span>
        </div>
      </div>

      <template #footer>
        <el-button @click="isPurchaseModalVisible = false">取消</el-button>
        <el-button type="primary" @click="checkout" :disabled="cart.length === 0">结算</el-button>
      </template>
    </el-dialog>

    <!-- 结算对话框 -->
    <el-dialog
      v-model="settleModalVisible"
      title="结算详情"
      width="800px"
    >
      <div class="settle-content">
        <!-- 场地基本信息 -->
        <div class="venue-info">
          <h3>场地使用信息</h3>
          <p>场地编号: {{ currentVenue?.id }}</p>
          <p>使用客户: {{ currentVenue?.currentCustomerName }}</p>
          <p>开始时间: {{ formatDateTime(currentVenue?.startTime) }}</p>
          <p>使用时长: {{ calculateUsedTime(currentVenue?.startTime) }}</p>
          <p>场地费用: {{ calculateVenueFee(currentVenue) }}元</p>
        </div>

        <el-divider />

        <!-- 消费记录列表 -->
        <div class="consumption-list">
          <h3>消费记录</h3>
          <el-table 
            :data="consumptionRecords" 
            style="width: 100%"
            @row-click="showConsumptionDetail"
          >
            <el-table-column prop="customerName" label="消费客户" width="120" />
            <el-table-column label="消费类型" width="120">
              <template #default="{ row }">
                {{ row.productId ? '商品消费' : '场地计费' }}
              </template>
            </el-table-column>
            <el-table-column label="消费内容" min-width="200">
              <template #default="{ row }">
                <template v-if="row.productId">
                  {{ row.productName }} × {{ row.quantity }}
                  <template v-if="row.quantity && row.amount">
                    (单价: {{ (row.amount / row.quantity).toFixed(2) }}元)
                  </template>
                </template>
                <template v-else>
                  {{ row.productName || '场地使用费' }}
                  <el-tag v-if="row.id === -1" type="warning" size="small">计费中</el-tag>
                </template>
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="金额" width="120">
              <template #default="{ row }">
                {{ row.amount.toFixed(2) }}元
              </template>
            </el-table-column>
            <el-table-column prop="timestamp" label="时间" width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.timestamp) }}
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.id === -1 ? 'warning' : (row.settled ? 'success' : 'info')">
                  {{ row.id === -1 ? '计费中' : (row.settled ? '已结算' : '未结算') }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180">
              <template #default="{ row }">
                <el-button 
                  type="primary" 
                  size="small" 
                  @click.stop="handleSettleRecord(row)"
                  :disabled="row.settled || row.id === -1"
                >
                  {{ row.settled ? '已结算' : '结算' }}
                </el-button>
                <el-button 
                  type="danger" 
                  size="small" 
                  @click.stop="deleteRecord(row)"
                  v-if="row.id !== -1"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 消费详情对话框 -->
        <el-dialog
          v-model="detailModalVisible"
          title="消费详情"
          width="600px"
          append-to-body
        >
          <div v-if="selectedRecord" class="detail-info">
            <div class="customer-info">
              <h4>客户信息</h4>
              <p>客户姓名：{{ selectedRecord.customerName }}</p>
            </div>
            
            <el-divider />
            
            <div class="consumption-detail">
              <h4>消费详情</h4>
              <template v-if="selectedRecord.productId">
                <div class="product-info">
                  <p>消费类型：商品消费</p>
                  <p>商品名称：{{ selectedRecord.productName }}</p>
                  <p>购买数量：{{ selectedRecord.quantity }} 件</p>
                  <p>单价：{{ (selectedRecord.amount / selectedRecord.quantity).toFixed(2) }} 元</p>
                  <p>总金额：{{ selectedRecord.amount.toFixed(2) }} 元</p>
                </div>
              </template>
              <template v-else>
                <div class="venue-usage-info">
                  <p>消费类型：场地使用</p>
                  <p>开始时间：{{ formatDateTime(currentVenue?.startTime) }}</p>
                  <p>使用时长：{{ calculateUsedTime(currentVenue?.startTime) }}</p>
                  <p>小时单价：{{ currentVenue?.hourlyRate }} 元</p>
                  <p>场地费用：{{ selectedRecord.amount.toFixed(2) }} 元</p>
                </div>
              </template>
            </div>
            
            <div class="consumption-time">
              <p>消费时间：{{ formatDateTime(selectedRecord.timestamp) }}</p>
              <p>结算状态：{{ selectedRecord.settled ? '已结算' : '未结算' }}</p>
              <p v-if="selectedRecord.settled">结算时间：{{ formatDateTime(selectedRecord.settleTime) }}</p>
            </div>
          </div>
        </el-dialog>

        <!-- 总计信息 -->
        <div class="total-info">
          <p>总金额: {{ calculateTotalAmount() }}元</p>
          <el-button type="primary" @click="settleAll">一键结算</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 添加消费记录对话框 -->
    <el-dialog
      v-model="recordsDialogVisible"
      :title="`${selectedVenue?.id || ''}号场地消费记录`"
      width="900px"
    >
      <div class="records-content">
        <el-table :data="venueRecords" style="width: 100%">
          <el-table-column prop="customerName" label="消费客户" width="120" />
          <el-table-column label="消费类型" width="120">
            <template #default="{ row }">
              {{ row.productId ? '商品消费' : '场地计费' }}
            </template>
          </el-table-column>
          <el-table-column label="消费内容" min-width="200">
            <template #default="{ row }">
              <template v-if="row.productId">
                {{ row.productName }} × {{ row.quantity }}
                <template v-if="row.quantity && row.amount">
                  (单价: {{ (row.amount / row.quantity).toFixed(2) }}元)
                </template>
              </template>
              <template v-else>
                {{ row.productName || '场地使用费' }}
                <el-tag v-if="row.id === -1" type="warning" size="small">计费中</el-tag>
              </template>
            </template>
          </el-table-column>
          <el-table-column prop="amount" label="金额" width="120">
            <template #default="{ row }">
              {{ row.amount.toFixed(2) }}元
            </template>
          </el-table-column>
          <el-table-column prop="timestamp" label="时间" width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.timestamp) }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.id === -1 ? 'warning' : (row.settled ? 'success' : 'info')">
                {{ row.id === -1 ? '计费中' : (row.settled ? '已结算' : '未结算') }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import axios from 'axios';
import { Plus, Edit, View, Download, Search, ArrowDown } from '@element-plus/icons-vue';

// 数据状态
const venues = ref([]);
const loading = ref(false);
const loadingHistory = ref(false);
const loadingProducts = ref(false);
const searchQuery = ref('');
const statusFilter = ref('');
const typeFilter = ref('');
const customers = ref([]);
const venueHistory = ref([]);
const historyPage = ref(1);
const totalHistory = ref(0);

// 商品相关状态
const products = ref([]);
const productSearchQuery = ref('');
const productCategoryFilter = ref('');
const productStatusFilter = ref('');
const cart = ref([]);
const cartTotal = ref(0);

// 选中的场地
const selectedVenue = ref(null);

// 表单数据
const newVenue = ref({
  venueType: '',
  hourlyRate: 100
});

const gameForm = ref({
  customerId: null,
  notes: '',
  customerType: 'member', // 默认选择客户
  phone: '',
  isLimitedTime: false,
  limitTime: null,
});

const reserveForm = ref({
  customerId: null,
  reservationTime: null,
  duration: 2,
  notes: ''
});

// 对话框状态
const isAddVenueModalVisible = ref(false);
const isStartGameModalVisible = ref(false);
const isEndGameModalVisible = ref(false);
const isReserveModalVisible = ref(false);
const isPurchaseModalVisible = ref(false);

// 结算相关的状态
const settleModalVisible = ref(false);
const currentVenue = ref(null);
const consumptionRecords = ref([]);
const detailModalVisible = ref(false);
const selectedRecord = ref(null);

const recordsDialogVisible = ref(false);
const venueRecords = ref([]);

// 消费记录表格列定义
const consumptionColumns = [
  {
    title: '时间',
    dataIndex: 'timestamp',
    key: 'timestamp',
    customRender: ({ text }) => formatDateTime(text)
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    customRender: ({ text }) => text === 'VENUE' ? '场地费用' : '商品消费'
  },
  {
    title: '商品名称',
    dataIndex: 'productName',
    key: 'productName'
  },
  {
    title: '数量',
    dataIndex: 'quantity',
    key: 'quantity'
  },
  {
    title: '金额',
    dataIndex: 'amount',
    key: 'amount'
  },
  {
    title: '状态',
    dataIndex: 'settled',
    key: 'settled',
    customRender: ({ text }) => text ? '已结算' : '未结算'
  },
  {
    title: '操作',
    key: 'action'
  }
];

// 表单验证规则
const venueRules = {
  venueType: [
    { required: true, message: '请选择场地类型', trigger: 'change' }
  ],
  hourlyRate: [
    { required: true, message: '请输入每小时费率', trigger: 'blur' }
  ]
};

const reserveRules = {
  customerId: [
    { required: true, message: '请选择客户', trigger: 'change' }
  ],
  reservationTime: [
    { required: true, message: '请选择预订时间', trigger: 'change' }
  ],
  duration: [
    { required: true, message: '请输入预计时长', trigger: 'change' }
  ]
};

// 计算属性
const filteredVenues = computed(() => {
  if (!venues.value) return [];
  
  let result = venues.value;
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(venue => 
      venue && (
        (venue.id && venue.id.toString().includes(query)) ||
        (venue.venueType && venue.venueType.toLowerCase().includes(query))
      )
    );
  }

  if (statusFilter.value) {
    result = result.filter(venue => venue && venue.status === statusFilter.value);
  }

  if (typeFilter.value) {
    result = result.filter(venue => venue && venue.venueType === typeFilter.value);
  }

  return result;
});

const filteredProducts = computed(() => {
  if (!products.value) return [];
  
  let result = products.value;
  
  if (productSearchQuery.value) {
    const query = productSearchQuery.value.toLowerCase();
    result = result.filter(product => 
      product && (
        (product.name && product.name.toLowerCase().includes(query)) ||
        (product.category && getCategoryText(product.category).toLowerCase().includes(query))
      )
    );
  }

  if (productCategoryFilter.value) {
    result = result.filter(product => product && product.category === productCategoryFilter.value);
  }

  if (productStatusFilter.value) {
    const isActive = productStatusFilter.value === 'true';
    result = result.filter(product => product && product.active === isActive);
  }

  return result;
});

// 工具方法（非异步）
const getStatusType = (status) => {
  if (!status) return 'info';
  const types = {
    'AVAILABLE': 'success',
    'IN_USE': 'warning',
    'MAINTENANCE': 'danger',
    'RESERVED': 'info'
  };
  return types[status] || 'info';
};

const getStatusText = (status) => {
  if (!status) return '未知';
  const texts = {
    'AVAILABLE': '空闲',
    'IN_USE': '使用中',
    'MAINTENANCE': '维护中',
    'RESERVED': '预订中'
  };
  return texts[status] || status;
};

const getVenueTypeText = (type) => {
  if (!type) return '未知';
  const texts = {
    'SNOOKER': '斯诺克',
    'POOL': '美式台球',
    'CHINESE_8_BALL': '中式八球'
  };
  return texts[type] || type;
};

const getCardClass = (status) => {
  if (!status) return 'unknown';
  const statusLower = status.toLowerCase();
  const validStatus = ['available', 'in_use', 'maintenance', 'reserved'];
  return validStatus.includes(statusLower) ? statusLower : 'unknown';
};

const getUsedTime = (startTime) => {
  if (!startTime) return '0分钟';
  const minutes = Math.floor((new Date() - new Date(startTime)) / 60000);
  if (isNaN(minutes)) return '0分钟';
  return `${Math.floor(minutes / 60)}小时${minutes % 60}分钟`;
};

const calculateFee = (startTime, hourlyRate) => {
  if (!startTime || !hourlyRate || isNaN(hourlyRate)) return '0.00';
  const hours = (new Date() - new Date(startTime)) / 3600000;
  if (isNaN(hours)) return '0.00';
  return (hours * hourlyRate).toFixed(2);
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

const disabledDate = (time) => {
  return time.getTime() < Date.now() - 8.64e7;
};

const disabledTime = (date) => {
  if (!date) return;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const isToday = date.getTime() === today.getTime();
  
    return {
    hours: isToday ? Array.from({ length: now.getHours() }, (_, i) => i) : [],
    minutes: isToday && date.getHours() === now.getHours() ? 
      Array.from({ length: now.getMinutes() }, (_, i) => i) : []
  };
};

// 异步方法
const fetchVenues = async () => {
  try {
    const response = await axios.get('/api/venues');
    venues.value = response.data;
  } catch (error) {
    ElMessage.error('获取场地列表失败');
  }
};

// 生命周期钩子
onMounted(() => {
  fetchVenues();
});

// 其他异步方法
const searchCustomers = async (query) => {
  if (query) {
    try {
      const response = await axios.get(`/api/customers/search?query=${query}`);
      customers.value = response.data;
    } catch (error) {
      console.error('Error searching customers:', error);
    }
  } else {
    customers.value = [];
  }
};

const addVenue = async () => {
  try {
    await axios.post('/api/venues', newVenue.value);
    ElMessage.success('场地添加成功');
    isAddVenueModalVisible.value = false;
    fetchVenues();
    newVenue.value = { venueType: '', hourlyRate: 100 };
  } catch (error) {
    ElMessage.error('场地添加失败');
    console.error('Error adding venue:', error);
  }
};

const startGame = async () => {
  if (gameForm.customerType === 'member') {
    // 验证手机号对应的会员是否存在
    const response = await axios.get(`/api/customers/validate?phone=${gameForm.phone}`);
    if (!response.data.exists) {
      ElMessage.error('该会员不存在');
      return;
    }
  }
  
  // 提交开始计费请求
  try {
    await axios.post(`/api/venues/${selectedVenue.value.id}/start`, {
      ...gameForm.value,
      customerId: gameForm.customerType === 'member' ? response.data.id : null, // 如果是会员，传入ID
    });
    ElMessage.success('开始计费成功');
    isStartGameModalVisible.value = false;
    fetchVenues();
  } catch (error) {
    ElMessage.error('开始计费失败');
    console.error('Error starting game:', error);
  }
};

const endGame = async (venue) => {
  currentVenue.value = venue;
  settleModalVisible.value = true;
  await fetchConsumptionRecords(venue.id);
};

const reserveVenue = async () => {
  try {
    await axios.post(`/api/venues/${selectedVenue.value.id}/reserve`, reserveForm.value);
    ElMessage.success('预订成功');
    isReserveModalVisible.value = false;
    fetchVenues();
  } catch (error) {
    ElMessage.error('预订失败');
    console.error('Error reserving venue:', error);
  }
};

const handleCommand = async (command, venue) => {
  selectedVenue.value = venue;
  switch (command) {
    case 'edit':
      // TODO: 实现编辑功能
      break;
    case 'reserve':
      isReserveModalVisible.value = true;
      break;
    case 'maintain':
      toggleMaintenance(venue);
      break;
    case 'purchase':
      isPurchaseModalVisible.value = true;
      cart.value = []; // 清空购物车
      cartTotal.value = 0;
      fetchProducts(); // 获取商品列表
      break;
    case 'records':
      await showRecordsDialog(venue);
      break;
  }
};

const toggleMaintenance = async (venue) => {
  try {
    const response = await axios.post(`/api/venues/${venue.id}/toggleMaintenance`);
    const updatedVenue = response.data; // 获取更新后的场地信息
    const index = filteredVenues.value.findIndex(v => v.id === updatedVenue.id);
    if (index !== -1) {
      const updatedVenues = [...filteredVenues.value];
      updatedVenues[index] = updatedVenue; // 更新场地状态
      venues.value = updatedVenues; // 刷新场地列表
    }
  } catch (error) {
    ElMessage.error('切换维护状态失败');
    console.error('Error toggling maintenance:', error);
  }
};

const showStartGameModal = (venue) => {
  selectedVenue.value = venue;
  gameForm.value = { customerId: null, notes: '', customerType: 'member', phone: '', isLimitedTime: false, limitTime: null };
  isStartGameModalVisible.value = true;
};

const showEndGameModal = (venue) => {
  selectedVenue.value = venue;
  isEndGameModalVisible.value = true;
};

const handleSearch = () => {
  // 实现搜索逻辑
};

const exportVenueData = async () => {
  try {
    const response = await axios.get('/api/venues/export', {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'venues.xlsx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    ElMessage.error('导出失败');
    console.error('Error exporting data:', error);
  }
};

const showAddVenueModal = () => {
  newVenue.value = { venueType: '', hourlyRate: 100 };
  isAddVenueModalVisible.value = true;
};

// 商品相关方法
const getCategoryType = (category) => {
  const types = {
    'BEVERAGE': 'success',
    'SNACK': 'warning',
    'EQUIPMENT': 'info',
    'OTHER': ''
  };
  return types[category] || '';
};

const getCategoryText = (category) => {
  const texts = {
    'BEVERAGE': '饮料',
    'SNACK': '零食',
    'EQUIPMENT': '器材',
    'OTHER': '其他'
  };
  return texts[category] || category;
};

const handleProductSearch = () => {
  // 实现商品搜索逻辑
};

const fetchProducts = async () => {
  try {
    loadingProducts.value = true;
    const response = await axios.get('/api/products');
    products.value = response.data;
  } catch (error) {
    console.error('获取商品列表失败:', error);
    ElMessage.error('获取商品列表失败');
  } finally {
    loadingProducts.value = false;
  }
};

const addToCart = (product) => {
  // 检查商品是否已在购物车中
  const existingItem = cart.value.find(item => item.id === product.id);
  
  if (existingItem) {
    // 如果已存在，增加数量
    if (existingItem.quantity < product.stock) {
      existingItem.quantity += 1;
      updateCartTotal();
    } else {
      ElMessage.warning('已达到库存上限');
    }
  } else {
    // 如果不存在，添加到购物车
    cart.value.push({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      stock: product.stock
    });
    updateCartTotal();
  }
  
  ElMessage.success(`已将 ${product.name} 加入购物车`);
};

const removeFromCart = (index) => {
  cart.value.splice(index, 1);
  updateCartTotal();
};

const updateCartTotal = () => {
  cartTotal.value = cart.value.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
};

const checkout = async () => {
  try {
    if (!selectedVenue.value || !selectedVenue.value.id) {
      ElMessage.error('未选择场地');
      return;
    }
    
    if (selectedVenue.value.status !== 'IN_USE') {
      ElMessage.error('只有使用中的场地才能购买商品');
      return;
    }
    
    // 将购物车中的商品转换为后端需要的格式
    const products = cart.value.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    }));
    
    // 使用正确的API端点
    const response = await axios.post(`/api/venues/${selectedVenue.value.id}/purchase`, products);
    
    // 更新场地信息
    if (response.data) {
      // 找到并更新当前场地信息
      const index = venues.value.findIndex(v => v.id === selectedVenue.value.id);
      if (index !== -1) {
        venues.value[index] = response.data;
      }
    }
    
    ElMessage.success('结算成功');
    cart.value = []; // 清空购物车
    cartTotal.value = 0;
    isPurchaseModalVisible.value = false;
    
    // 刷新场地信息
    fetchVenues();
  } catch (error) {
    console.error('结算失败:', error);
    ElMessage.error('结算失败');
  }
};

// 计算场地费用
const calculateVenueFee = (venue) => {
  if (!venue || !venue.startTime) return 0;
  const start = new Date(venue.startTime);
  const now = new Date();
  const hours = (now - start) / (1000 * 60 * 60);
  return Math.ceil(hours * venue.hourlyRate);
};

// 计算总金额
const calculateTotalAmount = () => {
  const venueFee = calculateVenueFee(currentVenue.value);
  const consumptionFee = consumptionRecords.value
    .filter(record => !record.settled)
    .reduce((sum, record) => sum + record.amount, 0);
  return (venueFee + consumptionFee).toFixed(2);
};

// 获取消费记录
const fetchConsumptionRecords = async (venueId) => {
  try {
    const response = await axios.get(`/api/venues/${venueId}/consumption-records`);
    console.log('Consumption records:', response.data);
    consumptionRecords.value = response.data;
  } catch (error) {
    console.error('Error fetching consumption records:', error);
    ElMessage.error('获取消费记录失败');
  }
};

// 处理结算记录
const handleSettleRecord = async (record) => {
  try {
    await ElMessageBox.confirm(
      '确认结算该记录吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    await axios.post(`/api/venues/${selectedVenue.value.id}/settle/${record.id}`);
    ElMessage.success('结算成功');
    
    // 刷新消费记录
    await showRecordsDialog(selectedVenue.value);
    
    // 刷新场地列表
    await fetchVenues();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('结算失败：' + (error.response?.data?.message || error.message));
    }
  }
};

// 显示消费记录对话框
const showRecordsDialog = async (venue) => {
  try {
    selectedVenue.value = venue;
    const response = await axios.get(`/api/venues/${venue.id}/consumption-records`);
    venueRecords.value = response.data;
    recordsDialogVisible.value = true;
  } catch (error) {
    ElMessage.error('获取消费记录失败');
  }
};

// 计算使用时长
const calculateUsedTime = (startTime) => {
  if (!startTime) return '0小时0分钟';
  const start = new Date(startTime);
  const now = new Date();
  const diffMs = now - start;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}小时${minutes}分钟`;
};

// 显示消费详情
const showConsumptionDetail = (record) => {
  selectedRecord.value = record;
  detailModalVisible.value = true;
}

// 删除消费记录
const deleteRecord = async (record) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这条消费记录吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    
    await axios.delete(`/api/venues/${currentVenue.value.id}/consumption-records/${record.id}`);
    ElMessage.success('删除成功');
    await fetchConsumptionRecords(currentVenue.value.id);
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败：' + (error.response?.data?.message || error.message));
    }
  }
};

// 一键结算全部
const settleAll = async () => {
  try {
    await axios.post(`/api/venues/${currentVenue.value.id}/settle-all`);
    ElMessage.success('全部结算成功');
    settleModalVisible.value = false;
    fetchVenues(); // 刷新场地列表
  } catch (error) {
    ElMessage.error('结算失败：' + error.response?.data?.message || error.message);
  }
};
</script>

<style scoped>
.venue-management {
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

.venue-grid {
  margin-top: 20px;
}

.venue-card {
  margin-bottom: 20px;
  transition: all 0.3s;
}

.venue-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 2px 12px 0 rgba(0,0,0,.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-content {
  padding: 10px 0;
}

.venue-info {
  margin-bottom: 15px;
}

.venue-info p {
  margin: 5px 0;
}

.card-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-pagination {
  margin-top: 10px;
  display: flex;
  justify-content: center;
}

.unit {
  margin-left: 10px;
}

/* 场地状态样式 */
.venue-card.available {
  border-left: 4px solid #67C23A;
}

.venue-card.in_use {
  border-left: 4px solid #E6A23C;
}

.venue-card.maintenance {
  border-left: 4px solid #F56C6C;
}

.venue-card.reserved {
  border-left: 4px solid #909399;
}

.venue-card.unknown {
  border-left: 4px solid #DCDFE6;
}

.product-search-bar {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.product-list {
  margin-bottom: 20px;
}

.cart-section {
  margin-top: 20px;
  border-top: 1px solid #ebeef5;
  padding-top: 20px;
}

.cart-total {
  margin-top: 10px;
  text-align: right;
  font-size: 16px;
  font-weight: bold;
}

.total-fee {
  font-size: 18px;
  font-weight: bold;
  color: #f56c6c;
}

.settle-content {
  padding: 20px;
}

.venue-info {
  margin-bottom: 20px;
}

.venue-info p {
  margin: 8px 0;
}

.consumption-list {
  margin: 20px 0;
}

.detail-info {
  padding: 20px;
}

.detail-info h4 {
  margin: 0 0 15px 0;
  color: #303133;
}

.customer-info,
.consumption-detail,
.consumption-time {
  margin-bottom: 20px;
}

.product-info p,
.venue-usage-info p {
  margin: 8px 0;
  line-height: 1.6;
}

.consumption-time {
  color: #606266;
  font-size: 14px;
}

.el-divider {
  margin: 20px 0;
}

.total-info {
  text-align: right;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.total-info p {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
}

.el-table {
  margin: 10px 0;
}

.el-table .el-button {
  padding: 4px 12px;
}

.el-table .el-button + .el-button {
  margin-left: 8px;
}

.consumption-list .el-table {
  margin-top: 15px;
}

.records-content {
  padding: 20px;
}
</style>