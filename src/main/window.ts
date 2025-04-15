import { BrowserWindow, shell, nativeTheme, ipcMain } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import icon from '../../resources/app-icon.svg?asset'

export function setupWindow(): BrowserWindow {
  // 获取系统主题设置
  const isDarkMode = nativeTheme.shouldUseDarkColors

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    frame: false, // 显式设置无边框
    backgroundColor: isDarkMode ? '#252525' : '#ffffff', // 统一暗色背景
    titleBarStyle: 'hidden', // 保持 hidden, 但移除 overlay
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // 移除 nativeTheme 更新 titleBarOverlay 的监听器

  // --- 新增 IPC 监听器 ---
  ipcMain.on('minimize-window', () => {
    mainWindow?.minimize()
  })

  ipcMain.on('maximize-restore-window', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow?.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })

  ipcMain.on('close-window', () => {
    mainWindow?.close()
  })

  // --- 新增窗口状态监听器 ---
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-maximized-state', true)
  })

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-maximized-state', false)
  })
  // --- 结束新增 ---
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

  return mainWindow
} 