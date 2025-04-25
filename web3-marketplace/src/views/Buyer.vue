<template>
    <div class="app-container">
      <div class="filter-container" style="display: flex; justify-content: space-between; align-items: center;">
        <div class="filter-label" style="color: #5a5e66; margin-right: 10px; font-size: 20px; display: flex; padding-bottom: 6px; align-items: center;">
          Buyer
        </div>
        <div>
          <el-select v-model="listQuery.importance" placeholder="All Product" clearable style="width: 290px; margin-left: 20px" class="filter-item" @change="handleImportanceChange">
            <el-option v-for="item in importanceOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </div>
        
      </div>

      <Product ref="productRef" :productsMethod="productsMethod" :params="params"/>
      
    </div>
  </template>
  
  <script>
  import Product from './Product.vue';
  import { checkWallet } from '@/utils/web3.js'; 
  
  export default {
    name: 'Buyer',
    components: {Product},
    filters: {
      statusFilter(status) {
        const statusMap = {
          published: 'success',
          draft: 'info',
          deleted: 'danger'
        }
        return statusMap[status]
      },
    },
    data() {
      return {
        productsMethod: 'getAllProducts',
        params: '',
        list: [],
        listLoading: true,
        listQuery: {
          importance: "All Product",
        },
        importanceOptions: ["All Product", "My Order"],
        dialogPvVisible: false,
        downloadLoading: false
      }
    },
    async created() {
      await checkWallet()
      this.getList()
    },
    methods: {
      handleImportanceChange(newValue) {
        let status = 0;
        if (newValue === "All Product") {
          status = 0;
          // this.productsMethod = 'getAllProducts';
          // this.params = '';  // 没有特定参数
        } else if (newValue === "My Order") {
          status = 1;
          // this.productsMethod = 'getBuyerProducts'; // 仍然使用 getAllProducts 来查询
          // this.params = this.$store.state.user.account; // 使用当前用户的地址作为参数
          
        }
        this.$refs.productRef.updateBuyerList(status)
      },
      getList() {
        this.$refs.productRef.updateBuyerList(); // 调用 Product 组件内的方法更新列表
      },

    }
  }
  </script>
  