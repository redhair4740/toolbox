<template>
  <div>
    <!-- 导航栏，只在功能页面显示 -->
    <div v-if="activeTab !== 'home'" class="nav-bar">
      <el-button type="primary" plain @click="activeTab = 'home'">
        <el-icon><Back /></el-icon> 返回首页
      </el-button>
      <div class="page-title">{{ getPageTitle() }}</div>
    </div>

    <!-- 内容区域 -->
    <div :class="{ 'content-with-nav': activeTab !== 'home' }">
      <Home v-if="activeTab === 'home'" @navigate="handleNavigate" />
      <FileMove v-else-if="activeTab === 'move'" />
      <FileRename v-else-if="activeTab === 'rename'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Back } from '@element-plus/icons-vue'
import FileMove from './components/FileMove.vue'
import FileRename from './components/FileRename.vue'
import Home from './components/Home.vue'

const activeTab = ref('home')

const handleNavigate = (page: string) => {
  activeTab.value = page
}

const getPageTitle = () => {
  switch (activeTab.value) {
    case 'move':
      return '文件移动'
    case 'rename':
      return '文件重命名'
    default:
      return ''
  }
}
</script>

<style>
body {
  margin: 0;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei',
    Arial, sans-serif;
}

.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 50px;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 2000;
  display: flex;
  align-items: center;
  padding: 0 20px;
}

.page-title {
  margin-left: 20px;
  font-size: 1.2rem;
  font-weight: bold;
}

.content-with-nav {
  padding-top: 50px;
}
</style>
