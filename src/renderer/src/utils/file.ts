import path from 'path-browserify'

/**
 * 获取文件扩展名
 * @param filename 文件名
 * @returns 文件扩展名（不包含点号）
 */
export function getFileExtension(filename: string): string {
  return path.extname(filename).slice(1).toLowerCase()
}

/**
 * 获取不带扩展名的文件名
 * @param filename 文件名
 * @returns 不带扩展名的文件名
 */
export function getFileNameWithoutExtension(filename: string): string {
  const ext = path.extname(filename)
  return path.basename(filename, ext)
}

/**
 * 获取文件名
 * @param filepath 文件路径
 * @returns 文件名（包含扩展名）
 */
export function getFileName(filepath: string): string {
  return path.basename(filepath)
}

/**
 * 获取目录路径
 * @param filepath 文件路径
 * @returns 目录路径
 */
export function getDirectoryPath(filepath: string): string {
  return path.dirname(filepath)
}

/**
 * 格式化文件大小
 * @param bytes 文件大小（字节）
 * @param decimals 小数位数
 * @returns 格式化后的文件大小
 */
export function formatFileSize(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * 格式化日期时间
 * @param timestamp 时间戳
 * @returns 格式化后的日期时间
 */
export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleString()
}

/**
 * 生成唯一文件名
 * @param filename 原始文件名
 * @returns 唯一文件名
 */
export function generateUniqueFilename(filename: string): string {
  const name = getFileNameWithoutExtension(filename)
  const ext = getFileExtension(filename)
  const timestamp = Date.now()
  return ext ? `${name}_${timestamp}.${ext}` : `${name}_${timestamp}`
}

/**
 * 生成文件重命名预览
 * @param filename 原始文件名
 * @param pattern 重命名模式
 * @param index 文件索引
 * @param preserveExtension 是否保留扩展名
 * @returns 重命名后的文件名
 */
export function generateRenamePreview(
  filename: string,
  pattern: string,
  index = 0,
  preserveExtension = true
): string {
  // 获取文件名和扩展名
  const name = getFileNameWithoutExtension(filename)
  const ext = getFileExtension(filename)
  
  // 替换模式中的占位符
  let newName = pattern
    .replace(/\{name\}/g, name)
    .replace(/\{ext\}/g, ext)
    .replace(/\{index\}/g, index.toString())
    .replace(/\{index:(\d+)\}/g, (_, padding) => {
      return index.toString().padStart(parseInt(padding), '0')
    })
    .replace(/\{date:([^}]+)\}/g, (_, format) => {
      const date = new Date()
      // 简单的日期格式化
      return format
        .replace('YYYY', date.getFullYear().toString())
        .replace('MM', (date.getMonth() + 1).toString().padStart(2, '0'))
        .replace('DD', date.getDate().toString().padStart(2, '0'))
        .replace('HH', date.getHours().toString().padStart(2, '0'))
        .replace('mm', date.getMinutes().toString().padStart(2, '0'))
        .replace('ss', date.getSeconds().toString().padStart(2, '0'))
    })
  
  // 如果需要保留扩展名
  if (preserveExtension && ext) {
    newName = `${newName}.${ext}`
  }
  
  return newName
}

/**
 * 检查文件名是否有效
 * @param filename 文件名
 * @returns 是否有效
 */
export function isValidFilename(filename: string): boolean {
  // 检查文件名是否为空
  if (!filename || filename.trim() === '') {
    return false
  }
  
  // 检查文件名是否包含无效字符
  const invalidChars = /[<>:"/\\|?*\x00-\x1F]/g
  if (invalidChars.test(filename)) {
    return false
  }
  
  // 检查文件名是否以点或空格开头或结尾
  if (filename.startsWith('.') || filename.startsWith(' ') || 
      filename.endsWith('.') || filename.endsWith(' ')) {
    return false
  }
  
  // 检查文件名是否为保留名称
  const reservedNames = [
    'CON', 'PRN', 'AUX', 'NUL',
    'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
    'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
  ]
  
  const nameWithoutExt = getFileNameWithoutExtension(filename).toUpperCase()
  if (reservedNames.includes(nameWithoutExt)) {
    return false
  }
  
  return true
}

/**
 * 解析文件路径
 * @param filepath 文件路径
 * @returns 解析后的路径
 */
export function normalizePath(filepath: string): string {
  // 替换反斜杠为正斜杠
  return filepath.replace(/\\/g, '/')
}

/**
 * 判断是否是图片文件
 * @param filename 文件名
 * @returns 是否是图片
 */
export function isImageFile(filename: string): boolean {
  const ext = getFileExtension(filename).toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)
}

/**
 * 判断是否是视频文件
 * @param filename 文件名
 * @returns 是否是视频
 */
export function isVideoFile(filename: string): boolean {
  const ext = getFileExtension(filename).toLowerCase()
  return ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'].includes(ext)
}

/**
 * 判断是否是音频文件
 * @param filename 文件名
 * @returns 是否是音频
 */
export function isAudioFile(filename: string): boolean {
  const ext = getFileExtension(filename).toLowerCase()
  return ['mp3', 'wav', 'ogg', 'aac', 'wma', 'm4a', 'flac'].includes(ext)
}

/**
 * 判断是否是文本文件
 * @param filename 文件名
 * @returns 是否是文本文件
 */
export function isTextFile(filename: string): boolean {
  const ext = getFileExtension(filename).toLowerCase()
  return [
    'txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts', 
    'jsx', 'tsx', 'vue', 'py', 'java', 'c', 'cpp', 'cs', 
    'php', 'rb', 'go', 'yml', 'yaml', 'toml', 'ini', 'conf'
  ].includes(ext)
}

/**
 * 创建文件对象URL
 * @param blob 文件Blob对象
 * @returns 文件URL
 */
export function createObjectURL(blob: Blob): string {
  return URL.createObjectURL(blob)
}

/**
 * 释放文件对象URL
 * @param url 文件URL
 */
export function revokeObjectURL(url: string): void {
  URL.revokeObjectURL(url)
}

/**
 * 下载文件
 * @param blob 文件Blob对象
 * @param filename 文件名
 */
export function downloadFile(blob: Blob, filename: string): void {
  const url = createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  revokeObjectURL(url)
}

/**
 * 读取文本文件
 * @param file 文件对象
 * @returns Promise<文件内容>
 */
export function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

/**
 * 读取二进制文件
 * @param file 文件对象
 * @returns Promise<ArrayBuffer>
 */
export function readBinaryFile(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

/**
 * 获取相对路径
 * @param from 起始路径
 * @param to 目标路径
 * @returns 相对路径
 */
export function getRelativePath(from: string, to: string): string {
  return path.relative(from, to)
}

/**
 * 连接路径
 * @param paths 路径片段
 * @returns 连接后的路径
 */
export function joinPaths(...paths: string[]): string {
  return path.join(...paths)
}