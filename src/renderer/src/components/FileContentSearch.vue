<template>
  <div class="content-search-container">
    <!-- 操作面板 -->
    <div class="action-panel">
      <el-card class="panel-card">
        <template #header>
          <div class="card-header">
            <span>设置路径</span>
          </div>
        </template>

        <div class="path-inputs">
          <div class="path-group">
            <div class="path-label">
              <el-icon><FolderOpened /></el-icon>
              <span>源路径</span>
            </div>
            <div class="path-control">
              <el-input v-model="sourcePath" placeholder="选择源文件夹路径" readonly>
                <template #append>
                  <el-button @click="openDialog">
                    <el-icon><Folder /></el-icon>
                  </el-button>
                </template>
              </el-input>
            </div>
          </div>
          
          <div class="recent-paths" v-if="recentPaths.length > 0">
            <div class="recent-label">最近路径:</div>
            <div class="recent-list">
              <el-tag
                v-for="path in recentPaths"
                :key="path"
                class="recent-path-tag"
                @click="selectRecentPath(path)"
              >
                {{ getShortPath(path) }}
              </el-tag>
            </div>
          </div>
        </div>
      </el-card>

      <el-card class="panel-card">
        <template #header>
          <div class="card-header">
            <span>搜索设置</span>
          </div>
        </template>

        <div class="search-settings">
          <div class="search-group">
            <div class="input-label">搜索文本</div>
            <el-input v-model="searchText" placeholder="输入要搜索的文本">
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>

          <div class="search-options">
            <el-checkbox v-model="ignoreCase" label="忽略大小写匹配" />
          </div>

          <div class="filter-controls">
            <div class="input-label">文件类型过滤</div>
            <el-select
              v-model="fileExtensions"
              multiple
              collapse-tags
              collapse-tags-tooltip
              placeholder="选择文件类型"
              style="width: 100%"
            >
              <el-option
                v-for="item in fileTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>
        </div>

        <div class="action-buttons">
          <el-button type="primary" @click="searchFiles" :disabled="!sourcePath || !searchText">
            <el-icon><Search /></el-icon>
            <span>查询文件</span>
          </el-button>

          <el-button
            type="success"
            @click="searchInSelectedFiles"
            :disabled="!searchText || selectedFiles.length === 0"
          >
            <el-icon><Search /></el-icon>
            <span>搜索内容</span>
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- 文件列表 -->
    <div class="file-list-panel">
      <el-card class="list-card">
        <template #header>
          <div class="card-header">
            <span>文件列表</span>
            <div class="header-actions">
              <el-tag type="info" v-if="tableData.length > 0">
                找到 {{ tableData.length }} 个文件
              </el-tag>
              <el-tag type="success" v-if="selectedFiles.length > 0">
                已选择 {{ selectedFiles.length }} 个文件
              </el-tag>
            </div>
          </div>
        </template>

        <el-empty v-if="tableData.length === 0" description="暂无数据，请先执行查询" />

        <el-table
          v-else
          :data="tableData"
          class="file-table"
          height="100%"
          stripe
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="fileName" label="文件名" min-width="150" show-overflow-tooltip />
          <el-table-column prop="fullPath" label="文件路径" min-width="200" show-overflow-tooltip />
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="scope">
              <el-button
                type="primary"
                size="small"
                @click="searchInFile(scope.row)"
                :disabled="!searchText"
              >搜索内容</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
    
    <!-- 搜索结果对话框 -->
    <el-dialog
      v-model="searchResultsVisible"
      title="搜索结果"
      width="80%"
      :before-close="closeSearchResults"
    >
      <div class="search-results-container">
        <div class="search-info">
          <div class="search-query">
            <span class="label">搜索文本:</span>
            <el-tag type="info">{{ searchText }}</el-tag>
          </div>
          <div class="search-stats">
            <span class="label">找到结果:</span>
            <el-tag type="success">{{ searchResults.length }} 个文件</el-tag>
          </div>
        </div>
        
        <div class="results-list" v-if="searchResults.length > 0">
          <div v-for="result in searchResults" :key="result.filePath" class="result-item">
            <div class="result-header">
              <div class="result-file">
                <el-icon><Document /></el-icon>
                <span class="file-name">{{ result.fileName }}</span>
              </div>
              <div class="result-path">{{ result.filePath }}</div>
            </div>
            
            <div class="result-matches">
              <div v-for="(match, index) in result.matches" :key="index" class="match-item">
                <div class="match-line">行 {{ result.lineNumbers[index] }}:</div>
                <div class="match-content">{{ match }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <el-empty v-else description="未找到匹配内容" />
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeSearchResults">关闭</el-button>
          <el-button type="primary" @click="exportSearchResults">
            导出结果
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 进度条 -->
    <ProgressBar
      :visible="progressVisible"
      :title="progressTitle"
      :current="progressCurrent"
      :total="progressTotal"
      :currentFile="progressFile"
      :completed="progressCompleted"
      :success="progressSuccess"
      :failed="progressFailed"
      @close="closeProgress"
    />
    
    <!-- 路径选择对话框 -->
    <path-selector-dialog
      v-model:visible="dialogVisible"
      v-model:selected-path="dialogPath"
      @confirm="confirmDirectory"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { FolderOpened, Folder, Search, Document } from '@element-plus/icons-vue'
import { FileWithFullPath } from '../../../types/file-types'
import PathSelectorDialog from './common/PathSelectorDialog.vue'
import ProgressBar from './common/ProgressBar.vue'
import { useFileTypes } from '../composables/useFileTypes'
import { useRecentPaths } from '../composables/useRecentPaths'
import { useOperationLog } from '../composables/useOperationLog'

const sourcePath = ref('')
const searchText = ref('')
const dialogVisible = ref(false)
const dialogPath = ref('')
const tableData = ref<FileWithFullPath[]>([])
const selectedFiles = ref<FileWithFullPath[]>([])
const ignoreCase = ref(true)

// 搜索结果
const searchResultsVisible = ref(false)
const searchResults = ref<Array<{
  filePath: string
  fileName: string
  matches: string[]
  lineNumbers: number[]
}>>([])

// 进度条状态
const progressVisible = ref(false)
const progressTitle = ref('处理中...')
const progressCurrent = ref(0)
const progressTotal = ref(0)
const progressFile = ref('')
const progressCompleted = ref(false)
const progressSuccess = ref(0)
const progressFailed = ref(0)

// 使用组合式API
const { fileExtensions, fileTypeOptions } = useFileTypes()
const { recentPaths, addPath } = useRecentPaths('content_search_paths')
const { addLog } = useOperationLog()

// 进度监听器
let removeSearchProgressListener: (() => boolean) | null = null
let removeContentSearchProgressListener: (() => boolean) | null = null

// 设置进度监听
onMounted(() => {
  // 文件搜索进度监听
  removeSearchProgressListener = window.api.onSearchProgress((progress) => {
    progressCurrent.value = progress.current
    progressTotal.value = progress.total
    progressFile.value = progress.file
  })
  
  // 内容搜索进度监听
  removeContentSearchProgressListener = window.api.onContentSearchProgress((progress) => {
    progressCurrent.value = progress.current
    progressTotal.value = progress.total
    progressFile.value = progress.file
  })
})

// 清理监听器
onUnmounted(() => {
  if (removeSearchProgressListener) {
    removeSearchProgressListener()
  }
  
  if (removeContentSearchProgressListener) {
    removeContentSearchProgressListener()
  }
})

// 打开路径选择对话框
const openDialog = () => {
  dialogVisible.value = true
  dialogPath.value = ''
}

// 获取缩短的路径显示
const getShortPath = (path: string) => {
  if (path.length <= 30) return path
  
  const parts = path.split(/[/\\]/)
  if (parts.length <= 2) return path
  
  return parts[0] + '/.../' + parts[parts.length - 1]
}

// 选择最近路径
const selectRecentPath = (path: string) => {
  sourcePath.value = path
}

// 搜索文件
const searchFiles = async () => {
  try {
    if (!sourcePath.value) {
      ElMessage.warning('请先选择源路径')
      return
    }

    if (fileExtensions.value.length === 0) {
      ElMessage.warning('请选择至少一种文件类型')
      return
    }

    // 重置表格数据
    tableData.value = []
    selectedFiles.value = []
    
    // 显示进度条
    progressVisible.value = true
    progressTitle.value = '搜索文件中...'
    progressCurrent.value = 0
    progressTotal.value = 0
    progressFile.value = ''
    progressCompleted.value = false
    
    // 记录操作日志
    addLog('search', `在 ${sourcePath.value} 中搜索文件，类型: ${fileExtensions.value.join(', ')}`)

    const extensions = fileExtensions.value.map((ext) => ext.trim())
    tableData.value = await window.api.searchFiles(sourcePath.value, extensions)

    // 更新进度条
    progressCompleted.value = true
    progressSuccess.value = tableData.value.length
    progressFailed.value = 0

    if (tableData.value.length === 0) {
      ElMessage.info('未找到符合条件的文件')
    } else {
      ElMessage.success(`找到 ${tableData.value.length} 个文件`)
    }
  } catch (error) {
    const err = error as Error
    ElMessage.error(`搜索文件时出错: ${err.message}`)
    
    // 记录错误日志
    addLog('search', `搜索文件失败: ${err.message}`, err.stack)
    
    // 更新进度条
    progressCompleted.value = true
    progressSuccess.value = 0
    progressFailed.value = 1
  }
}

// 在单个文件中搜索内容
const searchInFile = async (file: FileWithFullPath) => {
  if (!searchText.value) {
    ElMessage.warning('请输入搜索文本')
    return
  }
  
  try {
    // 显示进度条
    progressVisible.value = true
    progressTitle.value = '搜索文件内容...'
    progressCurrent.value = 0
    progressTotal.value = 1
    progressFile.value = file.fileName
    progressCompleted.value = false
    
    // 记录操作日志
    addLog('search', `在文件 ${file.fileName} 中搜索文本: "${searchText.value}"`)
    
    // 执行搜索
    const results = await window.api.searchInFiles(
      [file.fullPath], 
      searchText.value, 
      ignoreCase.value
    )
    
    // 更新进度条
    progressCompleted.value = true
    progressSuccess.value = results.length
    progressFailed.value = 0
    
    // 显示结果
    searchResults.value = results
    searchResultsVisible.value = true
    
    if (results.length === 0) {
      ElMessage.info(`在文件 ${file.fileName} 中未找到匹配内容`)
    } else {
      ElMessage.success(`在文件中找到 ${results[0].matches.length} 处匹配`)
    }
  } catch (error) {
    const err = error as Error
    ElMessage.error(`搜索文件内容时出错: ${err.message}`)
    
    // 记录错误日志
    addLog('search', `搜索文件内容失败: ${err.message}`, err.stack)
    
    // 更新进度条
    progressCompleted.value = true
    progressSuccess.value = 0
    progressFailed.value = 1
  }
}

// 在选中的文件中搜索内容
const searchInSelectedFiles = async () => {
  if (selectedFiles.value.length === 0) {
    ElMessage.warning('请先选择文件')
    return
  }

  if (!searchText.value) {
    ElMessage.warning('请输入搜索文本')
    return
  }

  try {
    // 显示进度条
    progressVisible.value = true
    progressTitle.value = '搜索文件内容...'
    progressCurrent.value = 0
    progressTotal.value = selectedFiles.value.length
    progressFile.value = ''
    progressCompleted.value = false
    
    // 记录操作日志
    addLog('search', `在 ${selectedFiles.value.length} 个文件中搜索文本: "${searchText.value}"`)
    
    // 获取文件路径列表
    const filePaths = selectedFiles.value.map(file => file.fullPath)
    
    // 执行搜索
    const results = await window.api.searchInFiles(
      filePaths, 
      searchText.value, 
      ignoreCase.value
    )
    
    // 更新进度条
    progressCompleted.value = true
    progressSuccess.value = results.length
    progressFailed.value = 0
    
    // 显示结果
    searchResults.value = results
    searchResultsVisible.value = true
    
    if (results.length === 0) {
      ElMessage.info('未找到匹配内容')
    } else {
      const totalMatches = results.reduce((sum, result) => sum + result.matches.length, 0)
      ElMessage.success(`在 ${results.length} 个文件中找到 ${totalMatches} 处匹配`)
    }
  } catch (error) {
    const err = error as Error
    ElMessage.error(`搜索文件内容时出错: ${err.message}`)
    
    // 记录错误日志
    addLog('search', `搜索文件内容失败: ${err.message}`, err.stack)
    
    // 更新进度条
    progressCompleted.value = true
    progressSuccess.value = 0
    progressFailed.value = 1
  }
}

// 导出搜索结果
const exportSearchResults = () => {
  if (searchResults.value.length === 0) {
    ElMessage.warning('没有可导出的结果')
    return
  }
  
  try {
    // 构建导出内容
    let content = `搜索文本: ${searchText.value}\n`
    content += `忽略大小写: ${ignoreCase.value ? '是' : '否'}\n`
    content += `搜索时间: ${new Date().toLocaleString()}\n\n`
    
    // 添加每个文件的结果
    searchResults.value.forEach(result => {
      content += `文件: ${result.filePath}\n`
      
      // 添加每个匹配项
      result.matches.forEach((match, index) => {
        content += `  行 ${result.lineNumbers[index]}: ${match}\n`
      })
      
      content += '\n'
    })
    
    // 创建并下载文件
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `搜索结果_${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    
    URL.revokeObjectURL(url)
    
    ElMessage.success('搜索结果已导出')
    
    // 记录操作日志
    addLog('search', `导出搜索结果: ${searchResults.value.length} 个文件`)
  } catch (error) {
    const err = error as Error
    ElMessage.error(`导出搜索结果时出错: ${err.message}`)
    
    // 记录错误日志
    addLog('search', `导出搜索结果失败: ${err.message}`, err.stack)
  }
}

// 关闭搜索结果对话框
const closeSearchResults = () => {
  searchResultsVisible.value = false
}

// 关闭进度条
const closeProgress = () => {
  progressVisible.value = false
}

// 表格选择项更改处理
const handleSelectionChange = (selection: FileWithFullPath[]) => {
  selectedFiles.value = selection
}

// 确认目录选择
const confirmDirectory = () => {
  sourcePath.value = dialogPath.value
  dialogVisible.value = false
  
  // 添加到最近路径
  if (sourcePath.value) {
    addPath(sourcePath.value)
  }
}
</script>

<style scoped>
.content-search-container {
  height: 100%;
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 15px;
}

.action-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel-card,
.list-card {
  height: auto;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.list-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 6px;
}

.path-inputs,
.search-settings {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.path-group,
.search-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.path-label,
.input-label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-light);
  font-size: 14px;
}

.recent-paths {
  margin-top: 8px;
}

.recent-label {
  font-size: 12px;
  color: var(--text-light);
  margin-bottom: 4px;
}

.recent-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.recent-path-tag {
  cursor: pointer;
}

.filter-controls {
  margin-top: 6px;
}

.action-buttons {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.action-buttons .el-button {
  flex: 1;
}

.file-list-panel {
  overflow: hidden;
}

.file-table {
  margin-top: 6px;
}

:deep(.el-card__body) {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 12px;
}

:deep(.el-table__body-wrapper) {
  overflow-y: auto;
}

/* 搜索结果样式 */
.search-results-container {
  height: 60vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.search-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.search-query,
.search-stats {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label {
  font-size: 14px;
  color: var(--text-light);
}

.results-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-item {
  background-color: #f9f9f9;
  border-radius: 6px;
  padding: 12px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px dashed var(--border-color);
}

.result-file {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}

.result-path {
  font-size: 12px;
  color: var(--text-light);
}

.result-matches {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.match-item {
  display: flex;
  font-size: 13px;
  padding: 4px 0;
}

.match-line {
  min-width: 60px;
  color: #409eff;
  font-weight: 500;
}

.match-content {
  flex: 1;
  white-space: pre-wrap;
  word-break: break-all;
  background-color: #fff;
  padding: 2px 6px;
  border-radius: 3px;
}
</style> 