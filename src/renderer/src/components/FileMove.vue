<template>
  <div class="common-layout">
    <el-container>
      <el-header class="el-header">
        <el-row :gutter="20">
          <el-col :span="9"
            ><el-input
              v-model="sourcePath"
              style="max-width: 100%; width: 100%"
              placeholder="源路径"
            />
          </el-col>
          <el-col :span="3"
            ><el-button
              type="primary"
              style="max-width: 100%; width: 100%"
              @click="openDialog('source')"
              >源路径</el-button
            >
          </el-col>
          <el-col :span="9"
            ><el-input
              v-model="targetPath"
              style="max-width: 100%; width: 100%"
              placeholder="目标路径"
            />
          </el-col>
          <el-col :span="3"
            ><el-button
              type="primary"
              style="max-width: 100%; width: 100%"
              @click="openDialog('target')"
              >目标路径</el-button
            >
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="18"
            ><el-select
              v-model="fileExtensions"
              clearable
              multiple
              placeholder="文件类型"
              style="max-width: 100%; width: 100%"
            >
              <el-option
                v-for="item in options"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-col>
          <el-col :span="3"
            ><el-button type="primary" style="max-width: 100%; width: 100%" @click="searchFiles()"
              >查询</el-button
            >
          </el-col>
          <el-col :span="3"
            ><el-button type="primary" style="max-width: 100%; width: 100%" @click="moveFiles()"
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
    <el-dialog v-model="dialogVisible">
      <el-row :gutter="20">
        <el-col :span="18"
          ><el-input v-model="dialogPath" style="max-width: 100%; width: 100%" disabled
        /></el-col>
        <el-col :span="6">
          <!-- 这里可以放置一些按钮或输入框来模拟选择目录的过程 -->
          <el-button style="max-width: 100%; width: 100%" @click="selectDirectory"
            >选择目录</el-button
          >
        </el-col>
      </el-row>

      <div></div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmDirectory">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import '../../../../global.d';
import { FileWithFullPath } from '../../../types/file-types.d';  // 导入类型

const sourcePath = ref('')
const targetPath = ref('')
const dialogVisible = ref(false)
const dialogPath = ref('')
const currentPathType = ref('') // 'source' or 'target'
const tableData = ref<FileWithFullPath[]>([])

const fileExtensions = ref<string[]>([".mkv", ".mp4", ".iso", ".avi", ".mpg"]);
const options = [
  {
    value: '.mkv',
    label: 'mkv'
  },
  {
    value: '.mp4',
    label: 'mp4'
  },
  {
    value: '.iso',
    label: 'iso'
  },
  {
    value: '.avi',
    label: 'avi'
  },
  {
    value: '.mpg',
    label: 'mpg'
  },
  {
    value: '.ass',
    label: 'ass'
  },
  {
    value: '.jpg',
    label: 'jpg'
  },
  {
    value: '.png',
    label: 'png'
  },
  {
    value: '.zip',
    label: 'zip'
  }
]

const openDialog = (type) => {
  dialogVisible.value = true
  currentPathType.value = type
  dialogPath.value = ''
}

const selectDirectory = async () => {
  try {
    const selectedPath = await window.api.openDirectoryDialog()
    if (selectedPath) {
      dialogPath.value = selectedPath
    }
  } catch (error) {
    console.error('Error opening directory dialog:', error)
  }
}

const searchFiles = async () => {
  try {
    const extensions = fileExtensions.value.map((ext) => ext.trim())
    tableData.value = await window.api.searchFiles(sourcePath.value, extensions)
    // console.log(tableData.value)
    // tableData.value = results;
  } catch (error) {
    const err = error as Error
    ElMessage.error(`搜索文件时出错: ${err.message}`)
  }
}

const moveFiles = async () => {
  for (const item of tableData.value) {
    item.targetPath = await window.api.cutFile(item.fullPath, targetPath.value, item.fileName)
  }
}

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
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 2vh; /* 视口高度的25% */
  z-index: 1000; /* 确保header在最上层 */
  padding-top: 3vh;
}

.el-table {
  position: fixed;
  top: 20vh;
  left: 20px;
  height: 77vh;
  width: calc(100% - 40px); /* 根据需要调整50px这个值 */
  margin-right: 40px; /* 留出的空白 */
  flex-grow: 1; /* 让表格占满剩余空间 */
}

.el-container {
  display: flex;
  flex-direction: column;
  height: 100vh; /* 根据需要调整高度 */
}

.el-row {
  margin-bottom: 20px;
}
.el-row:last-child {
  margin-bottom: 0;
}
.el-col {
  border-radius: 4px;
}

.el-table {
  border-radius: 4px; /* 设置圆角的大小 */
  overflow: hidden; /* 确保内容不会超出圆角边界 */
}
</style>
