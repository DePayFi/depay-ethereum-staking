# Evaluation report on H01 mitigation
| Name       | Information |
|:----------:|-----------|
| Repository | https://github.com/DePayFi/ethereum-staking |
| Checked   | [ cbe9cd589f3f85ef4f3074aada47039812667d3f](https://github.com/DePayFi/ethereum-staking/commit/cbe9cd589f3f85ef4f3074aada47039812667d3f) |
| Branch     | [master](https://github.com/DePayFi/ethereum-staking) |
| Time       | Thu, 14 Dec 2020 03:59:35 UTC |
| Author     | Temitayo Daniel|

# Result

| Severity | Count     | Link |
|:--------:|----------:|------|
| High     | 1        | |
|||[H01 - reward can be increased based on liquidity ](#H01)|



<a name="H01"/>

## H01 - reward can be increased based on liquidity

| Affected        | Severity  | Count | Lines |
|:---------------:|:----------|------:|-------:|
| DePayLiquidityStaking.sol   | High      |   1   | [124-128](https://github.com/DePayFi/ethereum-staking/blob/ed516563f860440546f0f2967621ff9fe66f3972/contracts/DePayLiquidityStaking.sol#L124)|

Mitigated  via [pull](https://github.com/DePayFi/ethereum-staking/commit/cbe9cd589f3f85ef4f3074aada47039812667d3f) by replacing the variables `reserve0` and  `liquidityToken.totalSupply()` with `tokenReserveOnInit` and `liquidityTokenTotalSupplyOnInit` respectively.

H01 was fully mitigated by initializing all parameters used for calculating `reward` in the `stake` right from the beginning of the liquidity pool. This means a user cannot influence the output of `rewards` in the `stake` function.

 If the `stake` function uses these initialized parameters in its calculation algorithm, then there is no avenue for a change in the output of `rewards` . 

 H01 has been fully mitigated and no further action is required




