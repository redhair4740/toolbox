import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      openDirectoryDialog: () => Promise<string | null>
      searchFiles: (path: string, extensions: string[]) => Promise<Array<{
        fullPath: string
        fileName: string
        targetPath: string
      }>>
      cutFile: (source: string, destination: string, fileName: string) => Promise<string>
      renameFile: (filePath: string, searchText: string, replaceText: string, ignoreCase?: boolean, caseConversion?: string) => Promise<{
        success: boolean
        message: string
        newPath?: string
      }>
    }
  }
}
