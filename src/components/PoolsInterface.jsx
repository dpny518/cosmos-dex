import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { tokenRegistry } from '../services/tokenRegistry';
import { config } from '../config';

const Container = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 1000px;
  margin: 0 auto;
`;

const Title = styled.h3`
  margin: 0 0 24px 0;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.5rem;
`;

const PoolsGrid = styled.div`
  display: grid;
  gap: 16px;
`;

const PoolCard = styled.div`
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s;
  background: white;
  
  &:hover {
    border-color: #007bff;
    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
  }
`;

const PoolHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const PoolPair = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const TokenInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TokenLogo = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
`;

const TokenSymbol = styled.span`
  font-weight: 600;
  font-size: 1.1rem;
  color: #333;
`;

const PairSeparator = styled.span`
  color: #666;
  font-size: 1.2rem;
  font-weight: 500;
`;

const PoolStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 16px;
`;

const StatCard = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
`;

const StatLabel = styled.div`
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatValue = styled.div`
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
`;

const StatSubValue = styled.div`
  font-size: 0.9rem;
  color: #666;
  margin-top: 4px;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px;
  color: #666;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #e0e0e0;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 16px;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px;
  color: #666;
`;

const EmptyIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 16px;
  opacity: 0.5;
`;

const EmptyTitle = styled.h4`
  margin: 0 0 8px 0;
  color: #333;
`;

const EmptyDescription = styled.p`
  margin: 0;
  font-size: 0.9rem;
`;

const RefreshButton = styled.button`
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
  
  &:hover {
    background: #0056b3;
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const PoolCount = styled.span`
  color: #666;
  font-size: 0.9rem;
  font-weight: normal;
