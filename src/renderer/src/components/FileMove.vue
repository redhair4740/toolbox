<template>
  <div class="file-move">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2>文件移动与复制</h2>
        </div>
      </template>

      <div class="move-form">
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
              placeholder="选择源文件或文件夹路径"
              :multiple="true"
              category="file-move-source"
              @select="handleSourceSelect"
            />
          </el-form-item>

          <!-- 目标路径选择 -->
          <el-form-item label="目标路径">
            <path-selector
              v-model="formData.targetPath"
              placeholder="选择目标文件夹路径"
              type="directory"
              category="file-move-target"
              @select="handleTargetSelect"
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
                
                <el-form-item label="保留结构">
                  <el-switch v-model="formData.preserveStructure" />
                  <span class="option-hint">
                    (保留源文件夹的目录结构)
                  </span>
                </el-form-item>
                
                <el-form-item label="搜索子目录">
                  <el-switch v-model="formData.includeSubdirectories" />
                  <span class="option-hint">
                    (包含子目录中的文件)
                  </span>
                </el-form-item>
                
                <el-form-item label="覆盖确认">
                  <el-switch v-model="formData.overwriteConfirm" />
                  <span class="option-hint">
                    (覆盖前进行确认)
                  </span>
                </el-form-item>

                <el-form-item label="文件类型过滤">
                  <el-select
                    v-model="formData.fileTypeFilter"
                    multiple
                    collapse-tags
                    collapse-tags-tooltip
                    placeholder="选择要操作的文件类型"
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
                  <span class="option-hint">
                    (只处理选定类型的文件，留空则处理所有文件)
                  </span>
                </el-form-item>
              </el-collapse-item>
            </el-collapse>
          </el-form-item>

          <!-- 操作按钮 -->
          <el-form-item>
            <el-button
              type="primary"
              :disabled="!isFormValid || isProcessing"
              @click="executeOperation"
            >
              {{ operationButtonText }}
            </el-button>
            <el-button
              :disabled="isProcessing"
              @click="resetForm"
            >
              重置
            </el-button>
            <el-button
              v-if="formData.sourcePath && !isProcessing"
              type="info"
              @click="showFileList"
            >
              查看文件明细
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 文件信息 -->
      <div v-if="fileInfo" class="file-info-section">
        <h3>文件信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">类型:</div>
            <div class="info-value">{{ fileInfo.isDirectory ? '文件夹' : '文件' }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">名称:</div>
            <div class="info-value">{{ fileInfo.name }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">路径:</div>
            <div class="info-value">{{ fileInfo.path }}</div>
          </div>
          <div v-if="!fileInfo.isDirectory" class="info-item">
            <div class="info-label">大小:</div>
            <div class="info-value">{{ formatFileSize(fileInfo.size) }}</div>
          </div>
          <div v-if="fileInfo.isDirectory" class="info-item">
            <div class="info-label">包含:</div>
            <div class="info-value">{{ fileInfo.items }} 个项目</div>
          </div>
          <div v-if="fileInfo.isDirectory" class="info-item">
            <div class="info-label">总大小:</div>
            <div class="info-value">{{ formatFileSize(fileInfo.totalSize) }}</div>
          </div>
        </div>
      </div>

      <!-- 目标路径预览 -->
      <div v-if="targetPreview" class="target-preview">
        <h3>目标路径预览</h3>
        <div class="preview-path">
          <el-icon><FolderOpened /></el-icon>
          <span>{{ targetPreview }}</span>
        </div>
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

    <!-- 文件列表弹窗 -->
    <el-dialog
      v-model="fileListDialogVisible"
      title="文件明细"
      width="70%"
      :close-on-click-modal="false"
    >
      <div v-if="isLoadingFileList" class="file-list-loading">
        <el-icon class="loading-icon" :size="24"><Loading /></el-icon>
        <span>正在加载文件列表...</span>
      </div>
      <div v-else-if="fileList.length === 0" class="file-list-empty">
        <el-empty description="没有找到符合条件的文件" />
      </div>
      <div v-else class="file-list-container">
        <div class="file-list-header">
          <div class="file-count">共找到 {{ fileList.length }} 个文件</div>
          <el-input
            v-model="fileListFilter"
            placeholder="搜索文件名..."
            clearable
            prefix-icon="Search"
            style="width: 300px"
          />
        </div>
        <el-table
          :data="filteredFileList"
          style="width: 100%"
          max-height="400px"
          border
        >
          <el-table-column label="文件名" min-width="200">
            <template #default="{ row }">
              <div class="file-name-cell">
                <el-icon><Document /></el-icon>
                <span>{{ row.name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="目录" min-width="250" prop="directory" show-overflow-tooltip />
          <el-table-column label="大小" width="120">
            <template #default="{ row }">
              {{ formatFileSize(row.size) }}
            </template>
          </el-table-column>
          <el-table-column label="修改时间" width="180" prop="modifiedTime" />
        </el-table>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="fileListDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { FolderOpened, Document, Loading } from '@element-plus/icons-vue'
import PathSelector from './common/PathSelector.vue'
import FileOperationProgress from './common/FileOperationProgress.vue'
import { useRecentPaths } from '../composables/useRecentPaths'
import { useFileTypes } from '../composables/useFileTypes'

// 文件服务接口
const api = window.api

// 路径处理工具函数
const pathUtils = {
  basename(filepath: string): string {
    // 简单实现：获取路径最后一部分
    return filepath.split(/[\\/]/).pop() || filepath;
  },
  
  dirname(filepath: string): string {
    // 获取目录路径
    const parts = filepath.split(/[\\/]/);
    parts.pop();
    return parts.join('/') || '.';
  },
  
  join(...paths: string[]): string {
    // 简单的路径拼接
    return paths.filter(Boolean).join('/').replace(/\/+/g, '/');
  }
};

// 日期格式化工具函数
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch (e) {
    return dateString;
  }
};

// 使用最近路径记录
const { addRecentPath } = useRecentPaths()
// 使用文件类型
const { 
  fileCategories, 
  getCategoryLabel, 
  getFileTypesByCategory
} = useFileTypes()

// 获取文件类型扩展名数组
const getFileExtensions = (typeIds: string[]) => {
  if (!typeIds || !typeIds.length) return undefined
  
  const extensions: string[] = []
  // 遍历所有文件类型分类
  for (const category of fileCategories.value) {
    // 获取该分类下所有文件类型
    const typesInCategory = getFileTypesByCategory(category)
    // 找出被选中的文件类型
    const selectedTypes = typesInCategory.filter(type => typeIds.includes(type.id))
    // 添加这些类型的所有扩展名
    for (const type of selectedTypes) {
      if (type.extensions) {
        extensions.push(...type.extensions)
      }
    }
  }
  
  return extensions.length > 0 ? extensions : undefined
}

// 表单数据
const formData = reactive({
  operationType: 'move',
  sourcePath: '',
  targetPath: '',
  conflictStrategy: 'ask',
  preserveStructure: true,
  overwriteConfirm: true,
  includeSubdirectories: true,  // 默认包含子目录
  fileTypeFilter: [] as string[] // 添加文件类型过滤
})

// 文件信息
const fileInfo = ref<{
  name: string
  path: string
  isDirectory: boolean
  size?: number
  items?: number
  totalSize?: number
} | null>(null)

// 文件列表相关状态
const fileListDialogVisible = ref(false)
const isLoadingFileList = ref(false)
const fileList = ref<Array<{
  name: string;
  path: string;
  directory: string;
  size: number;
  modifiedTime: string;
}>>([])
const fileListFilter = ref('')

// 过滤后的文件列表
const filteredFileList = computed(() => {
  if (!fileListFilter.value) return fileList.value
  const searchQuery = fileListFilter.value.toLowerCase()
  return fileList.value.filter(file => 
    file.name.toLowerCase().includes(searchQuery) || 
    file.directory.toLowerCase().includes(searchQuery)
  )
})

// 目标路径预览
const targetPreview = ref<string | null>(null)

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
  return formData.sourcePath && formData.targetPath
})

const operationButtonText = computed(() => {
  return formData.operationType === 'move' ? '开始移动' : '开始复制'
})

const progressTitle = computed(() => {
  return formData.operationType === 'move' ? '文件移动进度' : '文件复制进度'
})

// 显示文件列表详情
const showFileList = async () => {
  fileListDialogVisible.value = true
  isLoadingFileList.value = true
  fileList.value = []
  
  try {
    // 获取完整的文件列表
    let sourcePaths: string[] = [];
    if (typeof formData.sourcePath === 'string') {
      // 支持多个路径，用分号分隔
      if (formData.sourcePath.includes(';')) {
        sourcePaths = formData.sourcePath.split(';').filter(p => p.trim());
      } else {
        sourcePaths = [formData.sourcePath];
      }
    } else if (Array.isArray(formData.sourcePath)) {
      sourcePaths = formData.sourcePath;
    }
    
    if (sourcePaths.length === 0) {
      throw new Error('未选择源路径');
    }
    
    // 将文件类型ID转换为扩展名数组
    const fileExtensions = getFileExtensions(formData.fileTypeFilter)
    
    // 获取文件列表，仅获取文件，不包括目录
    const results = await api.getFileList(sourcePaths[0], {
      recursive: formData.includeSubdirectories,  // 是否包含子目录
      fileTypeFilter: fileExtensions,
      includeDirectories: false  // 仅获取文件，不包括目录
    })
    
    fileList.value = results.map(file => ({
      name: pathUtils.basename(file.path),
      path: file.path,
      directory: pathUtils.dirname(file.path),
      size: file.size,
      modifiedTime: formatDate(file.modified || '')
    }))
    
    addLog(`已加载 ${fileList.value.length} 个符合条件的文件`, 'info')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    addLog(`获取文件列表失败: ${errorMessage}`, 'error')
    ElMessage.error('获取文件列表失败')
  } finally {
    isLoadingFileList.value = false
  }
}

// 源路径选择处理
const handleSourceSelect = async (sourcePath: string | string[]) => {
  if (!sourcePath) return
  
  try {
    // 保存到最近路径
    if (Array.isArray(sourcePath)) {
      // 多选模式
      sourcePath.forEach(p => addRecentPath(p))
      
      // 获取第一个文件的信息作为参考
      const firstPath = sourcePath[0]
      addLog(`正在获取源文件信息...`, 'info')
      const info = await api.getFileInfo(firstPath)
      
      fileInfo.value = {
        name: info.name,
        path: info.path,
        isDirectory: info.isDirectory,
        size: info.size,
        items: sourcePath.length,
        totalSize: info.totalSize
      }
      
      addLog(`成功获取源文件信息，选中了 ${sourcePath.length} 个项目`, 'success')
    } else if (sourcePath.includes(';')) {
      // 字符串形式的多选，用分号分隔
      const paths = sourcePath.split(';').filter(p => p.trim());
      paths.forEach(p => addRecentPath(p));
      
      if (paths.length > 0) {
        // 获取第一个文件的信息作为参考
        const firstPath = paths[0];
        addLog(`正在获取源文件信息...`, 'info')
        const info = await api.getFileInfo(firstPath)
        
        fileInfo.value = {
          name: info.name,
          path: info.path,
          isDirectory: info.isDirectory,
          size: info.size,
          items: paths.length,
          totalSize: info.totalSize
        }
        
        addLog(`成功获取源文件信息，选中了 ${paths.length} 个项目`, 'success')
      }
    } else {
      // 单选模式
      addRecentPath(sourcePath)
      
      // 获取文件信息
      addLog(`正在获取源文件信息...`, 'info')
      const info = await api.getFileInfo(sourcePath)
      
      fileInfo.value = {
        name: info.name,
        path: info.path,
        isDirectory: info.isDirectory,
        size: info.size,
        items: info.items,
        totalSize: info.totalSize
      }
      
      addLog(`成功获取源文件信息`, 'success')
    }
    
    // 更新目标路径预览
    updateTargetPreview()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    addLog(`获取文件信息失败: ${errorMessage}`, 'error')
    ElMessage.error('获取文件信息失败')
  }
}

// 目标路径选择处理
const handleTargetSelect = (targetPath: string) => {
  if (targetPath) {
    addRecentPath(targetPath)
    updateTargetPreview()
  }
}

// 更新目标路径预览
const updateTargetPreview = () => {
  if (!formData.sourcePath || !formData.targetPath || !fileInfo.value) {
    targetPreview.value = null
    return
  }
  
  const sourceName = fileInfo.value.name
  targetPreview.value = pathUtils.join(formData.targetPath, sourceName)
}

// 执行操作
const executeOperation = async () => {
  if (!isFormValid.value) return
  
  try {
    // 检查源路径和目标路径
    if (formData.sourcePath === formData.targetPath) {
      ElMessage.warning('源路径和目标路径不能相同')
      return
    }
    
    // 处理源路径，获取需要处理的源路径列表
    let sourceDirs: string[] = [];
    if (typeof formData.sourcePath === 'string') {
      if (formData.sourcePath.includes(';')) {
        sourceDirs = formData.sourcePath.split(';').filter(p => p.trim());
      } else {
        sourceDirs = [formData.sourcePath];
      }
    } else if (Array.isArray(formData.sourcePath)) {
      sourceDirs = formData.sourcePath;
    }
    
    if (sourceDirs.length === 0) {
      throw new Error('未选择源路径');
    }
    
    // 将文件类型ID转换为扩展名数组
    const fileExtensions = getFileExtensions(formData.fileTypeFilter)
    
    // 确认操作前，先获取符合条件的文件列表
    // 注意：这里不移动整个目录，而是获取符合条件的文件后单独处理
    isLoadingFileList.value = true;
    const operationName = formData.operationType === 'move' ? '移动' : '复制';
    
    try {
      addLog(`正在查找符合条件的文件...`, 'info');
      
      // 从第一个源目录获取文件列表
      const fileList = await api.getFileList(sourceDirs[0], {
        recursive: formData.includeSubdirectories,
        fileTypeFilter: fileExtensions,
        includeDirectories: false // 仅获取文件，不包括目录
      });
      
      if (fileList.length === 0) {
        addLog(`未找到符合条件的文件`, 'warning');
        ElMessage.warning('未找到符合条件的文件，操作已取消');
        isLoadingFileList.value = false;
        return;
      }
      
      // 确认操作
      const confirmResult = await ElMessageBox.confirm(
        `确定要${operationName} ${fileList.length} 个文件到 "${formData.targetPath}" 吗？`,
        '确认操作',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).catch(() => false);
      
      if (!confirmResult) {
        isLoadingFileList.value = false;
        return;
      }
      
      // 开始处理
      isProcessing.value = true;
      progress.current = 0;
      progress.total = fileList.length;
      progress.currentFile = '';
      
      addLog(`开始${operationName} ${fileList.length} 个文件`, 'info');
      
      // 构建操作配置 - 直接传递获取到的文件路径列表
      const operationConfig = {
        files: fileList.map(file => file.path), // 使用文件路径列表而不是目录
        targetPath: formData.targetPath,
        conflictStrategy: formData.conflictStrategy as 'ask' | 'overwrite' | 'skip' | 'rename',
        preserveStructure: formData.preserveStructure,
        overwriteConfirm: formData.overwriteConfirm
      };
      
      // 设置进度回调
      const progressCallback = (progressData: { current: number; total: number; file: string }) => {
        progress.current = progressData.current;
        progress.total = progressData.total;
        progress.currentFile = progressData.file;
      };
      
      // 执行操作
      if (formData.operationType === 'move') {
        await api.moveFile(operationConfig, progressCallback);
      } else {
        await api.copyFile(operationConfig, progressCallback);
      }
      
      // 完成
      addLog(`文件${operationName}完成`, 'success');
      ElMessage.success(`文件${operationName}完成`);
      
      // 重置表单
      resetForm();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      addLog(`操作失败: ${errorMessage}`, 'error');
      ElMessage.error(`操作失败: ${errorMessage}`);
    } finally {
      isLoadingFileList.value = false;
      isProcessing.value = false;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    addLog(`操作失败: ${errorMessage}`, 'error');
    ElMessage.error(`操作失败: ${errorMessage}`);
  }
}

// 取消操作
const cancelOperation = async () => {
  try {
    await api.cancelOperation()
    addLog('操作已取消', 'warning')
    ElMessage.warning('操作已取消')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    addLog(`取消操作失败: ${errorMessage}`, 'error')
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
    conflictStrategy: 'ask',
    preserveStructure: true,
    overwriteConfirm: true,
    includeSubdirectories: true,
    fileTypeFilter: []
  })
  
  fileInfo.value = null
  targetPreview.value = null
  
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
const formatFileSize = (size?: number) => {
  if (size === undefined) return 'N/A'
  
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`
  return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`
}
</script>

<style scoped>
.file-move {
  padding: 1rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.move-form {
  margin-bottom: 1.5rem;
}

.option-hint {
  margin-left: 0.5rem;
  color: var(--el-text-color-secondary);
  font-size: 0.9em;
}

.file-info-section,
.target-preview {
  margin: 1rem 0;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  padding: 1rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 0.75rem;
}

.info-item {
  display: flex;
  gap: 0.5rem;
}

.info-label {
  font-weight: bold;
  color: var(--el-text-color-secondary);
}

.info-value {
  word-break: break-all;
}

.preview-path {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background-color: var(--el-fill-color-light);
  border-radius: 4px;
  word-break: break-all;
}

/* 文件列表样式 */
.file-list-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.file-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.file-count {
  font-weight: bold;
}

.file-list-loading,
.file-list-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  gap: 1rem;
}

.loading-icon {
  animation: rotating 2s linear infinite;
}

.file-name-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>