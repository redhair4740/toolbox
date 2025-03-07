/**
 * 文件操作相关的工具函数
 */

export interface FileWithPath {
  fullPath: string
  fileName: string
  targetPath: string
}

/**
 * 默认支持的文件扩展名
 */
export const DEFAULT_FILE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.mp4',
  '.mp3',
  '.txt',
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx'
]

/**
 * 根据文件路径获取文件扩展名
 */
export function getFileExtension(filePath: string): string {
  if (!filePath) return ''
  const match = filePath.match(/\.[^.]+$/)
  return match ? match[0].toLowerCase() : ''
}

/**
 * 获取人类可读的文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`
}

/**
 * 判断文件是否为图片
 */
export function isImageFile(fileName: string): boolean {
  const ext = getFileExtension(fileName)
  return ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'].includes(ext)
}

/**
 * 判断文件是否为视频
 */
export function isVideoFile(fileName: string): boolean {
  const ext = getFileExtension(fileName)
  return ['.mp4', '.avi', '.mov', '.wmv', '.mkv', '.webm'].includes(ext)
}

/**
 * 获取文件的基本名称（不含扩展名）
 */
export function getBaseName(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.')
  return lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName
}

/**
 * 安全地解析文件路径（跨平台兼容）
 */
export function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/')
} 