<!-- src/App.vue -->
<template>
  <div id="app">
    <Navbar v-if="showNavbar" /> 
    <!-- 路由出口：根据路由显示对应页面 -->
    <router-view/>
  </div>
</template>

<script>
import Navbar from './components/Navbar.vue';
export default {
  name: 'App',
  components: {
    Navbar
  },
  computed: {
    showNavbar() {
      let isNav = true;
      if(this.$route.name == 'Login' || this.$route.name == 'ProductDetail'){
        isNav = false
      }
      return isNav; // 如果路由不是 Login，则显示 Navbar
    }
  }
}
</script>