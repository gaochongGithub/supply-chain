<template>
    <div class="">

      <el-table
        :key="tableKey"
        v-loading="listLoading"
        :data="productList"
        border
        fit
        highlight-current-row
        style="width: 100%;"
         @row-click="handleRowClick"
         :header-cell-style="{background: '#ecf0f4'}"
         class="customer-table"
      > 

        <el-table-column label="ID" align="center" width="100">
          <template slot-scope="{ row, $index }">
            <span>{{ $index }}</span>
          </template>
        </el-table-column>

        <el-table-column label="OrderNumber" align="center" width="180">
          <template slot-scope="{ row }">
            <span>{{ row.base.orderNumber }}</span>
          </template>
        </el-table-column>

        <el-table-column label="productType" align="center" width="180">
          <template slot-scope="{ row }">
            <span>{{ row.productType }}</span>
          </template>
        </el-table-column>
  
        <el-table-column label="Brand" align="center" width="180">
          <template slot-scope="{ row }">
            <span>{{ row.base.brand }}</span>
          </template>
        </el-table-column>
  
        <!-- <el-table-column label="ProductLocation" align="center" width="180">
          <template slot-scope="{ row }">
            <span>{{ row.base.productionLocation }}</span>
          </template>
        </el-table-column> -->
  
        <!-- <el-table-column label="Quantity" align="center" width="180">
          <template slot-scope="{ row }">
            <span>{{ row.base.quantity }}</span>
          </template>
        </el-table-column>
   -->
        <el-table-column label="IssueDate" align="center" min-width="200">
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
            <span :style="getStatusStyle(row.base.status)" class="status-dot"></span>
            <span>{{ row.productStatus }}</span>
          </template>
        </el-table-column>
  
        <!-- <el-table-column label="Buyer" align="center" min-width="180">
          <template slot-scope="{ row }">
            <span>{{ row.base.status == 0 ? 'None' : formatAddress(row.base.buyer) }}</span>
          </template>
        </el-table-column> -->
