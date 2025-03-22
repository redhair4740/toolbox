`<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title || defaultTitle"
    width="600px"
    destroy-on-close
    @closed="handleClosed"
  >
    <div class="path-selector-dialog">
      <div class="path-navigation">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item v-for="(part, index) in pathParts" :key="index">
            <span
              class="path-part"
              @click="navigateToPathPart(index)"
            >
              {{ part || 'Root' }}
            </span>
          </el-breadcrumb-item>
        </el-breadcrumb>

        <div class="path-actions">
          <el-button
            type="primary"
            :icon="RefreshRight"
            circle
            size="small"
            @click="refreshCurrentPath"
          />
          <el-button
            type="primary"
            :icon="ArrowUp"
            circle
            size="small"
            @click="navigateUp"
            :disabled="isRootPath"
          />
        </div>
      </div>

      <div class="path-content">
        <el-scrollbar height="300px">
          <div v-if="loading" class="loading-container">
            <div v-loading="true" class="loader"></div>
          </div>
          <div v-else-if="error" class="error-container">
            <el-alert
              :title="error"
              type="error"
              show-icon
              :closable="false"
            />
            <el-button type="primary" @click="refreshCurrentPath">
              重试
            </el-button>
          </div>
          <div v-else-if="items.length === 0" class="empty-container">
            <el-empty description="此文件夹为空" />
          </div>
          <div v-else class="path-items">
            <div
              v-for="item in items"
              :key="item.path"
              class="path-item"
              :class="{ selected: isItemSelected(item) }"
              @click="toggleSelectItem(item)"
              @dblclick="handleItemDoubleClick(item)"
            >
              <el-icon class="item-icon">
                <component :is="item.isDirectory ? Folder : Document" />
              </el-icon>
              <span class="item-name">{{ item.name }}</span>
            </div>
          </div>
        </el-scrollbar>
      </div>

      <div class="selected-path">
        <el-input
          v-model="selectedPathInput"
          :placeholder="placeholderText"
          :disabled="type !== 'save'"
        >
          <template #prepend>
            <el-icon>
              <component :is="type === 'directory' ? Folder : Document" />
            </el-icon>
          </template>
        </el-input>
      </div>

      <div v-if="type === 'file' && filters.length > 0" class="file-filters">
        <el-select v-model="currentFilter" placeholder="文件类型">
          <el-option
            v-for="filter in filterOptions"
            :key="filter.value"
            :label="filter.label"
            :value="filter.value"
          />
        </el-select>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeDialog">取消</el-button>
        <el-button
          type="primary"
          @click="confirmSelection"
          :disabled="!isSelectionValid"
        >
          确定
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  Folder, 
  Document, 
  RefreshRight, 
  ArrowUp 
} from '@element-plus/icons-vue'
import path from 'path-browserify'

// 路径选择器类型
type PathSelectorType = 'file' | 'directory' | 'save'

// 文件项接口
interface FileItem {
  name: string
  path: string
  isDirectory: boolean
  size?: number
  lastModified?: number
}

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  type: {
    type: String as () => PathSelectorType,
    default: 'directory'
  },
  title: {
    type: String,
    default: ''
  },
  initialPath: {
    type: String,
    default: ''
  },
  filters: {
    type: Array as () => string[],
    default: () => []
  },
  multiple: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'select'])

// 对话框可见性
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 默认标题
const defaultTitle = computed(() => {
  switch (props.type) {
    case 'file':
      return '选择文件'
    case 'directory':
      return '选择文件夹'
    case 'save':
      return '保存文件'
    default:
      return '选择路径'
  }
})

// 占位符文本
const placeholderText = computed(() => {
  switch (props.type) {
    case 'file':
      return '选择的文件'
    case 'directory':
      return '选择的文件夹'
    case 'save':
      return '输入文件名'
    default:
      return '选择路径'
  }
})

// 当前路径
const currentPath = ref('')
// 选中的路径输入
const selectedPathInput = ref('')
// 加载状态
const loading = ref(false)
// 错误信息
const error = ref('')
// 文件项列表
const items = ref<FileItem[]>([])
// 选中的项
const selectedItems = ref<FileItem[]>([])
// 当前过滤器
const currentFilter = ref('*')

// 计算路径部分
const pathParts = computed(() => {
  if (!currentPath.value) return []
  
  // 处理 Windows 和 POSIX 路径
  const parts = currentPath.value.split(/[/\\]/).filter(Boolean)
  
  // 如果是 Windows 路径，添加驱动器前缀
  if (currentPath.value.match(/^[a-zA-Z]:/)) {
    parts[0] = parts[0] + ':'
  }
  
  return parts
})

// 是否是根路径
const isRootPath = computed(() => {
  // Windows: C:\ 或 Linux: /
  return currentPath.value === '/' || currentPath.value.match(/^[a-zA-Z]:[\\/]?$/)
})

// 过滤器选项
const filterOptions = computed(() => {
  const options = [{ label: '所有文件 (*.*)', value: '*' }]
  
  props.filters.forEach(filter => {
    options.push({
      label: `${filter.split('.').pop()?.toUpperCase() || ''} 文件 (${filter})`,
      value: filter
    })
  })
  
  return options
})

// 选择是否有效
const isSelectionValid = computed(() => {
  if (props.type === 'directory') {
    // 目录模式：必须选择目录
    return selectedItems.value.some(item => item.isDirectory)
  } else if (props.type === 'file') {
    // 文件模式：必须选择文件
    return props.multiple 
      ? selectedItems.value.length > 0 && selectedItems.value.every(item => !item.isDirectory)
      : selectedItems.value.length === 1 && !selectedItems.value[0].isDirectory
  } else if (props.type === 'save') {
    // 保存模式：必须有文件名
    return !!selectedPathInput.value.trim()
  }
  
  return false
})

// 初始化
const init = () => {
  // 重置状态
  selectedItems.value = []
  selectedPathInput.value = ''
  error.value = ''
  
  // 设置初始路径
  if (props.initialPath) {
    const initialPath = props.initialPath.trim()
    if (initialPath) {
      if (props.type === 'file' || props.type === 'save') {
        // 如果是文件模式，设置目录和文件名
        const dirname = path.dirname(initialPath)
        const basename = path.basename(initialPath)
        
        currentPath.value = dirname
        selectedPathInput.value = basename
      } else {
        // 目录模式，直接设置路径
        currentPath.value = initialPath
      }
    }
  }
  
  // 如果没有设置初始路径，使用默认路径
  if (!currentPath.value) {
    // 这里应该使用 electron 的 app.getPath 来获取用户的文档或主目录
    // 但在这个模拟实现中，我们使用一个假路径
    currentPath.value = 'C:\\Users\\Documents'
  }
  
  // 加载当前路径的内容
  loadPathContent()
}

// 加载路径内容
const loadPathContent = async () => {
  loading.value = true
  error.value = ''
  items.value = []
  
  try {
    // 这里应该使用 electron/node.js 的 fs 模块来读取目录内容
    // 但在这个模拟实现中，我们生成一些假数据
    
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 生成一些假的文件和文件夹
    const mockItems: FileItem[] = []
    
    // 添加一些文件夹
    for (let i = 1; i <= 5; i++) {
      mockItems.push({
        name: `Folder ${i}`,
        path: path.join(currentPath.value, `Folder ${i}`),
        isDirectory: true,
        lastModified: Date.now() - i * 86400000 // 每个文件夹的修改时间相差一天
      })
    }
    
    // 添加一些文件
    for (let i = 1; i <= 10; i++) {
      const ext = i % 3 === 0 ? '.pdf' : i % 2 === 0 ? '.docx' : '.txt'
      mockItems.push({
        name: `File ${i}${ext}`,
        path: path.join(currentPath.value, `File ${i}${ext}`),
        isDirectory: false,
        size: 1024 * (i + 10),
        lastModified: Date.now() - i * 3600000 // 每个文件的修改时间相差一小时
      })
    }
    
    // 应用过滤器
    if (props.type === 'file' && currentFilter.value !== '*') {
      const ext = currentFilter.value.replace('*', '')
      items.value = mockItems.filter(item => 
        item.isDirectory || item.name.toLowerCase().endsWith(ext.toLowerCase())
      )
    } else {
      items.value = mockItems
    }
    
    // 排序：文件夹在前，然后按名称排序
    items.value.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1
      if (!a.isDirectory && b.isDirectory) return 1
      return a.name.localeCompare(b.name)
    })
  } catch (err) {
    console.error('Failed to load directory content:', err)
    error.value = '无法加载目录内容'
  } finally {
    loading.value = false
  }
}

// 导航到路径部分
const navigateToPathPart = (index: number) => {
  const parts = pathParts.value
  
  // 构建新路径
  let newPath = ''
  
  // 处理 Windows 路径
  if (parts[0] && parts[0].endsWith(':')) {
    newPath = parts[0] + '\\'
    for (let i = 1; i <= index; i++) {
      newPath = path.join(newPath, parts[i])
    }
  } else {
    // POSIX 路径
    newPath = '/'
    for (let i = 0; i <= index; i++) {
      newPath = path.join(newPath, parts[i])
    }
  }
  
  // 设置新路径并重新加载
  currentPath.value = newPath
  loadPathContent()
  
  // 清除选择
  selectedItems.value = []
  updateSelectedPathInput()
}

// 导航到上级目录
const navigateUp = () => {
  if (isRootPath.value) return
  
  const parentPath = path.dirname(currentPath.value)
  currentPath.value = parentPath
  loadPathContent()
  
  // 清除选择
  selectedItems.value = []
  updateSelectedPathInput()
}

// 刷新当前路径
const refreshCurrentPath = () => {
  loadPathContent()
}

// 检查项目是否被选中
const isItemSelected = (item: FileItem) => {
  return selectedItems.value.some(selectedItem => selectedItem.path === item.path)
}

// 切换选择项目
const toggleSelectItem = (item: FileItem) => {
  if (props.multiple) {
    // 多选模式
    const index = selectedItems.value.findIndex(selectedItem => selectedItem.path === item.path)
    
    if (index === -1) {
      // 如果是文件模式，只允许选择文件
      if (props.type === 'file' && item.isDirectory) {
        return
      }
      // 如果是目录模式，只允许选择目录
      if (props.type === 'directory' && !item.isDirectory) {
        return
      }
      selectedItems.value.push(item)
    } else {
      selectedItems.value.splice(index, 1)
    }
  } else {
    // 单选模式
    // 如果是文件模式，只允许选择文件
    if (props.type === 'file' && item.isDirectory) {
      return
    }
    // 如果是目录模式，只允许选择目录
    if (props.type === 'directory' && !item.isDirectory) {
      return
    }
    
    if (isItemSelected(item)) {
      selectedItems.value = []
    } else {
      selectedItems.value = [item]
    }
  }
  
  updateSelectedPathInput()
}

// 处理项目双击
const handleItemDoubleClick = (item: FileItem) => {
  if (item.isDirectory) {
    // 导航到目录
    currentPath.value = item.path
    loadPathContent()
    
    // 清除选择
    selectedItems.value = []
    updateSelectedPathInput()
  } else if (props.type === 'file') {
    // 文件模式下，选择文件并确认
    selectedItems.value = [item]
    updateSelectedPathInput()
    confirmSelection()
  }
}

// 更新选中路径输入
const updateSelectedPathInput = () => {
  if (selectedItems.value.length === 0) {
    selectedPathInput.value = ''
  } else if (selectedItems.value.length === 1) {
    if (props.type === 'save') {
      // 保存模式：只显示文件名
      selectedPathInput.value = path.basename(selectedItems.value[0].path)
    } else {
      // 其他模式：显示完整路径
      selectedPathInput.value = selectedItems.value[0].path
    }
  } else {
    // 多选模式：显示选中数量
    selectedPathInput.value = `已选择 ${selectedItems.value.length} 项`
  }
}

// 确认选择
const confirmSelection = () => {
  if (!isSelectionValid.value) return
  
  let result: string | string[]
  
  if (props.type === 'save') {
    // 保存模式：返回完整路径（包含文件名）
    result = path.join(currentPath.value, selectedPathInput.value)
  } else if (props.multiple) {
    // 多选模式：返回路径数组
    result = selectedItems.value.map(item => item.path)
  } else {
    // 单选模式：返回单个路径
    result = selectedItems.value[0].path
  }
  
  emit('select', result)
  closeDialog()
}

// 关闭对话框
const closeDialog = () => {
  dialogVisible.value = false
}

// 处理对话框关闭
const handleClosed = () => {
  // 重置状态
  selectedItems.value = []
  selectedPathInput.value = ''
  error.value = ''
}

// 监听过滤器变化
watch(currentFilter, () => {
  loadPathContent()
})

// 监听对话框可见性变化
watch(dialogVisible, (visible) => {
  if (visible) {
    init()
  }
})
</script>

<style scoped>
.path-selector-dialog {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.path-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.path-part {
  cursor: pointer;
  color: var(--el-color-primary);
}

.path-actions {
  display: flex;
  gap: 0.5rem;
}

.path-content {
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  height: 300px;
}

.path-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.5rem;
  padding: 0.5rem;
}

.path-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.path-item:hover {
  background-color: var(--el-fill-color-light);
}

.path-item.selected {
  background-color: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary);
}

.item-icon {
  font-size: 2rem;
  margin-bottom: 0.25rem;
}

.item-name {
  font-size: 0.9em;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}

.loading-container,
.error-container,
.empty-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  gap: 1rem;
}

.loader {
  width: 100%;
  height: 100px;
}

.selected-path {
  margin-top: 0.5rem;
}

.file-filters {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
</style>`