`;

const formatNumber = (value, decimals = 6) => {
  if (!value || value === '0') return '0';
  const num = parseFloat(value) / Math.pow(10, decimals);
  if (num < 0.000001) return '< 0.000001';
  if (num < 1) return num.toFixed(6);
  if (num < 1000) return num.toFixed(2);
  if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
  return (num / 1000000).toFixed(1) + 'M';
};

const PoolsInterface = ({ dex }) => {
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPools = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🏊 Loading pools...');
      
      if (!dex || !dex.client) {
        throw new Error('DEX client not available');
      }

      const contractAddress = dex.contractAddress || 
                             config.contractAddress ||
                             import.meta.env?.VITE_CONTRACT_ADDRESS;

      if (!contractAddress || contractAddress === 'cosmos1...') {
        throw new Error('Contract address not configured');
      }

      console.log('🔗 Using contract address:', contractAddress);

      // Get all pools from contract
      const poolsResponse = await dex.client.queryContractSmart(contractAddress, {
        pools: { limit: 100 }
      });

      console.log('📊 Raw pools response:', poolsResponse);

      if (!poolsResponse.pools || poolsResponse.pools.length === 0) {
        setPools([]);
        return;
      }

      // Load tokens to get metadata
      await tokenRegistry.loadTokens();

      // Enhance pools with token information
      const enhancedPools = poolsResponse.pools.map(pool => {
        const tokenA = tokenRegistry.getToken(pool.token_a);
        const tokenB = tokenRegistry.getToken(pool.token_b);

        return {
          ...pool,
          tokenA: tokenA || {
            denom: pool.token_a,
            symbol: pool.token_a.includes('ibc/') ? 
              `IBC-${pool.token_a.slice(-8)}` : 
              pool.token_a.slice(0, 8).toUpperCase(),
            name: 'Unknown Token',
            decimals: 6,
            logo: null
          },
          tokenB: tokenB || {
            denom: pool.token_b,
            symbol: pool.token_b.includes('ibc/') ? 
              `IBC-${pool.token_b.slice(-8)}` : 
              pool.token_b.slice(0, 8).toUpperCase(),
            name: 'Unknown Token',
            decimals: 6,
            logo: null
          }
        };
      });

      console.log('✅ Enhanced pools:', enhancedPools);
      setPools(enhancedPools);

    } catch (error) {
      console.error('❌ Error loading pools:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dex) {
      loadPools();
    }
  }, [dex]);

  if (loading) {
    return (
      <Container>
        <Title>🏊 Liquidity Pools</Title>
        <LoadingContainer>
          <LoadingSpinner />
          <span>Loading pools...</span>
        </LoadingContainer>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Title>🏊 Liquidity Pools</Title>
        <EmptyState>
          <EmptyIcon>⚠️</EmptyIcon>
          <EmptyTitle>Error Loading Pools</EmptyTitle>
          <EmptyDescription>{error}</EmptyDescription>
          <div style={{ marginTop: '20px' }}>
            <RefreshButton onClick={loadPools}>
              Try Again
            </RefreshButton>
          </div>
        </EmptyState>
      </Container>
    );
  }

  if (pools.length === 0) {
    return (
      <Container>
        <Title>🏊 Liquidity Pools</Title>
        <EmptyState>
          <EmptyIcon>🏊</EmptyIcon>
          <EmptyTitle>No Pools Found</EmptyTitle>
          <EmptyDescription>
            There are no liquidity pools available yet. Create the first pool in the Liquidity tab!
          </EmptyDescription>
          <div style={{ marginTop: '20px' }}>
            <RefreshButton onClick={loadPools}>
              Refresh
            </RefreshButton>
          </div>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <PoolHeader>
        <Title>
          🏊 Liquidity Pools
          <PoolCount>({pools.length} pool{pools.length !== 1 ? 's' : ''})</PoolCount>
        </Title>
        <HeaderActions>
          <RefreshButton onClick={loadPools} disabled={loading}>
            🔄 Refresh
          </RefreshButton>
        </HeaderActions>
      </PoolHeader>

      <PoolsGrid>
        {pools.map((pool, index) => (
          <PoolCard key={`${pool.token_a}-${pool.token_b}`}>
            <PoolPair>
              <TokenInfo>
                <TokenLogo 
                  src={pool.tokenA.logo || '/default-token-logo.svg'} 
                  alt={pool.tokenA.symbol}
                  onError={(e) => {
                    e.target.src = '/default-token-logo.svg';
                  }}
                />
                <TokenSymbol>{pool.tokenA.symbol}</TokenSymbol>
              </TokenInfo>
              
              <PairSeparator>↔</PairSeparator>
              
              <TokenInfo>
                <TokenLogo 
                  src={pool.tokenB.logo || '/default-token-logo.svg'} 
                  alt={pool.tokenB.symbol}
                  onError={(e) => {
                    e.target.src = '/default-token-logo.svg';
                  }}
                />
                <TokenSymbol>{pool.tokenB.symbol}</TokenSymbol>
              </TokenInfo>
            </PoolPair>

            <PoolStats>
              <StatCard>
                <StatLabel>{pool.tokenA.symbol} Reserve</StatLabel>
                <StatValue>{formatNumber(pool.reserve_a, pool.tokenA.decimals)}</StatValue>
                <StatSubValue>{pool.tokenA.name}</StatSubValue>
              </StatCard>
              
              <StatCard>
                <StatLabel>{pool.tokenB.symbol} Reserve</StatLabel>
                <StatValue>{formatNumber(pool.reserve_b, pool.tokenB.decimals)}</StatValue>
                <StatSubValue>{pool.tokenB.name}</StatSubValue>
              </StatCard>
              
              <StatCard>
                <StatLabel>Total Liquidity</StatLabel>
                <StatValue>{formatNumber(pool.total_liquidity)}</StatValue>
                <StatSubValue>LP Tokens</StatSubValue>
              </StatCard>
              
              <StatCard>
                <StatLabel>Exchange Rate</StatLabel>
                <StatValue>
                  {pool.reserve_a && pool.reserve_b ? 
                    (parseFloat(pool.reserve_b) / parseFloat(pool.reserve_a)).toFixed(4) : 
                    '0'
                  }
                </StatValue>
                <StatSubValue>{pool.tokenB.symbol} per {pool.tokenA.symbol}</StatSubValue>
              </StatCard>
            </PoolStats>
          </PoolCard>
        ))}
      </PoolsGrid>
    </Container>
  );
};

export default PoolsInterface;