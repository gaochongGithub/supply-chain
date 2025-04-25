<template>
    
    <div class="product-detail" style="padding: 20px;">
      <el-button @click="goBack" style="width: 40px; height: 40px; padding: 0; border: none;background: none;">
        <img src="@/assets/back.png" alt="Back" style="width: 100%; height: 100%;">
      </el-button>
      <!-- 商品信息区块 -->
      <div class="product-info" style="margin-bottom: 10px; padding: 10px; border: 1px solid #eee;">
        <h2>Product Details</h2>
        <el-row>
          <el-col :span="12">
            <h3>Product Base</h3>
            <p>OrderNumber: {{ product.base.orderNumber }}</p>
            <p>Brand: {{ product.base.brand }}</p>
            <p>Product Type: {{ product.productType }}</p>
            <p>Product Location: {{ product.base.productionLocation }}</p>
            <p>Product quantity: {{ product.base.quantity }}</p>
            <p>Product issueDate: {{ product.issueDate }}</p>
            <p>Product status: {{ product.productStatus }}</p>
            <p>Product buyer: {{ product.base.status == 0 ? 'None' : product.base.buyer }}</p>
          </el-col>
          <el-col :span="12">
            <h3>Special Attributes</h3>
            <!-- <p v-for="(value, key) in product.attrs" :key="key">{{ key }}: {{ value }}</p> -->
            <p v-if='product.base.pType == 0 || product.base.pType == 1'>Color: {{ product.attrs.color }}</p>
            <p v-if='product.base.pType == 0'>Size: {{ product.clotingSize }}</p>

            <p v-if='product.base.pType == 1'>JewelryMaterial: {{ product.jewelryMaterial }}</p>
            <p v-if='product.base.pType == 2'>FoodExpiry: {{ product.foodExpiry }}</p>

            <p v-if='product.base.pType == 2'>ProductionDate: {{ product.productionDate }}</p>
            <p v-if='product.base.pType == 2'>FoodType: {{ product.foodType }}</p>
          </el-col>
        </el-row>
        
      </div>

      <!-- 物流地图区块 -->
      <div class="logistics-map" style="height: 500px;">
        <!-- <LogisticsMap :locations="product.logistics" /> -->
        <LogisticsMap 
          :product-data="{
            pointArray: product.pointArray,
            product: product
          }"
        />
      </div>
    </div>
  </template>
  
  <script>
  // 引入物流路径地图组件
  import LogisticsMap from './LogisticsMap.vue';
   
  export default {
    props: ['product'],  // 从路由参数中接收 id
    components: {
      LogisticsMap,
    },
    data() {
      // 模拟商品数据
      return {};
    },
    created() {
        console.log('Product ID:', this.product);
        // 在这里你可以根据 id 请求数据
    },
    methods: {
      goBack() {
        this.$router.go(-1);  // 返回上一页
      }
    },
  };
  </script>
  
  <style scoped>
  .product-detail {
    padding: 20px;
  }
  
  .product-info {
    padding: 10px;
    border: 1px solid #eee;
  }
  
  .logistics-map {
    height: 500px;
  }
  </style>
  