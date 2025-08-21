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
  async loadTokens() {
    const cached = this.getCachedTokens();
    
    if (cached && this.isCacheValid(cached.timestamp)) {
      this.tokens = new Map(cached.tokens.map(token => [token.denom, token]));
      this.lastUpdated = cached.timestamp;
      return cached.tokens;
    }

    const chainTokens = await this.fetchChainRegistryTokens();
    const localTokens = this.getLocalTokens();
    const allTokens = [...chainTokens, ...localTokens];

    // Store in memory
    this.tokens = new Map(allTokens.map(token => [token.denom, token]));
    this.lastUpdated = Date.now();

    // Cache for next time
    this.cacheTokens(allTokens);

    return allTokens;
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

  // Get local/custom tokens
  getLocalTokens() {
    // These could be loaded from a local JSON file or API
    return [
      // Add any custom tokens here
    ];
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
