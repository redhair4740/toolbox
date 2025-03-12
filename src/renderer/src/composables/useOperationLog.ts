import { ref } from 'vue'

// 操作类型
export type OperationType = 'search' | 'move' | 'rename' | 'other'

// 操作日志项
export interface LogItem {
  id: number
  type: OperationType
  message: string
  timestamp: number
  details?: string
}

/**
 * 操作日志管理组合式API
 * @param maxLogs 最大日志数量
 * @returns 日志相关方法和状态
 */
export function useOperationLog(maxLogs = 100) {
  const logs = ref<LogItem[]>([])
  let nextId = 1

  /**
   * 添加日志
   * @param type 操作类型
   * @param message 日志消息
   * @param details 详细信息
   */
  const addLog = (type: OperationType, message: string, details?: string) => {
    const log: LogItem = {
      id: nextId++,
      type,
      message,
      timestamp: Date.now(),
      details
    }
    
    logs.value.unshift(log)
    
    // 保持最大数量
    if (logs.value.length > maxLogs) {
      logs.value = logs.value.slice(0, maxLogs)
    }
    
    return log.id
  }

  /**
   * 清空日志
   */
  const clearLogs = () => {
    logs.value = []
  }

  /**
   * 获取格式化的时间
   * @param timestamp 时间戳
   * @returns 格式化的时间字符串
   */
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  /**
   * 导出日志为文本
   * @returns 日志文本
   */
  const exportLogs = () => {
    return logs.value
      .map(log => `[${formatTime(log.timestamp)}] [${log.type}] ${log.message}${log.details ? `\n  ${log.details}` : ''}`)
      .join('\n\n')
  }

  return {
    logs,
    addLog,
    clearLogs,
    formatTime,
    exportLogs
  }
} 