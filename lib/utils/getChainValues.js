import { batch, contract } from '@pooltogether/etherplex'

import ERC20Abi from '@pooltogether/pooltogether-contracts/abis/ERC20'
import PeriodicPrizePoolAbi from '@pooltogether/pooltogether-contracts/abis/PeriodicPrizePool'
import TicketAbi from '@pooltogether/pooltogether-contracts/abis/Ticket'
import InterestPoolAbi from '@pooltogether/pooltogether-contracts/abis/InterestPoolInterface'

// import PeriodicPrizePoolAbi from 'lib/abis/PeriodicPrizePoolAbi'
// import TicketAbi from 'lib/abis/TicketAbi'

import { getPoolContractAddress } from 'lib/utils/getPoolContractAddress'

export const getChainValues = async (walletContext, setChainValues) => {
  const usersAddress = walletContext.state.address
  const provider = walletContext.state.provider

  if (provider) {
    const poolContractAddress = getPoolContractAddress(walletContext)

    const etherplexPoolContract = contract(
      'pool',
      PeriodicPrizePoolAbi,
      poolContractAddress
    )

    try {
      const poolBatch = await batch(
        provider,
        etherplexPoolContract
          .interestPool()
          .ticket()
          .sponsorship()
          .prizeStrategy()
      )

      const {
        interestPool,
        ticket,
        sponsorship,
        prizeStrategy,
      } = poolBatch.pool

      if (interestPool && ticket) {

        const etherplexInterestPoolContract = contract(
          'interestPool',
          InterestPoolAbi,
          interestPool[0]
        )
        const etherplexTicketContract = contract(
          'ticket',
          TicketAbi,
          ticket[0]
        )

        const values = await batch(
          provider,
          etherplexInterestPoolContract
            .token(),
          etherplexTicketContract
            // .allowance(usersAddress, ticket[0])
            .balanceOf(usersAddress)
            // .name()
            // .symbol()
            .totalSupply()
        )

        const erc20ContractAddress = values.interestPool.token[0]
        const etherplexERC20Contract = contract(
          'erc20',
          ERC20Abi,
          erc20ContractAddress
        )

        const erc20Values = await batch(
          provider,
          etherplexERC20Contract
            .balanceOf(usersAddress)
            .allowance(usersAddress, ticket[0])
            // .name()
            .symbol()
        )

        setChainValues({
          interestPoolAddress: interestPool[0],
          ticketAddress: ticket[0],
          sponsorshipAddress: sponsorship[0],
          prizeStrategyAddress: prizeStrategy[0],
          erc20ContractAddress,
          usersTicketBalance: values.ticket.balanceOf[0],
          usersERC20Allowance: erc20Values.erc20.allowance[0],
          usersERC20Balance: erc20Values.erc20.balanceOf[0],
          // erc20Name: erc20Values.erc20.name[0],
          erc20Symbol: erc20Values.erc20.symbol[0],
        })
      }
    } catch (e) {
      console.warn(e.message)
      // console.error(e)
    }

  } else {
    console.warn('no provider?')
  }
}