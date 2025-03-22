import fs from 'fs'
import path from 'path'
import { EventEmitter } from 'events'
import { WorkerPool } from '../../utils/worker-pool'
import { ProgressCallback } from '../../utils/progress'
import { handleError } from '../../utils/error-handler'

/**
 * 文件操作管理器
 * 负责处理文件的复制、移动、删除等基础操作
 */
export class FileOperationManager extends EventEmitter {
  private isCancelled: boolean = false
  private workerPool: WorkerPool

  constructor() {
    super()
    this.workerPool = new WorkerPool()
  }

  /**
   * 复制文件
   */
  async copyFiles(options: {
    files: string[]
    targetPath: string
    preserveStructure?: boolean
    conflictStrategy?: 'ask' | 'overwrite' | 'skip' | 'rename'
    parallel?: boolean
    maxParallel?: number
  }, progressCallback?: ProgressCallback): Promise<{
    success: number
    failed: number
    skipped: number
  }> {
    this.isCancelled = false
    const result = { success: 0, failed: 0, skipped: 0 }
    const { files, targetPath, preserveStructure = true, conflictStrategy = 'ask', parallel = false, maxParallel = 4 } = options

    // 确保目标目录存在
    await this.ensureDirectoryExists(targetPath)

    // 并行处理
    if (parallel) {
      return this.parallelCopyFiles(options, progressCallback)
    }

    // 顺序处理
    let current = 0
    const total = files.length

    for (const filePath of files) {
      if (this.isCancelled) break

      current++
      const fileName = path.basename(filePath)
      
      if (progressCallback) {
        progressCallback(current, total, filePath)
      }

      try {
        const stats = await fs.promises.stat(filePath)
        
        // 确定目标路径
        let targetFilePath
        if (preserveStructure && options.files.length > 1) {
          // 获取相对于第一个文件父目录的路径
          const basePath = path.dirname(options.files[0])
          const relativePath = path.relative(basePath, filePath)
          targetFilePath = path.join(targetPath, relativePath)
          
          // 确保目标子目录存在
          await this.ensureDirectoryExists(path.dirname(targetFilePath))
        } else {
          targetFilePath = path.join(targetPath, fileName)
        }

        // 检查文件是否已存在
        const fileExists = await this.fileExists(targetFilePath)
        if (fileExists) {
          // 根据冲突策略处理
          if (conflictStrategy === 'skip') {
            result.skipped++
            continue
          } else if (conflictStrategy === 'rename') {
            targetFilePath = await this.generateUniqueFilename(targetFilePath)
          }
          // 'overwrite' 策略会直接覆盖，无需特殊处理
        }

        // 复制文件或目录
        if (stats.isDirectory()) {
          await this.copyDirectory(filePath, targetFilePath, conflictStrategy)
        } else {
          await fs.promises.copyFile(filePath, targetFilePath)
        }

        result.success++
      } catch (error) {
        console.error(`Failed to copy file ${filePath}:`, error)
        result.failed++
      }
    }

    return result
  }

