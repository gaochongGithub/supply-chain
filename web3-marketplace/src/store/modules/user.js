const state = {
    account: '',
    role: '', // admin/buyer/seller
    currentNetwork: 1, // 主网默认1
    isButtonClicking: false, // 防止频繁点击
  }
  
  const mutations = {
    setAccount(state, account) {
      state.account = account
    },
    setRole(state, role) {
      state.role = role
    },
    setNetwork(state, networkId) {
      state.currentNetwork = networkId
    },
    setButtonClicking(state) {
      state.isButtonClicking = !state.isButtonClicking
    },
  }
  
  const actions = {
    async login({ commit }, { account, role }) {
      commit('setAccount', account)
      commit('setRole', role)
      localStorage.setItem('userAddress', 'web3-auth-token')
    },
    
    logout({ commit }) {
      commit('setAccount', '')
      commit('setRole', '')
      localStorage.removeItem('userAddress')
    },
     // 添加防抖的点击事件
    async handleButtonClick({ commit, state }) {
      // 如果按钮正在点击中，则不执行
      if (state.isButtonClicking) return

      // 设置按钮点击中状态，防止多次点击
      commit('setButtonClicking', true)

    },
  }
  
  export default {
    namespaced: true,
    state,
    mutations,
    actions
  }