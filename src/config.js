// Network configuration
export const config = {
  chainId: process.env.REACT_APP_CHAIN_ID || 'cosmoshub-4',
  chainName: 'Cosmos Hub',
  rpc: process.env.REACT_APP_RPC_URL || 'https://cosmos-rpc.polkachu.com',
  rest: process.env.REACT_APP_REST_URL || 'https://cosmos-api.polkachu.com',
  bech32Prefix: 'cosmos',
  coinDenom: 'ATOM',
  coinMinimalDenom: 'uatom',
  coinDecimals: 6,
  gasPriceStep: {
    low: 0.01,
    average: 0.025,
    high: 0.04,
  },
  
  // Contract address (will be updated after deployment)
  contractAddress: process.env.REACT_APP_CONTRACT_ADDRESS || 'cosmos1...',
  
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