  /**
   * 并行复制文件
   */
  private async parallelCopyFiles(options: {
    files: string[]
    targetPath: string
    preserveStructure?: boolean
    conflictStrategy?: 'ask' | 'overwrite' | 'skip' | 'rename'
    maxParallel?: number
  }, progressCallback?: ProgressCallback): Promise<{
    success: number
    failed: number
    skipped: number
  }> {
    const { files, targetPath, preserveStructure = true, maxParallel = 4 } = options
    const result = { success: 0, failed: 0, skipped: 0 }
    let processed = 0
    const total = files.length

    // 设置worker池大小
    this.workerPool.setMaxWorkers(maxParallel)

    // 准备任务
    const tasks = files.map(filePath => async () => {
      if (this.isCancelled) return { success: 0, failed: 0, skipped: 0 }

      try {
        const fileName = path.basename(filePath)
        
        // 确定目标路径
        let targetFilePath
        if (preserveStructure && files.length > 1) {
          const basePath = path.dirname(files[0])
          const relativePath = path.relative(basePath, filePath)
          targetFilePath = path.join(targetPath, relativePath)
          
          // 确保目标子目录存在
          await this.ensureDirectoryExists(path.dirname(targetFilePath))
        } else {
          targetFilePath = path.join(targetPath, fileName)
        }

        const stats = await fs.promises.stat(filePath)
        const fileExists = await this.fileExists(targetFilePath)

        // 处理文件冲突
        if (fileExists) {
          if (options.conflictStrategy === 'skip') {
            return { success: 0, failed: 0, skipped: 1 }
          } else if (options.conflictStrategy === 'rename') {
            targetFilePath = await this.generateUniqueFilename(targetFilePath)
          }
        }

        // 复制文件或目录
        if (stats.isDirectory()) {
          await this.copyDirectory(filePath, targetFilePath, options.conflictStrategy)
        } else {
          await fs.promises.copyFile(filePath, targetFilePath)
        }

        return { success: 1, failed: 0, skipped: 0 }
      } catch (error) {
        console.error(`Failed to copy file ${filePath}:`, error)
        return { success: 0, failed: 1, skipped: 0 }
      } finally {
        processed++
        if (progressCallback) {
          progressCallback(processed, total, filePath)
        }
      }
    })

    // 执行任务
    const results = await this.workerPool.runTasks(tasks)

    // 汇总结果
    results.forEach(r => {
      result.success += r.success
      result.failed += r.failed
      result.skipped += r.skipped
    })

    return result
  }

  /**
   * 移动文件
   */
  async moveFiles(options: {
    files: string[]
    targetPath: string
    preserveStructure?: boolean
    conflictStrategy?: 'ask' | 'overwrite' | 'skip' | 'rename'
    parallel?: boolean
    maxParallel?: number
  }, progressCallback?: ProgressCallback): Promise<{
    success: number
    failed: number
    skipped: number
  }> {
    this.isCancelled = false
    const result = { success: 0, failed: 0, skipped: 0 }
    const { files, targetPath, preserveStructure = true, conflictStrategy = 'ask', parallel = false, maxParallel = 4 } = options

    // 确保目标目录存在
    await this.ensureDirectoryExists(targetPath)

    // 并行处理
    if (parallel) {
      return this.parallelMoveFiles(options, progressCallback)
    }

    // 顺序处理
    let current = 0
    const total = files.length

    for (const filePath of files) {
      if (this.isCancelled) break

      current++
      const fileName = path.basename(filePath)
      
      if (progressCallback) {
        progressCallback(current, total, filePath)
      }

      try {
        // 确定目标路径
        let targetFilePath
        if (preserveStructure && options.files.length > 1) {
          const basePath = path.dirname(options.files[0])
          const relativePath = path.relative(basePath, filePath)
          targetFilePath = path.join(targetPath, relativePath)
          
          // 确保目标子目录存在
          await this.ensureDirectoryExists(path.dirname(targetFilePath))
        } else {
          targetFilePath = path.join(targetPath, fileName)
        }

        // 检查文件是否已存在
        const fileExists = await this.fileExists(targetFilePath)
        if (fileExists) {
          // 根据冲突策略处理
          if (conflictStrategy === 'skip') {
            result.skipped++
            continue
          } else if (conflictStrategy === 'rename') {
            targetFilePath = await this.generateUniqueFilename(targetFilePath)
          } else if (conflictStrategy === 'overwrite') {
            await this.removeFile(targetFilePath)
          }
        }

        // 移动文件
        await fs.promises.rename(filePath, targetFilePath)
        result.success++
      } catch (error) {
        // 如果简单移动失败（可能跨设备），尝试复制然后删除
        try {
          const targetFilePath = path.join(targetPath, fileName)
          await fs.promises.copyFile(filePath, targetFilePath)
          await fs.promises.unlink(filePath)
          result.success++
        } catch (copyError) {
          console.error(`Failed to move file ${filePath}:`, copyError)
          result.failed++
        }
      }
    }

    return result
  }

