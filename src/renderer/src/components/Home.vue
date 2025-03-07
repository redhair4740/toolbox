<template>
  <div class="home-container">
    <div class="welcome-section">
      <div class="welcome-text">
        <h2>欢迎使用 YO工具箱</h2>
        <p>简单高效的文件管理解决方案</p>
      </div>
      <div class="welcome-image">
        <img src="../assets/file-management.svg" alt="文件管理" />
      </div>
    </div>

    <div class="features-section">
      <h3>功能一览</h3>

      <div class="features-grid">
        <div class="feature-card" @click="$emit('navigate', 'move')">
          <div class="card-icon">
            <el-icon><FolderOpened /></el-icon>
          </div>
          <div class="card-content">
            <h4>文件移动</h4>
            <p>批量搜索并移动文件到指定目录</p>
            <ul>
              <li>支持多种文件格式</li>
              <li>批量操作，高效便捷</li>
              <li>可视化操作界面</li>
            </ul>
          </div>
        </div>

        <div class="feature-card" @click="$emit('navigate', 'rename')">
          <div class="card-icon">
            <el-icon><Edit /></el-icon>
          </div>
          <div class="card-content">
            <h4>文件重命名</h4>
            <p>批量替换文件名中的文本</p>
            <ul>
              <li>支持正则表达式</li>
              <li>实时预览重命名效果</li>
              <li>单个或批量处理文件</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FolderOpened, Edit } from '@element-plus/icons-vue'
</script>

<style scoped>
.home-container {
  height: 100%;
  overflow-y: auto;
}

.welcome-section {
  display: flex;
  align-items: center;
  margin-bottom: 40px;
  background-color: var(--app-card-background);
  border-radius: 8px;
  box-shadow: 0 2px 12px var(--app-shadow-color);
  padding: 40px;
  border: 1px solid var(--app-border-color);
}

.welcome-text {
  flex: 1;
}

.welcome-text h2 {
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--app-text-color);
}

.welcome-text p {
  font-size: 16px;
  color: var(--app-icon-color);
}

.welcome-image {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.welcome-image img {
  max-width: 100%;
  height: auto;
  max-height: 250px;
  /* 在暗黑模式下可以调整明度 */
  filter: var(--app-image-filter, none);
}

.features-section {
  margin-top: 20px;
}

.features-section h3 {
  font-size: 20px;
  font-weight: 500;
  margin-bottom: 20px;
  color: var(--app-text-color);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.feature-card {
  display: flex;
  background-color: var(--app-card-background);
  border-radius: 8px;
  box-shadow: 0 2px 12px var(--app-shadow-color);
  padding: 24px;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid var(--app-border-color);
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px var(--app-shadow-color);
}

.card-icon {
  margin-right: 20px;
  font-size: 40px;
  color: var(--el-color-primary);
  display: flex;
  align-items: flex-start;
}

.card-icon .el-icon {
  font-size: 40px;
}

.card-content {
  flex: 1;
}

.card-content h4 {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--app-text-color);
}

.card-content p {
  font-size: 14px;
  color: var(--app-icon-color);
  margin-bottom: 16px;
}

.card-content ul {
  list-style-type: none;
  padding: 0;
}

.card-content li {
  font-size: 14px;
  color: var(--app-icon-color);
  margin-bottom: 4px;
  position: relative;
  padding-left: 16px;
}

.card-content li:before {
  content: '•';
  color: var(--el-color-primary);
  position: absolute;
  left: 0;
}
</style>
