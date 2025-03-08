import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './assets/styles/main.css'
import './assets/theme.css'
import './assets/element-dark.css'

const app = createApp(App)
app.use(ElementPlus, {
  zIndex: 3000
})
app.mount('#app')
