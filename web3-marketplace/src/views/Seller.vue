<template>
  <div class="app-container">
    <div class="filter-container" style="display: flex; justify-content: space-between; align-items: center;">
      <div class="filter-label" style="color: #5a5e66; margin-right: 10px; font-size: 20px; display: flex; padding-bottom: 6px; align-items: center;">
        Seller
      </div>
      
      <div class="right-menu">
        <el-select v-model="statusOptions" placeholder="Status" clearable style="width: 190px; margin-left: 20px; margin-right: 10px" class="filter-item" @change="handleStatusOptions">
          <el-option v-for="item in statusOptionsMap" :key="item" :label="item" :value="item" />
        </el-select>
        <el-button class="filter-item" style="margin-left: 10px; background-color: #6548ae; border:none" type="primary" icon="el-icon-edit" @click="handleCreate">
          Add
        </el-button>
      </div>
    </div>
    
    <Product ref="productRef" :productsMethod="productsMethod" :params="this.$store.state.user.account" />

    <el-dialog v-loading="listLoading" :title="textMap[dialogStatus]" @close="handleDialogClose" :visible.sync="dialogFormVisible">
      <el-form ref="dataForm" :rules="rules" :model="temp" label-position="left" label-width="150px" style="width: 400px; margin-left:50px;">

        <!-- 商品种类 -->
        <el-form-item label="pType" prop="pType">
          <el-select v-model="temp.pType" class="filter-item" style="width: 100%;" placeholder="Please select" @change="handleTypeChange">
            <el-option v-for="item in calendarTypeOptions" :key="item.key" :label="item.display_name" :value="item.key" />
          </el-select>
        </el-form-item>

        <!-- 品牌 -->
        <el-form-item label="Brand" prop="brand">
          <el-input v-model="temp.brand" placeholder="Please enter the brand" />
        </el-form-item>

        <!-- 生产地 -->
        <el-form-item label="PLocation" prop="productionLocation">
            <el-input v-model="temp.productionLocation" placeholder="Please enter the generation address" />
        </el-form-item>

        <!-- 数量 -->
        <el-form-item label="Quantity" prop="quantity">
            <el-input v-model="temp.quantity" placeholder="Please enter the quantity" />
        </el-form-item>

        <!-- 发货地 -->
        <el-form-item label="Path" prop="path">
          <el-input v-model="temp.path" @blur="updateLocation" placeholder="Please enter the shipping address" />
        </el-form-item>

         <!-- 颜色 -->
         <el-form-item v-if="isClothing || isMaterial" label="Color" prop="color">
            <el-input v-model="temp.color" placeholder="Please enter the color" />
          </el-form-item>

          <!-- 衣服尺寸 -->
          <el-form-item v-if="isClothing" label="Size" prop="size">
            <el-select v-model="temp.size" class="filter-item" style="width: 100%;" placeholder="Please select">
              <el-option v-for="item in clothingSize" :key="item.key" :label="item.display_name" :value="item.key" />
            </el-select>
          </el-form-item>

          <!-- 珠宝材质 -->
          <el-form-item v-if="isMaterial" label="JewelryMaterial" prop="jewelryMaterial">
            <el-select v-model="temp.jewelryMaterial" class="filter-item" style="width: 100%;" placeholder="Please select">
              <el-option v-for="item in jewelryMaterial" :key="item.key" :label="item.display_name" :value="item.key" />
            </el-select>
          </el-form-item>

          <!-- 食物保质期 -->
          <el-form-item v-if="isFood" label="FoodExpiry" prop="foodExpiry">
            <el-date-picker v-model="temp.foodExpiry" value-format="timestamp" style="width: 100%;" :default-value="new Date()" type="datetime" placeholder="Please pick a date" />
          </el-form-item>

          <!-- 食物生产日期 -->
          <el-form-item v-if="isFood" label="ProductDate" prop="productionDate">
            <el-date-picker v-model="temp.productionDate" value-format="timestamp" style="width: 100%;" :default-value="new Date()" type="datetime" placeholder="Please pick a date" />
          </el-form-item>

          <!-- 食物种类 -->
          <el-form-item v-if="isFood" label="FoodType" prop="foodType">
            <el-select v-model="temp.foodType" class="filter-item" style="width: 100%;" placeholder="Please select">
              <el-option v-for="item in foodType" :key="item.key" :label="item.display_name" :value="item.key" />
            </el-select>
          </el-form-item>
          
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">Cancel</el-button>
        <el-button style="background-color: #6548ae; border:none;color: #feffff;" @click="createData()">Confirm</el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script>
