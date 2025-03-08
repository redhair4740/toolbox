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
