// SPDX-License-Identifier: MIT

pragma solidity >= 0.7.5;

import './interfaces/IDePayLiquidityStaking.sol';
import './interfaces/IUniswapV2Pair.sol';

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract DePayLiquidityStaking is IDePayLiquidityStaking, Ownable, ReentrancyGuard {
  
  using SafeMath for uint256;

  // Epoch time when staking starts: People are allowed to stake
  uint256 public startTime;

  // Epoch time when staking ends: People are not allowed to stake anymore
  uint256 public endTime;

  // Epoch time when staking releases staked liquidity + rewards: People can withdrawal
  uint256 public releaseTime;

  // Total amount of staking rewards available
  uint256 public totalStakingRewards;

  // Percentage Yield, will be divided by 100, e.g. set 80 for 80%
  uint256 public yield;

  // Total amount of already allocated staking rewards
  uint256 public allocatedStakingRewards;

  // Address of the Uniswap liquidity pair (token)
  IUniswapV2Pair public liquidityToken;

  // Address of the token used for rewards
  IERC20 public token;

  // Stores all rewards per address
  mapping (address => uint256) public rewardsPerAddress;

  // Stores all amounts of staked liquidity tokens per address
  mapping (address => uint256) public stakedLiquidityTokenPerAddress;

  modifier onlyUnstarted() {
    require(
      startTime == 0 || block.timestamp < startTime,
      "Staking has already started!"
    );
    _;
  }

  modifier onlyStarted() {
    require(block.timestamp > startTime, "Staking has not yet started!");
    _;
  }

  modifier onlyUnclosed() {
    require(block.timestamp < endTime, "Staking has been closed!");
    _;
  }

  modifier onlyReleasable() {
    require(block.timestamp > releaseTime, "Staking is not releasable yet!");
    _;
  }

  function init(
      uint256 _startTime,
      uint256 _endTime,
      uint256 _releaseTime,
      uint256 _yield,
      uint256 _totalStakingRewards,
      address _liquidityToken,
      address _token
  ) external onlyOwner onlyUnstarted {
    startTime = _startTime;
    endTime = _endTime;
    releaseTime = _releaseTime;
    yield = _yield;
    totalStakingRewards = _totalStakingRewards;
    liquidityToken = IUniswapV2Pair(_liquidityToken);
    token = IERC20(_token);
    require(token.balanceOf(address(this)) >= totalStakingRewards, 'Not enough tokens deposited for rewards!');
  }

  function stake(uint256 amountLiquidityToken) external onlyStarted nonReentrant {
    require(
      liquidityToken.transferFrom(msg.sender, address(this), amountLiquidityToken),
      'Depositing liquidity token failed!'
    );

    uint112 reserve0;
    uint112 reserve1;
    uint32 blockTimestampLast;
    (reserve0, reserve1, blockTimestampLast) = liquidityToken.getReserves();
    uint256 rewards = amountLiquidityToken.mul(totalStakingRewards).div(liquidityToken.totalSupply()).mul(yield).div(100);

    rewardsPerAddress[msg.sender] = rewardsPerAddress[msg.sender].add(rewards);
    stakedLiquidityTokenPerAddress[msg.sender] = stakedLiquidityTokenPerAddress[msg.sender].add(amountLiquidityToken);

    allocatedStakingRewards = allocatedStakingRewards.add(rewards);
    require(allocatedStakingRewards <= totalStakingRewards, 'Staking overflows rewards!');
  }
}
