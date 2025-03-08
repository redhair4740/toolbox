import { ref, watch } from 'vue'

export function useFileTypes() {
  // 从localStorage获取保存的文件类型，如果没有则使用默认值
  const getSavedFileTypes = (): string[] => {
    const saved = localStorage.getItem('savedFileExtensions')
    return saved ? JSON.parse(saved) : ['.mkv', '.mp4', '.iso', '.avi', '.mpg']
  }

  const fileExtensions = ref<string[]>(getSavedFileTypes())

  // 监听文件类型变化并保存到localStorage
  watch(fileExtensions, (newValue) => {
    localStorage.setItem('savedFileExtensions', JSON.stringify(newValue))
  }, { deep: true })

  const fileTypeOptions = [
    { value: '.txt', label: 'txt' },
    { value: '.mkv', label: 'mkv' },
    { value: '.mp4', label: 'mp4' },
    { value: '.iso', label: 'iso' },
    { value: '.avi', label: 'avi' },
    { value: '.mpg', label: 'mpg' },
    { value: '.ass', label: 'ass' },
    { value: '.jpg', label: 'jpg' },
    { value: '.png', label: 'png' },
    { value: '.zip', label: 'zip' }
  ]

  return {
    fileExtensions,
    fileTypeOptions
  }
}
