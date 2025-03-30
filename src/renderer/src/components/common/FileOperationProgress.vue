<template>
  <div class="file-operation-progress">
    <div class="progress-header">
      <div class="operation-info">
        <el-icon :size="24" class="operation-icon">
          <component :is="operationIcon" />
        </el-icon>
        <div class="operation-details">
          <h3>{{ title }}</h3>
          <p v-if="description">{{ description }}</p>
        </div>
      </div>
      
      <div class="operation-actions">
        <el-button
          v-if="canCancel"
          type="danger"
          size="small"
          :disabled="!isRunning"
          @click="onCancel"
        >
          取消
        </el-button>
        
        <el-button
          v-if="canPause"
          type="warning"
          size="small"
          :disabled="!isRunning"
          @click="onPauseResume"
        >
          {{ isPaused ? '继续' : '暂停' }}
        </el-button>
      </div>
    </div>
    
    <!-- 进度内容，根据showProgress显示或隐藏 -->
    <div v-if="showProgress" class="progress-content">
      <ProgressBar
        :current="current"
        :total="total"
        :show-speed="true"
        :show-current-item="true"
        :current-item="currentItem"
        :striped="true"
        :striped-flow="isRunning && !isPaused"
        :status="progressStatus"
      />
      
      <div v-if="showStats" class="operation-stats">
        <div class="stat-item">
          <span class="stat-label">已处理:</span>
          <span class="stat-value">{{ current }} / {{ total }}</span>
        </div>
        
        <div class="stat-item">
          <span class="stat-label">成功:</span>
          <span class="stat-value">{{ successCount }}</span>
        </div>
        
        <div v-if="errorCount > 0" class="stat-item error">
          <span class="stat-label">失败:</span>
          <span class="stat-value">{{ errorCount }}</span>
        </div>
        
        <div v-if="skippedCount > 0" class="stat-item warning">
          <span class="stat-label">跳过:</span>
          <span class="stat-value">{{ skippedCount }}</span>
        </div>
        
        <div class="stat-item">
          <span class="stat-label">耗时:</span>
          <span class="stat-value">{{ elapsedTime }}</span>
        </div>
      </div>
    </div>
    
    <div v-if="logs.length > 0" class="log-section">
      <el-collapse>
        <el-collapse-item title="操作日志" name="logs">
          <el-scrollbar height="150px">
            <div class="log-list">
              <div v-for="(log, index) in logs" :key="index" class="log-item" :class="log.type">
                <el-icon>
                  <InfoFilled v-if="log.type === 'info'" />
                  <SuccessFilled v-else-if="log.type === 'success'" />
                  <WarningFilled v-else-if="log.type === 'warning'" />
                  <CircleCloseFilled v-else-if="log.type === 'error'" />
                </el-icon>
                <span>{{ log.time }} - {{ log.message }}</span>
              </div>
            </div>
          </el-scrollbar>
        </el-collapse-item>
      </el-collapse>
    </div>
    
    <div v-if="showErrors && errors.length > 0" class="error-section">
      <el-collapse>
        <el-collapse-item title="错误详情" name="errors">
          <el-scrollbar height="150px">
            <div class="error-list">
              <div v-for="(error, index) in errors" :key="index" class="error-item">
                <el-icon><WarningFilled /></el-icon>
                <span>{{ error }}</span>
              </div>
            </div>
          </el-scrollbar>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { 
  Document, 
  Search, 
  Folder, 
  Delete, 
  Edit, 
  WarningFilled,
  Upload,
  Download,
  CopyDocument,
  RefreshRight,
  InfoFilled,
  SuccessFilled,
  CircleCloseFilled
} from '@element-plus/icons-vue'
import ProgressBar from './ProgressBar.vue'

// 操作类型
type OperationType = 'search' | 'rename' | 'move' | 'delete' | 'copy' | 'upload' | 'download' | 'batch' | 'other'

// 日志类型
type LogType = 'info' | 'success' | 'warning' | 'error'

