/**
 * 信号量实现，用于控制并发操作
 */
export class Semaphore {
  private permits: number
  private waiting: Array<() => void> = []
  
  /**
   * 创建一个信号量
   * @param permits 允许的并发数
   */
  constructor(permits: number) {
    this.permits = permits
  }
  
  /**
   * 获取一个许可
   * @returns Promise，在获得许可后解析
   */
  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--
      return Promise.resolve()
    }
    
    return new Promise<void>(resolve => {
      this.waiting.push(resolve)
    })
  }
  
  /**
   * 释放一个许可
   */
  release(): void {
    const next = this.waiting.shift()
    if (next) {
      // 有等待的任务，直接将许可传递给它
      next()
    } else {
      // 没有等待的任务，增加可用许可
      this.permits++
    }
  }
  
  /**
   * 获取当前可用的许可数
   */
  get availablePermits(): number {
    return this.permits
  }
  
  /**
   * 获取等待队列长度
   */
  get queueLength(): number {
    return this.waiting.length
  }
}

/**
 * 并发控制器，用于限制并发任务数
 */
export class ConcurrencyController {
  private semaphore: Semaphore
  
  /**
   * 创建一个并发控制器
   * @param concurrency 最大并发数
   */
  constructor(concurrency: number) {
    this.semaphore = new Semaphore(concurrency)
  }
  
  /**
   * 执行受限的并发任务
   * @param tasks 任务函数数组
   * @returns 任务执行结果数组
   */
  async runAll<T>(tasks: (() => Promise<T>)[]): Promise<T[]> {
    return Promise.all(tasks.map(task => this.run(task)))
  }
  
  /**
   * 执行单个受限的任务
   * @param task 任务函数
   * @returns 任务执行结果
   */
  async run<T>(task: () => Promise<T>): Promise<T> {
    await this.semaphore.acquire()
    try {
      return await task()
    } finally {
      this.semaphore.release()
    }
  }
  
  /**
   * 批量执行任务，按指定批次大小
   * @param tasks 任务函数数组
   * @param batchSize 批次大小
   * @returns 任务执行结果数组
   */
  async runInBatches<T>(tasks: (() => Promise<T>)[], batchSize: number): Promise<T[]> {
    const results: T[] = []
    
    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize)
      const batchResults = await this.runAll(batch)
      results.push(...batchResults)
    }
    
    return results
  }
}