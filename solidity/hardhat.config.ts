import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-contract-sizer";
import "hardhat-gas-reporter";

import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      { version: "0.8.9" }, // 主版本
      { version: "0.8.20" },  // 备用版本
    ],
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  contractSizer: {//检测合约大小
    alphaSort: false,//是否按字母顺序对结果表进行排序（默认按合约大小排序）
    disambiguatePaths: false,//是否输出编译工件的完整路径（相对于 Hardhat 根目录）
    runOnCompile: false,//编译后是否自动输出合约大小
    strict: false,//如果任何合约超出大小限制，是否抛出错误（可能会导致兼容性问题solidity-coverage
  },
  gasReporter: {
    enabled: false,
    currency: "USD",
    gasPrice: 21,
    // coinmarketcap: process.env.COINMARKETCAP_API_KEY, // 可选：转换为 USD 成本
  },
  defaultNetwork: "hardhat",
  networks: {
    amoy: {
      url: process.env.AMOY_RPC_URL,
      chainId: 80002,
      accounts: [process.env.PRIVATE_KEY || ""],
      gasPrice: 30000000000, // 25 Gwei
    },
    amoyDev: {
      url: process.env.AMOY_RPC_URL,
      chainId: 80002,
      accounts: [process.env.PRIVATE_KEY || ""],
      gasPrice: 30000000000, // 25 Gwei
    },
    bscDev: {
      url: process.env.BSC_RPC_URL,
      chainId: 97,
      accounts: [process.env.PRIVATE_KEY || ""],
      gasPrice: 30000000000, // 25 Gwei
    },
  }, 
  etherscan: {
    apiKey: {
      polygonMumbai: process.env.AMOY_API_KEY || "",
      bscTestnet: process.env.BSC_API_KEY || ""
    },
  },
  
};

export default config;
