const { CONFIG, validateConfig } = require('./config');
const CronManager = require('./cronManager');

async function main() {
  try {
    console.log("🚀 Helios Cron 任务调度器启动中...\n");
    
    // 验证配置
    validateConfig();
    console.log("✅ 配置验证通过");
    
    // 创建 CronManager 实例
    const cronManager = new CronManager(CONFIG);
    
    // 创建 Cron 任务（带重试）
    const result = await cronManager.createCronWithRetry();
    
    console.log("\n🎉 任务完成！");
    console.log(`📋 交易哈希: ${result.txHash}`);
    console.log("📖 你可以在区块浏览器中查看交易详情");
    
  } catch (error) {
    console.error("\n❌ 执行失败:");
    console.error(`💥 错误信息: ${error.message}`);
    
    // 提供一些常见错误的解决建议
    if (error.message.includes('余额不足')) {
      console.log("\n💡 解决建议:");
      console.log("  - 请确保钱包有足够的 ETH 余额");
      console.log("  - 考虑减少预存金额或降低 Gas 价格");
    } else if (error.message.includes('环境变量')) {
      console.log("\n💡 解决建议:");
      console.log("  - 请复制 .env.example 为 .env");
      console.log("  - 在 .env 文件中设置正确的配置值");
    }
    
    process.exit(1);
  }
}

// 优雅处理进程退出
process.on('SIGINT', () => {
  console.log('\n👋 程序被用户中断');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason);
  process.exit(1);
});

main();
