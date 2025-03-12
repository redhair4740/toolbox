import * as fs from 'fs'
import path from 'node:path'
import { FileWithFullPath, RenameOptions, RenameResponse } from '../../types/file-types'
import { logAndFormatError, createResponse } from '../utils/error-handler'

/**
 * 递归搜索目录
 * @param currentDir 当前目录
 * @param extensions 文件扩展名数组
 * @param files 文件列表
 * @param processedCount 已处理文件计数
 * @param totalItems 总文件数
 * @param progressCallback 进度回调函数
 */
async function searchDirectory(
  currentDir: string,
  extensions: string[],
  files: FileWithFullPath[],
  processedCount: { value: number },
  totalItems: { value: number },
  progressCallback?: (current: number, total: number, file: string) => void
): Promise<void> {
  const items = await fs.promises.readdir(currentDir, { withFileTypes: true })
  totalItems.value += items.length - 1 // 更新总数（-1是因为已经计算了当前目录）
  
  // 分批处理文件夹内容
  const batchSize = 100
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    
    // 并行处理每个批次
    await Promise.all(
      batch.map(async (item) => {
        const fullPath = path.join(currentDir, item.name)
        processedCount.value++
        
        // 报告进度
        if (progressCallback) {
          progressCallback(processedCount.value, totalItems.value, fullPath)
        }
        
        if (item.isDirectory()) {
          // 递归搜索子目录
          await searchDirectory(fullPath, extensions, files, processedCount, totalItems, progressCallback)
        } else if (item.isFile()) {
          const ext = path.extname(item.name).toLowerCase()
          // 如果扩展名在过滤列表中或者没有指定过滤
          if (extensions.length === 0 || extensions.includes(ext)) {
            files.push({
              fullPath,
              fileName: item.name,
              targetPath: '' // 这将在UI层设置
            })
          }
        }
      })
    )
    
    // 每批次处理后暂停一下，避免阻塞主线程
    await new Promise(resolve => setTimeout(resolve, 0))
  }
}

/**
 * 搜索指定目录下符合扩展名条件的文件
 * @param dir 要搜索的目录
 * @param extensions 文件扩展名数组
 * @param progressCallback 进度回调函数
 * @returns 符合条件的文件列表
 */
export async function searchFiles(
  dir: string, 
  extensions: string[],
  progressCallback?: (current: number, total: number, file: string) => void
): Promise<FileWithFullPath[]> {
  try {
    const files: FileWithFullPath[] = []
    const processedCount = { value: 0 }
    const totalItems = { value: 1 } // 初始值为1，表示根目录
    
    await searchDirectory(dir, extensions, files, processedCount, totalItems, progressCallback)
    return files
  } catch (error) {
    logAndFormatError(error, 'searchFiles')
    return []
  }
}

/**
 * 在文件内容中搜索文本
 * @param filePath 文件路径
 * @param searchText 搜索文本
 * @param ignoreCase 是否忽略大小写
 * @returns 匹配结果
 */
async function searchInFile(
  filePath: string, 
  searchText: string, 
  ignoreCase: boolean
): Promise<{ found: boolean; matches: string[]; lineNumbers: number[] }> {
  try {
    // 检查文件大小，避免处理过大的文件
    const stats = await fs.promises.stat(filePath)
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    
    if (stats.size > MAX_FILE_SIZE) {
      return { found: false, matches: [], lineNumbers: [] }
    }
    
    // 读取文件内容
    const content = await fs.promises.readFile(filePath, 'utf-8')
    const lines = content.split(/\r?\n/)
    const matches: string[] = []
    const lineNumbers: number[] = []
    
    // 创建正则表达式
    const flags = ignoreCase ? 'gi' : 'g'
    const regex = new RegExp(searchText, flags)
    
    // 搜索每一行
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (regex.test(line)) {
        matches.push(line.trim())
        lineNumbers.push(i + 1) // 行号从1开始
        
        // 重置正则表达式的lastIndex
        regex.lastIndex = 0
      }
    }
    
    return {
      found: matches.length > 0,
      matches,
      lineNumbers
    }
  } catch (error) {
    logAndFormatError(error, 'searchInFile')
    return { found: false, matches: [], lineNumbers: [] }
  }
}

