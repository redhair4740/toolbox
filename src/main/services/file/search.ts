import * as fs from 'fs'
import path from 'node:path'
import { FileWithFullPath } from '../../../types/file-types'
import { logAndFormatError } from '../../utils/error-handler'

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
  try {
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
                targetPath: ''
              })
            }
          }
        })
      )
    }
  } catch (error) {
    console.error(`搜索目录 ${currentDir} 时出错:`, error)
  }
}

/**
 * 搜索指定目录下的文件
 * @param dir 目录路径
 * @param extensions 文件扩展名数组
 * @param progressCallback 进度回调函数
 * @returns 文件列表
 */
export async function searchFiles(
  dir: string, 
  extensions: string[],
  progressCallback?: (current: number, total: number, file: string) => void
): Promise<FileWithFullPath[]> {
  try {
    const normalizedExtensions = extensions.map(e => e.startsWith('.') ? e.toLowerCase() : `.${e.toLowerCase()}`)
    const files: FileWithFullPath[] = []
    const processedCount = { value: 0 }
    const totalItems = { value: 1 } // 初始值为1表示开始处理根目录
    
    await searchDirectory(dir, normalizedExtensions, files, processedCount, totalItems, progressCallback)
    
    return files
  } catch (error) {
    const errMsg = logAndFormatError(error, '搜索文件时出错')
    throw new Error(errMsg)
  }
}

/**
 * 搜索单个文件中的内容
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
    const content = await fs.promises.readFile(filePath, 'utf-8')
    const lines = content.split(/\r?\n/)
    const matches: string[] = []
    const lineNumbers: number[] = []
    
    const searchTerm = ignoreCase ? searchText.toLowerCase() : searchText

    lines.forEach((line, index) => {
      const lineToSearch = ignoreCase ? line.toLowerCase() : line
      if (lineToSearch.includes(searchTerm)) {
        matches.push(line.trim())
        lineNumbers.push(index + 1) // 行号从1开始
      }
    })
    
    return {
      found: matches.length > 0,
      matches,
      lineNumbers
    }
  } catch (error) {
    console.error(`搜索文件 ${filePath} 内容时出错:`, error)
    return {
      found: false,
      matches: [],
      lineNumbers: []
    }
  }
}

/**
 * 在多个文件中搜索内容
 * @param files 文件路径数组
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
  try {
    const results: Array<{
      filePath: string;
      fileName: string;
      matches: string[];
      lineNumbers: number[];
    }> = []
    
    const batchSize = 20
    const total = files.length
    
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize)
      
      const batchResults = await Promise.all(
        batch.map(async (filePath, index) => {
          const current = i + index + 1
          
          if (progressCallback) {
            progressCallback(current, total, filePath)
          }
          
          try {
            const { found, matches, lineNumbers } = await searchInFile(filePath, searchText, ignoreCase)
            
            if (found) {
              return {
                filePath,
                fileName: path.basename(filePath),
                matches,
                lineNumbers
              }
            }
            
            return null
          } catch (error) {
            console.error(`搜索文件 ${filePath} 时出错:`, error)
            return null
          }
        })
      )
      
      batchResults
        .filter((result): result is NonNullable<typeof result> => result !== null)
        .forEach(result => results.push(result))
    }
    
    return results
  } catch (error) {
    const errMsg = logAndFormatError(error, '搜索文件内容时出错')
    throw new Error(errMsg)
  }
} 