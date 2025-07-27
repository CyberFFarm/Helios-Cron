const { ethers } = require("ethers");
const { logJobDetails, logTransactionStatus, withRetry } = require("./utils");

class CronManager {
  constructor(config) {
    this.config = config;
    this.provider = new ethers.JsonRpcProvider(config.RPC_URL);
    this.wallet = new ethers.Wallet(config.PRIVATE_KEY, this.provider);
    
    // 目标合约 ABI - 只包含 tick 函数
    this.targetAbi = JSON.stringify([
      {
        name: "tick",
        type: "function",
        inputs: [],
        outputs: [],
        stateMutability: "nonpayable"
      }
    ]);
    
    // Cron 预编译合约 ABI
    this.cronAbi = [
      {
        "inputs": [
          { "internalType": "address", "name": "contractAddress", "type": "address" },
          { "internalType": "string", "name": "abi", "type": "string" },
          { "internalType": "string", "name": "methodName", "type": "string" },
          { "internalType": "string[]", "name": "params", "type": "string[]" },
          { "internalType": "uint64", "name": "frequency", "type": "uint64" },
          { "internalType": "uint64", "name": "expirationBlock", "type": "uint64" },
          { "internalType": "uint64", "name": "gasLimit", "type": "uint64" },
          { "internalType": "uint256", "name": "maxGasPrice", "type": "uint256" },
          { "internalType": "uint256", "name": "amountToDeposit", "type": "uint256" }
        ],
        "name": "createCron",
        "outputs": [{ "internalType": "bool", "name": "success", "type": "bool" }],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ];
    
    this.cronContract = new ethers.Contract(config.CRON_ADDRESS, this.cronAbi, this.wallet);
  }

  /**
   * 检查钱包余额是否足够
   */
  async checkBalance() {
    console.log("💰 检查钱包余额...");
    
    try {
      const balance = await this.provider.getBalance(this.wallet.address);
      const requiredAmount = ethers.parseEther(this.config.DEPOSIT);
      const gasEstimate = ethers.parseUnits(this.config.GAS_PRICE, "gwei") * BigInt(this.config.GAS_LIMIT + 50_000);
      const totalRequired = requiredAmount + gasEstimate;
      
      console.log(`  📊 钱包地址: ${this.wallet.address}`);
      console.log(`  💰 当前余额: ${ethers.formatEther(balance)} HLS`);
      console.log(`  💸 预存金额: ${this.config.DEPOSIT} HLS`);
      console.log(`  ⛽ 预估 Gas: ${ethers.formatEther(gasEstimate)} HLS`);
      console.log(`  📋 总需求: ${ethers.formatEther(totalRequired)} HLS`);
      
      if (balance < totalRequired) {
        throw new Error(`余额不足！需要至少 ${ethers.formatEther(totalRequired)} HLS，当前余额: ${ethers.formatEther(balance)} HLS`);
      }
      
      console.log("✅ 余额检查通过");
    } catch (error) {
      if (error.message.includes('余额不足')) {
        throw error;
      }
      throw new Error(`余额检查失败: ${error.message}`);
    }
  }

  /**
   * 获取当前区块号和计算过期区块
   */
  async getBlockInfo() {
    console.log("📊 获取区块信息...");
    
    const currentBlock = await this.provider.getBlockNumber();
    const blocksInWeek = 7 * 24 * 60 * 60 / 1.2; // 假设平均1.2秒出一个块
    const expiration = currentBlock + Math.floor(blocksInWeek * this.config.VALIDITY_WEEKS);
    
    return { currentBlock, expiration };
  }

  /**
   * 创建 Cron 任务
   */
  async createCron() {
    console.log("🚀 开始创建 Cron 任务...\n");
    
    // 检查余额
    await this.checkBalance();
    
    // 获取区块信息
    const { currentBlock, expiration } = await this.getBlockInfo();
    
    // 记录任务详情
    logJobDetails(this.config, currentBlock, expiration);
    
    // 准备交易参数
    const gasPrice = ethers.parseUnits(this.config.GAS_PRICE, "gwei");
    const deposit = ethers.parseEther(this.config.DEPOSIT);
    
    console.log("📝 准备发送交易...");
    
    // 发送交易
    const tx = await this.cronContract.createCron(
      this.config.TARGET_CONTRACT,
      this.targetAbi,
      "tick",
      [], // 无参数
      this.config.FREQUENCY,
      expiration,
      this.config.GAS_LIMIT,
      gasPrice,
      deposit,
      {
        gasLimit: this.config.GAS_LIMIT + 50_000,
        gasPrice
      }
    );
    
    logTransactionStatus(tx.hash, 'pending');
    
    // 等待交易确认
    console.log("⏳ 等待交易确认...");
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      logTransactionStatus(tx.hash, 'success');
      return { success: true, txHash: tx.hash, receipt };
    } else {
      logTransactionStatus(tx.hash, 'failed');
      throw new Error('交易执行失败');
    }
  }

  /**
   * 带重试的创建 Cron 任务
   */
  async createCronWithRetry() {
    return withRetry(
      () => this.createCron(),
      this.config.MAX_RETRIES,
      this.config.RETRY_DELAY
    );
  }
}

module.exports = CronManager;
