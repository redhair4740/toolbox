import { ipcMain, dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import { FileOperationManager } from './file/operations'
import { FileSearchManager } from './file/search'
import { FileRenameManager } from './file/rename'
import { EnhancedFileOperations } from './file/enhanced-operations'
import { EnhancedSearch } from './file/enhanced-search'
import { handleError } from '../utils/error-handler'
import { ProgressCallback } from '../utils/progress'

export class FileService {
  private operationManager: FileOperationManager
  private searchManager: FileSearchManager
  private renameManager: FileRenameManager
  private enhancedOps: EnhancedFileOperations
  private enhancedSearch: EnhancedSearch
  private static handlersRegistered = false

  constructor() {
    this.operationManager = new FileOperationManager()
    this.searchManager = new FileSearchManager()
    this.renameManager = new FileRenameManager()
    this.enhancedOps = new EnhancedFileOperations()
    this.enhancedSearch = new EnhancedSearch()

    // 只在第一次实例化时注册处理程序
    if (!FileService.handlersRegistered) {
      this.registerHandlers()
      FileService.handlersRegistered = true
    }
  }

  private registerHandlers() {
    // 文件列表操作
    ipcMain.handle('file:list', (_, args) => this.listFiles(args))
    ipcMain.handle('file:stats', (_, args) => this.getFileStats(args))
    ipcMain.handle('file:exists', (_, args) => this.checkFileExists(args))

    // 基础文件操作
    ipcMain.handle('file:copy', (_, args) => this.copyFiles(args))
    ipcMain.handle('file:move', (_, args) => this.moveFiles(args))
    ipcMain.handle('file:delete', (_, args) => this.deleteFiles(args))
    ipcMain.handle('file:read', (_, args) => this.readFile(args))
    ipcMain.handle('file:write', (_, args) => this.writeFile(args))

    // 搜索相关
    ipcMain.handle('file:search', (_, args) => this.searchInFiles(args))
    ipcMain.handle('file:quickSearch', (_, args) => this.quickSearch(args))
    ipcMain.handle('file:cancelSearch', () => this.cancelSearch())

    // 重命名相关
    ipcMain.handle('file:previewRename', (_, args) => this.previewRename(args))
    ipcMain.handle('file:rename', (_, args) => this.renameFiles(args))

    // 对话框操作
    ipcMain.handle('file:selectPath', (_, args) => this.selectPath(args))
    ipcMain.handle('file:saveFile', (_, args) => this.saveFile(args))

    // 操作控制
    ipcMain.handle('file:cancelOperation', () => this.cancelOperation())
  }

  // 文件列表操作
  async listFiles(options: {
    directory: string
    recursive?: boolean
    pattern?: string
    excludePattern?: string
    useRegex?: boolean
  }) {
    try {
      return await this.enhancedOps.listFiles(options)
    } catch (error) {
      throw handleError(error, 'Failed to list files')
    }
  }

  async getFileStats(filePath: string) {
    try {
      const stats = await fs.promises.stat(filePath)
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        accessed: stats.atime,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile()
      }
    } catch (error) {
      throw handleError(error, 'Failed to get file stats')
    }
  }

  async checkFileExists(filePath: string) {
    try {
      await fs.promises.access(filePath)
      return true
    } catch {
      return false
    }
  }

  // 基础文件操作
  async copyFiles(options: {
    files: string[]
    targetPath: string
    preserveStructure?: boolean
    conflictStrategy?: 'ask' | 'overwrite' | 'skip' | 'rename'
    parallel?: boolean
    maxParallel?: number
  }, progressCallback?: ProgressCallback) {
    try {
      return await this.operationManager.copyFiles(options, progressCallback as any)
    } catch (error) {
      throw handleError(error, 'Failed to copy files')
    }
  }

  async moveFiles(options: {
    files: string[]
    targetPath: string
    preserveStructure?: boolean
    conflictStrategy?: 'ask' | 'overwrite' | 'skip' | 'rename'
    parallel?: boolean
    maxParallel?: number
  }, progressCallback?: ProgressCallback) {
    try {
      return await this.operationManager.moveFiles(options, progressCallback as any)
    } catch (error) {
      throw handleError(error, 'Failed to move files')
    }
  }

  async deleteFiles(options: {
    files: string[]
    parallel?: boolean
    maxParallel?: number
  }, progressCallback?: ProgressCallback) {
    try {
      return await this.operationManager.deleteFiles(options, progressCallback as any)
    } catch (error) {
      throw handleError(error, 'Failed to delete files')
    }
  }

  async readFile(options: {
    path: string
    encoding?: BufferEncoding
  }) {
    try {
      return await fs.promises.readFile(options.path, options.encoding || 'utf8')
    } catch (error) {
      throw handleError(error, 'Failed to read file')
    }
  }

  async writeFile(options: {
    path: string
    content: string | Buffer
    encoding?: BufferEncoding
  }) {
    try {
      await fs.promises.writeFile(options.path, options.content, options.encoding)
      return true
    } catch (error) {
      throw handleError(error, 'Failed to write file')
    }
  }

  // 搜索相关
  async searchInFiles(options: {
    directory: string
    content: string
    pattern?: string
    excludePatterns?: string[]
    recursive?: boolean
    caseSensitive?: boolean
    useRegex?: boolean
    maxFileSize?: number
    threads?: number
  }, progressCallback?: ProgressCallback) {
    try {
      return await this.searchManager.searchInFiles(options, progressCallback as any)
    } catch (error) {
      throw handleError(error, 'Failed to search in files')
    }
  }

  async quickSearch(options: {
    directory: string
    query: string
    maxResults?: number
  }) {
    try {
      return await this.enhancedSearch.quickSearch(options)
    } catch (error) {
      throw handleError(error, 'Failed to perform quick search')
    }
  }

  async cancelSearch() {
    try {
      await this.searchManager.cancelSearch()
      return true
    } catch (error) {
      throw handleError(error, 'Failed to cancel search')
    }
  }

  // 重命名相关
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
  }) {
    try {
      return await this.renameManager.previewRename(options)
    } catch (error) {
      throw handleError(error, 'Failed to preview rename')
    }
  }

  async renameFiles(options: {
    files: Array<{
      path: string
      newName: string
    }>
    options?: {
      [key: string]: any
    }
  }, progressCallback?: ProgressCallback) {
    try {
      return await this.renameManager.renameFiles(options, progressCallback)
    } catch (error) {
      throw handleError(error, 'Failed to rename files')
    }
  }

  // 对话框操作
  async selectPath(options: {
    title?: string
    defaultPath?: string
    filters?: Array<{ name: string; extensions: string[] }>
    properties?: Array<
      | 'openFile'
      | 'openDirectory'
      | 'multiSelections'
      | 'showHiddenFiles'
      | 'createDirectory'
      | 'promptToCreate'
      | 'noResolveAliases'
      | 'treatPackageAsDirectory'
      | 'dontAddToRecent'
    >
  }) {
    try {
      const result = await dialog.showOpenDialog({
        title: options.title,
        defaultPath: options.defaultPath,
        filters: options.filters,
        properties: options.properties || ['openFile']
      })

      return result.filePaths
    } catch (error) {
      throw handleError(error, 'Failed to show path selection dialog')
    }
  }

  async saveFile(options: {
    title?: string
    defaultPath?: string
    filters?: Array<{ name: string; extensions: string[] }>
    content: string | Buffer
    encoding?: BufferEncoding
  }) {
    try {
      const result = await dialog.showSaveDialog({
        title: options.title,
        defaultPath: options.defaultPath,
        filters: options.filters
      })

      if (result.filePath) {
        await fs.promises.writeFile(
          result.filePath,
          options.content,
          options.encoding
        )
        return result.filePath
      }

      return null
    } catch (error) {
      throw handleError(error, 'Failed to save file')
    }
  }

  // 操作控制
  async cancelOperation() {
    try {
      await this.operationManager.cancelOperation()
      return true
    } catch (error) {
      throw handleError(error, 'Failed to cancel operation')
    }
  }

  // 实现ipc-handlers.ts中使用的方法
  async searchFiles(
    dirPath: string,
    extensions: string[],
    progressCallback?: ProgressCallback
  ) {
    try {
      return await this.enhancedSearch.searchFiles({
        directory: dirPath,
        pattern: extensions.length ? `*.{${extensions.join(',')}}` : undefined
      }, progressCallback as any)
    } catch (error) {
      throw handleError(error, 'Failed to search files')
    }
  }
  
  async moveFile(source: string, destination: string, fileName?: string) {
    try {
      const targetPath = fileName ? path.join(destination, fileName) : destination
      return await this.operationManager.moveFiles({
        files: [source],
        targetPath: path.dirname(targetPath),
        conflictStrategy: 'overwrite'
      })
    } catch (error) {
      throw handleError(error, 'Failed to move file')
    }
  }
  
  async batchMoveFiles(
    files: string[],
    destination: string,
    progressCallback?: ProgressCallback,
    fileTypeFilter?: string[]
  ) {
    try {
      // 如果指定了文件类型过滤器，先过滤文件
      const filesToProcess = files;
      
      if (fileTypeFilter && fileTypeFilter.length > 0) {
        // 简化实现，直接使用ID列表，不进行额外的过滤
        // 实际过滤将由前端完成
      }
      
      return await this.operationManager.moveFiles({
        files: filesToProcess,
        targetPath: destination,
        conflictStrategy: 'overwrite'
      }, progressCallback as any);
    } catch (error) {
      throw handleError(error, 'Failed to batch move files');
    }
  }
  
  async cleanup() {
    try {
      await this.searchManager.cancelSearch()
      await this.operationManager.cancelOperation()
      return true
    } catch (error) {
      throw handleError(error, 'Failed to cleanup resources')
    }
  }
}