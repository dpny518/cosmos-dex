# 🚀 Cosmos DEX Developer Guide

## Adding Tokens and LP Pairs to the DEX

This guide explains how to add new tokens to the token dropdown and configure LP (Liquidity Pool) pairs so they appear in swap and remove liquidity interfaces.

---

## 📋 Table of Contents

- [Adding New Tokens](#-adding-new-tokens)
  - [Native & IBC Tokens](#native--ibc-tokens)
  - [CW20 Contract Tokens](#cw20-contract-tokens)
- [Adding LP Pairs](#-adding-lp-pairs)
  - [For Existing Pools](#for-existing-pools)
  - [For New Pools](#for-new-pools)
- [File Structure](#-file-structure)
- [Examples](#-examples)
- [Troubleshooting](#-troubleshooting)

---

## 🪙 Adding New Tokens

### Native & IBC Tokens

**Location**: `src/services/tokenRegistry.js` → `getLocalTokens()` method

#### Step 1: Add to Local Token List

```javascript
// In getLocalTokens() method, add your token to the array:
getLocalTokens() {
  return [
    // Existing tokens...
    
    // Add your new token here
    {
      denom: 'your-token-denom-here',           // Required: Token denomination
      symbol: 'TOKEN',                          // Required: Display symbol
      name: 'Your Token Name',                  // Required: Full name
      decimals: 6,                             // Required: Decimal places (usually 6)
      description: 'Description of your token', // Optional: Token description
      logo: 'https://url-to-logo.png',         // Optional: Token logo URL
      coingecko_id: 'token-id',                // Optional: CoinGecko ID for pricing
      native: false,                           // true for native chain tokens
      type: 'ibc',                             // 'native', 'ibc', or 'cw20'
      
      // For IBC tokens only:
      traces: [{
        type: 'ibc',
        counterparty: {
          channel_id: 'channel-X',             // Source chain channel
          base_denom: 'base-denom',            // Original denomination
          chain_name: 'source-chain'           // Source chain name
        },
        chain: {
          channel_id: 'channel-Y'              // Destination channel on Cosmos Hub
        }
      }],
      ibc: {
        source_channel: 'channel-Y',           // Channel on Cosmos Hub
        source_denom: 'base-denom',            // Original denom on source chain
        source_chain: 'source-chain'           // Source chain name
      }
    }
  ];
}
```

#### Step 2: Add to Known IBC Tokens (Optional)

For better recognition, add to `identifyKnownIBCToken()`:

```javascript
identifyKnownIBCToken(token) {
  const hash = token.denom.replace('ibc/', '');
  
  // Add your IBC token hash mapping
  if (hash === 'YOUR_IBC_HASH_HERE') {
    token.symbol = 'TOKEN';
    token.name = 'Your Token Name';
    token.decimals = 6;
    token.description = 'Your token description';
    token.logo = 'https://url-to-logo.png';
    token.coingecko_id = 'token-id';
    token.ibc = {
      source_channel: 'channel-Y',
      source_denom: 'base-denom',
      source_chain: 'source-chain'
    };
  }
}
```

### CW20 Contract Tokens

For CW20 tokens, add them to the same `getLocalTokens()` array with `type: 'cw20'`:

```javascript
{
  denom: 'cosmos1contract-address-here',       // Contract address as denom
  symbol: 'TOKEN',
  name: 'Your CW20 Token',
  decimals: 6,
  description: 'Your CW20 token description',
  logo: 'https://url-to-logo.png',
  coingecko_id: 'token-id',
  native: false,
  type: 'cw20',
  contractAddress: 'cosmos1contract-address-here'
}
```

---

## 🏊 Adding LP Pairs

LP (Liquidity Pool) tokens are automatically created when pools exist. Here's how to configure them:

### For Existing Pools

**Location**: `src/services/tokenRegistry.js` → Add a new method similar to `forceAddATOMUSDCLP()`

#### Step 1: Create LP Token Method

```javascript
// Add this method to the TokenRegistry class
forceAddYourTokenLP() {
  const tokenA = this.getToken('token-a-denom');
  const tokenB = this.getToken('token-b-denom');
  
  if (tokenA && tokenB) {
    console.log('🏊 Creating TOKEN-A/TOKEN-B LP token since pool exists');
    
    // Check if LP token already exists
    let lpToken = this.getLPToken(tokenA, tokenB);
    if (!lpToken) {
      lpToken = this.createLPToken(tokenA, tokenB);
    }
    
    // Set LP token balance and pool info if you know them
    lpToken.balance = '0'; // Set to user's actual LP balance if known
    lpToken.poolInfo = {
      reserve_a: '1000000',      // Token A reserves (in base units)
      reserve_b: '1000000',      // Token B reserves (in base units)
      total_liquidity: '1000000', // Total LP tokens
      user_liquidity: '0'        // User's LP tokens (if known)
    };
    
    console.log('✅ TOKEN-A/TOKEN-B LP token created:', lpToken);
    return lpToken;
  } else {
    console.log('⚠️ Could not create TOKEN-A/TOKEN-B LP token - tokens not found');
  }
  
  return null;
}
```

#### Step 2: Call LP Method in loadTokens()

Add your method call in the `loadTokens()` method:

```javascript
async loadTokens(balances = null) {
  // ... existing code ...
  
  // Force add ATOM/USDC LP token since we know the pool exists
  this.forceAddATOMUSDCLP();
  
  // Add your LP token
  this.forceAddYourTokenLP();
  
  // ... rest of the method ...
}
```

### For New Pools

New pools are automatically detected via the `updateLPTokenBalances()` method, which:
1. Queries all pools from the DEX contract
2. Checks user liquidity in each pool  
3. Automatically creates LP tokens for pools where user has liquidity

---

## 📁 File Structure

```
src/
├── services/
│   └── tokenRegistry.js          # Main token configuration
├── config.js                     # Network and contract config
└── components/
    ├── TokenSelector.jsx         # Token dropdown component
    ├── SwapInterface.jsx         # Uses tokenRegistry for token list
    └── LiquidityInterface.jsx    # Uses tokenRegistry for LP tokens
```

---

## 📝 Examples

### Example 1: Adding USDC (IBC Token)

```javascript
// In getLocalTokens()
{
  denom: 'ibc/F663521BF1836B00F5F177680F74BFB9A8B5654A694D0D2BC249E03CF2509013',
  symbol: 'USDC',
  name: 'USD Coin (Noble)',
  decimals: 6,
  description: 'USD Coin from Noble chain via IBC',
  logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/_non-cosmos/ethereum/images/usdc.svg',
  coingecko_id: 'usd-coin',
  native: false,
  type: 'ibc',
  traces: [{
    type: 'ibc',
    counterparty: {
      channel_id: 'channel-4',
      base_denom: 'uusdc',
      chain_name: 'noble'
    },
    chain: {
      channel_id: 'channel-536'
    }
  }],
  ibc: {
    source_channel: 'channel-536',
    source_denom: 'uusdc',
    source_chain: 'noble'
  }
}
```

### Example 2: Adding a CW20 Token

```javascript
// In getLocalTokens()
{
  denom: 'cosmos1abcdefghijklmnopqrstuvwxyz1234567890',
  symbol: 'MYTOKEN',
  name: 'My Custom Token',
  decimals: 6,
  description: 'My custom CW20 token',
  logo: 'https://example.com/logo.png',
  native: false,
  type: 'cw20',
  contractAddress: 'cosmos1abcdefghijklmnopqrstuvwxyz1234567890'
}
```

### Example 3: Adding LP Pair

```javascript
// Add method to TokenRegistry class
forceAddMYTOKENATOMLP() {
  const atomToken = this.getToken('uatom');
  const mytokenToken = this.getToken('cosmos1abcdefghijklmnopqrstuvwxyz1234567890');
  
  if (atomToken && mytokenToken) {
    console.log('🏊 Creating ATOM/MYTOKEN LP token');
    
    let lpToken = this.getLPToken(atomToken, mytokenToken);
    if (!lpToken) {
      lpToken = this.createLPToken(atomToken, mytokenToken);
    }
    
    // Set pool info if known
    lpToken.poolInfo = {
      reserve_a: '1000000000',  // 1000 ATOM
      reserve_b: '5000000000',  // 5000 MYTOKEN
      total_liquidity: '2236067977',  // sqrt(1000 * 5000) * 10^6
    };
    
    return lpToken;
  }
  return null;
}

// Then call it in loadTokens()
this.forceAddMYTOKENATOMLP();
```

---

## 🔧 Troubleshooting

### Token Not Appearing in Dropdown

1. **Check console logs**: Look for token loading messages
2. **Verify denom format**: Ensure denom matches exactly (case-sensitive)
3. **Clear cache**: Clear localStorage or refresh page
4. **Check balance**: Some interfaces only show tokens with balance > 0

### LP Token Not Showing in Remove Liquidity

1. **Check pool exists**: Verify the pool is created on-chain
2. **Check user has liquidity**: User must have LP tokens to see remove option
3. **Verify token pairing**: Ensure both tokens in the pair are properly configured
4. **Update balances**: Call `updateLPTokenBalances()` or refresh page

### Common Issues

**IBC Hash Wrong**: 
- Use the correct IBC hash from chain registry or block explorer
- IBC hashes are case-sensitive

**Decimals Mismatch**:
- Verify token decimals match the actual token contract
- Most Cosmos tokens use 6 decimals

**Logo Not Loading**:
- Use direct image URLs (not redirects)
- SVG and PNG formats work best
- Test URL accessibility

**Pool Info Missing**:
- LP tokens need `poolInfo` to show in remove liquidity
- Call `updateLPTokenBalances()` for automatic detection
- Or manually set `poolInfo` in force-add methods

---

## 📚 Additional Resources

- [Cosmos Chain Registry](https://github.com/cosmos/chain-registry) - Official token data
- [IBC Token Lookup](https://www.mintscan.io/cosmos/account) - Find IBC hashes
- [CosmWasm Contracts](https://cosmwasm.tools/) - CW20 token info
- [Keplr Chain Registry](https://chains.keplr.app/) - Chain and token configs

---

## 🤝 Contributing

When adding new tokens or LP pairs:

1. Test on testnet first
2. Verify all token metadata is accurate  
3. Include proper logos and descriptions
4. Update this guide if you add new patterns
5. Consider submitting to official chain registry

---

**Need Help?** Check the console logs for detailed debugging information or open an issue in the repository.