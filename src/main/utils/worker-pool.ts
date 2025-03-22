import { Worker } from 'worker_threads'
import { EventEmitter } from 'events'

/**
 * 工作任务接口
 */
interface Task {
  id: number
  data: any
  resolve: (value: any) => void
  reject: (error: any) => void
}

/**
 * 工作线程接口
 */
interface WorkerThread {
  worker: Worker
  busy: boolean
  taskId?: number
}

/**
 * 工作线程池
 * 用于管理和分配工作线程，处理并发任务
 */
export class WorkerPool extends EventEmitter {
  private workers: WorkerThread[] = []
  private queue: Task[] = []
  private nextTaskId = 1
  private workerScript: string
  private maxConcurrency: number

  /**
   * 创建工作线程池
   * @param workerScript 工作线程脚本路径
   * @param maxConcurrency 最大并发数
   */
  constructor(workerScript: string, maxConcurrency: number = 4) {
    super()
    this.workerScript = workerScript
    this.maxConcurrency = maxConcurrency
  }

  /**
   * 执行任务
   * @param data 任务数据
   * @returns Promise<any>
   */
  execute(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const task: Task = {
        id: this.nextTaskId++,
        data,
        resolve,
        reject
      }

      // 尝试立即执行任务或加入队列
      const availableWorker = this.getAvailableWorker()
      if (availableWorker) {
        this.runTask(availableWorker, task)
      } else if (this.workers.length < this.maxConcurrency) {
        this.createWorker(task)
      } else {
        this.queue.push(task)
      }
    })
  }

  /**
   * 获取可用的工作线程
   * @returns WorkerThread | undefined
   */
  private getAvailableWorker(): WorkerThread | undefined {
    return this.workers.find(worker => !worker.busy)
  }

  /**
   * 创建新的工作线程
   * @param initialTask 初始任务
   */
  private createWorker(initialTask: Task): void {
    const worker = new Worker(this.workerScript)
    const workerThread: WorkerThread = {
      worker,
      busy: true,
      taskId: initialTask.id
    }

    worker.on('message', (result) => {
      this.handleWorkerMessage(workerThread, result)
    })

    worker.on('error', (error) => {
      this.handleWorkerError(workerThread, error)
    })

    worker.on('exit', (code) => {
      this.handleWorkerExit(workerThread, code)
    })

    this.workers.push(workerThread)
    this.runTask(workerThread, initialTask)
  }

  /**
   * 运行任务
   * @param workerThread 工作线程
   * @param task 任务
   */
  private runTask(workerThread: WorkerThread, task: Task): void {
    workerThread.busy = true
    workerThread.taskId = task.id
    workerThread.worker.postMessage({
      taskId: task.id,
      data: task.data
    })
  }

  /**
   * 处理工作线程消息
   * @param workerThread 工作线程
   * @param result 结果
   */
  private handleWorkerMessage(workerThread: WorkerThread, result: any): void {
    const task = this.queue.find(t => t.id === workerThread.taskId)
    if (task) {
      task.resolve(result)
      this.processNextTask(workerThread)
    }
  }

  /**
   * 处理工作线程错误
   * @param workerThread 工作线程
   * @param error 错误
   */
  private handleWorkerError(workerThread: WorkerThread, error: Error): void {
    const task = this.queue.find(t => t.id === workerThread.taskId)
    if (task) {
      task.reject(error)
      this.processNextTask(workerThread)
    }
  }

  /**
   * 处理工作线程退出
   * @param workerThread 工作线程
   * @param code 退出代码
   */
  private handleWorkerExit(workerThread: WorkerThread, code: number): void {
    const index = this.workers.indexOf(workerThread)
    if (index !== -1) {
      this.workers.splice(index, 1)
    }

    if (code !== 0) {
      console.error(`Worker stopped with exit code ${code}`)
    }

    // 如果还有任务在队列中，创建新的工作线程
    if (this.queue.length > 0) {
      this.createWorker(this.queue[0])
    }
  }

  /**
   * 处理下一个任务
   * @param workerThread 工作线程
   */
  private processNextTask(workerThread: WorkerThread): void {
    const nextTask = this.queue.shift()
    if (nextTask) {
      this.runTask(workerThread, nextTask)
    } else {
      workerThread.busy = false
      workerThread.taskId = undefined
    }
  }

  /**
   * 终止所有工作线程
   */
  terminate(): Promise<void> {
    const promises = this.workers.map(worker => worker.worker.terminate())
    this.workers = []
    this.queue = []
    return Promise.all(promises).then(() => {})
  }

  /**
   * 获取当前活动的工作线程数量
   */
  get activeWorkers(): number {
    return this.workers.filter(worker => worker.busy).length
  }

  /**
   * 获取等待中的任务数量
   */
  get pendingTasks(): number {
    return this.queue.length
  }
}