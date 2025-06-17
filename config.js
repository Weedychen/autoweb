// 基础配置
const BASE_CONFIG = {
  // 下载路径配置
  DOWNLOAD_PATH: 'C:\\Users\\92175\\Downloads\\Compressed',
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

// Cookie配置
const COOKIES = [
  {
    name: 'HMACCOUNT',
    value: 'AE7F37DEEF15A4FB',
    domain: '.yuqing.nybkz.com',
    path: '/',
  },
  {
    name: 'Hm_lpvt_61cd73eb7a09cc04e7bc443b1ef8c1ca',
    value: '1749456597',
    domain: '.yuqing.nybkz.com',
    path: '/',
  },
  {
    name: 'Hm_lvt_61cd73eb7a09cc04e7bc443b1ef8c1ca',
    value: '1749456312',
    domain: '.yuqing.nybkz.com',
    path: '/',
  },
  {
    name: '_gsdataCL',
    value: 'WzAsIjE4MDAxNzE5MDA4IiwiMjAyNTA2MDkxNjA1NTciLCI2ZGJkZTM0NWU3N2I1NTRmOWFkNGYwZTNiNmE0NTQyNyIsMzk5Njg0XQ%3D%3D',
    domain: '.nybkz.com',
    path: '/',
  },
  {
    name: '_gsdataOL',
    value: '399684%3B18001719008%3B%7B%220%22%3A%22%22%2C%221%22%3A%22%22%2C%222%22%3A%22%22%2C%223%22%3A%22%22%2C%224%22%3A%22%22%2C%225%22%3A%22%22%2C%226%22%3A%22%22%2C%227%22%3A%22%22%2C%228%22%3A%22%22%2C%229%22%3A%22%22%2C%2299%22%3A%2220250609%22%7D%3Bcc0a356d6c2ca05502839f805fc90de8',
    domain: '.nybkz.com',
    path: '/',
  },
  {
    name: 'acw_tc',
    value: '0a0966c217494582558971941ecd457e78308c4f573c8c3b88b782cf575a81',
    domain: 'yuqing.nybkz.com',
    path: '/',
  },
  {
    name: 'sajssdk_2015_cross_new_user',
    value: '1',
    domain: '.nybkz.com',
    path: '/',
  },
  {
    name: 'sensorsdata2015jssdkcross',
    value: '%7B%22distinct_id%22%3A%22399684%22%2C%22first_id%22%3A%2219753b8d78d13f2-07d9dd061c3bd6c-26011e51-3686400-19753b8d78e1ddc%22%2C%22props%22%3A%7B%22%24latest_traffic_source_type%22%3A%22%E7%9B%B4%E6%8E%A5%E6%B5%81%E9%87%8F%22%2C%22%24latest_search_keyword%22%3A%22%E6%9C%AA%E5%8F%96%E5%88%B0%E5%80%BC_%E7%9B%B4%E6%8E%A5%E6%89%93%E5%BC%80%22%2C%22%24latest_referrer%22%3A%22%22%7D%2C%22identities%22%3A%22eyIkaWRlbnRpdHlfY29va2llX2lkIjoiMTk3NTNiOGQ3OGQxM2YyLTA3ZDlkZDA2MWMzYmQ2Yy0yNjAxMWU1MS0zNjg2NDAwLTE5NzUzYjhkNzhlMWRkYyIsIiRpZGVudGl0eV9sb2dpbl9pZCI6IjM5OTY4NCJ9%22%2C%22history_login_id%22%3A%7B%22name%22%3A%22%24identity_login_id%22%2C%22value%22%3A%22399684%22%7D%2C%22%24device_id%22%3A%2219753b8d78d13f2-07d9dd061c3bd6c-26011e51-3686400-19753b8d78e1ddc%22%7D',
    domain: '.nybkz.com',
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