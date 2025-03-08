import { ref, watch } from 'vue'

/**
 * 最近路径管理组合式API
 * @param storageKey 存储键名
 * @param maxCount 最大保存数量
 * @returns 最近路径相关方法和状态
 */
export function useRecentPaths(storageKey: string, maxCount = 5) {
  // 从localStorage获取保存的路径
  const getSavedPaths = (): string[] => {
    const saved = localStorage.getItem(storageKey)
    return saved ? JSON.parse(saved) : []
  }

  const recentPaths = ref<string[]>(getSavedPaths())

  // 监听路径变化并保存到localStorage
  watch(recentPaths, (newValue) => {
    localStorage.setItem(storageKey, JSON.stringify(newValue))
  }, { deep: true })

  /**
   * 添加路径到最近列表
   * @param path 路径
   */
  const addPath = (path: string) => {
    if (!path) return
    
    // 如果已存在，先移除
    const index = recentPaths.value.indexOf(path)
    if (index !== -1) {
      recentPaths.value.splice(index, 1)
    }
    
    // 添加到最前面
    recentPaths.value.unshift(path)
    
    // 保持最大数量
    if (recentPaths.value.length > maxCount) {
      recentPaths.value = recentPaths.value.slice(0, maxCount)
    }
  }

  /**
   * 移除路径
   * @param path 路径
   */
  const removePath = (path: string) => {
    const index = recentPaths.value.indexOf(path)
    if (index !== -1) {
      recentPaths.value.splice(index, 1)
    }
  }

  /**
   * 清空路径列表
   */
  const clearPaths = () => {
    recentPaths.value = []
  }

  return {
    recentPaths,
    addPath,
    removePath,
    clearPaths
  }
} 