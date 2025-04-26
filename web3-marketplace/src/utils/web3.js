import { ethers } from 'ethers'
// import contract from './hunt.json';  // 根据你的文件路径修改
import contract from './contract.json';  // 根据你的文件路径修改
import store from '@/store'
import router from '@/router'

// 获取合约实例 (缓存合约实例)
let cachedContract = null;
// 获取provider
const provider = new ethers.providers.Web3Provider(window.ethereum);

//切换网络ID
const chainId = 97;
const BSC_CHAIN_ID = '0x61'

// 监听钱包变化
export const initWalletListeners = (store) => {
    if (window.ethereum) {
        window.ethereum.on('accountsChanged', (accounts) => {
            if(accounts.length == 0){
              router.push('/login');
              store.commit('user/setRole', '')
            }
            store.commit('user/setAccount', accounts[0] || '')
            
        })

        window.ethereum.on('chainChanged', (chainId) => {
            store.dispatch('user/checkNetwork', parseInt(chainId, 16))
        })
    }
}

export const checkNetwork = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const network = await provider.getNetwork()
      
      if (network.chainId !== chainId) {
        try {
            console.log(network, "检测网络")
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: BSC_CHAIN_ID }]
          })
        } catch (switchError) {
          if (switchError.code === 4902) {
            await addBSCNetwork()
          } else {
            throw new Error('请手动切换到BSC测试网')
          }
        }
      }
      return true
    } catch (err) {
      console.error('网络检测失败:', err)
      throw err
    }
  }
  
  const addBSCNetwork = async () => {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: BSC_CHAIN_ID,
        chainName: 'BNB Smart Chain Testnet',
        nativeCurrency: {
          name: 'BNB',
          symbol: 'tBNB',
          decimals: 18
        },
        rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
        blockExplorerUrls: ['https://testnet.bscscan.com']
      }]
    })
  }

// 检测是否连接
export const checkWallet = async () => {
    try {
        await checkNetwork()
        // 检查是否已有连接账户
        const accounts = await provider.listAccounts();

        // 如果已经连接，直接返回当前账户
        if (accounts.length > 0) {
            // const account = accounts[0];
            // console.log("钱包已连接:", account);
            store.commit('user/setAccount', accounts[0] || '')
            localStorage.setItem('userAddress', accounts[0]); // 添加这行
            return accounts;
        }

    } catch (error) {
        console.error('Wallet connection failed:', error)
        store.commit('user/setAccount', '')
        throw error
    }
}

// 连接钱包
export const connectWallet = async () => {
    try {
        // const provider = new ethers.providers.Web3Provider(window.ethereum);  // 使用 Web3Provider
        await provider.send("eth_requestAccounts", []);  // 请求连接钱包
        const accounts = await provider.listAccounts();  // 获取账户列表
        const account = accounts[0];  // 选择第一个账户
        store.commit('user/setAccount', accounts[0] || '')
        return account;
    } catch (err) {
        store.commit('user/setAccount', '')
        console.error('Wallet connection failed:', err)
        throw err
    }
}

// 获取合约实例
export const getContract = () => {
    if (cachedContract) return cachedContract;  // 如果已缓存，直接返回
    const signer = provider.getSigner()
    cachedContract = new ethers.Contract(contract.address, contract.abi, signer);
    return cachedContract
}

// 修改链上数据的方法
export const send = async (methodName, params) => {
    if (!window.ethereum) {
        return { success: false, error: "Ethereum provider not found" };
    }
    //  设置加载状态为 true
//   if (isLoading) isLoadingSetter(true);

    try {
        const contract = getContract();
        if (!contract) {
            return { success: false, error: "Failed to get contract instance" };
        }

        // 检查合约方法是否存在
        if (!contract[methodName]) {
            return { success: false, error: `Method ${methodName} not found on contract` };
        }
        // 调用合约方法
        const tx = await contract[methodName](...params)  // 调用合约方法，传入参数
        await tx.wait()  // 等待交易被挖掘

        // 交易成功后，返回交易哈希
        return { success: true, txHash: tx.hash }
    } catch (err) {
        console.error('Transaction failed:', err)
        return { success: false, error: err.message }
    } finally {
        // 设置加载状态为 false
        // loadingSetter(false)
    }
}


// 读取链上数据的方法
export const get = async (methodName, params) => {
    if (!window.ethereum) {
        return { success: false, error: "Ethereum provider not found" };
    }

    try {
        const contract = getContract();
        if (!contract) {
            return { success: false, error: "Failed to get contract instance" };
        }

        // 检查合约方法是否存在
        if (!contract[methodName]) {
            return { success: false, error: `Method ${methodName} not found on contract` };
        }

        // 调用合约的读取方法
        const data = await contract[methodName](...params)
        return data
    } catch (err) {
        console.error('Failed to fetch data from contract:', err)
        return { success: false, error: err.message }
    }
}

export const formatAddress = (address) => {
    // 确保地址是有效的
    if (typeof address !== 'string') {
      throw new Error('Invalid Ethereum address');
    }
  
    // 获取前4个字符和后4个字符
    const first4 = address.slice(0, 6); // '0x' + 前4个字符
    const last4 = address.slice(-4); // 最后4个字符
  
    // 拼接成新的格式
    return `${first4}...${last4}`;
  }
