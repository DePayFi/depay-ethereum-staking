// Dependency file: @openzeppelin/contracts/token/ERC20/IERC20.sol

// SPDX-License-Identifier: MIT

// pragma solidity >=0.6.0 <0.8.0;

/**
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
interface IERC20 {
    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves `amount` tokens from the caller's account to `recipient`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address recipient, uint256 amount) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * // importANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 amount) external returns (bool);

    /**
     * @dev Moves `amount` tokens from `sender` to `recipient` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);

    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);
}


// Dependency file: src/interfaces/IUniswapV2Pair.sol


// pragma solidity >= 0.7.5;

interface IUniswapV2Pair {
    
    function totalSupply() external view returns (uint);
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
    function transfer(address to, uint value) external returns (bool);
    function transferFrom(address from, address to, uint value) external returns (bool);
    function token0() external view returns (address);

}


// Root file: src/interfaces/IDePayLiquidityStaking.sol


pragma solidity >= 0.7.5;

// import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// import 'src/interfaces/IUniswapV2Pair.sol';

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
      uint256 _rewardsAmount,
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
