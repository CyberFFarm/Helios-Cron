const { ethers } = require("ethers");
const fs = require('fs');
const path = require('path');

// 从 .env 文件加载配置
require('dotenv').config();

class ContractDeployer {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "https://testnet1.helioschainlabs.org");
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    
    console.log("🚀 合约部署器初始化完成");
    console.log(`📍 部署钱包: ${this.wallet.address}`);
    console.log(`🌐 网络: ${process.env.RPC_URL || "https://testnet1.helioschainlabs.org"}`);
  }

  /**
   * 读取合约源码
   */
  readContractSource() {
    const contractPath = path.join(__dirname, 'contracts', 'TickContract.sol');
    
    if (!fs.existsSync(contractPath)) {
      throw new Error(`合约文件不存在: ${contractPath}`);
    }
    
    return fs.readFileSync(contractPath, 'utf8');
  }

  /**
   * 编译合约（需要 solc）
   */
  async compileContract() {
    console.log("📝 开始编译合约...");
    
    try {
      const solc = require('solc');
      const source = this.readContractSource();
      
      const input = {
        language: 'Solidity',
        sources: {
          'TickContract.sol': {
            content: source
          }
        },
        settings: {
          outputSelection: {
            '*': {
              '*': ['*']
            }
          }
        }
      };
      
      const output = JSON.parse(solc.compile(JSON.stringify(input)));
      
      if (output.errors) {
        const errors = output.errors.filter(error => error.severity === 'error');
        if (errors.length > 0) {
          console.error("❌ 编译错误:");
          errors.forEach(error => console.error(error.formattedMessage));
          throw new Error("合约编译失败");
        }
      }
      
      const contract = output.contracts['TickContract.sol']['TickContract'];
      console.log("✅ 合约编译成功");
      
      return {
        abi: contract.abi,
        bytecode: contract.evm.bytecode.object
      };
      
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND') {
        console.log("⚠️  未安装 solc，请手动编译合约或安装 solc:");
        console.log("npm install solc");
        throw new Error("需要安装 solc 编译器");
      }
      throw error;
    }
  }

  /**
   * 部署合约
   */
  async deployContract() {
    console.log("🚀 开始部署合约...");
    
    try {
      // 检查余额
      const balance = await this.provider.getBalance(this.wallet.address);
      console.log(`💰 部署钱包余额: ${ethers.formatEther(balance)} HLS`);
      
      if (balance < ethers.parseEther("0.01")) {
        throw new Error("余额不足，需要至少 0.01 HLS 来部署合约");
      }
      
      // 编译合约
      const { abi, bytecode } = await this.compileContract();
      
      // 创建合约工厂
      const contractFactory = new ethers.ContractFactory(abi, bytecode, this.wallet);
      
      // 估算 Gas
      const deployTx = await contractFactory.getDeployTransaction();
      const gasEstimate = await this.provider.estimateGas(deployTx);
      const gasPrice = await this.provider.getFeeData();
      
      console.log(`⛽ 预估 Gas: ${gasEstimate.toString()}`);
      console.log(`💸 预估费用: ${ethers.formatEther(gasEstimate * gasPrice.gasPrice)} HLS`);
      
      // 部署合约
      console.log("📤 发送部署交易...");
      const contract = await contractFactory.deploy({
        gasLimit: gasEstimate + BigInt(50000), // 增加一些 Gas 缓冲
        gasPrice: gasPrice.gasPrice
      });
      
      console.log(`⏳ 部署交易哈希: ${contract.deploymentTransaction().hash}`);
      console.log("⏳ 等待交易确认...");
      
      // 等待部署完成
      await contract.waitForDeployment();
      const contractAddress = await contract.getAddress();
      
      console.log("🎉 合约部署成功！");
      console.log(`📍 合约地址: ${contractAddress}`);
      
      // 验证部署
      await this.verifyDeployment(contractAddress, abi);
      
      // 保存部署信息
      this.saveDeploymentInfo(contractAddress, abi, contract.deploymentTransaction().hash);
      
      return {
        address: contractAddress,
        abi: abi,
        txHash: contract.deploymentTransaction().hash
      };
      
    } catch (error) {
      console.error("❌ 部署失败:", error.message);
      throw error;
    }
  }

  /**
   * 验证部署
   */
  async verifyDeployment(contractAddress, abi) {
    console.log("🔍 验证合约部署...");
    
    try {
      const contract = new ethers.Contract(contractAddress, abi, this.provider);
      
      // 检查合约代码
      const code = await this.provider.getCode(contractAddress);
      if (code === '0x') {
        throw new Error("合约地址没有代码");
      }
      
      // 调用合约函数验证
      const contractInfo = await contract.getContractInfo();
      console.log("✅ 合约验证成功");
      console.log(`  📊 Tick 计数: ${contractInfo[0]}`);
      console.log(`  👤 所有者: ${contractInfo[4]}`);
      console.log(`  ⏸️  是否暂停: ${contractInfo[3]}`);
      
    } catch (error) {
      console.error("❌ 合约验证失败:", error.message);
      throw error;
    }
  }

  /**
   * 保存部署信息
   */
  saveDeploymentInfo(address, abi, txHash) {
    const deploymentInfo = {
      address: address,
      txHash: txHash,
      deployedAt: new Date().toISOString(),
      network: process.env.RPC_URL || "https://testnet1.helioschainlabs.org",
      deployer: this.wallet.address,
      abi: abi
    };
    
    const deploymentPath = path.join(__dirname, 'deployment.json');
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    
    console.log(`💾 部署信息已保存到: ${deploymentPath}`);
  }

  /**
   * 更新 .env 文件中的合约地址
   */
  updateEnvFile(contractAddress) {
    const envPath = path.join(__dirname, '.env');
    
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // 更新或添加 TARGET_CONTRACT
      if (envContent.includes('TARGET_CONTRACT=')) {
        envContent = envContent.replace(/TARGET_CONTRACT=.*/g, `TARGET_CONTRACT=${contractAddress}`);
      } else {
        envContent += `\nTARGET_CONTRACT=${contractAddress}\n`;
      }
      
      fs.writeFileSync(envPath, envContent);
      console.log(`✅ .env 文件已更新，TARGET_CONTRACT=${contractAddress}`);
    }
  }
}

async function main() {
  try {
    console.log("🚀 开始智能合约部署流程...\n");
    
    const deployer = new ContractDeployer();
    const result = await deployer.deployContract();
    
    // 更新环境变量文件
    deployer.updateEnvFile(result.address);
    
    console.log("\n🎉 部署流程完成！");
    console.log("📋 部署摘要:");
    console.log(`  📍 合约地址: ${result.address}`);
    console.log(`  🔗 交易哈希: ${result.txHash}`);
    console.log(`  💾 ABI 已保存到 deployment.json`);
    console.log("\n📖 下一步:");
    console.log("  1. 在区块浏览器中验证合约部署");
    console.log("  2. 运行 npm start 创建 Cron 任务");
    
  } catch (error) {
    console.error("\n❌ 部署流程失败:");
    console.error(`💥 错误: ${error.message}`);
    
    console.log("\n💡 故障排除:");
    console.log("  - 确保 .env 文件中的 PRIVATE_KEY 正确");
    console.log("  - 确保钱包有足够的 HLS 余额");
    console.log("  - 检查网络连接和 RPC_URL");
    console.log("  - 如果编译失败，请安装: npm install solc");
    
    process.exit(1);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  main();
}

module.exports = ContractDeployer;
