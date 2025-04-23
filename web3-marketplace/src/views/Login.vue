<template>
    <div class="login-container">
      <el-form class="login-form" autocomplete="on" label-position="left">
    
        <!-- 登录按钮 -->
        <el-button v-if="isConnect" 
                   :loading="loading" 
                   type="primary" 
                   style="width:100%; margin-bottom:30px;" 
                   @click.native.prevent="handleLogin">Connect</el-button>
          
        <!-- Buyer 和 Seller 按钮 -->
        <div v-if="isLoggedIn" class="button-container">
          <el-button type="success" 
                     style="width: 45%; margin-bottom: 10px; margin-right: 10px;" 
                     @click="registerBuyer">Buyer</el-button>
          <el-button type="warning" 
                     style="width: 45%; margin-bottom: 10px;" 
                     @click="registerSeller">Seller</el-button>
        </div>
    
      </el-form>
    </div>
  </template>
  
  <script>
    import { connectWallet, checkWallet, get, send } from '@/utils/web3.js';  // 根据你的路径引入

  export default {
    name: 'Login',
    data() {
        return {
            isConnect: true,
            loading: false,
            isLoggedIn: false,  // 控制是否显示 Buyer 和 Seller 按钮
            userAccount: '',
            userInfo: null,
        };
    },
    mounted() {
        // 页面加载时自动检测钱包连接状态
        this.checkWallet();
    },
    methods: {
        async checkWallet() {
            try {
              const accounts = await checkWallet()
              if(accounts.length > 0){
                  this.isConnect = false;
                  this.isLoggedIn = true;
                  this.userAccount = accounts[0];  // 存储钱包地址
                  this.getUserRole()
              }
            } catch (error) {
              console.log(error, "快快快")
            }
        },
        // 处理登录按钮点击事件
        async handleLogin() {
            this.loading = true;
            try {
                // 连接钱包
                const account = await connectWallet();
                this.userAccount = account;  // 存储钱包地址
                localStorage.setItem('userToken', account); // 添加这行
                this.getUserRole()
                this.isConnect = false
                this.loading = false;
                this.isLoggedIn = true;
            } catch (error) {
                console.error('Error during login process:', error);
            } finally {
                this.loading = false;  // 无论成功与否，都停止加载
            }
        },

        async getUserRole () {
            const admin = await get("isAdmin", [this.userAccount]);

            if(admin){
                this.$store.commit('user/setRole', 2)
                this.$router.push('/admin');
                return;
            }
            const user = await get("users", [this.userAccount]);
            if(user && user.addr == this.userAccount && user.isActive) {
              this.$store.commit('user/setRole', user.role)
                if(user.role == 0){
                  this.$store.commit('user/setRole', 0)
                    this.$router.push('/buyer');
                }else if(user.role == 1){
                  this.$store.commit('user/setRole', 1)
                  // this.$router.push({ name: 'ProductDetail', params: { id: 12345 } });
                    this.$router.push('/seller');
                }  
            }
        },

        // 跳转到 Buyer 页面
        async registerBuyer() {
            try {
                const register = await send("registerUser", [0])
                if(register.success){
                    this.$store.commit('user/setRole', 0)
                    this.$router.push('/buyer');
                }
            } catch (error) {
                console.log(error)
            }
        },

        // 跳转到 Seller 页面
        async registerSeller() {

            const register = await send("registerUser", [1])
            if(register.success){
              this.$store.commit('user/setRole', 1)
                this.$router.push('/seller');
            }
        }
    }
    };
  
  </script>
  
  <style lang="scss">
  /* 修复input 背景不协调 和光标变色 */
  /* Detail see https://github.com/PanJiaChen/vue-element-admin/pull/927 */
  
  $bg:#283443;
  $light_gray:#fff;
  $cursor: #fff;
  
  @supports (-webkit-mask: none) and (not (cater-color: $cursor)) {
    .login-container .el-input input {
      color: $cursor;
    }
  }
  
  /* reset element-ui css */
  .login-container {


  }
  </style>
  
  <style lang="scss" scoped>
  $bg:#2d3a4b;
  $dark_gray:#889aa4;
  $light_gray:#eee;
  
  .login-container {
    min-height: 100%;
    width: 100%;
    background-color: $bg;
    overflow: hidden;
  
    .login-form {
      position: relative;
      width: 520px;
      max-width: 100%;
      padding: 160px 35px 0;
      margin: 0 auto;
      overflow: hidden;
    }
  
    .tips {
      font-size: 14px;
      color: #fff;
      margin-bottom: 10px;
  
      span {
        &:first-of-type {
          margin-right: 16px;
        }
      }
    }
  }
  </style>
  