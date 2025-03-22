<template>
  <div class="file-search">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2>文件内容搜索</h2>
        </div>
      </template>

      <div class="search-container">
        <!-- 搜索配置区域 -->
        <div class="search-config">
          <!-- 路径选择器 -->
          <div class="path-section">
            <h3>搜索路径</h3>
            <path-selector
              v-model="searchPath"
              placeholder="选择要搜索的文件夹"
              directory-only
              @select="handlePathSelect"
            />
          </div>

          <!-- 搜索选项 -->
          <div class="search-options">
            <el-form :model="searchOptions" label-width="100px">
              <!-- 搜索内容 -->
              <el-form-item label="搜索内容">
                <el-input
                  v-model="searchOptions.content"
                  type="textarea"
                  :rows="3"
                  placeholder="输入要搜索的内容"
                  clearable
                />
              </el-form-item>

              <!-- 文件类型 -->
              <el-form-item label="文件类型">
                <el-select
                  v-model="searchOptions.fileTypes"
                  multiple
                  collapse-tags
                  collapse-tags-tooltip
                  placeholder="选择要搜索的文件类型"
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

              <!-- 自定义文件模式 -->
              <el-form-item label="文件模式">
                <el-input
                  v-model="searchOptions.filePattern"
                  placeholder="自定义文件匹配模式 (例如: *.txt)"
                  clearable
                >
                  <template #append>
                    <el-tooltip content="支持glob模式，多个模式用逗号分隔" placement="top">
                      <el-icon><InfoFilled /></el-icon>
                    </el-tooltip>
                  </template>
                </el-input>
              </el-form-item>

              <!-- 搜索选项 -->
              <el-form-item>
                <el-checkbox v-model="searchOptions.recursive">包含子目录</el-checkbox>
                <el-checkbox v-model="searchOptions.caseSensitive">区分大小写</el-checkbox>
                <el-checkbox v-model="searchOptions.useRegex">使用正则表达式</el-checkbox>
              </el-form-item>

              <!-- 排除模式 -->
              <el-form-item label="排除模式">
                <el-select
                  v-model="searchOptions.excludePatterns"
                  multiple
                  filterable
                  allow-create
                  default-first-option
                  placeholder="输入要排除的文件模式"
                  style="width: 100%"
                >
                  <el-option
                    v-for="pattern in defaultExcludePatterns"
                    :key="pattern"
                    :label="pattern"
                    :value="pattern"
                  />
                </el-select>
              </el-form-item>

              <!-- 搜索按钮 -->
              <el-form-item>
                <el-button
                  type="primary"
                  :loading="isSearching"
                  @click="startSearch"
                >
                  开始搜索
                </el-button>
                <el-button
                  :disabled="!isSearching"
                  @click="cancelSearch"
                >
                  取消
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>

        <!-- 搜索结果区域 -->
        <div class="search-results">
          <div class="results-header">
            <h3>搜索结果</h3>
            <div class="results-actions">
              <el-input
                v-model="filterQuery"
                placeholder="过滤结果"
                clearable
                style="width: 200px"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              <el-button
                type="primary"
                :disabled="searchResults.length === 0"
                @click="exportResults"
              >
                导出结果
              </el-button>
            </div>
          </div>

          <div class="results-container">
            <!-- 搜索进度 -->
            <div v-if="isSearching" class="search-progress">
              <el-progress
                :percentage="searchProgress.percentage"
                :format="progressFormat"
              />
              <div class="progress-details">
                <span>已搜索: {{ searchProgress.searched }} 个文件</span>
                <span>找到: {{ searchProgress.matches }} 个匹配</span>
                <span>当前: {{ searchProgress.currentFile }}</span>
              </div>
            </div>

            <!-- 搜索结果列表 -->
            <div v-if="!isSearching && filteredResults.length === 0" class="no-results">
              暂无搜索结果
            </div>

            <el-tree
              v-else-if="filteredResults.length > 0"
              ref="resultsTree"
              :data="resultTreeData"
              :props="treeProps"
              node-key="id"
              default-expand-all
            >
              <!-- 文件节点 -->
              <template #default="{ node, data }">
                <div class="result-node" :class="{ 'is-file': data.type === 'file' }">
                  <el-icon>
                    <Document v-if="data.type === 'file'" />
                    <Folder v-else />
                  </el-icon>
                  <span class="node-label">{{ node.label }}</span>
                  <span v-if="data.type === 'file' && data.matches" class="match-count">
                    ({{ data.matches.length }} 个匹配)
                  </span>
                </div>
              </template>

              <!-- 匹配内容 -->
              <template #match="{ data }">
                <div class="match-content" v-if="data && data.line">
                  <div class="match-line">
                    行 {{ data.line }}: {{ data.content }}
                  </div>
                  <div class="match-context" v-if="data.context">
                    <pre>{{ data.context }}</pre>
                  </div>
                </div>
              </template>
            </el-tree>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Document,
  Folder,
  Search,
  InfoFilled
} from '@element-plus/icons-vue'
import PathSelector from './common/PathSelector.vue'
import { useFileTypes } from '../composables/useFileTypes'
import { useOperationLog } from '../composables/useOperationLog'
import { useRecentPaths } from '../composables/useRecentPaths'

