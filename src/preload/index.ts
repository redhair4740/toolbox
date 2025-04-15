import { contextBridge, ipcRenderer } from 'electron' // 移除 IpcRendererEvent
import { electronAPI } from '@electron-toolkit/preload'

// 进度事件监听器类型
type ProgressListener = (progress: { current: number; total: number; file: string }) => void

// 文件操作选项类型
interface FileOperationOptions {
  files: string[];
  targetPath: string;
  preserveStructure?: boolean;
  conflictStrategy?: 'ask' | 'overwrite' | 'skip' | 'rename';
}

// 存储事件监听器
const listeners = {
  searchProgress: new Set<ProgressListener>(),
  contentSearchProgress: new Set<ProgressListener>(),
  moveProgress: new Set<ProgressListener>(),
  renameProgress: new Set<ProgressListener>()
}

// 设置IPC事件监听
ipcRenderer.on('search-progress', (_, data) => {
  listeners.searchProgress.forEach(listener => listener(data))
})

ipcRenderer.on('content-search-progress', (_, data) => {
  listeners.contentSearchProgress.forEach(listener => listener(data))
})

ipcRenderer.on('move-progress', (_, data) => {
  listeners.moveProgress.forEach(listener => listener(data))
})

ipcRenderer.on('rename-progress', (_, data) => {
  listeners.renameProgress.forEach(listener => listener(data))
})

// Custom APIs for renderer (保持原有 API)
const api = {
  // 目录对话框
  openDirectoryDialog: () => ipcRenderer.invoke('open-directory-dialog'),
  
  // 路径选择器
  selectPath: (options: {
    title?: string,
    defaultPath?: string,
    filters?: Array<{ name: string; extensions: string[] }>,
    properties?: string[]
  }) => ipcRenderer.invoke('select-path', options),
  
  selectSavePath: (options: {
    title?: string,
    defaultPath?: string,
    filters?: Array<{ name: string; extensions: string[] }>
  }) => ipcRenderer.invoke('select-save-path', options),
  
  // 文件搜索
  searchFiles: (path: string, extensions: string[]) =>
    ipcRenderer.invoke('search-files', { path, extensions }),
  onSearchProgress: (callback: ProgressListener) => {
    listeners.searchProgress.add(callback)
    return () => listeners.searchProgress.delete(callback)
  },
  
  // 文件内容搜索
  searchInFiles: (files: string[], searchText: string, ignoreCase: boolean = false) =>
    ipcRenderer.invoke('search-in-files', { files, searchText, ignoreCase }),
  onContentSearchProgress: (callback: ProgressListener) => {
    listeners.contentSearchProgress.add(callback)
    return () => listeners.contentSearchProgress.delete(callback)
  },
  cancelSearch: () => ipcRenderer.invoke('cancel-search'),
  
  // 文件移动
  moveFileSimple: (source: string, destination: string, fileName: string) =>
    ipcRenderer.invoke('move-file', { source, destination, fileName }),
  batchMoveFiles: (files: { source: string; fileName: string }[], destination: string) =>
    ipcRenderer.invoke('batch-move-files', { files, destination }),
  onMoveProgress: (callback: ProgressListener) => {
    listeners.moveProgress.add(callback)
    return () => {
      listeners.moveProgress.delete(callback)
    }
  },
  
  // 文件重命名
  renameFile: (
    filePath: string, 
    searchText: string, 
    replaceText: string, 
    options: { ignoreCase?: boolean, caseConversion?: string } = { ignoreCase: false, caseConversion: 'none' }
  ) => ipcRenderer.invoke('rename-file', { 
    filePath, 
    searchText, 
    replaceText, 
    ignoreCase: options.ignoreCase, 
    caseConversion: options.caseConversion 
  }),
  batchRenameFiles: (
    files: string[], 
    searchText: string, 
    replaceText: string, 
    options: { ignoreCase?: boolean, caseConversion?: string } = { ignoreCase: false, caseConversion: 'none' }
  ) => ipcRenderer.invoke('batch-rename-files', { 
    files, 
    searchText, 
    replaceText, 
    ignoreCase: options.ignoreCase, 
    caseConversion: options.caseConversion 
  }),
  onRenameProgress: (callback: ProgressListener) => {
    listeners.renameProgress.add(callback)
    return () => listeners.renameProgress.delete(callback)
  },
  
  // 文件操作
  getFileInfo: (filePath: string) => 
    ipcRenderer.invoke('file:stats', filePath),
  getFileList: (dirPath: string, options: { 
    recursive?: boolean, 
    fileTypeFilter?: string[], 
    includeDirectories?: boolean 
  }) => {
    // 简单的参数验证
    if (!dirPath || typeof dirPath !== 'string') {
      return Promise.reject(new Error('无效的目录路径'));
    }
    
    // 准备扩展名模式
    let pattern: string | undefined = undefined;
    if (options.fileTypeFilter && Array.isArray(options.fileTypeFilter) && options.fileTypeFilter.length > 0) {
      try {
        // 将扩展名数组转换为通配符模式
        const extensionPatterns = options.fileTypeFilter
          .filter(ext => typeof ext === 'string' && ext.trim())
          .map(ext => `*.${ext.trim().replace(/^\./, '')}`);
        
        if (extensionPatterns.length > 0) {
          pattern = extensionPatterns.join('|');
        }
      } catch (err) {
        console.error('处理文件扩展名失败:', err);
      }
    }
    
    // 发送到主进程
    return ipcRenderer.invoke('file:list', { 
      directory: dirPath, 
      recursive: options.recursive,
      pattern: pattern,
      includeDirectories: options.includeDirectories
    });
  },
  copyFile: (options: FileOperationOptions, callback?: ProgressListener) => {
    if (callback) {
      listeners.moveProgress.add(callback)
      return ipcRenderer.invoke('file:copy', options)
        .finally(() => listeners.moveProgress.delete(callback))
    }
    return ipcRenderer.invoke('file:copy', options)
  },
  moveFile: (options: FileOperationOptions, callback?: ProgressListener) => {
    if (callback) {
      listeners.moveProgress.add(callback)
      return ipcRenderer.invoke('file:move', options)
        .finally(() => listeners.moveProgress.delete(callback))
    }
    return ipcRenderer.invoke('file:move', options)
  },
  cancelOperation: () => ipcRenderer.invoke('file:cancelOperation'),
  saveTextFile: (options: { content: string, fileName: string, title?: string }) =>
    ipcRenderer.invoke('file:write', {
      path: options.fileName,
      content: options.content
    })
}

