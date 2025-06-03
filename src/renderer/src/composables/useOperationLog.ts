import { ref } from 'vue'

// 日志类型定义
interface OperationLog {
  time: Date
  category: string
  type: 'info' | 'success' | 'warning' | 'error'
  message: string
  details?: string | object
}

// 最大日志条数
const MAX_LOGS = 1000

// 创建一个全局的日志存储
const logs = ref<OperationLog[]>([])

export function useOperationLog() {
  // 添加日志
  const addLog = (
    category: string,
    message: string,
    type: OperationLog['type'] = 'info',
    details?: string | object
  ) => {
    const log: OperationLog = {
      time: new Date(),
      category,
      type,
      message,
      details
    }

    logs.value.unshift(log)

    // 限制日志数量
    if (logs.value.length > MAX_LOGS) {
      logs.value = logs.value.slice(0, MAX_LOGS)
    }

    // 保存到本地存储
    saveLogsToStorage()
  }

  // 清空所有日志
  const clearAllLogs = () => {
    logs.value = []
    saveLogsToStorage()
  }

  // 清空特定分类的日志
  const clearCategoryLogs = (category: string) => {
    logs.value = logs.value.filter(log => log.category !== category)
    saveLogsToStorage()
  }

  // 获取特定分类的日志
  const getCategoryLogs = (category: string) => {
    return logs.value.filter(log => log.category === category)
  }

  // 获取特定类型的日志
  const getLogsByType = (type: OperationLog['type']) => {
    return logs.value.filter(log => log.type === type)
  }

  // 获取日志统计信息
  const getLogStats = () => {
    return {
      total: logs.value.length,
      info: logs.value.filter(log => log.type === 'info').length,
      success: logs.value.filter(log => log.type === 'success').length,
      warning: logs.value.filter(log => log.type === 'warning').length,
      error: logs.value.filter(log => log.type === 'error').length
    }
  }

  // 导出日志
  const exportLogs = () => {
    const exportData = logs.value.map(log => ({
      time: log.time.toISOString(),
      category: log.category,
      type: log.type,
      message: log.message,
      details: log.details
    }))

    return JSON.stringify(exportData, null, 2)
  }

  // 保存日志到本地存储
  const saveLogsToStorage = () => {
    try {
      const serializedLogs = logs.value.map(log => ({
        time: log.time.toISOString(),
        category: log.category,
        type: log.type,
        message: log.message,
        details: log.details
      }))
      localStorage.setItem('operation_logs', JSON.stringify(serializedLogs))
    } catch (error) {
      console.error('Failed to save logs to storage:', error)
    }
  }

  // 从本地存储加载日志
  const loadLogsFromStorage = () => {
    try {
      const savedLogs = localStorage.getItem('operation_logs')
      if (savedLogs) {
        const parsedLogs = JSON.parse(savedLogs) as {
          time: string
          category: string
          type: 'info' | 'success' | 'warning' | 'error'
          message: string
          details?: string | object
        }[]
        logs.value = parsedLogs.map(log => ({
          ...log,
          time: new Date(log.time)
        }))
      }
    } catch (error) {
      console.error('Failed to load logs from storage:', error)
    }
  }

  // 初始化时加载日志
  loadLogsFromStorage()

  return {
    logs,
    addLog,
    clearAllLogs,
    clearCategoryLogs,
    getCategoryLogs,
    getLogsByType,
    getLogStats,
    exportLogs
  }
}