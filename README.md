# YO 工具箱

一个使用Electron、Vue 3和TypeScript开发的现代化桌面工具集合应用。提供文件批量移动、重命名、内容搜索等功能，帮助您更高效地管理文件。

![YO工具箱](./resources/screenshot.png)

## 功能特性

- **文件移动**：根据扩展名筛选文件并批量移动到指定目录
- **文件重命名**：批量重命名文件，支持搜索替换和大小写转换
- **内容搜索**：在文件内容中搜索指定文本，支持多文件搜索和结果导出
- **操作日志**：记录所有文件操作，支持导出日志
- **自定义设置**：可配置界面、文件操作和性能参数
- **进度反馈**：实时显示操作进度和结果
- **最近路径**：记住最近使用的路径，方便快速访问
- **响应式UI**：适配不同屏幕尺寸的界面设计
- **跨平台**：支持Windows、macOS和Linux系统

## 项目结构

项目采用模块化的结构组织代码，主要目录如下：

```
yo_toolbox/
├── src/                  # 源代码
│   ├── main/             # 主进程代码
│   │   ├── index.ts      # 主进程入口
│   │   ├── window.ts     # 窗口管理
│   │   ├── ipc-handlers.ts # IPC通信处理
│   │   ├── services/     # 服务模块
│   │   │   └── file-service.ts # 文件操作服务
│   │   └── utils/        # 工具函数
│   │       └── error-handler.ts # 错误处理工具
│   ├── preload/          # 预加载脚本
│   │   ├── index.ts      # 预加载脚本入口
│   │   └── index.d.ts    # 预加载类型定义
│   ├── renderer/         # 渲染进程代码
│   │   ├── index.html    # HTML入口
│   │   └── src/          # 前端代码
│   │       ├── assets/   # 静态资源
│   │       ├── components/ # 组件
│   │       │   ├── common/ # 公共组件
│   │       │   │   ├── ProgressBar.vue # 进度条组件
│   │       │   │   ├── OperationLogs.vue # 操作日志组件
│   │       │   │   └── PathSelectorDialog.vue # 路径选择对话框
│   │       │   ├── FileMove.vue # 文件移动组件
│   │       │   ├── FileRename.vue # 文件重命名组件
│   │       │   ├── FileContentSearch.vue # 文件内容搜索组件
│   │       │   └── Settings.vue # 设置组件
│   │       ├── composables/ # 组合式API
│   │       │   ├── useFileTypes.ts # 文件类型管理
│   │       │   ├── useRecentPaths.ts # 最近路径管理
│   │       │   ├── useOperationLog.ts # 操作日志管理
│   │       │   └── useSettings.ts # 设置管理
│   │       ├── utils/    # 工具函数
│   │       ├── main.ts   # 渲染进程入口
│   │       └── App.vue   # 根组件
│   └── types/            # 类型定义
│       └── file-types.d.ts # 文件相关类型定义
├── electron.vite.config.ts # Electron-Vite配置
├── electron-builder.yml  # Electron Builder配置
├── package.json          # 项目配置
└── ...                   # 其他配置文件
```

## 使用指南

### 文件移动

1. 选择源文件夹路径
2. 选择目标文件夹路径
3. 选择要筛选的文件类型
4. 点击"查询文件"按钮搜索符合条件的文件
5. 选择要移动的文件
6. 点击"批量移动"按钮执行移动操作

### 文件重命名

1. 选择源文件夹路径
2. 输入搜索文本和替换文本
3. 设置是否忽略大小写和大小写转换选项
4. 选择要筛选的文件类型
5. 点击"查询文件"按钮搜索符合条件的文件
6. 选择要重命名的文件
7. 点击"批量重命名"按钮执行重命名操作

### 文件内容搜索

1. 选择源文件夹路径
2. 输入要搜索的文本
3. 设置是否忽略大小写
4. 选择要筛选的文件类型
5. 点击"查询文件"按钮搜索符合条件的文件
6. 选择要搜索内容的文件
7. 点击"搜索内容"按钮执行内容搜索
8. 查看搜索结果，可导出结果到文本文件

### 设置

应用提供多种设置选项，包括：

- **界面设置**：主题、侧边栏状态、操作确认等
- **文件操作**：时间戳保留、文件覆盖、备份创建等
- **性能设置**：批处理大小、并行操作、搜索深度限制等

## 开发指南

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建应用

```bash
# 构建所有平台
npm run build

# 构建特定平台
npm run build:win  # Windows
npm run build:mac  # macOS
npm run build:linux  # Linux
```

### 类型检查

```bash
npm run typecheck
```

## 技术架构

### 主进程

- **文件服务模块**：处理文件系统操作，包括搜索、移动和重命名
- **错误处理工具**：统一处理错误和异常
- **IPC处理器**：处理渲染进程和主进程之间的通信

### 渲染进程

- **组件化设计**：使用Vue 3组件化开发UI
- **组合式API**：使用Vue 3组合式API管理状态和逻辑
- **Element Plus**：使用Element Plus组件库构建界面
- **响应式设计**：适配不同屏幕尺寸

### 性能优化

- **分批处理**：大量文件操作时分批处理，避免阻塞主线程
- **进度反馈**：实时显示操作进度
- **并行处理**：支持并行处理文件操作

## 代码规范

项目使用ESLint和Prettier进行代码格式化和质量检查：

```bash
# 格式化代码
npm run format

# 代码检查
npm run lint
```

## 推荐的IDE设置

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin)

## 许可证

[MIT](./LICENSE)
