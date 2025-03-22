`<template>
  <div class="file-batch-operations">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2>批量文件操作</h2>
        </div>
      </template>

      <div class="operation-form">
        <!-- 操作类型选择 -->
        <el-form :model="formData" label-width="100px">
          <el-form-item label="操作类型">
            <el-radio-group v-model="formData.operationType">
              <el-radio-button value="move">移动</el-radio-button>
              <el-radio-button value="copy">复制</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <!-- 源路径选择 -->
          <el-form-item label="源路径">
            <path-selector
              v-model="formData.sourcePath"
              placeholder="选择源文件夹"
              type="directory"
              category="batch-operations-source"
              :multiple="true"
              @select="loadSourceFiles"
            />
          </el-form-item>

          <!-- 文件类型选择 -->
          <el-form-item label="文件类型">
            <el-select
              v-model="fileExtensions"
              multiple
              collapse-tags
              collapse-tags-tooltip
              placeholder="选择文件类型（默认所有文件）"
              style="width: 100%"
            >
              <el-option-group
                v-for="category in fileCategories"
                :key="category"
                :label="getCategoryLabel(category)"
              >
                <el-option
                  v-for="type in getFileTypesByCategory(category)"
                  :key="type.id"
                  :label="type.name"
                  :value="type.id"
                >
                  <span>{{ type.name }}</span>
                  <small style="color: #8c8c8c">
                    ({{ type.extensions.join(', ') }})
                  </small>
                </el-option>
              </el-option-group>
            </el-select>
          </el-form-item>

          <!-- 文件筛选 -->
          <el-form-item label="文件筛选">
            <div class="filter-options">
              <el-input
                v-model="formData.filePattern"
                placeholder="文件名模式 (例如: *.jpg)"
                clearable
              >
                <template #append>
                  <el-button @click="applyFilter">应用</el-button>
                </template>
              </el-input>

              <div class="filter-checkboxes">
                <el-checkbox v-model="formData.includeSubdirectories">
                  包含子目录
                </el-checkbox>
                <el-checkbox v-model="formData.useRegex">
                  使用正则表达式
                </el-checkbox>
              </div>
            </div>
          </el-form-item>

          <!-- 目标路径选择 -->
          <el-form-item label="目标路径">
            <path-selector
              v-model="formData.targetPath"
              placeholder="选择目标文件夹"
              type="directory"
              category="batch-operations-target"
            />
          </el-form-item>

          <!-- 高级选项 -->
          <el-form-item>
            <el-collapse>
              <el-collapse-item title="高级选项" name="advanced">
                <el-form-item label="冲突处理">
                  <el-select v-model="formData.conflictStrategy" style="width: 100%">
                    <el-option label="询问" value="ask" />
                    <el-option label="覆盖" value="overwrite" />
                    <el-option label="跳过" value="skip" />
                    <el-option label="自动重命名" value="rename" />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="并行处理">
                  <el-switch v-model="formData.parallel" />
                  <span class="option-hint">
                    (可提高速度，但可能增加系统负载)
                  </span>
                </el-form-item>
                
                <el-form-item label="最大并行数">
                  <el-input-number
                    v-model="formData.maxParallel"
                    :min="1"
                    :max="16"
                    :disabled="!formData.parallel"
                  />
                </el-form-item>
              </el-collapse-item>
            </el-collapse>
          </el-form-item>

          <!-- 操作按钮 -->
          <el-form-item>
            <el-button
              type="primary"
              :disabled="!isFormValid || isProcessing"
              @click="startOperation"
            >
              {{ operationButtonText }}
            </el-button>
            <el-button
              :disabled="isProcessing"
              @click="resetForm"
            >
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 文件列表预览 -->
      <div v-if="sourceFiles.length > 0" class="file-list-preview">
        <div class="file-list-header">
          <h3>文件列表预览 ({{ sourceFiles.length }}个文件)</h3>
          <div class="file-list-actions">
            <el-input
              v-model="fileSearchQuery"
              placeholder="搜索文件"
              clearable
              style="width: 200px"
            />
          </div>
        </div>
        
        <el-table
          :data="filteredFiles"
          height="250"
          style="width: 100%"
          :row-class-name="getRowClassName"
        >
          <el-table-column
            type="selection"
            width="55"
          />
          <el-table-column
            prop="name"
            label="文件名"
            min-width="200"
          />
          <el-table-column
            prop="relativePath"
            label="相对路径"
            min-width="300"
          />
          <el-table-column
            prop="size"
            label="大小"
            width="120"
            :formatter="formatFileSize"
          />
        </el-table>
      </div>

      <!-- 操作进度和日志 -->
      <file-operation-progress
        ref="progressComponent"
        :title="progressTitle"
        :show-progress="isProcessing"
        :can-cancel="isProcessing"
        :current="progress.current"
        :total="progress.total"
        :current-file="progress.currentFile"
        @cancel="cancelOperation"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PathSelector from './common/PathSelector.vue'
import FileOperationProgress from './common/FileOperationProgress.vue'
import { useRecentPaths } from '../composables/useRecentPaths'
import { useFileTypes } from '../composables/useFileTypes'

// 文件类型
const { 
  fileExtensions, 
  fileCategories, 
  getCategoryLabel, 
  getFileTypesByCategory
} = useFileTypes()

// 文件服务接口
const fileService = window.electron.fileService

// 表单数据
const formData = reactive({
  operationType: 'move',
  sourcePath: '',
  targetPath: '',
  filePattern: '',
  includeSubdirectories: true,
  useRegex: false,
  conflictStrategy: 'ask',
  parallel: true,
  maxParallel: 4
})

// 最近路径
const { addRecentPath } = useRecentPaths()

// 源文件列表
const sourceFiles = ref<Array<{
  name: string
  path: string
  relativePath: string
  size: number
  isDirectory: boolean
}>>([])

// 文件搜索
const fileSearchQuery = ref('')
const filteredFiles = computed(() => {
  if (!fileSearchQuery.value) return sourceFiles.value
  
  const query = fileSearchQuery.value.toLowerCase()
  return sourceFiles.value.filter(file => 
    file.name.toLowerCase().includes(query) || 
    file.relativePath.toLowerCase().includes(query)
  )
})

// 处理状态
const isProcessing = ref(false)
const progress = reactive({
  current: 0,
  total: 0,
  currentFile: ''
})

// 进度组件引用
const progressComponent = ref<InstanceType<typeof FileOperationProgress> | null>(null)

// 计算属性
const isFormValid = computed(() => {
  return formData.sourcePath && formData.targetPath && sourceFiles.value.length > 0
})

const operationButtonText = computed(() => {
  return formData.operationType === 'move' ? '开始移动' : '开始复制'
})

const progressTitle = computed(() => {
  return formData.operationType === 'move' ? '文件移动进度' : '文件复制进度'
})

// 加载源文件
const loadSourceFiles = async (path: string | string[]) => {
  if (!formData.sourcePath) return
  
  try {
    addLog('正在扫描文件...', 'info')
    
    // 保存到最近路径
    if (Array.isArray(path)) {
      path.forEach(p => addRecentPath(p))
    } else {
      addRecentPath(path)
    }
    
    const files = await fileService.listFiles({
      directory: formData.sourcePath,
      recursive: formData.includeSubdirectories,
      pattern: formData.filePattern || undefined,
      useRegex: formData.useRegex
    })
    
    sourceFiles.value = files.map(file => ({
      name: file.name,
      path: file.path,
      relativePath: file.relativePath,
      size: file.size,
      isDirectory: file.isDirectory
    }))
    
    addLog(`找到 ${sourceFiles.value.length} 个文件`, 'success')
  } catch (error) {
    addLog(`扫描文件失败: ${error.message}`, 'error')
    ElMessage.error('扫描文件失败')
  }
}

// 应用筛选
const applyFilter = () => {
  loadSourceFiles(formData.sourcePath)
}

// 开始操作
const startOperation = async () => {
  if (!isFormValid.value) return
  
  try {
    // 保存到最近路径
    addRecentPath(formData.targetPath)
    
    // 确认操作
    const operationName = formData.operationType === 'move' ? '移动' : '复制'
    const confirmResult = await ElMessageBox.confirm(
      `确定要${operationName} ${sourceFiles.value.length} 个文件到目标路径吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).catch(() => false)
    
    if (!confirmResult) return
    
    // 开始处理
    isProcessing.value = true
    progress.current = 0
    progress.total = sourceFiles.value.length
    progress.currentFile = ''
    
    addLog(`开始${operationName}文件，共 ${sourceFiles.value.length} 个`, 'info')
    
    // 调用文件服务
    const operationConfig = {
      files: sourceFiles.value.map(file => file.path),
      targetDirectory: formData.targetPath,
      conflictStrategy: formData.conflictStrategy,
      parallel: formData.parallel,
      maxParallel: formData.maxParallel
    }
    
    // 设置进度回调
    const progressCallback = (current: number, total: number, filePath: string) => {
      progress.current = current
      progress.total = total
      progress.currentFile = filePath
    }
    
    // 执行操作
    if (formData.operationType === 'move') {
      await fileService.moveFiles(operationConfig, progressCallback)
    } else {
      await fileService.copyFiles(operationConfig, progressCallback)
    }
    
    // 完成
    addLog(`文件${operationName}完成`, 'success')
    ElMessage.success(`文件${operationName}完成`)
    
    // 重新加载源文件列表
    loadSourceFiles(formData.sourcePath)
  } catch (error) {
    addLog(`操作失败: ${error.message}`, 'error')
    ElMessage.error(`操作失败: ${error.message}`)
  } finally {
    isProcessing.value = false
  }
}

