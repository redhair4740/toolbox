<template>
  <div class="common-layout">
    <el-container>
      <el-header class="el-header">
        <el-row :gutter="20">
          <el-col :span="9">
            <el-input v-model="sourcePath" placeholder="源路径" />
          </el-col>
          <el-col :span="3">
            <el-button type="primary" @click="openDialog('source')">源路径</el-button>
          </el-col>
          <el-col :span="9">
            <el-input v-model="targetPath" placeholder="目标路径" />
          </el-col>
          <el-col :span="3">
            <el-button type="primary" @click="openDialog('target')">目标路径</el-button>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="mt-3">
          <el-col :span="18">
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
          <el-col :span="3">
            <el-button type="primary" @click="searchFiles">查询</el-button>
          </el-col>
          <el-col :span="3">
            <el-button type="primary" @click="moveFiles" :disabled="tableData.length === 0"
              >移动</el-button
            >
          </el-col>
        </el-row>
      </el-header>

      <el-main>
        <el-table :data="tableData" class="el-table">
          <el-table-column prop="fileName" label="文件名" />
          <el-table-column prop="fullPath" label="源路径" />
          <el-table-column prop="targetPath" label="目标路径" />
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
import { FileWithFullPath } from '../../../types/file-types'
import PathSelectorDialog from './common/PathSelectorDialog.vue'
import { useFileTypes } from '../composables/useFileTypes'

const sourcePath = ref('')
const targetPath = ref('')
const dialogVisible = ref(false)
const dialogPath = ref('')
const currentPathType = ref('') // 'source' or 'target'
const tableData = ref<FileWithFullPath[]>([])

const { fileExtensions, fileTypeOptions } = useFileTypes()

// 打开路径选择对话框
const openDialog = (type: string) => {
  dialogVisible.value = true
  currentPathType.value = type
  dialogPath.value = ''
}

// 搜索文件
const searchFiles = async () => {
  try {
    if (!sourcePath.value) {
      ElMessage.warning('请先选择源路径')
      return
    }

    const extensions = fileExtensions.value.map((ext) => ext.trim())
    tableData.value = await window.api.searchFiles(sourcePath.value, extensions)
  } catch (error) {
    const err = error as Error
    ElMessage.error(`搜索文件时出错: ${err.message}`)
  }
}

// 移动文件
const moveFiles = async () => {
  if (!targetPath.value) {
    ElMessage.warning('请先选择目标路径')
    return
  }

  try {
    for (const item of tableData.value) {
      item.targetPath = await window.api.cutFile(item.fullPath, targetPath.value, item.fileName)
    }
    ElMessage.success('文件移动完成')
  } catch (error) {
    const err = error as Error
    ElMessage.error(`移动文件时出错: ${err.message}`)
  }
}

// 确认选择的目录
const confirmDirectory = () => {
  if (currentPathType.value === 'source') {
    sourcePath.value = dialogPath.value
  } else {
    targetPath.value = dialogPath.value
  }
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
