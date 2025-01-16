import { buildSdk, SdkEnv } from './data/init_test_data'
import 'isomorphic-fetch'

describe('Config Module', () => {
  const sdk = buildSdk(SdkEnv.testnet)

  test('getTokenListByCoinTypes', async () => {
    const tokenMap = await sdk.CetusConfig.getTokenListByCoinTypes([
      '0x2::sui::SUI',
    ])
    console.log('tokenMap: ', tokenMap)
  })

  test('getCoinConfigs', async () => {
    const coin_list = await sdk.CetusConfig.getCoinConfigs(true)
    console.log('coin_list: ', coin_list)
  })

  test('getClmmPoolConfigs', async () => {
    const pool_list = await sdk.CetusConfig.getClmmPoolConfigs()
    console.log('pool_list: ', pool_list)
  })

  test('getLaunchpadPoolConfigs', async () => {
    const pool_list = await sdk.CetusConfig.getLaunchpadPoolConfigs()
    console.log('pool_list: ', pool_list)
  })
})
