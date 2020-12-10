# Audit report

| Name       | Information |
|:----------:|-----------|
| Repository | https://github.com/DePayFi/ethereum-staking |
| Revision   | [72b189ff773993ed70efcb84992e48ca76b2ca7d](https://github.com/DePayFi/ethereum-staking/tree/72b189ff773993ed70efcb84992e48ca76b2ca7d) |
| Branch     | [master](https://github.com/DePayFi/ethereum-staking) |
| Time       | Thu, 10 Dec 2020 03:59:35 UTC |
| Author     | Chiro Hiro |

# Result

| Severity | Count     | Link |
|:--------:|----------:|------|
| High     | 2        | |
|||[H01 - Possible fund lost and trapped](#H01)|
|||[H02 - Year 2038 problem](#H02)|
| Medium   | 3        |      |
|||[M01 - Possible wrong modifier implement](#M01)|
|||[M02 - Missing check for close time](#M02)|
|||[M03 - All variables were not consumed](#M03)|
| Low      | 8         |      |
|||[L01 - It's better to have destroy method](#L01)|
|||[L02 - It's better to have fixed range of version](#L02)|
|||[L03 - Unnecessary override modifier](#L03)|
|||[L04 - Unused property](#L04)|
|||[L05 - block.timestamp could be manipulated by miner](#L05)|
|||[L06 - Unnecessary temporary variable](#L06)|
|||[L07 - It's better to returns(bool)](#L07)|
|||[L08 - Complex type cast](#L08)|

<a name="H01"/>

## H01 - Possible fund lost and trapped

| Affected        | Severity  | Count | Lines |
|:---------------:|:----------|------:|-------:|
| DePayLiquidityStaking.sol   | High      |   2   | [148](https://github.com/DePayFi/ethereum-staking/blob/72b189ff773993ed70efcb84992e48ca76b2ca7d/contracts/DePayLiquidityStaking.sol#L148), [165](https://github.com/DePayFi/ethereum-staking/blob/72b189ff773993ed70efcb84992e48ca76b2ca7d/contracts/DePayLiquidityStaking.sol#L165)|

It could be happened in the same way of fake deposit attack where your `call()` is failed but in the contract's state were updated.

```solidity
  function withdraw(
    address tokenAddress,
    uint amount
  ) override external onlyOwner nonReentrant {
    require(tokenAddress != address(liquidityToken), 'Not allowed to withdrawal liquidity tokens!');
    
    if(tokenAddress == address(token)) {
      require(
        allocatedStakingRewards <= token.balanceOf(address(this)).sub(amount),
        'Only unallocated staking rewards are allowed to be withdrawn for roll-over to next staking contract!'
      );
      rewardsAmount = rewardsAmount.sub(amount);
    }

    IERC20(tokenAddress).transfer(payableOwner(), amount);
  }
```

`rewardsAmount = rewardsAmount.sub(amount);` possible to be happened even `IERC20(tokenAddress).transfer(payableOwner(), amount);` was failed.

**Suggest Fix:** Please use [SafeERC20](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/SafeERC20.sol)

```solidity
   using SafeERC20 for ERC20

  function withdraw(
    address tokenAddress,
    uint amount
  ) override external onlyOwner nonReentrant {
    require(tokenAddress != address(liquidityToken), 'Not allowed to withdrawal liquidity tokens!');
    
    if(tokenAddress == address(token)) {
      require(
        allocatedStakingRewards <= token.balanceOf(address(this)).sub(amount),
        'Only unallocated staking rewards are allowed to be withdrawn for roll-over to next staking contract!'
      );
      rewardsAmount = rewardsAmount.sub(amount);
    }

    require(IERC20(tokenAddress).safeTransfer(payableOwner(), amount), 'Unable to do transaction');
  }
```

<a name="H02"/>

## H02 - Year 2038 problem

| Affected        | Severity  | Count | Lines |
|:----------------|:----------|------:|-------:|
| uniswap_v2_pair.sol       | High      |   1   |[20](https://github.com/DePayFi/ethereum-staking/blob/72b189ff773993ed70efcb84992e48ca76b2ca7d/contracts/uniswap_v2_pair.sol#L20)|

Unix timestamp will be overflow at 2038 since in many system it was **unsigned integer 32 bits**. Apparently, `0xffffffff + 1 = 0x100000000` but It will be truncated to `0x00000000` to fit `uint32`. we didn't use this code any where but please aware of this.

<a name="M01"/>

## M01 - Possible wrong modifier implement

| Affected      | Severity  | Count | Lines |
|:-------------:|:----------|------:|-------:|
| DePayLiquidityStaking.sol   | Medium    |   1   | [26-27](https://github.com/DePayFi/ethereum-staking/blob/72b189ff773993ed70efcb84992e48ca76b2ca7d/contracts/DePayLiquidityStaking.sol#L54-L60)

```solidity
  modifier onlyUnstarted() {
    require(
      startTime == 0 || block.timestamp < startTime,
      "Staking has already started!"
    );
    _;
  }
```

`block.timestamp < startTime` This condition is always `true` since `startTime = 0`, It's only make sense if you want to call `init()` more than once(?).

<a name="M02"/>

## M02 - Missing check for close time

| Affected        | Severity  | Count | Lines |
|:----------------|:----------|------:|-------:|
| DePayLiquidityStaking.sol   | Medium    |   1  | [83-84](https://github.com/DePayFi/ethereum-staking/blob/72b189ff773993ed70efcb84992e48ca76b2ca7d/contracts/DePayLiquidityStaking.sol#L83-L84)|

This one is just a logic issue, you might need to have some addition checks.

E.g: If you set `_startTime = block.timestamp` and `_closeTime < _startTime` then contract would become unusable.


<a name="M03"/>

## M03 - Some variables were not consumed

| Affected        | Severity  | Count | Lines |
|:----------------|:----------|------:|-------:|
| DePayLiquidityStaking.sol   | Medium    |   1   |[107-110](https://github.com/DePayFi/ethereum-staking/blob/72b189ff773993ed70efcb84992e48ca76b2ca7d/contracts/DePayLiquidityStaking.sol#L107-L110)|

```solidity
    uint112 reserve0;
    uint112 reserve1;
    uint32 blockTimestampLast;
    (reserve0, reserve1, blockTimestampLast) = liquidityToken.getReserves();
```

`reserve1` and `blockTimestampLast` were not consumed.

**Suggest Fix:**

[uniswap_v2_pair.sol#L9-L11](https://github.com/DePayFi/ethereum-staking/blob/72b189ff773993ed70efcb84992e48ca76b2ca7d/contracts/uniswap_v2_pair.sol#L9-L11)

```solidity
  uint112 public reserve0;
  uint112 public reserve1;
```

[DePayLiquidityStaking.sol#L107-L110](https://github.com/DePayFi/ethereum-staking/blob/2ceeb6c6b3d428f1689ece4927d2222ba74eae90/contracts/DePayLiquidityStaking.sol#L107-L110)

```solidity
    uint112 reserve0 = liquidityToken.reserve0();
```
<a name="L01"/>

## L01 - It's better to have destroy method

I think `DePayLiquidityStaking` contract is only usable for a duration, please consider to have `destroy()` method to get back your ETH.

```solidity 
  modifier onlyDistributedReward(){
    require(allocatedStakingRewards == 0, 'Rewards were not distributed');
    _;
  }

  modifier onlyClosed() {
    require(block.timestamp > closeTime, "Staking still opening!");
    _;
  }

  function destroy() onlyOwner onlyClosed onlyDistributedReward {
    selfdestruct(payable(owner()));
  }
```

<a name="L02"/>

## L02 - It's better to have fixed range of version

| Affected        | Severity  | Count | Lines |
|:----------------|:----------|------:|-------:|
| DePayLiquidityStaking.sol   | Low    |   1   |[3](https://github.com/DePayFi/ethereum-staking/blob/72b189ff773993ed70efcb84992e48ca76b2ca7d/contracts/DePayLiquidityStaking.sol#L3)|
| uniswap_v2_pair.sol   | Low    |   1   |[3](https://github.com/DePayFi/ethereum-staking/blob/72b189ff773993ed70efcb84992e48ca76b2ca7d/contracts/uniswap_v2_pair.sol#L3)|
| token.sol   | Low    |   1   |[3](https://github.com/DePayFi/ethereum-staking/blob/72b189ff773993ed70efcb84992e48ca76b2ca7d/contracts/token.sol#L3)|
| IDePayLiquidityStaking.sol   | Low    |   1   |[3](https://github.com/DePayFi/ethereum-staking/blob/72b189ff773993ed70efcb84992e48ca76b2ca7d/contracts/interfaces/IDePayLiquidityStaking.sol#L3)|
| IUniswapV2Pair.sol   | Low    |   1   |[3](https://github.com/DePayFi/ethereum-staking/blob/72b189ff773993ed70efcb84992e48ca76b2ca7d/contracts/interfaces/IUniswapV2Pair.sol#L3)|


`0.8.x` would have some new breaking changes, please consider to change this:

```solidity
pragma solidity >= 0.7.5;
```

To this:
```solidity
pragma solidity >=0.7.5 <0.8.0;
```

<a name="L03"/>

## L03 - Unnecessary override modifier

| Affected        | Severity  | Count | Lines |
|:----------------|:----------|------:|-------:|
| DePayLiquidityStaking.sol   | Low    |   16   |[18](https://github.com/DePayFi/ethereum-staking/blob/72b189ff773993ed70efcb84992e48ca76b2ca7d/contracts/DePayLiquidityStaking.sol#L18), [21](https://github.com/DePayFi/ethereum-staking/blob/72b189ff773993ed70efcb84992e48ca76b2ca7d/contracts/DePayLiquidityStaking.sol#L21), [24](https://github.com/DePayFi/ethereum-staking/blob/72b189ff773993ed70efcb84992e48ca76b2ca7d/contracts/DePayLiquidityStaking.sol#L24), [27](https://github.com/DePayFi/ethereum-staking/blob/72b189ff773993ed70efcb84992e48ca76b2ca7d/contracts/DePayLiquidityStaking.sol#L27), [30](https://github.com/DePayFi/ethereum-staking/blob/72b189ff773993ed70efcb84992e48ca76b2ca7d/contracts/DePayLiquidityStaking.sol#L30), [33](https://github.com/DePayFi/ethereum-staking/blob/72b189ff773993ed70efcb84992e48ca76b2ca7d/contracts/DePayLiquidityStaking.sol#L33), [36](https://github.com/DePayFi/ethereum-staking/blob/72b189ff773993ed70efcb84992e48ca76b2ca7d/contracts/DePayLiquidityStaking.sol#L36), [39](https://github.com/DePayFi/ethereum-staking/blob/72b189ff773993ed70efcb84992e48ca76b2ca7d/contracts/DePayLiquidityStaking.sol#L39), [43.46](https://github.com/DePayFi/ethereum-staking/blob/72b189ff773993ed70efcb84992e48ca76b2ca7d/contracts/DePayLiquidityStaking.sol#L43.46), [49](https://github.com/DePayFi/ethereum-staking/blob/72b189ff773993ed70efcb84992e48ca76b2ca7d/contracts/DePayLiquidityStaking.sol#L49), [89](https://github.com/DePayFi/ethereum-staking/blob/72b189ff773993ed70efcb84992e48ca76b2ca7d/contracts/DePayLiquidityStaking.sol#L89), [101](https://github.com/DePayFi/ethereum-staking/blob/72b189ff773993ed70efcb84992e48ca76b2ca7d/contracts/DePayLiquidityStaking.sol#L101), [137](https://github.com/DePayFi/ethereum-staking/blob/72b189ff773993ed70efcb84992e48ca76b2ca7d/contracts/DePayLiquidityStaking.sol#L137), [170](https://github.com/DePayFi/ethereum-staking/blob/72b189ff773993ed70efcb84992e48ca76b2ca7d/contracts/DePayLiquidityStaking.sol#L170), [175](https://github.com/DePayFi/ethereum-staking/blob/72b189ff773993ed70efcb84992e48ca76b2ca7d/contracts/DePayLiquidityStaking.sol#L175), [179](https://github.com/DePayFi/ethereum-staking/blob/72b189ff773993ed70efcb84992e48ca76b2ca7d/contracts/DePayLiquidityStaking.sol#L179)|

If there are no contracts derive from `DePayLiquidityStaking.sol` then these properties and methods shouldn't be `override`.

<a name="L04"/>

## L04 - Unused property

| Affected        | Severity  | Count | Lines |
|:----------------|:----------|------:|-------:|
| DePayLiquidityStaking.sol   | Low    |   1   |[52](https://github.com/DePayFi/ethereum-staking/blob/72b189ff773993ed70efcb84992e48ca76b2ca7d/contracts/DePayLiquidityStaking.sol#L52)|

```solidity
  // Address ZERO
  address private ZERO = 0x0000000000000000000000000000000000000000;
```

This property wasn't used anywhere, you might need to use `address(0)` instead.

<a name="L05"/>

## L05 - block.timestamp could be manipulated by miner

| Affected        | Severity  | Count | Lines |
|:----------------|:----------|------:|-------:|
| DePayLiquidityStaking.sol   | Low    |   4   |
[56](https://github.com/DePayFi/ethereum-staking/blob/72b189ff773993ed70efcb84992e48ca76b2ca7d/contracts/DePayLiquidityStaking.sol#L56), [63](https://github.com/DePayFi/ethereum-staking/blob/72b189ff773993ed70efcb84992e48ca76b2ca7d/contracts/DePayLiquidityStaking.sol#L63), [68](https://github.com/DePayFi/ethereum-staking/blob/72b189ff773993ed70efcb84992e48ca76b2ca7d/contracts/DePayLiquidityStaking.sol#L68), [73](https://github.com/DePayFi/ethereum-staking/blob/72b189ff773993ed70efcb84992e48ca76b2ca7d/contracts/DePayLiquidityStaking.sol#L73)|
| uniswap_v2_pair.sol   | Low    |   1   |
[23](https://github.com/DePayFi/ethereum-staking/blob/72b189ff773993ed70efcb84992e48ca76b2ca7d/contracts/uniswap_v2_pair.sol#L23)|

`block.timestamp` could be manipulated by miner, It might not match current time.

<a name="L06"/>

## L06 - Unnecessary temporary variable

| Affected        | Severity  | Count | Lines |
|:----------------|:----------|------:|-------:|
| DePayLiquidityStaking.sol   | Low    |   1   |
[179-184](https://github.com/DePayFi/ethereum-staking/blob/72b189ff773993ed70efcb84992e48ca76b2ca7d/contracts/DePayLiquidityStaking.sol#L179-L184)|

```solidity
  function unstakeEarly() override external onlyUnstakeEarly nonReentrant {
    _unstakeLiquidity();
    uint256 rewards = rewardsPerAddress[msg.sender];
    allocatedStakingRewards = allocatedStakingRewards.sub(rewards);
    rewardsPerAddress[msg.sender] = 0;
  }
```

The code from above cost more than `22 gas`

```solidity
  function unstakeEarly() override external onlyUnstakeEarly nonReentrant {
    _unstakeLiquidity();
    allocatedStakingRewards = allocatedStakingRewards.sub(rewardsPerAddress[msg.sender]);
    rewardsPerAddress[msg.sender] = 0;
  }
```

<a name="L07"/>

## L07 - It's better to returns(bool)

| Affected        | Severity  | Count | Lines |
|:----------------|:----------|------:|-------:|
| DePayLiquidityStaking.sol   | Low    |   6   |[89](https://github.com/DePayFi/ethereum-staking/blob/72b189ff773993ed70efcb84992e48ca76b2ca7d/contracts/DePayLiquidityStaking.sol#L89), [101](https://github.com/DePayFi/ethereum-staking/blob/72b189ff773993ed70efcb84992e48ca76b2ca7d/contracts/DePayLiquidityStaking.sol#L101), [137](https://github.com/DePayFi/ethereum-staking/blob/72b189ff773993ed70efcb84992e48ca76b2ca7d/contracts/DePayLiquidityStaking.sol#L137), [170](https://github.com/DePayFi/ethereum-staking/blob/72b189ff773993ed70efcb84992e48ca76b2ca7d/contracts/DePayLiquidityStaking.sol#L170), [175](https://github.com/DePayFi/ethereum-staking/blob/72b189ff773993ed70efcb84992e48ca76b2ca7d/contracts/DePayLiquidityStaking.sol#L175), [179](https://github.com/DePayFi/ethereum-staking/blob/72b189ff773993ed70efcb84992e48ca76b2ca7d/contracts/DePayLiquidityStaking.sol#L179)|

`return true;` at the end of your function will help interactive between other contract be more secure.

E.g: Call `init()` from your `multi-sig` wallet.

```solidity
  function init(
      uint256 _startTime,
      uint256 _closeTime,
      uint256 _releaseTime,
      uint256 _percentageYield,
      address _liquidityToken,
      address _token
  ) override external onlyOwner onlyUnstarted {
    startTime = _startTime;
    closeTime = _closeTime;
    releaseTime = _releaseTime;
    percentageYield = _percentageYield;
    liquidityToken = IUniswapV2Pair(_liquidityToken);
    token = IERC20(_token);
    rewardsAmount = token.balanceOf(address(this));
  }
```

**Suggest fix:**

```solidity
  function init(
      uint256 _startTime,
      uint256 _closeTime,
      uint256 _releaseTime,
      uint256 _percentageYield,
      address _liquidityToken,
      address _token
  ) override external onlyOwner onlyUnstarted returns(bool) {
    startTime = _startTime;
    closeTime = _closeTime;
    releaseTime = _releaseTime;
    percentageYield = _percentageYield;
    liquidityToken = IUniswapV2Pair(_liquidityToken);
    token = IERC20(_token);
    rewardsAmount = token.balanceOf(address(this));
    return true;
  }
```

<a name="L08"/>

## L08 - Complex type cast

| Affected        | Severity  | Count | Lines |
|:----------------|:----------|------:|-------:|
| DePayLiquidityStaking.sol   | Low    |   1   |[30-32](https://github.com/DePayFi/ethereum-staking/blob/72b189ff773993ed70efcb84992e48ca76b2ca7d/contracts/DePayLiquidityStaking.sol#L130-L132)|


```solidity
  function payableOwner() view private returns(address payable) {
    return address(uint160(owner()));
  }
```

**Suggest fix:**

```solidity
  function payableOwner() view private returns(address payable) {
    return payable(owner());
  }
```
