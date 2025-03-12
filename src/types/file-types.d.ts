/**
 * 文件相关类型定义
 */

/**
 * 带完整路径的文件信息
 */
export interface FileWithFullPath {
  fullPath: string
  fileName: string
  targetPath: string
}

/**
 * 文件重命名选项
 */
export interface RenameOptions {
  ignoreCase?: boolean
  caseConversion?: string
}

/**
 * 操作响应类型
 */
export interface OperationResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
}

/**
 * 重命名操作响应
 */
export interface RenameResponse extends OperationResponse {
  newPath?: string
}


/**
 * 文件内容搜索结果
 */
export interface ContentSearchResult {
  filePath: string
  fileName: string
  matches: string[]
  lineNumbers: number[]
}

/**
 * 进度信息接口
 */
export interface ProgressInfo {
  current: number
  total: number
  file: string
}

/**
 * Window.api 接口定义
 */
export interface WindowApi {
  // 目录操作
  openDirectoryDialog: () => Promise<string | null>
  
  // 文件搜索
  searchFiles: (path: string, extensions: string[]) => Promise<FileWithFullPath[]>
  
  // 文件操作
  cutFile: (source: string, destination: string, fileName: string) => Promise<string>
  renameFile: (
    filePath: string,
    searchText: string,
    replaceText: string,
    options?: RenameOptions
  ) => Promise<RenameResponse>
  
  // 文件内容搜索
  searchInFiles: (files: string[], searchText: string, ignoreCase?: boolean) => Promise<ContentSearchResult[]>
  
  // 进度监听
  onSearchProgress: (callback: (progress: ProgressInfo) => void) => () => boolean
  onContentSearchProgress: (callback: (progress: ProgressInfo) => void) => () => boolean
}
