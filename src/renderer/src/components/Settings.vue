<template>
  <div class="settings-container">
    <el-tabs type="border-card">
      <!-- 界面设置 -->
      <el-tab-pane label="界面设置">
        <div class="settings-section">
          <h3>外观</h3>
          <div class="setting-item">
            <span class="setting-label">主题</span>
            <el-select v-model="settings.ui.theme" placeholder="选择主题">
              <el-option label="浅色" value="light" />
              <el-option label="深色" value="dark" />
              <el-option label="跟随系统" value="system" />
            </el-select>
          </div>
          
          <div class="setting-item">
            <span class="setting-label">侧边栏默认状态</span>
            <el-switch
              v-model="settings.ui.sidebarCollapsed"
              active-text="折叠"
              inactive-text="展开"
            />
          </div>
          
          <h3>操作确认</h3>
          <div class="setting-item">
            <span class="setting-label">操作前确认</span>
            <el-switch
              v-model="settings.ui.confirmBeforeOperation"
              active-text="启用"
              inactive-text="禁用"
            />
            <div class="setting-description">执行批量操作前显示确认对话框</div>
          </div>
          
          <div class="setting-item">
            <span class="setting-label">显示操作日志</span>
            <el-switch
              v-model="settings.ui.showOperationLogs"
              active-text="启用"
              inactive-text="禁用"
            />
            <div class="setting-description">在操作完成后显示操作日志</div>
          </div>
          
          <div class="settings-actions">
            <el-button type="primary" @click="resetCategorySettings('ui')">重置界面设置</el-button>
          </div>
        </div>
      </el-tab-pane>
      
      <!-- 文件操作设置 -->
      <el-tab-pane label="文件操作">
        <div class="settings-section">
          <h3>文件移动</h3>
          <div class="setting-item">
            <span class="setting-label">保留时间戳</span>
            <el-switch
              v-model="settings.file.preserveTimestamp"
              active-text="启用"
              inactive-text="禁用"
            />
            <div class="setting-description">移动文件时保留原始的修改时间</div>
          </div>
          
          <div class="setting-item">
            <span class="setting-label">覆盖已存在的文件</span>
            <el-switch
              v-model="settings.file.overwriteExisting"
              active-text="启用"
              inactive-text="禁用"
            />
            <div class="setting-description">目标位置存在同名文件时自动覆盖</div>
          </div>
          
          <h3>文件重命名</h3>
          <div class="setting-item">
            <span class="setting-label">创建备份</span>
            <el-switch
              v-model="settings.file.createBackup"
              active-text="启用"
              inactive-text="禁用"
            />
            <div class="setting-description">重命名前创建文件备份</div>
          </div>
          
          <h3>历史记录</h3>
          <div class="setting-item">
            <span class="setting-label">最近路径数量</span>
            <el-slider
              v-model="settings.file.maxRecentPaths"
              :min="1"
              :max="10"
              :step="1"
              show-stops
              show-input
            />
            <div class="setting-description">保存的最近访问路径数量</div>
          </div>
          
          <div class="setting-item">
            <span class="setting-label">默认文件类型</span>
            <el-select
              v-model="settings.file.defaultExtensions"
              multiple
              collapse-tags
              placeholder="选择默认文件类型"
            >
              <el-option v-for="item in fileTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <div class="setting-description">默认搜索的文件类型</div>
          </div>
          
          <div class="settings-actions">
            <el-button type="primary" @click="resetCategorySettings('file')">重置文件设置</el-button>
          </div>
        </div>
      </el-tab-pane>
      
      <!-- 性能设置 -->
      <el-tab-pane label="性能设置">
        <div class="settings-section">
          <h3>批处理</h3>
          <div class="setting-item">
            <span class="setting-label">批处理大小</span>
            <el-slider
              v-model="settings.performance.batchSize"
              :min="5"
              :max="50"
              :step="5"
              show-stops
              show-input
            />
            <div class="setting-description">每批处理的文件数量</div>
          </div>
          
          <div class="setting-item">
            <span class="setting-label">并行操作</span>
            <el-switch
              v-model="settings.performance.parallelOperations"
              active-text="启用"
              inactive-text="禁用"
            />
            <div class="setting-description">同时处理多个文件（可能会增加系统负载）</div>
          </div>
          
          <h3>搜索限制</h3>
          <div class="setting-item">
            <span class="setting-label">搜索深度限制</span>
            <el-input-number
              v-model="settings.performance.searchDepthLimit"
              :min="0"
              :max="20"
              :step="1"
            />
            <div class="setting-description">子目录搜索的最大深度（0表示无限制）</div>
          </div>
          
          <div class="settings-actions">
            <el-button type="primary" @click="resetCategorySettings('performance')">重置性能设置</el-button>
          </div>
        </div>
      </el-tab-pane>
      
      <!-- 关于 -->
      <el-tab-pane label="关于">
        <div class="settings-section about-section">
          <div class="app-info">
            <img src="../assets/logo-gradient.svg" alt="YO工具箱" class="app-logo" />
            <h2>YO工具箱</h2>
            <div class="version">版本 1.0.2</div>
            <p>简单高效的文件管理解决方案</p>
          </div>
          
          <div class="app-description">
            <p>YO工具箱是一款桌面应用程序，提供文件批量移动、重命名等功能，帮助您更高效地管理文件。</p>
            <p>基于 Electron、Vue 和 TypeScript 开发。</p>
          </div>
          
          <div class="app-credits">
            <h3>技术栈</h3>
            <ul>
              <li>Electron</li>
              <li>Vue 3</li>
              <li>TypeScript</li>
              <li>Element Plus</li>
            </ul>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
    
    <div class="global-actions">
      <el-button type="default" @click="resetAllSettings">重置所有设置</el-button>
      <el-button type="primary" @click="saveAndClose" :disabled="!isDirty">保存设置</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSettings } from '../composables/useSettings'
