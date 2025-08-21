// Network configuration
export const config = {
  chainId: import.meta.env.VITE_CHAIN_ID || 'cosmoshub-4',
  chainName: 'Cosmos Hub',
  rpc: import.meta.env.VITE_RPC_ENDPOINT || 'https://cosmos-rpc.polkachu.com',
  rest: import.meta.env.VITE_REST_ENDPOINT || 'https://cosmos-rest.polkachu.com',
  bech32Prefix: 'cosmos',
  coinDenom: 'ATOM',
  coinMinimalDenom: 'uatom',
  coinDecimals: 6,
  gasPriceStep: {
    low: 0.01,
    average: 0.025,
    high: 0.04,
  },
  
  // Contract address (deployed to mainnet)
  contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS || 'cosmos1svd8fpfwrf237qprqt33ajylg302s05neruqt37p3ju2qktkt6wqytq4ez',
  
  // Supported tokens
  tokens: [
    {
      denom: 'uatom',
      symbol: 'ATOM',
      name: 'Atom',
      decimals: 6,
      coinGeckoId: 'cosmos',
      native: true
    },
    // Add some test tokens for development
    {
      denom: 'stake',
      symbol: 'STAKE',
      name: 'Stake Token',
      decimals: 6,
      native: true
    },
    // Add more tokens as needed
  ]
};

// Keplr chain config
export const keplrChainConfig = {
  chainId: config.chainId,
  chainName: config.chainName,
  rpc: config.rpc,
  rest: config.rest,
  bip44: {
    coinType: 118,
  },
  bech32Config: {
    bech32PrefixAccAddr: config.bech32Prefix,
    bech32PrefixAccPub: `${config.bech32Prefix}pub`,
    bech32PrefixValAddr: `${config.bech32Prefix}valoper`,
    bech32PrefixValPub: `${config.bech32Prefix}valoperpub`,
    bech32PrefixConsAddr: `${config.bech32Prefix}valcons`,
    bech32PrefixConsPub: `${config.bech32Prefix}valconspub`,
  },
  currencies: [
    {
      coinDenom: config.coinDenom,
      coinMinimalDenom: config.coinMinimalDenom,
      coinDecimals: config.coinDecimals,
    },
  ],
  feeCurrencies: [
    {
      coinDenom: config.coinDenom,
      coinMinimalDenom: config.coinMinimalDenom,
      coinDecimals: config.coinDecimals,
      gasPriceStep: config.gasPriceStep,
    },
  ],
  stakeCurrency: {
    coinDenom: config.coinDenom,
    coinMinimalDenom: config.coinMinimalDenom,
    coinDecimals: config.coinDecimals,
  },
};