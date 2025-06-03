import fs from 'fs'
import path from 'path'
import { EventEmitter } from 'events'
import { WorkerPool } from '../../utils/worker-pool'
import { ProgressCallback } from '../../utils/progress'
import { handleError } from '../../utils/error-handler'

/**
 * 文件搜索管理器
 * 负责在文件内容中搜索指定的文本或正则表达式
 */
export class FileSearchManager extends EventEmitter {
  private isCancelled: boolean = false
  private workerPool: WorkerPool | null = null
  private readonly MAX_FILE_SIZE: number = 100 * 1024 * 1024 // 100MB
  private readonly CONTEXT_LINES: number = 2 // 匹配上下文行数

  constructor() {
    super()
    // 临时禁用WorkerPool
    // const workerScript = path.join(__dirname, 'search-worker.js')
    // this.workerPool = new WorkerPool(workerScript)
  }

  /**
   * 在文件中搜索内容
   */
  async searchInFiles(options: {
    directory: string
    content: string
    pattern?: string
    excludePatterns?: string[]
    recursive?: boolean
    caseSensitive?: boolean
    useRegex?: boolean
    maxFileSize?: number
  }, progressCallback?: ProgressCallback): Promise<Array<{
    filePath: string
    matches: Array<{
      line: number
      content: string
      context?: string
    }>
  }>> {
    this.isCancelled = false
    const results: Array<{
      filePath: string
      matches: Array<{
        line: number
        content: string
        context?: string
      }>
    }> = []

    const {
      directory,
      content,
      pattern,
      excludePatterns = [],
      recursive = true,
      caseSensitive = false,
      useRegex = false,
      maxFileSize = this.MAX_FILE_SIZE
    } = options

    try {
      // 设置worker池大小 - 临时禁用
      // if (this.workerPool) {
      //   this.workerPool.setMaxWorkers(threads)
      // }

      // 准备搜索正则表达式
      let searchRegex: RegExp
      if (useRegex) {
        try {
          searchRegex = new RegExp(content, caseSensitive ? 'g' : 'gi')
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          throw new Error(`Invalid regular expression: ${errorMessage}`)
        }
      } else {
        const escapedContent = content.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        searchRegex = new RegExp(escapedContent, caseSensitive ? 'g' : 'gi')
      }

      // 编译排除模式
      const excludeRegexps = excludePatterns.map(pattern => {
        // 将glob模式转换为正则表达式
        const regexPattern = pattern
          .replace(/\./g, '\\.')
          .replace(/\*/g, '.*')
          .replace(/\?/g, '.')
        return new RegExp(regexPattern)
      })

      // 获取要搜索的文件列表
      const files = await this.getFilesToSearch(directory, {
        pattern,
        excludePatterns: excludeRegexps,
        recursive,
        maxFileSize
      })

      if (files.length === 0) {
        return []
      }

      let searched = 0
      let matchesFound = 0

      // 创建搜索任务
      const tasks = files.map(file => async () => {
        if (this.isCancelled) return null

        try {
          const fileMatches = await this.searchInFile(file, searchRegex)
          searched++

          if (progressCallback) {
            matchesFound += fileMatches.length
            const percentage = Math.floor((searched / files.length) * 100)
            progressCallback({
              current: searched,
              total: files.length,
              percentage: percentage,
              details: { file, matches: matchesFound }
            })
            this.emit('progress', {
              percentage,
              searched,
              total: files.length,
              matches: matchesFound,
              currentFile: file
            })
          }

          if (fileMatches.length > 0) {
            return {
              filePath: file,
              matches: fileMatches
            }
          }
        } catch (error) {
          console.error(`Error searching in file ${file}:`, error)
        }

        return null
      })

      // 执行搜索任务 - 临时实现
      // const searchResults = await this.workerPool.runTasks(tasks)
      const searchResults = await Promise.all(tasks.map(task => task()))

      // 过滤有效结果并添加到结果列表
      searchResults.filter(Boolean).forEach(result => {
        if (result) results.push(result)
      })

      return results
    } catch (error) {
      throw handleError(error, 'Failed to search in files')
    }
  }

  /**
   * 取消搜索
   */
  async cancelSearch(): Promise<void> {
    this.isCancelled = true
    
    // 关闭工作线程池
    if (this.workerPool) {
      await this.workerPool.terminate()
      this.workerPool = null
    }
    
    this.emit('search-cancelled')
  }