// --- 新增自定义标题栏 API 对象 ---
const titlebarAPI = {
  sendMinimize: () => ipcRenderer.send('minimize-window'),
  sendMaximizeRestore: () => ipcRenderer.send('maximize-restore-window'),
  sendClose: () => ipcRenderer.send('close-window'),
  onWindowStateChange: (callback: (isMaximized: boolean) => void) => {
    // 注意：这里没有使用 event 参数，所以不需要 IpcRendererEvent 类型
    const listener = (_event: unknown, isMaximized: boolean) => callback(isMaximized)
    ipcRenderer.on('window-maximized-state', listener)
    // 返回一个移除监听器的函数，以便组件卸载时清理
    return () => {
      ipcRenderer.removeListener('window-maximized-state', listener)
    }
  }
}
// --- 结束新增 ---

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', {
      ...electronAPI,
      system: {
        getInfo: () => ipcRenderer.invoke('system:getInfo')
      },
      shell: {
        openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url)
      },
      ipcRenderer: {
        invoke: (channel: string, ...args: unknown[]) => {
          const validChannels = [
            'select-path',
            'select-save-path'
          ]
          if (validChannels.includes(channel)) {
            return ipcRenderer.invoke(channel, ...args)
          }
          throw new Error(`无效的IPC通道: ${channel}`)
        }
      }
    })
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('titlebarAPI', titlebarAPI) // 暴露新的 API
  } catch (error) {
    console.error('无法暴露API到渲染进程:', error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = {
    ...electronAPI,
    system: {
      getInfo: () => ipcRenderer.invoke('system:getInfo')
    },
    shell: {
      openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url)
    },
    ipcRenderer: {
      invoke: (channel: string, ...args: unknown[]) => {
        const validChannels = [
          'select-path',
          'select-save-path'
        ]
        if (validChannels.includes(channel)) {
          return ipcRenderer.invoke(channel, ...args)
        }
        throw new Error(`无效的IPC通道: ${channel}`)
      }
    }
  }
  // @ts-ignore (define in dts)
  window.api = api
  // @ts-ignore (define in dts)
  window.titlebarAPI = titlebarAPI // 在非隔离环境暴露新的 API
}
