import { ethers } from 'ethers'

export const getContract = (address, abi) => {
  const provider = new ethers.BrowserProvider(window.ethereum)
  const signer = provider.getSigner()
  return new ethers.Contract(address, abi, signer)
}

// 示例：获取商品物流路径
export const fetchProductRoute = async (contractAddress, abi, productId) => {
  const contract = getContract(contractAddress, abi)
  return contract.getRoute(productId)
}