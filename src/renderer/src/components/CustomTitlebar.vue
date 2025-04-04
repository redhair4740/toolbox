<template>
  <div class="titlebar" :style="{ backgroundColor: titlebarBgColor }">
    <!-- 可拖动区域 -->
    <div class="drag-region"></div>

    <!-- 窗口控制按钮 -->
    <div class="window-controls">
      <button class="window-control-button" @click="minimizeWindow" aria-label="Minimize">
        <svg width="10" height="10" viewBox="0 0 12 12"><rect fill="currentColor" width="10" height="1" x="1" y="6"></rect></svg>
      </button>
      <button class="window-control-button" @click="maximizeRestoreWindow" aria-label="Maximize/Restore">
        <svg v-if="isMaximized" width="10" height="10" viewBox="0 0 12 12">
          <rect width="8" height="8" x="1" y="1" fill="none" stroke="currentColor" stroke-width="1"></rect>
          <rect width="8" height="8" x="3" y="3" fill="currentColor"></rect>
        </svg>
        <svg v-else width="10" height="10" viewBox="0 0 12 12">
           <rect width="9" height="9" x="1.5" y="1.5" fill="none" stroke="currentColor" stroke-width="1"></rect>
        </svg>
      </button>
      <button class="window-control-button window-close-button" @click="closeWindow" aria-label="Close">
        <svg width="10" height="10" viewBox="0 0 12 12">
          <polygon fill="currentColor" fill-rule="evenodd" points="11 1.576 6.583 6 11 10.424 10.424 11 6 6.583 1.576 11 1 10.424 5.417 6 1 1.576 1.576 1 6 5.417 10.424 1"></polygon>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useTheme } from '../composables/useTheme'

const isMaximized = ref(false)
const { appliedTheme } = useTheme() // 获取应用的实际主题 ('light' 或 'dark')

// 根据主题计算颜色
const isCurrentlyDark = computed(() => appliedTheme.value === 'dark')
const titlebarBgColor = computed(() => isCurrentlyDark.value ? '#252525' : '#ffffff')
const symbolColor = computed(() => isCurrentlyDark.value ? '#e0e0e0' : '#303133')

let removeStateChangeListener: (() => void) | null = null

onMounted(() => {
  if (window.titlebarAPI) {
    // 监听主进程发送的窗口状态变化
    removeStateChangeListener = window.titlebarAPI.onWindowStateChange((maximized) => {
      isMaximized.value = maximized
    })
  }
})

onUnmounted(() => {
  // 组件卸载时移除监听器
  if (removeStateChangeListener) {
    removeStateChangeListener()
  }
})

const minimizeWindow = () => {
  window.titlebarAPI?.sendMinimize()
}

const maximizeRestoreWindow = () => {
  window.titlebarAPI?.sendMaximizeRestore()
}

const closeWindow = () => {
  window.titlebarAPI?.sendClose()
}
</script>

<style scoped>
.titlebar {
  display: flex;
  justify-content: space-between; /* 将按钮推到右侧 */
  align-items: center;
  height: 32px; /* 与之前 overlay 高度一致 */
  width: 100%;
  position: fixed; /* 固定在顶部 */
  top: 0;
  left: 0;
  z-index: 9999; /* 确保在最上层 */
  color: v-bind(symbolColor); /* 使用计算的符号颜色 */
}

.drag-region {
  flex-grow: 1; /* 占据剩余空间 */
  height: 100%;
  -webkit-app-region: drag; /* 设置为可拖动 */
}

.window-controls {
  display: flex;
  height: 100%;
  -webkit-app-region: no-drag; /* 按钮区域不可拖动 */
}

.window-control-button {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 46px; /* Windows 默认按钮宽度 */
  height: 100%;
  border: none;
  background-color: transparent;
  color: inherit; /* 继承 .titlebar 的颜色 */
  cursor: pointer;
  outline: none;
  transition: background-color 0.2s ease;
}

.window-control-button:hover {
  background-color: rgba(128, 128, 128, 0.2); /* 通用悬停效果 */
}

.window-close-button:hover {
  background-color: #e81123; /* 关闭按钮特定悬停效果 */
  color: #ffffff; /* 关闭按钮悬停时符号变白 */
}

.window-control-button svg {
  width: 10px;
  height: 10px;
}
</style>