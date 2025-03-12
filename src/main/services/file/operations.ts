import * as fs from 'fs'
import path from 'node:path'
import { logAndFormatError } from '../../utils/error-handler'

/**
 * 获取错误消息
 * @param error 错误对象
 * @returns 格式化的错误消息
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  } else if (typeof error === 'string') {
    return error
  } else {
    return '未知错误'
  }
}

/**
 * 将文件从源路径剪切到目标目录
 * @param source 源文件路径
 * @param destination 目标目录路径
 * @param fileName 文件名
 * @returns 新的文件路径
 */
export async function cutFileToDirectory(
  source: string,
  destination: string,
  fileName: string
): Promise<string> {
  try {
    // 确保目标目录存在
    await fs.promises.mkdir(destination, { recursive: true })
    
    // 构建目标文件路径
    const targetPath = path.join(destination, fileName)
    
    // 移动文件
    await fs.promises.rename(source, targetPath)
    
    return targetPath
  } catch (error) {
    const errMsg = logAndFormatError(error, `移动文件 ${source} 到 ${destination} 失败`)
    throw new Error(errMsg)
  }
}

/**
 * 批量移动文件
 * @param files 文件信息数组 (源路径和文件名)
 * @param destination 目标目录
 * @param progressCallback 进度回调
 * @returns 操作结果
 */
export async function batchMoveFiles(
  files: { source: string; fileName: string }[],
  destination: string,
  progressCallback?: (current: number, total: number, file: string) => void
): Promise<{ success: number; failed: number; errors: string[] }> {
  try {
    // 确保目标目录存在
    await fs.promises.mkdir(destination, { recursive: true })
    
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
        batch.map(async (file, index) => {
          const current = i + index + 1
          
          if (progressCallback) {
            progressCallback(current, total, file.source)
          }
          
          try {
            const targetPath = path.join(destination, file.fileName)
            await fs.promises.rename(file.source, targetPath)
            return true
          } catch (error) {
            const errMsg = `移动文件 ${file.source} 到 ${destination} 失败: ${getErrorMessage(error)}`
            console.error(errMsg)
            errors.push(errMsg)
            throw error
          }
        })
      )
      
      // 统计成功和失败的数量
      successCount += batchResults.filter(r => r.status === 'fulfilled').length
      failedCount += batchResults.filter(r => r.status === 'rejected').length
    }
    
    return {
      success: successCount,
      failed: failedCount,
      errors
    }
  } catch (error) {
    const errMsg = logAndFormatError(error, '批量移动文件失败')
    return {
      success: 0,
      failed: files.length,
      errors: [errMsg]
    }
  }
} 