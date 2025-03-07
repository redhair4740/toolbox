<template>
  <div class="common-layout">
    <el-container>
      <el-header class="el-header">
        <el-row :gutter="20">
          <el-col :span="9">
            <el-input v-model="sourcePath" placeholder="源路径" />
          </el-col>
          <el-col :span="3">
            <el-button type="primary" @click="openDialog">源路径</el-button>
          </el-col>
          <el-col :span="5">
            <el-input v-model="searchText" placeholder="搜索文本" />
          </el-col>
          <el-col :span="5">
            <el-input v-model="replaceText" placeholder="替换文本" />
          </el-col>
          <el-col :span="2">
            <el-button
              type="primary"
              @click="renameSelectedFiles"
              :disabled="selectedFiles.length === 0"
              >重命名</el-button
            >
          </el-col>
        </el-row>
        <el-row :gutter="20" class="mt-3">
          <el-col :span="22">
            <el-select
              v-model="fileExtensions"
              clearable
              multiple
              placeholder="文件类型"
              style="width: 100%"
            >
              <el-option
                v-for="item in fileTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-col>
          <el-col :span="2">
            <el-button type="primary" @click="searchFiles">查询</el-button>
          </el-col>
        </el-row>
      </el-header>

      <el-main>
        <el-table :data="tableData" class="el-table" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="55" />
          <el-table-column prop="fileName" label="原文件名" />
          <el-table-column label="预览新文件名">
            <template #default="scope">
              {{ getPreviewName(scope.row.fileName) }}
            </template>
          </el-table-column>
          <el-table-column prop="fullPath" label="文件路径" />
          <el-table-column label="操作" width="100">
            <template #default="scope">
              <el-button type="primary" size="small" @click="renameFile(scope.row)"
                >重命名</el-button
              >
            </template>
          </el-table-column>
        </el-table>
      </el-main>
    </el-container>

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
import { FileWithFullPath } from '../../types/file-types.d'
import PathSelectorDialog from './common/PathSelectorDialog.vue'
import { useFileTypes } from '../composables/useFileTypes'

const sourcePath = ref('')
const searchText = ref('')
const replaceText = ref('')
const dialogVisible = ref(false)
const dialogPath = ref('')
const tableData = ref<FileWithFullPath[]>([])
const selectedFiles = ref<FileWithFullPath[]>([])

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

    const extensions = fileExtensions.value.map((ext) => ext.trim())
    tableData.value = await window.api.searchFiles(sourcePath.value, extensions)
  } catch (error) {
    const err = error as Error
    ElMessage.error(`搜索文件时出错: ${err.message}`)
  }
}

// 获取预览文件名
const getPreviewName = (fileName: string) => {
  if (!searchText.value) return fileName
  return fileName.replace(new RegExp(searchText.value, 'g'), replaceText.value)
}

// 单个文件重命名
const renameFile = async (file: FileWithFullPath) => {
  try {
    if (!searchText.value) {
      ElMessage.warning('请输入搜索文本')
      return
    }

    const result = await window.api.renameFile(file.fullPath, searchText.value, replaceText.value)

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

// 表格选择项更改处理
const handleSelectionChange = (selection: FileWithFullPath[]) => {
  selectedFiles.value = selection
}

// 批量重命名选中文件
const renameSelectedFiles = async () => {
  if (selectedFiles.value.length === 0) {
    ElMessage.warning('请先选择文件')
    return
  }

  if (!searchText.value) {
    ElMessage.warning('请输入搜索文本')
    return
  }

  let successCount = 0
  let errorCount = 0

  for (const file of selectedFiles.value) {
    try {
      const result = await window.api.renameFile(file.fullPath, searchText.value, replaceText.value)
      if (result.success) {
        successCount++
        // 从表格中移除成功重命名的文件
        const index = tableData.value.findIndex((item) => item.fullPath === file.fullPath)
        if (index !== -1) {
          tableData.value.splice(index, 1)
        }
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
  }

  if (errorCount > 0) {
    ElMessage.error(`${errorCount} 个文件重命名失败`)
  }
}

// 确认目录选择
const confirmDirectory = () => {
  sourcePath.value = dialogPath.value
  dialogVisible.value = false
}
</script>

<style scoped>
.el-header {
  padding-top: 20px;
}

.el-table {
  margin-top: 20px;
  height: calc(100vh - 200px);
}

.mt-3 {
  margin-top: 15px;
}
</style>
