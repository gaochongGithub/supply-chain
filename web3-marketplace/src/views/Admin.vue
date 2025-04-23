<template>
    <div class="tab-container">
      <el-tabs v-model="activeName" style="margin-top:15px;" type="border-card">
        <el-tab-pane v-for="item in tabMapOptions" :key="item.key" :label="item.label" :name="item.key">
          <keep-alive>
            
          </keep-alive>
        </el-tab-pane>
        <tab-pane 
              v-if="activeName == 'Buyer' || activeName == 'Seller' " 
              ref="userList"
              :userMethod="userMethod"  />

        <Product v-if="activeName === 'Product'" ref="productRef" :productsMethod="productsMethod" :params="params"/>
      </el-tabs>
    </div>
  </template>
  
  <script>
  import TabPane from './components/TabPane.vue'
  import Product from './Product.vue';
  
  export default {
    name: 'Tab',
    components: { TabPane, Product },
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
      }
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
          // this.$refs.userList.getUserList();
          this.$nextTick(() => {
            this.$refs.userList.getUserList();
          });
        }
        
    }
    }
  }
  </script>
  
  <style scoped>
    .tab-container {
      margin: 30px;
    }
  </style>
  