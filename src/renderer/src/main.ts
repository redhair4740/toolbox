import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './assets/styles/main.css'
import './assets/theme.css'
import './assets/element-dark.css'
import { initVConsole } from './utils/vConsole'

// 初始化vConsole (Ctrl+Shift+D 显示/隐藏)
initVConsole()

const app = createApp(App)
app.use(ElementPlus, {
  zIndex: 3000
})
app.mount('#app')
