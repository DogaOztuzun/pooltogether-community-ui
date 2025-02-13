import { ethers } from 'ethers'
import { batch, contract } from '@pooltogether/etherplex'
import { useQuery } from 'react-query'

import { DATA_REFRESH_POLLING_INTERVAL, QUERY_KEYS } from 'lib/constants'
import { useReadProvider } from 'lib/hooks/useReadProvider'
import { useUsersAddress } from 'lib/hooks/useUsersAddress'
import { useNetwork } from 'lib/hooks/useNetwork'
import { useWalletNetwork } from 'lib/hooks/useWalletNetwork'
import { tokenSupportsAllowance } from 'lib/utils/tokenSupportsAllowance'
import { usePrizePoolContracts } from 'lib/hooks/usePrizePoolContracts'
import { usePoolChainValues } from 'lib/hooks/usePoolChainValues'

import ERC20Abi from 'abis/ERC20Abi'
import PrizePoolAbi from '@pooltogether/pooltogether-contracts/abis/PrizePool'

const EMPTY_USER_CHAIN_VALUES = {
  loading: true,
  usersTicketBalance: ethers.constants.Zero,
  usersTokenAllowance: ethers.constants.Zero,
  usersTokenBalance: ethers.constants.Zero,
  usersTimelockBalanceAvailableAt: null,
  usersTimelockBalance: null,
  underlyingTokenSupportsAllowance: null,
  underlyingTokenIsApproved: null
}

export const useUserChainValues = () => {
  const {
    data: prizePoolContracts,
    isFetched: prizePoolContractsIsFetched
  } = usePrizePoolContracts()
  const { data: poolChainValues, isFetched: poolChainValuesIsFetched } = usePoolChainValues()
  const usersAddress = useUsersAddress()
  const { chainId } = useNetwork()
  const { walletConnected } = useWalletNetwork()
  const { readProvider: provider, isLoaded: readProviderLoaded } = useReadProvider()

  const enabled =
    walletConnected &&
    readProviderLoaded &&
    poolChainValuesIsFetched &&
    prizePoolContractsIsFetched &&
    usersAddress

  return useQuery(
    [
      QUERY_KEYS.fetchUserChainData,
      chainId,
      usersAddress,
      prizePoolContracts?.ticket?.address,
      prizePoolContracts?.token?.address,
      prizePoolContracts?.prizePool?.address
    ],
    async () =>
      await _fetchUserChainData(
        provider,
        chainId,
        poolChainValues,
        prizePoolContracts,
        usersAddress
      ),
    {
      enabled,
      refetchInterval: DATA_REFRESH_POLLING_INTERVAL,
      staleTime: DATA_REFRESH_POLLING_INTERVAL
    }
  )
}

export const _fetchUserChainData = async (
  provider,
  chainId,
  poolChainValues,
  prizePoolContracts,
  usersAddress
) => {
  const { token, prizePool, ticket } = prizePoolContracts
  const tokenAddress = token.address
  const prizePoolAddress = prizePool.address
  const ticketAddress = ticket.address

  try {
    const etherplexPrizePoolContract = contract('prizePool', PrizePoolAbi, prizePoolAddress)
    const etherplexTicketContract = contract('ticket', ERC20Abi, ticketAddress)
    const etherplexTokenContract = contract('token', ERC20Abi, tokenAddress)

    const batchRequests = [
      etherplexPrizePoolContract
        .timelockBalanceOf(usersAddress)
        .timelockBalanceAvailableAt(usersAddress),
      etherplexTicketContract.balanceOf(usersAddress),
      etherplexTokenContract.balanceOf(usersAddress)
    ]

    const underlyingTokenSupportsAllowance = tokenSupportsAllowance(chainId, tokenAddress)

    if (underlyingTokenSupportsAllowance) {
      batchRequests.push(etherplexTokenContract.allowance(usersAddress, prizePool.address))
    }

    const values = await batch(provider, ...batchRequests)

    const usersTokenAllowance = values.token.allowance?.[0] || ethers.constants.Zero

    return {
      usersTicketBalance: ethers.utils.formatUnits(
        values.ticket.balanceOf[0],
        poolChainValues.ticket.decimals
      ),
      usersTicketBalanceUnformatted: values.ticket.balanceOf[0],
      usersTokenBalance: ethers.utils.formatUnits(
        values.token.balanceOf[0],
        poolChainValues.token.decimals
      ),
      usersTokenBalanceUnformatted: values.token.balanceOf[0],
      usersTokenAllowance: ethers.utils.formatUnits(
        usersTokenAllowance,
        poolChainValues.token.decimals
      ),
      usersTokenAllowanceUnformatted: usersTokenAllowance,
      usersTimelockBalanceAvailableAt: values.prizePool.timelockBalanceAvailableAt[0],
      usersTimelockBalance: ethers.utils.formatUnits(
        values.prizePool.timelockBalanceOf[0],
        poolChainValues.token.decimals
      ),
      usersTimelockBalanceUnformatted: values.prizePool.timelockBalanceOf[0],
      underlyingTokenSupportsAllowance,
      underlyingTokenIsApproved: underlyingTokenSupportsAllowance
        ? !usersTokenAllowance.isZero()
        : true
    }
  } catch (e) {
    console.error(e.message)
    return { ...EMPTY_USER_CHAIN_VALUES }
  }
}