  /**
   * 获取要搜索的文件列表
   */
  private async getFilesToSearch(directory: string, options: {
    pattern?: string
    excludePatterns: RegExp[]
    recursive: boolean
    maxFileSize: number
  }): Promise<string[]> {
    const files: string[] = []
    const { pattern, excludePatterns, recursive, maxFileSize } = options

    // 编译文件模式正则表达式
    let fileRegex: RegExp | null = null
    if (pattern) {
      // 将glob模式转换为正则表达式
      const regexPattern = pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.')
      fileRegex = new RegExp(regexPattern)
    }

    // 递归函数，用于遍历目录
    const traverseDirectory = async (dir: string) => {
      if (this.isCancelled) return

      try {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true })

        for (const entry of entries) {
          if (this.isCancelled) break

          const fullPath = path.join(dir, entry.name)

          // 检查是否应该排除此路径
          const shouldExclude = excludePatterns.some(regex => regex.test(fullPath))
          if (shouldExclude) continue

          if (entry.isDirectory()) {
            if (recursive) {
              await traverseDirectory(fullPath)
            }
          } else if (entry.isFile()) {
            // 检查文件是否匹配模式
            if (fileRegex && !fileRegex.test(entry.name)) continue

            try {
              // 检查文件大小
              const stats = await fs.promises.stat(fullPath)
              if (stats.size <= maxFileSize) {
                files.push(fullPath)
              }
            } catch (error) {
              console.error(`Error getting stats for ${fullPath}:`, error)
            }
          }
        }
      } catch (error) {
        console.error(`Error reading directory ${dir}:`, error)
      }
    }

    await traverseDirectory(directory)
    return files
  }

  /**
   * 在单个文件中搜索
   */
  private async searchInFile(filePath: string, regex: RegExp): Promise<Array<{
    line: number
    content: string
    context?: string
  }>> {
    const matches: Array<{
      line: number
      content: string
      context?: string
    }> = []

    try {
      // 检查文件是否是二进制文件
      if (await this.isBinaryFile(filePath)) {
        return []
      }

      // 读取文件内容
      const content = await fs.promises.readFile(filePath, 'utf8')
      
      // 分割为行
      const lines = content.split(/\r?\n/)
      
      // 搜索每一行
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        
        // 重置正则表达式的lastIndex
        regex.lastIndex = 0
        
        if (regex.test(line)) {
          // 获取上下文
          const contextStart = Math.max(0, i - this.CONTEXT_LINES)
          const contextEnd = Math.min(lines.length - 1, i + this.CONTEXT_LINES)
          const context = lines.slice(contextStart, contextEnd + 1)
            .map((l, idx) => {
              const lineNumber = contextStart + idx + 1
              const prefix = lineNumber === i + 1 ? '> ' : '  '
              return `${prefix}${lineNumber}: ${l}`
            })
            .join('\n')

          matches.push({
            line: i + 1,
            content: line,
            context
          })
        }
      }

      return matches
    } catch (error) {
      console.error(`Error searching in file ${filePath}:`, error)
      return []
    }
  }

  /**
   * 检查文件是否是二进制文件
   */
  private async isBinaryFile(filePath: string): Promise<boolean> {
    try {
      // 读取文件的前4KB来判断是否是二进制文件
      const buffer = Buffer.alloc(4096)
      const fd = await fs.promises.open(filePath, 'r')
      
      try {
        const { bytesRead } = await fd.read(buffer, 0, 4096, 0)
        
        if (bytesRead === 0) return false
        
        // 检查是否包含空字节（通常表示二进制文件）
        for (let i = 0; i < bytesRead; i++) {
          if (buffer[i] === 0) return true
        }
        
        // 检查非ASCII字符的比例
        let nonAsciiCount = 0
        for (let i = 0; i < bytesRead; i++) {
          if (buffer[i] < 32 && buffer[i] !== 9 && buffer[i] !== 10 && buffer[i] !== 13) {
            nonAsciiCount++
          }
        }
        
        // 如果非ASCII字符超过30%，认为是二进制文件
        return nonAsciiCount / bytesRead > 0.3
      } finally {
        await fd.close()
      }
    } catch (error) {
      console.error(`Error checking if ${filePath} is binary:`, error)
      return true // 出错时假设是二进制文件
    }
  }
}