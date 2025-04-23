<template>
    <div class="app-container">

      <el-table
        :key="tableKey"
        v-loading="listLoading"
        :data="productList"
        border
        fit
        highlight-current-row
        style="width: 100%;"
         @row-click="handleRowClick"
      > 
  
        <el-table-column label="productType" align="center" width="150">
          <template slot-scope="{ row }">
            <span>{{ row.productType }}</span>
          </template>
        </el-table-column>
  
        <el-table-column label="Brand" align="center" width="100">
          <template slot-scope="{ row }">
            <span>{{ row.base.brand }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="OrderNumber" align="center" min-width="120">
          <template slot-scope="{ row }">
            <span>{{ row.base.orderNumber }}</span>
          </template>
        </el-table-column>
        
  
        <el-table-column label="ProductLocation" align="center" width="180">
          <template slot-scope="{ row }">
            <span>{{ row.base.productionLocation }}</span>
          </template>
        </el-table-column>
  
        <el-table-column label="Quantity" align="center" width="180">
          <template slot-scope="{ row }">
            <span>{{ row.base.quantity }}</span>
          </template>
        </el-table-column>
  
        <el-table-column label="IssueDate" align="center" min-width="230">
          <template slot-scope="{ row }">
            <span>{{ row.issueDate }}</span>
          </template>
        </el-table-column>
  
        <el-table-column label="Location" align="center" min-width="180">
          <template slot-scope="{ row }">
            <span>{{ row.logistics[0].path }}</span>
          </template>
        </el-table-column>
  
        <el-table-column label="Status" align="center" width="180">
          <template slot-scope="{ row }">
            <span>{{ row.productStatus }}</span>
          </template>
        </el-table-column>
  
        <el-table-column label="Buyer" align="center" min-width="180">
          <template slot-scope="{ row }">
            <span>{{ row.base.status == 0 ? 'None' : formatAddress(row.base.buyer) }}</span>
          </template>
        </el-table-column>

        <el-table-column v-if="isRoleBuyerOrAdmin" label="Actions" align="center" width="230" class-name="small-padding fixed-width">
            <template slot-scope="{row}">
            <el-button v-if="row.base.status == 0 && isRoleBuyer" size="mini" type="success" @click="handleBuyProduct(row, 'BuyProduct')">
                Buy
            </el-button>
            <span v-if="row.base.status !== 0 && isRoleBuyer">Sold</span>
            <el-button v-if="isRoleAdmin" size="mini" type="danger" @click="handleDelete(row)">
              Delete
            </el-button>
            <el-button v-if="row.base.status == 1 && isRoleAdmin" type="primary" size="mini" @click="handleUpdate(row, 'AddPoint')">
              Add Point
            </el-button>
            </template>
        </el-table-column>
  
      </el-table>
      
      <el-dialog :title="textMap[dialogStatus]" @close="handleDialogClose" :visible.sync="dialogFormVisible">
        <el-form ref="dataForm" label-position="left" label-width="100px" style="width: 500px; margin-left:50px;">

            <!-- 收货地 -->
            <el-form-item v-if="isRoleBuyer" label="Path" prop="path">
                <el-input v-model="temp.path" @blur="updateLocation" />
            </el-form-item>

            <!-- Admin 添加路径 -->
            <el-form-item v-if="isRoleAdmin" label="Path" prop="path">
              <el-input v-model="pathPoint" @blur="updateArrLocation" placeholder="Please enter one or more addresses"/>
              <p>Please enter one or more addresses, separate multiple addresses with commas (eg: beijing, nanjing, shanghai)</p>
            </el-form-item>
            
        </el-form>
        <div slot="footer" class="dialog-footer">
            <el-button @click="dialogFormVisible = false">Cancel</el-button>
            <el-button type="primary" @click="panelConfirm()">Confirm</el-button>
        </div>
    </el-dialog>

    </div>
  </template>
  
  <script>
  import { get, send } from '@/utils/web3.js'; 
  import { getProductType, getUSTime, getSize, getProductStatus, getJewelryMaterial, getFoodType, setLocationCache, getLocationCache } from '@/utils/utils.js'; 
  // 
  import { geocode  } from '@/utils/geocodeService';//reverseGeocode

  
  export default {
    name: 'Product',
    components: {},
    filters: {
 
    },
    computed: {
      // 使用计算属性获取角色信息，避免直接在模板中访问 this.$store
      isRoleBuyer() {
        return this.$store.state.user.role === 0;
      },
      isRoleAdmin() {
        return this.$store.state.user.role === 2;
      },
      isRoleBuyerOrAdmin() {
        return this.isRoleBuyer || this.isRoleAdmin;
      }
    },
    props: {
        productsMethod: {
            type: String,
            required: true
        },
        params: {
            type: String,
            required: true
        }
    },
    data() {
      return {
        tableKey: 0,
        locationCache: {}, // 地址缓存对象
        productList: [],
        listLoading: true,
        dialogFormVisible: false,
        dialogStatus: '',
        userRole: this.$store.state.user.role,
        textMap: {
          update: 'Edit',
          create: 'Create'
        },
        temp:{
            orderNumber: 0,
            path: '',
        },
        addLogistics: {
          orderNumber: 0,
          path: []
        },
        pathPoint: '',
        pathArray: [],
        dialogPvVisible: false,
        downloadLoading: false,
        rules: {
            path: [
              { required: true, message: 'Please enter or select the place of shipment', trigger: 'blur' }
            ]
        },
      }
    },
    watch: {
        // 监听 props 变化，更新商品列表
        productsMethod() {
            this.getProductList();
            console.log("2222222222222")
        },
    },
    async mounted() {
      
    },
    async created() {
      this.getProductList()
      console.log("1111111111111111")
    },
    methods: {
      async getProductList() {
        console.log("调用三次===========")
        this.listLoading = true
        let productList;
        if(this.productsMethod == 'getAllProducts'){
            productList = await get(this.productsMethod, []);
        }else{
            productList = await get(this.productsMethod, [this.params]);
        }
        this.productList = []
        if(productList.length == 0){
            this.listLoading = false;
            return;
        }

        // 并行处理所有商品数据
        this.productList = await Promise.all(productList.map(async (id, index) => {
            //返回商品详细信息
            const product = await get("getProductFullInfo", [Number(id)]);
            // 获取地址（使用缓存）
            const pointArray = await this.getLocationAddress(product.logistics);
            // console.log(pointArray, product, "pointArray当前路径====")
            // 返回增强后的数据对象
            return {
                ...product,
                index: index,
                productType: getProductType(product.base.pType),
                issueDate: getUSTime(product.base.issueDate),
                clotingSize: getSize(product.attrs.clothingSize),
                jewelryMaterial: getJewelryMaterial(product.attrs.jewelryMaterial),
                foodExpiry: getUSTime(product.attrs.foodExpiry),
                productionDate: getUSTime(product.attrs.productionDate),
                foodType: getFoodType(product.attrs.foodType),
                productStatus: getProductStatus(product.base.status),
                pointArray: pointArray,
            };
        }));
        
        this.listLoading = false;
      },
      async getLocationPoint(path){
          const locationKey = `${path}`;
          let cachedLocation = getLocationCache(locationKey);
          console.log(path, "输入地址====")
          if(cachedLocation){
            return cachedLocation;
          }
          console.log("没走缓存")
          let coordinates = await geocode(path);
          if(coordinates.length > 1){
            setLocationCache(locationKey, coordinates);
          }
          return coordinates;
      },
      async getLocationAddress(path) {
        let Point = [];
        for(var i=0;i<path.length;i++){
          let point = await this.getLocationPoint(path[i].path);
          if(point.length > 0){
            Point.push(point)
          }
        }
        return Point;
      },
      async updateLocation() {
        if (this.temp.path) {
          try {
            let point = await this.getLocationPoint(this.temp.path);
            if(point.length <= 0){
              this.temp.path = '';
              return this.$message.error(' Please enter a valid address ')
            }

          } catch (error) {
            console.error('Please enter a valid address', error);
          }
        }
      },

      async updateArrLocation() {
        if (this.pathPoint) {
          try {
            let point = this.pathPoint.split(",")
            for(var i=0;i< point.length; i++){
              let pointArr = await this.getLocationPoint(point[i]);
              
              if(pointArr.length == 0){
                this.$message.error('Please enter the delivery location')
                this.pathPoint = ''
                return;
              }
              
            }
            this.addLogistics.path = point;
          } catch (error) {
            console.error('Please enter a valid address', error);
          }
        }
      },

      handleRowClick(row, event){
        if (event.label == "Actions") {
            return
        }
        this.$router.push({ name: 'ProductDetail', params: { product: row } });
      },
      handleBuyProduct(row, type) {
        this.dialogStatus = type;
        this.listLoading = true;
        this.dialogFormVisible = true;
        this.temp.orderNumber = Number(row.base.orderNumber);
    },
    handleUpdate(row, type){
      this.dialogStatus = type;
      this.listLoading = true;
      this.dialogFormVisible = true;
      this.addLogistics.orderNumber = Number(row.base.orderNumber);
    },
    async panelConfirm(){
      console.log(this.dialogStatus, "状态====")
      if(this.dialogStatus == 'BuyProduct'){
        await this.buyProduct();
      }else{
        await this.addLogisticsFunc();
      }
    },
    async buyProduct(){
        if (!this.temp.path){
            this.$message.error('Please enter the delivery location')
            return;
        }
        try {
            await send('buyProduct', [this.temp.orderNumber, this.temp.path])
            this.getProductList()
            this.listLoading = false;
            this.dialogFormVisible = false
        } catch (error) {
            this.$message.error('Product Create Error: ' + error.message)
            this.listLoading = false;
        }
    },
    async addLogisticsFunc(){
        if (this.addLogistics.path.length == 0){
            this.$message.error('Please enter the delivery location')
            return;
        }
        try {
            await send('addLogisticsNode', [this.addLogistics.orderNumber, this.addLogistics.path])
            this.getProductList()
            this.listLoading = false;
            this.dialogFormVisible = false
        } catch (error) {
            this.$message.error('Product Create Error: ' + error.message)
            this.listLoading = false;
        }
    },
    handleDialogClose() {
      this.location = '';
      this.temp.orderNumber = 0; 
      this.temp.path = '' 
      this.listLoading = false;
    },
    async handleDelete(row){
      this.listLoading = true;
      try {
        await send("deleteProduct", [row.base.orderNumber])
        this.getProductList();
        this.listLoading = false;
      } catch (error) {
        console.log(error, "返回错误")
      }
    },
    formatAddress(address) {
      // 确保地址是有效的
      if (typeof address !== 'string') {
        throw new Error('Invalid Ethereum address');
      }

      // 获取前4个字符和后4个字符
      const first4 = address.slice(0, 4); // '0x' + 前4个字符
      const last4 = address.slice(-4); // 最后4个字符

      // 拼接成新的格式
      return `${first4}...${last4}`;
    }
    }
  }
  </script>
  