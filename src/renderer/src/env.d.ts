/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 定义 window.api 接口
interface Window {
  api: {
    openDirectoryDialog: () => Promise<string | null>
    searchFiles: (
      path: string,
      extensions: string[]
    ) => Promise<import('../../types/file-types').FileWithFullPath[]>
    cutFile: (source: string, destination: string, fileName: string) => Promise<string>
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
  }
}
