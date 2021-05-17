export function getChain(chainId) {
  let chain = {
    name: "fuji",
    blockExplorerUrls: ["https://cchain.explorer.avax-test.network"],
    chainId: 43113,
    rpc: ["https://api.avax-test.network/ext/bc/C/rpc"],
    shortName: "fuji",
    network: "testnet"
  }

  return chain
}