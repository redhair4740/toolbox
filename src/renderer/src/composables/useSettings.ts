import { ref, reactive, watch } from 'vue'

// 默认设置
const DEFAULT_SETTINGS = {
  // 界面设置
  ui: {
    theme: 'light', // 主题: light, dark, system
    sidebarCollapsed: false, // 侧边栏是否折叠
    confirmBeforeOperation: true, // 操作前是否确认
    showOperationLogs: true // 是否显示操作日志
  },
  // 文件操作设置
  file: {
    preserveTimestamp: false, // 移动文件时是否保留时间戳
    overwriteExisting: false, // 是否覆盖已存在的文件
    createBackup: true, // 重命名前是否创建备份
    maxRecentPaths: 5, // 最近路径最大数量
    defaultExtensions: ['.mkv', '.mp4', '.iso', '.avi', '.mpg'] // 默认文件扩展名
  },
  // 性能设置
  performance: {
    batchSize: 10, // 批处理大小
    parallelOperations: true, // 是否并行操作
    searchDepthLimit: 0 // 搜索深度限制 (0表示无限制)
  }
}

// 设置存储键
const SETTINGS_STORAGE_KEY = 'yo_toolbox_settings'

/**
 * 应用设置管理组合式API
 * @returns 设置相关方法和状态
 */
export function useSettings() {
  // 从localStorage获取保存的设置
  const loadSettings = () => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY)
      if (!saved) return DEFAULT_SETTINGS
      
      const parsedSettings = JSON.parse(saved)
      
      // 合并默认设置和保存的设置，确保新增的设置项也存在
      return {
        ui: { ...DEFAULT_SETTINGS.ui, ...parsedSettings.ui },
        file: { ...DEFAULT_SETTINGS.file, ...parsedSettings.file },
        performance: { ...DEFAULT_SETTINGS.performance, ...parsedSettings.performance }
      }
    } catch (error) {
      console.error('加载设置失败:', error)
      return DEFAULT_SETTINGS
    }
  }
  
  // 设置对象
  const settings = reactive(loadSettings())
  
  // 是否已修改
  const isDirty = ref(false)
  
  // 监听设置变化并标记为已修改
  watch(settings, () => {
    isDirty.value = true
  }, { deep: true })
  
  /**
   * 保存设置到localStorage
   */
  const saveSettings = () => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
      isDirty.value = false
      
      // 触发DOM更新，确保设置立即生效
      document.dispatchEvent(new CustomEvent('settings-saved', { detail: settings }))
      
      return true
    } catch (error) {
      console.error('保存设置失败:', error)
      return false
    }
  }
  
  /**
   * 重置设置为默认值
   */
  const resetSettings = () => {
    Object.assign(settings.ui, DEFAULT_SETTINGS.ui)
    Object.assign(settings.file, DEFAULT_SETTINGS.file)
    Object.assign(settings.performance, DEFAULT_SETTINGS.performance)
    isDirty.value = true
  }
  
  /**
   * 重置特定分类的设置
   * @param category 设置分类
   */
  const resetCategory = (category: 'ui' | 'file' | 'performance') => {
    Object.assign(settings[category], DEFAULT_SETTINGS[category])
    isDirty.value = true
  }
  
  return {
    settings,
    isDirty,
    saveSettings,
    resetSettings,
    resetCategory
  }
} 