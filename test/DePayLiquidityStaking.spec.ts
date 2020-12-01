import chai, { expect } from 'chai'
import {
  Contract,
  ContractFactory,
  Wallet 
} from 'ethers'
import { 
  loadFixture,
  deployContract,
  solidity,
  MockProvider 
} from 'ethereum-waffle'
import { deployMockContract } from '@ethereum-waffle/mock-contract'
import IERC20 from '../build/IERC20.json'
import IUniswapV2Pair from '../build/IUniswapV2Pair.json'
import DePayLiquidityStaking from '../build/DePayLiquidityStaking.json'

chai.use(solidity)

describe('DePayLiquidityStaking', () => {
  
  const provider = new MockProvider()
  const [ownerWallet, otherWallet] = provider.getWallets()
  const now = Math.round(new Date().getTime() / 1000)
  
  const defaultStartTime = now // now in seconds
  const defaultEndTime = defaultStartTime + 2610000 // + 1 month
  const defaultReleaseTime = defaultStartTime + 31536000 // + 12 month
  const defaultYieldRewards = '100' // for 100%
  const defaultTotalStakingRewards = '900000000000000000000000' // 900,000 DEPAY
  
  async function fixture([ownerWallet, otherWallet]: Wallet[], provider: MockProvider) {
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
    stakingContractTokenBalance?: string,
    yieldRewards?: string,
    totalStakingRewards?: string,
    startTime?: number,
    endTime?: number,
    releaseTime?: number
  }

  async function init({
    contract,
    wallet,
    liquidityTokenContract,
    tokenContract,
    stakingContractTokenBalance='0',
    yieldRewards=defaultYieldRewards,
    totalStakingRewards=defaultTotalStakingRewards,
    startTime=defaultStartTime,
    endTime=defaultEndTime,
    releaseTime=defaultReleaseTime
  }: initParameters) {
    await tokenContract.mock.balanceOf.returns(stakingContractTokenBalance)
    await contract.connect(wallet).init(
      startTime,
      endTime,
      releaseTime,
      yieldRewards,
      totalStakingRewards,
      liquidityTokenContract.address,
      tokenContract.address
    )
  }

  interface stakeParameters {
    contract: Contract,
    liquidityTokenContract: Contract,
    wallet: Wallet,
    stakedLiquidityTokenAmount: string,
    pairReserve0: string,
    pairReserve1: string,
    totalSupply: string
  }

  async function stake({
    contract,
    liquidityTokenContract,
    wallet,
    stakedLiquidityTokenAmount,
    pairReserve0,
    pairReserve1,
    totalSupply
  }: stakeParameters) {
    await liquidityTokenContract.mock.transferFrom.returns(true)
    await liquidityTokenContract.mock.getReserves.returns(pairReserve0, pairReserve1, now)
    await liquidityTokenContract.mock.totalSupply.returns(totalSupply)
    await contract.connect(wallet).stake(stakedLiquidityTokenAmount)
  }

  it('deploys successfully', async () => {
    loadFixture(fixture)
  })

  it('sets deployer wallet as the contract owner', async () => {
    const {contract, ownerWallet} = await loadFixture(fixture)
    const owner = await contract.owner()
    expect(owner).to.equal(ownerWallet.address)
  })

  it('allows the owner to initialize the staking contract', async () => {
    const {contract, ownerWallet, liquidityTokenContract, tokenContract} = await loadFixture(fixture)
    await init({
      contract,
      wallet: ownerWallet,
      liquidityTokenContract,
      tokenContract,
      totalStakingRewards: defaultTotalStakingRewards
    })
    expect(await contract.startTime()).to.eq(defaultStartTime)
    expect(await contract.endTime()).to.eq(defaultEndTime)
    expect(await contract.releaseTime()).to.eq(defaultReleaseTime)
    expect(await contract.yield()).to.eq(defaultYieldRewards)
    expect(await contract.totalStakingRewards()).to.eq(defaultTotalStakingRewards)
    expect(await contract.liquidityToken()).to.eq(liquidityTokenContract.address)
    expect(await contract.token()).to.eq(tokenContract.address)
  })

  it('prohibits other wallets but the owner to initialize the staking contract', async () => {
    const {contract, ownerWallet, otherWallet, liquidityTokenContract, tokenContract} = await loadFixture(fixture)
    await expect(
      init({contract, otherWallet, liquidityTokenContract, tokenContract})
    ).to.be.revertedWith(
      'VM Exception while processing transaction: revert Ownable: caller is not the owner'
    )
  })

  it('it prohibits the owner to init staking if rewards have not been locked in yet', async () => {
    const {contract, ownerWallet, liquidityTokenContract, tokenContract} = await loadFixture(fixture)
    await expect(
      init({contract, ownerWallet, liquidityTokenContract, tokenContract})
    ).to.be.revertedWith(
      'Not enough tokens deposited for rewards!'
    )
  })

  it('prohibits to initialize the staking contract again, when its already started', async () => {
    const {contract, ownerWallet, liquidityTokenContract, tokenContract} = await loadFixture(fixture)
    await init({contract, ownerWallet, liquidityTokenContract, tokenContract, totalStakingRewards})
    await expect(
      initStaking(contract, ownerWallet, liquidityTokenContract, tokenContract, totalStakingRewards)
    ).to.be.revertedWith(
      'VM Exception while processing transaction: revert Staking has already started!'
    )
  })

  it('allows to stake liquidity when staking started', async () => {
    const {contract, ownerWallet, otherWallet, liquidityTokenContract, tokenContract} = await loadFixture(fixture)
    await init({contract, ownerWallet, liquidityTokenContract, tokenContract, totalStakingRewards})
    const stakedLiquidityTokenAmount = '2157166313861058934633'
    await stake({
      contract,
      liquidityTokenContract,
      wallet: otherWallet,
      stakedLiquidityTokenAmount,
      pairReserve0: '99425305856642687813605',
      pairReserve1: '206306594448178253923',
      totalSupply: '4314332627722117869266'
    })
    expect(await contract.rewardsPerAddress(otherWallet.address)).to.eq('450000000000000000000000')
    expect(await contract.stakedLiquidityTokenPerAddress(otherWallet.address)).to.eq(stakedLiquidityTokenAmount)
    expect(await contract.allocatedStakingRewards()).to.eq('450000000000000000000000')
  })

  it('allows to pay less rewards when setup with lower APY', async () => {
    const {contract, ownerWallet, otherWallet, liquidityTokenContract, tokenContract} = await loadFixture(fixture)
    await init({contract, ownerWallet, liquidityTokenContract, tokenContract})
    
  })

  it('prohibits to stake liquidity when staking did not start yet', async () => {
    const {contract, ownerWallet, otherWallet, liquidityTokenContract, tokenContract} = await loadFixture(fixture)
    await init({contract, ownerWallet, liquidityTokenContract, tokenContract})
    await expect(contract.connect(otherWallet).stake('2157166313861058934633')).to.be.revertedWith(
      'VM Exception while processing transaction: revert Staking has not yet started!'
    )
  })

  it('fails when trying to stake more than rewards left', async () => {
    const {contract, ownerWallet, otherWallet, liquidityTokenContract, tokenContract} = await loadFixture(fixture)
    await init({contract, ownerWallet, liquidityTokenContract, tokenContract})
    const stakedLiquidityTokenAmount = '2157166313861058934633'
    await liquidityTokenContract.mock.transferFrom.returns(true)
    await liquidityTokenContract.mock.getReserves.returns('99425305856642687813605', '206306594448178253923', now)
    await liquidityTokenContract.mock.totalSupply.returns('4314332627722117869266')
    await contract.connect(otherWallet).stake(stakedLiquidityTokenAmount)
    expect(await contract.rewardsPerAddress(otherWallet.address)).to.eq('450000000000000000000000')
    expect(await contract.stakedLiquidityTokenPerAddress(otherWallet.address)).to.eq(stakedLiquidityTokenAmount)
    expect(await contract.allocatedStakingRewards()).to.eq('450000000000000000000000')
    await expect(
      contract.connect(otherWallet).stake('450000000000000000000001')
    ).to.be.revertedWith(
      'VM Exception while processing transaction: revert Staking overflows rewards!'
    )
    expect(await contract.allocatedStakingRewards()).to.eq('450000000000000000000000')
  })

  it('uses safemath to prevent overflows when initializing', async () => {
    // pending
  })

  it('uses safemath to prevent overflows when staking', async () => {
    // pending
  })

  it('prevents reentrancy on staking', async () => {
    // pending
  })

  it('prevents reentrancy on unstaking', async () => {
    // pending
  })
})
