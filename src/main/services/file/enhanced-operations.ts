import * as fs from 'fs'
import path from 'path'
import { FileOperationError, withRetry } from '../../utils/error-handler'
import { ConcurrencyController } from '../../utils/concurrency'
import { withRetry } from '../../utils/retry'
import { ProgressTracker } from '../../utils/progress'
import { WorkerPool } from '../../utils/worker-pool'
import { getConfig } from '../../config/app-config'
import { shouldUseStreaming, processFileStream, createLineProcessor } from '../../utils/file-stream'

/**
 * 增强的文件操作服务
 */
export class EnhancedFileOperations {
  private concurrencyController: ConcurrencyController
  private workerPool: WorkerPool | null = null
  
  constructor() {
    const config = getConfig()
    this.concurrencyController = new ConcurrencyController(config.batch.concurrency)
  }
  
  /**
   * 初始化工作线程池
   */
  private async initWorkerPool(): Promise<void> {
    if (this.workerPool) return
    
    const workerScript = `
      const { parentPort } = require('worker_threads')
      const fs = require('fs')
      const path = require('path')
      
      parentPort.on('message', async (data) => {
        try {
          const { source, destination, fileName } = data
          const targetPath = path.join(destination, fileName)
          await fs.promises.rename(source, targetPath)
          parentPort.postMessage({ success: true, path: targetPath })
        } catch (error) {
          parentPort.postMessage({ 
            success: false, 
            error: error.message || String(error)
          })
        }
      })
    `
    
    const scriptPath = await import('../../utils/worker-pool').then(
      ({ createWorkerScript }) => createWorkerScript(workerScript)
    )
    
    this.workerPool = new WorkerPool(scriptPath)
  }
  
  /**
   * 移动单个文件
   */
  async moveFile(
    source: string,
    destination: string,
    fileName: string
  ): Promise<string> {
    const config = getConfig()
    
    return withRetry(async () => {
      try {
        // 验证文件路径
        await this.validatePaths(source, destination)
        
        // 确保目标目录存在
        await fs.promises.mkdir(destination, { recursive: true })
        
        const targetPath = path.join(destination, fileName)
        
        // 获取文件大小
        const stats = await fs.promises.stat(source)
        
        // 对大文件使用工作线程
        if (stats.size > config.performance.workerThreshold) {
          await this.initWorkerPool()
          await this.workerPool!.execute({ source, destination, fileName })
        } else {
          await fs.promises.rename(source, targetPath)
        }
        
        return targetPath
      } catch (error) {
        throw new FileOperationError(
          `移动文件失败: ${error instanceof Error ? error.message : String(error)}`,
          'MOVE_FILE_ERROR',
          'moveFile',
          source,
          error instanceof Error ? error : undefined
        )
      }
    }, {
      retries: config.retry.attempts,
      baseDelay: config.retry.baseDelay,
      maxDelay: config.retry.maxDelay
    })
  }
  
