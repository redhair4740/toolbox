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
        
        <div class="feature-card" @click="$emit('navigate', 'content-search')">
          <div class="card-icon">
            <el-icon><Search /></el-icon>
          </div>
          <div class="card-content">
            <h4>内容搜索</h4>
            <p>在文件内容中查找指定文本</p>
            <ul>
              <li>支持多文件类型过滤</li>
              <li>显示匹配行及上下文</li>
              <li>支持导出搜索结果</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FolderOpened, Edit, Search } from '@element-plus/icons-vue'
</script>

<style scoped>
.home-container {
  height: 100%;
  overflow-y: auto;
}

.welcome-section {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
  background-color: var(--bg-color-secondary);
  border-radius: 8px;
  box-shadow: 0 2px 12px var(--shadow-color);
  padding: 25px;
}

.welcome-text {
  flex: 1;
}

.welcome-text h2 {
  font-size: 26px;
  font-weight: 600;
  margin-bottom: 10px;
  color: var(--text-color);
}

.welcome-text p {
  font-size: 14px;
  color: var(--text-light);
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
  max-height: 200px;
}

.features-section {
  margin-top: 20px;
}

.features-section h3 {
  font-size: 20px;
  font-weight: 500;
  margin-bottom: 20px;
  color: var(--text-color);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.feature-card {
  display: flex;
  background-color: var(--bg-color-secondary);
  border-radius: 8px;
  box-shadow: 0 2px 12px var(--shadow-color);
  padding: 24px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px var(--shadow-color);
}

.card-icon {
  margin-right: 20px;
  font-size: 40px;
  color: var(--primary-color);
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
  color: var(--text-color);
}

.card-content p {
  font-size: 14px;
  color: var(--text-light);
  margin-bottom: 16px;
}

.card-content ul {
  list-style-type: none;
  padding: 0;
}

.card-content li {
  font-size: 14px;
  color: var(--text-light);
  margin-bottom: 4px;
  position: relative;
  padding-left: 16px;
}

.card-content li:before {
  content: '•';
  color: var(--primary-color);
  position: absolute;
  left: 0;
}
</style>
