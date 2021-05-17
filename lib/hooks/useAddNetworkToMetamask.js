import { formatNetworkForAddEthereumChain } from '@pooltogether/evm-chains-extended'
import { getChain } from 'lib/utils/avalancheNetwork'

export const useAddNetworkToMetamask = (chainId) => {
  return async () => {
    try {
      const ethereum = window.ethereum

      const network = getChain(chainId)
      const formattedNetwork = formatNetworkForAddEthereumChain(network)

      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [formattedNetwork]
      })
    } catch (error) {
      console.error(error)
    }
  }
}