  /**
   * 批量移动文件
   */
  async batchMoveFiles(
    files: { source: string; fileName: string }[],
    destination: string,
    onProgress?: (info: any) => void
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const config = getConfig()
    const tracker = new ProgressTracker(files.length, onProgress || (() => {}))
    const errors: string[] = []
    
    try {
      // 验证目标路径
      await this.validatePaths(destination)
      
      // 确保目标目录存在
      await fs.promises.mkdir(destination, { recursive: true })
      
      // 初始化工作线程池（如果需要）
      const hasLargeFiles = await this.checkForLargeFiles(files.map(f => f.source))
      if (hasLargeFiles) {
        await this.initWorkerPool()
      }
      
      // 创建任务
      const tasks = files.map(file => async () => {
        try {
          await this.moveFile(file.source, destination, file.fileName)
          tracker.update(file.source)
          return { success: true }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          errors.push(`移动文件 ${file.source} 失败: ${errorMessage}`)
          return { success: false }
        }
      })
      
      // 批量执行任务
      const results = await this.concurrencyController.runInBatches(
        tasks,
        config.batch.size
      )
      
      const successCount = results.filter(r => r.success).length
      const failedCount = results.filter(r => !r.success).length
      
      return {
        success: successCount,
        failed: failedCount,
        errors
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {
        success: 0,
        failed: files.length,
        errors: [`批量移动文件失败: ${errorMessage}`]
      }
    } finally {
      // 关闭工作线程池
      if (this.workerPool) {
        await this.workerPool.shutdown()
        this.workerPool = null
      }
    }
  }
  
  /**
   * 检查是否存在大文件
   */
  private async checkForLargeFiles(filePaths: string[]): Promise<boolean> {
    const config = getConfig()
    
    for (const filePath of filePaths) {
      try {
        const stats = await fs.promises.stat(filePath)
        if (stats.size > config.performance.workerThreshold) {
          return true
        }
      } catch (error) {
        // 忽略文件访问错误
        console.warn(`无法检查文件大小: ${filePath}`, error)
      }
    }
    
    return false
  }
  
  /**
   * 验证文件路径
   */
  private async validatePaths(...paths: string[]): Promise<void> {
    const config = getConfig()
    
    for (const p of paths) {
      if (p) {
        // 检查是否包含禁止访问的目录
        const normalizedPath = path.normalize(p)
        const pathParts = normalizedPath.split(path.sep)
        
        for (const dir of config.security.forbiddenDirs) {
          if (pathParts.includes(dir)) {
            throw new FileOperationError(
              `访问被禁止的目录: ${dir}`,
              'FORBIDDEN_DIRECTORY',
              'validatePaths',
              p
            )
          }
        }
      }
    }
  }
  
  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    if (this.workerPool) {
      await this.workerPool.shutdown()
      this.workerPool = null
    }
  }
  
  /**
   * 列出目录中的文件
   */
  async listFiles(options: {
    directory: string
    recursive?: boolean
    pattern?: string
    excludePattern?: string
    useRegex?: boolean
  }): Promise<Array<{
    path: string
    name: string
    isDirectory: boolean
    relativePath: string
  }>> {
    const {
      directory,
      recursive = false,
      pattern,
      excludePattern,
      useRegex = false
    } = options
    
    // 结果数组
    const files: Array<{
      path: string
      name: string
      isDirectory: boolean
      relativePath: string
    }> = []
    
    try {
      // 验证目录路径
      await this.validatePaths(directory)
      
      // 创建正则表达式
      let includeRegex: RegExp | null = null
      let excludeRegex: RegExp | null = null
      
      if (pattern && useRegex) {
        includeRegex = new RegExp(pattern)
      } else if (pattern) {
        includeRegex = new RegExp(this.wildcardToRegex(pattern))
      }
      
      if (excludePattern && useRegex) {
        excludeRegex = new RegExp(excludePattern)
      } else if (excludePattern) {
        excludeRegex = new RegExp(this.wildcardToRegex(excludePattern))
      }
      
      // 递归遍历函数
      const traverseDirectory = async (dir: string, baseDir: string) => {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true })
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name)
          const relativePath = path.relative(baseDir, fullPath)
          
          // 判断是否匹配模式
          const shouldInclude = !includeRegex || includeRegex.test(entry.name)
          const shouldExclude = excludeRegex && excludeRegex.test(entry.name)
          
          if (shouldInclude && !shouldExclude) {
            files.push({
              path: fullPath,
              name: entry.name,
              isDirectory: entry.isDirectory(),
              relativePath
            })
          }
          
          // 递归处理子目录
          if (entry.isDirectory() && recursive) {
            await traverseDirectory(fullPath, baseDir)
          }
        }
      }
      
      await traverseDirectory(directory, directory)
      return files
      
    } catch (error) {
      throw new FileOperationError(
        `列出文件失败: ${error instanceof Error ? error.message : String(error)}`,
        'LIST_FILES_ERROR',
        'listFiles',
        directory,
        error instanceof Error ? error : undefined
      )
    }
  }
  
  /**
   * 将通配符转换为正则表达式
   */
  private wildcardToRegex(pattern: string): string {
    return '^' + pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.') + '$'
  }
}