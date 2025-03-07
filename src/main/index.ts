import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { join } from 'path'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import * as fs from 'fs'
import path from 'node:path'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.

// 处理选择目录的请求
ipcMain.handle('open-directory-dialog', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    if (!result.canceled) {
      return result.filePaths[0]
    }
    return null
  } catch (error) {
    console.error('Error opening directory dialog:', error)
    return null
  }
})

// 定义搜索文件的方法
ipcMain.handle('search-files', async (_event, { path: path2, extensions }) => {
  try {
    return await searchFiles(path2, extensions)
  } catch (error) {
    console.error('Error searching files:', error)
    return []
  }
})

// 辅助函数：递归搜索文件
interface FileWithFullPath {
  fullPath: string
  fileName: string
  targetPath: string
}

async function searchFiles(dir: string, extensions: string[]): Promise<FileWithFullPath[]> {
  const files: FileWithFullPath[] = []

  const items = await fs.promises.readdir(dir, { withFileTypes: true })

  for (const item of items) {
    const fullPath = path.join(dir, item.name)
    if (item.isDirectory()) {
      files.push(...(await searchFiles(fullPath, extensions)))
    } else if (item.isFile() && extensions.includes(path.extname(item.name).toLowerCase())) {
      files.push({
        fullPath: fullPath,
        fileName: item.name,
        targetPath: ''
      })
    }
  }

  return files
}

// 在ipcMain中监听剪切文件事件
ipcMain.handle('cut-file', async (_event, { source, destination, fileName }): Promise<string> => {
  try {
    return await cutFileToDirectory(source, destination, fileName)
  } catch (error) {
    const err = error as Error
    return err.message
  }
})

// 定义剪切文件的函数
async function cutFileToDirectory(
  source: string,
  destination: string,
  fileName: string
): Promise<string> {
  // eslint-disable-next-line no-useless-catch
  let targetPath
  // eslint-disable-next-line no-useless-catch
  try {
    // 确保目标路径是完整的
    targetPath = path.resolve(path.join(destination, fileName))

    // 检查源文件是否存在
    await new Promise((resolve, reject) => {
      fs.access(source, fs.constants.F_OK, (err) => {
        if (err) {
          reject(err)
        } else {
          resolve('')
        }
      })
    })

    // 尝试直接重命名文件
    if (fs.existsSync(targetPath)) {
      throw new Error(`文件已存在: ${targetPath}`)
    }

    await new Promise((resolve, reject) => {
      fs.rename(source, targetPath, (err) => {
        if (err) {
          if (err.code === 'EXDEV') {
            // 跨设备复制和删除
            fs.copyFile(source, targetPath, (copyErr) => {
              if (copyErr) {
                reject(copyErr)
              } else {
                fs.unlink(source, (unlinkErr) => {
                  if (unlinkErr) {
                    reject(unlinkErr)
                  } else {
                    resolve('')
                  }
                })
              }
            })
          } else {
            reject(err)
          }
        } else {
          resolve('')
        }
      })
    })
  } catch (error) {
    throw error
  }

  return targetPath
}

// 在ipcMain中监听重命名文件事件
ipcMain.handle('rename-file', async (_event, { filePath, searchText, replaceText }) => {
  try {
    return await renameFile(filePath, searchText, replaceText)
  } catch (error) {
    const err = error as Error
    return { success: false, message: err.message }
  }
})

// 定义重命名文件的函数
async function renameFile(
  filePath: string,
  searchText: string,
  replaceText: string
): Promise<{ success: boolean; message: string; newPath?: string }> {
  try {
    // 获取文件的目录和文件名
    const dir = path.dirname(filePath)
    const fileName = path.basename(filePath)

    // 替换文件名中的文本
    const newFileName = fileName.replace(new RegExp(searchText, 'g'), replaceText)

    // 如果文件名没有变化，不需要重命名
    if (newFileName === fileName) {
      return { success: false, message: '文件名未发生变化' }
    }

    // 构建新的文件路径
    const newFilePath = path.join(dir, newFileName)

    // 检查新文件名是否已存在
    if (fs.existsSync(newFilePath)) {
      return { success: false, message: `文件已存在: ${newFilePath}` }
    }

    // 重命名文件
    await fs.promises.rename(filePath, newFilePath)

    return {
      success: true,
      message: '文件重命名成功',
      newPath: newFilePath
    }
  } catch (error) {
    const err = error as Error
    return { success: false, message: err.message }
  }
}
