import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import '@openzeppelin/hardhat-upgrades';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const DEPLOYER_PRIVATE_KEY = process.env['DEPLOYER_PRIVATE_KEY'];
const POLYGON_AMOY_RPC = process.env['POLYGON_AMOY_RPC'] ?? 'https://rpc-amoy.polygon.technology';
const POLYGONSCAN_API_KEY = process.env['POLYGONSCAN_API_KEY'] ?? '';

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.27',
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    amoy: {
      url: POLYGON_AMOY_RPC,
      chainId: 80002,
      accounts: DEPLOYER_PRIVATE_KEY ? [DEPLOYER_PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      polygonAmoy: POLYGONSCAN_API_KEY,
    },
    customChains: [
      {
        network: 'polygonAmoy',
        chainId: 80002,
        urls: {
          apiURL: 'https://api-amoy.polygonscan.com/api',
          browserURL: 'https://amoy.polygonscan.com',
        },
      },
    ],
  },
  typechain: {
    outDir: 'typechain-types',
    target: 'ethers-v6',
  },
  gasReporter: {
    enabled: process.env['REPORT_GAS'] === 'true',
    currency: 'USD',
  },
  paths: {
    sources: './src',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
};

export default config;
