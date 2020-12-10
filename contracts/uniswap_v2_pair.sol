// SPDX-License-Identifier: MIT

pragma solidity >=0.7.5 <0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract UniswapV2Pair is ERC20 {

  uint112 private reserve0;
  uint112 private reserve1;
  address public token0;

  constructor(uint256 totalSupply, address _token0, uint112 _reserve0, uint112 _reserve1) public ERC20("Uniswap V2", "UNI-V2") {
    _mint(msg.sender, totalSupply);
    reserve0 = _reserve0;
    reserve1 = _reserve1;
    token0 = _token0;
  }

  function getReserves() public view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast) {
    _reserve0 = reserve0;
    _reserve1 = reserve1;
    _blockTimestampLast = uint32(block.timestamp);
  }
}
