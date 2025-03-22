/**
 * 错误处理工具类
 */

// 文件操作错误类
export class FileOperationError extends Error {
  constructor(
    message: string,
    public code: string,
    public operation: string,
    public path?: string,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'FileOperationError'
  }
}

// 错误类型枚举
export enum ErrorType {
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  PATH_ALREADY_EXISTS = 'PATH_ALREADY_EXISTS',
  INVALID_PATH = 'INVALID_PATH',
  OPERATION_FAILED = 'OPERATION_FAILED',
  UNKNOWN = 'UNKNOWN'
}

// 自定义错误类
export class AppError extends Error {
  constructor(
    public type: ErrorType,
    public message: string,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'AppError'
  }
}

/**
 * 处理错误并返回统一的错误对象
 * @param error 原始错误
 * @param context 错误上下文信息
 * @returns 格式化的错误对象
 */
export function handleError(error: unknown, context?: string): AppError {
  // 如果已经是 AppError 类型，直接返回
  if (error instanceof AppError) {
    return error
  }

  const originalError = error instanceof Error ? error : new Error(String(error))
  let type = ErrorType.UNKNOWN
  let message = originalError.message

  // 根据错误类型和消息进行分类
  if (originalError instanceof Error) {
    if (originalError.message.includes('no such file or directory')) {
      type = ErrorType.FILE_NOT_FOUND
      message = '文件或目录不存在'
    } else if (originalError.message.includes('permission denied')) {
      type = ErrorType.PERMISSION_DENIED
      message = '权限不足'
    } else if (originalError.message.includes('already exists')) {
      type = ErrorType.PATH_ALREADY_EXISTS
      message = '路径已存在'
    } else if (originalError.message.includes('invalid path')) {
      type = ErrorType.INVALID_PATH
      message = '无效的路径'
    }
  }

  // 添加上下文信息
  if (context) {
    message = `${context}: ${message}`
  }

  return new AppError(type, message, originalError)
}

/**
 * 检查错误是否属于指定类型
 * @param error 错误对象
 * @param type 错误类型
 * @returns 是否匹配
 */
export function isErrorType(error: unknown, type: ErrorType): boolean {
  return error instanceof AppError && error.type === type
}

/**
 * 包装异步函数，统一错误处理
 * @param fn 异步函数
 * @param context 错误上下文信息
 * @returns 包装后的函数
 */
export function wrapAsync<T>(
  fn: (...args: any[]) => Promise<T>,
  context?: string
): (...args: any[]) => Promise<T> {
  return async (...args: any[]): Promise<T> => {
    try {
      return await fn(...args)
    } catch (error) {
      throw handleError(error, context)
    }
  }
}