import { BrowserWindow, shell, nativeTheme } from 'electron'
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
    backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff', // 根据主题设置背景色
    titleBarStyle: 'default',
    titleBarOverlay: {
      color: isDarkMode ? '#252525' : '#ffffff',
      symbolColor: isDarkMode ? '#e0e0e0' : '#303133'
    },
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // 监听系统主题变化
  nativeTheme.on('updated', () => {
    const isDark = nativeTheme.shouldUseDarkColors
    mainWindow.setTitleBarOverlay({
      color: isDark ? '#252525' : '#ffffff',
      symbolColor: isDark ? '#e0e0e0' : '#303133'
    })
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

  return mainWindow
} 