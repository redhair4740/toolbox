<template>
  <ThemeProvider>
    <div class="app-container">
      <!-- 侧边导航 -->
      <div class="sidebar" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
        <div class="logo">
          <img src="./assets/logo-gradient.svg" alt="YO工具箱" class="logo-image" />
          <!-- <span v-if="!isSidebarCollapsed" class="logo-text">工具箱</span> -->
        </div>

        <div class="nav-items">
          <div
            class="nav-item"
            :class="{ active: activeTab === 'home' }"
            @click="activeTab = 'home'"
          >
            <el-icon><HomeFilled /></el-icon>
            <span v-if="!isSidebarCollapsed">首页</span>
          </div>

          <div
            class="nav-item"
            :class="{ active: activeTab === 'move' }"
            @click="activeTab = 'move'"
          >
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

          <!-- 主题切换按钮 -->
          <div
            class="theme-switch"
            @click="switchTheme"
            :title="`切换到${isDark ? '明亮' : '暗黑'}模式`"
          >
            <Transition name="theme-icon" mode="out-in">
              <el-icon v-if="isDark" key="light"><Sunny /></el-icon>
              <el-icon v-else key="dark"><Moon /></el-icon>
            </Transition>
          </div>
        </div>

        <div class="content-body">
          <Home v-if="activeTab === 'home'" />
          <FileMove v-else-if="activeTab === 'move'" />
          <FileRename v-else-if="activeTab === 'rename'" />
        </div>
      </div>
    </div>
  </ThemeProvider>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  HomeFilled,
  FolderOpened,
  Edit,
  ArrowLeft,
  ArrowRight,
  Moon,
  Sunny
} from '@element-plus/icons-vue'
import FileMove from './components/FileMove.vue'
import FileRename from './components/FileRename.vue'
import Home from './components/Home.vue'
import ThemeProvider from './components/common/ThemeProvider.vue'
import { useTheme } from './composables/useTheme'

const activeTab = ref('home')
const isSidebarCollapsed = ref(false)

// 引入主题相关功能
const { isDark, toggleDark } = useTheme()

// 主题切换函数，带动画效果
const switchTheme = () => {
  // 添加动画类
  document.documentElement.classList.add('theme-transition')

  // 添加过渡类型的元数据，以便CSS可以针对不同方向的过渡使用不同效果
  document.documentElement.setAttribute(
    'data-theme-direction',
    isDark.value ? 'to-light' : 'to-dark'
  )

  // 切换主题
  toggleDark()

  // 600ms后移除动画类和方向属性
  setTimeout(() => {
    document.documentElement.classList.remove('theme-transition')
    document.documentElement.removeAttribute('data-theme-direction')
  }, 1000)
}

// 切换侧边栏
const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
  localStorage.setItem('sidebarCollapsed', isSidebarCollapsed.value ? 'true' : 'false')
}

// 获取页面标题
const getPageTitle = () => {
  switch (activeTab.value) {
    case 'home':
      return '首页'
    case 'move':
      return '文件移动'
    case 'rename':
      return '文件重命名'
    default:
      return 'YO工具箱'
  }
}

// 初始化侧边栏状态
const savedSidebarState = localStorage.getItem('sidebarCollapsed')
if (savedSidebarState) {
  isSidebarCollapsed.value = savedSidebarState === 'true'
}
</script>

<style>
/* 使用主题CSS变量替代硬编码颜色 */
.app-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: var(--app-background);
}

.sidebar {
  width: var(--sidebar-width);
  height: 100%;
  background-color: var(--app-sidebar-background);
  box-shadow: 2px 0 8px var(--app-shadow-color);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  z-index: 1000;
  border-right: 1px solid var(--app-border-color);
}

.sidebar-collapsed {
  width: var(--sidebar-collapsed-width);
}

.logo {
  height: var(--header-height);
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid var(--app-border-color);
}

.logo-image {
  width: 32px;
  height: 32px;
}

.logo-text {
  font-size: 18px;
  font-weight: bold;
  margin-left: 12px;
  color: var(--el-color-primary);
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
  color: var(--app-text-color);
}

.nav-item:hover {
  background-color: var(--app-hover-color);
  color: var(--el-color-primary);
}

.nav-item.active {
  background-color: var(--app-active-background);
  color: var(--el-color-primary);
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
  border-top: 1px solid var(--app-border-color);
  color: var(--app-icon-color);
}

.sidebar-toggle:hover {
  color: var(--el-color-primary);
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
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--app-border-color);
  background-color: var(--app-header-background);
}

.content-header h1 {
  font-size: 20px;
  font-weight: 500;
  color: var(--app-text-color);
}

.content-body {
  flex: 1;
  overflow: auto;
  padding: 20px;
  background-color: var(--app-background);
}

.theme-switch {
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.3s ease;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-switch:hover {
  background-color: var(--app-hover-color);
}

.theme-switch .el-icon {
  color: var(--app-icon-color);
  font-size: 18px;
}

/* 主题切换动画 */
.theme-transition * {
  transition-duration: 0.6s !important;
}

/* 图标切换动画 */
.theme-icon-enter-active,
.theme-icon-leave-active {
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}

.theme-icon-enter-from {
  transform: rotateY(-90deg);
  opacity: 0;
}

.theme-icon-leave-to {
  transform: rotateY(90deg);
  opacity: 0;
}
</style>