  /**
   * 并行移动文件
   */
  private async parallelMoveFiles(options: {
    files: string[]
    targetPath: string
    preserveStructure?: boolean
    conflictStrategy?: 'ask' | 'overwrite' | 'skip' | 'rename'
    maxParallel?: number
  }, progressCallback?: ProgressCallback): Promise<{
    success: number
    failed: number
    skipped: number
  }> {
    const { files, targetPath, preserveStructure = true, maxParallel = 4 } = options
    const result = { success: 0, failed: 0, skipped: 0 }
    let processed = 0
    const total = files.length

    // 设置worker池大小
    this.workerPool.setMaxWorkers(maxParallel)

    // 准备任务
    const tasks = files.map(filePath => async () => {
      if (this.isCancelled) return { success: 0, failed: 0, skipped: 0 }

      try {
        const fileName = path.basename(filePath)
        
        // 确定目标路径
        let targetFilePath
        if (preserveStructure && files.length > 1) {
          const basePath = path.dirname(files[0])
          const relativePath = path.relative(basePath, filePath)
          targetFilePath = path.join(targetPath, relativePath)
          
          // 确保目标子目录存在
          await this.ensureDirectoryExists(path.dirname(targetFilePath))
        } else {
          targetFilePath = path.join(targetPath, fileName)
        }

        const fileExists = await this.fileExists(targetFilePath)

        // 处理文件冲突
        if (fileExists) {
          if (options.conflictStrategy === 'skip') {
            return { success: 0, failed: 0, skipped: 1 }
          } else if (options.conflictStrategy === 'rename') {
            targetFilePath = await this.generateUniqueFilename(targetFilePath)
          } else if (options.conflictStrategy === 'overwrite') {
            await this.removeFile(targetFilePath)
          }
        }

        // 尝试移动文件
        try {
          await fs.promises.rename(filePath, targetFilePath)
          return { success: 1, failed: 0, skipped: 0 }
        } catch (moveError) {
          // 如果简单移动失败（可能跨设备），尝试复制然后删除
          await fs.promises.copyFile(filePath, targetFilePath)
          await fs.promises.unlink(filePath)
          return { success: 1, failed: 0, skipped: 0 }
        }
      } catch (error) {
        console.error(`Failed to move file ${filePath}:`, error)
        return { success: 0, failed: 1, skipped: 0 }
      } finally {
        processed++
        if (progressCallback) {
          progressCallback(processed, total, filePath)
        }
      }
    })

    // 执行任务
    const results = await this.workerPool.runTasks(tasks)

    // 汇总结果
    results.forEach(r => {
      result.success += r.success
      result.failed += r.failed
      result.skipped += r.skipped
    })

    return result
  }

  /**
   * 删除文件
   */
  async deleteFiles(options: {
    files: string[]
    parallel?: boolean
    maxParallel?: number
  }, progressCallback?: ProgressCallback): Promise<{
    success: number
    failed: number
  }> {
    this.isCancelled = false
    const result = { success: 0, failed: 0 }
    const { files, parallel = false, maxParallel = 4 } = options

    // 并行处理
    if (parallel) {
      return this.parallelDeleteFiles(options, progressCallback)
    }

    // 顺序处理
    let current = 0
    const total = files.length

    for (const filePath of files) {
      if (this.isCancelled) break

      current++
      
      if (progressCallback) {
        progressCallback(current, total, filePath)
      }

      try {
        await this.removeFile(filePath)
        result.success++
      } catch (error) {
        console.error(`Failed to delete file ${filePath}:`, error)
        result.failed++
      }
    }

    return result
  }

