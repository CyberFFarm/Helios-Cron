const { ethers } = require("ethers");
const { CONFIG } = require('./config');

class RealTimeMonitor {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
    this.wallet = new ethers.Wallet(CONFIG.PRIVATE_KEY, this.provider);
    this.lastBalance = null;
    this.lastBlock = null;
  }

  /**
   * 实时监控任务执行
   */
  async startMonitoring() {
    console.log("🚀 开始实时监控 Cron 任务...");
    console.log(`📍 监控钱包: ${this.wallet.address}`);
    console.log(`📍 目标合约: ${CONFIG.TARGET_CONTRACT}`);
    console.log(`⏰ 执行频率: 每 ${CONFIG.FREQUENCY} 个区块`);
    console.log("=" .repeat(60));

    // 获取初始状态
    this.lastBalance = await this.provider.getBalance(this.wallet.address);
    this.lastBlock = await this.provider.getBlockNumber();

    console.log(`💰 初始余额: ${ethers.formatEther(this.lastBalance)} HLS`);
    console.log(`📊 起始区块: ${this.lastBlock.toLocaleString()}`);
    console.log("\n🔍 开始监控变化...\n");

    // 每30秒检查一次
    setInterval(async () => {
      await this.checkChanges();
    }, 30000);

    // 立即执行一次检查
    await this.checkChanges();
  }

  /**
   * 检查变化
   */
  async checkChanges() {
    try {
      const currentBalance = await this.provider.getBalance(this.wallet.address);
      const currentBlock = await this.provider.getBlockNumber();
      
      const timestamp = new Date().toLocaleTimeString();
      
      // 检查余额变化
      if (this.lastBalance && currentBalance < this.lastBalance) {
        const spent = this.lastBalance - currentBalance;
        console.log(`💸 [${timestamp}] 余额减少: ${ethers.formatEther(spent)} HLS`);
        console.log(`   💰 当前余额: ${ethers.formatEther(currentBalance)} HLS`);
        console.log(`   🎯 可能的 Cron 任务执行！`);
        console.log("");
      }

      // 检查区块进度
      if (this.lastBlock && currentBlock > this.lastBlock) {
        const blockDiff = currentBlock - this.lastBlock;
        const nextExecution = this.calculateNextExecution(currentBlock);
        
        console.log(`📊 [${timestamp}] 区块更新: ${this.lastBlock.toLocaleString()} → ${currentBlock.toLocaleString()} (+${blockDiff})`);
        console.log(`   ⏳ 距离下次执行: ${nextExecution.blocksLeft} 个区块 (~${nextExecution.minutesLeft} 分钟)`);
        
        // 如果接近执行时间，给出提醒
        if (nextExecution.blocksLeft <= 10) {
          console.log(`   🚨 注意：即将执行 Cron 任务！`);
        }
        console.log("");
      }

      // 更新状态
      this.lastBalance = currentBalance;
      this.lastBlock = currentBlock;

    } catch (error) {
      console.error(`❌ 监控错误: ${error.message}`);
    }
  }

  /**
   * 计算下次执行时间
   */
  calculateNextExecution(currentBlock) {
    const frequency = CONFIG.FREQUENCY;
    const blocksLeft = frequency - (currentBlock % frequency);
    const minutesLeft = Math.round(blocksLeft * 1.2 / 60);
    
    return { blocksLeft, minutesLeft };
  }

  /**
   * 检查最近的合约交易
   */
  async checkRecentTransactions() {
    console.log("🔍 检查最近的合约交易...");
    
    try {
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 100);
      
      // 监听目标合约的交易
      const filter = {
        address: CONFIG.TARGET_CONTRACT,
        fromBlock: fromBlock,
        toBlock: 'latest'
      };
      
      const logs = await this.provider.getLogs(filter);
      
      if (logs.length > 0) {
        console.log(`✅ 发现 ${logs.length} 个最近交易`);
        for (const log of logs.slice(-3)) {
          const block = await this.provider.getBlock(log.blockNumber);
          const time = new Date(block.timestamp * 1000).toLocaleString();
          console.log(`   📝 区块 ${log.blockNumber}: ${time}`);
        }
      } else {
        console.log("⚠️  最近 100 个区块内无合约交易");
      }
      
    } catch (error) {
      console.error(`❌ 检查交易失败: ${error.message}`);
    }
  }
}

async function main() {
  const monitor = new RealTimeMonitor();
  
  // 首先检查最近交易
  await monitor.checkRecentTransactions();
  console.log("");
  
  // 开始实时监控
  await monitor.startMonitoring();
}

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n👋 停止监控');
  process.exit(0);
});

main().catch(console.error);
