// src/main.js
import { createApp } from 'vue';
import App from './App.vue';
import router from './router'; // 导入路由
import ElementPlus from 'element-plus';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';
import 'element-plus/dist/index.css'; // 引入 Element Plus 样式
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import axios from 'axios';
import { ElMessage } from 'element-plus';

// 配置 axios
axios.defaults.baseURL = 'http://localhost:8080';
axios.defaults.timeout = 10000;
axios.defaults.headers.common['Content-Type'] = 'application/json';

// 从localStorage获取token
const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// 请求拦截器
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
axios.interceptors.response.use(
  (response) => {
    // 如果响应是 blob 类型（用于文件下载），直接返回
    if (response.config.responseType === 'blob') {
      return response;
    }
    
    // 检查响应数据格式
    if (response.data === null || response.data === undefined) {
      ElMessage.error('服务器返回数据为空');
      return Promise.reject(new Error('响应数据为空'));
    }

    // 检查响应内容类型
    const contentType = response.headers['content-type'];
    if (contentType && contentType.includes('text/html')) {
      ElMessage.error('后端服务未正确响应，请检查服务是否正常运行');
      return Promise.reject(new Error('服务器返回了 HTML 页面而不是预期的 JSON 数据'));
    }
    
    return response;
  },
  (error) => {
    if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请检查网络连接');
    } else if (error.response) {
      // 服务器返回了错误状态码
      switch (error.response.status) {
        case 400:
          console.error('请求错误:', error.response.data);
          break;
        case 401:
          ElMessage.error('未授权，请重新登录');
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          localStorage.removeItem('role');
          router.push('/login');
          break;
        case 403:
          console.error('没有权限');
          break;
        case 404:
          console.error('请求的资源不存在');
          break;
        case 500:
          console.error('服务器错误');
          break;
        default:
          console.error('其他错误');
      }
    } else if (error.request) {
      console.error('没有收到响应');
    } else {
      console.error('请求配置错误:', error.message);
    }
    return Promise.reject(error);
  }
);

const app = createApp(App);

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.use(router); // 使用路由
app.use(ElementPlus, {
  locale: zhCn,
});
app.mount('#app');