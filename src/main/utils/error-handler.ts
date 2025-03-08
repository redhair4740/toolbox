import { OperationResponse } from '../../types/file-types'

/**
 * 错误处理工具
 */

/**
 * 从任意错误对象中提取错误消息
 * @param error 错误对象
 * @returns 格式化的错误消息
 */
export function getErrorMessage(error: unknown): string {
  let errorMessage = '未知错误';
  
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (error && typeof error === 'object' && 'message' in error) {
    errorMessage = String(error.message);
  }
  
  return errorMessage;
}

/**
 * 记录错误并返回格式化的错误消息
 * @param error 错误对象
 * @param context 错误上下文
 * @returns 格式化的错误消息
 */
export function logAndFormatError(error: unknown, context: string): string {
  const errorMessage = getErrorMessage(error);
  console.error(`Error in ${context}:`, error);
  return errorMessage;
}

/**
 * 创建标准化的错误响应对象
 * @param success 是否成功
 * @param message 消息
 * @param data 附加数据
 * @returns 标准化的响应对象
 */
export function createResponse<T>(
  success: boolean, 
  message: string, 
  data?: T
): OperationResponse<T> {
  return {
    success,
    message,
    ...(data && { data })
  };
} 