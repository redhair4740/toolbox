import fs from 'fs'
import path from 'path'
import { handleError } from '../../utils/error-handler'

/**
 * 增强的文件搜索类
 * 提供高级文件搜索和索引功能
 */
export class EnhancedSearch {
  /**
   * 快速搜索文件
   * 根据文件名或路径快速查找文件
   */
  async quickSearch(options: {
    directory: string
    query: string
    maxResults?: number
  }): Promise<Array<{
    path: string
    name: string
    relativePath: string
    isDirectory: boolean
    score: number
  }>> {
    try {
      const {
        directory,
        query,
        maxResults = 100
      } = options

      // 搜索结果
      const results: Array<{
        path: string
        name: string
        relativePath: string
        isDirectory: boolean
        score: number
      }> = []

      // 如果查询为空，返回空结果
      if (!query.trim()) {
        return []
      }

      // 准备搜索词
      const searchTerms = query.toLowerCase().split(/\s+/).filter(Boolean)
      
      // 递归遍历目录
      const traverseDirectory = async (dir: string, baseDir: string) => {
        try {
          const entries = await fs.promises.readdir(dir, { withFileTypes: true })

          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name)
            const relativePath = path.relative(baseDir, fullPath)
            const name = entry.name.toLowerCase()

            // 计算匹配分数
            let score = this.calculateMatchScore(name, relativePath.toLowerCase(), searchTerms)

            // 如果分数大于0，添加到结果
            if (score > 0) {
              results.push({
                path: fullPath,
                name: entry.name,
                relativePath,
                isDirectory: entry.isDirectory(),
                score
              })

              // 如果结果已经足够，排序并返回
              if (results.length >= maxResults * 2) {
                results.sort((a, b) => b.score - a.score)
                results.splice(maxResults)
              }
            }

            // 如果是目录，递归搜索
            if (entry.isDirectory()) {
              await traverseDirectory(fullPath, baseDir)
            }
          }
        } catch (error) {
          console.error(`Error reading directory ${dir}:`, error)
        }
      }

      await traverseDirectory(directory, directory)

