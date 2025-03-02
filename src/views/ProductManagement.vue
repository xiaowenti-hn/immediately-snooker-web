<template>
  <div class="product-management">
    <div class="header">
      <h1>商品管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="showAddProductModal">
          <el-icon><Plus /></el-icon>添加商品
        </el-button>
        <el-button @click="exportProductData">
          <el-icon><Download /></el-icon>导出数据
        </el-button>
      </div>
    </div>

    <div class="search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索商品（名称/类别）"
        @input="handleSearch"
        clearable
        style="width: 300px"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-select v-model="categoryFilter" placeholder="商品类别" style="width: 120px; margin-left: 10px">
        <el-option label="全部" value="" />
        <el-option label="饮料" value="BEVERAGE" />
        <el-option label="零食" value="SNACK" />
        <el-option label="器材" value="EQUIPMENT" />
        <el-option label="其他" value="OTHER" />
      </el-select>
      <el-select v-model="statusFilter" placeholder="商品状态" style="width: 120px; margin-left: 10px">
        <el-option label="全部" value="" />
        <el-option label="在售" value="true" />
        <el-option label="下架" value="false" />
      </el-select>
    </div>

    <el-table
      :data="filteredProducts"
      style="width: 100%"
      v-loading="loading"
      @sort-change="handleSortChange"
    >
      <el-table-column prop="id" label="ID" width="80" sortable />
      <el-table-column prop="name" label="商品名称" sortable />
      <el-table-column prop="category" label="类别">
        <template #default="scope">
          <el-tag :type="getCategoryType(scope.row.category)">
            {{ getCategoryText(scope.row.category) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="price" label="价格" sortable>
        <template #default="scope">
          <span>¥{{ scope.row.price.toFixed(2) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="stock" label="库存" sortable>
        <template #default="scope">
          <el-tag :type="scope.row.stock < 10 ? 'danger' : 'success'">
            {{ scope.row.stock }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="active" label="状态" width="100">
        <template #default="scope">
          <el-switch
            v-model="scope.row.active"
            @change="toggleProductStatus(scope.row)"
            :active-text="'在售'"
            :inactive-text="'下架'"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button-group>
            <el-button size="small" type="primary" @click="showEditModal(scope.row)">
              <el-icon><Edit /></el-icon>编辑
            </el-button>
            <el-button size="small" type="success" @click="showStockModal(scope.row)">
              <el-icon><Plus /></el-icon>入库
            </el-button>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      :model-value="currentPage"
      :page-size="pageSize"
      :total="totalProducts"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      @update:model-value="currentPage = $event"
      @update:page-size="pageSize = $event"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      class="pagination"
    />

    <!-- 添加商品对话框 -->
    <el-dialog v-model="isAddProductModalVisible" title="添加商品" width="500px">
      <el-form
        ref="productForm"
        :model="newProduct"
        :rules="productRules"
        label-width="80px"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="newProduct.name" />
        </el-form-item>
        <el-form-item label="类别" prop="category">
          <el-select v-model="newProduct.category" placeholder="请选择类别">
            <el-option label="饮料" value="BEVERAGE" />
            <el-option label="零食" value="SNACK" />
            <el-option label="器材" value="EQUIPMENT" />
            <el-option label="其他" value="OTHER" />
          </el-select>
        </el-form-item>
        <el-form-item label="价格" prop="price">
          <el-input-number 
            v-model="newProduct.price" 
            :min="0" 
            :precision="2" 
            :step="1"
          />
        </el-form-item>
        <el-form-item label="库存" prop="stock">
          <el-input-number 
            v-model="newProduct.stock" 
            :min="0" 
            :precision="0" 
            :step="1"
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input 
            v-model="newProduct.description" 
            type="textarea" 
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="isAddProductModalVisible = false">取消</el-button>
        <el-button type="primary" @click="addProduct">确认</el-button>
      </template>
    </el-dialog>

    <!-- 编辑商品对话框 -->
    <el-dialog v-model="isEditProductModalVisible" title="编辑商品" width="500px">
      <el-form
        ref="editForm"
        :model="editingProduct"
        :rules="productRules"
        label-width="80px"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="editingProduct.name" />
        </el-form-item>
        <el-form-item label="类别" prop="category">
          <el-select v-model="editingProduct.category" placeholder="请选择类别">
            <el-option label="饮料" value="BEVERAGE" />
            <el-option label="零食" value="SNACK" />
            <el-option label="器材" value="EQUIPMENT" />
            <el-option label="其他" value="OTHER" />
          </el-select>
        </el-form-item>
        <el-form-item label="价格" prop="price">
          <el-input-number 
            v-model="editingProduct.price" 
            :min="0" 
            :precision="2" 
            :step="1"
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input 
            v-model="editingProduct.description" 
            type="textarea" 
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="isEditProductModalVisible = false">取消</el-button>
        <el-button type="primary" @click="updateProduct">保存</el-button>
      </template>
    </el-dialog>

    <!-- 入库对话框 -->
    <el-dialog v-model="isStockModalVisible" title="商品入库" width="400px">
      <el-form ref="stockForm" :model="stockForm" label-width="80px">
        <el-form-item label="当前库存">
          <span>{{ selectedProduct?.stock || 0 }}</span>
        </el-form-item>
        <el-form-item label="入库数量" prop="quantity">
          <el-input-number
            v-model="stockForm.quantity"
            :min="1"
            :precision="0"
            :step="1"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input 
            v-model="stockForm.notes" 
            type="textarea" 
            :rows="2"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="isStockModalVisible = false">取消</el-button>
        <el-button type="primary" @click="addStock">确认入库</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import axios from 'axios';
import { Plus, Edit, Download, Search } from '@element-plus/icons-vue';

// 数据状态
const products = ref([]);
const loading = ref(false);
const searchQuery = ref('');
const categoryFilter = ref('');
const statusFilter = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const totalProducts = ref(0);
const sortBy = ref({ prop: '', order: '' });

// 选中的商品
const selectedProduct = ref(null);

// 对话框状态
const isAddProductModalVisible = ref(false);
const isEditProductModalVisible = ref(false);
const isStockModalVisible = ref(false);

// 表单数据
const newProduct = ref({
  name: '',
  category: '',
  price: 0,
  stock: 0,
  description: '',
  active: true
});

const editingProduct = ref({});

const stockForm = ref({
  quantity: 1,
  notes: ''
});

// 表单验证规则
const productRules = {
  name: [
    { required: true, message: '请输入商品名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择商品类别', trigger: 'change' }
  ],
  price: [
    { required: true, message: '请输入商品价格', trigger: 'blur' }
  ],
  stock: [
    { required: true, message: '请输入初始库存', trigger: 'blur' }
  ]
};

// 计算属性
const filteredProducts = computed(() => {
  let result = products.value;
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(product => 
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    );
  }

  if (categoryFilter.value) {
    result = result.filter(product => product.category === categoryFilter.value);
  }

  if (statusFilter.value !== '') {
    result = result.filter(product => 
      product.active === (statusFilter.value === 'true')
    );
  }

  return result;
});

// 方法
const showAddProductModal = () => {
  isAddProductModalVisible.value = true;
  newProduct.value = {
    name: '',
    category: '',
    price: 0,
    stock: 0,
    description: '',
    active: true
  };
};

const fetchProducts = async () => {
  loading.value = true;
  try {
    const response = await axios.get('/api/products');
    if (!response.data || typeof response.data === 'string' || !Array.isArray(response.data)) {
      ElMessage.error('获取商品列表失败：服务器返回数据格式错误');
      products.value = [];
      totalProducts.value = 0;
      console.error('Invalid response data:', response.data);
      return;
    }
    products.value = response.data;
    totalProducts.value = response.data.length;
  } catch (error) {
    ElMessage.error('获取商品列表失败');
    products.value = [];
    totalProducts.value = 0;
    console.error('Error fetching products:', error);
  } finally {
    loading.value = false;
  }
};

const addProduct = async () => {
  try {
    await axios.post('/api/products', newProduct.value);
    ElMessage.success('商品添加成功');
    isAddProductModalVisible.value = false;
    fetchProducts();
    newProduct.value = { name: '', category: '', price: 0, stock: 0, description: '', active: true };
  } catch (error) {
    ElMessage.error('商品添加失败');
    console.error('Error adding product:', error);
  }
};

const updateProduct = async () => {
  try {
    await axios.put(`/api/products/${editingProduct.value.id}`, editingProduct.value);
    ElMessage.success('商品信息更新成功');
    isEditProductModalVisible.value = false;
    fetchProducts();
  } catch (error) {
    ElMessage.error('商品信息更新失败');
    console.error('Error updating product:', error);
  }
};

const addStock = async () => {
  try {
    await axios.post(`/api/products/${selectedProduct.value.id}/stock`, stockForm.value);
    ElMessage.success('入库成功');
    isStockModalVisible.value = false;
    fetchProducts();
  } catch (error) {
    ElMessage.error('入库失败');
    console.error('Error adding stock:', error);
  }
};

const toggleProductStatus = async (product) => {
  try {
    await axios.post(`/api/products/${product.id}/toggle-status`);
    ElMessage.success(product.active ? '商品已上架' : '商品已下架');
    fetchProducts();
  } catch (error) {
    product.active = !product.active; // 恢复状态
    ElMessage.error('操作失败');
    console.error('Error toggling product status:', error);
  }
};

const showEditModal = (product) => {
  editingProduct.value = { ...product };
  isEditProductModalVisible.value = true;
};

const showStockModal = (product) => {
  selectedProduct.value = product;
  stockForm.value = { quantity: 1, notes: '' };
  isStockModalVisible.value = true;
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

const exportProductData = async () => {
  try {
    const response = await axios.get('/api/products/export', {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'products.xlsx');
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
  fetchProducts();
});
</script>

<style scoped>
.product-management {
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

.unit {
  margin-left: 10px;
}
</style>