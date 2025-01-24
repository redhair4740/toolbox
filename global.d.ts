declare global {
  interface Window {
    electron: (typeof import('@electron-toolkit/preload'))['electronAPI']
    api: {
      openDirectoryDialog: () => Promise<string | null>
      searchFiles: (path: string, extensions: string[]) => Promise<never[]>
      cutFile: (source: string, destination: string, fileName: string) => Promise<string>
    }
  }
}

export {}
