import { BrowserWindow, dialog, ipcMain } from 'electron'
import * as fs from 'fs'
import path from 'node:path'

// 类型定义
interface FileWithFullPath {
  fullPath: string
  fileName: string
  targetPath: string
}

// 文件查找函数
async function searchFiles(dir: string, extensions: string[]): Promise<FileWithFullPath[]> {
  try {
    const files: FileWithFullPath[] = []
    const items = await fs.promises.readdir(dir, { withFileTypes: true })

    for (const item of items) {
      const fullPath = path.join(dir, item.name)

      if (item.isDirectory()) {
        // 递归搜索子目录
        const subDirFiles = await searchFiles(fullPath, extensions)
        files.push(...subDirFiles)
      } else if (item.isFile()) {
        const ext = path.extname(item.name).toLowerCase()
        // 如果扩展名在过滤列表中或者没有指定过滤
        if (extensions.length === 0 || extensions.includes(ext)) {
          files.push({
            fullPath,
            fileName: item.name,
            targetPath: '' // 这将在UI层设置
          })
        }
      }
    }

    return files
  } catch (error) {
    console.error('Error searching files:', error)
    return []
  }
}

// 文件剪切函数
async function cutFileToDirectory(
  source: string,
  destination: string,
  fileName: string
): Promise<string> {
  try {
    const destPath = path.join(destination, fileName)
    await fs.promises.mkdir(path.dirname(destPath), { recursive: true })
    await fs.promises.copyFile(source, destPath)
    await fs.promises.unlink(source)
    return destPath
  } catch (error) {
    console.error('Error moving file:', error)
    throw error
  }
}

// 文件重命名函数
async function renameFile(
  filePath: string,
  searchText: string,
  replaceText: string,
  ignoreCase: boolean = false,
  caseConversion: string = 'none'
): Promise<{ success: boolean; message: string; newPath?: string }> {
  try {
    const dir = path.dirname(filePath)
    const fileName = path.basename(filePath)
    
    let newFileName = fileName
    
    // 如果有搜索文本，先进行替换
    if (searchText) {
      // 创建正则表达式，根据是否忽略大小写设置标志
      const flags = ignoreCase ? 'gi' : 'g'
      const regex = new RegExp(searchText, flags)
      
      // 检查文件名是否包含搜索文本（考虑大小写设置）
      if (!regex.test(fileName)) {
        return { success: false, message: '文件名中不包含搜索文本' }
      }
      
      // 替换文本
      newFileName = fileName.replace(regex, replaceText)
    }
    
    // 根据大小写转换选项处理文件名，但保留文件扩展名
    if (caseConversion !== 'none') {
      const ext = path.extname(newFileName)
      const nameWithoutExt = path.basename(newFileName, ext)
      
      if (caseConversion === 'uppercase') {
        newFileName = nameWithoutExt.toUpperCase() + ext
      } else if (caseConversion === 'lowercase') {
        newFileName = nameWithoutExt.toLowerCase() + ext
      }
    }
    
    // 如果没有变化，返回成功状态但不执行重命名
    if (newFileName === fileName) {
      return { success: true, message: '文件名没有变化，无需重命名' }
    }
    
    const newPath = path.join(dir, newFileName)
    
    await fs.promises.rename(filePath, newPath)
    
    return {
      success: true,
      message: '文件重命名成功',
      newPath
    }
  } catch (error) {
    console.error('Error renaming file:', error)
    
    // 使用安全的方式获取错误消息
    let errorMessage = '未知错误';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String(error.message);
    }
    
    return {
      success: false,
      message: `重命名失败: ${errorMessage}`
    }
  }
}

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
    return await searchFiles(dirPath, extensions)
  })
  
  // 剪切文件
  ipcMain.handle('cut-file', async (_, { source, destination, fileName }) => {
    return await cutFileToDirectory(source, destination, fileName)
  })
  
  // 重命名文件
  ipcMain.handle('rename-file', async (_, { filePath, searchText, replaceText, ignoreCase, caseConversion }) => {
    return await renameFile(filePath, searchText, replaceText, ignoreCase, caseConversion)
  })
  
  // 简单的ping测试
  ipcMain.on('ping', () => console.log('pong'))
}