<!-- 
        <el-table-column v-if="isRoleBuyerOrAdmin" label="Actions" align="center" width="230" class-name="small-padding fixed-width">
            <template slot-scope="{row}">
              <el-button v-if="row.base.status == 0 && isRoleBuyer" size="mini" type="success" style="background-color: #6548ae; border:none"  @click="handleBuyProduct(row, 'BuyProduct')">
                  Buy
              </el-button>
              <span v-if="row.base.status !== 0 && isRoleBuyer">Sold</span>
              <el-button v-if="isRoleAdmin" size="mini" type="danger" @click="handleDelete(row)">
                Delete
              </el-button>
              <el-button v-if="row.base.status == 1 && isRoleAdmin" type="primary" size="mini" @click="handleUpdate(row, 'AddPoint')">
                Add Point
              </el-button>
              <el-button v-if="row.base.status == 1 && isRoleAdmin" size="mini" type="success"  @click="handleServiceProduct(row)">
                Service
              </el-button>
            </template>
        </el-table-column> -->
        <el-table-column v-if="isRoleBuyerOrAdmin" label="Actions" align="center" width="230" class-name="small-padding fixed-width">
          <template slot-scope="{row}">
            <!-- 水平排列操作按钮 -->
            <div class="actions-container">
              <div v-if="row.base.status == 0 && isRoleBuyer" @click="handleBuyProduct(row, 'BuyProduct')" class="action-text">
                Buy
              </div>
              <span v-if="row.base.status !== 0 && isRoleBuyer">Sold</span>

              <div v-if="isRoleAdmin" @click="handleDelete(row)" class="action-text">
                Delete
              </div>

              <div v-if="row.base.status == 1 && isRoleAdmin" @click="handleUpdate(row, 'AddPoint')" class="action-text">
                AddPoint
              </div>

              <div v-if="row.base.status == 1 && isRoleAdmin" @click="handleServiceProduct(row)" class="action-text">
                Service
              </div>
            </div>
          </template>
        </el-table-column>

  
      </el-table>
      
      <el-dialog v-loading="dialogLoading" :title="textMap[dialogStatus]" @close="handleDialogClose" :visible.sync="dialogFormVisible">
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
  import * as XLSX from 'xlsx'
  
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
      },
      isButtonClicking() {
        return this.$store.state.user.isButtonClicking
      },
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
        originalProductList: [],
        productList: [],
        listLoading: true,
        dialogLoading: false,
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
        // 监听 isButtonClicking 状态的变化
      'isButtonClicking'(newValue) {
        if (newValue) {
          // 状态变为 'true'，执行某些操作
          console.log('Button is being processed...')
          this.exportToExcel()
        }
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
        this.listLoading = true
        let productList;
        if(this.productsMethod == 'getAllProducts'){
            productList = await get(this.productsMethod, []);
        }else{
            productList = await get(this.productsMethod, [this.params]);
        }
        this.productList = []
        this.originalProductList = []
        if(productList.length == 0){
            this.listLoading = false;
            return;
        }

        // 并行处理所有商品数据
        const List = await Promise.all(productList.map(async (id, index) => {
            //返回商品详细信息
            const product = await get("getProductFullInfo", [Number(id)]);
            // 获取地址（使用缓存）
            const pointArray = await this.getLocationAddress(product.logistics);
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
        console.log(List, "这么慢的吗=====")
        this.originalProductList = [...List]; // 保存原始列表
        this.productList = [...List];
        this.listLoading = false;
      },
      filterProductsByStatus(status) {
        switch (status) {
            case 0:
                return this.originalProductList.filter(product => product.base.status === 0);
            case 1:
                return this.originalProductList.filter(product => product.base.status === 1);
            default:
                return this.originalProductList; // 默认返回所有商品
        }
    },
    updateProductList(status){
      const list = this.filterProductsByStatus(status);
      
      this.productList = list;
    },
    filterProductsBuyer(status){
      let addr = localStorage.getItem('userAddress'); // 添加这行
      let address = this.$store.state.user.address == null ? addr : this.$store.state.user.address;
      console.log(address, "当前地址=-=====")
      switch (status) {
            case 0:
              return this.originalProductList;
            case 1:
                return this.originalProductList.filter(product => product.base.buyer == address);
            default:
                return this.originalProductList; // 默认返回所有商品
        }
    },
    updateBuyerList(status){
      const list = this.filterProductsBuyer(status);
      
      this.productList = list;
    },
      async getLocationPoint(path){
          const locationKey = `${path}`;
          let cachedLocation = getLocationCache(locationKey);
          if(cachedLocation){
            return cachedLocation;
          }
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
            this.dialogLoading = true;
            await send('buyProduct', [this.temp.orderNumber, this.temp.path])
            this.getProductList()
            this.listLoading = false;
            this.dialogLoading = false;
            this.dialogFormVisible = false
        } catch (error) {
            this.$message.error('Product Create Error: ' + error.message)
            this.listLoading = false;
            this.dialogLoading = false;
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
    async handleServiceProduct(row){
      this.listLoading = true;
      try {
        await send("markAsDelivered", [row.base.orderNumber])
        this.listLoading = false;
        this.getProductList();
      } catch (error) {
        this.listLoading = false;
      }
      
    },
    getStatusStyle(status){
      let color = '';
      if (status === 0) {
        color = 'red'; // 红色
      } else if (status === 1) {
        color = 'gray'; // 灰色
      } else if (status === 2) {
        color = 'green'; // 绿色
      }
      return { backgroundColor: color };
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
    },
    exportToExcel() {
      if(this.productList.length <= 0){
        this.$message.error('No message')
        return;
      }
      const header = ["OrderNumber", "ProductType", "Brand", "IssueDate", "Location", "Status"];
      const allData = [header];
      for (let i = 0; i < this.productList.length; i++) {
        allData.push([
            Number(this.productList[i].base.orderNumber),
            this.productList[i].productType,
            this.productList[i].base.brand,
            this.productList[i].issueDate,
            this.productList[i].logistics[0].path,
            this.productList[i].productStatus,
          ]);
      }
      
      const ws = XLSX.utils.aoa_to_sheet(allData)  // 将数据转换为工作表
      const wb = XLSX.utils.book_new()  // 创建新的工作簿
      XLSX.utils.book_append_sheet(wb, ws, 'Product')  // 将工作表添加到工作簿中

      // 导出为 Excel 文件
      XLSX.writeFile(wb, 'products.xlsx')

      // 导出完毕后，重置状态
      this.$store.commit('user/setButtonClicking')
    },
    }
  }
  </script>
<style>

.customer-table th{
    border:none;
  }
.customer-table td,.customer-table th.is-leaf {
  border:none;
}

.el-table--border, .el-table--group{
  border: none;
}

.customer-table thead tr th.is-leaf{
  border: 1px solid #EBEEF5;
  border-right: none;
}
.customer-table thead tr th:nth-last-of-type(2){
  border-right: 1px solid #EBEEF5;
}

.el-table--border::after, .el-table--group::after{
  width: 0;
}
.customer-table::before{
  width: 0;
}
.customer-table .el-table__fixed-right::before,.el-table__fixed::before{
  width: 0;
}
.el-table--border .el-table__cell {
  border-right: none;
}
.el-table--border th.gutter:last-of-type {
    border: 1px solid #EBEEF5;  
    border-left: none;
}
.el-table .el-table__cell:nth-child(1) {
  text-align: center;
}

/* 后续单元格左对齐 */
.el-table .el-table__cell:nth-child(n+2) {
  text-align: left;
}
.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
}
/* 使操作按钮水平排列 */
.actions-container {
  display: flex;
  gap: 10px;  /* 按钮之间的间距 */
  justify-content: flex-start; /* 左对齐 */
  align-items: center; /* 垂直居中对齐 */
}

/* 操作项文字样式 */
.action-text {
  color: #606266;  /* 设置文字颜色 */
  cursor: pointer;  /* 鼠标悬停时显示为指针 */
  text-decoration: underline;  /* 可选，去除下划线 */
}

/* 鼠标悬停时，文字颜色变化 */
.action-text:hover {
  color: #606266;
}

</style>
  