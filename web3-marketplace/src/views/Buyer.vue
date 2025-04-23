<template>
    <div class="app-container">
      <div class="filter-container">
        <el-select v-model="listQuery.importance" placeholder="Imp" clearable style="width: 290px; margin-left: 20px" class="filter-item" @change="handleImportanceChange">
          <el-option v-for="item in importanceOptions" :key="item" :label="item" :value="item" />
        </el-select>
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
        if (newValue === "All Product") {
          this.productsMethod = 'getAllProducts';
          this.params = '';  // 没有特定参数
        } else if (newValue === "My Order") {
          this.productsMethod = 'getBuyerProducts'; // 仍然使用 getAllProducts 来查询
          this.params = this.$store.state.user.account; // 使用当前用户的地址作为参数
          
        }
        this.getList(); // 每次变化都重新获取列表
      },
      getList() {
        this.$refs.productRef.getProductList(); // 调用 Product 组件内的方法更新列表
      },

    }
  }
  </script>
  