const config = {
  // 应用信息
  app: {
    name: '后台管理系统'
  },
  // 请求配置
  api: {
    baseUrl:
      'https://www.fastmock.site/mock/d6f0134049a0e22b01d7aae6fafc9045/api',
    timeout: 30000,
    sessionKey: 'sessionkey',
    status: {
      // 与后台约定可能返回的状态码（不是http的响应状态码）
      200: '请求成功',
      401: '未授权，请重新登录',
      403: '拒绝访问',
      404: '请求错误，未找到该资源',
      408: '请求超时',
      500: '服务器发生错误',
      501: '服务未实现',
      502: '网络错误',
      503: '服务不可用',
      504: '网络超时',
      505: 'HTTP版本不受支持'
    }
  },
  pageSize: 20, // 每页多少条数据
  themeColors: [
    '#1677ff',
    '#ee3f4d',
    '#c08eaf',
    '#95509f',
    '#722ed1',
    '#00b96b',
    '#7cb305',
    '#13c2c2',
    '#d6a01d'
  ],
  fixedWidth: 1200
};

export default config;