// 文件服务接口
const api = window.api

// 使用组合式API
const { fileCategories, getFileTypesByCategory, getCategoryLabel } = useFileTypes()
const { addLog } = useOperationLog()
const { addRecentPath } = useRecentPaths()

// 默认的排除模式
const defaultExcludePatterns = [
  'node_modules/**/*',
  '.git/**/*',
  'dist/**/*',
  'build/**/*',
  '*.min.*',
  '*.map'
]

// 搜索状态
const searchPath = ref('')
const isSearching = ref(false)
const filterQuery = ref('')

// 搜索选项
const searchOptions = reactive({
  content: '',
  fileTypes: [],
  filePattern: '',
  recursive: true,
  caseSensitive: false,
  useRegex: false,
  excludePatterns: [...defaultExcludePatterns]
})

// 搜索进度
const searchProgress = reactive({
  percentage: 0,
  searched: 0,
  matches: 0,
  currentFile: ''
})

// 搜索结果
const searchResults = ref<Array<{
  filePath: string
  matches: Array<{
    line: number
    content: string
    context?: string
  }>
}>>([])

// 树形结构配置
const treeProps = {
  label: 'label',
  children: 'children'
}

// 计算属性：过滤后的结果
const filteredResults = computed(() => {
  if (!filterQuery.value) return searchResults.value

  const query = filterQuery.value.toLowerCase()
  return searchResults.value.filter(result => {
    const matchesQuery = result.filePath.toLowerCase().includes(query)
    const hasMatchingContent = result.matches.some(match =>
      match.content.toLowerCase().includes(query)
    )
    return matchesQuery || hasMatchingContent
  })
})

// 计算属性：树形结构数据
const resultTreeData = computed(() => {
  // 定义更具体的类型
  interface TreeNode {
    id: string;
    label: string;
    type: 'file' | 'directory';
    children: TreeNode[];
    matches?: Array<{
      line: number;
      content: string;
      context?: string;
    }>;
  }
  
  const tree: TreeNode[] = []
  const pathMap = new Map<string, TreeNode>()

  filteredResults.value.forEach(result => {
    const parts = result.filePath.split('/')
    let currentPath = ''

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part
      
      if (!pathMap.has(currentPath)) {
        const newNode: TreeNode = {
          id: currentPath,
          label: part,
          type: index === parts.length - 1 ? 'file' : 'directory',
          children: []
        }

        if (index === parts.length - 1) {
          newNode.matches = result.matches
        }

        pathMap.set(currentPath, newNode)

        if (index === 0) {
          tree.push(newNode)
        } else {
          const parentPath = parts.slice(0, index).join('/')
          const parent = pathMap.get(parentPath)
          if (parent) {
            parent.children.push(newNode)
          }
        }
      }
    })
  })

  return tree
})

// 进度格式化
const progressFormat = (percentage: number) => {
  if (percentage === 100) return '完成'
  return `${percentage}%`
}

// 处理路径选择
const handlePathSelect = (path: string) => {
  if (path) {
    addRecentPath(path)
  }
}