  /**
   * 并行删除文件
   */
  private async parallelDeleteFiles(options: {
    files: string[]
    maxParallel?: number
  }, progressCallback?: ProgressCallback): Promise<{
    success: number
    failed: number
  }> {
    const { files, maxParallel = 4 } = options
    const result = { success: 0, failed: 0 }
    let processed = 0
    const total = files.length

    // 设置worker池大小
    this.workerPool.setMaxWorkers(maxParallel)

    // 准备任务
    const tasks = files.map(filePath => async () => {
      if (this.isCancelled) return { success: 0, failed: 0 }

      try {
        await this.removeFile(filePath)
        return { success: 1, failed: 0 }
      } catch (error) {
        console.error(`Failed to delete file ${filePath}:`, error)
        return { success: 0, failed: 1 }
      } finally {
        processed++
        if (progressCallback) {
          progressCallback(processed, total, filePath)
        }
      }
    })

    // 执行任务
    const results = await this.workerPool.runTasks(tasks)

    // 汇总结果
    results.forEach(r => {
      result.success += r.success
      result.failed += r.failed
    })

    return result
  }

  /**
   * 清理资源
   */
  async cancelOperation(): Promise<void> {
    this.isCancelled = true
    
    // 关闭工作线程池
    if (this.workerPool) {
      await this.workerPool.terminate()
      this.workerPool = null
    }
  }

  /**
   * 复制目录
   */
  private async copyDirectory(
    source: string,
    target: string,
    conflictStrategy: 'ask' | 'overwrite' | 'skip' | 'rename' = 'ask'
  ): Promise<void> {
    // 创建目标目录
    await this.ensureDirectoryExists(target)

    // 读取源目录内容
    const entries = await fs.promises.readdir(source, { withFileTypes: true })

    // 复制每个条目
    for (const entry of entries) {
      const sourcePath = path.join(source, entry.name)
      const targetPath = path.join(target, entry.name)

      if (entry.isDirectory()) {
        // 递归复制子目录
        await this.copyDirectory(sourcePath, targetPath, conflictStrategy)
      } else {
        // 复制文件
        const fileExists = await this.fileExists(targetPath)
        if (fileExists) {
          if (conflictStrategy === 'skip') {
            continue
          } else if (conflictStrategy === 'rename') {
            const newPath = await this.generateUniqueFilename(targetPath)
            await fs.promises.copyFile(sourcePath, newPath)
          } else {
            // overwrite
            await fs.promises.copyFile(sourcePath, targetPath)
          }
        } else {
          await fs.promises.copyFile(sourcePath, targetPath)
        }
      }
    }
  }

  /**
   * 递归删除文件或目录
   */
  private async removeFile(filePath: string): Promise<void> {
    try {
      const stats = await fs.promises.stat(filePath)

      if (stats.isDirectory()) {
        // 读取目录内容
        const entries = await fs.promises.readdir(filePath)

        // 递归删除每个条目
        for (const entry of entries) {
          await this.removeFile(path.join(filePath, entry))
        }

        // 删除空目录
        await fs.promises.rmdir(filePath)
      } else {
        // 删除文件
        await fs.promises.unlink(filePath)
      }
    } catch (error) {
      throw handleError(`Failed to remove ${filePath}`, error)
    }
  }

  /**
   * 确保目录存在
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.promises.mkdir(dirPath, { recursive: true })
    } catch (error) {
      throw handleError(`Failed to create directory ${dirPath}`, error)
    }
  }

  /**
   * 检查文件是否存在
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath)
      return true
    } catch {
      return false
    }
  }

  /**
   * 生成唯一文件名
   */
  private async generateUniqueFilename(filePath: string): Promise<string> {
    const dir = path.dirname(filePath)
    const ext = path.extname(filePath)
    const baseName = path.basename(filePath, ext)
    let counter = 1
    let newPath = filePath

    while (await this.fileExists(newPath)) {
      newPath = path.join(dir, `${baseName} (${counter})${ext}`)
      counter++
    }

    return newPath
  }
}