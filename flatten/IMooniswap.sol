// Root file: src/interfaces/IMooniswap.sol

// SPDX-License-Identifier: MIT

pragma solidity >= 0.7.5;

interface IMooniswap {
    
    function swap(
        address fromToken,
        address toToken,
        uint256 amount, 
        uint256 minReturn, 
        address referrer
    ) external payable returns(uint256 result);
    
}
