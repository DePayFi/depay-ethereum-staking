import chai, { expect } from 'chai'
import {
  Contract,
  Wallet 
} from 'ethers'
import IERC20 from '../build/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json'
import Token from '../build/src/token.sol/Token.json'
import UniswapV2Pair from '../build/src/uniswap_v2_pair.sol/UniswapV2Pair.json'
import IUniswapV2Pair from '../build/src/interfaces/IUniswapV2Pair.sol/IUniswapV2Pair.json'
import DePayLiquidityStaking from '../build/src/DePayLiquidityStaking.sol/DePayLiquidityStaking.json'

const { waffle, ethers } = require("hardhat")
const {
  provider,
  deployContract,
  deployMockContract,
  loadFixture
} = waffle

describe('DePayLiquidityStaking', () => {
  
  const [ownerWallet, otherWallet] = provider.getWallets()
  let now = () => Math.round(new Date().getTime() / 1000)
  
  async function fixture([ownerWallet, otherWallet]: Wallet[], provider: any) {
    const contract = await deployContract(ownerWallet, DePayLiquidityStaking)
    // const tokenContract = await deployMockContract(ownerWallet, IERC20.abi)
    // const liquidityTokenContract = await deployMockContract(ownerWallet, IUniswapV2Pair.abi)
    return
    // return {
    //   contract,
    //   ownerWallet,
    //   otherWallet,
    //   tokenContract,
    //   liquidityTokenContract
    // }
  }

  interface initParameters {
    contract: Contract,
    wallet: Wallet,
    liquidityTokenContract: Contract,
    tokenContract: Contract,
    rewardsBalance?: string,
    percentageYield?: string,
    rewardsAmount?: string,
    startTime?: number,
    closeTime?: number,
    releaseTime?: number
  }

  async function init({
    contract,
    wallet,
    liquidityTokenContract,
    tokenContract,
    rewardsBalance = '0',
    percentageYield = '100', // for 100%
    rewardsAmount = '900000000000000000000000', // 900,000 DEPAY
    startTime = now() - 10,
    closeTime = now() + 2610000, // + 1 month
    releaseTime = now() + 31536000 // + 12 month
  }: initParameters) {
    if(tokenContract.mock) {
      await tokenContract.mock.balanceOf.returns(rewardsBalance)
    }
    await contract.connect(wallet).init(
      startTime,
      closeTime,
      releaseTime,
      percentageYield,
      rewardsAmount,
      liquidityTokenContract.address,
      tokenContract.address
    )
    return {
      startTime,
      closeTime,
      releaseTime,
      percentageYield,
      rewardsAmount
    }
  }

  interface stakeParameters {
    contract: Contract,
    tokenContractAddress: string,
    liquidityTokenContract: Contract,
    wallet: Wallet,
    stakedLiquidityTokenAmount: string,
    pairReserve0?: string,
    pairReserve1?: string,
    totalSupply?: string
  }

  async function stake({
    contract,
    tokenContractAddress,
    liquidityTokenContract,
    wallet,
    stakedLiquidityTokenAmount,
    pairReserve0,
    pairReserve1 = '2000000000000000000000',
    totalSupply
  }: stakeParameters) {
    if(liquidityTokenContract.mock) {
      await liquidityTokenContract.mock.transferFrom.returns(true)
      await liquidityTokenContract.mock.getReserves.returns(pairReserve0, pairReserve1, now())
      await liquidityTokenContract.mock.totalSupply.returns(totalSupply)
      await liquidityTokenContract.mock.token0.returns(tokenContractAddress)
    }
    await contract.connect(wallet).stake(stakedLiquidityTokenAmount)
  }

  interface withdrawParameters {
    contract: Contract,
    wallet: Wallet,
    token: string,
    amount: string
  }

  async function withdraw({
    contract,
    wallet,
    token,
    amount
  }: withdrawParameters) {
    await contract.connect(wallet).withdraw(token, amount)
  }

  interface unstakeParameters {
    contract: Contract,
    wallet: Wallet
  }

  async function unstake({
    contract,
    wallet,
  }: unstakeParameters) {
    await contract.connect(wallet).unstake()
  }

  it('deploys successfully', async () => {
    loadFixture(fixture)
  })

  // it('sets deployer wallet as the contract owner', async () => {
  //   const {contract, ownerWallet} = await loadFixture(fixture)
  //   const owner = await contract.owner()
  //   expect(owner).to.equal(ownerWallet.address)
  // })

  // it('allows the owner to initialize the staking contract', async () => {
  //   const {
  //     contract,
  //     ownerWallet,
  //     liquidityTokenContract,
  //     tokenContract
  //   } = await loadFixture(fixture)
  //   const {
  //     startTime,
  //     closeTime,
  //     releaseTime,
  //     percentageYield,
  //     rewardsAmount
  //   } = await init({
  //     contract,
  //     wallet: ownerWallet,
  //     liquidityTokenContract,
  //     tokenContract,
  //     rewardsAmount: '900000000000000000000000',
  //     rewardsBalance: '900000000000000000000000'
  //   })
  //   expect(await contract.startTime()).to.eq(startTime)
  //   expect(await contract.closeTime()).to.eq(closeTime)
  //   expect(await contract.releaseTime()).to.eq(releaseTime)
  //   expect(await contract.percentageYield()).to.eq(percentageYield)
  //   expect(await contract.rewardsAmount()).to.eq(rewardsAmount)
  //   expect(await contract.liquidityToken()).to.eq(liquidityTokenContract.address)
  //   expect(await contract.token()).to.eq(tokenContract.address)
  // })

  // it('prohibits other wallets but the owner to initialize the staking contract', async () => {
  //   const {
  //     contract,
  //     otherWallet,
  //     tokenContract,
  //     liquidityTokenContract
  //   } = await loadFixture(fixture)
  //   await expect(
  //     init({
  //       contract,
  //       wallet: otherWallet,
  //       tokenContract,
  //       liquidityTokenContract
  //     })
  //   ).to.be.revertedWith(
  //     'VM Exception while processing transaction: revert Ownable: caller is not the owner'
  //   )
  // })

  // it('it prohibits the owner to init staking if rewards have not been locked in yet', async () => {
  //   const {
  //     contract,
  //     ownerWallet,
  //     tokenContract,
  //     liquidityTokenContract
  //   } = await loadFixture(fixture)
  //   await expect(
  //     init({
  //       contract,
  //       wallet: ownerWallet,
  //       tokenContract,
  //       liquidityTokenContract,
  //       rewardsAmount: '900000000000000000000000',
  //       rewardsBalance: '0'
  //     })
  //   ).to.be.revertedWith(
  //     'Not enough tokens deposited for rewards!'
  //   )
  // })

  // it('prohibits to initialize the staking contract again, when its already started', async () => {
  //   const {
  //     contract,
  //     ownerWallet,
  //     tokenContract,
  //     liquidityTokenContract
  //   } = await loadFixture(fixture)
  //   async function _init() {
  //     await init({
  //       contract, 
  //       wallet: ownerWallet,
  //       tokenContract,
  //       liquidityTokenContract,
  //       rewardsAmount: '900000000000000000000000',
  //       rewardsBalance: '900000000000000000000000'
  //     })
  //   }
  //   await _init() // first time
  //   await expect(
  //     _init() // second time
  //   ).to.be.revertedWith(
  //     'VM Exception while processing transaction: revert Staking has already started!'
  //   )
  // })

  // it('allows to stake liquidity when staking started', async () => {
  //   const {
  //     contract,
  //     ownerWallet,
  //     otherWallet,
  //     tokenContract,
  //     liquidityTokenContract
  //   } = await loadFixture(fixture)
  //   await init({
  //     contract, 
  //     wallet: ownerWallet,
  //     tokenContract,
  //     liquidityTokenContract,
  //     percentageYield: '100',
  //     rewardsAmount: '900000000000000000000000',
  //     rewardsBalance: '900000000000000000000000'
  //   })
  //   const stakedLiquidityTokenAmount = '2000000000000000000000'
  //   await stake({
  //     contract,
  //     tokenContractAddress: tokenContract.address,
  //     liquidityTokenContract,
  //     wallet: otherWallet,
  //     stakedLiquidityTokenAmount,
  //     pairReserve0: '100000000000000000000000',
  //     totalSupply: '4000000000000000000000'
  //   })
  //   expect(await contract.rewardsPerAddress(otherWallet.address)).to.eq('50000000000000000000000')
  //   expect(await contract.stakedLiquidityTokenPerAddress(otherWallet.address)).to.eq(stakedLiquidityTokenAmount)
  //   expect(await contract.allocatedStakingRewards()).to.eq('50000000000000000000000')
  // })

  // it('pays less rewards when setup with lower yield reward', async () => {
  //   const {
  //     contract,
  //     ownerWallet,
  //     otherWallet,
  //     liquidityTokenContract,
  //     tokenContract
  //   } = await loadFixture(fixture)
  //   await init({
  //     contract,
  //     wallet: ownerWallet,
  //     tokenContract,
  //     liquidityTokenContract,
  //     percentageYield: '80',
  //     rewardsAmount: '900000000000000000000000',
  //     rewardsBalance: '900000000000000000000000'
  //   })
  //   const stakedLiquidityTokenAmount = '2000000000000000000000'
  //   await stake({
  //     contract,
  //     tokenContractAddress: tokenContract.address,
  //     liquidityTokenContract,
  //     wallet: otherWallet,
  //     stakedLiquidityTokenAmount,
  //     pairReserve0: '100000000000000000000000',
  //     totalSupply: '4000000000000000000000'
  //   })
  //   expect(await contract.rewardsPerAddress(otherWallet.address)).to.eq('40000000000000000000000')
  //   expect(await contract.stakedLiquidityTokenPerAddress(otherWallet.address)).to.eq(stakedLiquidityTokenAmount)
  //   expect(await contract.allocatedStakingRewards()).to.eq('40000000000000000000000')
  // })

  // it('prohibits to stake liquidity when staking did not start yet', async () => {
  //   const {
  //     contract,
  //     ownerWallet,
  //     otherWallet,
  //     liquidityTokenContract,
  //     tokenContract
  //   } = await loadFixture(fixture)
  //   await init({
  //     contract,
  //     wallet: ownerWallet,
  //     tokenContract,
  //     liquidityTokenContract,
  //     rewardsAmount: '900000000000000000000000',
  //     rewardsBalance: '900000000000000000000000',
  //     startTime: now() + 86400
  //   })
  //   await expect(contract.connect(otherWallet).stake('2157166313861058934633')).to.be.revertedWith(
  //     'VM Exception while processing transaction: revert Staking has not yet started!'
  //   )
  // })

  // it('fails when trying to stake more than rewards left', async () => {
  //   const {
  //     contract,
  //     ownerWallet,
  //     otherWallet,
  //     liquidityTokenContract,
  //     tokenContract
  //   } = await loadFixture(fixture)
  //   await init({
  //     contract, 
  //     wallet: ownerWallet,
  //     tokenContract,
  //     liquidityTokenContract,
  //     percentageYield: '100',
  //     rewardsAmount: '100000000000000000000000',
  //     rewardsBalance: '100000000000000000000000'
  //   })
  //   const stakedLiquidityTokenAmount = '2000000000000000000000'
  //   await stake({
  //     contract,
  //     tokenContractAddress: tokenContract.address,
  //     liquidityTokenContract,
  //     wallet: otherWallet,
  //     stakedLiquidityTokenAmount,
  //     pairReserve0: '100000000000000000000000',
  //     totalSupply: '4000000000000000000000'
  //   })
  //   await expect(
  //     stake({
  //       contract,
  //       tokenContractAddress: tokenContract.address,
  //       liquidityTokenContract,
  //       wallet: otherWallet,
  //       stakedLiquidityTokenAmount: '3000000000000000000000',
  //       pairReserve0: '100000000000000000000000',
  //       totalSupply: '4000000000000000000000'
  //       })
  //   ).to.be.revertedWith(
  //     'VM Exception while processing transaction: revert Staking overflows rewards!'
  //   )
  //   expect(await contract.allocatedStakingRewards()).to.eq('50000000000000000000000')
  // })

  // it('fails when the reward token does not equal the first token in the liquidty pair used to calculate rewards', async () => {
  //   const {
  //     contract,
  //     ownerWallet,
  //     otherWallet,
  //     tokenContract,
  //     liquidityTokenContract
  //   } = await loadFixture(fixture)
  //   await init({
  //     contract, 
  //     wallet: ownerWallet,
  //     tokenContract,
  //     liquidityTokenContract,
  //     percentageYield: '100',
  //     rewardsAmount: '900000000000000000000000',
  //     rewardsBalance: '900000000000000000000000'
  //   })
  //   const stakedLiquidityTokenAmount = '2000000000000000000000'
  //   await expect(
  //     stake({
  //       contract,
  //       tokenContractAddress: ownerWallet.address,
  //       liquidityTokenContract,
  //       wallet: otherWallet,
  //       stakedLiquidityTokenAmount,
  //       pairReserve0: '100000000000000000000000',
  //       totalSupply: '4000000000000000000000'
  //     })
  //   ).to.be.revertedWith(
  //     'VM Exception while processing transaction: revert Rewards must be calculated based on the reward token reserve!'
  //   )
  //   expect(await contract.allocatedStakingRewards()).to.eq('0')
  // })

  // it('fails when trying to stake after staking has been closed', async () => {
  //   const {
  //     contract,
  //     ownerWallet,
  //     otherWallet,
  //     tokenContract,
  //     liquidityTokenContract
  //   } = await loadFixture(fixture)
  //   await init({
  //     contract,
  //     wallet: ownerWallet,
  //     liquidityTokenContract,
  //     tokenContract,
  //     rewardsAmount: '900000000000000000000000',
  //     rewardsBalance: '900000000000000000000000',
  //     closeTime: now()
  //   })
  //   const stakedLiquidityTokenAmount = '2157166313861058934633'
  //   await expect(
  //     stake({
  //       contract,
  //       tokenContractAddress: tokenContract.address,
  //       liquidityTokenContract,
  //       wallet: otherWallet,
  //       stakedLiquidityTokenAmount: '2157166313861058934634',
  //       pairReserve0: '99425305856642687813605',
  //       totalSupply: '4314332627722117869266'
  //     })
  //   ).to.be.revertedWith(
  //     'VM Exception while processing transaction: revert Staking has been closed!'
  //   )
  // })

  // it('allows contract owner to withdraw tokens which ended up in the contract accidentally', async () => {
  //   const {
  //     contract,
  //     ownerWallet,
  //     otherWallet,
  //     tokenContract,
  //     liquidityTokenContract
  //   } = await loadFixture(fixture)
  //   await init({
  //     contract, 
  //     wallet: ownerWallet,
  //     tokenContract,
  //     liquidityTokenContract,
  //     rewardsAmount: '900000000000000000000000',
  //     rewardsBalance: '900000000000000000000000'
  //   })
  //   const amount = '1000000000000000000'
  //   const anotherTokenContract = await deployContract(otherWallet, Token)
  //   await anotherTokenContract.transfer(contract.address, amount)
  //   await withdraw({
  //     contract,
  //     wallet: ownerWallet,
  //     token: anotherTokenContract.address,
  //     amount: amount
  //   })
  //   let balance = await anotherTokenContract.balanceOf(ownerWallet.address)
  //   expect(
  //     balance.toString()
  //   ).to.eq(amount)
  // })

  // it('does NOT allow to withdraw liquidity tokens, as they belong to the stakers', async () => {
  //   const {
  //     contract,
  //     ownerWallet,
  //     otherWallet,
  //     tokenContract,
  //     liquidityTokenContract
  //   } = await loadFixture(fixture)
  //   await init({
  //     contract, 
  //     wallet: ownerWallet,
  //     tokenContract,
  //     liquidityTokenContract,
  //     rewardsAmount: '900000000000000000000000',
  //     rewardsBalance: '900000000000000000000000'
  //   })
  //   const amount = '1000000000000000000'
  //   await expect(
  //     withdraw({
  //       contract,
  //       wallet: ownerWallet,
  //       token: liquidityTokenContract.address,
  //       amount: amount
  //     })
  //   ).to.be.revertedWith(
  //     'VM Exception while processing transaction: revert Not allowed to withdrawal liquidity tokens!'
  //   )
  // })

  // it('does allow to withdraw reward tokens if they have NOT been allocated to stakers yet', async () => {
  //   const {
  //     contract,
  //     ownerWallet,
  //     otherWallet,
  //     liquidityTokenContract
  //   } = await loadFixture(fixture)
  //   const tokenContract = await deployContract(otherWallet, Token)
  //   const amount = '1000000000000000000'
  //   await tokenContract.transfer(contract.address, amount)
  //   await init({
  //     contract, 
  //     wallet: ownerWallet,
  //     tokenContract,
  //     liquidityTokenContract,
  //     rewardsAmount: amount
  //   })
  //   await expect(() => 
  //     withdraw({
  //       contract,
  //       wallet: ownerWallet,
  //       token: tokenContract.address,
  //       amount: amount
  //     })
  //   ).to.changeTokenBalance(tokenContract, ownerWallet, amount)
  // })

  // it('does NOT allow to withdraw reward tokens if they have been allocated to stakers', async () => {
  //   const {
  //     contract,
  //     ownerWallet,
  //     otherWallet,
  //     liquidityTokenContract
  //   } = await loadFixture(fixture)
  //   const tokenContract = await deployContract(otherWallet, Token)
  //   const amount = '1000000000000000000'
  //   await tokenContract.transfer(contract.address, amount)
  //   await init({
  //     contract, 
  //     wallet: ownerWallet,
  //     tokenContract,
  //     liquidityTokenContract,
  //     rewardsAmount: amount
  //   })
  //   await stake({
  //     contract,
  //     tokenContractAddress: tokenContract.address,
  //     liquidityTokenContract,
  //     wallet: otherWallet,
  //     stakedLiquidityTokenAmount: '2157166313861058934633',
  //     pairReserve0: '994253058566426878',
  //     totalSupply: '4314332627722117869266'
  //   })
  //   await expect(
  //     withdraw({
  //       contract,
  //       wallet: ownerWallet,
  //       token: tokenContract.address,
  //       amount: amount
  //     })
  //   ).to.be.revertedWith(
  //     'VM Exception while processing transaction: revert Only unallocated staking rewards are allowed to be withdrawn for roll-over to next staking contract!'
  //   )
  // })

  // it('does NOT allow other wallets to withdraw anything', async () => {
  //   const {
  //     contract,
  //     ownerWallet,
  //     otherWallet,
  //     liquidityTokenContract
  //   } = await loadFixture(fixture)
  //   const tokenContract = await deployContract(otherWallet, Token)
  //   const amount = '1000000000000000000'
  //   await tokenContract.transfer(contract.address, amount)
  //   await init({
  //     contract, 
  //     wallet: ownerWallet,
  //     tokenContract,
  //     liquidityTokenContract,
  //     rewardsAmount: amount
  //   })
  //   await expect(
  //     withdraw({
  //       contract,
  //       wallet: otherWallet,
  //       token: tokenContract.address,
  //       amount: amount
  //     })
  //   ).to.be.revertedWith(
  //     'VM Exception while processing transaction: revert Ownable: caller is not the owner'
  //   )
  // })

  // it('does allow to unstake if rewards are releasable', async () => {
  //   const {
  //     contract,
  //     ownerWallet,
  //     otherWallet
  //   } = await loadFixture(fixture)
  //   let rewardsAmount = '900000000000000000000000'
  //   const stakedLiquidityTokenAmount = '2000000000000000000000'
  //   const tokenContract = await deployContract(ownerWallet, Token)
  //   await tokenContract.transfer(contract.address, rewardsAmount)
  //   const totalLiquidityTokenSupply = '4000000000000000000000';
  //   const pairReserve0 = '100000000000000000000000';
  //   const liquidityTokenContract = await deployContract(
  //     ownerWallet,
  //     UniswapV2Pair,
  //     [ // constructor
  //       totalLiquidityTokenSupply,
  //       tokenContract.address,
  //       pairReserve0,
  //       '100000000000000000000000' // pairReserve 1
  //     ]
  //   )
  //   await liquidityTokenContract.transfer(otherWallet.address, stakedLiquidityTokenAmount)
  //   await liquidityTokenContract.connect(otherWallet).approve(contract.address, stakedLiquidityTokenAmount)
  //   await init({
  //     contract, 
  //     wallet: ownerWallet,
  //     tokenContract,
  //     liquidityTokenContract,
  //     percentageYield: '100',
  //     closeTime: now()+300,
  //     releaseTime: now()+400
  //   })
  //   await stake({
  //     contract,
  //     tokenContractAddress: tokenContract.address,
  //     liquidityTokenContract,
  //     wallet: otherWallet,
  //     stakedLiquidityTokenAmount
  //   })
  //   expect(await contract.allocatedStakingRewards()).to.eq('50000000000000000000000')
  //   console.log('timestampFromChain before', (await contract.getTimestamp()).toString());
  //   // await provider.send("evm_increaseTime", [500]);
  //   // await provider.send("evm_mine", []);

  //   console.log('timestampFromChain after', (await contract.getTimestamp()).toString());
  //   expect(() => 
  //     expect(() => 
  //       unstake({
  //         contract,
  //         wallet: otherWallet 
  //       })
  //     ).to.changeTokenBalance(tokenContract, otherWallet, '50000000000000000000000')
  //   ).to.changeTokenBalance(liquidityTokenContract, otherWallet, stakedLiquidityTokenAmount)
  //   expect(await contract.allocatedStakingRewards()).to.eq('0')
  // })

  // it('does not allow to unstake if rewards are not relesable yet', async () => {
  //   const {
  //     contract,
  //     ownerWallet,
  //     otherWallet,
  //     tokenContract,
  //     liquidityTokenContract
  //   } = await loadFixture(fixture)
  //   await init({
  //     contract, 
  //     wallet: ownerWallet,
  //     tokenContract,
  //     liquidityTokenContract,
  //     percentageYield: '100',
  //     rewardsAmount: '900000000000000000000000',
  //     rewardsBalance: '900000000000000000000000',
  //     closeTime: now()+300,
  //     releaseTime: now()+400
  //   })
  //   const stakedLiquidityTokenAmount = '2000000000000000000000'
  //   await stake({
  //     contract,
  //     tokenContractAddress: tokenContract.address,
  //     liquidityTokenContract,
  //     wallet: otherWallet,
  //     stakedLiquidityTokenAmount,
  //     pairReserve0: '100000000000000000000000',
  //     totalSupply: '4000000000000000000000'
  //   })
  //   await expect(
  //     unstake({
  //       contract,
  //       wallet: otherWallet 
  //     })
  //   ).to.be.revertedWith(
  //     'VM Exception while processing transaction: revert Staking is not releasable yet!'
  //   )
  //   expect(await contract.allocatedStakingRewards()).to.eq('50000000000000000000000')
  // })

  // it('allows to unstake early to migrate to uniswap v3', async () => {
  //   // pending
  // })

  // it('does not allow to unstake early to migrate to uniswap v3 if not enabled by the owner', async () => {
  //   // pending
  // })

  // it('fails staking when depositing liquidity token fails', async () => {
  //   // pending
  // })

  // it('uses safemath to prevent overflows when initializing', async () => {
  //   // pending
  // })

  // it('uses safemath to prevent overflows when staking', async () => {
  //   // pending
  // })

  // it('uses safemath to prevent overflows when withdrawing', async () => {
  //   // pending
  // })

  // it('prevents reentrancy on staking', async () => {
  //   // pending
  // })

  // it('prevents reentrancy on unstaking', async () => {
  //   // pending
  // })

  // it('prevents reentrancy on withdrawal', async () => {
  //   // pending
  // })
})
