import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import Element from 'element-ui'
import './styles/element-variables.scss'
import '@/styles/index.scss' // global css
import '@/assets/custom-theme/index.css'; // 确保路径正确
import { initWalletListeners } from './utils/web3'

Vue.config.productionTip = false

// 初始化钱包监听
initWalletListeners(store)

Vue.use(Element)  // 全局注册 Element UI 组件

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')