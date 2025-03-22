/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 扩展 Window 接口
interface Window {
  api: WindowApi
  electron?: {
    system?: {
      getInfo: () => Promise<{
        os: string;
        arch: string;
        nodejs: string;
        electron: string;
        chrome: string;
      }>
    },
    shell?: {
      openExternal: (url: string) => Promise<void>
    }
  }
}
