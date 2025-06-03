<template>
  <div class="path-selector">
    <div class="path-input-container">
      <el-input
        v-model="localPath"
        :placeholder="placeholder"
        clearable
        :disabled="disabled"
      >
        <template #append>
          <div class="path-buttons-container">
            <el-button @click="openNativeDialog">
              <el-icon>
                <Folder />
              </el-icon>
            </el-button>
          </div>
        </template>
      </el-input>
      
      <el-dropdown 
        v-if="showRecentPaths && recentPaths.length > 0" 
        trigger="click" 
        @command="selectRecentPath"
        class="history-dropdown"
      >
        <el-button class="history-btn">
          <el-icon><Clock /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item v-for="(path, index) in recentPaths" :key="index" :command="path">
              <div class="recent-path-item">
                <span class="path-text">{{ formatPath(path) }}</span>
                <el-button
                  type="danger"
                  size="small"
                  circle
                  @click.stop="removeRecentPath(path)"
                >
                  <el-icon><Close /></el-icon>
                </el-button>
              </div>
            </el-dropdown-item>
            <el-dropdown-item divided>
              <div @click.stop="clearRecentPaths">
                <el-icon><Delete /></el-icon>
                <span>清空历史</span>
              </div>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    
    <div v-if="multiple && selectedPaths.length > 0" class="selected-paths-container">
      <div v-for="(path, index) in selectedPaths" :key="index" class="selected-path-item">
        <el-tag closable @close="removePath(index)" class="path-tag">
          <el-tooltip :content="path" placement="top" :show-after="500">
            <span class="path-tag-text">{{ formatPath(path) }}</span>
          </el-tooltip>
        </el-tag>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Folder, Close, Clock, Delete } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
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
  },
  category: {
    type: String,
    default: 'default'
  }
})

const emit = defineEmits(['update:modelValue', 'select'])

// 本地路径
const localPath = ref(props.modelValue)

// 选中的多个路径
const selectedPaths = ref<string[]>([])

// 使用最近路径组合式API - 使用分类参数
const { 
  recentPaths, 
  addRecentPath, 
  removeRecentPath: removeFromRecentPaths,
  clearRecentPaths: clearAllRecentPaths 
} = useRecentPaths(props.category)

// 格式化路径显示，只显示最后两个部分
const formatPath = (fullPath: string) => {
  if (!fullPath) return '';
  
  const pathParts = fullPath.split(/[/\\]/);
  
  if (pathParts.length <= 2) {
    return fullPath;
  }
  
  // 如果是Windows路径，特殊处理第一部分 (C:)
  if (fullPath.match(/^[a-zA-Z]:/)) {
    const drive = pathParts[0];
    const filename = pathParts[pathParts.length - 1];
    return `${drive}\\...\\${filename}`;
  }
  
  // 一般路径
  return '.../' + pathParts.slice(-1)[0];
}

// 打开原生对话框
const openNativeDialog = async () => {
  try {
    // 准备属性
    const properties: string[] = []
    
    if (props.type === 'directory') {
      properties.push('openDirectory')
    } else if (props.type === 'file') {
      properties.push('openFile')
    } else if (props.type === 'save') {
      // 使用保存对话框
      const result = await window.electron.ipcRenderer.invoke('select-save-path', {
        title: props.dialogTitle || '保存文件',
        defaultPath: localPath.value,
        filters: props.filters.map(ext => ({ 
          name: ext.replace('*', '').toUpperCase() + ' 文件', 
          extensions: [ext.replace('*.', '')] 
        }))
      })
      
      if (result) {
        localPath.value = result
        emit('update:modelValue', result)
        emit('select', result)
        addRecentPath(result)
      }
      
      return
    }
    
    // 多选
    if (props.multiple) {
      properties.push('multiSelections')
    }
    
    // 调用主进程打开对话框
    const paths = await window.electron.ipcRenderer.invoke('select-path', {
      title: props.dialogTitle || (props.type === 'directory' ? '选择文件夹' : '选择文件'),
      defaultPath: localPath.value ? localPath.value.split(';')[0] : '',
      filters: props.type === 'file' ? props.filters.map(ext => ({ 
        name: ext.replace('*', '').toUpperCase() + ' 文件', 
        extensions: [ext.replace('*.', '')] 
      })) : undefined,
      properties
    })
    
    if (paths && paths.length > 0) {
      if (props.multiple) {
        // 多选模式
        paths.forEach(p => {
          if (!selectedPaths.value.includes(p)) {
            selectedPaths.value.push(p)
          }
          addRecentPath(p)
        })
        
        // 更新本地路径和发送事件
        updateLocalPathFromSelected()
      } else {
        // 单选模式
        localPath.value = paths[0]
        addRecentPath(paths[0])
        emit('update:modelValue', paths[0])
        emit('select', paths[0])
      }
    }
  } catch (error) {
    console.error('Failed to open file dialog:', error)
  }
}

// 更新本地路径从已选路径
const updateLocalPathFromSelected = () => {
  localPath.value = selectedPaths.value.join(';')
  emit('update:modelValue', localPath.value)
  emit('select', props.multiple ? selectedPaths.value : localPath.value)
}

// 选择最近路径
const selectRecentPath = (path: string) => {
  if (props.multiple) {
    // 多选模式下，添加到已选路径列表
    if (!selectedPaths.value.includes(path)) {
      selectedPaths.value.push(path)
      updateLocalPathFromSelected()
    }
  } else {
    // 单选模式
    localPath.value = path
    emit('update:modelValue', path)
    emit('select', path)
  }
}

// 从最近路径中移除
const removeRecentPath = (path: string) => {
  removeFromRecentPaths(path)
}

// 从已选路径中移除单个路径
const removePath = (index: number) => {
  selectedPaths.value.splice(index, 1)
  updateLocalPathFromSelected()
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

// 初始化已选路径
const initSelectedPaths = () => {
  if (props.multiple && localPath.value) {
    const paths = localPath.value.split(';').filter(p => p.trim() !== '')
    selectedPaths.value = paths
  }
}

// 监听外部传入的值
watch(() => props.modelValue, (newValue) => {
  localPath.value = newValue
  // 如果外部值变化，重新初始化已选路径
  initSelectedPaths()
})

// 监听本地值的变化
watch(localPath, (newValue) => {
  emit('update:modelValue', newValue)
})

// 初始化
initSelectedPaths()
</script>

<style scoped>
.path-selector {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.path-input-container {
  width: 100%;
  display: flex;
  align-items: center;
}

.path-buttons-container {
  display: flex;
  align-items: center;
}

.history-dropdown {
  margin-left: 8px;
}

.history-btn {
  border-radius: 4px;
}

.recent-path-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.path-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 0.5rem;
  max-width: 200px;
}

.selected-paths-container {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.selected-path-item {
  margin-bottom: 4px;
}

.path-tag {
  max-width: 300px;
  display: flex;
  align-items: center;
}

.path-tag-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>