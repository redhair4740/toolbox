import { createReadStream, createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'
import { ProgressCallback } from './progress'
import { handleError } from './error-handler'

/**
 * 文件流选项接口
 */
interface FileStreamOptions {
  // 块大小（字节）
  chunkSize?: number
  // 进度回调
  onProgress?: ProgressCallback
  // 是否保留原始时间戳
  preserveTimestamps?: boolean
}

/**
 * 文件流工具类
 * 提供文件流操作的工具方法
 */
export class FileStream {
  /**
   * 复制文件
   * @param sourcePath 源文件路径
   * @param targetPath 目标文件路径
   * @param options 选项
   */
  static async copy(
    sourcePath: string,
    targetPath: string,
    options: FileStreamOptions = {}
  ): Promise<void> {
    try {
      const readStream = createReadStream(sourcePath, {
        highWaterMark: options.chunkSize
      })

      const writeStream = createWriteStream(targetPath)

      let processedBytes = 0
      const fileSize = readStream.readableLength

      readStream.on('data', (chunk: any) => {
        processedBytes += chunk.length
        if (options.onProgress) {
          options.onProgress({
            current: processedBytes,
            total: fileSize,
            percentage: Math.floor((processedBytes / fileSize) * 100),
            details: {
              currentPath: sourcePath,
              operation: 'COPY'
            }
          })
        }
      })

      await pipeline(readStream, writeStream)

      if (options.preserveTimestamps) {
        // 在实际应用中，这里应该使用 fs.utimes 保留时间戳
      }
    } catch (error) {
      throw handleError(error, `Failed to copy file from ${sourcePath} to ${targetPath}`)
    }
  }

  /**
   * 创建可读流
   * @param filePath 文件路径
   * @param options 选项
   * @returns 可读流
   */
  static createReader(filePath: string, options: { chunkSize?: number } = {}) {
    return createReadStream(filePath, {
      highWaterMark: options.chunkSize
    })
  }

  /**
   * 创建可写流
   * @param filePath 文件路径
   * @returns 可写流
   */
  static createWriter(filePath: string) {
    return createWriteStream(filePath)
  }

  /**
   * 流式读取文件内容
   * @param filePath 文件路径
   * @param callback 内容处理回调
   * @param options 选项
   */
  static async readContent(
    filePath: string,
    callback: (chunk: any) => void,
    options: FileStreamOptions = {}
  ): Promise<void> {
    try {
      const readStream = this.createReader(filePath, { chunkSize: options.chunkSize })
      
      let processedBytes = 0
      const fileSize = readStream.readableLength

      readStream.on('data', (chunk: any) => {
        processedBytes += chunk.length
        if (options.onProgress) {
          options.onProgress({
            current: processedBytes,
            total: fileSize,
            percentage: Math.floor((processedBytes / fileSize) * 100),
            details: {
              currentPath: filePath,
              operation: 'READ'
            }
          })
        }
        callback(chunk)
      })

      await new Promise((resolve, reject) => {
        readStream.on('end', () => resolve(undefined))
        readStream.on('error', reject)
      })
    } catch (error) {
      throw handleError(error, `Failed to read file content from ${filePath}`)
    }
  }

  /**
   * 流式写入文件内容
   * @param filePath 文件路径
   * @param content 内容
   * @param options 选项
   */
  static async writeContent(
    filePath: string,
    content: Buffer | string,
    options: FileStreamOptions = {}
  ): Promise<void> {
    try {
      const writeStream = this.createWriter(filePath)
      
      if (options.onProgress) {
        const totalSize = Buffer.byteLength(content)
        options.onProgress({
          current: 0,
          total: totalSize,
          percentage: 0,
          details: {
            currentPath: filePath,
            operation: 'WRITE'
          }
        })
      }

      await new Promise<void>((resolve, reject) => {
        writeStream.write(content, (error) => {
          if (error) {
            reject(error)
          } else {
            if (options.onProgress) {
              const totalSize = Buffer.byteLength(content)
              options.onProgress({
                current: totalSize,
                total: totalSize,
                percentage: 100,
                details: {
                  currentPath: filePath,
                  operation: 'WRITE'
                }
              })
            }
            writeStream.end(() => resolve())
          }
        })
      })
    } catch (error) {
      throw handleError(error, `Failed to write content to ${filePath}`)
    }
  }
}