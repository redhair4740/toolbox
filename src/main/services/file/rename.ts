import fs from 'fs'
import path from 'path'
import { EventEmitter } from 'events'
import { ProgressCallback } from '../../utils/progress'
import { handleError } from '../../utils/error-handler'

/**
 * 文件重命名管理器
 * 负责处理文件的重命名操作，包括批量重命名预览和执行
 */
export class FileRenameManager extends EventEmitter {
  private isCancelled: boolean = false

  constructor() {
    super()
  }

  /**
   * 预览重命名结果
   */
  async previewRename(options: {
    files: Array<{
      path: string
      name: string
      isDirectory: boolean
    }>
    options: {
      mode: string
      [key: string]: any
    }
  }): Promise<Array<{
    path: string
    name: string
    newName: string
    hasError: boolean
    errorMessage?: string
  }>> {
    const { files, options: renameOptions } = options
    const results: Array<{
      path: string
      name: string
      newName: string
      hasError: boolean
      errorMessage?: string
    }> = []

    try {
      for (const file of files) {
        try {
          // 根据重命名模式生成新名称
          const newName = await this.generateNewName(file, renameOptions)
          
          // 检查新名称是否有效
          const isValid = this.isValidFileName(newName)
          
          // 检查是否会产生冲突
          const hasConflict = await this.checkNameConflict(file.path, newName)
          
          if (!isValid) {
            results.push({
              path: file.path,
              name: file.name,
              newName,
              hasError: true,
              errorMessage: '文件名包含无效字符'
            })
          } else if (hasConflict) {
            results.push({
              path: file.path,
              name: file.name,
              newName,
              hasError: true,
              errorMessage: '文件名冲突'
            })
          } else {
            results.push({
              path: file.path,
              name: file.name,
              newName,
              hasError: false
            })
          }
        } catch (error) {
          results.push({
            path: file.path,
            name: file.name,
            newName: file.name,
            hasError: true,
            errorMessage: error.message
          })
        }
      }

      return results
    } catch (error) {
      throw handleError('Failed to preview rename', error)
    }
  }

  /**
   * 执行重命名操作
   */
  async renameFiles(options: {
    files: Array<{
      path: string
      newName: string
    }>
    options?: {
      [key: string]: any
    }
  }, progressCallback?: ProgressCallback): Promise<{
    success: number
    failed: number
  }> {
    this.isCancelled = false
    const result = { success: 0, failed: 0 }
    const { files } = options

    let current = 0
    const total = files.length

    for (const file of files) {
      if (this.isCancelled) break

      current++
      
      if (progressCallback) {
        progressCallback(current, total, file.path)
      }

      try {
        // 获取目录和新路径
        const dir = path.dirname(file.path)
        const newPath = path.join(dir, file.newName)
        
        // 检查新路径是否与原路径相同
        if (file.path === newPath) {
          result.success++
          continue
        }
        
        // 检查目标路径是否已存在
        const exists = await this.fileExists(newPath)
        if (exists) {
          result.failed++
          continue
        }
        
        // 执行重命名
        await fs.promises.rename(file.path, newPath)
        result.success++
      } catch (error) {
        console.error(`Failed to rename file ${file.path}:`, error)
        result.failed++
      }
    }

    return result
  }

  /**
   * 取消当前操作
   */
  cancelOperation(): void {
    this.isCancelled = true
    this.emit('cancelled')
  }

  /**
   * 根据重命名选项生成新的文件名
   */
  private async generateNewName(file: {
    path: string
    name: string
    isDirectory: boolean
  }, options: {
    mode: string
    [key: string]: any
  }): Promise<string> {
    const { name } = file
    const ext = path.extname(name)
    const nameWithoutExt = path.basename(name, ext)
    
    switch (options.mode) {
      case 'replace':
        return this.replaceText(name, nameWithoutExt, ext, options)
      
      case 'prefix':
        return `${options.prefix}${name}`
      
      case 'suffix':
        if (options.beforeExt && !file.isDirectory) {
          return `${nameWithoutExt}${options.suffix}${ext}`
        } else {
          return `${name}${options.suffix}`
        }
      
      case 'template':
        return this.applyTemplate(file, nameWithoutExt, ext, options)
      
      case 'sequence':
        return this.applySequence(file, nameWithoutExt, ext, options)
      
      case 'case':
        return this.changeCase(name, nameWithoutExt, ext, options)
      
      case 'regex':
        return this.applyRegex(name, options)
      
      default:
        return name
    }
  }

