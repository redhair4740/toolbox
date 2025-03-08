<template>
  <div class="progress-container" v-if="visible">
    <div class="progress-overlay"></div>
    <div class="progress-dialog">
      <div class="progress-header">
        <h3>{{ title }}</h3>
        <el-button v-if="cancelable" type="danger" size="small" @click="$emit('cancel')">
          取消
        </el-button>
      </div>
      
      <div class="progress-body">
        <div class="progress-info">
          <div class="progress-status">{{ statusText }}</div>
          <div class="progress-percentage">{{ percentage }}%</div>
        </div>
        
        <el-progress :percentage="percentage" :status="status" />
        
        <div class="current-file" v-if="currentFile">
          <div class="file-label">当前处理:</div>
          <div class="file-name">{{ currentFile }}</div>
        </div>
      </div>
      
      <div class="progress-footer" v-if="completed">
        <el-button type="primary" @click="$emit('close')">关闭</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '处理中...'
  },
  current: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
  },
  currentFile: {
    type: String,
    default: ''
  },
  completed: {
    type: Boolean,
    default: false
  },
  success: {
    type: Number,
    default: 0
  },
  failed: {
    type: Number,
    default: 0
  },
  cancelable: {
    type: Boolean,
    default: true
  }
})

defineEmits(['cancel', 'close'])

// 计算进度百分比
const percentage = computed(() => {
  if (props.total === 0) return 0
  return Math.min(Math.round((props.current / props.total) * 100), 100)
})

// 计算状态文本
const statusText = computed(() => {
  if (props.completed) {
    if (props.failed > 0) {
      return `已完成 (成功: ${props.success}, 失败: ${props.failed})`
    }
    return '已完成'
  }
  return `处理中... ${props.current}/${props.total}`
})

// 计算进度条状态
const status = computed(() => {
  if (props.completed) {
    return props.failed > 0 ? 'warning' : 'success'
  }
  return ''
})
</script>

<style scoped>
.progress-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.progress-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}

.progress-dialog {
  width: 450px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.progress-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.progress-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.progress-status {
  font-size: 14px;
  color: var(--text-light);
}

.progress-percentage {
  font-size: 14px;
  font-weight: 500;
}

.current-file {
  margin-top: 8px;
  display: flex;
  font-size: 13px;
  gap: 8px;
}

.file-label {
  color: var(--text-light);
}

.file-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.progress-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
}
</style> 