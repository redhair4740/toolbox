<template>
  <div class="logs-container">
    <div class="logs-header">
      <h3>操作日志</h3>
      <div class="header-actions">
        <el-button type="primary" size="small" @click="exportLogsToFile">
          <el-icon><Download /></el-icon>
          <span>导出日志</span>
        </el-button>
        <el-button type="danger" size="small" @click="confirmClearLogs">
          <el-icon><Delete /></el-icon>
          <span>清空日志</span>
        </el-button>
      </div>
    </div>
    
    <div class="logs-body">
      <el-empty v-if="logs.length === 0" description="暂无操作日志" />
      
      <div v-else class="logs-list">
        <div v-for="log in logs" :key="log.id" class="log-item">
          <div class="log-header">
            <div class="log-type" :class="getTypeClass(log.type)">{{ getTypeText(log.type) }}</div>
            <div class="log-time">{{ formatTime(log.timestamp) }}</div>
          </div>
          <div class="log-message">{{ log.message }}</div>
          <div v-if="log.details" class="log-details">
            <el-collapse>
              <el-collapse-item title="详细信息">
                <pre>{{ log.details }}</pre>
              </el-collapse-item>
            </el-collapse>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Download, Delete } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import { useOperationLog, type OperationType } from '../../composables/useOperationLog'

const { logs, clearLogs, formatTime, exportLogs } = useOperationLog()

// 获取操作类型文本
const getTypeText = (type: OperationType): string => {
  switch (type) {
    case 'search': return '搜索'
    case 'move': return '移动'
    case 'rename': return '重命名'
    case 'other': return '其他'
    default: return '未知'
  }
}

// 获取操作类型样式类
const getTypeClass = (type: OperationType): string => {
  switch (type) {
    case 'search': return 'type-search'
    case 'move': return 'type-move'
    case 'rename': return 'type-rename'
    case 'other': return 'type-other'
    default: return ''
  }
}

// 导出日志到文件
const exportLogsToFile = () => {
  if (logs.value.length === 0) {
    ElMessageBox.alert('没有可导出的日志', '提示')
    return
  }
  
  const content = exportLogs()
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `操作日志_${new Date().toISOString().slice(0, 10)}.txt`
  a.click()
  
  URL.revokeObjectURL(url)
}

// 清空日志前确认
const confirmClearLogs = async () => {
  if (logs.value.length === 0) return
  
  try {
    await ElMessageBox.confirm('确定要清空所有日志吗？此操作不可恢复。', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    clearLogs()
  } catch {
    // 用户取消
  }
}
</script>

<style scoped>
.logs-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.logs-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logs-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.logs-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.log-item {
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  padding: 12px;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.log-type {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.type-search {
  background-color: #e6f7ff;
  color: #1890ff;
}

.type-move {
  background-color: #f6ffed;
  color: #52c41a;
}

.type-rename {
  background-color: #fff7e6;
  color: #fa8c16;
}

.type-other {
  background-color: #f9f0ff;
  color: #722ed1;
}

.log-time {
  font-size: 12px;
  color: var(--text-light);
}

.log-message {
  font-size: 14px;
  margin-bottom: 8px;
}

.log-details {
  font-size: 13px;
  color: var(--text-light);
}

.log-details pre {
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  font-family: monospace;
}
</style> 