// SPDX-License-Identifier: MIT

pragma solidity >= 0.7.5;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import './IUniswapV2Pair.sol';

interface IDePayLiquidityStaking {
  
  function startTime() external view returns (uint256);
  function closeTime() external view returns (uint256);
  function releaseTime() external view returns (uint256);
  function rewardsAmount() external view returns (uint256);
  function percentageYield() external view returns (uint256);
  function allocatedStakingRewards() external view returns (uint256);
  
  function token() external view returns (IERC20);
  function liquidityToken() external view returns (IUniswapV2Pair);

  function unstakeEarlyAllowed() external view returns (bool);
  
  function rewardsPerAddress(address) external view returns (uint256);
  function stakedLiquidityTokenPerAddress(address) external view returns (uint256);

  function init(
      uint256 _startTime,
      uint256 _closeTime,
      uint256 _releaseTime,
      uint256 _percentageYield,
      address _liquidityToken,
      address _token
  ) external;

  function stake(
    uint256 stakedLiquidityTokenAmount
  ) external;

  function withdraw(
    address tokenAddress,
    uint amount
  ) external;

  function unstake() external;

  function enableUnstakeEarly() external;

  function unstakeEarly() external;
}
