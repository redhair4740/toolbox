import { ref, watch, onMounted, nextTick } from 'vue'
import { useSettings } from './useSettings'

type ThemeType = 'light' | 'dark' | 'system'

/**
 * 主题管理组合式API
 * @returns 主题相关方法和状态
 */
export function useTheme() {
  const { settings } = useSettings()
  const currentTheme = ref<ThemeType>('light')
  
  // 应用主题到文档
  const applyTheme = async (theme: ThemeType) => {
    // 保存当前主题
    currentTheme.value = theme
    
    // 如果是系统主题，则检测系统偏好
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
    } else {
      // 直接设置指定主题
      document.documentElement.setAttribute('data-theme', theme)
    }
    
    // 等待下一个DOM更新周期，确保样式已应用
    await nextTick()
    
    // 强制重新计算样式
    document.body.style.display = 'none'
    // 触发重排
    void document.body.offsetHeight
    document.body.style.display = ''
    
    // 强制刷新所有Element Plus组件
    const styleSheets = document.styleSheets
    for (let i = 0; i < styleSheets.length; i++) {
      try {
        // 尝试访问规则以触发样式重新计算
        const rules = styleSheets[i].cssRules
        void rules.length
      } catch (e) {
        // 忽略跨域错误
      }
    }
    
    // 触发自定义事件，通知应用主题已更改
    document.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme } }))
  }
  
  // 监听系统主题变化
  const setupSystemThemeListener = () => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    // 当系统主题变化时更新
    const handleChange = () => {
      if (currentTheme.value === 'system') {
        document.documentElement.setAttribute(
          'data-theme', 
          mediaQuery.matches ? 'dark' : 'light'
        )
        
        // 触发自定义事件，通知应用主题已更改
        document.dispatchEvent(
          new CustomEvent('theme-changed', { 
            detail: { theme: mediaQuery.matches ? 'dark' : 'light' } 
          })
        )
      }
    }
    
    // 添加监听器
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
    } else {
      // 兼容旧版浏览器
      mediaQuery.addListener(handleChange)
    }
    
    // 返回清理函数
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange)
      } else {
        mediaQuery.removeListener(handleChange)
      }
    }
  }
  
  // 监听设置中的主题变化
  watch(() => settings.ui.theme, (newTheme) => {
    applyTheme(newTheme as ThemeType)
  })
  
  // 监听设置保存事件
  onMounted(() => {
    // 应用初始主题
    applyTheme(settings.ui.theme as ThemeType)
    
    // 设置系统主题监听
    setupSystemThemeListener()
    
    // 监听设置保存事件
    document.addEventListener('settings-saved', () => {
      applyTheme(settings.ui.theme as ThemeType)
    })
  })
  
  return {
    currentTheme,
    applyTheme
  }
} 