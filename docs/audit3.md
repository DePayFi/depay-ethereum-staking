# Audit report

| Name       | Information |
|:----------:|-----------|
| Repository | https://github.com/DePayFi/ethereum-staking |
| Checked   | [ ed516563f860440546f0f2967621ff9fe66f3972](https://github.com/DePayFi/ethereum-staking/blob/master/contracts/DePayLiquidityStaking.sol) |
| Branch     | [master](https://github.com/DePayFi/ethereum-staking) |
| Time       | Thu, 13 Dec 2020 03:59:35 UTC |
| Author     | Temitayo Daniel|

# Result

| Severity | Count     | Link |
|:--------:|----------:|------|
| High     | 1        | |
|||[H01 - reward can be increased based on liquidity ](#H01)|
| Medium   | 0      |      |
| Low      | 4        |      |
|||[L01 - Unnecessary override modifiers](#L01)|
|||[L02 - block.timestamp/now could be manipulated by miner to a certain degree](#L02)|
|||[L03 - It's better to returns(bool) for most functions-- double recommend from first audit](#L03)|
|||[L04 - Consider adding virtual keyword to function)](#L04)|


<a name="H01"/>

## H01 - reward can be increased based on liquidity

| Affected        | Severity  | Count | Lines |
|:---------------:|:----------|------:|-------:|
| DePayLiquidityStaking.sol   | High      |   1   | [124-128](https://github.com/DePayFi/ethereum-staking/blob/ed516563f860440546f0f2967621ff9fe66f3972/contracts/DePayLiquidityStaking.sol#L124)|

According to line 124, rewards for a user are calculated based on the reward token reserve `reserve0`, checking [UniswapV2Pair.sol](https://github.com/Uniswap/uniswap-v2-core/blob/master/contracts/UniswapV2Pair.sol#L185)| , the `reserve0` is updated based on the arguments entered for the swap function here

```solidity
function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data)
````
and finally updated here

```solidity
_update(balance0, balance1, _reserve0, _reserve1);
```

This means an attacker can deliberately increase the output of `reserve0` by abusing the external `swap` function on uniswap and go on to call `stake` on `DePayLiquidityStaking.sol`, thereby getting more rewards than intended. 

**Suggested Fix** Many protocols have fell prey to this simple bug by relying on data gotten from price oracles to calculate their own contract rewards. Unfortunately, the only solution to this dangerous severity is to change the mechanism defined [here] (https://github.com/DePayFi/ethereum-staking/blob/ed516563f860440546f0f2967621ff9fe66f3972/contracts/DePayLiquidityStaking.sol#L124) to something else which will not rely on `reserve0`


<a name="L01"/>

## L01 - Unnecessary override modifiers

| Affected        | Severity  | Count | Lines |
|:----------------|:----------|------:|-------:|
| DePayLiquidityStaking.sol   | Low    |   13   |[20](https://github.com/DePayFi/ethereum-staking/blob/ed516563f860440546f0f2967621ff9fe66f3972/contracts/DePayLiquidityStaking.sol#L20), [23](https://github.com/DePayFi/ethereum-staking/blob/ed516563f860440546f0f2967621ff9fe66f3972/contracts/DePayLiquidityStaking.sol#L23), [26](https://github.com/DePayFi/ethereum-staking/blob/ed516563f860440546f0f2967621ff9fe66f3972/contracts/DePayLiquidityStaking.sol#L26), [29](https://github.com/DePayFi/ethereum-staking/blob/ed516563f860440546f0f2967621ff9fe66f3972/contracts/DePayLiquidityStaking.sol#L29), [32](https://github.com/DePayFi/ethereum-staking/blob/ed516563f860440546f0f2967621ff9fe66f3972/contracts/DePayLiquidityStaking.sol#L32), [35](https://github.com/DePayFi/ethereum-staking/blob/ed516563f860440546f0f2967621ff9fe66f3972/contracts/DePayLiquidityStaking.sol#L35), [38](https://github.com/DePayFi/ethereum-staking/blob/ed516563f860440546f0f2967621ff9fe66f3972/contracts/DePayLiquidityStaking.sol#L38), [40](https://github.com/DePayFi/ethereum-staking/blob/ed516563f860440546f0f2967621ff9fe66f3972/contracts/DePayLiquidityStaking.sol#L40), [48](https://github.com/DePayFi/ethereum-staking/blob/ed516563f860440546f0f2967621ff9fe66f3972/contracts/DePayLiquidityStaking.sol#L48), [51](https://github.com/DePayFi/ethereum-staking/blob/ed516563f860440546f0f2967621ff9fe66f3972/contracts/DePayLiquidityStaking.sol#L51), [177](https://github.com/DePayFi/ethereum-staking/blob/ed516563f860440546f0f2967621ff9fe66f3972/contracts/DePayLiquidityStaking.sol#L177), [182](https://github.com/DePayFi/ethereum-staking/blob/ed516563f860440546f0f2967621ff9fe66f3972/contracts/DePayLiquidityStaking.sol#L182), [186](https://github.com/DePayFi/ethereum-staking/blob/ed516563f860440546f0f2967621ff9fe66f3972/contracts/DePayLiquidityStaking.sol#L186)|

If there are no contracts that are inheriting `DePayLiquidityStaking.sol` then these variables,mappings and methods should not have the `override` modifier.


<a name="L02"/>

## L02 - block.timestamp/now could be manipulated by miner to a certain degree

| Affected        | Severity  | Count | Lines |
|:----------------|:----------|------:|-------:|
| DePayLiquidityStaking.sol   | Low    |   4  |
[55](https://github.com/DePayFi/ethereum-staking/blob/ed516563f860440546f0f2967621ff9fe66f3972/contracts/DePayLiquidityStaking.sol#L55), [62](https://github.com/DePayFi/ethereum-staking/blob/ed516563f860440546f0f2967621ff9fe66f3972/contracts/DePayLiquidityStaking.sol#L62), [67](https://github.com/DePayFi/ethereum-staking/blob/ed516563f860440546f0f2967621ff9fe66f3972/contracts/DePayLiquidityStaking.sol#L67), [72](https://github.com/DePayFi/ethereum-staking/blob/ed516563f860440546f0f2967621ff9fe66f3972/contracts/DePayLiquidityStaking.sol#L72)|
| uniswap_v2_pair.sol   | Low    |   1   |
[23](https://github.com/DePayFi/ethereum-staking/blob/ed516563f860440546f0f2967621ff9fe66f3972/contracts/uniswap_v2_pair.sol#L23)|

`block.timestamp` could be manipulated by miner up to a particular degree, It might not match current time. but can be used in this case. Do not use block.timestamp for calculation in randomness strategies


<a name="L03"/>It's better to returns(bool

## L03 - It's better to returns(bool) for most functions-- double recommend from first audit

| Affected        | Severity  | Count | Lines |
|:----------------|:----------|------:|-------:|
| DePayLiquidityStaking.sol   | Low    |   5   |[93](https://github.com/DePayFi/ethereum-staking/blob/ed516563f860440546f0f2967621ff9fe66f3972/contracts/DePayLiquidityStaking.sol#L93), [106]https://github.com/DePayFi/ethereum-staking/blob/ed516563f860440546f0f2967621ff9fe66f3972/contracts/DePayLiquidityStaking.sol#L106), [141](https://github.com/DePayFi/ethereum-staking/blob/ed516563f860440546f0f2967621ff9fe66f3972/contracts/DePayLiquidityStaking.sol#L141), [177](https://github.com/DePayFi/ethereum-staking/blob/ed516563f860440546f0f2967621ff9fe66f3972/contracts/DePayLiquidityStaking.sol#L177), [182](https://github.com/DePayFi/ethereum-staking/blob/ed516563f860440546f0f2967621ff9fe66f3972/contracts/DePayLiquidityStaking.sol#L182)|

`return true;` or the corresponding boolean value will help in cross-contract interaction especially for precise decision making. Always return success values after calling functions.

E.g: Call `unstakeEarly()` from another `contract` address.

```solidity
  function unstakeEarly() override external onlyUnstakeEarly nonReentrant {
    _unstakeLiquidity();
    allocatedStakingRewards = allocatedStakingRewards.sub(rewardsPerAddress[msg.sender]);
    rewardsPerAddress[msg.sender] = 0;
  }
```

**Suggested fix:**

```solidityConsider adding virtual modifier to function
  function unstakeEarly() override external onlyUnstakeEarly nonReentrant returns(true) {
    _unstakeLiquidity();
    allocatedStakingRewards = allocatedStakingRewards.sub(rewardsPerAddress[msg.sender]);
    rewardsPerAddress[msg.sender] = 0;
  }
  }
```
**so in your personal contract, you can have**

```solidity
    function doStuff() {
        require(DepayLiquidityStaking.unstakeEarly()==true);
        //do stuff
        
    }
```
<a name="L04"/>

## L04 - Consider adding virtual keyword to function

| Affected        | Severity  | Count | Lines |
|:----------------|:----------|------:|-------:|
| DePayLiquidityStaking.sol   | Low    |   1   |[93](https://github.com/DePayFi/ethereum-staking/blob/ed516563f860440546f0f2967621ff9fe66f3972/contracts/DePayLiquidityStaking.sol#L93)|

the `init` function is a very common function name and will be used across contract implementations so it is necessary to add the `virtual` keyword to override.

