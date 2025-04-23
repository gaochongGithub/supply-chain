<template>
  <div class="app-container">

    <el-table
      v-loading="listLoading"
      :data="userList"
      border
      fit
      highlight-current-row
      style="width: 100%;"
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

      <el-table-column label="Actions" align="center" width="230" class-name="small-padding fixed-width">
        <template slot-scope="{row,$index}">
          <el-button v-if="row.status != 'deleted'" size="mini" type="danger" @click="handleDelete(row, $index)">
            Delete
          </el-button>
        </template>
      </el-table-column>

    </el-table>

  </div>
</template>

<script>
import { get, send } from '@/utils/web3.js';  // 根据你的路径引入

export default {
  filters: {

  },
  props: {
      userMethod: {
          type: String,
          required: true
      },
    },
  data() {
    return {
      userList: [],
      listLoading: true,
      listQuery: {
        page: 1,
        limit: 5,
        type: this.type,
        sort: '+id'
      },
      loading: false
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
    async handleDelete(row) {
      
      try {
        this.loading = true;
        await send("removeUser", [row.addr, row.role])
        this.getUserList();
        
      } catch (error) {
        console.log(error)
      }
      // 删除操作逻辑
    }
  }
};
</script>