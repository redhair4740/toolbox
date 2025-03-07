<!-- 可重用的路径选择器组件 -->
<template>
  <div class="path-group">
    <div class="path-label">
      <el-icon><component :is="icon" /></el-icon>
      <span>{{ label }}</span>
    </div>
    <div class="path-control">
      <el-input :model-value="modelValue" :placeholder="placeholder" readonly>
        <template #append>
          <el-button @click="openFolderDialog">
            <el-icon><Folder /></el-icon>
          </el-button>
        </template>
      </el-input>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Folder } from '@element-plus/icons-vue'

// 定义属性
defineProps({
  modelValue: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  placeholder: {
    type: String,
    default: '选择文件夹路径'
  },
  icon: {
    type: String,
    default: 'FolderOpened'
  }
})

// 定义事件
const emit = defineEmits(['update:modelValue', 'folder-selected'])

// 打开文件夹选择对话框
const openFolderDialog = async () => {
  try {
    const selectedPath = await window.api.openDirectoryDialog()
    if (selectedPath) {
      emit('update:modelValue', selectedPath)
      emit('folder-selected', selectedPath)
    }
  } catch (error) {
    console.error('打开文件夹对话框失败:', error)
  }
}
</script>

<style scoped>
.path-group {
  margin-bottom: 16px;
}

.path-label {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-weight: 500;
}

.path-label .el-icon {
  margin-right: 8px;
  color: var(--el-color-primary);
}

.path-control {
  display: flex;
}
</style>
