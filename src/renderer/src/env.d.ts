/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 文件相关类型
interface FileWithFullPath {
  fullPath: string
  fileName: string
  targetPath?: string
}

interface FileStats {
  name: string
  path: string
  size: number
  isDirectory: boolean
  items?: number
  totalSize?: number
  created?: string
  modified?: string
  accessed?: string
}

interface FileOperationOptions {
  files: string[]
  targetPath: string
  conflictStrategy: 'ask' | 'overwrite' | 'skip' | 'rename'
  preserveStructure?: boolean
  overwriteConfirm?: boolean
}

interface ProgressCallback {
  (progress: { current: number; total: number; file: string }): void
}

interface SearchResult {
  filePath: string
  matches: Array<{
    line: number
    content: string
    context?: string
  }>
}

interface RenameResult {
  success: boolean
  message: string
}

// API接口
interface API {
  searchFiles: (directory: string, extensions: string[]) => Promise<FileWithFullPath[]>
  getFileList: (directory: string, options: any) => Promise<FileStats[]>
  getFileInfo: (path: string) => Promise<FileStats>
  moveFile: (options: FileOperationOptions, callback?: ProgressCallback) => Promise<void>
  copyFile: (options: FileOperationOptions, callback?: ProgressCallback) => Promise<void>
  renameFile: (filePath: string, searchText: string, replaceText: string, options: any) => Promise<RenameResult>
  cancelOperation: () => Promise<void>
  cancelSearch: () => Promise<void>
  saveTextFile: (options: any) => Promise<void>
  exportSearchResults: (options: any) => Promise<void>
  searchInFiles: (files: FileStats[], content: string, ignoreCase: boolean) => Promise<SearchResult[]>
  onContentSearchProgress: (callback: (progress: { current: number; total: number; file: string; matches?: number }) => void) => () => void
}

// 声明全局window对象的扩展
declare global {
  interface Window {
    api: API
    
    // Electron API
    electron?: {
      // 系统相关
      system?: {
        getInfo: () => Promise<{
          os: string
          arch: string
          nodejs: string
          electron: string
          chrome: string
        }>
      }
      
      // Shell相关
      shell?: {
        openExternal: (url: string) => Promise<void>
      }
      
      // IPC渲染器
      ipcRenderer?: {
        invoke: (channel: string, ...args: any[]) => Promise<any>
        on: (channel: string, listener: (...args: any[]) => void) => void
        off: (channel: string, listener: (...args: any[]) => void) => void
      }
      
      // 文件服务
      fileService?: {
        listFiles: (options: any) => Promise<any>
        getFileInfo: (path: string) => Promise<any>
        searchFiles: (directory: string, extensions: string[], callback?: any) => Promise<any>
        moveFiles: (options: any, callback?: any) => Promise<any>
        copyFiles: (options: any, callback?: any) => Promise<any>
        deleteFiles: (options: any, callback?: any) => Promise<any>
        cancelOperation: () => Promise<void>
        cancelSearch: () => Promise<void>
        saveTextFile: (options: any) => Promise<any>
        exportSearchResults: (options: any) => Promise<any>
      }
    }
    
    // 标题栏API
    titlebarAPI?: {
      sendMinimize: () => void
      sendMaximizeRestore: () => void
      sendClose: () => void
      onWindowStateChange: (callback: (maximized: boolean) => void) => () => void
    }
  }
}

export {}
