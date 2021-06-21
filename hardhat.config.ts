import { HardhatUserConfig } from 'hardhat/config';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-etherscan';
require('dotenv').config();
import 'hardhat-typechain';
import 'hardhat-deploy';

// You have to export an object to set up your config
// This object can have the following optional entries:
// defaultNetwork, networks, solc, and paths.
// Go to https://buidler.dev/config/ to learn more
const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.6.8',
        settings: {
          optimizer: {
            enabled: true,
          },
        },
      },
    ],
  },
  networks: {
    rinkeby: {
      chainId: 4,
      url: 'https://eth-rinkeby.alchemyapi.io/v2/' + process.env.ALCHEMY_KEY,
      timeout: 1000 * 60,
    },
    bsc_testnet: {
      chainId: 97,
      url: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
      timeout: 1000 * 60,
    },
    bsc: {
      chainId: 56,
      url: 'https://bsc-dataseed.binance.org/',
    },
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: process.env.BSC_SCAN_KEY,
  },
};

export default config;
