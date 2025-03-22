`<template>
  <div class="path-selector">
    <div class="path-input-container">
      <el-input
        v-model="localPath"
        :placeholder="placeholder"
        clearable
        :disabled="disabled"
      >
        <template #prepend>
          <el-icon>
            <component :is="icon" />
          </el-icon>
        </template>
        <template #append>
          <el-button @click="openDialog">
            <el-icon>
              <Folder />
            </el-icon>
          </el-button>
        </template>
      </el-input>
    </div>

    <div v-if="showRecentPaths && recentPaths.length > 0" class="recent-paths">
      <div class="recent-paths-header">
        <span>最近路径</span>
        <el-button
          type="text"
          size="small"
          @click="clearRecentPaths"
        >
          清空
        </el-button>
      </div>
      <div class="recent-paths-list">
        <el-scrollbar max-height="150px">
          <div
            v-for="(path, index) in recentPaths"
            :key="index"
            class="recent-path-item"
            @click="selectRecentPath(path)"
          >
            <el-tooltip :content="path" placement="top">
              <div class="path-text">{{ path }}</div>
            </el-tooltip>
            <el-button
              type="danger"
              size="small"
              circle
              @click.stop="removeRecentPath(path)"
            >
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
        </el-scrollbar>
      </div>
    </div>

    <PathSelectorDialog
      v-model="dialogVisible"
      :type="type"
      :title="dialogTitle"
      :initial-path="localPath"
      :filters="filters"
      :multiple="multiple"
      @select="handlePathSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Folder, Document, Close } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import PathSelectorDialog from './PathSelectorDialog.vue'
import { useRecentPaths } from '../../composables/useRecentPaths'

// 路径选择器类型
type PathSelectorType = 'file' | 'directory' | 'save'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  type: {
    type: String as () => PathSelectorType,
    default: 'directory'
  },
  placeholder: {
    type: String,
    default: '请选择路径'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  filters: {
    type: Array as () => string[],
    default: () => []
  },
  multiple: {
    type: Boolean,
    default: false
  },
  showRecentPaths: {
    type: Boolean,
    default: true
  },
  maxRecentPaths: {
    type: Number,
    default: 5
  },
  dialogTitle: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'select'])

// 本地路径
const localPath = ref(props.modelValue)

// 对话框可见性
const dialogVisible = ref(false)

// 使用最近路径组合式API
const { 
  recentPaths: allRecentPaths, 
  addRecentPath, 
  removeRecentPath: removeFromRecentPaths,
  clearRecentPaths: clearAllRecentPaths 
} = useRecentPaths()

// 计算属性：根据类型筛选最近路径
const recentPaths = computed(() => {
  return allRecentPaths.value.slice(0, props.maxRecentPaths)
})

// 计算属性：图标
const icon = computed(() => {
  return props.type === 'directory' ? Folder : Document
})

// 打开对话框
const openDialog = () => {
  dialogVisible.value = true
}

// 处理路径选择
const handlePathSelect = (path: string | string[]) => {
  if (Array.isArray(path)) {
    // 多选模式
    localPath.value = path.join(';')
    path.forEach(p => addRecentPath(p))
  } else {
    // 单选模式
    localPath.value = path
    if (path) {
      addRecentPath(path)
    }
  }
  
  emit('update:modelValue', localPath.value)
  emit('select', path)
}

// 选择最近路径
const selectRecentPath = (path: string) => {
  localPath.value = path
  emit('update:modelValue', path)
  emit('select', path)
}

// 从最近路径中移除
const removeRecentPath = (path: string) => {
  removeFromRecentPaths(path)
}

// 清空最近路径
const clearRecentPaths = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有最近路径记录吗？',
      '清空确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    clearAllRecentPaths()
  } catch {
    // 用户取消操作
  }
}

// 监听外部传入的值
watch(() => props.modelValue, (newValue) => {
  localPath.value = newValue
})

// 监听本地值的变化
watch(localPath, (newValue) => {
  emit('update:modelValue', newValue)
})
</script>

<style scoped>
.path-selector {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

.path-input-container {
  width: 100%;
}

.recent-paths {
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  padding: 0.5rem;
}

.recent-paths-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.9em;
  color: var(--el-text-color-secondary);
}

.recent-paths-list {
  max-height: 150px;
}

.recent-path-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.recent-path-item:hover {
  background-color: var(--el-fill-color-light);
}

.path-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.9em;
}
</style>`