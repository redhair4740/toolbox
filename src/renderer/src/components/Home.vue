<template>
  <div class="home-container">
    <div class="title">
      <h1>YO工具箱</h1>
      <p>便捷的文件管理工具</p>
    </div>

    <div class="feature-grid">
      <el-card class="feature-card" shadow="hover" @click="navigateTo('move')">
        <div class="icon-container">
          <el-icon :size="60"><FolderOpened /></el-icon>
        </div>
        <div class="feature-title">文件移动</div>
        <div class="feature-desc">批量搜索并移动文件到指定目录</div>
      </el-card>

      <el-card class="feature-card" shadow="hover" @click="navigateTo('rename')">
        <div class="icon-container">
          <el-icon :size="60"><Edit /></el-icon>
        </div>
        <div class="feature-title">文件重命名</div>
        <div class="feature-desc">批量替换文件名中的文本</div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FolderOpened, Edit } from '@element-plus/icons-vue'

const emit = defineEmits(['navigate'])

const navigateTo = (page: string) => {
  emit('navigate', page)
}
</script>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  height: 100vh;
}

.title {
  text-align: center;
  margin-bottom: 3rem;
}

.title h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  color: #409eff;
}

.title p {
  font-size: 1.2rem;
  color: #606266;
}

.feature-grid {
  display: flex;
  gap: 2rem;
  justify-content: center;
  width: 100%;
  max-width: 800px;
}

.feature-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  cursor: pointer;
  transition: transform 0.3s ease;
  max-width: 300px;
}

.feature-card:hover {
  transform: translateY(-10px);
}

.icon-container {
  margin-bottom: 1.5rem;
  color: #409eff;
}

.feature-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: #303133;
}

.feature-desc {
  text-align: center;
  color: #606266;
}
</style>
