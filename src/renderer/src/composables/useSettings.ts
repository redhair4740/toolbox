import { reactive, watch } from 'vue'

// 默认设置
const defaultSettings = {
  // 通用设置
  general: {
    theme: 'system',
    language: 'zh-CN',
    zoom: 100,
    autoStart: false,
    minimizeToTray: true
  },
  
  // 文件操作设置
  file: {
    defaultConflictStrategy: 'ask',
    enableParallel: true,
    maxParallel: 4,
    confirmBeforeDelete: true,
    preserveTimestamp: true,
    bufferSize: '65536'
  },
  
  // 搜索设置
  search: {
    threads: 4,
    ignoreCase: true,
    includeHidden: false,
    maxFileSize: 100,
    maxFileSizeUnit: 'MB',
    excludedFiles: [
      'node_modules/**/*',
      '.git/**/*',
      '*.log',
      '*.tmp',
      '*.temp',
      '*.swp',
      '*~'
    ]
  },
  
  // 高级设置
  advanced: {
    logLevel: 'info',
    logRetention: 7,
    maxCacheSize: 1000,
    devTools: false
  },
  
  // 界面设置
  ui: {
    sidebarCollapsed: false
  }
}

// 设置类型
interface AppSettings {
  general: {
    theme: string;
    language: string;
    zoom: number;
    autoStart: boolean;
    minimizeToTray: boolean;
  };
  file: {
    defaultConflictStrategy: string;
    enableParallel: boolean;
    maxParallel: number;
    confirmBeforeDelete: boolean;
    preserveTimestamp: boolean;
    bufferSize: string;
  };
  search: {
    threads: number;
    ignoreCase: boolean;
    includeHidden: boolean;
    maxFileSize: number;
    maxFileSizeUnit: string;
    excludedFiles: string[];
  };
  advanced: {
    logLevel: string;
    logRetention: number;
    maxCacheSize: number;
    devTools: boolean;
  };
  ui: {
    sidebarCollapsed: boolean;
  };
}

// 创建一个全局的设置存储
const settings = reactive<AppSettings>(JSON.parse(JSON.stringify(defaultSettings)));
// 初始化标志
let initialized = false;

// 初始加载设置
(async () => {
  try {
    if (!initialized) {
      const savedSettings = localStorage.getItem('app_settings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        
        // 合并设置，确保新增的默认设置也被包含
        Object.keys(defaultSettings).forEach(key => {
          const category = key as keyof AppSettings;
          if (parsedSettings[category]) {
            settings[category] = {
              ...JSON.parse(JSON.stringify(defaultSettings[category])),
              ...parsedSettings[category]
            };
          }
        });
      }
      
      initialized = true;
    }
  } catch (error) {
    console.error('初始化设置失败', error);
  }
})();

export function useSettings() {
  // 获取所有设置
  const getAllSettings = (): AppSettings => {
    return JSON.parse(JSON.stringify(settings))
  }
  
  // 获取特定分类的设置
  const getCategorySettings = <T extends keyof AppSettings>(category: T): AppSettings[T] => {
    return JSON.parse(JSON.stringify(settings[category]))
  }
  
  // 更新设置
  const updateSettings = <T extends keyof AppSettings>(
    category: T,
    newSettings: Partial<AppSettings[T]>
  ): void => {
    settings[category] = {
      ...settings[category],
      ...newSettings
    }
    
    saveSettings()
  }
  
  // 重置特定分类的设置
  const resetCategorySettings = <T extends keyof AppSettings>(category: T): void => {
    settings[category] = JSON.parse(JSON.stringify(defaultSettings[category]))
    saveSettings()
  }
  
  // 重置所有设置
  const resetAllSettings = (): void => {
    Object.keys(defaultSettings).forEach(key => {
      const category = key as keyof AppSettings
      settings[category] = JSON.parse(JSON.stringify(defaultSettings[category]))
    })
    
    saveSettings()
  }
  
  // 保存设置到本地存储
  const saveSettings = (): void => {
    try {
      // 保存设置到localStorage
      localStorage.setItem('app_settings', JSON.stringify(settings))
      
      // 同步更新主题设置到theme_mode
      localStorage.setItem('theme_mode', settings.general.theme)
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }
  
  // 导出设置
  const exportSettings = (): string => {
    return JSON.stringify(settings, null, 2)
  }
  
  // 导入设置
  const importSettings = (jsonSettings: string): boolean => {
    try {
      const parsedSettings = JSON.parse(jsonSettings)
      
      // 验证设置格式
      if (typeof parsedSettings !== 'object') {
        throw new Error('Invalid settings format')
      }
      
      // 合并设置
      Object.keys(defaultSettings).forEach(key => {
        const category = key as keyof AppSettings
        if (parsedSettings[category]) {
          settings[category] = {
            ...JSON.parse(JSON.stringify(defaultSettings[category])),
            ...parsedSettings[category]
          }
        }
      })
      
      saveSettings()
      return true
    } catch (error) {
      console.error('Failed to import settings:', error)
      return false
    }
  }
  
  // 监听设置变化
  watch(settings, () => {
    if (initialized) {
      saveSettings()
    }
  }, { deep: true })
  
  return {
    settings,
    getAllSettings,
    getCategorySettings,
    updateSettings,
    resetCategorySettings,
    resetAllSettings,
    saveSettings,
    exportSettings,
    importSettings
  }
}