import { ElMessage, ElMessageBox } from 'element-plus'
import { watch } from 'vue'
import { useTheme } from '../composables/useTheme'

const { settings, isDirty, saveSettings, resetSettings, resetCategory } = useSettings()
const { applyTheme } = useTheme()

// 监听主题变化并立即应用
watch(() => settings.ui.theme, (newTheme) => {
  applyTheme(newTheme)
})

// 文件类型选项
const fileTypeOptions = [
  { value: '.txt', label: 'txt' },
  { value: '.mkv', label: 'mkv' },
  { value: '.mp4', label: 'mp4' },
  { value: '.iso', label: 'iso' },
  { value: '.avi', label: 'avi' },
  { value: '.mpg', label: 'mpg' },
  { value: '.ass', label: 'ass' },
  { value: '.jpg', label: 'jpg' },
  { value: '.png', label: 'png' },
  { value: '.zip', label: 'zip' }
]

// 保存设置并关闭
const saveAndClose = () => {
  if (saveSettings()) {
    ElMessage.success('设置已保存')
  } else {
    ElMessage.error('保存设置失败')
  }
}

// 重置分类设置前确认
const resetCategorySettings = async (category: 'ui' | 'file' | 'performance') => {
  try {
    await ElMessageBox.confirm('确定要重置此分类的设置吗？', '确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    resetCategory(category)
    ElMessage.success('已重置设置')
  } catch {
    // 用户取消
  }
}

// 重置所有设置前确认
const resetAllSettings = async () => {
  try {
    await ElMessageBox.confirm('确定要重置所有设置吗？此操作不可撤销。', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    resetSettings()
    ElMessage.success('已重置所有设置')
  } catch {
    // 用户取消
  }
}
</script>

<style scoped>
.settings-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.el-tabs) {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

:deep(.el-tabs__content) {
  flex: 1;
  overflow: auto;
  padding: 20px;
}

.settings-section {
  max-width: 800px;
}

.settings-section h3 {
  margin-top: 20px;
  margin-bottom: 10px;
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 8px;
}

.setting-item {
  margin-bottom: 16px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.setting-label {
  width: 150px;
  font-size: 14px;
  color: var(--text-color);
}

.setting-description {
  width: 100%;
  margin-top: 4px;
  margin-left: 150px;
  font-size: 12px;
  color: var(--text-light);
}

.settings-actions {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px dashed var(--border-color);
}

.global-actions {
  padding: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid var(--border-color);
}

.about-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.app-info {
  margin-bottom: 20px;
}

.app-logo {
  width: 80px;
  height: 80px;
  margin-bottom: 10px;
}

.version {
  font-size: 14px;
  color: var(--text-light);
  margin-bottom: 10px;
}

.app-description {
  max-width: 600px;
  margin-bottom: 20px;
}

.app-credits {
  text-align: left;
  width: 100%;
  max-width: 600px;
}

.app-credits ul {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  list-style: none;
  padding: 0;
}

.app-credits li {
  background-color: var(--bg-color-secondary);
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 14px;
  color: var(--text-color);
}
</style> 