<template>
  <div class="app-container">
    <!-- 侧边导航 -->
    <div class="sidebar" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
      <div class="logo">
        <img src="./assets/logo-gradient.svg" alt="YO工具箱" class="logo-image" />
        <!-- <span v-if="!isSidebarCollapsed" class="logo-text">工具箱</span> -->
      </div>

      <div class="nav-items">
        <div class="nav-item" :class="{ active: activeTab === 'home' }" @click="activeTab = 'home'">
          <el-icon><HomeFilled /></el-icon>
          <span v-if="!isSidebarCollapsed">首页</span>
        </div>

        <div class="nav-item" :class="{ active: activeTab === 'move' }" @click="activeTab = 'move'">
          <el-icon><FolderOpened /></el-icon>
          <span v-if="!isSidebarCollapsed">文件移动</span>
        </div>

        <div
          class="nav-item"
          :class="{ active: activeTab === 'rename' }"
          @click="activeTab = 'rename'"
        >
          <el-icon><Edit /></el-icon>
          <span v-if="!isSidebarCollapsed">文件重命名</span>
        </div>
      </div>

      <div class="sidebar-toggle" @click="toggleSidebar">
        <el-icon v-if="isSidebarCollapsed"><ArrowRight /></el-icon>
        <el-icon v-else><ArrowLeft /></el-icon>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <div class="content-header">
        <h1>{{ getPageTitle() }}</h1>
      </div>

      <div class="content-body">
        <Home v-if="activeTab === 'home'" />
        <FileMove v-else-if="activeTab === 'move'" />
        <FileRename v-else-if="activeTab === 'rename'" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { HomeFilled, FolderOpened, Edit, ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import FileMove from './components/FileMove.vue'
import FileRename from './components/FileRename.vue'
import Home from './components/Home.vue'

const activeTab = ref('home')
const isSidebarCollapsed = ref(false)

const getPageTitle = () => {
  switch (activeTab.value) {
    case 'home':
      return '欢迎使用YO工具箱'
    case 'move':
      return '文件移动'
    case 'rename':
      return '文件重命名'
    default:
      return ''
  }
}

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}
</script>

<style>
:root {
  --primary-color: #409eff;
  --sidebar-width: 200px;
  --sidebar-collapsed-width: 64px;
  --header-height: 60px;
  --bg-color: #f5f7fa;
  --text-color: #303133;
  --text-light: #909399;
  --border-color: #e4e7ed;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei',
    Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  color: var(--text-color);
  overflow: hidden;
}

.app-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: var(--bg-color);
}

.sidebar {
  width: var(--sidebar-width);
  height: 100%;
  background-color: white;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  z-index: 1000;
}

.sidebar-collapsed {
  width: var(--sidebar-collapsed-width);
}

.logo {
  height: var(--header-height);
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid var(--border-color);
}

.logo-image {
  width: 32px;
  height: 32px;
}

.logo-text {
  font-size: 18px;
  font-weight: bold;
  margin-left: 12px;
  color: var(--primary-color);
}

.nav-items {
  flex: 1;
  padding: 16px 0;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--text-light);
}

.nav-item:hover {
  background-color: rgba(64, 158, 255, 0.1);
  color: var(--primary-color);
}

.nav-item.active {
  background-color: rgba(64, 158, 255, 0.15);
  color: var(--primary-color);
  font-weight: 500;
}

.nav-item .el-icon {
  font-size: 20px;
}

.nav-item span {
  margin-left: 12px;
  white-space: nowrap;
}

.sidebar-toggle {
  padding: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  border-top: 1px solid var(--border-color);
  color: var(--text-light);
}

.sidebar-toggle:hover {
  color: var(--primary-color);
}

.main-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.content-header {
  height: var(--header-height);
  padding: 0 24px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  background-color: white;
}

.content-header h1 {
  font-size: 20px;
  font-weight: 500;
  color: var(--text-color);
}

.content-body {
  flex: 1;
  overflow: auto;
  padding: 20px;
}
</style>
