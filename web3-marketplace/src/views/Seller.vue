<template>
  <div class="app-container">
    <div class="filter-container" style="display: flex; justify-content: flex-end;">
      <el-button class="filter-item" style="margin-left: 10px;" type="primary" icon="el-icon-edit" @click="handleCreate">
        Add
      </el-button>
    </div>
    
    <Product ref="productRef" :productsMethod="productsMethod" :params="this.$store.state.user.account"/>

    <el-dialog v-loading="listLoading" :title="textMap[dialogStatus]" @close="handleDialogClose" :visible.sync="dialogFormVisible">
      <el-form ref="dataForm" :rules="rules" :model="temp" label-position="left" label-width="100px" style="width: 400px; margin-left:50px;">

        <!-- 商品种类 -->
        <el-form-item label="pType" prop="pType">
          <el-select v-model="temp.pType" class="filter-item" placeholder="Please select">
            <el-option v-for="item in calendarTypeOptions" :key="item.key" :label="item.display_name" :value="item.key" />
          </el-select>
        </el-form-item>

        <!-- 品牌 -->
        <el-form-item label="Brand" prop="brand">
          <el-input v-model="temp.brand" />
        </el-form-item>

        <!-- 生产地 -->
        <el-form-item label="PLocation" prop="productionLocation">
            <el-input v-model="temp.productionLocation" />
        </el-form-item>

        <!-- 数量 -->
        <el-form-item label="Quantity" prop="quantity">
            <el-input v-model="temp.quantity" />
        </el-form-item>

        <!-- 发货地 -->
        <el-form-item label="Path" prop="path">
          <el-input v-model="temp.path" @blur="updateLocation" />
        </el-form-item>

         <!-- 颜色 -->
         <el-form-item v-if="isClothing || isMaterial" label="Color" prop="color">
            <el-input v-model="temp.color" />
          </el-form-item>

          <!-- 衣服尺寸 -->
          <el-form-item v-if="isClothing" label="Size" prop="size">
            <el-select v-model="temp.size" class="filter-item" placeholder="Please select">
              <el-option v-for="item in clothingSize" :key="item.key" :label="item.display_name" :value="item.key" />
            </el-select>
          </el-form-item>

          <!-- 珠宝材质 -->
          <el-form-item v-if="isMaterial" label="JewelryMaterial" prop="jewelryMaterial">
            <el-select v-model="temp.jewelryMaterial" class="filter-item" placeholder="Please select">
              <el-option v-for="item in jewelryMaterial" :key="item.key" :label="item.display_name" :value="item.key" />
            </el-select>
          </el-form-item>

          <!-- 食物保质期 -->
          <el-form-item v-if="isFood" label="FoodExpiry" prop="foodExpiry">
            <el-date-picker v-model="temp.foodExpiry" value-format="timestamp" :default-value="new Date()" type="datetime" placeholder="Please pick a date" />
          </el-form-item>

          <!-- 食物生产日期 -->
          <el-form-item v-if="isFood" label="ProductDate" prop="productionDate">
            <el-date-picker v-model="temp.productionDate" value-format="timestamp" :default-value="new Date()" type="datetime" placeholder="Please pick a date" />
          </el-form-item>

          <!-- 食物种类 -->
          <el-form-item v-if="isFood" label="FoodType" prop="foodType">
            <el-select v-model="temp.foodType" class="filter-item" placeholder="Please select">
              <el-option v-for="item in foodType" :key="item.key" :label="item.display_name" :value="item.key" />
            </el-select>
          </el-form-item>
          
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">Cancel</el-button>
        <el-button type="primary" @click="createData()">Confirm</el-button>
      </div>
    </el-dialog>

    <el-dialog :visible.sync="dialogPvVisible" title="Reading statistics">
      <el-table :data="pvData" border fit highlight-current-row style="width: 100%">
        <el-table-column prop="key" label="Channel" />
        <el-table-column prop="pv" label="Pv" />
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="dialogPvVisible = false">Confirm</el-button>
      </span>
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
      this.listLoading = true;
      this.$refs['dataForm'].validate(async (valid) => {
        if (valid) {
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
      this.resetFormData()
    },


  }
}
</script>
