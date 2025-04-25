<template>
  <div class="navbar">
    <div class="left-menu">Chain Mart</div>
    <div style="color: #909399;">Where buyers and sellers meet in a secure decentralized marketplace</div>
    <div class="right-menu">
      <template v-if="device !== 'mobile'">
        <el-button class="download-button" icon="el-icon-download" @click="triggerDownload">Download</el-button>
      </template>
      <el-dropdown class="avatar-container right-menu-item hover-effect" trigger="click">
        <div class="avatar-wrapper">
          <img :src="require('@/assets/buyer.jpg')" class="user-avatar" />
          <!-- <i class="el-icon-caret-bottom" /> -->
        </div>
        <!-- <el-dropdown-menu slot="dropdown">
          <el-dropdown-item divided @click.native="logout">
            <span>Log Out</span>
          </el-dropdown-item>
        </el-dropdown-menu> -->
      </el-dropdown>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  computed: {
    ...mapGetters(['sidebar', 'avatar', 'device']),
  },
  methods: {
    async logout() {
      await this.$store.dispatch('user/logout');
      this.$router.push(`/login?redirect=${this.$route.fullPath}`);
    },
    triggerDownload() {
      // 更新 Vuex 状态，通知 Product 页面下载操作
      this.$store.commit('user/setButtonClicking')
      // this.$store.dispatch('user/handleButtonClick')
    },

  },
};
</script>

<style lang="scss" scoped>
.navbar {
  height: 80px;
  display: flex;
  justify-content: space-between;
  align-items: center; /* 垂直居中 */
  background: #feffff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.left-menu {
  font-size: 18px;
  // color: #5a5e66;
  color: #909399;
  margin-left: 20px; /* 给左侧菜单添加一些左边距 */
}

.right-menu {
  display: flex;
  align-items: center;
  margin-right: 20px; /* 给右侧菜单添加一些右边距 */
}


.download-button {
  margin-right: 20px; /* 给 Download 按钮和头像之间添加一些间距 */
  background-color: #6548ae !important; 
  border:none;
  color: #ffffff !important;
}

.avatar-container {
  display: flex;
  align-items: center;
  margin-right: 20px;

  .avatar-wrapper {
    position: relative;
    display: flex;
    align-items: center; /* 垂直居中 */
    justify-content: center; /* 水平居中 */

    .user-avatar {
      cursor: pointer;
      width: 40px;
      height: 40px;
      border-radius: 10px;
    }

    .el-icon-caret-bottom {
      cursor: pointer;
      position: absolute;
      right: -20px;
      top: 25px;
      font-size: 12px;
    }
  }
}
</style>
