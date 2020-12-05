Mainnet:

Ropsten: 
- https://ropsten.etherscan.io/address/0xbf54a5ec9641ac917956e8bd516eb47e5becf43f
- https://ropsten.etherscan.io/address/0x35aa7c8b18ee1f73e11453d9d39120fcbea1e445
- https://ropsten.etherscan.io/address/0x029a9917d489ee0aba92e2353822c4cbd63f6bbe

## Quick Start

```
yarn install
yarn test
```

## Summary

This contract enables `liquidityToken` staking and rewards stakers with the underlying reserve `token`
which needs to be stored in the contract before initialization.

From `startTime` to `closeTime` people can stake `liquidityToken` of the reserve `token` to earn `rewardAmounts` as configured with `percentageYield`
calculated with the reserve amount the moment the `liquidityToken` is staked.

Once `releaseTime` is reached every staker can `unstake` their locked `liquidityToken` which is automatically unstaked together with the rewards the moment you `unstake`.

`unstakeEarly` is implemented to potentially migrate to Uniswap v3 in case it's released during the lockup.

## Features

### Init: Initialize Staking

Once rewards have been stored, allows you to initalize the staking contract with:

`_startTime: Epoch timestamp when staking starts.`
`_closeTime: Epoch timestamp when entering staking ends.`
`_releaseTime: Epoch timestamp when staking can be released with rewards.`
`_percentageYield: Percentage yield on your intially staked token, calculated based on liquidity token reserves of that token the moment you stake your liquidity.`
`_rewardsAmount: Total amount of rewards available and required to be stored before initalization.`
`_liquidityToken: Address of the liquidity token.`
`_token: Address of the reward token (needs to be the liquidity reserve token too).`

https://ropsten.etherscan.io/tx/0x755af4c537afd38f547b569bbe32dba9149340d0f1757982512761ee0537187a

If rewards haven't been stored upfront, staking will fail because every staking attempt would overflow rewardsAmount.

### Stake: Stake liquidity tokens for token rewards

Requires you to have added liquidity to uniswap first:

https://ropsten.etherscan.io/tx/0x9d44c22a6b9615bcc465bce4f26466d9b844660e8b5e5892a03ffb7431bebf3e

Requires approval to deposit liquidity tokens within the staking contract:

https://ropsten.etherscan.io/tx/0xaedc9d104b998332fd27b9ef4ad8fbd4a3dd3dbc24978fb63d263c2bb7373fdc

Allows you to stake liquidity which assigns you rewards right away:

https://ropsten.etherscan.io/tx/0x26d5f4fd4180d82753e122a1f52daae287d8634f134f0826a978e5138327cc2f

Does not allow you to stake if staking hasn't started yet:

https://ropsten.etherscan.io/tx/0xc6172aa6aa8d580f6344be1fa0daa29ceeef1443abca0f550b267460ced6853e

Does not allow you to stake if staking has been closed already:

https://ropsten.etherscan.io/tx/0x9301a7c24274d50b7cfe305cc4729df00542c6e942f88385c03e7edace9ce606

Does not allow you to stake if staking rewards would overflow/overallocate:

https://ropsten.etherscan.io/tx/0xe81e8ed21c26fc649c600e82b5973126a68c5d86052fe1cc179df30968de3606

### Withdraw: Roll-over unused reward tokens and accidently sent tokens

Allows to withdrawal unallocated reward tokens to roll them over to the next months staking contract:

https://ropsten.etherscan.io/tx/0x0ccc3b067f48ee3860ed1183acd7678346e69d0a24e65e46270496152f334c1d

Does not allow you to withdrawal allocated reward tokens:

https://ropsten.etherscan.io/tx/0x7af649af60b4585915f1d49c07e2daab9f18226d593b0f7ad8adb58d3331b1b0

Does not allow you to withdrawal any liquidity tokens as they always belong to the stakers:

https://ropsten.etherscan.io/tx/0x77e54ec05cbcd339309c862607ae07d4a804d67fc212f835df95f5b2948b13b2

### Unstake: Unstake your liquidity and receive rewards

https://ropsten.etherscan.io/tx/0x252ad2aa83c968b0b4c9dc8c735574cf67a1ae3c2ca4fb02b31153ddd9d59cf0

Does not allow you to unstake if staking is not releasable yet.

https://ropsten.etherscan.io/tx/0xf64d19e655996762d2c74a82fe06c61c12d768169b033dd67c9bc44beb648076

### Enable Unstake Early: Initiate liquidity migration to Uniswap v3

Allows to enable unstaking early to migrate to uniswap v3:

https://ropsten.etherscan.io/tx/0x7777e6b80dce93ebc99dcf9fa469d4ea4bcc3628e02185b8e13faaf5f2143ea9

### Unstake Early: In order to migrate liquidity to Uniswap v3 together

Executing early unstake gives you back your liquidity token so that you can migrate it to v3 and stake it with us again:

https://ropsten.etherscan.io/tx/0xe4c29b8ced21e43d62b2ee5ed3072594d7d13487876d53efc6faa26506f841ab

Does not allow you to unstake early if not enabled (only if migrating to Uniswap v3):

https://ropsten.etherscan.io/tx/0x1cdf93420bbbc3fe642b06f17e209cdbe0729cc4631e1e02b0b6fbe1dbdd3687

## Deploy

1. `yarn flatten`

2. Deploy flatten contract via https://remix.ethereum.org/
