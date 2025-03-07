# YO 工具箱

一个使用Electron、Vue 3和TypeScript开发的现代化桌面工具集合应用。主要功能包括文件移动和文件重命名。

## 项目结构

项目采用模块化的结构组织代码，主要目录如下：

```
yo_toolbox/
├── src/                  # 源代码
│   ├── main/             # 主进程代码
│   │   ├── index.ts      # 主进程入口
│   │   ├── window.ts     # 窗口管理
│   │   └── ipc-handlers.ts # IPC通信处理
│   ├── preload/          # 预加载脚本
│   │   └── index.ts      # 预加载脚本入口
│   ├── renderer/         # 渲染进程代码
│   │   ├── index.html    # HTML入口
│   │   └── src/          # 前端代码
│   │       ├── assets/   # 静态资源
│   │       │   └── styles/ # 样式文件
│   │       ├── components/ # 组件
│   │       │   └── common/ # 公共组件
│   │       ├── composables/ # 组合式API
│   │       ├── utils/    # 工具函数
│   │       ├── main.ts   # 渲染进程入口
│   │       └── App.vue   # 根组件
│   └── types/            # 类型定义
├── electron.vite.config.ts # Electron-Vite配置
├── package.json          # 项目配置
└── ...                   # 其他配置文件
```

## 特性

- 文件移动功能：根据扩展名筛选文件并移动到指定目录
- 文件重命名功能：批量重命名文件，支持搜索和替换
- 响应式UI：适配不同屏幕尺寸的界面设计
- 跨平台：支持Windows、macOS和Linux系统

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

## 项目设计

### 主进程

主进程代码按功能模块化拆分，主要包括：

- 窗口管理（window.ts）
- IPC通信处理（ipc-handlers.ts）
- 主程序入口（index.ts）

### 渲染进程

前端采用Vue 3组合式API开发，使用Element Plus组件库构建界面，代码组织按功能模块化：

- 公共组件（PathSelector等）
- 工具函数（文件操作相关）
- 全局样式（CSS变量管理）

## 代码规范

项目使用ESLint和Prettier进行代码格式化和质量检查：

```bash
# 格式化代码
npm run format

# 代码检查
npm run lint
```

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin)
