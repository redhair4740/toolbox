import { BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { FileService } from './services/file-service'
import path from 'path'
import os from 'os'

/**
 * IPC处理器类
 * 处理主进程和渲染进程之间的通信
 */
export class IpcHandlers {
  private fileService: FileService
  private mainWindow: BrowserWindow
  
  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
    this.fileService = new FileService()
    this.setupHandlers()
  }
  
  /**
   * 设置所有IPC处理器
   */
  private setupHandlers(): void {
    // 系统信息
    ipcMain.handle('system:getInfo', (): {
      os: string;
      arch: string;
      nodejs: string;
      electron: string;
      chrome: string;
    } => {
      return {
        os: `${os.type()} ${os.release()}`,
        arch: os.arch(),
        nodejs: process.version,
        electron: process.versions.electron,
        chrome: process.versions.chrome
      }
    })

    // 打开外部链接
    ipcMain.handle('shell:openExternal', async (_, url: string) => {
      if (typeof url !== 'string') {
        throw new Error('URL必须是字符串类型')
      }
      
      // 验证URL格式
      if (!url.startsWith('https://') && !url.startsWith('http://')) {
        throw new Error('仅支持http和https协议')
      }
      
      return await shell.openExternal(url)
    })

    // 打开文件夹选择对话框
    ipcMain.handle('open-directory-dialog', async () => {
      const result = await dialog.showOpenDialog(this.mainWindow, {
        properties: ['openDirectory']
      })
      
      if (result.canceled) {
        return null
      }
      
      return result.filePaths[0]
    })
    
    // 通用路径选择器对话框
    ipcMain.handle('select-path', async (_, options: {
      title?: string,
      defaultPath?: string,
      filters?: Array<{ name: string; extensions: string[] }>,
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
    }) => {
      const result = await dialog.showOpenDialog(this.mainWindow, {
        title: options.title,
        defaultPath: options.defaultPath,
        filters: options.filters,
        properties: options.properties || ['openFile']
      })
      
      if (result.canceled) {
        return null
      }
      
      return result.filePaths
    })
    
    // 文件保存对话框
    ipcMain.handle('select-save-path', async (_, options: {
      title?: string,
      defaultPath?: string,
      filters?: Array<{ name: string; extensions: string[] }>
    }) => {
      const result = await dialog.showSaveDialog(this.mainWindow, {
        title: options.title,
        defaultPath: options.defaultPath,
        filters: options.filters
      })
      
      if (result.canceled) {
        return null
      }
      
      return result.filePath
    })
    
    // 搜索文件
    ipcMain.handle('search-files', async (_, { path: dirPath, extensions }) => {
      return await this.fileService.searchFiles(
        dirPath,
        extensions,
        this.createProgressCallback('search-progress')
      )
    })
    
    // 文件内容搜索
    ipcMain.handle('search-in-files', async (_, { files, searchText, ignoreCase }) => {
      return await this.fileService.searchInFiles({
        directory: files[0] ? path.dirname(files[0]) : '',
        content: searchText,
        pattern: files.map(f => path.basename(f)).join('|'),
        caseSensitive: !ignoreCase
      }, this.createProgressCallback('content-search-progress'))
    })
    
    // 取消搜索
    ipcMain.handle('cancel-search', async () => {
      return await this.fileService.cancelSearch()
    })
    
    // 移动单个文件
    ipcMain.handle('move-file', async (_, { source, destination, fileName }) => {
      return await this.fileService.moveFile(source, destination, fileName)
    })
    
    // 批量移动文件
    ipcMain.handle('batch-move-files', async (_, { files, destination, fileTypeFilter }) => {
      return await this.fileService.batchMoveFiles(
        files,
        destination,
        this.createProgressCallback('move-progress'),
        fileTypeFilter || []
      )
    })
    
    // 简单的ping测试
    ipcMain.on('ping', () => console.log('pong'))
    
    // 窗口关闭时清理资源
    this.mainWindow.on('closed', async () => {
      await this.cleanup()
    })
  }
  
  /**
   * 创建进度回调函数
   */
  private createProgressCallback(channel: string) {
    return (event: { 
      current: number; 
      total: number; 
      percentage: number;
      status?: string;
      details?: Record<string, unknown>;
    }) => {
      this.mainWindow.webContents.send(channel, event)
    }
  }
  
  /**
   * 清理资源
   */
  private async cleanup(): Promise<void> {
    await this.fileService.cleanup()
  }
}

/**
 * 设置IPC处理器
 */
export function setupIpcHandlers(mainWindow: BrowserWindow): void {
  new IpcHandlers(mainWindow)
}