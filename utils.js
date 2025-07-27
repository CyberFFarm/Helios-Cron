const { ethers } = require("ethers");

/**
 * 延迟执行
 * @param {number} ms 延迟毫秒数
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 格式化区块数为时间估算
 * @param {number} blocks 区块数
 * @param {number} blockTime 平均出块时间（秒）
 */
function formatBlocksToTime(blocks, blockTime = 1.2) {
  const seconds = blocks * blockTime;
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}天 ${hours % 24}小时`;
  if (hours > 0) return `${hours}小时 ${minutes % 60}分钟`;
  return `${minutes}分钟`;
}

/**
 * 记录任务详情
 */
function logJobDetails(config, currentBlock, expiration) {
  console.log("\n🔧 任务配置详情:");
  console.log(`  📍 目标合约: ${config.TARGET_CONTRACT}`);
  console.log(`  ⏰ 执行频率: 每 ${config.FREQUENCY} 个区块 (~${formatBlocksToTime(config.FREQUENCY)})`);
  console.log(`  💰 预存金额: ${config.DEPOSIT} ETH`);
  console.log(`  ⛽ Gas 限制: ${config.GAS_LIMIT.toLocaleString()}`);
  console.log(`  💸 Gas 价格: ${config.GAS_PRICE} gwei`);
  console.log(`  📊 当前区块: ${currentBlock.toLocaleString()}`);
  console.log(`  ⏳ 过期区块: ${expiration.toLocaleString()}`);
  console.log(`  📅 有效期: ${formatBlocksToTime(expiration - currentBlock)}`);
  console.log("");
}

/**
 * 记录交易状态
 */
function logTransactionStatus(hash, status = 'pending') {
  const statusEmoji = {
    pending: '⏳',
    success: '✅',
    failed: '❌'
  };
  
  console.log(`${statusEmoji[status]} 交易状态: ${status.toUpperCase()}`);
  console.log(`🔗 交易哈希: ${hash}`);
  
  if (status === 'success') {
    console.log("🎉 Cron 任务注册成功！");
  }
}

/**
 * 重试执行函数
 * @param {Function} fn 要执行的异步函数
 * @param {number} maxRetries 最大重试次数
 * @param {number} retryDelay 重试延迟
 */
async function withRetry(fn, maxRetries = 3, retryDelay = 2000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      console.log(`❌ 尝试 ${attempt}/${maxRetries} 失败: ${error.message}`);
      
      if (attempt === maxRetries) {
        throw new Error(`所有重试都失败了。最后错误: ${error.message}`);
      }
      
      console.log(`⏳ ${retryDelay/1000}秒后重试...`);
      await delay(retryDelay);
    }
  }
}

module.exports = {
  delay,
  formatBlocksToTime,
  logJobDetails,
  logTransactionStatus,
  withRetry
};
