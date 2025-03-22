import { ref } from 'vue'

// 最大记录数
const MAX_RECENT_PATHS = 20

// 创建一个全局的最近路径存储
const recentPaths = ref<string[]>([])

export function useRecentPaths() {
  // 添加路径
  const addRecentPath = (path: string) => {
    // 移除已存在的相同路径
    const index = recentPaths.value.indexOf(path)
    if (index !== -1) {
      recentPaths.value.splice(index, 1)
    }

    // 添加到开头
    recentPaths.value.unshift(path)

    // 限制数量
    if (recentPaths.value.length > MAX_RECENT_PATHS) {
      recentPaths.value = recentPaths.value.slice(0, MAX_RECENT_PATHS)
    }

    // 保存到本地存储
    saveToStorage()
  }

  // 移除路径
  const removeRecentPath = (path: string) => {
    const index = recentPaths.value.indexOf(path)
    if (index !== -1) {
      recentPaths.value.splice(index, 1)
      saveToStorage()
    }
  }

  // 清空所有路径
  const clearRecentPaths = () => {
    recentPaths.value = []
    saveToStorage()
  }

  // 获取最近使用的路径
  const getMostRecentPath = () => {
    return recentPaths.value[0]
  }

  // 检查路径是否存在
  const hasRecentPath = (path: string) => {
    return recentPaths.value.includes(path)
  }

  // 获取最近路径列表
  const getRecentPaths = () => {
    return recentPaths.value
  }

  // 保存到本地存储
  const saveToStorage = () => {
    try {
      localStorage.setItem('recent_paths', JSON.stringify(recentPaths.value))
    } catch (error) {
      console.error('Failed to save recent paths to storage:', error)
    }
  }

  // 从本地存储加载
  const loadFromStorage = () => {
    try {
      const savedPaths = localStorage.getItem('recent_paths')
      if (savedPaths) {
        recentPaths.value = JSON.parse(savedPaths)
      }
    } catch (error) {
      console.error('Failed to load recent paths from storage:', error)
    }
  }

  // 初始化时加载
  loadFromStorage()

  return {
    recentPaths,
    addRecentPath,
    removeRecentPath,
    clearRecentPaths,
    getMostRecentPath,
    hasRecentPath,
    getRecentPaths
  }
}