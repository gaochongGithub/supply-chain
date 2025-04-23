import Vue from 'vue';  // Vue 2
import Vuex from 'vuex';
import user from './modules/user';  // 导入 user 模块

Vue.use(Vuex);  // 使用 Vuex

// 创建 store
const store = new Vuex.Store({
  modules: {
    user  // 注册 user 模块
  }
});

export default store;
