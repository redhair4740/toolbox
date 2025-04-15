<template>
  <div class="settings">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2>应用设置</h2>
          <div class="header-actions">
            <el-button
              type="primary"
              :loading="isSaving"
              @click="saveSettings"
            >
              保存设置
            </el-button>
          </div>
        </div>
      </template>

      <div class="settings-content">
        <el-tabs v-model="activeTab">
          <!-- 常规设置 -->
          <el-tab-pane label="常规" name="general">
            <el-form
              ref="generalForm"
              :model="settings.general"
              label-width="140px"
            >
              <!-- 主题设置 -->
              <el-form-item label="主题">
                <el-radio-group 
                  v-model="settings.general.theme"
                  @change="onThemeChange"
                >
                  <el-radio-button value="system">跟随系统</el-radio-button>
                  <el-radio-button value="light">浅色</el-radio-button>
                  <el-radio-button value="dark">深色</el-radio-button>
                </el-radio-group>
              </el-form-item>

              <!-- 语言设置 -->
              <el-form-item label="语言">
                <el-select v-model="settings.general.language" style="width: 200px">
                  <el-option label="简体中文" value="zh-CN" />
                  <el-option label="English" value="en-US" />
                </el-select>
              </el-form-item>

              <!-- 界面设置 -->
              <el-form-item label="界面缩放">
                <el-slider
                  v-model="settings.general.zoom"
                  :min="50"
                  :max="150"
                  :step="10"
                  :format-tooltip="value => `${value}%`"
                  style="width: 300px"
                />
              </el-form-item>

              <!-- 开机启动 -->
              <el-form-item>
                <el-checkbox v-model="settings.general.autoStart">开机自动启动</el-checkbox>
              </el-form-item>

              <!-- 托盘设置 -->
              <el-form-item>
                <el-checkbox v-model="settings.general.minimizeToTray">最小化到托盘</el-checkbox>
              </el-form-item>
              
              <!-- UI相关设置 -->
              <el-form-item label="侧边栏">
                <el-checkbox 
                  v-model="settings.ui.sidebarCollapsed" 
                  label="默认收起侧边栏"
                  @change="updateSidebarState"
                />
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <!-- 文件操作设置 -->
          <el-tab-pane label="文件操作" name="file">
            <el-form
              ref="fileForm"
              :model="settings.file"
              label-width="140px"
            >
              <!-- 默认操作设置 -->
              <el-form-item label="默认冲突处理">
                <el-select v-model="settings.file.defaultConflictStrategy" style="width: 200px">
                  <el-option label="询问" value="ask" />
                  <el-option label="覆盖" value="overwrite" />
                  <el-option label="跳过" value="skip" />
                  <el-option label="自动重命名" value="rename" />
                </el-select>
              </el-form-item>

              <!-- 性能设置 -->
              <el-form-item label="并行处理">
                <el-switch v-model="settings.file.enableParallel" />
                <span class="setting-hint">启用多线程并行处理文件操作</span>
              </el-form-item>

              <el-form-item label="最大并行数">
                <el-input-number
                  v-model="settings.file.maxParallel"
                  :min="1"
                  :max="16"
                  :disabled="!settings.file.enableParallel"
                />
                <span class="setting-hint">同时处理的最大文件数</span>
              </el-form-item>

              <!-- 确认设置 -->
              <el-form-item>
                <el-checkbox v-model="settings.file.confirmBeforeDelete">
                  删除前确认
                </el-checkbox>
              </el-form-item>

              <el-form-item>
                <el-checkbox v-model="settings.file.preserveTimestamp">
                  保留文件时间戳
                </el-checkbox>
              </el-form-item>

              <!-- 缓冲区大小 -->
              <el-form-item label="缓冲区大小">
                <el-select v-model="settings.file.bufferSize" style="width: 200px">
                  <el-option label="4 KB" value="4096" />
                  <el-option label="8 KB" value="8192" />
                  <el-option label="16 KB" value="16384" />
                  <el-option label="32 KB" value="32768" />
                  <el-option label="64 KB" value="65536" />
                </el-select>
                <span class="setting-hint">文件读写操作的缓冲区大小</span>
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <!-- 搜索设置 -->
          <el-tab-pane label="搜索" name="search">
            <el-form
              ref="searchForm"
              :model="settings.search"
              label-width="140px"
            >
              <!-- 搜索性能设置 -->
              <el-form-item label="搜索线程数">
                <el-input-number
                  v-model="settings.search.threads"
                  :min="1"
                  :max="16"
                />
                <span class="setting-hint">文件内容搜索使用的线程数</span>
              </el-form-item>

              <!-- 默认搜索选项 -->
              <el-form-item>
                <el-checkbox v-model="settings.search.ignoreCase">
                  默认忽略大小写
                </el-checkbox>
              </el-form-item>

              <el-form-item>
                <el-checkbox v-model="settings.search.includeHidden">
                  包含隐藏文件
                </el-checkbox>
              </el-form-item>

              <!-- 搜索限制 -->
              <el-form-item label="最大文件大小">
                <el-input-number
                  v-model="settings.search.maxFileSize"
                  :min="1"
                  :step="1"
                  :step-strictly="true"
                />
                <el-select
                  v-model="settings.search.maxFileSizeUnit"
                  style="width: 100px; margin-left: 10px"
                >
                  <el-option label="KB" value="KB" />
                  <el-option label="MB" value="MB" />
                  <el-option label="GB" value="GB" />
                </el-select>
                <span class="setting-hint">超过此大小的文件将被跳过</span>
              </el-form-item>

              <!-- 排除设置 -->
              <el-form-item label="排除的文件">
                <el-select
                  v-model="settings.search.excludedFiles"
                  multiple
                  filterable
                  allow-create
                  default-first-option
                  style="width: 100%"
                  placeholder="输入要排除的文件模式"
                >
                  <el-option
                    v-for="pattern in defaultExcludedFiles"
                    :key="pattern"
                    :label="pattern"
                    :value="pattern"
                  />
                </el-select>
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <!-- 高级设置 -->
          <el-tab-pane label="高级" name="advanced">
            <el-form
              ref="advancedForm"
              :model="settings.advanced"
              label-width="140px"
            >
              <!-- 日志设置 -->
              <el-form-item label="日志级别">
                <el-select v-model="settings.advanced.logLevel" style="width: 200px">
                  <el-option label="调试" value="debug" />
                  <el-option label="信息" value="info" />
                  <el-option label="警告" value="warn" />
                  <el-option label="错误" value="error" />
                </el-select>
              </el-form-item>

              <el-form-item label="日志保留天数">
                <el-input-number
                  v-model="settings.advanced.logRetention"
                  :min="1"
                  :max="90"
                />
                <span class="setting-hint">超过此天数的日志将被自动清理</span>
              </el-form-item>

              <!-- 缓存设置 -->
              <el-form-item label="缓存大小限制">
                <el-input-number
                  v-model="settings.advanced.maxCacheSize"
                  :min="100"
                  :step="100"
                />
                <span class="setting-hint">MB，超过此大小将清理最早的缓存</span>
              </el-form-item>

              <!-- 调试选项 -->
              <el-form-item>
                <el-checkbox v-model="settings.advanced.devTools">
                  启用开发者工具
                </el-checkbox>
              </el-form-item>

              <!-- 重置按钮 -->
              <el-form-item>
                <el-button
                  type="danger"
                  @click="confirmReset"
                >
                  重置所有设置
                </el-button>
                <span class="setting-hint">将所有设置恢复为默认值</span>
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <!-- 关于 -->
          <el-tab-pane label="关于" name="about">
            <div class="about-section">
              <div class="app-info">
                <img src="../assets/logo.svg" class="app-logo" alt="logo" />
                <h2>{{ appInfo.name }}</h2>
                <p class="version">版本 {{ appInfo.version }}</p>
                <p class="description">{{ appInfo.description }}</p>
              </div>

              <div class="links">
                <el-button
                  type="primary"
                  link
                  @click="openExternalLink(appInfo.homepage)"
                >
                  项目主页
                </el-button>
                <el-button
                  type="primary"
                  link
                  @click="openExternalLink(appInfo.repository)"
                >
                  源代码仓库
                </el-button>
                <el-button
                  type="primary"
                  link
                  @click="openExternalLink(appInfo.bugs)"
                >
                  问题反馈
                </el-button>
              </div>

              <div class="system-info">
                <h3>系统信息</h3>
                <el-descriptions :column="1" border>
                  <el-descriptions-item label="操作系统">
                    {{ systemInfo.os }}
                  </el-descriptions-item>
                  <el-descriptions-item label="处理器架构">
                    {{ systemInfo.arch }}
                  </el-descriptions-item>
                  <el-descriptions-item label="Node.js">
                    {{ systemInfo.nodejs }}
                  </el-descriptions-item>
                  <el-descriptions-item label="Electron">
                    {{ systemInfo.electron }}
                  </el-descriptions-item>
                  <el-descriptions-item label="Chrome">
                    {{ systemInfo.chrome }}
                  </el-descriptions-item>
                </el-descriptions>
              </div>

              <div class="credits">
                <p>© 2024 YoToolbox. All rights reserved.</p>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useSettings } from '../composables/useSettings'
