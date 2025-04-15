import { EventEmitter } from 'events'

/**
 * 进度事件类型
 */
export interface ProgressEvent {
  current: number
  total: number
  percentage: number
  status?: string
  details?: Record<string, any>
}

/**
 * 进度回调函数类型
 */
export type ProgressCallback = (event: ProgressEvent) => void;

/**
 * 进度跟踪器，用于监控长时间运行的操作
 */
export class ProgressTracker extends EventEmitter {
  private current: number = 0
  private total: number
  private status: string = 'idle'
  private details: Record<string, any> = {}
  private startTime: number = 0
  private endTime: number = 0

  /**
   * 创建一个进度跟踪器
   * @param total 总任务数
   * @param initialStatus 初始状态
   */
  constructor(total: number, initialStatus: string = 'idle') {
    super()
    this.total = Math.max(1, total) // 确保总数至少为1
    this.status = initialStatus
  }

  /**
   * 开始跟踪进度
   */
  start(): void {
    this.startTime = Date.now()
    this.status = 'running'
    this.emit('start')
    this.emitProgress()
  }

  /**
   * 更新进度
   * @param increment 增量值
   * @param status 可选的状态更新
   * @param details 可选的详细信息
   */
  update(increment: number = 1, status?: string, details?: Record<string, any>): void {
    this.current = Math.min(this.total, this.current + increment)
    
    if (status) {
      this.status = status
    }
    
    if (details) {
      this.details = { ...this.details, ...details }
    }
    
    this.emitProgress()
  }

  /**
   * 设置进度
   * @param value 进度值
   * @param status 可选的状态更新
   * @param details 可选的详细信息
   */
  set(value: number, status?: string, details?: Record<string, any>): void {
    this.current = Math.min(this.total, Math.max(0, value))
    
    if (status) {
      this.status = status
    }
    
    if (details) {
      this.details = { ...this.details, ...details }
    }
    
    this.emitProgress()
  }

  /**
   * 完成进度跟踪
   * @param status 可选的最终状态
   * @param details 可选的最终详细信息
   */
  complete(status: string = 'completed', details?: Record<string, any>): void {
    this.current = this.total
    this.status = status
    
    if (details) {
      this.details = { ...this.details, ...details }
    }
    
    this.endTime = Date.now()
    this.emitProgress()
    this.emit('complete', {
      duration: this.getDuration(),
      ...this.getProgressData()
    })
  }

  /**
   * 发送错误事件
   * @param error 错误对象
   * @param details 可选的错误详细信息
   */
  error(error: Error, details?: Record<string, any>): void {
    this.status = 'error'
    this.endTime = Date.now()
    
    const errorDetails = {
      error: error.message,
      stack: error.stack,
      ...details
    }
    
    this.details = { ...this.details, ...errorDetails }
    
    this.emit('error', {
      error,
      duration: this.getDuration(),
      ...this.getProgressData()
    })
  }

  /**
   * 获取进度数据
   */
  private getProgressData(): ProgressEvent {
    const percentage = this.total > 0 ? Math.floor((this.current / this.total) * 100) : 0
    
    return {
      current: this.current,
      total: this.total,
      percentage,
      status: this.status,
      details: this.details
    }
  }

  /**
   * 发送进度事件
   */
  private emitProgress(): void {
    this.emit('progress', this.getProgressData())
  }

  /**
   * 获取操作持续时间（毫秒）
   */
  private getDuration(): number {
    const end = this.endTime || Date.now()
    return end - this.startTime
  }
}