  /**
   * 替换文本模式
   */
  private replaceText(
    name: string,
    nameWithoutExt: string,
    ext: string,
    options: { find: string; replace: string; caseSensitive: boolean }
  ): string {
    const { find, replace, caseSensitive } = options
    
    if (!find) return name
    
    const flags = caseSensitive ? 'g' : 'gi'
    const regex = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags)
    
    return name.replace(regex, replace)
  }

  /**
   * 应用模板模式
   */
  private applyTemplate(
    file: { path: string; name: string; isDirectory: boolean },
    nameWithoutExt: string,
    ext: string,
    options: { template: string }
  ): string {
    const { template } = options
    
    // 获取当前日期和时间
    const now = new Date()
    const date = now.toISOString().split('T')[0]
    const time = now.toTimeString().split(' ')[0].replace(/:/g, '-')
    
    // 获取父文件夹名称
    const parentDir = path.basename(path.dirname(file.path))
    
    // 替换模板变量
    return template
      .replace(/{name}/g, nameWithoutExt)
      .replace(/{ext}/g, ext.replace('.', ''))
      .replace(/{date}/g, date)
      .replace(/{time}/g, time)
      .replace(/{parent}/g, parentDir)
  }

  /**
   * 应用序号模式
   */
  private applySequence(
    file: { path: string; name: string; isDirectory: boolean },
    nameWithoutExt: string,
    ext: string,
    options: { baseName: string; startNumber: number; padding: number; keepExt: boolean }
  ): string {
    const { baseName, startNumber, padding, keepExt } = options
    
    // 获取文件在列表中的索引
    const index = parseInt(path.basename(file.path).match(/\d+/)?.[0] || '0', 10) || 0
    
    // 生成序号
    const number = startNumber + index
    const paddedNumber = number.toString().padStart(padding, '0')
    
    // 组合新文件名
    if (keepExt && !file.isDirectory) {
      return `${baseName}${paddedNumber}${ext}`
    } else {
      return `${baseName}${paddedNumber}`
    }
  }

  /**
   * 修改大小写模式
   */
  private changeCase(
    name: string,
    nameWithoutExt: string,
    ext: string,
    options: { caseType: string; caseExtension: boolean }
  ): string {
    const { caseType, caseExtension } = options
    
    let newName: string
    let newExt: string = ext
    
    // 处理文件名部分
    switch (caseType) {
      case 'upper':
        newName = nameWithoutExt.toUpperCase()
        break
      case 'lower':
        newName = nameWithoutExt.toLowerCase()
        break
      case 'title':
        newName = nameWithoutExt
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ')
        break
      default:
        newName = nameWithoutExt
    }
    
    // 处理扩展名部分
    if (caseExtension) {
      switch (caseType) {
        case 'upper':
          newExt = ext.toUpperCase()
          break
        case 'lower':
          newExt = ext.toLowerCase()
          break
        case 'title':
          // 扩展名通常不使用标题大小写
          newExt = ext.toLowerCase()
          break
      }
    }
    
    return `${newName}${newExt}`
  }

  /**
   * 应用正则表达式模式
   */
  private applyRegex(
    name: string,
    options: { regex: string; regexReplace: string; regexGlobal: boolean; regexCaseSensitive: boolean }
  ): string {
    const { regex, regexReplace, regexGlobal, regexCaseSensitive } = options
    
    if (!regex) return name
    
    try {
      const flags = `${regexGlobal ? 'g' : ''}${regexCaseSensitive ? '' : 'i'}`
      const re = new RegExp(regex, flags)
      return name.replace(re, regexReplace)
    } catch (error) {
      throw new Error(`Invalid regular expression: ${error.message}`)
    }
  }

  /**
   * 检查文件名是否有效
   */
  private isValidFileName(name: string): boolean {
    // Windows文件名不能包含以下字符: \ / : * ? " < > |
    const invalidChars = /[\\/:*?"<>|]/
    return !invalidChars.test(name) && name.trim() !== '' && name !== '.' && name !== '..'
  }

  /**
   * 检查是否存在命名冲突
   */
  private async checkNameConflict(filePath: string, newName: string): Promise<boolean> {
    const dir = path.dirname(filePath)
    const newPath = path.join(dir, newName)
    
    // 如果新路径与原路径相同，则没有冲突
    if (filePath === newPath) return false
    
    // 检查新路径是否已存在
    return this.fileExists(newPath)
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
}