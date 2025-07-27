require('dotenv').config();

const CONFIG = {
  // 网络配置
  RPC_URL: process.env.RPC_URL || "https://testnet1.helioschainlabs.org",
  CRON_ADDRESS: "0x0000000000000000000000000000000000000830",
  
  // 合约配置
  TARGET_CONTRACT: process.env.TARGET_CONTRACT,
  PRIVATE_KEY: process.env.PRIVATE_KEY,
  
  // Cron 任务配置
  FREQUENCY: parseInt(process.env.FREQUENCY) || 300, // 每300个区块执行一次
  GAS_LIMIT: parseInt(process.env.GAS_LIMIT) || 300_000,
  GAS_PRICE: process.env.GAS_PRICE || "2", // gwei
  DEPOSIT: process.env.DEPOSIT || "0.02", // ETH
  VALIDITY_WEEKS: parseInt(process.env.VALIDITY_WEEKS) || 2,
  
  // 重试配置
  MAX_RETRIES: parseInt(process.env.MAX_RETRIES) || 3,
  RETRY_DELAY: parseInt(process.env.RETRY_DELAY) || 2000, // ms
};

// 验证必需的配置
function validateConfig() {
  const required = ['TARGET_CONTRACT', 'PRIVATE_KEY'];
  const missing = required.filter(key => !CONFIG[key]);
  
  if (missing.length > 0) {
    throw new Error(`缺少必需的环境变量: ${missing.join(', ')}`);
  }
  
  // 验证私钥格式
  if (!CONFIG.PRIVATE_KEY.startsWith('0x') || CONFIG.PRIVATE_KEY.length !== 66) {
    throw new Error('私钥格式无效，应该以0x开头且长度为66字符');
  }
  
  // 验证合约地址格式
  if (!CONFIG.TARGET_CONTRACT.startsWith('0x') || CONFIG.TARGET_CONTRACT.length !== 42) {
    throw new Error('合约地址格式无效，应该以0x开头且长度为42字符');
  }
}

module.exports = {
  CONFIG,
  validateConfig
};
