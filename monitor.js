const { ethers } = require("ethers");
const { CONFIG } = require('./config');

class CronMonitor {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
    this.wallet = new ethers.Wallet(CONFIG.PRIVATE_KEY, this.provider);
  }

  /**
   * 检查钱包余额变化
   */
  async checkWalletBalance() {
    console.log("💰 检查钱包余额...");
    const balance = await this.provider.getBalance(this.wallet.address);
    console.log(`  📊 当前余额: ${ethers.formatEther(balance)} HLS`);
    console.log(`  📍 钱包地址: ${this.wallet.address}`);
    return balance;
  }

  /**
   * 检查目标合约最近的交易
   */
  async checkContractActivity() {
    console.log("🔍 检查目标合约活动...");
    
    try {
      const currentBlock = await this.provider.getBlockNumber();
      console.log(`  📊 当前区块: ${currentBlock.toLocaleString()}`);
      
      // 检查最近 1000 个区块的交易
      const fromBlock = Math.max(0, currentBlock - 1000);
      
      console.log(`  🔍 搜索区块范围: ${fromBlock.toLocaleString()} - ${currentBlock.toLocaleString()}`);
      
      // 获取目标合约的交易历史
      const filter = {
        address: CONFIG.TARGET_CONTRACT,
        fromBlock: fromBlock,
        toBlock: 'latest'
      };
      
      const logs = await this.provider.getLogs(filter);
      
      if (logs.length > 0) {
        console.log(`  ✅ 找到 ${logs.length} 个相关事件`);
        
        // 显示最近的几个事件
        const recentLogs = logs.slice(-5);
        for (const log of recentLogs) {
          const block = await this.provider.getBlock(log.blockNumber);
          const timestamp = new Date(block.timestamp * 1000);
          console.log(`    📝 区块 ${log.blockNumber}: ${timestamp.toLocaleString()}`);
        }
      } else {
        console.log("  ⚠️  最近 1000 个区块内未发现合约活动");
      }
      
    } catch (error) {
      console.log(`  ❌ 检查合约活动失败: ${error.message}`);
    }
  }

  /**
   * 检查 Cron 系统状态
   */
  async checkCronSystemStatus() {
    console.log("🤖 检查 Cron 系统状态...");
    
    try {
      const currentBlock = await this.provider.getBlockNumber();
      const cronAddress = "0x0000000000000000000000000000000000000830";
      
      // 检查 Cron 预编译合约的最近活动
      const filter = {
        address: cronAddress,
        fromBlock: Math.max(0, currentBlock - 500),
        toBlock: 'latest'
      };
      
      const logs = await this.provider.getLogs(filter);
      console.log(`  📊 Cron 系统最近 500 个区块内有 ${logs.length} 个事件`);
      
    } catch (error) {
      console.log(`  ❌ 检查 Cron 系统失败: ${error.message}`);
    }
  }

  /**
   * 估算下次执行时间
   */
  async estimateNextExecution() {
    console.log("⏰ 估算下次执行时间...");
    
    const currentBlock = await this.provider.getBlockNumber();
    const frequency = CONFIG.FREQUENCY;
    
    // 假设任务从当前区块开始，估算下次执行
    const blocksUntilNext = frequency - (currentBlock % frequency);
    const estimatedMinutes = Math.round(blocksUntilNext * 1.2 / 60); // 假设1.2秒一个块
    
    console.log(`  📊 当前区块: ${currentBlock.toLocaleString()}`);
    console.log(`  🔄 执行频率: 每 ${frequency} 个区块`);
    console.log(`  ⏳ 预计还需 ${blocksUntilNext} 个区块`);
    console.log(`  🕐 预计时间: 约 ${estimatedMinutes} 分钟后`);
  }

  /**
   * 完整监控报告
   */
  async generateReport() {
    console.log("📋 生成 Cron 任务监控报告");
    console.log("=" .repeat(50));
    
    await this.checkWalletBalance();
    console.log("");
    
    await this.checkContractActivity();
    console.log("");
    
    await this.checkCronSystemStatus();
    console.log("");
    
    await this.estimateNextExecution();
    console.log("");
    
    console.log("=" .repeat(50));
    console.log("📖 监控建议:");
    console.log("  - 定期运行此脚本检查任务状态");
    console.log("  - 观察钱包余额是否在减少（说明任务在执行）");
    console.log("  - 在区块浏览器中搜索你的合约地址查看交易");
    console.log(`  - 交易创建哈希: 0x1bbb84f4c47344af9dcaafffc877c39f40b646f60f95e25d2ef5ba3cf5a01eb9`);
  }
}

async function main() {
  try {
    const monitor = new CronMonitor();
    await monitor.generateReport();
  } catch (error) {
    console.error("❌ 监控失败:", error.message);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  main();
}

module.exports = CronMonitor;
