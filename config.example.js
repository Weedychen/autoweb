// 基础配置
const BASE_CONFIG = {
  // 下载路径配置
  DOWNLOAD_PATH: 'C:\\Users\\username\\Downloads\\Compressed',
  EXPORT_FOLDER_NAME: 'yuqing_export',
  
  // 文件命名配置
  FILE_NAMING: {
    PREFIX: '智舆情数据每日导出',  // 文件名前缀
    DATE_FORMAT: 'YYYYMMDD',    // 日期格式
    EXTENSION: '.zip',          // 文件扩展名
    TIME_WINDOW: 5 * 60 * 1000  // 文件处理时间窗口（5分钟）
  },
  
  // 时间配置
  DEFAULT_EXPORT_TIME: '14:00:00',  // 默认导出时间
  TIME_FORMAT: 'YYYY/MM/DD HH:mm:ss', // 时间格式
  
  // 等待时间配置（毫秒）
  WAIT_TIMES: {
    PAGE_LOAD: 5000,        // 页面加载等待时间
    ANIMATION: 1000,        // 动画完成等待时间
    FOLDER_EXPAND: 500,     // 文件夹展开等待时间
    DROPDOWN_SHOW: 2000,    // 下拉菜单显示等待时间
    EXPORT_CHECK: 60000,    // 导出状态检查间隔
    RETRY_WAIT: 30000,      // 重试等待时间
    FILE_DOWNLOAD: 10000,   // 文件下载等待时间
  },
  
  // 重试配置
  MAX_RETRIES: 3,           // 最大重试次数
  EXPORT_TIMEOUT: 30 * 60 * 1000, // 导出超时时间（30分钟）
};

// 主题配置
const TOPICS = {
  HEALTH: {
    1: '健康-1汤臣倍健',
    2: '健康-2片仔癀',
    3: '健康-3白云山',
    4: '健康-4云南白药',
    5: '健康-5燕之屋',
    6: '健康-6小仙炖',
    7: '健康-7寿仙谷',
    8: '健康-8东阿阿胶',
    9: '健康-主词',
    10: '健康-组合-高级'
  }
};

// 2025年法定节假日安排
const HOLIDAYS_2025 = {
  // 元旦
  '2025-01-01': true,
  // 春节
  '2025-01-29': true,
  '2025-01-30': true,
  '2025-01-31': true,
  '2025-02-01': true,
  '2025-02-02': true,
  '2025-02-03': true,
  // 清明节
  '2025-04-05': true,
  // 劳动节
  '2025-05-01': true,
  '2025-05-02': true,
  '2025-05-03': true,
  // 端午节
  '2025-05-31': true,
  // 中秋节
  '2025-09-13': true,
  // 国庆节
  '2025-10-01': true,
  '2025-10-02': true,
  '2025-10-03': true,
  '2025-10-04': true,
  '2025-10-05': true,
  '2025-10-06': true,
  '2025-10-07': true
};

// 选择器配置
const SELECTORS = {
  // 页面元素选择器
  PAGE: {
    CUSTOM_BUTTON: 'button.el-button:has-text("自定义")',
    FILTER_BUTTON: 'button.el-button:has-text("筛选")',
    EXPORT_BUTTON: 'div.d-flex.item-cebter > button.btn.btn-default-border.ml10',
    CONFIRM_BUTTON: 'button:has-text("确 定")',
    BATCH_EXPORT_BUTTON: 'button[data-v-108915d0].btn.btn-sussess',
    DATA_LOADED: 'div.number.mr5',
  },
  
  // 复选框选择器
  CHECKBOXES: {
    ALL: 'label.el-checkbox:has-text("全部")',
    WEIBO: 'label:has-text("微博")',
    VIDEO: 'label:has-text("视频")',
    APP: 'label:has-text("APP")',
  },
  
  // 日期时间选择器
  DATETIME: {
    START_TIME: 'div.el-date-editor:has(input[placeholder="开始时间"]) input',
    END_TIME: 'div.el-date-editor:has(input[placeholder="结束时间"]) input',
  },
  
  // 文件夹选择器
  FOLDER: {
    EXPANDED: 'div.plan-list-folder.cp.curr',
    TARGET: 'div.plan-list-folder.cp',
  }
};

// Cookie配置示例
const COOKIES = [
  {
    name: 'HMACCOUNT',
    value: 'YOUR_HMACCOUNT_VALUE',
    domain: '.yuqing.nybkz.com',
    path: '/',
  },
  {
    name: 'Hm_lpvt_61cd73eb7a09cc04e7bc443b1ef8c1ca',
    value: 'YOUR_HM_LPVT_VALUE',
    domain: '.yuqing.nybkz.com',
    path: '/',
  }
];

module.exports = {
  BASE_CONFIG,
  TOPICS,
  HOLIDAYS_2025,
  SELECTORS,
  COOKIES
}; 