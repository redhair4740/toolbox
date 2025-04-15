/**
 * 重试配置接口
 */
interface RetryOptions {
  retries: number
  baseDelay: number
  maxDelay: number
}

/**
 * 带重试功能的异步函数包装器
 * @param fn 要执行的异步函数
 * @param options 重试配置
 * @returns 包装后的异步函数结果
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  let lastError: Error | undefined
  
  for (let attempt = 0; attempt <= options.retries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      if (attempt === options.retries) {
        throw lastError
      }
      
      // 计算下次重试延迟时间（指数退避策略）
      const delay = Math.min(
        options.baseDelay * Math.pow(2, attempt),
        options.maxDelay
      )
      
      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  // 这行代码理论上永远不会执行，但TypeScript需要它
  throw lastError || new Error('重试失败')
}