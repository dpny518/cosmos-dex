import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { tokenRegistry } from '../services/tokenRegistry';

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h3`
  margin: 0;
  color: #333;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  
  &:hover {
    color: #333;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  margin-bottom: 16px;
  
  &:focus {
    outline: none;
    border-color: #007bff;
  }
`;

const TokenList = styled.div`
  flex: 1;
  overflow-y: auto;
  margin: -8px;
  padding: 8px;
`;

const TokenItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-left: ${props => props.$hasBalance ? '3px solid #007bff' : '3px solid transparent'};
  background-color: ${props => props.$hasBalance ? '#f8f9ff' : 'transparent'};
  
  &:hover {
    background-color: ${props => props.$hasBalance ? '#e6f3ff' : '#f5f5f5'};
  }
`;

const TokenLogo = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-right: 12px;
  background-color: #f0f0f0;
`;

const TokenInfo = styled.div`
  flex: 1;
`;

const TokenSymbol = styled.div`
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
`;

const TokenName = styled.div`
  font-size: 14px;
  color: #666;
`;

const TokenDenom = styled.div`
  font-size: 12px;
  color: #999;
  font-family: monospace;
`;

const TokenBalance = styled.div`
  text-align: right;
  color: #333;
  font-weight: 500;
`;

const FilterTabs = styled.div`
  display: flex;
  margin-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
`;

const FilterTab = styled.button`
  background: none;
  border: none;
  padding: 8px 16px;
  cursor: pointer;
  color: ${props => props.$active ? '#007bff' : '#666'};
  border-bottom: 2px solid ${props => props.$active ? '#007bff' : 'transparent'};
  font-weight: ${props => props.$active ? '600' : '400'};
  
  &:hover {
    color: #007bff;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #666;
`;

const SectionHeader = styled.div`
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #666;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const NoResults = styled.div`
  text-align: center;
  padding: 40px;
  color: #666;
