// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title TickContract
 * @dev 一个简单的可被 Cron 任务调用的合约示例
 * @notice 这个合约演示了如何创建一个可以被 Helios Cron 系统定期调用的合约
 */
contract TickContract {
    // 状态变量
    address public owner;
    uint256 public tickCount;
    uint256 public lastTickTimestamp;
    uint256 public lastTickBlock;
    bool public isPaused;
    
    // 事件
    event Ticked(uint256 indexed tickNumber, uint256 timestamp, uint256 blockNumber, address caller);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event ContractPaused(bool paused);
    
    // 修饰符
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier whenNotPaused() {
        require(!isPaused, "Contract is paused");
        _;
    }
    
    /**
     * @dev 构造函数
     */
    constructor() {
        owner = msg.sender;
        tickCount = 0;
        lastTickTimestamp = block.timestamp;
        lastTickBlock = block.number;
        isPaused = false;
        
        emit OwnershipTransferred(address(0), owner);
    }
    
    /**
     * @dev 主要的 tick 函数 - 这是 Cron 任务会调用的函数
     * @notice 这个函数会被 Helios Cron 系统定期调用
     */
    function tick() external whenNotPaused {
        // 增加调用计数
        tickCount++;
        
        // 更新时间戳和区块号
        lastTickTimestamp = block.timestamp;
        lastTickBlock = block.number;
        
        // 发出事件
        emit Ticked(tickCount, lastTickTimestamp, lastTickBlock, msg.sender);
        
        // 在这里可以添加你的业务逻辑
        _executeBusinessLogic();
    }
    
    /**
     * @dev 内部业务逻辑函数
     * @notice 在这里实现你的具体业务逻辑
     */
    function _executeBusinessLogic() internal {
        // 示例业务逻辑：
        // 1. 更新某些状态
        // 2. 分发奖励
        // 3. 清理过期数据
        // 4. 触发其他合约调用
        
        // 这里只是一个简单的示例
        // 你可以根据需要实现具体的业务逻辑
    }
    
    /**
     * @dev 获取合约基本信息
     */
    function getContractInfo() external view returns (
        uint256 _tickCount,
        uint256 _lastTickTimestamp,
        uint256 _lastTickBlock,
        bool _isPaused,
        address _owner
    ) {
        return (tickCount, lastTickTimestamp, lastTickBlock, isPaused, owner);
    }
    
    /**
     * @dev 计算距离上次 tick 的时间间隔
     */
    function getTimeSinceLastTick() external view returns (uint256) {
        return block.timestamp - lastTickTimestamp;
    }
    
    /**
     * @dev 计算距离上次 tick 的区块间隔
     */
    function getBlocksSinceLastTick() external view returns (uint256) {
        return block.number - lastTickBlock;
    }
    
    /**
     * @dev 暂停/恢复合约
     * @param _paused 是否暂停
     */
    function setPaused(bool _paused) external onlyOwner {
        isPaused = _paused;
        emit ContractPaused(_paused);
    }
    
    /**
     * @dev 转移所有权
     * @param newOwner 新所有者地址
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
    
    /**
     * @dev 紧急提取函数（如果合约收到了 ETH）
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        
        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @dev 允许合约接收 ETH
     */
    receive() external payable {}
    
    /**
     * @dev Fallback 函数
     */
    fallback() external payable {}
}
