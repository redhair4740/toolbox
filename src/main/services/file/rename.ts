import * as fs from 'fs'
import path from 'node:path'
import { RenameOptions, RenameResponse } from '../../../types/file-types'
import { logAndFormatError } from '../../utils/error-handler'

/**
 * 重命名文件
 * @param filePath 文件路径
 * @param searchText 搜索文本
 * @param replaceText 替换文本
 * @param options 重命名选项
 * @returns 重命名结果
 */
export async function renameFile(
  filePath: string,
  searchText: string,
  replaceText: string,
  options: RenameOptions = { ignoreCase: false, caseConversion: 'none' }
): Promise<RenameResponse> {
  try {
    const dirPath = path.dirname(filePath)
    const fileName = path.basename(filePath)
    let newFileName = fileName
    
    // 应用搜索和替换
    if (searchText) {
      const regex = options.ignoreCase
        ? new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
        : new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
      
      newFileName = fileName.replace(regex, replaceText)
    }
    
    // 应用大小写转换
    if (options.caseConversion !== 'none') {
      switch (options.caseConversion) {
        case 'uppercase':
          newFileName = newFileName.toUpperCase()
          break
        case 'lowercase':
          newFileName = newFileName.toLowerCase()
          break
        case 'capitalize':
          newFileName = newFileName
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ')
          break
      }
    }
    
    // 如果文件名没有变化，则不进行重命名
    if (newFileName === fileName) {
      return {
        success: true,
        oldPath: filePath,
        newPath: filePath,
        fileName: newFileName,
        renamed: false,
        message: '文件名未改变'
      }
    }
    
    // 构建新的文件路径
    const newPath = path.join(dirPath, newFileName)
    
    // 检查目标文件是否已存在
    try {
      await fs.promises.access(newPath)
      return {
        success: false,
        oldPath: filePath,
        newPath: '',
        fileName: '',
        renamed: false,
        message: `目标文件已存在: ${newFileName}`
      }
    } catch {
      // 文件不存在，可以安全重命名
    }
    
    // 重命名文件
    await fs.promises.rename(filePath, newPath)
    
    return {
      success: true,
      oldPath: filePath,
      newPath,
      fileName: newFileName,
      renamed: true,
      message: '文件已重命名'
    }
  } catch (error) {
    const errMsg = logAndFormatError(error, `重命名文件 ${filePath} 失败`)
    return {
      success: false,
      oldPath: filePath,
      newPath: '',
      fileName: '',
      renamed: false,
      message: errMsg
    }
  }
}

/**
 * 批量重命名文件
 * @param files 文件路径数组
 * @param searchText 搜索文本
 * @param replaceText 替换文本
 * @param options 重命名选项
 * @param progressCallback 进度回调
 * @returns 操作结果
 */
export async function batchRenameFiles(
  files: string[],
  searchText: string,
  replaceText: string,
  options: RenameOptions = { ignoreCase: false, caseConversion: 'none' },
  progressCallback?: (current: number, total: number, file: string) => void
): Promise<{ success: number; failed: number; errors: string[] }> {
  try {
    let successCount = 0
    let failedCount = 0
    const errors: string[] = []
    const total = files.length
    
    // 分批处理文件
    const batchSize = 20
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize)
      
      // 使用 Promise.allSettled 允许部分文件失败但继续处理其他文件
      const batchResults = await Promise.allSettled(
        batch.map(async (filePath, index) => {
          const current = i + index + 1
          
          if (progressCallback) {
            progressCallback(current, total, filePath)
          }
          
          try {
            const result = await renameFile(filePath, searchText, replaceText, options)
            return result.success
          } catch (error) {
            const errMsg = `重命名文件 ${filePath} 失败: ${error instanceof Error ? error.message : '未知错误'}`
            console.error(errMsg)
            errors.push(errMsg)
            throw error
          }
        })
      )
      
      // 统计成功和失败的数量
      successCount += batchResults.filter(r => r.status === 'fulfilled' && r.value).length
      failedCount += batchResults.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value)).length
    }
    
    return {
      success: successCount,
      failed: failedCount,
      errors
    }
  } catch (error) {
    const errMsg = logAndFormatError(error, '批量重命名文件失败')
    return {
      success: 0,
      failed: files.length,
      errors: [errMsg]
    }
  }
} 