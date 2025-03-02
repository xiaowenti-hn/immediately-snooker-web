// 根据用户角色返回可访问的路由
export function getAccessibleRoutes(role) {
  const allRoutes = [
    '/dashboard',
    '/venues',
    '/customers',
    '/products',
    '/finance'
  ]
  
  // 如果是管理员，返回所有路由
  if (role === 'ADMIN') {
    return allRoutes
  }
  
  // 如果是普通员工，返回部分路由
  if (role === 'STAFF') {
    return ['/dashboard', '/venues', '/customers']
  }
  
  // 默认只返回首页
  return ['/dashboard']
} 