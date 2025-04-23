const state = {
    account: '',
    role: '', // admin/buyer/seller
    currentNetwork: 1 // 主网默认1
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
    }
  }
  
  const actions = {
    async login({ commit }, { account, role }) {
      commit('setAccount', account)
      commit('setRole', role)
      localStorage.setItem('userToken', 'web3-auth-token')
    },
    
    logout({ commit }) {
      commit('setAccount', '')
      commit('setRole', '')
      localStorage.removeItem('userToken')
    }
  }
  
  export default {
    namespaced: true,
    state,
    mutations,
    actions
  }