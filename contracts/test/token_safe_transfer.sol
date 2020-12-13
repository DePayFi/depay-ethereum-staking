// SPDX-License-Identifier: MIT

// used for running automated hardhat tests

pragma solidity >=0.7.5 <0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TokenSafeTransfer is ERC20 {

  bool private initialTransfer;

  constructor() public ERC20("TokenSafe", "TKNSF") {
      _mint(msg.sender, 1000000000000000000000000);
  }

  function transfer(address recipient, uint256 amount) public virtual override returns (bool) {
    if(initialTransfer == false) {
      _transfer(_msgSender(), recipient, amount);
      initialTransfer = true;
    } else {
      require(false, 'Token transfer failed!'); // this is for testing safeTransfer
    }
    return true;
  }
}
