import { ref } from 'vue'

export function useFileTypes() {
  const fileExtensions = ref<string[]>(['.mkv', '.mp4', '.iso', '.avi', '.mpg'])

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
