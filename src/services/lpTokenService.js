// LP Token Service - Manages liquidity provider tokens and positions

import { getTokenRegistry } from './tokenRegistry';

/**
 * Generate a unique LP token identifier for a pool
 */
export function generateLPTokenId(tokenA, tokenB) {
  // Sort tokens to ensure consistent LP token ID regardless of order
  const [sortedA, sortedB] = [tokenA, tokenB].sort();
  return `lp:${sortedA}:${sortedB}`;
}

/**
 * Generate LP token display info
 */
export function generateLPTokenInfo(tokenA, tokenB, liquidityAmount) {
  const tokens = getTokenRegistry();
  const tokenAInfo = tokens.find(t => t.denom === tokenA) || { symbol: tokenA, name: tokenA };
  const tokenBInfo = tokens.find(t => t.denom === tokenB) || { symbol: tokenB, name: tokenB };
  
  const lpTokenId = generateLPTokenId(tokenA, tokenB);
  
  return {
    denom: lpTokenId,
    symbol: `${tokenAInfo.symbol}-${tokenBInfo.symbol} LP`,
    name: `${tokenAInfo.name}/${tokenBInfo.name} Liquidity Pool Token`,
    decimals: 6, // Standard for LP tokens
    balance: liquidityAmount,
    isLPToken: true,
    underlyingTokens: {
      tokenA: tokenAInfo,
      tokenB: tokenBInfo
    },
    // Add visual indicators
    logo_URIs: {
      png: '🏊', // Pool emoji as fallback
      svg: '🏊'
    }
  };
}

/**
 * Fetch user's liquidity positions from the contract
 */
export async function fetchUserLiquidityPositions(client, contractAddress, userAddress) {
  console.log('🏊 Fetching LP positions for user:', userAddress);
  
  try {
    // Get all pools first
    const poolsResponse = await client.queryContractSmart(contractAddress, {
      pools: { limit: 100 }
    });
    
    console.log('📊 Found pools:', poolsResponse.pools?.length || 0);
    
    const lpTokens = [];
    
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
        
        // If user has liquidity in this pool, create LP token
        if (liquidityResponse.liquidity && liquidityResponse.liquidity !== '0') {
          const lpToken = generateLPTokenInfo(
            pool.token_a, 
            pool.token_b, 
            liquidityResponse.liquidity
          );
          
          // Add pool info for calculations
          lpToken.poolInfo = {
            reserve_a: pool.reserve_a,
            reserve_b: pool.reserve_b,
            total_liquidity: pool.total_liquidity,
            share_a: liquidityResponse.share_a,
            share_b: liquidityResponse.share_b
          };
          
          lpTokens.push(lpToken);
          console.log('✅ Added LP token:', lpToken.symbol);
        }
      } catch (error) {
        console.log(`⚠️ No liquidity in pool ${pool.token_a}/${pool.token_b}:`, error.message);
      }
    }
    
    console.log('🏊 Total LP tokens found:', lpTokens.length);
    return lpTokens;
    
  } catch (error) {
    console.error('❌ Error fetching LP positions:', error);
    return [];
  }
}

/**
 * Add LP tokens to the token registry
 */
export function addLPTokensToRegistry(lpTokens) {
  const tokens = getTokenRegistry();
  
  // Remove existing LP tokens
  const filteredTokens = tokens.filter(token => !token.isLPToken);
  
  // Add new LP tokens
  const updatedTokens = [...filteredTokens, ...lpTokens];
  
  console.log('🔄 Updated token registry with LP tokens:', lpTokens.length);
  return updatedTokens;
}

/**
 * Check if a token is an LP token
 */
export function isLPToken(tokenDenom) {
  return tokenDenom && tokenDenom.startsWith('lp:');
}

/**
 * Parse LP token to get underlying tokens
 */
export function parseLPToken(lpTokenDenom) {
  if (!isLPToken(lpTokenDenom)) {
    return null;
  }
  
  const parts = lpTokenDenom.split(':');
  if (parts.length !== 3) {
    return null;
  }
  
  return {
    tokenA: parts[1],
    tokenB: parts[2]
  };
}
