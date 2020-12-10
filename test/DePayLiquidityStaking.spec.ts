import chai, { expect } from 'chai'
import {
  Contract,
  providers,
  Wallet 
} from 'ethers'
import { 
  solidity,
} from 'ethereum-waffle'
import IERC20 from '../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json'
import Token from '../artifacts/contracts/token.sol/Token.json'
import TokenSafeTransfer from '../artifacts/contracts/token_safe_transfer.sol/TokenSafeTransfer.json'
import UniswapV2Pair from '../artifacts/contracts/uniswap_v2_pair.sol/UniswapV2Pair.json'
import IUniswapV2Pair from '../artifacts/contracts/interfaces/IUniswapV2Pair.sol/IUniswapV2Pair.json'
import DePayLiquidityStaking from '../artifacts/contracts/DePayLiquidityStaking.sol/DePayLiquidityStaking.json'

const { waffle, ethers } = require("hardhat")
const {
  provider,
  deployContract,
  deployMockContract,
  loadFixture,
} = waffle

chai.use(solidity)

describe('DePayLiquidityStaking', () => {
  
  const [ownerWallet, otherWallet] = provider.getWallets()
  let now = () => Math.round(new Date().getTime() / 1000)
  
  async function fixture() {
    const contract = await deployContract(ownerWallet, DePayLiquidityStaking)
    const tokenContract = await deployMockContract(ownerWallet, IERC20.abi)
    const liquidityTokenContract = await deployMockContract(ownerWallet, IUniswapV2Pair.abi)
    return {
      contract,
      ownerWallet,
      otherWallet,
      tokenContract,
      liquidityTokenContract
    }
  }

  interface initParameters {
    contract: Contract,
    wallet: Wallet,
    liquidityTokenContract: Contract,
    tokenContract: Contract,
    rewardsBalance?: string,
    percentageYield?: string,
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
      liquidityTokenContract.address,
      tokenContract.address
    )
    return {
      startTime,
      closeTime,
      releaseTime,
      percentageYield
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

  interface deployLiquidityTokenParameters {
    contract: Contract,
    stakedLiquidityTokenAmount: string,
    totalLiquidityTokenSupply: string,
    tokenContract: Contract,
    pairReserve0: string,
    pairReserve1?: string,
  }

  async function deployLiquidityToken({
    contract,
    stakedLiquidityTokenAmount,
    totalLiquidityTokenSupply,
    tokenContract,
    pairReserve0,
    pairReserve1='100000000000000000000000'
  }: deployLiquidityTokenParameters){
    const liquidityTokenContract = await deployContract(
      ownerWallet,
      UniswapV2Pair,
      [ // constructor
        totalLiquidityTokenSupply,
        tokenContract.address,
        pairReserve0,
        pairReserve1
      ]
    )
    await liquidityTokenContract.transfer(otherWallet.address, stakedLiquidityTokenAmount)
    await liquidityTokenContract.connect(otherWallet).approve(contract.address, stakedLiquidityTokenAmount)
    return liquidityTokenContract
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

  interface enableUnstakeEarlyParameters {
    contract: Contract,
    wallet: Wallet
  }

  async function enableUnstakeEarly({
    contract,
    wallet,
  }: unstakeParameters) {
    await contract.connect(wallet).enableUnstakeEarly()
  }

  interface unstakeEarlyParameters {
    contract: Contract,
    wallet: Wallet
  }

  async function unstakeEarly({
    contract,
    wallet,
  }: unstakeParameters) {
    await contract.connect(wallet).unstakeEarly()
  }

  it('deploys contract successfully', async () => {
    await loadFixture(fixture)
  })

  it('sets deployer wallet as the contract owner', async () => {
    const {contract, ownerWallet} = await loadFixture(fixture)
    const owner = await contract.owner()
    expect(owner).to.equal(ownerWallet.address)
  })

  it('allows the owner to initialize the staking contract', async () => {
    const {
      contract,
      ownerWallet,
      liquidityTokenContract,
      tokenContract
    } = await loadFixture(fixture)
    let rewardsAmount = '900000000000000000000000'
    const {
      startTime,
      closeTime,
      releaseTime,
      percentageYield,
    } = await init({
      contract,
      wallet: ownerWallet,
      liquidityTokenContract,
      tokenContract,
      rewardsBalance: rewardsAmount
    })
    expect(await contract.startTime()).to.eq(startTime)
    expect(await contract.closeTime()).to.eq(closeTime)
    expect(await contract.releaseTime()).to.eq(releaseTime)
    expect(await contract.percentageYield()).to.eq(percentageYield)
    expect(await contract.rewardsAmount()).to.eq(rewardsAmount)
    expect(await contract.liquidityToken()).to.eq(liquidityTokenContract.address)
    expect(await contract.token()).to.eq(tokenContract.address)
  })

  it('prohibits other wallets but the owner to initialize the staking contract', async () => {
    const {
      contract,
      otherWallet,
      tokenContract,
      liquidityTokenContract
    } = await loadFixture(fixture)
    await expect(
      init({
        contract,
        wallet: otherWallet,
        tokenContract,
        liquidityTokenContract
      })
    ).to.be.revertedWith(
      'VM Exception while processing transaction: revert Ownable: caller is not the owner'
    )
  })

  it('prohibits to initialize the staking contract again, when its already started', async () => {
    const {
      contract,
      ownerWallet,
      tokenContract,
      liquidityTokenContract
    } = await loadFixture(fixture)
    async function _init() {
      await init({
        contract, 
        wallet: ownerWallet,
        tokenContract,
        liquidityTokenContract,
        rewardsBalance: '900000000000000000000000'
      })
    }
    await _init() // first time
    await expect(
      _init() // second time
    ).to.be.revertedWith(
      'VM Exception while processing transaction: revert Staking has already started!'
    )
  })

  it('allows to stake liquidity when staking started', async () => {
    const {
      contract,
      ownerWallet,
      otherWallet,
      tokenContract,
      liquidityTokenContract
    } = await loadFixture(fixture)
    await init({
      contract, 
      wallet: ownerWallet,
      tokenContract,
      liquidityTokenContract,
      percentageYield: '100',
      rewardsBalance: '900000000000000000000000'
    })
    const stakedLiquidityTokenAmount = '2000000000000000000000'
    await stake({
      contract,
      tokenContractAddress: tokenContract.address,
      liquidityTokenContract,
      wallet: otherWallet,
      stakedLiquidityTokenAmount,
      pairReserve0: '100000000000000000000000',
      totalSupply: '4000000000000000000000'
    })
    expect(await contract.rewardsPerAddress(otherWallet.address)).to.eq('50000000000000000000000')
    expect(await contract.stakedLiquidityTokenPerAddress(otherWallet.address)).to.eq(stakedLiquidityTokenAmount)
    expect(await contract.allocatedStakingRewards()).to.eq('50000000000000000000000')
  })

  it('pays less rewards when setup with lower yield reward', async () => {
    const {
      contract,
      ownerWallet,
      otherWallet,
      liquidityTokenContract,
      tokenContract
    } = await loadFixture(fixture)
    await init({
      contract,
      wallet: ownerWallet,
      tokenContract,
      liquidityTokenContract,
      percentageYield: '80',
      rewardsBalance: '900000000000000000000000'
    })
    const stakedLiquidityTokenAmount = '2000000000000000000000'
    await stake({
      contract,
      tokenContractAddress: tokenContract.address,
      liquidityTokenContract,
      wallet: otherWallet,
      stakedLiquidityTokenAmount,
      pairReserve0: '100000000000000000000000',
      totalSupply: '4000000000000000000000'
    })
    expect(await contract.rewardsPerAddress(otherWallet.address)).to.eq('40000000000000000000000')
    expect(await contract.stakedLiquidityTokenPerAddress(otherWallet.address)).to.eq(stakedLiquidityTokenAmount)
    expect(await contract.allocatedStakingRewards()).to.eq('40000000000000000000000')
  })

  it('prohibits to stake liquidity when staking did not start yet', async () => {
    const {
      contract,
      ownerWallet,
      otherWallet,
      liquidityTokenContract,
      tokenContract
    } = await loadFixture(fixture)
    await init({
      contract,
      wallet: ownerWallet,
      tokenContract,
      liquidityTokenContract,
      rewardsBalance: '900000000000000000000000',
      startTime: now() + 86400
    })
    await expect(contract.connect(otherWallet).stake('2157166313861058934633')).to.be.revertedWith(
      'VM Exception while processing transaction: revert Staking has not yet started!'
    )
  })

  it('fails when trying to stake more than rewards left', async () => {
    const {
      contract,
      ownerWallet,
      otherWallet,
      liquidityTokenContract,
      tokenContract
    } = await loadFixture(fixture)
    await init({
      contract, 
      wallet: ownerWallet,
      tokenContract,
      liquidityTokenContract,
      percentageYield: '100',
      rewardsBalance: '100000000000000000000000'
    })
    const stakedLiquidityTokenAmount = '2000000000000000000000'
    await stake({
      contract,
      tokenContractAddress: tokenContract.address,
      liquidityTokenContract,
      wallet: otherWallet,
      stakedLiquidityTokenAmount,
      pairReserve0: '100000000000000000000000',
      totalSupply: '4000000000000000000000'
    })
    await expect(
      stake({
        contract,
        tokenContractAddress: tokenContract.address,
        liquidityTokenContract,
        wallet: otherWallet,
        stakedLiquidityTokenAmount: '3000000000000000000000',
        pairReserve0: '100000000000000000000000',
        totalSupply: '4000000000000000000000'
        })
    ).to.be.revertedWith(
      'VM Exception while processing transaction: revert Staking overflows rewards!'
    )
    expect(await contract.allocatedStakingRewards()).to.eq('50000000000000000000000')
  })

  it('fails when the reward token does not equal the first token in the liquidty pair used to calculate rewards', async () => {
    const {
      contract,
      ownerWallet,
      otherWallet,
      tokenContract,
      liquidityTokenContract
    } = await loadFixture(fixture)
    await init({
      contract, 
      wallet: ownerWallet,
      tokenContract,
      liquidityTokenContract,
      percentageYield: '100',
      rewardsBalance: '900000000000000000000000'
    })
    const stakedLiquidityTokenAmount = '2000000000000000000000'
    await expect(
      stake({
        contract,
        tokenContractAddress: ownerWallet.address,
        liquidityTokenContract,
        wallet: otherWallet,
        stakedLiquidityTokenAmount,
        pairReserve0: '100000000000000000000000',
        totalSupply: '4000000000000000000000'
      })
    ).to.be.revertedWith(
      'VM Exception while processing transaction: revert Rewards must be calculated based on the reward token reserve!'
    )
    expect(await contract.allocatedStakingRewards()).to.eq('0')
  })

  it('fails when trying to stake after staking has been closed', async () => {
    const {
      contract,
      ownerWallet,
      otherWallet,
      tokenContract,
      liquidityTokenContract
    } = await loadFixture(fixture)
    await init({
      contract,
      wallet: ownerWallet,
      liquidityTokenContract,
      tokenContract,
      rewardsBalance: '900000000000000000000000',
      closeTime: now()
    })
    const stakedLiquidityTokenAmount = '2157166313861058934633'
    await expect(
      stake({
        contract,
        tokenContractAddress: tokenContract.address,
        liquidityTokenContract,
        wallet: otherWallet,
        stakedLiquidityTokenAmount: '2157166313861058934634',
        pairReserve0: '99425305856642687813605',
        totalSupply: '4314332627722117869266'
      })
    ).to.be.revertedWith(
      'VM Exception while processing transaction: revert Staking has been closed!'
    )
  })

  it('allows contract owner to withdraw tokens which ended up in the contract accidentally', async () => {
    const {
      contract,
      ownerWallet,
      otherWallet,
      tokenContract,
      liquidityTokenContract
    } = await loadFixture(fixture)
    await init({
      contract, 
      wallet: ownerWallet,
      tokenContract,
      liquidityTokenContract,
      rewardsBalance: '900000000000000000000000'
    })
    const amount = '1000000000000000000'
    const anotherTokenContract = await deployContract(otherWallet, Token)
    await anotherTokenContract.transfer(contract.address, amount)
    await withdraw({
      contract,
      wallet: ownerWallet,
      token: anotherTokenContract.address,
      amount: amount
    })
    let balance = await anotherTokenContract.balanceOf(ownerWallet.address)
    expect(
      balance.toString()
    ).to.eq(amount)
  })

  it('does NOT allow to withdraw liquidity tokens, as they belong to the stakers', async () => {
    const {
      contract,
      ownerWallet,
      otherWallet,
      tokenContract,
      liquidityTokenContract
    } = await loadFixture(fixture)
    await init({
      contract, 
      wallet: ownerWallet,
      tokenContract,
      liquidityTokenContract,
      rewardsBalance: '900000000000000000000000'
    })
    const amount = '1000000000000000000'
    await expect(
      withdraw({
        contract,
        wallet: ownerWallet,
        token: liquidityTokenContract.address,
        amount: amount
      })
    ).to.be.revertedWith(
      'VM Exception while processing transaction: revert Not allowed to withdrawal liquidity tokens!'
    )
  })

  it('does allow to withdraw reward tokens if they have NOT been allocated to stakers yet', async () => {
    const {
      contract,
      ownerWallet,
      otherWallet,
      liquidityTokenContract
    } = await loadFixture(fixture)
    const tokenContract = await deployContract(otherWallet, Token)
    const amount = '1000000000000000000'
    await tokenContract.transfer(contract.address, amount)
    await init({
      contract, 
      wallet: ownerWallet,
      tokenContract,
      liquidityTokenContract,
      rewardsBalance: amount
    })
    await expect(() => 
      withdraw({
        contract,
        wallet: ownerWallet,
        token: tokenContract.address,
        amount: amount
      })
    ).to.changeTokenBalance(tokenContract, ownerWallet, amount)
    expect(await contract.rewardsAmount()).to.eq('0')
  })

  it('uses safeTransfer when withdrawing tokens and does NOT decrease allocatedStakingRewards if withdrawing reward tokens fails', async () => {
    const {
      contract,
      ownerWallet,
      otherWallet,
      liquidityTokenContract
    } = await loadFixture(fixture)
    const tokenContract = await deployContract(otherWallet, TokenSafeTransfer)
    const amount = '1000000000000000000'
    await tokenContract.transfer(contract.address, amount)
    await init({
      contract, 
      wallet: ownerWallet,
      tokenContract,
      liquidityTokenContract
    })
    await expect(
      withdraw({
        contract,
        wallet: ownerWallet,
        token: tokenContract.address,
        amount: amount
      })
    ).to.be.revertedWith(
      'VM Exception while processing transaction: revert Token transfer failed!'
    )
    expect(await contract.rewardsAmount()).to.eq(amount)
  })

  it('does NOT allow to withdraw reward tokens if they have been allocated to stakers', async () => {
    const {
      contract,
      ownerWallet,
      otherWallet,
      liquidityTokenContract
    } = await loadFixture(fixture)
    const tokenContract = await deployContract(otherWallet, Token)
    const amount = '1000000000000000000'
    await tokenContract.transfer(contract.address, amount)
    await init({
      contract, 
      wallet: ownerWallet,
      tokenContract,
      liquidityTokenContract,
      rewardsBalance: amount
    })
    await stake({
      contract,
      tokenContractAddress: tokenContract.address,
      liquidityTokenContract,
      wallet: otherWallet,
      stakedLiquidityTokenAmount: '2157166313861058934633',
      pairReserve0: '994253058566426878',
      totalSupply: '4314332627722117869266'
    })
    await expect(
      withdraw({
        contract,
        wallet: ownerWallet,
        token: tokenContract.address,
        amount: amount
      })
    ).to.be.revertedWith(
      'VM Exception while processing transaction: revert Only unallocated staking rewards are allowed to be withdrawn for roll-over to next staking contract!'
    )
  })

  it('does NOT allow other wallets to withdraw anything', async () => {
    const {
      contract,
      ownerWallet,
      otherWallet,
      liquidityTokenContract
    } = await loadFixture(fixture)
    const tokenContract = await deployContract(otherWallet, Token)
    const amount = '1000000000000000000'
    await tokenContract.transfer(contract.address, amount)
    await init({
      contract, 
      wallet: ownerWallet,
      tokenContract,
      liquidityTokenContract,
      rewardsBalance: amount
    })
    await expect(
      withdraw({
        contract,
        wallet: otherWallet,
        token: tokenContract.address,
        amount: amount
      })
    ).to.be.revertedWith(
      'VM Exception while processing transaction: revert Ownable: caller is not the owner'
    )
  })

  it('does allow to unstake if rewards are releasable', async () => {
    const {
      contract,
      ownerWallet,
      otherWallet
    } = await loadFixture(fixture)
    let rewardsAmount = '900000000000000000000000'
    const stakedLiquidityTokenAmount = '2000000000000000000000'
    const tokenContract = await deployContract(ownerWallet, Token)
    await tokenContract.transfer(contract.address, rewardsAmount)
    const totalLiquidityTokenSupply = '4000000000000000000000'
    const pairReserve0 = '100000000000000000000000'
    const liquidityTokenContract = await deployLiquidityToken({
      contract,
      stakedLiquidityTokenAmount,
      totalLiquidityTokenSupply,
      tokenContract,
      pairReserve0
    })
    await init({
      contract, 
      wallet: ownerWallet,
      tokenContract,
      liquidityTokenContract,
      percentageYield: '100',
      closeTime: now()+300,
      releaseTime: now()+400
    })
    await expect(() => 
      stake({
        contract,
        tokenContractAddress: tokenContract.address,
        liquidityTokenContract,
        wallet: otherWallet,
        stakedLiquidityTokenAmount
      })
    ).to.changeTokenBalance(liquidityTokenContract, otherWallet, '-2000000000000000000000')
    expect((await contract.allocatedStakingRewards()).toString()).to.eq('50000000000000000000000')
    await provider.send("evm_increaseTime", [500])
    await expect(() => 
      expect(() => 
        unstake({
          contract,
          wallet: otherWallet 
        })
      ).to.changeTokenBalance(tokenContract, otherWallet, '50000000000000000000000')
    ).to.changeTokenBalance(liquidityTokenContract, otherWallet, '2000000000000000000000')
    expect((await contract.allocatedStakingRewards()).toString()).to.eq('0')
  })

  it('does not allow to unstake if rewards are not relesable yet', async () => {
    const {
      contract,
      ownerWallet,
      otherWallet,
      tokenContract,
      liquidityTokenContract
    } = await loadFixture(fixture)
    await init({
      contract, 
      wallet: ownerWallet,
      tokenContract,
      liquidityTokenContract,
      percentageYield: '100',
      rewardsBalance: '900000000000000000000000',
      closeTime: now()+300,
      releaseTime: now()+400
    })
    await stake({
      contract,
      tokenContractAddress: tokenContract.address,
      liquidityTokenContract,
      wallet: otherWallet,
      stakedLiquidityTokenAmount: '2000000000000000000000',
      pairReserve0: '100000000000000000000000',
      totalSupply: '4000000000000000000000'
    })
    await expect(
      unstake({
        contract,
        wallet: otherWallet 
      })
    ).to.be.revertedWith(
      'VM Exception while processing transaction: revert Staking is not releasable yet!'
    )
    expect(await contract.allocatedStakingRewards()).to.eq('50000000000000000000000')
  })

  it('allows the contract owner to enableUnstakeEarly', async () => {
    const {
      contract,
      ownerWallet,
      otherWallet
    } = await loadFixture(fixture)
    await enableUnstakeEarly({
      contract,
      wallet: ownerWallet
    })
    expect(await contract.unstakeEarlyAllowed()).to.eq(true)
  })

  it('does not allow others to enableUnstakeEarly', async () => {
    const {
      contract,
      ownerWallet,
      otherWallet
    } = await loadFixture(fixture)
    await expect(
      enableUnstakeEarly({
        contract,
        wallet: otherWallet
      })
    ).to.be.revertedWith(
      'VM Exception while processing transaction: revert Ownable: caller is not the owner'
    )
    expect(await contract.unstakeEarlyAllowed()).to.eq(false)
  })

  it('allows to unstake early to migrate to uniswap v3', async () => {
    const {
      contract,
      ownerWallet,
      otherWallet
    } = await loadFixture(fixture)
    let rewardsAmount = '900000000000000000000000'
    const stakedLiquidityTokenAmount = '2000000000000000000000'
    const tokenContract = await deployContract(ownerWallet, Token)
    await tokenContract.transfer(contract.address, rewardsAmount)
    const totalLiquidityTokenSupply = '4000000000000000000000'
    const pairReserve0 = '100000000000000000000000'
    const liquidityTokenContract = await deployLiquidityToken({
      contract,
      stakedLiquidityTokenAmount,
      totalLiquidityTokenSupply,
      tokenContract,
      pairReserve0
    })
    await init({
      contract, 
      wallet: ownerWallet,
      tokenContract,
      liquidityTokenContract,
      percentageYield: '100',
      closeTime: now()+300,
      releaseTime: now()+400
    })
    await expect(() => 
      stake({
        contract,
        tokenContractAddress: tokenContract.address,
        liquidityTokenContract,
        wallet: otherWallet,
        stakedLiquidityTokenAmount
      })
    ).to.changeTokenBalance(liquidityTokenContract, otherWallet, '-2000000000000000000000')
    expect((await contract.allocatedStakingRewards()).toString()).to.eq('50000000000000000000000')
    await enableUnstakeEarly({
      contract,
      wallet: ownerWallet
    })
    await expect(() => 
      expect(() => 
        unstakeEarly({
          contract,
          wallet: otherWallet 
        })
      ).to.changeTokenBalance(tokenContract, otherWallet, '0') // no rewards for unstaking early
    ).to.changeTokenBalance(liquidityTokenContract, otherWallet, '2000000000000000000000')
    expect((await contract.allocatedStakingRewards()).toString()).to.eq('0')
    expect((await contract.rewardsPerAddress(otherWallet.address)).toString()).to.eq('0')
  })

  it('does not allow to unstake early to migrate to uniswap v3 if not enabled by the owner', async () => {
    const {
      contract,
      ownerWallet,
      otherWallet
    } = await loadFixture(fixture)
    let rewardsAmount = '900000000000000000000000'
    const stakedLiquidityTokenAmount = '2000000000000000000000'
    const tokenContract = await deployContract(ownerWallet, Token)
    await tokenContract.transfer(contract.address, rewardsAmount)
    const totalLiquidityTokenSupply = '4000000000000000000000'
    const pairReserve0 = '100000000000000000000000'
    const liquidityTokenContract = await deployLiquidityToken({
      contract,
      stakedLiquidityTokenAmount,
      totalLiquidityTokenSupply,
      tokenContract,
      pairReserve0
    })
    await init({
      contract, 
      wallet: ownerWallet,
      tokenContract,
      liquidityTokenContract,
      percentageYield: '100',
      closeTime: now()+300,
      releaseTime: now()+400
    })
    await expect(() => 
      stake({
        contract,
        tokenContractAddress: tokenContract.address,
        liquidityTokenContract,
        wallet: otherWallet,
        stakedLiquidityTokenAmount
      })
    ).to.changeTokenBalance(liquidityTokenContract, otherWallet, '-2000000000000000000000')
    expect((await contract.allocatedStakingRewards()).toString()).to.eq('50000000000000000000000')
    await expect(
      unstakeEarly({
        contract,
        wallet: otherWallet 
      })
    ).to.be.revertedWith(
      'VM Exception while processing transaction: revert Unstaking early not allowed!'
    )
    expect((await contract.allocatedStakingRewards()).toString()).to.eq('50000000000000000000000')
  })
})
