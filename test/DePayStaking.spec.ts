import chai, { expect } from 'chai'
import { Contract, Wallet } from 'ethers'
import { deployContract, solidity, MockProvider } from 'ethereum-waffle'

import DePayStaking from '../build/DePayStaking.json'

chai.use(solidity)

describe('DePayStaking', () => {
  
  const provider = new MockProvider();
  const [wallet, otherWallet] = provider.getWallets();

  async function fixture([wallet, other], provider) {
    const contract = await deployContract(wallet, DePayStaking)
    return {contract, wallet, other}
  }
})
