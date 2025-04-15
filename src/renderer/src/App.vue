<template>
  <CustomTitlebar /> <!-- 添加自定义标题栏 -->
  <div class="app-container">
    <!-- 侧边导航 -->
    <div class="sidebar" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
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

        <div
          class="nav-item"
          :class="{ active: activeTab === 'content-search' }"
          @click="activeTab = 'content-search'"
        >
          <el-icon><Search /></el-icon>
          <span v-if="!isSidebarCollapsed">内容搜索</span>
        </div>

        <div
          class="nav-item"
          :class="{ active: activeTab === 'settings' }"
          @click="activeTab = 'settings'"
        >
          <el-icon><Setting /></el-icon>
          <span v-if="!isSidebarCollapsed">设置</span>
        </div>
      </div>
      
      <!-- 调试信息提示区域已移除，但保留快捷键功能 -->

      <div class="sidebar-toggle" @click="toggleSidebar">
        <el-icon v-if="isSidebarCollapsed"><ArrowRight /></el-icon>
        <el-icon v-else><ArrowLeft /></el-icon>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <div class="content-body">
        <Home v-if="activeTab === 'home'" />
        <FileMove v-else-if="activeTab === 'move'" />
        <FileRename v-else-if="activeTab === 'rename'" />
        <FileContentSearch v-else-if="activeTab === 'content-search'" />
        <Settings v-else-if="activeTab === 'settings'" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { HomeFilled, FolderOpened, Edit, Search, Setting, ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import FileMove from './components/FileMove.vue'
import FileRename from './components/FileRename.vue'
import FileContentSearch from './components/FileContentSearch.vue'
import Settings from './components/Settings.vue'
import Home from './components/Home.vue'
import { useTheme } from './composables/useTheme'
import { useSettings } from './composables/useSettings'
import CustomTitlebar from './components/CustomTitlebar.vue' // 导入自定义标题栏

// 初始化主题
const { updateTheme } = useTheme()

// 获取设置
const { settings } = useSettings()

const activeTab = ref('home')
const isSidebarCollapsed = ref(false)

// 防止在切换到设置页面时重置设置
let settingsComponentInitialized = false

// 在组件挂载时应用侧边栏折叠状态设置
onMounted(() => {
  // 检查settings.ui是否存在，如果不存在则初始化
  if (!settings.ui) {
    settings.ui = { sidebarCollapsed: false }
  } else if (settings.ui.sidebarCollapsed === undefined) {
    settings.ui.sidebarCollapsed = false
  }
  
  isSidebarCollapsed.value = settings.ui.sidebarCollapsed
})

// 监听设置保存事件，更新侧边栏状态
document.addEventListener('settings-saved', (event) => {
  const savedSettings = (event as CustomEvent).detail
  if (savedSettings && savedSettings.ui) {
    isSidebarCollapsed.value = savedSettings.ui.sidebarCollapsed
  }
})

// 监听设置中主题的变化
watch(() => settings.general.theme, (newTheme) => {
  if (newTheme) updateTheme(newTheme)
}, { immediate: true })

// 监听标签页变化
watch(activeTab, (newTab) => {
  if (newTab === 'settings') {
    if (!settingsComponentInitialized) {
      settingsComponentInitialized = true
    }
  }
})

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
  
  // 确保settings.ui对象存在
  if (!settings.ui) {
    settings.ui = { sidebarCollapsed: isSidebarCollapsed.value }
  } else {
    // 更新设置中的侧边栏状态
    settings.ui.sidebarCollapsed = isSidebarCollapsed.value
  }
}
</script>

<style scoped>
/* 全局样式变量已移至theme.css */

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
  background-color: var(--bg-color);
}

.app-container {
  display: flex;
  /* height: 100vh; */ /* 改为 calc */
  height: calc(100vh - 32px); /* 减去标题栏高度 */
  width: 100vw;
  background-color: var(--bg-color);
  color: var(--text-color);
  padding-top: 32px; /* 为固定标题栏留出空间 */
}

.sidebar {
  width: var(--sidebar-width);
  height: 100%;
  background-color: var(--bg-color-secondary);
  box-shadow: 2px 0 8px var(--shadow-color);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  z-index: 1000;
  border-right: 1px solid var(--border-color);
  -webkit-app-region: no-drag; /* 防止侧边栏触发拖动 */
}

.sidebar-collapsed {
  width: var(--sidebar-collapsed-width);
}

.nav-items {
  flex: 1;
  padding: 10px 0;
  overflow-y: auto;
  background-color: var(--bg-color-secondary);
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--text-light);
  background-color: var(--bg-color-secondary);
}

.nav-item:hover {
  background-color: var(--hover-color);
  color: var(--primary-color);
}

.nav-item.active {
  background-color: var(--active-color);
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
  background-color: var(--bg-color-secondary);
}

.sidebar-toggle:hover {
  color: var(--primary-color);
}

.main-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color);
  /* 移除 padding-top 和 -webkit-app-region: drag */
}

.content-body {
  flex: 1;
  overflow: auto;
  padding: 15px;
  background-color: var(--bg-color);
  color: var(--text-color);
  -webkit-app-region: no-drag; /* 防止内容区域触发拖动 */
}
</style>
