import CetusClmmSDK from '../main'
import { initMainnetSDK } from './mainnet'
import { initTestnetSDK } from './testnet'

interface InitCetusSDKOptions {
  network: 'mainnet' | 'testnet'
  fullNodeUrl?: string
  wallet?: string
}

/**
 * Helper function to initialize the Cetus SDK
 * @param env - The environment to initialize the SDK in. One of 'mainnet' or 'testnet'.
 * @param fullNodeUrl - The full node URL to use.
 * @param wallet - The wallet address to use. If not provided,
 *                 If you use the `preswap` method or other methods that require payment assistance,
 *                  you must configure a wallet with sufficient balance of input tokens.
 *                  If you do not set a wallet, the SDK will throw an error.
 * @returns The initialized Cetus SDK.
 */
export function initCetusSDK(options: InitCetusSDKOptions): CetusClmmSDK {
  const { network, fullNodeUrl, wallet } = options
  return network === 'mainnet' ? initMainnetSDK(fullNodeUrl, wallet) : initTestnetSDK(fullNodeUrl, wallet)
}
