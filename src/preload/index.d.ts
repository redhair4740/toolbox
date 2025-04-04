import { ElectronAPI } from '@electron-toolkit/preload'

// 进度事件类型
interface ProgressEvent {
  current: number
  total: number
  file: string
}

// 进度监听器类型
type ProgressListener = (progress: ProgressEvent) => void

// 批量操作结果类型
interface BatchOperationResult {
  success: number
  failed: number
  errors: string[]
}

// 文件内容搜索结果类型
interface ContentSearchResult {
  filePath: string
  fileName: string
  matches: string[]
  lineNumbers: number[]
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      // 目录对话框
      openDirectoryDialog: () => Promise<string | null>
      
      // 文件搜索
      searchFiles: (
        path: string,
        extensions: string[]
      ) => Promise<import('../types/file-types').FileWithFullPath[]>
      onSearchProgress: (callback: ProgressListener) => () => boolean
      
      // 文件内容搜索
      searchInFiles: (
        files: string[],
        searchText: string,
        ignoreCase?: boolean
      ) => Promise<ContentSearchResult[]>
      onContentSearchProgress: (callback: ProgressListener) => () => boolean
      
      // 文件移动
      cutFile: (source: string, destination: string, fileName: string) => Promise<string>
      batchMoveFiles: (
        files: { source: string; fileName: string }[],
        destination: string
      ) => Promise<BatchOperationResult>
      onMoveProgress: (callback: ProgressListener) => () => boolean
      
      // 文件重命名
      renameFile: (
        filePath: string,
        searchText: string,
        replaceText: string,
        options?: { ignoreCase?: boolean, caseConversion?: string }
      ) => Promise<{
        success: boolean
        message: string
        newPath?: string
      }>
      batchRenameFiles: (
        files: string[],
        searchText: string,
        replaceText: string,
        options?: { ignoreCase?: boolean, caseConversion?: string }
      ) => Promise<BatchOperationResult>
      onRenameProgress: (callback: ProgressListener) => () => boolean
    }
    // --- 新增自定义标题栏 API ---
    electronAPI: {
      sendMinimize: () => void
      sendMaximizeRestore: () => void
      sendClose: () => void
      onWindowStateChange: (callback: (isMaximized: boolean) => void) => void
    }
    // --- 结束新增 ---
  }
}