// 取消操作
const cancelOperation = async () => {
  try {
    await fileService.cancelOperation()
    addLog('操作已取消', 'warning')
    ElMessage.warning('操作已取消')
  } catch (error) {
    addLog(`取消操作失败: ${error.message}`, 'error')
  } finally {
    isProcessing.value = false
  }
}

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    operationType: 'move',
    sourcePath: '',
    targetPath: '',
    filePattern: '',
    includeSubdirectories: true,
    useRegex: false,
    conflictStrategy: 'ask',
    parallel: true,
    maxParallel: 4
  })
  sourceFiles.value = []
  fileSearchQuery.value = ''
  
  if (progressComponent.value) {
    progressComponent.value.clearLogs()
  }
}

// 添加日志
const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
  if (progressComponent.value) {
    progressComponent.value.addLog(message, type)
  }
}

// 格式化文件大小
const formatFileSize = (row: { size: number }) => {
  const size = row.size
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`
  return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

// 获取行样式
const getRowClassName = ({ row }: { row: { isDirectory: boolean } }) => {
  return row.isDirectory ? 'directory-row' : ''
}
</script>

<style scoped>
.file-batch-operations {
  padding: 1rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.operation-form {
  margin-bottom: 1.5rem;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-checkboxes {
  display: flex;
  gap: 1rem;
}

.option-hint {
  margin-left: 0.5rem;
  color: var(--el-text-color-secondary);
  font-size: 0.9em;
}

.file-list-preview {
  margin: 1rem 0;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  padding: 1rem;
}

.file-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.file-list-actions {
  display: flex;
  gap: 0.5rem;
}

:deep(.directory-row) {
  background-color: var(--el-fill-color-light);
}
</style>`