/**
 * 在文件内容中搜索文本
 * @param files 文件列表
 * @param searchText 搜索文本
 * @param ignoreCase 是否忽略大小写
 * @param progressCallback 进度回调函数
 * @returns 搜索结果
 */
export async function searchInFiles(
  files: string[],
  searchText: string,
  ignoreCase: boolean = false,
  progressCallback?: (current: number, total: number, file: string) => void
): Promise<Array<{
  filePath: string;
  fileName: string;
  matches: string[];
  lineNumbers: number[];
}>> {
  const results: Array<{
    filePath: string;
    fileName: string;
    matches: string[];
    lineNumbers: number[];
  }> = []
  
  const total = files.length
  
  // 分批处理文件
  const batchSize = 10
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize)
    
    // 并行处理每个批次
    const batchResults = await Promise.all(
      batch.map(async (filePath, index) => {
        try {
          const fileName = path.basename(filePath)
          
          // 报告进度
          if (progressCallback) {
            progressCallback(i + index + 1, total, fileName)
          }
          
          const result = await searchInFile(filePath, searchText, ignoreCase)
          
          if (result.found) {
            return {
              filePath,
              fileName,
              matches: result.matches,
              lineNumbers: result.lineNumbers
            }
          }
          
          return null
        } catch (error) {
          logAndFormatError(error, 'searchInFiles')
          return null
        }
      })
    )
    
    // 过滤掉null结果并添加到结果列表
    results.push(...batchResults.filter(Boolean) as Array<{
      filePath: string;
      fileName: string;
      matches: string[];
      lineNumbers: number[];
    }>)
    
    // 每批次处理后暂停一下，避免阻塞主线程
    await new Promise(resolve => setTimeout(resolve, 0))
  }
  
  return results
}

/**
 * 将文件从源路径剪切到目标路径
 * @param source 源文件路径
 * @param destination 目标目录
 * @param fileName 文件名
 * @returns 目标文件路径
 */
export async function cutFileToDirectory(
  source: string,
  destination: string,
  fileName: string
): Promise<string> {
  try {
    const destPath = path.join(destination, fileName)
    await fs.promises.mkdir(path.dirname(destPath), { recursive: true })
    await fs.promises.copyFile(source, destPath)
    await fs.promises.unlink(source)
    return destPath
  } catch (error) {
    const errorMessage = logAndFormatError(error, 'cutFileToDirectory')
    throw new Error(errorMessage)
  }
}

/**
 * 从错误对象中提取错误消息
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

/**
 * 批量移动文件
 * @param files 要移动的文件列表
 * @param destination 目标目录
 * @param progressCallback 进度回调函数
 * @returns 操作结果
 */
export async function batchMoveFiles(
  files: { source: string; fileName: string }[],
  destination: string,
  progressCallback?: (current: number, total: number, file: string) => void
): Promise<{ success: number; failed: number; errors: string[] }> {
  const total = files.length
  let success = 0
  let failed = 0
  const errors: string[] = []
  
  // 分批处理文件
  const batchSize = 10
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize)
    
    // 并行处理每个批次
    await Promise.all(
      batch.map(async (file, index) => {
        try {
          await cutFileToDirectory(file.source, destination, file.fileName)
          success++
          
          // 报告进度
          if (progressCallback) {
            progressCallback(i + index + 1, total, file.fileName)
          }
        } catch (error) {
          failed++
          const errorMessage = getErrorMessage(error)
          errors.push(`${file.fileName}: ${errorMessage}`)
          
          // 报告进度（即使失败）
          if (progressCallback) {
            progressCallback(i + index + 1, total, file.fileName)
          }
        }
      })
    )
    
    // 每批次处理后暂停一下，避免阻塞主线程
    await new Promise(resolve => setTimeout(resolve, 0))
  }
  
  return { success, failed, errors }
}