`;

const TokenSelector = ({ isOpen, onClose, onSelect, selectedToken, balances = {} }) => {
  const [tokens, setTokens] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, native, ibc, lp
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadTokens();
    }
  }, [isOpen]);

  const loadTokens = async () => {
    setLoading(true);
    try {
      console.log('🔄 TokenSelector: Loading tokens with balances:', balances);
      const allTokens = await tokenRegistry.loadTokens(balances);
      const lpTokens = tokenRegistry.getAllLPTokens();
      const combinedTokens = [...allTokens, ...lpTokens];
      
      console.log('📋 TokenSelector: All tokens loaded:', combinedTokens.length);
      console.log('🔍 TokenSelector: Token list:', combinedTokens.map(t => ({
        symbol: t.symbol,
        denom: t.denom,
        type: t.type
      })));
      
      setTokens(combinedTokens);
    } catch (error) {
      console.error('Failed to load tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTokens = useMemo(() => {
    let filtered = tokens;

    // Apply filter
    if (filter === 'native') {
      filtered = filtered.filter(token => token.native || token.type === 'native');
    } else if (filter === 'ibc') {
      filtered = filtered.filter(token => token.ibc || token.traces?.length > 0);
    } else if (filter === 'lp') {
      filtered = filtered.filter(token => token.type === 'lp');
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(token =>
        token.symbol.toLowerCase().includes(query) ||
        token.name.toLowerCase().includes(query) ||
        token.denom.toLowerCase().includes(query)
      );
    }

    // Sort by balance (tokens with balance first), then by symbol
    return filtered.sort((a, b) => {
      const balanceA = parseFloat(balances[a.denom] || '0');
      const balanceB = parseFloat(balances[b.denom] || '0');
      
      // First, sort by whether they have a balance (non-zero balance first)
      const hasBalanceA = balanceA > 0;
      const hasBalanceB = balanceB > 0;
      
      if (hasBalanceA && !hasBalanceB) return -1; // A has balance, B doesn't - A first
      if (!hasBalanceA && hasBalanceB) return 1;  // B has balance, A doesn't - B first
      
      // If both have balances or both don't have balances, sort by balance amount
      if (hasBalanceA && hasBalanceB) {
        if (balanceA !== balanceB) {
          return balanceB - balanceA; // Higher balance first
        }
      }
      
      // Finally, sort alphabetically by symbol
      return a.symbol.localeCompare(b.symbol);
    });
  }, [tokens, searchQuery, filter, balances]);

  const handleTokenSelect = (token) => {
    onSelect(token);
    onClose();
  };

  const formatBalance = (balance, decimals = 6) => {
    if (!balance || balance === '0') return '0';
    const num = parseFloat(balance) / Math.pow(10, decimals);
    return num.toLocaleString(undefined, { maximumFractionDigits: 6 });
  };

  if (!isOpen) return null;

  return (
    <Modal onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <Header>
          <Title>Select Token</Title>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </Header>

        <SearchInput
          type="text"
          placeholder="Search tokens..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
        />

        <FilterTabs>
          <FilterTab 
            $active={filter === 'all'} 
            onClick={() => setFilter('all')}
          >
            All
          </FilterTab>
          <FilterTab 
            $active={filter === 'native'} 
            onClick={() => setFilter('native')}
          >
            Native
          </FilterTab>
          <FilterTab 
            $active={filter === 'ibc'} 
            onClick={() => setFilter('ibc')}
          >
            IBC
          </FilterTab>
          <FilterTab 
            $active={filter === 'lp'} 
            onClick={() => setFilter('lp')}
          >
            LP Tokens
          </FilterTab>
        </FilterTabs>

        <TokenList>
          {loading ? (
            <LoadingMessage>Loading tokens...</LoadingMessage>
          ) : filteredTokens.length === 0 ? (
            <NoResults>
              {searchQuery ? 'No tokens found' : 'No tokens available'}
            </NoResults>
          ) : (
            (() => {
              // Separate tokens with and without balances
              const tokensWithBalance = filteredTokens.filter(token => {
                const balance = balances[token.denom];
                return balance && parseFloat(balance) > 0;
              });
              
              const tokensWithoutBalance = filteredTokens.filter(token => {
                const balance = balances[token.denom];
                return !balance || parseFloat(balance) === 0;
              });

              return (
                <>
                  {tokensWithBalance.length > 0 && (
                    <>
                      <SectionHeader>Your Tokens</SectionHeader>
                      {tokensWithBalance.map(token => {
                        const balance = balances[token.denom];
                        return (
                          <TokenItem
                            key={token.denom}
                            $hasBalance={true}
                            onClick={() => handleTokenSelect(token)}
                          >
                            <TokenLogo
                              src={token.logo || '/default-token-logo.svg'}
                              alt={token.symbol}
                              onError={(e) => {
                                e.target.src = '/default-token-logo.svg';
                              }}
                            />
                            <TokenInfo>
                              <TokenSymbol>{token.symbol}</TokenSymbol>
                              <TokenName>{token.name}</TokenName>
                              <TokenDenom>{token.denom}</TokenDenom>
                            </TokenInfo>
                            <TokenBalance>
                              {formatBalance(balance, token.decimals)}
                            </TokenBalance>
                          </TokenItem>
                        );
                      })}
                    </>
                  )}
                  
                  {tokensWithoutBalance.length > 0 && (
                    <>
                      <SectionHeader>All Tokens</SectionHeader>
                      {tokensWithoutBalance.map(token => (
                        <TokenItem
                          key={token.denom}
                          $hasBalance={false}
                          onClick={() => handleTokenSelect(token)}
                        >
                          <TokenLogo
                            src={token.logo || '/default-token-logo.svg'}
                            alt={token.symbol}
                            onError={(e) => {
                              e.target.src = '/default-token-logo.svg';
                            }}
                          />
                          <TokenInfo>
                            <TokenSymbol>{token.symbol}</TokenSymbol>
                            <TokenName>{token.name}</TokenName>
                            <TokenDenom>{token.denom}</TokenDenom>
                          </TokenInfo>
                        </TokenItem>
                      ))}
                    </>
                  )}
                </>
              );
            })()
          )}
        </TokenList>
      </ModalContent>
    </Modal>
  );
};

export default TokenSelector;
