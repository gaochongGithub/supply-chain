<template>
    <div class="app-container">
      <div class="filter-container" style="display: flex; justify-content: space-between; align-items: center;">
        <div class="filter-label" style="color: #5a5e66; margin-right: 10px; font-size: 20px; display: flex; padding-bottom: 6px; align-items: center;">
          Admin
        </div>
        
        <div class="right-menu">
          <!-- <el-select placeholder="Imp" clearable style="width: 190px; margin-left: 20px; margin-right: 10px" class="filter-item">
            <el-option v-for="item in importanceOptions" :key="item" :label="item" :value="item" />
          </el-select> -->
        </div>
        
      </div>
       <div class="admin-list">
        <el-tabs v-model="activeName" style="margin-top:0px;" type="border-card">
          <el-tab-pane v-for="item in tabMapOptions" :key="item.key" :label="item.label" :name="item.key">
            <keep-alive>
              
            </keep-alive>
          </el-tab-pane>
          <tab-pane 
                v-show="activeName == 'Buyer' || activeName == 'Seller'" 
                ref="userList"
                :userMethod="userMethod"  />

          <Product v-show="activeName === 'Product'" ref="productRef" :productsMethod="productsMethod" :params="params"/>
        </el-tabs>
      </div>
    </div>
  </template>
  
  <script>
  import TabPane from './components/TabPane.vue'
  import Product from './Product.vue';
  
  export default {
    name: 'Tab',
    components: { TabPane, Product },//TabPane, Product
    data() {
      return {
        productsMethod: 'getAllProducts',
        params: '',
        userMethod: 'getAllBuyers',
        tabMapOptions: [
          { label: 'Buyer', key: 'Buyer' },
          { label: 'Seller', key: 'Seller' },
          { label: 'Product', key: 'Product' },
        ],
        activeName: 'Buyer',
        createdTimes: 0,
      }
    },
    computed: {
        isButtonClicking() {
          return this.$store.state.user.isButtonClicking
        },
    },
    watch: {
      activeName(val) {
  
        const currentTab = this.$route.query.tab;
        if (currentTab !== val) {
          // 更新 URL 参数 tab 的值
          this.$router.push({
            path: this.$route.path,
            query: { ...this.$route.query, tab: val }
          });
          this.$nextTick(() => {
            this.fetchList();
          });
          // this.userMethod = val
        }
      },
       // 监听 isButtonClicking 状态的变化
      'isButtonClicking'(newValue) {
        if (newValue) {
          console.log("触发点击====")
          this.exportToExcel()
        }
      },
    },
    created() {
      // init the default selected tab
      const tab = this.$route.query.tab
      if (tab) {
        this.activeName = tab
      }
    },
    mounted() {
        // 页面加载时自动检测钱包连接状态
        if (!this.createdTimes) {
          this.fetchList();
          this.createdTimes = 1;  // 记录首次加载
        }
    },
    methods: {
      async fetchList() {
        if (this.activeName === 'Buyer') {
          this.userMethod = "getAllBuyers"
        } else if (this.activeName === 'Seller') {
          this.userMethod = "getAllSellers"
        }
        if(this.activeName !== 'Product'){
          console.log(this.userMethod, "Admin页面====")
          this.$nextTick(() => {

            if (this.$refs.userList) {
              this.$refs.userList.getUserList();
            }
          });
          
        }else{
          this.$nextTick(() => {

            if (this.$refs.productRef) {
              this.$refs.productRef.getProductList();
            }
          });
        }
        
    },
    exportToExcel(){
      if(this.activeName == 'Product'){
          if (this.$refs.productRef) {
            this.$refs.productRef.exportToExcel();
          }
      }else{
        if (this.$refs.userList) {
            this.$refs.userList.exportToExcel();
        }
      }
    }
    }
  }
  </script>
  
  <style>
  .el-tabs--border-card {
    background: #feffff;
    border: none;
    box-shadow: none;
  }
  .el-tabs--border-card > .el-tabs__header {
    background: #feffff;
    border-bottom: none;
  }
  .el-tabs--border-card > .el-tabs__content {
    padding: 0px;
    padding-top: 10px;
  }
    .tab-container {
      margin: 10px;
    }
  </style>
  