/**
 * 重命名文件
 * @param filePath 文件路径
 * @param searchText 要替换的文本
 * @param replaceText 替换为的文本
 * @param options 选项（忽略大小写、大小写转换）
 * @returns 操作结果
 */
export async function renameFile(
  filePath: string,
  searchText: string,
  replaceText: string,
  options: RenameOptions = { ignoreCase: false, caseConversion: 'none' }
): Promise<RenameResponse> {
  try {
    const dir = path.dirname(filePath)
    const fileName = path.basename(filePath)
    const ignoreCase = options.ignoreCase || false
    const caseConversion = options.caseConversion || 'none'
    
    let newFileName = fileName
    
    // 如果有搜索文本，先进行替换
    if (searchText) {
      // 创建正则表达式，根据是否忽略大小写设置标志
      const flags = ignoreCase ? 'gi' : 'g'
      const regex = new RegExp(searchText, flags)
      
      // 检查文件名是否包含搜索文本（考虑大小写设置）
      if (!regex.test(fileName)) {
        return createResponse(false, '文件名中不包含搜索文本') as RenameResponse
      }
      
      // 替换文本
      newFileName = fileName.replace(regex, replaceText)
    }
    
    // 根据大小写转换选项处理文件名，但保留文件扩展名
    if (caseConversion !== 'none') {
      const ext = path.extname(newFileName)
      const nameWithoutExt = path.basename(newFileName, ext)
      
      if (caseConversion === 'uppercase') {
        newFileName = nameWithoutExt.toUpperCase() + ext
      } else if (caseConversion === 'lowercase') {
        newFileName = nameWithoutExt.toLowerCase() + ext
      }
    }
    
    // 如果没有变化，返回成功状态但不执行重命名
    if (newFileName === fileName) {
      return createResponse(true, '文件名没有变化，无需重命名') as RenameResponse
    }
    
    const newPath = path.join(dir, newFileName)
    
    await fs.promises.rename(filePath, newPath)
    
    return {
      success: true,
      message: '文件重命名成功',
      newPath
    }
  } catch (error) {
    const errorMessage = logAndFormatError(error, 'renameFile')
    return createResponse(false, `重命名失败: ${errorMessage}`) as RenameResponse
  }
}

/**
 * 批量重命名文件
 * @param files 要重命名的文件列表
 * @param searchText 要替换的文本
 * @param replaceText 替换为的文本
 * @param options 选项（忽略大小写、大小写转换）
 * @param progressCallback 进度回调函数
 * @returns 操作结果
 */
export async function batchRenameFiles(
  files: string[],
  searchText: string,
  replaceText: string,
  options: RenameOptions = { ignoreCase: false, caseConversion: 'none' },
  progressCallback?: (current: number, total: number, file: string) => void
): Promise<{ success: number; failed: number; errors: string[] }> {
  const total = files.length
  let success = 0
  let failed = 0
  const errors: string[] = []
  
  // 分批处理文件
  const batchSize = 10
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize)
    
    // 并行处理每个批次
    await Promise.all(
      batch.map(async (filePath, index) => {
        try {
          const result = await renameFile(filePath, searchText, replaceText, options)
          
          if (result.success) {
            success++
          } else {
            failed++
            errors.push(`${path.basename(filePath)}: ${result.message}`)
          }
          
          // 报告进度
          if (progressCallback) {
            progressCallback(i + index + 1, total, path.basename(filePath))
          }
        } catch (error) {
          failed++
          const errorMessage = getErrorMessage(error)
          errors.push(`${path.basename(filePath)}: ${errorMessage}`)
          
          // 报告进度（即使失败）
          if (progressCallback) {
            progressCallback(i + index + 1, total, path.basename(filePath))
          }
        }
      })
    )
    
    // 每批次处理后暂停一下，避免阻塞主线程
    await new Promise(resolve => setTimeout(resolve, 0))
  }
  
  return { success, failed, errors }
} 