import { send, checkWallet } from '@/utils/web3.js'; 
import { generateOrderId } from '@/utils/utils.js'; 
import { geocode } from '@/utils/geocodeService';
import Product from './Product.vue';


const calendarTypeOptions = [
  { key: 0, display_name: 'Clothing' },
  { key: 1, display_name: 'Jewelry' },
  { key: 2, display_name: 'Food' },
]

const clothingSize = [
  { key: 0, display_name: 'S', value: 0 },
  { key: 1, display_name: 'M', value: 1 },
  { key: 2, display_name: 'L', value: 2 },
  { key: 3, display_name: 'XL', value: 3 },
  { key: 4, display_name: 'XXL', value: 4 }
]


const jewelryMaterial = [
  { key: 0, display_name: 'Silver' },
  { key: 1, display_name: 'Gold' },
  { key: 2, display_name: 'Diamond' },
]

const foodType = [
  { key: 0, display_name: 'Fruit' },
  { key: 1, display_name: 'Rice' },
  { key: 2, display_name: 'Noodles' },
  { key: 3, display_name: 'Meat' }
]


const calendarTypeKeyValue = calendarTypeOptions.reduce((acc, cur) => {
  acc[cur.key] = cur.display_name
  return acc
}, {})

export default {
  name: 'Seller',
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
    typeFilter(type) {
      return calendarTypeKeyValue[type]
    },
    
  },
  data() {
    return {
      productsMethod: 'getSellerProducts',
      tableKey: 0,
      locationCache: {}, // 地址缓存对象
      productList: [],
      total: 0,
      listLoading: true,
      calendarTypeOptions,
      jewelryMaterial,
      foodType,
      clothingSize,
      isClothing: true,
      isMaterial: false,
      isFood: false,
      statusOptions: 'All Product',
      statusOptionsMap: ["All Product", "Not Sold", "Sold"],
      temp: {
        pType: 0, //商品种类
        orderNumber: 0, //订单号
        brand: '', //品牌
        productionLocation: '', //生产地
        quantity: 1, //数量
        path: '',
        color: '',
        size: null,
        jewelryMaterial: 0,
        foodExpiry: 0,
        productionDate: 0,
        foodType: 0  // 新增：食物种类枚举值
      },
      dialogFormVisible: false,
      dialogStatus: '',
      textMap: {
        update: 'Edit',
        create: 'Create'
      },
      dialogPvVisible: false,
      pvData: [],
      rules: {
        pType: [
          { required: true, message: 'Please select the product type', trigger: 'change' }
        ],
        brand: [
          { required: true, message: 'Please enter the brand name', trigger: 'blur' }
        ],
        productionLocation: [
          { required: true, message: 'Please enter the place of production', trigger: 'blur' }
        ],
        quantity: [
          { required: true, message: 'Please enter the quantity', trigger: 'blur' },
          { type: 'number', message: 'Must be a numeric value' }
        ],
        color: [
          { required: true, message: 'Please enter the color', trigger: 'blur' }
        ],
        size: [
          { required: true, message: 'Please select the size', trigger: 'change' }
        ],
        jewelryMaterial: [
          { required: true, message: 'Please select the material', trigger: 'change' }
        ],
        productionDate: [
          { required: true, message: 'Please select the production date', trigger: 'change' }
        ],
        foodExpiry: [
          { required: true, message: 'Please select the shelf life', trigger: 'change' }
        ],
        foodType: [
          { required: true, message: 'Please select the food type', trigger: 'change' }
        ],
        path: [
          { required: true, message: 'Please enter or select the place of shipment', trigger: 'blur' }
        ]
    },
      downloadLoading: false
    }
  },
  watch: {
  'temp.pType': {
      handler(newVal) {
        this.isClothing = newVal === 0
        this.isMaterial = newVal === 1
        this.isFood = newVal === 2
        this.temp.pType = newVal;
        
        // 重置相关字段
        if (newVal !== 0) {
          this.temp.size = 0
          this.temp.color = ''
        }
        if (newVal !== 1) {
          this.temp.jewelryMaterial = 0
          this.temp.color = ''
        }
        if (newVal !== 2) {
          this.temp.foodExpiry = 0
          this.temp.productionDate = 0
          this.temp.foodType = 0
          this.temp.color = ''
        }
        if(newVal == 2){
          this.temp.foodExpiry = Date.now()
          this.temp.productionDate = Date.now()
        }
      },
      immediate: true
    }
  },
  async mounted() {
    
  },
  async created() {
    await checkWallet()
    this.listLoading = false;

  },
  methods: {

    handleCreate() {
      this.dialogStatus = 'create'
      this.dialogFormVisible = true
    },
    async updateLocation() {
      if (this.temp.path) {
        try {
          const coordinates = await geocode(this.temp.path);
          if(coordinates.length <= 0){
            this.temp.path = '';
            return this.$message.error(' Please enter a valid address ')
          }

        } catch (error) {
          console.error('Please enter a valid address', error);
        }
      }
    },
    async createData() {
      
      this.$refs['dataForm'].validate(async (valid) => {
        if (valid) {
          this.listLoading = true;
          this.temp.orderNumber = generateOrderId();
          if(this.temp.orderNumber == 0){
            return this.$message.error('Order Number is error ')
          }
          this.temp.productionDate = Math.floor(this.temp.productionDate/1000)
          this.temp.foodExpiry = Math.floor(this.temp.foodExpiry/1000)
          console.log(this.temp, "验证数据")
          try {
            await send("createProduct", [this.temp])
            this.$refs.productRef.getProductList();
            this.listLoading = false;
            this.dialogFormVisible = false
          } catch (error) {
            this.$message.error('Product Create Error: ' + error.message)
            this.listLoading = false;
          }
          
        }
      })
    },
    resetFormData() {
        this.temp.pType = 0;
        this.temp.brand = '';
        this.temp.productionLocation = '';
        this.temp.quantity = 1; //数量
        this.temp.path = '';
        this.temp.color = '';
        this.temp.size = 0;
        this.temp.jewelryMaterial = 0;
        this.temp.foodExpiry = 0;
        this.temp.productionDate = 0;
        this.temp.foodType = 0;
    },

    handleDialogClose() {
      // this.$refs.dataForm.resetFields();
      this.resetFormData();
      this.resetFormValidate();
      this.closeAllPopper();
    },
    closeAllPopper() {
      // 关闭所有Element UI弹出层
      document.body.click() // 触发全局点击关闭所有popper
      this.$nextTick(() => {
        // 强制清除残留的popper元素
        const poppers = document.querySelectorAll('.el-popper')
        poppers.forEach(p => p.parentNode?.removeChild(p))
      })
    },
    resetFormValidate() {
      this.$refs.dataForm?.clearValidate()
      // 强制重置所有验证状态
      const errorMessages = document.querySelectorAll('.el-form-item__error')
      errorMessages.forEach(msg => msg.style.display = 'none')
    },
    handleStatusOptions(newValue){
      this.statusOptions = newValue;
      let status = -1
      if(newValue == this.statusOptionsMap[0]){
        status = -1
      }else if(newValue == this.statusOptionsMap[1]){
        status = 0
      }else{
        status = 1
      }
      this.$refs.productRef.updateProductList(status);
    },
    handleTypeChange(){
      this.$nextTick(() => {
        this.$refs.dataForm.clearValidate()
      })
    }

  }
}
</script>
