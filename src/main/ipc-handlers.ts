import { BrowserWindow, dialog, ipcMain } from 'electron'
import { 
  searchFiles, 
  cutFileToDirectory, 
  renameFile, 
  batchMoveFiles, 
  batchRenameFiles,
  searchInFiles
} from './services/file'

// 设置IPC处理器
export function setupIpcHandlers(mainWindow: BrowserWindow): void {
  // 打开文件夹选择对话框
  ipcMain.handle('open-directory-dialog', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    })
    
    if (result.canceled) {
      return null
    }
    
    return result.filePaths[0]
  })
  
  // 搜索文件
  ipcMain.handle('search-files', async (_, { path: dirPath, extensions }) => {
    // 创建进度通知函数
    const progressCallback = (current: number, total: number, file: string) => {
      mainWindow.webContents.send('search-progress', { current, total, file })
    }
    
    return await searchFiles(dirPath, extensions, progressCallback)
  })
  
  // 文件内容搜索
  ipcMain.handle('search-in-files', async (_, { files, searchText, ignoreCase }) => {
    // 创建进度通知函数
    const progressCallback = (current: number, total: number, file: string) => {
      mainWindow.webContents.send('content-search-progress', { current, total, file })
    }
    
    return await searchInFiles(files, searchText, ignoreCase, progressCallback)
  })
  
  // 剪切文件
  ipcMain.handle('cut-file', async (_, { source, destination, fileName }) => {
    return await cutFileToDirectory(source, destination, fileName)
  })
  
  // 批量移动文件
  ipcMain.handle('batch-move-files', async (_, { files, destination }) => {
    // 创建进度通知函数
    const progressCallback = (current: number, total: number, file: string) => {
      mainWindow.webContents.send('move-progress', { current, total, file })
    }
    
    return await batchMoveFiles(files, destination, progressCallback)
  })
  
  // 重命名文件
  ipcMain.handle('rename-file', async (_, { filePath, searchText, replaceText, ignoreCase, caseConversion }) => {
    return await renameFile(filePath, searchText, replaceText, { ignoreCase, caseConversion })
  })
  
  // 批量重命名文件
  ipcMain.handle('batch-rename-files', async (_, { files, searchText, replaceText, ignoreCase, caseConversion }) => {
    // 创建进度通知函数
    const progressCallback = (current: number, total: number, file: string) => {
      mainWindow.webContents.send('rename-progress', { current, total, file })
    }
    
    return await batchRenameFiles(
      files, 
      searchText, 
      replaceText, 
      { ignoreCase, caseConversion }, 
      progressCallback
    )
  })
  
  // 简单的ping测试
  ipcMain.on('ping', () => console.log('pong'))
}