      // 排序并限制结果数量
      results.sort((a, b) => b.score - a.score)
      return results.slice(0, maxResults)
    } catch (error) {
      throw handleError('Failed to perform quick search', error)
    }
  }

  /**
   * 计算匹配分数
   * 根据文件名和路径与搜索词的匹配程度计算分数
   */
  private calculateMatchScore(name: string, path: string, searchTerms: string[]): number {
    let score = 0

    for (const term of searchTerms) {
      // 文件名完全匹配
      if (name === term) {
        score += 100
        continue
      }

      // 文件名开头匹配
      if (name.startsWith(term)) {
        score += 50
        continue
      }

      // 文件名包含匹配
      if (name.includes(term)) {
        score += 30
        continue
      }

      // 路径包含匹配
      if (path.includes(term)) {
        score += 10
        continue
      }

      // 如果一个词没有匹配，返回0分
      return 0
    }

    return score
  }

  /**
   * 搜索文件
   * 根据目录和文件模式查找文件
   */
  async searchFiles(options: {
    directory: string
    pattern?: string
    recursive?: boolean
    maxResults?: number
  }, progressCallback?: (info: any) => void): Promise<Array<{
    path: string
    name: string
    isDirectory: boolean
    relativePath: string
  }>> {
    try {
      const {
        directory,
        pattern,
        recursive = true,
        maxResults = 1000
      } = options

      // 搜索结果
      const results: Array<{
        path: string
        name: string
        isDirectory: boolean
        relativePath: string
      }> = []

      // 如果存在模式，创建匹配函数
      const matcher = pattern ? this.createFileMatcher(pattern) : null

      // 递归遍历目录
      const traverseDirectory = async (dir: string, baseDir: string) => {
        try {
          const entries = await fs.promises.readdir(dir, { withFileTypes: true })

          // 报告进度
          if (progressCallback) {
            progressCallback({
              current: results.length,
              total: maxResults,
              percentage: Math.min(100, Math.floor((results.length / maxResults) * 100)),
              status: 'searching',
              details: { currentDir: dir }
            })
          }

          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name)
            const relativePath = path.relative(baseDir, fullPath)

            // 如果是目录
            if (entry.isDirectory()) {
              // 添加目录到结果（如果没有模式或模式允许目录）
              if (!matcher || matcher(entry.name, true)) {
                results.push({
                  path: fullPath,
                  name: entry.name,
                  isDirectory: true,
                  relativePath
                })
              }

              // 如果是递归搜索，继续搜索子目录
              if (recursive) {
                await traverseDirectory(fullPath, baseDir)
              }
            } 
            // 如果是文件
            else if (entry.isFile()) {
              // 添加文件到结果（如果没有模式或模式匹配）
              if (!matcher || matcher(entry.name, false)) {
                results.push({
                  path: fullPath,
                  name: entry.name,
                  isDirectory: false,
                  relativePath
                })
              }
            }

            // 如果结果数量达到上限，停止搜索
            if (results.length >= maxResults) {
              break
            }
          }
        } catch (error) {
          console.error(`Error reading directory ${dir}:`, error)
        }
      }

      await traverseDirectory(directory, directory)

      // 报告完成进度
      if (progressCallback) {
        progressCallback({
          current: results.length,
          total: results.length,
          percentage: 100,
          status: 'completed',
          details: { totalFiles: results.length }
        })
      }

      return results
    } catch (error) {
      throw handleError('Failed to search files', error)
    }
  }

  /**
   * 创建文件匹配器
   * 根据文件模式创建匹配函数
   */
  private createFileMatcher(pattern: string): (filename: string, isDirectory: boolean) => boolean {
    // 如果是通配符模式
    if (pattern.includes('*') || pattern.includes('?')) {
      // 将通配符转换为正则表达式
      const regexPattern = pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.')
      
      const regex = new RegExp(`^${regexPattern}$`, 'i')
      return (filename) => regex.test(filename)
    }
    
    // 如果是扩展名列表
    if (pattern.startsWith('*.{') && pattern.endsWith('}')) {
      const extensions = pattern
        .substring(3, pattern.length - 1)
        .split(',')
        .map(ext => ext.toLowerCase())
      
      return (filename, isDirectory) => {
        if (isDirectory) return false
        const ext = path.extname(filename).toLowerCase().substring(1)
        return extensions.includes(ext)
      }
    }
    
    // 简单字符串匹配
    return (filename) => filename.toLowerCase().includes(pattern.toLowerCase())
  }

  /**
   * 构建文件索引
   * 为指定目录创建文件索引，加速后续搜索
   */
  async buildIndex(options: {
    directory: string
    excludePatterns?: string[]
  }): Promise<{
    indexSize: number
    fileCount: number
    directoryCount: number
  }> {
    try {
      const {
        directory,
        excludePatterns = []
      } = options

      // 编译排除模式
      const excludeRegexps = excludePatterns.map(pattern => {
        const regexPattern = pattern
          .replace(/\./g, '\\.')
          .replace(/\*/g, '.*')
          .replace(/\?/g, '.')
        return new RegExp(regexPattern)
      })

      // 索引统计
      const stats = {
        indexSize: 0,
        fileCount: 0,
        directoryCount: 0
      }

      // 索引数据
      const indexData: Array<{
        path: string
        name: string
        isDirectory: boolean
        size?: number
        modified?: Date
      }> = []

      // 递归遍历目录
      const traverseDirectory = async (dir: string) => {
        try {
          const entries = await fs.promises.readdir(dir, { withFileTypes: true })

          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name)

            // 检查是否应该排除
            const shouldExclude = excludeRegexps.some(regex => regex.test(fullPath))
            if (shouldExclude) continue

            if (entry.isDirectory()) {
              stats.directoryCount++
              indexData.push({
                path: fullPath,
                name: entry.name,
                isDirectory: true
              })
              await traverseDirectory(fullPath)
            } else if (entry.isFile()) {
              stats.fileCount++
              const fileStats = await fs.promises.stat(fullPath)
              indexData.push({
                path: fullPath,
                name: entry.name,
                isDirectory: false,
                size: fileStats.size,
                modified: fileStats.mtime
              })
            }
          }
        } catch (error) {
          console.error(`Error reading directory ${dir}:`, error)
        }
      }

      await traverseDirectory(directory)

      // 计算索引大小
      stats.indexSize = JSON.stringify(indexData).length

      // 保存索引
      const indexPath = path.join(directory, '.file_index.json')
      await fs.promises.writeFile(indexPath, JSON.stringify(indexData, null, 2))

      return stats
    } catch (error) {
      throw handleError('Failed to build index', error)
    }
  }

  /**
   * 使用索引搜索
   * 使用预先构建的索引进行快速搜索
   */
  async searchWithIndex(options: {
    indexPath: string
    query: string
    maxResults?: number
  }): Promise<Array<{
    path: string
    name: string
    isDirectory: boolean
    score: number
  }>> {
    try {
      const {
        indexPath,
        query,
        maxResults = 100
      } = options

      // 读取索引
      const indexData = JSON.parse(
        await fs.promises.readFile(indexPath, 'utf8')
      ) as Array<{
        path: string
        name: string
        isDirectory: boolean
      }>

      // 如果查询为空，返回空结果
      if (!query.trim()) {
        return []
      }

      // 准备搜索词
      const searchTerms = query.toLowerCase().split(/\s+/).filter(Boolean)

      // 搜索结果
      const results: Array<{
        path: string
        name: string
        isDirectory: boolean
        score: number
      }> = []

      // 遍历索引数据
      for (const item of indexData) {
        const name = item.name.toLowerCase()
        const itemPath = item.path.toLowerCase()

        // 计算匹配分数
        const score = this.calculateMatchScore(name, itemPath, searchTerms)

        // 如果分数大于0，添加到结果
        if (score > 0) {
          results.push({
            ...item,
            score
          })
        }
      }

      // 排序并限制结果数量
      results.sort((a, b) => b.score - a.score)
      return results.slice(0, maxResults)
    } catch (error) {
      throw handleError('Failed to search with index', error)
    }
  }

  /**
   * 高级文件搜索
   * 支持多种搜索条件组合
   */
  async advancedSearch(options: {
    directory: string
    name?: string
    content?: string
    minSize?: number
    maxSize?: number
    modifiedAfter?: Date
    modifiedBefore?: Date
    fileTypes?: string[]
    excludePatterns?: string[]
    recursive?: boolean
    maxResults?: number
  }): Promise<Array<{
    path: string
    name: string
    relativePath: string
    size: number
    modified: Date
    matches?: Array<{
      line: number
      content: string
    }>
  }>> {
    try {
      const {
        directory,
        name,
        content,
        minSize,
        maxSize,
        modifiedAfter,
        modifiedBefore,
        fileTypes = [],
        excludePatterns = [],
        recursive = true,
        maxResults = 1000
      } = options

      // 编译排除模式
      const excludeRegexps = excludePatterns.map(pattern => {
        const regexPattern = pattern
          .replace(/\./g, '\\.')
          .replace(/\*/g, '.*')
          .replace(/\?/g, '.')
        return new RegExp(regexPattern)
      })

      // 编译文件类型模式
      const fileTypeRegexps = fileTypes.map(type => {
        return new RegExp(`\\.${type.replace(/\./g, '\\.')}$`, 'i')
      })

      // 编译名称模式
      const nameRegexp = name ? new RegExp(name.replace(/\*/g, '.*').replace(/\?/g, '.'), 'i') : null

      // 编译内容搜索正则
      const contentRegexp = content ? new RegExp(content, 'i') : null

      // 搜索结果
      const results: Array<{
        path: string
        name: string
        relativePath: string
        size: number
        modified: Date
        matches?: Array<{
          line: number
          content: string
        }>
      }> = []

      // 递归遍历目录
      const traverseDirectory = async (dir: string, baseDir: string) => {
        try {
          const entries = await fs.promises.readdir(dir, { withFileTypes: true })

          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name)
            const relativePath = path.relative(baseDir, fullPath)

            // 检查是否应该排除
            const shouldExclude = excludeRegexps.some(regex => regex.test(fullPath))
            if (shouldExclude) continue

            if (entry.isDirectory()) {
              if (recursive) {
                await traverseDirectory(fullPath, baseDir)
              }
            } else if (entry.isFile()) {
              // 检查文件名
              if (nameRegexp && !nameRegexp.test(entry.name)) continue

              // 检查文件类型
              if (fileTypeRegexps.length > 0 && !fileTypeRegexps.some(regex => regex.test(entry.name))) continue

              // 获取文件信息
              const stats = await fs.promises.stat(fullPath)

              // 检查文件大小
              if (minSize !== undefined && stats.size < minSize) continue
              if (maxSize !== undefined && stats.size > maxSize) continue

              // 检查修改时间
              if (modifiedAfter && stats.mtime < modifiedAfter) continue
              if (modifiedBefore && stats.mtime > modifiedBefore) continue

              // 基本匹配通过，准备结果对象
              const result = {
                path: fullPath,
                name: entry.name,
                relativePath,
                size: stats.size,
                modified: stats.mtime
              }

              // 如果需要搜索内容
              if (contentRegexp) {
                try {
                  const fileContent = await fs.promises.readFile(fullPath, 'utf8')
                  const lines = fileContent.split(/\r?\n/)
                  const matches: Array<{ line: number; content: string }> = []

                  for (let i = 0; i < lines.length; i++) {
                    if (contentRegexp.test(lines[i])) {
                      matches.push({
                        line: i + 1,
                        content: lines[i]
                      })
                    }
                  }

                  if (matches.length > 0) {
                    results.push({
                      ...result,
                      matches
                    })
                  }
                } catch (error) {
                  // 忽略无法读取的文件
                  console.error(`Error reading file ${fullPath}:`, error)
                }
              } else {
                // 不需要搜索内容，直接添加结果
                results.push(result)
              }

              // 检查是否已达到最大结果数
              if (results.length >= maxResults) {
                return
              }
            }
          }
        } catch (error) {
          console.error(`Error reading directory ${dir}:`, error)
        }
      }

      await traverseDirectory(directory, directory)
      return results
    } catch (error) {
      throw handleError('Failed to perform advanced search', error)
    }
  }
}