import { ref } from 'vue'

// 最大记录数
const MAX_RECENT_PATHS = 20

// 创建按类别存储的路径历史
const categorizedRecentPaths = ref<Record<string, string[]>>({})

export function useRecentPaths(category: string = 'default') {
  // 从本地存储加载
  const loadFromStorage = (cat: string) => {
    try {
      const savedPaths = localStorage.getItem(`recent_paths_${cat}`)
      if (savedPaths) {
        categorizedRecentPaths.value[cat] = JSON.parse(savedPaths)
      }
    } catch (error) {
      console.error(`Failed to load recent paths for category ${cat} from storage:`, error)
    }
  }

  // 确保该类别存在
  if (!categorizedRecentPaths.value[category]) {
    categorizedRecentPaths.value[category] = []
    // 从本地存储尝试加载该类别
    loadFromStorage(category)
  }

  // 保存到本地存储
  const saveToStorage = (cat: string) => {
    try {
      localStorage.setItem(`recent_paths_${cat}`, JSON.stringify(categorizedRecentPaths.value[cat]))
    } catch (error) {
      console.error(`Failed to save recent paths for category ${cat} to storage:`, error)
    }
  }

  // 添加路径
  const addRecentPath = (path: string) => {
    if (!path) return
    
    // 移除已存在的相同路径
    const paths = categorizedRecentPaths.value[category]
    const index = paths.indexOf(path)
    if (index !== -1) {
      paths.splice(index, 1)
    }

    // 添加到开头
    paths.unshift(path)

    // 限制数量
    if (paths.length > MAX_RECENT_PATHS) {
      categorizedRecentPaths.value[category] = paths.slice(0, MAX_RECENT_PATHS)
    }

    // 保存到本地存储
    saveToStorage(category)
  }

  // 移除路径
  const removeRecentPath = (path: string) => {
    const paths = categorizedRecentPaths.value[category]
    const index = paths.indexOf(path)
    if (index !== -1) {
      paths.splice(index, 1)
      saveToStorage(category)
    }
  }

  // 清空所有路径
  const clearRecentPaths = () => {
    categorizedRecentPaths.value[category] = []
    saveToStorage(category)
  }

  // 获取最近使用的路径
  const getMostRecentPath = () => {
    return categorizedRecentPaths.value[category][0]
  }

  // 检查路径是否存在
  const hasRecentPath = (path: string) => {
    return categorizedRecentPaths.value[category].includes(path)
  }

  // 获取最近路径列表
  const getRecentPaths = () => {
    return categorizedRecentPaths.value[category]
  }

  // 计算属性：获取当前类别的路径
  const recentPaths = ref(categorizedRecentPaths.value[category] || [])

  // 当类别路径发生变化时更新recentPaths
  const updateRecentPaths = () => {
    recentPaths.value = categorizedRecentPaths.value[category] || []
  }

  // 监听路径变化
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === `recent_paths_${category}`) {
        loadFromStorage(category)
        updateRecentPaths()
      }
    })
  }

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