// 开始搜索
const startSearch = async () => {
  if (!searchPath.value) {
    ElMessage.warning('请选择搜索路径')
    return
  }

  if (!searchOptions.content) {
    ElMessage.warning('请输入搜索内容')
    return
  }

  try {
    isSearching.value = true
    searchResults.value = []
    searchProgress.percentage = 0
    searchProgress.searched = 0
    searchProgress.matches = 0
    searchProgress.currentFile = ''

    addLog('search', '开始搜索文件...', 'info')

    // 先获取匹配的文件列表
    const files = await api.searchFiles(searchPath.value, searchOptions.fileTypes || [])
    
    if (!files || !Array.isArray(files) || files.length === 0) {
      ElMessage.warning('没有找到匹配的文件')
      isSearching.value = false
      return
    }
    
    // 开始搜索内容
    const unsubscribe = api.onContentSearchProgress((progress) => {
      console.log('搜索进度：', progress)
      if (progress) {
        searchProgress.percentage = progress.current && progress.total 
          ? Math.floor((progress.current / progress.total) * 100) || 0 
          : 0
        searchProgress.searched = progress.current || 0
        searchProgress.matches = searchProgress.matches + (progress.matches || 0)
        searchProgress.currentFile = progress.file || ''
      }
    })
    
    // 执行搜索
    const results = await api.searchInFiles(
      files, 
      searchOptions.content, 
      !searchOptions.caseSensitive
    )

    // 更新结果
    if (results && Array.isArray(results)) {
      searchResults.value = results.map(result => ({
        filePath: result.filePath || '',
        matches: Array.isArray(result.matches) ? result.matches : []
      }))
    } else {
      searchResults.value = []
    }
    
    // 取消监听
    if (typeof unsubscribe === 'function') {
      unsubscribe()
    }
    
    addLog('search', `搜索完成，找到 ${searchResults.value.length} 个文件包含匹配内容`, 'success')
  } catch (error: Error | unknown) {
    addLog('search', `搜索失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error')
    ElMessage.error('搜索失败')
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
}

// 取消搜索
const cancelSearch = async () => {
  try {
    // 发送取消搜索的请求
    await api.cancelSearch()
    addLog('search', '搜索已取消', 'warning')
    ElMessage.warning('搜索已取消')
  } catch (error) {
    addLog('search', `取消搜索失败: ${error.message}`, 'error')
  } finally {
    isSearching.value = false
  }
}

// 导出结果
const exportResults = async () => {
  try {
    // 准备导出内容
    const content = filteredResults.value.map(result => {
      const matches = result.matches.map(match =>
        `  行 ${match.line}: ${match.content}`
      ).join('\n')
      
      return `文件: ${result.filePath}\n${matches}\n`
    }).join('\n')

    // 生成文件名
    const now = new Date()
    const fileName = `search_results_${now.getFullYear()}-${
      String(now.getMonth() + 1).padStart(2, '0')
    }-${
      String(now.getDate()).padStart(2, '0')
    }_${
      String(now.getHours()).padStart(2, '0')
    }-${
      String(now.getMinutes()).padStart(2, '0')
    }.txt`

    // 保存文件
    await api.saveTextFile({
      content,
      fileName,
      title: '保存搜索结果'
    })
    
    addLog('search', '搜索结果已导出', 'success')
    ElMessage.success('搜索结果已导出')
  } catch (error) {
    addLog('search', `导出结果失败: ${error.message}`, 'error')
    ElMessage.error('导出结果失败')
  }
}
</script>

<style scoped>
.file-search {
  padding: 1rem;
}

.search-container {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 1rem;
}

.search-config {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.path-section {
  margin-bottom: 1rem;
}

.search-options {
  padding: 1rem;
  background-color: var(--el-fill-color-light);
  border-radius: 4px;
}

.search-results {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.results-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.results-container {
  flex: 1;
  min-height: 400px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  overflow: auto;
}

.search-progress {
  padding: 1rem;
  border-bottom: 1px solid var(--el-border-color);
}

.progress-details {
  margin-top: 0.5rem;
  display: flex;
  gap: 1rem;
  color: var(--el-text-color-secondary);
  font-size: 0.9em;
}

.no-results {
  padding: 2rem;
  text-align: center;
  color: var(--el-text-color-secondary);
}

.result-node {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.node-label {
  flex: 1;
}

.match-count {
  color: var(--el-text-color-secondary);
  font-size: 0.9em;
}

.match-content {
  padding: 0.5rem 1rem;
  background-color: var(--el-fill-color-lighter);
  border-radius: 4px;
  margin: 0.25rem 0;
}

.match-line {
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-all;
}

.match-context {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px dashed var(--el-border-color);
  font-family: monospace;
  font-size: 0.9em;
  color: var(--el-text-color-secondary);
}
</style>