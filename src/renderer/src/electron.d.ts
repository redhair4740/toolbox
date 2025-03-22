import { ElectronAPI } from '@electron-toolkit/preload'

interface SystemInfo {
  platform: string
  arch: string
  version: string
  cpus: string[]
  memory: {
    total: number
    free: number
  }
}

interface SystemAPI {
  getInfo: () => Promise<SystemInfo>
}

interface ShellAPI {
  openExternal: (url: string) => Promise<void>
}

interface IpcRendererAPI {
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
}

interface FileStats {
  size: number
  isDirectory: boolean
  isFile: boolean
  createdAt: number
  modifiedAt: number
  accessedAt: number
}

interface SearchResult {
  file: string
  matches: Array<{
    line: number
    content: string
    position: {
      start: number
      end: number
    }
  }>
}

interface FileOperationOptions {
  files: string[]
  targetPath: string
  preserveStructure?: boolean
  conflictStrategy?: 'ask' | 'overwrite' | 'skip' | 'rename'
  parallel?: boolean
  maxParallel?: number
}

interface API {
  openDirectoryDialog: () => Promise<string | null>
  selectPath: (options: {
    title?: string
    defaultPath?: string
    filters?: Array<{ name: string; extensions: string[] }>
    properties?: string[]
  }) => Promise<string[] | null>
  selectSavePath: (options: {
    title?: string
    defaultPath?: string
    filters?: Array<{ name: string; extensions: string[] }>
  }) => Promise<string | null>
  searchFiles: (path: string, extensions: string[]) => Promise<string[]>
  onSearchProgress: (callback: (progress: { current: number; total: number; file: string }) => void) => () => void
  searchInFiles: (files: string[], searchText: string, ignoreCase?: boolean) => Promise<SearchResult[]>
  onContentSearchProgress: (callback: (progress: { current: number; total: number; file: string }) => void) => () => void
  cancelSearch: () => Promise<void>
  moveFileSimple: (source: string, destination: string, fileName: string) => Promise<string>
  batchMoveFiles: (files: { source: string; fileName: string }[], destination: string) => Promise<string[]>
  onMoveProgress: (callback: (progress: { current: number; total: number; file: string }) => void) => () => void
  renameFile: (filePath: string, searchText: string, replaceText: string, options?: { ignoreCase?: boolean, caseConversion?: string }) => Promise<string>
  batchRenameFiles: (files: string[], searchText: string, replaceText: string, options?: { ignoreCase?: boolean, caseConversion?: string }) => Promise<string[]>
  onRenameProgress: (callback: (progress: { current: number; total: number; file: string }) => void) => () => void
  getFileInfo: (filePath: string) => Promise<FileStats>
  copyFile: (options: FileOperationOptions, callback?: (progress: { current: number; total: number; file: string }) => void) => Promise<string[]>
  moveFile: (options: FileOperationOptions, callback?: (progress: { current: number; total: number; file: string }) => void) => Promise<string[]>
  cancelOperation: () => Promise<void>
  saveTextFile: (options: { content: string, fileName: string, title?: string }) => Promise<string>
}

declare global {
  interface Window {
    electron: ElectronAPI & {
      system: SystemAPI
      shell: ShellAPI
      ipcRenderer: IpcRendererAPI
    }
    api: API
  }
} 