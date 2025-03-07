<!-- 主题提供者组件 - 解决暗黑模式的一些特殊CSS问题 -->
<template>
  <div class="theme-provider">
    <!-- 主题切换过渡叠加层 -->
    <Transition name="theme-overlay">
      <div v-if="isTransitioning" class="theme-transition-overlay" :class="{ dark: isDark }"></div>
    </Transition>
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { watch, onMounted, ref } from 'vue'
import { useTheme } from '../../composables/useTheme'

const { isDark } = useTheme()
const isTransitioning = ref(false)

// 修复暗黑模式下的一些样式问题
const fixDarkModeIssues = (withTransition = false) => {
  if (withTransition) {
    // 开始过渡
    isTransitioning.value = true

    // 设置更长的过渡时间
    document.documentElement.style.setProperty('--transition-time', '0.6s')
    document.documentElement.style.setProperty('--transition-time-slow', '1s')

    // 等待叠加层显示后再切换主题
    setTimeout(() => {
      applyDarkModeStyles()

      // 稍后结束过渡，移除叠加层
      setTimeout(() => {
        document.documentElement.style.setProperty('--transition-time', '0.3s')
        document.documentElement.style.setProperty('--transition-time-slow', '0.8s')
        isTransitioning.value = false
      }, 600)
    }, 150)
  } else {
    applyDarkModeStyles()
  }
}

// 实际应用暗黑模式样式
const applyDarkModeStyles = () => {
  if (isDark.value) {
    // 添加额外的暗黑模式样式修复
    const style = document.createElement('style')
    style.id = 'dark-mode-fixes'
    style.textContent = `
      /* 表格暗色模式样式修复 */
      .el-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell {
        background-color: #262727 !important;
      }
      
      /* 选择器暗色模式样式修复 */
      .el-select .el-input.is-focus .el-input__wrapper {
        box-shadow: 0 0 0 1px var(--el-color-primary) inset !important;
      }
      
      /* 卡片内容暗色模式样式修复 */
      .el-card__body {
        color: var(--el-text-color-primary);
      }
      
      /* 文件列表暗色模式样式修复 */
      .file-list .file-item {
        background-color: #1d1e1f;
        border-color: #4c4d4f;
      }
      
      /* 按钮文本暗色模式样式修复 */
      .el-button--default {
        color: #E5EAF3;
      }
      
      /* 弹窗暗色模式样式修复 */
      .el-message-box {
        background-color: #1d1e1f;
        border-color: #4c4d4f;
      }
      
      .el-message-box__title {
        color: #E5EAF3;
      }
      
      .el-message-box__message {
        color: #CFD3DC;
      }
      
      /* 更好的暗黑模式对比度 */
      .nav-item:not(.active) {
        color: #CFD3DC;
      }
      
      /* 欢迎页暗黑模式样式修复 */
      .welcome-section {
        background-color: #1d1e1f;
        border-color: #4c4d4f;
      }
      
      .feature-card {
        background-color: #1d1e1f;
        border-color: #4c4d4f;
      }
      
      /* 在暗黑模式下调整SVG图像 */
      .welcome-image img {
        filter: brightness(0.8) invert(0.2);
      }
      
      /* 过渡动画增强 */
      .theme-transition * {
        transition-duration: 0.6s !important;
      }
    `
    document.head.appendChild(style)
  } else {
    // 移除暗黑模式样式修复
    const darkModeFixes = document.getElementById('dark-mode-fixes')
    if (darkModeFixes) {
      darkModeFixes.remove()
    }
  }
}

// 监听主题变化
watch(isDark, () => {
  fixDarkModeIssues(true)
})

// 初始化
onMounted(() => {
  fixDarkModeIssues()
})
</script>

<style scoped>
/* 主题过渡叠加层 */
.theme-transition-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(1px);
  z-index: 9999;
  pointer-events: none;
}

.theme-transition-overlay.dark {
  background-color: rgba(0, 0, 0, 0.15);
}

/* 过渡动画 */
.theme-overlay-enter-active,
.theme-overlay-leave-active {
  transition: opacity 0.3s var(--transition-function);
}

.theme-overlay-enter-from,
.theme-overlay-leave-to {
  opacity: 0;
}

.theme-overlay-enter-to,
.theme-overlay-leave-from {
  opacity: 1;
}
</style>
