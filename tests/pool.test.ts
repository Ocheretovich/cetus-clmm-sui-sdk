import 'isomorphic-fetch'
import BN from 'bn.js'
import { TestnetCoin, buildTestAccount } from './data/init_test_data'
import { TickMath } from '../src/math/tick'
import { d } from '../src/utils/numbers'
import { ClmmPoolUtil } from '../src/math/clmm'
import { printTransaction } from '../src/utils/transaction-util'
import { asIntN, asUintN, initCetusSDK, isSortedSymbols, TransactionUtil } from '../src'
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import { fromB64 } from '@mysten/bcs'

import dotenv from 'dotenv'
dotenv.config()

describe('Pool Module', () => {
  const secret = process.env.SUI_WALLET_SECRET || ''
  const mnemonic = process.env.SUI_WALLET_MNEMONICS || ''
  let keypair: Ed25519Keypair

  if (secret && secret.length > 0) {
    keypair = Ed25519Keypair.fromSecretKey(fromB64(secret).slice(1, 33))
  } else {
    keypair = Ed25519Keypair.deriveKeypair(mnemonic)
  }

  const wallet = keypair.getPublicKey().toSuiAddress()
  const sdk = initCetusSDK({ network: 'mainnet', wallet })
  console.log('sdk.senderAddress', sdk.senderAddress)

  test('getAllPools', async () => {
    const pools = await sdk.Pool.getPoolsWithPage([])
    console.log(pools.length)
  })

  test('getPoolImmutables', async () => {
    const poolImmutables = await sdk.Pool.getPoolImmutables()
    console.log('getPoolImmutables', poolImmutables)
  })

  test('getPoolTransactionList', async () => {
    const res = await sdk.Pool.getPoolTransactionList({
      poolId: '0xb8d7d9e66a60c239e7a60110efcf8de6c705580ed924d0dde141f4a0e2c90105',
      paginationArgs: {
        limit: 10,
      },
    })
    console.log('res', res)
  })

  test('getAllPool', async () => {
    const allPool = await sdk.Pool.getPools([])
    console.log('getAllPool', allPool, '###length###', allPool.length)
  })

  test('getSiginlePool', async () => {
    const pool = await sdk.Pool.getPool('0xcf994611fd4c48e277ce3ffd4d4364c914af2c3cbb05f7bf6facd371de688630')
    console.log('pool', pool)
  })

  test('doCreatPools', async () => {
    sdk.senderAddress = buildTestAccount().getPublicKey().toSuiAddress()
    const tick_spacing = 2
    const initialize_price = 1
    const coin_a_decimals = 6
    const coin_b_decimals = 6
    const coin_type_a = `${sdk.sdkOptions.faucet?.package_id}::usdt::USDT`
    const coin_type_b = `{sdk.sdkOptions.faucet?.package_id}::usdc::USDC`

    const creatPoolTransactionPayload = await sdk.Pool.creatPoolsTransactionPayload([
      {
        tick_spacing: tick_spacing,
        initialize_sqrt_price: TickMath.priceToSqrtPriceX64(d(initialize_price), coin_a_decimals, coin_b_decimals).toString(),
        uri: '',
        coinTypeA: coin_type_a,
        coinTypeB: coin_type_b,
      },
    ])

    printTransaction(creatPoolTransactionPayload)
    const transferTxn = await sdk.fullClient.sendTransaction(buildTestAccount(), creatPoolTransactionPayload)
    console.log('doCreatPool: ', transferTxn)
  })

  // test('create_and_add_liquidity_fix_token', async () => {
  //   sdk.senderAddress = buildTestAccount().getPublicKey().toSuiAddress()
  //   const initialize_sqrt_price = TickMath.priceToSqrtPriceX64(d(0.3), 6, 6).toString()
  //   const tick_spacing = 2
  //   const current_tick_index = TickMath.sqrtPriceX64ToTickIndex(new BN(initialize_sqrt_price))

  //   const lowerTick = TickMath.getPrevInitializableTickIndex(new BN(current_tick_index).toNumber(), new BN(tick_spacing).toNumber())
  //   const upperTick = TickMath.getNextInitializableTickIndex(new BN(current_tick_index).toNumber(), new BN(tick_spacing).toNumber())
  //   const coin_type_a = `${sdk.sdkOptions.faucet?.package_id}::usdt::USDT`
  //   const coin_type_b = `{sdk.sdkOptions.faucet?.package_id}::usdc::USDC`

  //   const fix_coin_amount = new BN(200)
  //   const fix_amount_a = true
  //   const slippage = 0.05

  //   const liquidityInput = ClmmPoolUtil.estLiquidityAndcoinAmountFromOneAmounts(
  //     lowerTick,
  //     upperTick,
  //     fix_coin_amount,
  //     fix_amount_a,
  //     true,
  //     slippage,
  //     new BN(initialize_sqrt_price)
  //   )

  //   const amount_a = fix_amount_a ? fix_coin_amount.toNumber() : liquidityInput.tokenMaxA.toNumber()
  //   const amount_b = fix_amount_a ? liquidityInput.tokenMaxB.toNumber() : fix_coin_amount.toNumber()

  //   console.log('amount: ', { amount_a, amount_b })

  //   const creatPoolTransactionPayload = await sdk.Pool.creatPoolTransactionPayload({
  //     tick_spacing: tick_spacing,
  //     initialize_sqrt_price: initialize_sqrt_price,
  //     uri: '',
  //     coinTypeA: coin_type_a,
  //     coinTypeB: coin_type_b,
  //     amount_a: amount_a,
  //     amount_b: amount_b,
  //     slippage,
  //     fix_amount_a: fix_amount_a,
  //     tick_lower: lowerTick,
  //     tick_upper: upperTick,
  //   })

  //   const transferTxn = await sdk.fullClient.sendTransaction(buildTestAccount(), creatPoolTransactionPayload)
  //   console.log('doCreatPool: ', transferTxn)
  // })

  test('get partner ref fee', async () => {
    const refFee = await sdk.Pool.getPartnerRefFeeAmount('0x0c1e5401e40129da6a65a973b12a034e6c78b7b0b27c3a07213bc5ce3fa3d881')
    console.log('ref fee:', refFee)
  })

  test('claim partner ref fee', async () => {
    const partnerCap = 'xxx'
    const partner = 'xxx'
    const claimRefFeePayload = await sdk.Pool.claimPartnerRefFeePayload(partnerCap, partner, TestnetCoin.SUI)
    const transferTxn = await sdk.fullClient.sendTransaction(buildTestAccount(), claimRefFeePayload)
    console.log('doCreatPool: ', JSON.stringify(transferTxn))
  })

  test('get pool by coin types', async () => {
    const coinA = '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN'
    const coinB = '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN'

    const pools = await sdk.Pool.getPoolByCoins([coinA, coinB])
    expect(pools.length).toBeGreaterThan(0)

    const coinC = '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN'
    const coinD = '0x2::sui::SUI'

    const pools2 = await sdk.Pool.getPoolByCoins([coinC, coinD])
    expect(pools2.length).toBeGreaterThan(0)

    const coinE = '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI'

    const pools3 = await sdk.Pool.getPoolByCoins([coinC, coinE])
    expect(pools3.length).toEqual(pools2.length)

    const coinCetus = '0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS'
    const coinBlub = '0xfa7ac3951fdca92c5200d468d31a365eb03b2be9936fde615e69f0c1274ad3a0::BLUB::BLUB'

    const pools4 = await sdk.Pool.getPoolByCoins([coinCetus, coinBlub])
    console.log('pools4', pools4)
    expect(pools4.length).toEqual(pools2.length)
  })

  test('ClmmPoolUtil.estLiquidityAndcoinAmountFromOneAmounts: ', () => {
    const lowerTick = -74078
    const upperTick = -58716
    const currentSqrtPrice = '979448777168348479'
    const coinAmountA = new BN(100000000)
    const { coinAmountB } = ClmmPoolUtil.estLiquidityAndcoinAmountFromOneAmounts(
      lowerTick,
      upperTick,
      coinAmountA,
      true,
      true,
      0,
      new BN(currentSqrtPrice)
    )
  })

  test('isSortedSymbols', () => {
    const p = isSortedSymbols(
      '0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55::cert::CERT',
      '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC'
    )
    console.log('🚀🚀🚀 ~ file: pool.test.ts:145 ~ test ~ p:', p)
  })

  test('creatPoolTransactionPayload', async () => {
    const payload = await sdk.Pool.createPoolTransactionPayload({
      tick_spacing: 220,
      initialize_sqrt_price: '18446744073709551616',
      uri: '',
      fix_amount_a: true,
      amount_a: '100000000',
      amount_b: '100000000',
      coinTypeA: '0xbde4ba4c2e274a60ce15c1cfff9e5c42e41654ac8b6d906a57efa4bd3c29f47d::hasui::HASUI',
      coinTypeB: '0x2::sui::SUI',
      slippage: 0.05,
      metadata_a: '0x2c5f33af93f6511df699aaaa5822d823aac6ed99d4a0de2a4a50b3afa0172e24',
      metadata_b: '0x9258181f5ceac8dbffb7030890243caed69a9599d2886d957a9cb7656af3bdb3',
      tick_lower: -443520,
      tick_upper: 443520,
    })
    const cPrice = TickMath.sqrtPriceX64ToPrice(new BN('184467440737095516'), 9, 6)
    console.log('🚀🚀🚀 ~ file: pool.test.ts:168 ~ test ~ cPrice:', cPrice.toString())
    printTransaction(payload)
    const transferTxn = await sdk.fullClient.dryRunTransactionBlock({
      transactionBlock: await payload.build({ client: sdk.fullClient }),
    })
    // const transferTxn = await sdk.fullClient.sendTransaction(buildTestAccount(), payload)
    // console.log('doCreatPool: ', transferTxn)
    console.log('🚀🚀🚀 ~ file: pool.test.ts:168 ~ test ~ transferTxn:', transferTxn)
  })

  test('converte tick index between i32 and u32', () => {
    const tickIndex = -1800
    const tickIndexUint32 = asUintN(BigInt(tickIndex))
    console.log('tickIndexUint32', tickIndexUint32)

    const tickIndexI32 = asIntN(BigInt(tickIndexUint32))
    console.log('tickIndexI32', tickIndexI32)
  })

  test('creatPoolTransactionRowPayload', async () => {
    const coinTypeA = '0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS'
    const coinTypeB = '0xfa7ac3951fdca92c5200d468d31a365eb03b2be9936fde615e69f0c1274ad3a0::BLUB::BLUB'

    const coinMetadataA = await sdk.fullClient.getCoinMetadata({ coinType: coinTypeA })
    const coinMetadataB = await sdk.fullClient.getCoinMetadata({ coinType: coinTypeB })

    const { transaction, position, coinAObject, coinBObject, coinAType, coinBType } = await sdk.Pool.createPoolTransactionRowPayload({
      tick_spacing: 20,
      initialize_sqrt_price: '31366801070720067977',
      uri: '',
      fix_amount_a: true,
      amount_a: '100000000',
      amount_b: '1000000000',
      coinTypeA,
      coinTypeB,
      slippage: 0.005,
      metadata_a: coinMetadataA!.id!,
      metadata_b: coinMetadataB!.id!,
      tick_lower: -440000,
      tick_upper: 440000,
    })
    const cPrice = TickMath.sqrtPriceX64ToPrice(new BN('184467440737095516'), 0, 9)
    console.log('🚀🚀🚀 ~ file: pool.test.ts:168 ~ test ~ cPrice:', cPrice.toString())
    printTransaction(transaction)

    TransactionUtil.buildTransferCoin(sdk, transaction, coinAObject, coinAType)
    TransactionUtil.buildTransferCoin(sdk, transaction, coinBObject, coinBType)
    transaction.transferObjects([position], sdk.senderAddress)
    // const transferTxn = await sdk.fullClient.devInspectTransactionBlock({
    //   transactionBlock: payload,
    //   sender: buildTestAccount().getPublicKey().toSuiAddress(),
    // })
    const transferTxn = await sdk.fullClient.sendSimulationTransaction(transaction, keypair.getPublicKey().toSuiAddress())
    console.log('doCreatPool: ', transferTxn)
    console.log('🚀🚀🚀 ~ file: pool.test.ts:168 ~ test ~ transferTxn:', transferTxn)
  })
})