import { useTheme } from '../composables/useTheme'

// 默认的排除文件模式
const defaultExcludedFiles = [
  'node_modules/**/*',
  '.git/**/*',
  '*.log',
  '*.tmp',
  '*.temp',
  '*.swp',
  '*~'
]

// 状态
const activeTab = ref('general')
const isSaving = ref(false)

// 使用设置组合式API
const { 
  settings,
  saveSettings: save, 
  resetSettings 
} = useSettings()
const { updateTheme } = useTheme()

// 创建一个加载设置的函数，只用于重置后重新加载
const loadSettings = async () => {
  // 此函数现在只会在重置设置后被调用
  return settings;
}

// 应用信息
const appInfo = reactive({
  name: 'YoToolbox',
  version: '1.0.0',
  description: '一个强大的文件管理工具箱',
  homepage: 'https://github.com/username/yo-toolbox',
  repository: 'https://github.com/username/yo-toolbox',
  bugs: 'https://github.com/username/yo-toolbox/issues'
})

// 系统信息
const systemInfo = reactive({
  os: '',
  arch: '',
  nodejs: '',
  electron: '',
  chrome: ''
})

// 初始化标志
const isInitialized = ref(false)

// 初始化
const init = async () => {
  try {
    // 防止重复初始化
    if (isInitialized.value) return;

    // 加载系统信息
    if (window.electron && window.electron.system) {
      try {
        const info = await window.electron.system.getInfo()
        Object.assign(systemInfo, info)
      } catch (systemError) {
        console.error('加载系统信息失败:', systemError)
      }
    }
    
    // 从localStorage获取当前主题并同步到设置中
    const currentThemeMode = localStorage.getItem('theme_mode')
    if (currentThemeMode && currentThemeMode !== settings.general.theme) {
      settings.general.theme = currentThemeMode
      updateTheme(settings.general.theme)
    }
    
    // 标记为已初始化
    isInitialized.value = true
  } catch (error) {
    console.error('加载设置失败:', error)
    ElMessage.error('加载设置失败')
  }
}