// 日志项
interface LogItem {
  message: string
  type: LogType
  time: string
}

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  operationType: {
    type: String as () => OperationType,
    default: 'other'
  },
  showProgress: {
    type: Boolean,
    default: false
  },
  current: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
  },
  currentItem: {
    type: String,
    default: ''
  },
  successCount: {
    type: Number,
    default: 0
  },
  errorCount: {
    type: Number,
    default: 0
  },
  skippedCount: {
    type: Number,
    default: 0
  },
  errors: {
    type: Array as () => string[],
    default: () => []
  },
  isRunning: {
    type: Boolean,
    default: false
  },
  isPaused: {
    type: Boolean,
    default: false
  },
  canCancel: {
    type: Boolean,
    default: true
  },
  canPause: {
    type: Boolean,
    default: false
  },
  showStats: {
    type: Boolean,
    default: true
  },
  showErrors: {
    type: Boolean,
    default: true
  },
  startTime: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['cancel', 'pause', 'resume'])

// 添加日志数组
const logs = ref<LogItem[]>([])

// 添加日志方法
const addLog = (message: string, type: LogType = 'info') => {
  const time = new Date().toLocaleTimeString()
  logs.value.push({ message, type, time })
  
  // 根据日志类型同步输出到控制台
  switch (type) {
    case 'info':
      console.info(`[${props.title}] ${message}`)
      break
    case 'success':
      console.log(`[${props.title}] ${message}`)
      break
    case 'warning':
      console.warn(`[${props.title}] ${message}`)
      break
    case 'error':
      console.error(`[${props.title}] ${message}`)
      break
  }
}

// 清除日志
const clearLogs = () => {
  logs.value = []
}

// 暴露方法给父组件
defineExpose({
  addLog,
  clearLogs
})

// 操作图标
const operationIcon = computed(() => {
  switch (props.operationType) {
    case 'search':
      return Search
    case 'rename':
      return Edit
    case 'move':
      return Folder
    case 'delete':
      return Delete
    case 'copy':
      return CopyDocument
    case 'upload':
      return Upload
    case 'download':
      return Download
    case 'batch':
      return RefreshRight
    default:
      return Document
  }
})

// 进度状态
const progressStatus = computed(() => {
  if (!props.isRunning && props.current === props.total) {
    return 'success'
  }
  if (props.errorCount > 0) {
    return 'error'
  }
  if (props.isPaused) {
    return 'warning'
  }
  return ''
})

// 计算已用时间
const currentTime = ref(Date.now())
const elapsedTime = computed(() => {
  if (!props.startTime) return '0秒'
  
  const seconds = Math.floor((currentTime.value - props.startTime) / 1000)
  
  if (seconds < 60) {
    return `${seconds}秒`
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}分${remainingSeconds}秒`
  } else {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}小时${minutes}分钟`
  }
})

// 定时更新当前时间
let timer: number | null = null

onMounted(() => {
  timer = window.setInterval(() => {
    if (props.isRunning && !props.isPaused) {
      currentTime.value = Date.now()
    }
  }, 1000)
})

onUnmounted(() => {
  if (timer !== null) {
    clearInterval(timer)
  }
})

// 取消操作
const onCancel = () => {
  emit('cancel')
}

// 暂停/继续操作
const onPauseResume = () => {
  if (props.isPaused) {
    emit('resume')
  } else {
    emit('pause')
  }
}

// 监听操作完成
watch(() => props.isRunning, (newVal) => {
  if (!newVal) {
    // 操作结束时更新一次时间
    currentTime.value = Date.now()
  }
})
</script>

<style scoped>
.file-operation-progress {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  background-color: var(--el-fill-color-blank);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.operation-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.operation-icon {
  color: var(--el-color-primary);
}

.operation-details {
  display: flex;
  flex-direction: column;
}

.operation-details h3 {
  margin: 0;
  font-size: 1.1em;
}

.operation-details p {
  margin: 0.25rem 0 0;
  font-size: 0.9em;
  color: var(--el-text-color-secondary);
}

.operation-actions {
  display: flex;
  gap: 0.5rem;
}

.progress-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.operation-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 0.5rem;
  font-size: 0.9em;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.stat-label {
  color: var(--el-text-color-secondary);
}

.stat-item.error .stat-value {
  color: var(--el-color-danger);
}

.stat-item.warning .stat-value {
  color: var(--el-color-warning);
}

/* 日志部分样式 */
.log-section {
  margin-top: 0.5rem;
}

.log-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.log-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9em;
  padding: 4px 0;
}

.log-item.info {
  color: var(--el-text-color-regular);
}

.log-item.success {
  color: var(--el-color-success);
}

.log-item.warning {
  color: var(--el-color-warning);
}

.log-item.error {
  color: var(--el-color-danger);
}

.error-section {
  margin-top: 0.5rem;
}

.error-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.error-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--el-color-danger);
  font-size: 0.9em;
}
</style>