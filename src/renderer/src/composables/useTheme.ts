import { ref, watch, onMounted } from 'vue'
import { useDark, useToggle } from '@vueuse/core'

export function useTheme() {
  // 使用VueUse的useDark和useToggle实现暗黑模式切换
  const isDark = useDark({
    selector: 'html',
    attribute: 'class',
    valueDark: 'dark',
    valueLight: 'light'
  })
  const toggleDark = useToggle(isDark)
  
  // 主题名称
  const themeName = ref(isDark.value ? '暗黑' : '明亮')
  
  // 监听主题变化
  watch(isDark, (newValue) => {
    themeName.value = newValue ? '暗黑' : '明亮'
    
    // 添加或移除暗黑模式class
    if (newValue) {
      document.documentElement.classList.add('dark')
      document.body.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.body.setAttribute('data-theme', 'light')
    }
    
    // 存储用户偏好
    localStorage.setItem('theme', newValue ? 'dark' : 'light')
  })
  
  // 初始化主题
  onMounted(() => {
    // 尝试从localStorage读取用户偏好
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      isDark.value = savedTheme === 'dark'
    } else {
      // 如果没有保存的偏好，使用系统偏好
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      isDark.value = prefersDark
    }
  })
  
  return {
    isDark,
    toggleDark,
    themeName
  }
} 