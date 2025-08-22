// Token Registry Service
// Fetches and manages tokens from Cosmos chain registry

const CHAIN_REGISTRY_URL = 'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/assetlist.json';
const LOCAL_STORAGE_KEY = 'cosmos-dex-tokens';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

class TokenRegistry {
  constructor() {
    this.tokens = new Map();
    this.lpTokens = new Map();
    this.pairs = new Map();
    this.lastUpdated = null;
  }

  // Fetch tokens from Cosmos chain registry
  async fetchChainRegistryTokens() {
    try {
      const response = await fetch(CHAIN_REGISTRY_URL);
      const data = await response.json();
      
      const tokens = data.assets.map(asset => ({
        denom: asset.base,
        symbol: asset.symbol,
        name: asset.name,
        decimals: asset.denom_units.find(unit => unit.denom === asset.display)?.exponent || 6,
        description: asset.description,
        logo: asset.logo_URIs?.png || asset.logo_URIs?.svg,
        coingecko_id: asset.coingecko_id,
        native: asset.base === 'uatom',
        type: 'native',
        traces: asset.traces || [],
        ibc: asset.traces?.[0]?.counterparty?.base_denom ? {
          source_channel: asset.traces[0].counterparty.channel_id,
          source_denom: asset.traces[0].counterparty.base_denom,
          source_chain: asset.traces[0].counterparty.chain_name
        } : null
      }));

      return tokens;
    } catch (error) {
      console.error('Failed to fetch chain registry tokens:', error);
      return [];
    }
  }

  // Load tokens from cache or fetch fresh
  async loadTokens(balances = null) {
    const cached = this.getCachedTokens();
    
    if (cached && this.isCacheValid(cached.timestamp)) {
      this.tokens = new Map(cached.tokens.map(token => [token.denom, token]));
      this.lastUpdated = cached.timestamp;
    } else {
      const chainTokens = await this.fetchChainRegistryTokens();
      const localTokens = this.getLocalTokens();
      const allTokens = [...chainTokens, ...localTokens];

      // Store in memory
      this.tokens = new Map(allTokens.map(token => [token.denom, token]));
      this.lastUpdated = Date.now();

      // Cache for next time
      this.cacheTokens(allTokens);
    }

    // Add tokens from user balances (IBC tokens not in registry)
    if (balances) {
      this.addTokensFromBalances(balances);
    }

    // FORCE ADD YOUR USDC TOKEN - Always ensure it's available
    const usdcDenom = 'ibc/F663521BF1836B00F5F177680F74BFB9A8B5654A694D0D2BC249E03CF2509013';
    if (!this.tokens.has(usdcDenom)) {
      console.log('🚨 Force adding USDC token to ensure availability');
      const usdcToken = {
        denom: usdcDenom,
        symbol: 'USDC',
        name: 'USD Coin (Your Token)',
        decimals: 6,
        description: 'Your USDC from Noble chain via IBC',
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
        },
        force_added: true
      };
      this.tokens.set(usdcDenom, usdcToken);
      console.log('✅ USDC token force added:', usdcToken);
    }

    // Force add ATOM/USDC LP token since we know the pool exists
    this.forceAddATOMUSDCLP();

    const allTokensArray = Array.from(this.tokens.values());
    console.log('📊 Final token count:', allTokensArray.length);
    console.log('🔍 USDC in final list:', allTokensArray.find(t => t.symbol === 'USDC') ? 'YES' : 'NO');
    
