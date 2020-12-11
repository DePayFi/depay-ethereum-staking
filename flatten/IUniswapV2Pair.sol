// Root file: contracts/interfaces/IUniswapV2Pair.sol

// SPDX-License-Identifier: MIT

pragma solidity >=0.7.5 <0.8.0;

interface IUniswapV2Pair {
    
    function totalSupply() external view returns (uint);
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
    function transfer(address to, uint value) external returns (bool);
    function transferFrom(address from, address to, uint value) external returns (bool);
    function token0() external view returns (address);

}