// 保存设置
const saveSettings = async () => {
  try {
    isSaving.value = true
    
    // 保存设置
    await save({
      general: {...settings.general},
      file: {...settings.file},
      search: {...settings.search},
      advanced: {...settings.advanced},
      ui: {...settings.ui}
    })
    
    // 应用主题
    updateTheme(settings.general.theme)
    
    ElMessage.success('设置已保存')
  } catch (error) {
    console.error('保存设置失败:', error)
    ElMessage.error('保存设置失败')
  } finally {
    isSaving.value = false
  }
}

// 确认重置
const confirmReset = () => {
  ElMessageBox.confirm(
    '确定要重置所有设置吗？此操作不可恢复！',
    '确认重置',
    {
      confirmButtonText: '重置',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await resetSettings()
      Object.assign(settings, await loadSettings())
      ElMessage.success('设置已重置')
    } catch (error) {
      ElMessage.error('重置设置失败')
    }
  }).catch(() => {})
}

// 打开外部链接
const openExternalLink = (url: string) => {
  try {
    if (window.electron && window.electron.shell && window.electron.shell.openExternal) {
      window.electron.shell.openExternal(url)
        .catch(error => {
          console.error('打开外部链接失败:', error)
          ElMessage.error('打开外部链接失败')
        })
    } else {
      console.warn('shell.openExternal API不可用')
      // 降级处理：尝试使用普通window.open
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  } catch (error) {
    console.error('打开链接时出错:', error)
    ElMessage.error('打开链接失败')
  }
}

// 更新侧边栏状态
const updateSidebarState = () => {
  // 触发自定义事件来通知应用更新侧边栏状态
  const customEvent = new CustomEvent('settings-saved', {
    detail: {
      ui: {
        sidebarCollapsed: settings.ui.sidebarCollapsed
      }
    }
  })
  document.dispatchEvent(customEvent)
}

// 主题变化处理
const onThemeChange = () => {
  updateTheme(settings.general.theme)
}

// 在组件挂载时执行初始化
onMounted(() => {
  console.log('Settings组件挂载，执行初始化')
  init()
})
</script>

<style scoped>
.settings {
  padding: 1rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.settings-content {
  padding: 0.5rem 0;
}

.setting-hint {
  margin-left: 0.5rem;
  color: var(--el-text-color-secondary);
  font-size: 0.9em;
}

.about-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  padding: 1rem 0;
}

.app-info {
  text-align: center;
}

.app-logo {
  width: 96px;
  height: 96px;
  margin-bottom: 1rem;
}

.version {
  color: var(--el-text-color-secondary);
  margin: 0.5rem 0;
}

.description {
  max-width: 600px;
  margin: 1rem auto;
}

.links {
  display: flex;
  gap: 1rem;
}

.system-info {
  width: 100%;
  max-width: 600px;
}

.credits {
  color: var(--el-text-color-secondary);
  font-size: 0.9em;
  text-align: center;
}
</style>