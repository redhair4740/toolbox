<template>
  <div class="file-rename">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2>文件批量重命名</h2>
        </div>
      </template>

      <div class="rename-form">
        <el-form :model="formData" label-width="100px">
          <!-- 源路径选择 -->
          <el-form-item label="源路径">
            <path-selector
              v-model="sourcePath"
              placeholder="选择源文件夹路径"
              @select="handlePathSelect"
            />
          </el-form-item>

          <!-- 重命名设置 -->
          <el-form-item label="搜索文本">
            <el-input 
              v-model="searchText" 
              placeholder="输入要替换的文本"
            />
          </el-form-item>

          <el-form-item label="替换文本">
            <el-input 
              v-model="replaceText" 
              placeholder="输入替换后的文本"
            />
          </el-form-item>

          <!-- 高级选项 -->
          <el-form-item>
            <el-collapse>
              <el-collapse-item title="高级选项" name="advanced">
                <el-form-item label="大小写转换">
                  <el-select v-model="caseConversion" placeholder="选择大小写转换方式" style="width: 100%">
                    <el-option label="不转换" value="none" />
                    <el-option label="转大写" value="uppercase" />
                    <el-option label="转小写" value="lowercase" />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="忽略大小写">
                  <el-switch v-model="ignoreCase" />
                  <span class="option-hint">
                    (匹配时忽略大小写)
                  </span>
                </el-form-item>
                
                <el-form-item label="文件类型">
                  <el-select
                    v-model="fileExtensions"
                    multiple
                    collapse-tags
                    collapse-tags-tooltip
                    placeholder="选择文件类型"
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
              </el-collapse-item>
            </el-collapse>
          </el-form-item>

          <!-- 操作按钮 -->
          <el-form-item>
            <el-button
              type="primary"
              :disabled="!sourcePath"
              @click="searchFiles"
            >
              查询文件
            </el-button>
            <el-button
              type="success"
              :disabled="(!searchText && caseConversion === 'none') || selectedFiles.length === 0"
              @click="renameSelectedFiles"
            >
              批量重命名
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 文件列表 -->
      <div v-if="tableData.length > 0" class="file-list-section">
        <h3>文件列表</h3>
        <div class="list-header">
          <el-tag type="info" v-if="tableData.length > 0">
            找到 {{ tableData.length }} 个文件
          </el-tag>
          <el-tag type="success" v-if="selectedFiles.length > 0">
            已选择 {{ selectedFiles.length }} 个文件
          </el-tag>
        </div>

        <el-table
          :data="tableData"
          class="file-table"
          height="300px"
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
              >重命名</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 路径选择对话框 -->
      <path-selector-dialog
        v-model:visible="dialogVisible"
        v-model:selected-path="dialogPath"
        @confirm="confirmDirectory"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { FileWithFullPath } from '../../../types/file-types'
import PathSelectorDialog from './common/PathSelectorDialog.vue'
import PathSelector from './common/PathSelector.vue'
import { useFileTypes } from '../composables/useFileTypes'

// 添加空的formData对象以兼容模板中的绑定
const formData = {}

const sourcePath = ref('')
const searchText = ref('')
const replaceText = ref('')
const dialogVisible = ref(false)
const dialogPath = ref('')
const tableData = ref<FileWithFullPath[]>([])
const selectedFiles = ref<FileWithFullPath[]>([])
const ignoreCase = ref(false)
const caseConversion = ref('none')

// 获取文件类型选项数据
const { 
  fileExtensions, 
  fileCategories, 
  getCategoryLabel, 
  getFileTypesByCategory
} = useFileTypes()

// 处理路径选择
const handlePathSelect = (path: string) => {
  sourcePath.value = path
  // 当选择源路径后自动触发查询
  if (sourcePath.value && fileExtensions.value && fileExtensions.value.length > 0) {
    searchFiles()
  }
}

// 搜索文件
const searchFiles = async () => {
  try {
    if (!sourcePath.value) {
      ElMessage.warning('请先选择源路径')
      return
    }

    if (!fileExtensions.value || fileExtensions.value.length === 0) {
      ElMessage.warning('请选择至少一种文件类型')
      return
    }

    tableData.value = []
    ElMessage.info('正在搜索文件，请稍候...')

    // 获取文件扩展名模式
    const extensions = fileExtensions.value
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
.file-rename {
  padding: 1rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rename-form {
  margin-bottom: 1.5rem;
}

.option-hint {
  margin-left: 0.5rem;
  color: var(--el-text-color-secondary);
  font-size: 0.9em;
}

.file-list-section {
  margin: 1rem 0;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  padding: 1rem;
}

.list-header {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.file-table {
  width: 100%;
}
</style>
