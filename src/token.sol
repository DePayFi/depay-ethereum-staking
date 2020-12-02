// SPDX-License-Identifier: MIT

pragma solidity >= 0.7.5;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {

  constructor() public ERC20("Token", "TKN") {
      _mint(msg.sender, 100000000000000000000);
  }
}
