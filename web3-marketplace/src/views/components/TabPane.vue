<template>
  <div class="">
    <el-table
      v-loading="listLoading"
      :data="userList"
      border
      fit
      highlight-current-row
      style="width: 100%;"
      :header-cell-style="{background: '#ecf0f4'}"
    > 
      
      <el-table-column label="ID" align="center" width="180">
        <template slot-scope="{ row, $index }">
          <span>{{ $index }}</span>
        </template>
      </el-table-column>

      <el-table-column min-width="200px" label="Address">
        <template slot-scope="{row}">
          <span>{{ row.addr }}</span>
        </template>
      </el-table-column>

      <el-table-column min-width="200px" label="RegTime">
        <template slot-scope="{row}">
          <span>{{ getRegTime(row.time) }}</span>
        </template>
      </el-table-column>

      <el-table-column label="Actions" align="center" width="230" class-name="small-padding fixed-width">
        <template slot-scope="{row,$index}">
          <!-- <el-button v-if="row.status != 'deleted'" size="mini" type="danger" @click="handleDelete(row, $index)">
            Delete
          </el-button> -->
          <div class="actions-container">
              <div v-if="row.status != 'deleted'" @click="handleDelete(row, $index)" class="action-text">
                Delete
              </div>
          </div>
        </template>
      </el-table-column>

    </el-table>

  </div>
</template>

<script>
import { get, send } from '@/utils/web3.js';  // 根据你的路径引入
import { getUSTime } from '@/utils/utils.js'; 
import * as XLSX from 'xlsx'

export default {
  filters: {

  },
  props: {
      userMethod: {
          type: String,
          required: true
      },
  },
  computed: {
      isButtonClicking() {
        return this.$store.state.user.isButtonClicking
      },
    },
  data() {
    return {
      userList: [],
      listLoading: true,
      time: '',
      listQuery: {
        page: 1,
        limit: 5,
        type: this.type,
        sort: '+id'
      },
      loading: false,
    };
  },
  watch: {
      // 监听 props 变化，更新商品列表
      userMethod(newVal) {
        console.log(newVal, "TabPane Watch监听======")
        
        if (this.userMethod !== newVal) {
          this.getUserList();
          this.userMethod = newVal;
        }
      },
       // 监听 isButtonClicking 状态的变化
      'isButtonClicking'(newValue) {
        if (newValue) {
          this.exportToExcel()
        }
      },
  },
  created() {
    
  },

  methods: {
    async getUserList() {
      this.listLoading = true;
      this.userList = [];
      let userList = await get(this.userMethod,[]);
      for (let i = 0; i < userList.length; i++) {
        // let product = await get(methodName, [this.list[i]]);
        let userData = await get("users", [userList[i]]);
        this.userList.push(userData)
      }
      this.listLoading = false; 
    },
    getRegTime(time){
      return getUSTime(time)
    },
    async handleDelete(row) {
      
      try {
        this.loading = true;
        await send("removeUser", [row.addr, row.role])
        this.getUserList();
        
      } catch (error) {
        console.log(error)
      }
      // 删除操作逻辑
    },
    exportToExcel() {
      if(this.userList.length <= 0){
        this.$message.error('No message')
        return;
      }
      const header = ["ID", "Address", "UserType", "RegTime"];
      const allData = [header];
      for (let i = 0; i < this.userList.length; i++) {
        allData.push([
            (i+1),
            this.userList[i].addr,
            this.userList[i].role == 0 ? 'Buyer' : 'Seller',
            getUSTime(this.userList[i].time),
          ]);
      }
      
      const ws = XLSX.utils.aoa_to_sheet(allData)  // 将数据转换为工作表
      const wb = XLSX.utils.book_new()  // 创建新的工作簿
      XLSX.utils.book_append_sheet(wb, ws, 'User')  // 将工作表添加到工作簿中

      // 导出为 Excel 文件
      XLSX.writeFile(wb, 'User.xlsx')

      // 导出完毕后，重置状态
      this.$store.commit('user/setButtonClicking')
    },
  }
};
</script>