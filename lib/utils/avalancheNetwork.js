export function getChain(chainId) {
  let chains = [{
    name: "fuji",
    blockExplorerUrls: ["https://cchain.explorer.avax-test.network"],
    chainId: 43113,
    rpc: ["https://api.avax-test.network/ext/bc/C/rpc"],
    shortName: "fuji",
    network: "testnet"
  },
  {
    name: "avalanche",
    blockExplorerUrls: ["https://cchain.explorer.avax.network/"],
    chainId: 43114,
    rpc: ["https://api.avax.network/ext/bc/C/rpc"],
    shortName: "avalanche",
    network: "mainnet"
  }]

  return chains.find(x=> x.chainId === chainId);
}