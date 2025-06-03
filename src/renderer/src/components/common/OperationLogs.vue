`<template>
  <div class="operation-logs">
    <el-card class="log-card">
      <template #header>
        <div class="log-header">
          <span>操作日志</span>
          <div class="log-actions">
            <el-select
              v-model="currentCategory"
              placeholder="日志类别"
              size="small"
              style="width: 120px"
            >
              <el-option label="全部" value="all" />
              <el-option
                v-for="category in availableCategories"
                :key="category"
                :label="getCategoryLabel(category)"
                :value="category"
              />
            </el-select>
            <el-switch
              v-model="autoScroll"
              active-text="自动滚动"
            />
            <el-button
              type="primary"
              size="small"
              @click="clearLogs"
            >
              清除
            </el-button>
            <el-button
              type="success"
              size="small"
              @click="exportLogs"
            >
              导出
            </el-button>
          </div>
        </div>
      </template>
      
      <div
        ref="logContainer"
        class="log-container"
        @scroll="handleScroll"
      >
        <div v-if="filteredLogs.length === 0" class="no-logs">
          暂无日志记录
        </div>
        
        <div
          v-for="(log, index) in filteredLogs"
          :key="index"
          class="log-item"
          :class="[log.type, { expanded: expandedLogs.includes(index) }]"
          @click="toggleExpand(index)"
        >
          <div class="log-header-row">
            <span class="log-time">{{ formatTime(log.time) }}</span>
            <span class="log-category">{{ getCategoryLabel(log.category) }}</span>
            <span class="log-message">{{ getShortMessage(log.message) }}</span>
          </div>
          <div v-if="expandedLogs.includes(index)" class="log-details">
            <pre>{{ log.message }}</pre>
            <div v-if="log.details" class="log-extra-details">
              <pre>{{ log.details }}</pre>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useOperationLog } from '../../composables/useOperationLog'

// 日志类型映射
const categoryLabels: Record<string, string> = {
  'all': '全部',
  'search': '文件搜索',
  'rename': '文件重命名',
  'move': '文件移动',
  'copy': '文件复制',
  'batch': '批量操作',
  'system': '系统操作'
}

// 日志状态
const currentCategory = ref('all')
const autoScroll = ref(true)
const isUserScrolling = ref(false)
const expandedLogs = ref<number[]>([])
const logContainer = ref<HTMLElement | null>(null)

// 使用日志组合式API
const { logs, clearAllLogs } = useOperationLog()

// 计算可用的日志类别
const availableCategories = computed(() => {
  const categories = new Set<string>()
  logs.value.forEach(log => categories.add(log.category))
  return Array.from(categories)
})

// 根据当前选择的类别过滤日志
const filteredLogs = computed(() => {
  if (currentCategory.value === 'all') {
    return logs.value
  }
  return logs.value.filter(log => log.category === currentCategory.value)
})

// 监听日志变化，自动滚动
watch(filteredLogs, () => {
  if (autoScroll.value && !isUserScrolling.value) {
    scrollToBottom()
  }
}, { deep: true })

// 获取日志类别显示名称
const getCategoryLabel = (category: string) => {
  return categoryLabels[category] || category
}

// 格式化时间
const formatTime = (date: Date) => {
  return date.toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 获取短消息（用于折叠显示）
const getShortMessage = (message: string) => {
  const maxLength = 100
  if (message.length <= maxLength) return message
  return message.substring(0, maxLength) + '...'
}

// 切换日志展开状态
const toggleExpand = (index: number) => {
  const position = expandedLogs.value.indexOf(index)
  if (position > -1) {
    expandedLogs.value.splice(position, 1)
  } else {
    expandedLogs.value.push(index)
  }
}

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick()
  if (logContainer.value) {
    logContainer.value.scrollTop = logContainer.value.scrollHeight
  }
}

// 处理滚动事件
const handleScroll = () => {
  if (!logContainer.value) return
  
  const { scrollTop, scrollHeight, clientHeight } = logContainer.value
  const isAtBottom = scrollHeight - scrollTop - clientHeight < 10
  
  isUserScrolling.value = !isAtBottom
}

// 清除日志
const clearLogs = () => {
  ElMessageBox.confirm('确定要清除所有日志记录吗？', '确认操作', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    clearAllLogs()
    expandedLogs.value = []
    ElMessage.success('日志已清除')
  }).catch(() => {})
}

// 导出日志
const exportLogs = async () => {
  try {
    // 准备日志内容
    const logContent = logs.value.map(log => {
      const time = formatTime(log.time)
      const category = getCategoryLabel(log.category)
      return `[${time}] [${category}] [${log.type}] ${log.message}`
    }).join('\n')
    
    // 生成文件名
    const now = new Date()
    const fileName = `yo_toolbox_logs_${now.getFullYear()}-${
      String(now.getMonth() + 1).padStart(2, '0')
    }-${
      String(now.getDate()).padStart(2, '0')
    }_${
      String(now.getHours()).padStart(2, '0')
    }-${
      String(now.getMinutes()).padStart(2, '0')
    }.txt`
    
    // 调用保存文件API
    await (window as any).electron.fileService?.saveTextFile({
      content: logContent,
      fileName: fileName,
      title: '保存日志文件'
    })
    
    ElMessage.success('日志导出成功')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ElMessage.error(`导出日志失败: ${errorMessage}`)
  }
}

// 生命周期钩子
onMounted(() => {
  scrollToBottom()
})
</script>

<style scoped>
.operation-logs {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.log-card {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.log-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.log-container {
  flex: 1;
  height: 100%;
  overflow-y: auto;
  font-family: monospace;
  font-size: 0.9em;
}

.no-logs {
  padding: 1rem;
  text-align: center;
  color: var(--el-text-color-secondary);
}

.log-item {
  padding: 4px 8px;
  border-bottom: 1px solid var(--el-border-color-light);
  cursor: pointer;
}

.log-item:hover {
  background-color: var(--el-fill-color-light);
}

.log-item.expanded {
  background-color: var(--el-fill-color);
}

.log-header-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.log-time {
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.log-category {
  background-color: var(--el-color-info-light);
  color: var(--el-color-info);
  padding: 0 4px;
  border-radius: 4px;
  font-size: 0.8em;
  white-space: nowrap;
}

.log-message {
  word-break: break-all;
}

.log-details {
  margin-top: 4px;
  padding: 8px;
  background-color: var(--el-fill-color-darker);
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-all;
}

.log-extra-details {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed var(--el-border-color);
}

.log-item.info .log-message {
  color: var(--el-text-color-primary);
}

.log-item.success .log-message {
  color: var(--el-color-success);
}

.log-item.warning .log-message {
  color: var(--el-color-warning);
}

.log-item.error .log-message {
  color: var(--el-color-danger);
}
</style>`