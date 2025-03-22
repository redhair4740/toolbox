import { ref, watch } from 'vue'

// 主题类型
type ThemeMode = 'light' | 'dark' | 'system'

// 创建一个全局的主题状态
const currentTheme = ref<ThemeMode>('system')
const appliedTheme = ref<'light' | 'dark'>('light')

export function useTheme() {
  // 初始化主题
  const initTheme = () => {
    // 从本地存储加载主题设置
    const savedTheme = localStorage.getItem('theme_mode') as ThemeMode
    if (savedTheme) {
      currentTheme.value = savedTheme
    }

    // 应用主题
    applyTheme()

    // 监听系统主题变化
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      
      // 初始检查
      if (currentTheme.value === 'system') {
        appliedTheme.value = mediaQuery.matches ? 'dark' : 'light'
      }
      
      // 添加监听器
      mediaQuery.addEventListener('change', event => {
        if (currentTheme.value === 'system') {
          appliedTheme.value = event.matches ? 'dark' : 'light'
          document.documentElement.setAttribute('data-theme', appliedTheme.value)
        }
      })
    }
  }

  // 设置主题
  const setTheme = (theme: ThemeMode) => {
    if (theme !== currentTheme.value) {
      currentTheme.value = theme
      localStorage.setItem('theme_mode', theme)
      applyTheme()
    }
  }
  
  // 更新主题 - 适配设置组件
  const updateTheme = (theme: string) => {
    if (theme === 'light' || theme === 'dark' || theme === 'system') {
      // 更新当前主题
      currentTheme.value = theme as ThemeMode
      // 存储到localStorage
      localStorage.setItem('theme_mode', theme)
      // 应用主题
      applyTheme()
    }
  }

  // 应用主题
  const applyTheme = () => {
    let theme: 'light' | 'dark'

    if (currentTheme.value === 'system') {
      // 检测系统主题
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        theme = 'dark'
      } else {
        theme = 'light'
      }
    } else {
      theme = currentTheme.value
    }

    // 更新应用的主题
    appliedTheme.value = theme

    // 设置文档根元素的主题属性
    document.documentElement.setAttribute('data-theme', theme)

    // 更新 Element Plus 主题
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // 切换主题
  const toggleTheme = () => {
    if (currentTheme.value === 'light') {
      setTheme('dark')
    } else if (currentTheme.value === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  // 检查是否是暗色主题
  const isDarkTheme = () => {
    return appliedTheme.value === 'dark'
  }

  // 获取主题名称
  const getThemeName = () => {
    const names = {
      light: '浅色',
      dark: '深色',
      system: '跟随系统'
    }
    return names[currentTheme.value]
  }

  // 监听主题变化
  watch(currentTheme, () => {
    applyTheme()
  })

  // 初始化
  initTheme()

  return {
    currentTheme,
    appliedTheme,
    setTheme,
    updateTheme,
    toggleTheme,
    isDarkTheme,
    getThemeName
  }
}