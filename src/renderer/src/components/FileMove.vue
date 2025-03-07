<template>
  <div class="file-move-container">
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
                  <el-button @click="openDialog('source')">
                    <el-icon><Folder /></el-icon>
                  </el-button>
                </template>
              </el-input>
            </div>
          </div>

          <div class="path-group">
            <div class="path-label">
              <el-icon><Position /></el-icon>
              <span>目标路径</span>
            </div>
            <div class="path-control">
              <el-input v-model="targetPath" placeholder="选择目标文件夹路径" readonly>
                <template #append>
                  <el-button @click="openDialog('target')">
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
            <span>文件过滤</span>
          </div>
        </template>

        <div class="filter-controls">
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

        <div class="action-buttons">
          <el-button type="primary" @click="searchFiles" :disabled="!sourcePath">
            <el-icon><Search /></el-icon>
            <span>查询文件</span>
          </el-button>

          <el-button
            type="success"
            @click="moveFiles"
            :disabled="!targetPath || tableData.length === 0"
          >
            <el-icon><Right /></el-icon>
            <span>移动文件</span>
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
            <el-tag type="info" v-if="tableData.length > 0">
              找到 {{ tableData.length }} 个文件
            </el-tag>
          </div>
        </template>

        <el-empty v-if="tableData.length === 0" description="暂无数据，请先执行查询" />

        <el-table v-else :data="tableData" class="file-table" height="100%" stripe>
          <el-table-column prop="fileName" label="文件名" min-width="150" show-overflow-tooltip />
          <el-table-column prop="fullPath" label="源路径" min-width="200" show-overflow-tooltip />
          <el-table-column
            prop="targetPath"
            label="目标路径"
            min-width="200"
            show-overflow-tooltip
          />
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
import { FolderOpened, Folder, Position, Search, Right } from '@element-plus/icons-vue'
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
    if (extensions.length === 0) {
      ElMessage.warning('请选择至少一种文件类型')
      return
    }

    tableData.value = []
    ElMessage.info('正在搜索文件，请稍候...')

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

// 移动文件
const moveFiles = async () => {
  if (!targetPath.value) {
    ElMessage.warning('请先选择目标路径')
    return
  }

  try {
    ElMessage.info('正在移动文件，请稍候...')

    let successCount = 0
    for (const item of tableData.value) {
      try {
        item.targetPath = await window.api.cutFile(item.fullPath, targetPath.value, item.fileName)
        successCount++
      } catch (e) {
        console.error(`移动文件失败: ${item.fileName}`, e)
      }
    }

    ElMessage.success(`成功移动 ${successCount} 个文件`)

    // 如果有文件移动失败
    if (successCount < tableData.value.length) {
      ElMessage.warning(`${tableData.value.length - successCount} 个文件移动失败`)
    }

    // 重新加载文件列表
    if (successCount > 0) {
      searchFiles()
    }
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
.file-move-container {
  height: 100%;
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
}

.action-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
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

.path-inputs {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.path-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.path-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-light);
  font-size: 14px;
}

.filter-controls {
  margin-bottom: 16px;
}

.action-buttons {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.action-buttons .el-button {
  flex: 1;
}

.file-list-panel {
  overflow: hidden;
}

.file-table {
  margin-top: 8px;
}

:deep(.el-card__body) {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

:deep(.el-table__body-wrapper) {
  overflow-y: auto;
}
</style>
