**🚀Helios-Cron自动化任务调度器
新手友好，简单上手
一键部署智能合约定时任务，代码本地安全运行**

**让你的智能合约每 6 分钟自动执行一次，3 分钟即可上手！**

**快速完成Daily Missions**

⚡** 快速开始**

### 1. 安装
```bash
git clone https://github.com/your-repo/helios-cron-scheduler
cd helios-cron-scheduler
npm install
```

### 2. 配置
```bash
copy .env.example .env
```

编辑 `.env` 文件，只需要填写你的私钥：
```env
PRIVATE_KEY=你的钱包私钥
# 其他配置使用默认值即可
```
 `.env` 为本地运行文件，不会上传到服务器，不涉及私钥窃取问题

### 3. 运行
```bash
# 一键部署合约并启动任务
npm run deploy && npm start
```

看到 `🎉 任务完成！` 就成功了！

📊** 监控任务**

```bash
# 实时监控（推荐）
npm run watch-cron

# 快速状态检查  
npm run monitor
```

💰 **测试代币gas说明**

- 每次执行: ~0.0006 HLS
- 预存金额: 0.02 HLS
- 运行时长: 约 3-4 小时
- 执行频率: 每 6 分钟

🛠️ **智能合约部署**

### 方法一：自动部署（推荐）
```bash
npm run deploy
```
脚本会自动编译和部署合约，并更新配置文件。

### 方法二：手动部署（Remix）
1. 打开 [Remix IDE](https://remix.ethereum.org/)
2. 创建新文件，复制 `contracts/TickContract.sol` 代码
3. 编译合约（Solidity 0.8.19+）
4. 连接 MetaMask 到 Helios 测试网：
   ```
   网络名称: Helios Testnet
   RPC URL: https://testnet1.helioschainlabs.org
   链 ID: 7001
   货币符号: HLS
   ```
5. 部署合约，获取合约地址
6. 将合约地址填入 `.env` 文件的 `TARGET_CONTRACT`

🔒 **安全说明**

### ✅ 本地运行保障
- **私钥本地存储**: 永远不会上传到任何服务器
- **开源透明**: 所有代码公开可审计
- **无恶意代码**: 纯净代码，无后门程序
- **最小权限**: 只访问必要的区块链接口

### 🛡️ 安全建议
- 使用专用钱包，不要用存储大量资金的主钱包
- 先在测试网练习，熟悉后再考虑主网
- 定期检查余额和任务执行状态
- 不要分享 `.env` 文件或私钥给任何人

## 🎯 使用场景

- **DeFi 自动化**: 自动复投、清算监控
- **游戏机制**: 定期奖励分发、状态更新  
- **DAO 治理**: 自动执行提案、代币分发
- **学习实践**: 理解区块链自动化执行

🆘** 常见问题**

### 余额不足
```bash
npm run monitor  # 检查当前余额
```
解决：去 Helios 测试网水龙头领取 HLS

### 配置错误
确保：
- 私钥格式正确（0x开头，66位字符）
- `.env` 文件存在且配置正确
- 钱包有足够的 HLS 余额（至少 0.1 HLS）

### 网络问题
```bash
npm start  # 脚本会自动重试 3 次
```

### 合约部署失败
```bash
# 安装编译器
npm install solc

# 重新部署
npm run deploy
```

## 📁 项目结构

```
├── cron-counter.js              # 主程序
├── deploy.js                    # 合约部署脚本
├── monitor.js                   # 状态监控工具
├── watch-cron.js                # 实时监控工具
├── cronManager.js               # 任务管理器
├── config.js                    # 配置管理
├── utils.js                     # 工具函数
├── contracts/TickContract.sol   # 智能合约源码
├── .env.example                 # 配置模板
└── package.json                 # 项目配置
```

## 🔧 配置选项

所有配置都在 `.env` 文件中，新手使用默认值即可：

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `PRIVATE_KEY` | 钱包私钥 | **必填** |
| `TARGET_CONTRACT` | 目标合约地址 | 自动部署时填写 |
| `RPC_URL` | RPC 节点 | Helios 测试网 |
| `FREQUENCY` | 执行频率（区块） | 300 (~6分钟) |
| `GAS_LIMIT` | Gas 限制 | 300000 |
| `GAS_PRICE` | Gas 价格 (gwei) | 2 |
| `DEPOSIT` | 预存金额 (HLS) | 0.02 |
| `VALIDITY_WEEKS` | 有效期（周） | 2 |

## 💡 工作原理

1. **部署合约**: 创建包含 `tick()` 函数的智能合约
2. **注册任务**: 调用 Helios Cron 预编译合约创建定时任务
3. **预存费用**: 预先存入 HLS 作为执行费用
4. **自动执行**: 系统每 300 个区块自动调用合约
5. **费用扣除**: 每次执行从预存费用中扣除 Gas 费

## 📄 许可证
MIT License
