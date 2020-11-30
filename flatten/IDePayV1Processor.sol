// Root file: src/interfaces/IDePayV1Processor.sol

// SPDX-License-Identifier: MIT

pragma solidity >= 0.7.5;

interface IDePayV1Processor {
    
    event Payment(
        uint indexed id,
        address indexed sender,
        address payable indexed receiver
    );

   function pay(
        address[] calldata path,
        uint amountIn,
        uint amountOut,
        address payable receiver,
        uint id,
        uint routerId
    ) external payable;

}
