import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  openDirectoryDialog: () => ipcRenderer.invoke('open-directory-dialog'),
  searchFiles: (path: string, extensions: string[]) =>
    ipcRenderer.invoke('search-files', { path, extensions }),
  cutFile: (source: string, destination: string, fileName: string) =>
    ipcRenderer.invoke('cut-file', { source, destination, fileName }),
  renameFile: (filePath: string, searchText: string, replaceText: string, ignoreCase: boolean = false, caseConversion: string = 'none') =>
    ipcRenderer.invoke('rename-file', { filePath, searchText, replaceText, ignoreCase, caseConversion })
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