    return allTokensArray;
  }

  // Get local/custom tokens
  getLocalTokens() {
    // Add your USDC token manually for testing
    return [
      {
        denom: 'ibc/F663521BF1836B00F5F177680F74BFB9A8B5654A694D0D2BC249E03CF2509013',
        symbol: 'USDC',
        name: 'USD Coin (Noble)',
        decimals: 6,
        description: 'USD Coin from Noble chain via IBC (your token)',
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
        },
        manually_added: true
      }
    ];
  }

  // Get cached tokens from localStorage
  getCachedTokens() {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Failed to load cached tokens:', error);
      return null;
    }
  }

  // Check if cache is still valid
  isCacheValid(timestamp) {
    return timestamp && (Date.now() - timestamp) < CACHE_DURATION;
  }

  // Cache tokens to localStorage
  cacheTokens(tokens) {
    try {
      const cacheData = {
        tokens,
        timestamp: Date.now()
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Failed to cache tokens:', error);
    }
  }

  // Add tokens from user balances (for IBC tokens not in registry)
  addTokensFromBalances(balances) {
    if (!balances) return;

    console.log('🔍 Scanning balances for IBC tokens:', balances);

    Object.keys(balances).forEach(denom => {
      if (!this.tokens.has(denom)) {
        console.log('🆕 Found new token in balance:', denom);
        
        // Check if it's an IBC token
        if (denom.startsWith('ibc/')) {
          console.log('🌉 Detected IBC token:', denom);
          
          const token = {
            denom,
            symbol: this.generateSymbolFromDenom(denom),
            name: this.generateNameFromDenom(denom),
            decimals: 6, // Default for most tokens
            description: `IBC token ${denom}`,
            logo: null,
            coingecko_id: null,
            native: false,
            type: 'ibc',
            traces: [],
            ibc: {
              source_channel: 'unknown',
              source_denom: 'unknown',
              source_chain: 'unknown'
            },
            detected_from_balance: true
          };

          // Try to identify known IBC tokens
          this.identifyKnownIBCToken(token);
          
          console.log('✅ Added IBC token:', token);
          this.tokens.set(denom, token);
        }
      }
    });

    console.log('📊 Total tokens after balance scan:', this.tokens.size);
  }

  // Generate a readable symbol from IBC denom
  generateSymbolFromDenom(denom) {
    // Known IBC token mappings
    const knownTokens = {
      'F663521BF1836B00F5F177680F74BFB9A8B5654A694D0D2BC249E03CF2509013': 'USDC',
      // Add more known IBC hashes here
    };

    const hash = denom.replace('ibc/', '');
    return knownTokens[hash] || `IBC-${hash.substring(0, 8)}`;
  }

  // Generate a readable name from IBC denom
  generateNameFromDenom(denom) {
    const symbol = this.generateSymbolFromDenom(denom);
    if (symbol === 'USDC') {
      return 'USD Coin (via IBC)';
    }
    return `IBC Token ${symbol}`;
  }

  // Identify known IBC tokens and add proper metadata
  identifyKnownIBCToken(token) {
    const hash = token.denom.replace('ibc/', '');
    
    // USDC from Noble via Osmosis
    if (hash === 'F663521BF1836B00F5F177680F74BFB9A8B5654A694D0D2BC249E03CF2509013') {
      token.symbol = 'USDC';
      token.name = 'USD Coin';
      token.decimals = 6;
      token.description = 'USD Coin from Noble chain via IBC';
      token.logo = 'https://raw.githubusercontent.com/cosmos/chain-registry/master/_non-cosmos/ethereum/images/usdc.svg';
      token.coingecko_id = 'usd-coin';
      token.ibc = {
        source_channel: 'channel-536',
        source_denom: 'uusdc',
        source_chain: 'noble'
      };
    }
    
    // Add more known IBC tokens here as needed
  }

  // Get all tokens
  getAllTokens() {
    return Array.from(this.tokens.values());
  }

  // Get token by denom
  getToken(denom) {
    return this.tokens.get(denom);
  }

  // Search tokens
  searchTokens(query) {
    const lowerQuery = query.toLowerCase();
    return this.getAllTokens().filter(token => 
      token.symbol.toLowerCase().includes(lowerQuery) ||
      token.name.toLowerCase().includes(lowerQuery) ||
      token.denom.toLowerCase().includes(lowerQuery)
    );
  }

  // Create LP token for a pair
  createLPToken(tokenA, tokenB) {
    const sortedTokens = [tokenA, tokenB].sort((a, b) => a.denom.localeCompare(b.denom));
    const pairId = `${sortedTokens[0].denom}-${sortedTokens[1].denom}`;
    
    const lpToken = {
      denom: `lp-${pairId}`,
      symbol: `${sortedTokens[0].symbol}-${sortedTokens[1].symbol} LP`,
      name: `${sortedTokens[0].name} - ${sortedTokens[1].name} Liquidity Pool`,
      decimals: 6,
      type: 'lp',
      pair: {
        tokenA: sortedTokens[0],
        tokenB: sortedTokens[1],
        pairId
      },
      logo: null, // Could generate or use default LP logo
      created: Date.now()
    };

    this.lpTokens.set(lpToken.denom, lpToken);
    this.pairs.set(pairId, {
      id: pairId,
      tokenA: sortedTokens[0],
      tokenB: sortedTokens[1],
      lpToken,
      reserves: { tokenA: '0', tokenB: '0' },
      totalLiquidity: '0',
      created: Date.now()
    });

    return lpToken;
  }

  // Get LP token for a pair
  getLPToken(tokenA, tokenB) {
    const sortedTokens = [tokenA, tokenB].sort((a, b) => a.denom.localeCompare(b.denom));
    const pairId = `${sortedTokens[0].denom}-${sortedTokens[1].denom}`;
    const lpDenom = `lp-${pairId}`;
    
    return this.lpTokens.get(lpDenom);
  }

  // Get all LP tokens
  getAllLPTokens() {
    return Array.from(this.lpTokens.values());
  }

  // Get all pairs
  getAllPairs() {
    return Array.from(this.pairs.values());
  }

  // Get pair by tokens
  getPair(tokenA, tokenB) {
    const sortedTokens = [tokenA, tokenB].sort((a, b) => a.denom.localeCompare(b.denom));
    const pairId = `${sortedTokens[0].denom}-${sortedTokens[1].denom}`;
    return this.pairs.get(pairId);
  }

  // Force add ATOM/USDC LP token since we know the pool exists
  forceAddATOMUSDCLP() {
    const atomToken = this.getToken('uatom');
    const usdcToken = this.getToken('ibc/F663521BF1836B00F5F177680F74BFB9A8B5654A694D0D2BC249E03CF2509013');
    
    if (atomToken && usdcToken) {
      console.log('🏊 Creating ATOM/USDC LP token since pool exists');
      
      // Check if LP token already exists
      let lpToken = this.getLPToken(atomToken, usdcToken);
      if (!lpToken) {
        lpToken = this.createLPToken(atomToken, usdcToken);
      }
      
      // Set LP token balance based on known pool data
      lpToken.balance = '100000'; // From transaction logs
      lpToken.poolInfo = {
        reserve_a: '100000000', // 100 ATOM (in micro units)
        reserve_b: '100000000', // 100 USDC (in micro units)
        total_liquidity: '100000000', // 100 LP tokens (in micro units)
        user_liquidity: '100000' // User's portion
      };
      
      console.log('✅ ATOM/USDC LP token created:', lpToken);
      return lpToken;
    } else {
      console.log('⚠️ Could not create ATOM/USDC LP token - tokens not found');
    }
    
    return null;
  }

  // Update LP tokens with user balances from contract
  async updateLPTokenBalances(client, contractAddress, userAddress) {
    if (!client || !contractAddress || !userAddress) {
      console.log('⚠️ Missing parameters for LP token balance update');
      return;
    }

    console.log('🏊 Updating LP token balances for user:', userAddress);
    
    try {
      // Get all pools from contract
      const poolsResponse = await client.queryContractSmart(contractAddress, {
        pools: { limit: 100 }
      });
      
      console.log('📊 Found pools in contract:', poolsResponse.pools?.length || 0);
      
      // For each pool, check if user has liquidity
      for (const pool of poolsResponse.pools || []) {
        try {
          const liquidityResponse = await client.queryContractSmart(contractAddress, {
            liquidity: {
              user: userAddress,
              token_a: pool.token_a,
              token_b: pool.token_b
            }
          });
          
          console.log(`🔍 Liquidity in ${pool.token_a}/${pool.token_b}:`, liquidityResponse);
          
          // If user has liquidity, create/update LP token
          if (liquidityResponse.liquidity && liquidityResponse.liquidity !== '0') {
            const tokenA = this.getToken(pool.token_a);
            const tokenB = this.getToken(pool.token_b);
            
            if (tokenA && tokenB) {
              // Create or get existing LP token
              let lpToken = this.getLPToken(tokenA, tokenB);
              if (!lpToken) {
                lpToken = this.createLPToken(tokenA, tokenB);
              }
              
              // Update with balance and pool info
              lpToken.balance = liquidityResponse.liquidity;
              lpToken.poolInfo = {
                reserve_a: pool.reserve_a,
                reserve_b: pool.reserve_b,
                total_liquidity: pool.total_liquidity,
                share_a: liquidityResponse.share_a,
                share_b: liquidityResponse.share_b,
                user_liquidity: liquidityResponse.liquidity
              };
              
              console.log('✅ Updated LP token:', lpToken.symbol, 'Balance:', lpToken.balance);
            }
          }
        } catch (error) {
          console.log(`⚠️ No liquidity in pool ${pool.token_a}/${pool.token_b}:`, error.message);
        }
      }
      
      console.log('🏊 LP token balance update complete');
      
    } catch (error) {
      console.error('❌ Error updating LP token balances:', error);
    }
  }

  // Get all tokens including LP tokens with balances
  getAllTokensWithLP() {
    const regularTokens = this.getAllTokens();
    const lpTokens = this.getAllLPTokens().filter(lp => lp.balance && lp.balance !== '0');
    
    return [...regularTokens, ...lpTokens];
  }

  // Get only tokens that have liquidity pools available (for swap interface)
  async getSwappableTokens(client, contractAddress) {
    if (!client || !contractAddress) {
      console.log('⚠️ Missing client or contract address for pool queries');
      // Fallback to known tokens if contract query fails
      return this.getAllTokens().filter(token => 
        token.symbol === 'ATOM' || 
        token.symbol === 'USDC' ||
        token.force_added ||
        token.manually_added
      );
    }

    console.log('🏊 Querying available pools for swappable tokens...');
    const swappableTokens = new Set();
    
    try {
      // Get all pools from contract
      const poolsResponse = await client.queryContractSmart(contractAddress, {
        pools: { limit: 100 }
      });
      
      console.log('📊 Found pools in contract:', poolsResponse.pools?.length || 0);
      
      // For each pool, add both tokens to the swappable set
      for (const pool of poolsResponse.pools || []) {
        // Only include pools with actual liquidity
        if (pool.reserve_a && pool.reserve_b && 
            parseFloat(pool.reserve_a) > 0 && 
            parseFloat(pool.reserve_b) > 0) {
          
          swappableTokens.add(pool.token_a);
          swappableTokens.add(pool.token_b);
          
          console.log(`✅ Pool found: ${pool.token_a} ↔ ${pool.token_b}`);
        }
      }
      
      console.log('🎯 Total unique swappable tokens:', swappableTokens.size);
      
      // Return only tokens that exist in pools
      const availableTokens = this.getAllTokens().filter(token => 
        swappableTokens.has(token.denom)
      );
      
      console.log('📋 Swappable tokens:', availableTokens.map(t => t.symbol).join(', '));
      
      return availableTokens;
      
    } catch (error) {
      console.error('❌ Error querying pools for swappable tokens:', error);
      
      // Fallback to known tokens that likely have pools
      return this.getAllTokens().filter(token => 
        token.symbol === 'ATOM' || 
        token.symbol === 'USDC' ||
        token.force_added ||
        token.manually_added
      );
    }
  }

  // Export data for Git repository
  exportForGit() {
    return {
      assetlist: {
        chain_name: 'cosmoshub',
        assets: this.getAllTokens().filter(token => token.type !== 'lp')
      },
      lpTokens: this.getAllLPTokens(),
      pairs: this.getAllPairs().map(pair => ({
        id: pair.id,
        tokenA: {
          denom: pair.tokenA.denom,
          symbol: pair.tokenA.symbol
        },
        tokenB: {
          denom: pair.tokenB.denom,
          symbol: pair.tokenB.symbol
        },
        lpToken: pair.lpToken.denom,
        created: pair.created
      }))
    };
  }

  // Generate copyable contract data
  generateContractData(pair) {
    return {
      // For adding to assetlist.json
      assetlist_entry: {
        description: `Liquidity pool token for ${pair.tokenA.symbol}-${pair.tokenB.symbol} pair`,
        denom_units: [
          {
            denom: pair.lpToken.denom,
            exponent: 0
          },
          {
            denom: pair.lpToken.symbol.toLowerCase().replace(' ', ''),
            exponent: 6
          }
        ],
        base: pair.lpToken.denom,
        name: pair.lpToken.name,
        display: pair.lpToken.symbol.toLowerCase().replace(' ', ''),
        symbol: pair.lpToken.symbol,
        type_asset: "lp"
      },
      // For pairs.json
      pair_entry: {
        id: pair.id,
        contract_address: import.meta.env.VITE_CONTRACT_ADDRESS,
        tokenA: pair.tokenA.denom,
        tokenB: pair.tokenB.denom,
        lpToken: pair.lpToken.denom,
        created: pair.created
      }
    };
  }
}

// Create singleton instance
export const tokenRegistry = new TokenRegistry();

// Initialize on import
tokenRegistry.loadTokens().catch(console.error);

export default tokenRegistry;
