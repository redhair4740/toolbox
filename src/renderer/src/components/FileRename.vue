<template>
  <div class="file-rename-container">
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
        </div>
      </el-card>

      <el-card class="panel-card">
        <template #header>
          <div class="card-header">
            <span>重命名设置</span>
          </div>
        </template>

        <div class="rename-settings">
          <div class="search-replace-group">
            <div class="input-label">搜索文本</div>
            <el-input v-model="searchText" placeholder="输入要替换的文本">
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>

          <div class="search-replace-group">
            <div class="input-label">替换文本</div>
            <el-input v-model="replaceText" placeholder="输入替换后的文本">
              <template #prefix>
                <el-icon><Edit /></el-icon>
              </template>
            </el-input>
          </div>

          <div class="search-options">
            <el-checkbox v-model="ignoreCase" label="忽略大小写匹配" />
          </div>

          <div class="search-replace-group">
            <div class="input-label">大小写转换</div>
            <el-select v-model="caseConversion" placeholder="选择大小写转换方式" style="width: 100%">
              <el-option label="不转换" value="none" />
              <el-option label="转大写" value="uppercase" />
              <el-option label="转小写" value="lowercase" />
            </el-select>
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
          <el-button type="primary" @click="searchFiles" :disabled="!sourcePath">
            <el-icon><Search /></el-icon>
            <span>查询文件</span>
          </el-button>

          <el-button
            type="success"
            @click="renameSelectedFiles"
            :disabled="(!searchText && caseConversion === 'none') || selectedFiles.length === 0"
          >
            <el-icon><Edit /></el-icon>
            <span>批量重命名</span>
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
          <el-table-column prop="fileName" label="原文件名" min-width="150" show-overflow-tooltip />
          <el-table-column label="预览新文件名" min-width="150" show-overflow-tooltip>
            <template #default="scope">
              {{ getPreviewName(scope.row.fileName) }}
            </template>
          </el-table-column>
          <el-table-column prop="fullPath" label="文件路径" min-width="200" show-overflow-tooltip />
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="scope">
              <el-button
                type="primary"
                size="small"
                @click="renameFile(scope.row)"
                :disabled="!searchText && caseConversion === 'none'"
                >重命名</el-button
              >
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 路径选择对话框 -->
    <path-selector-dialog
      v-model:visible="dialogVisible"
      v-model:selected-path="dialogPath"
      @confirm="confirmDirectory"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { FolderOpened, Folder, Search, Edit } from '@element-plus/icons-vue'
import { FileWithFullPath } from '../../../types/file-types'
import PathSelectorDialog from './common/PathSelectorDialog.vue'
import { useFileTypes } from '../composables/useFileTypes'

const sourcePath = ref('')
const searchText = ref('')
const replaceText = ref('')
const dialogVisible = ref(false)
const dialogPath = ref('')
const tableData = ref<FileWithFullPath[]>([])
const selectedFiles = ref<FileWithFullPath[]>([])
const ignoreCase = ref(false)
const caseConversion = ref('none')

const { fileExtensions, fileTypeOptions } = useFileTypes()

// 打开路径选择对话框
const openDialog = () => {
  dialogVisible.value = true
  dialogPath.value = ''
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

    tableData.value = []
    ElMessage.info('正在搜索文件，请稍候...')

    const extensions = fileExtensions.value.map((ext) => ext.trim())
    tableData.value = await window.api.searchFiles(sourcePath.value, extensions)

    if (tableData.value.length === 0) {
      ElMessage.info('未找到符合条件的文件')
    } else {
      ElMessage.success(`找到 ${tableData.value.length} 个文件`)
    }
  } catch (error) {
    const err = error as Error
    ElMessage.error(`搜索文件时出错: ${err.message}`)
  }
}

// 获取预览文件名
const getPreviewName = (fileName: string) => {
  let newName = fileName
  
  // 如果有搜索文本，先进行替换
  if (searchText.value) {
    // 创建正则表达式，根据是否忽略大小写设置标志
    const flags = ignoreCase.value ? 'gi' : 'g'
    const regex = new RegExp(searchText.value, flags)
    
    // 替换文本
    newName = fileName.replace(regex, replaceText.value || '')
  }
  
  // 根据大小写转换选项处理文件名，但保留文件扩展名
  if (caseConversion.value !== 'none') {
    const ext = newName.lastIndexOf('.') > 0 ? newName.substring(newName.lastIndexOf('.')) : ''
    const nameWithoutExt = ext ? newName.substring(0, newName.lastIndexOf('.')) : newName
    
    if (caseConversion.value === 'uppercase') {
      newName = nameWithoutExt.toUpperCase() + ext
    } else if (caseConversion.value === 'lowercase') {
      newName = nameWithoutExt.toLowerCase() + ext
    }
  }
  
  return newName
}

// 单个文件重命名
const renameFile = async (file: FileWithFullPath) => {
  try {
    // 如果没有搜索文本但选择了大小写转换，允许继续
    if (!searchText.value && caseConversion.value === 'none') {
      ElMessage.warning('请输入搜索文本或选择大小写转换')
      return
    }
    const result = await window.api.renameFile(
      file.fullPath,
      searchText.value,
      replaceText.value || '',
      { ignoreCase: ignoreCase.value, caseConversion: caseConversion.value }
    )

    if (result.success) {
      ElMessage.success(result.message)
      // 更新表格数据
      const index = tableData.value.findIndex((item) => item.fullPath === file.fullPath)
      if (index !== -1) {
        tableData.value.splice(index, 1)
      }
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    const err = error as Error
    ElMessage.error(`重命名文件时出错: ${err.message}`)
  }
}
// 批量重命名选中文件
const renameSelectedFiles = async () => {
  if (selectedFiles.value.length === 0) {
    ElMessage.warning('请先选择文件')
    return
  }

  // 如果没有搜索文本但选择了大小写转换，允许继续
  if (!searchText.value && caseConversion.value === 'none') {
    ElMessage.warning('请输入搜索文本或选择大小写转换')
    return
  }

  ElMessage.info('正在重命名文件，请稍候...')

  let successCount = 0
  let errorCount = 0

  for (const file of selectedFiles.value) {
    try {
      const result = await window.api.renameFile(
        file.fullPath,
        searchText.value,
        replaceText.value || '',
        { ignoreCase: ignoreCase.value, caseConversion: caseConversion.value }
      )
      if (result.success) {
        successCount++
      } else {
        errorCount++
        console.error(`重命名失败: ${file.fileName} - ${result.message}`)
      }
    } catch (error) {
      errorCount++
      console.error(`重命名出错: ${file.fileName}`, error)
    }
  }

  if (successCount > 0) {
    ElMessage.success(`成功重命名 ${successCount} 个文件`)
    // 重新搜索文件以更新列表
    searchFiles()
  }

  if (errorCount > 0) {
    ElMessage.error(`${errorCount} 个文件重命名失败`)
  }
}

// 表格选择项更改处理
const handleSelectionChange = (selection: FileWithFullPath[]) => {
  selectedFiles.value = selection
}

// 确认目录选择
const confirmDirectory = () => {
  sourcePath.value = dialogPath.value
  dialogVisible.value = false
  
  // 当选择源路径后自动触发查询
  if (sourcePath.value && fileExtensions.value.length > 0) {
    searchFiles()
  }
}
</script>

<style scoped>
.file-rename-container {
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
.rename-settings {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.path-group,
.search-replace-group {
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
</style>
