// SPDX-License-Identifier: MIT

pragma solidity >= 0.7.5;

interface IUniswapV2Pair {
    
    function totalSupply() external view returns (uint);
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
    
}
