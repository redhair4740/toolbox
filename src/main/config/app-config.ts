/**
 * 应用配置类型定义
 */
export interface AppConfig {
  // 批处理配置
  batch: {
    // 批处理大小
    size: number;
    // 并发数量
    concurrency: number;
  };
  
  // 性能配置
  performance: {
    // 使用工作线程的文件大小阈值（字节）
    workerThreshold: number;
    // 使用流式处理的文件大小阈值（字节）
    streamThreshold: number;
  };
  
  // 重试配置
  retry: {
    // 重试次数
    attempts: number;
    // 基础延迟（毫秒）
    baseDelay: number;
    // 最大延迟（毫秒）
    maxDelay: number;
  };
  
  // 搜索配置
  search: {
    // 最大搜索深度
    maxDepth: number;
    // 最大文件大小（字节）
    maxFileSize: number;
  };
  
  // 安全配置
  security: {
    // 禁止访问的目录
    forbiddenDirs: string[];
  };
}

// 默认配置
const defaultConfig: AppConfig = {
  batch: {
    size: 20,
    concurrency: 5
  },
  performance: {
    workerThreshold: 10 * 1024 * 1024, // 10MB
    streamThreshold: 50 * 1024 * 1024  // 50MB
  },
  retry: {
    attempts: 3,
    baseDelay: 100,
    maxDelay: 3000
  },
  search: {
    maxDepth: 10,
    maxFileSize: 100 * 1024 * 1024 // 100MB
  },
  security: {
    forbiddenDirs: ['node_modules', '.git', 'System32', 'Windows']
  }
}

// 当前配置
let currentConfig: AppConfig = { ...defaultConfig }

/**
 * 获取应用配置
 */
export function getConfig(): AppConfig {
  return currentConfig
}

/**
 * 更新应用配置
 */
export function updateConfig(newConfig: Partial<AppConfig>): void {
  currentConfig = {
    ...currentConfig,
    ...newConfig,
    // 合并嵌套对象
    batch: { ...currentConfig.batch, ...newConfig.batch },
    performance: { ...currentConfig.performance, ...newConfig.performance },
    retry: { ...currentConfig.retry, ...newConfig.retry },
    search: { ...currentConfig.search, ...newConfig.search },
    security: { ...currentConfig.security, ...newConfig.security }
  }
}