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
  
  &:hover {
    background-color: #f5f5f5;
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
  color: ${props => props.active ? '#007bff' : '#666'};
  border-bottom: 2px solid ${props => props.active ? '#007bff' : 'transparent'};
  font-weight: ${props => props.active ? '600' : '400'};
  
  &:hover {
    color: #007bff;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #666;
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
      const allTokens = await tokenRegistry.loadTokens();
      const lpTokens = tokenRegistry.getAllLPTokens();
      setTokens([...allTokens, ...lpTokens]);
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

    // Sort by balance (if available), then by symbol
    return filtered.sort((a, b) => {
      const balanceA = parseFloat(balances[a.denom] || '0');
      const balanceB = parseFloat(balances[b.denom] || '0');
      
      if (balanceA !== balanceB) {
        return balanceB - balanceA; // Higher balance first
      }
      
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
            active={filter === 'all'} 
            onClick={() => setFilter('all')}
          >
            All
          </FilterTab>
          <FilterTab 
            active={filter === 'native'} 
            onClick={() => setFilter('native')}
          >
            Native
          </FilterTab>
          <FilterTab 
            active={filter === 'ibc'} 
            onClick={() => setFilter('ibc')}
          >
            IBC
          </FilterTab>
          <FilterTab 
            active={filter === 'lp'} 
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
            filteredTokens.map(token => (
              <TokenItem
                key={token.denom}
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
                {balances[token.denom] && (
                  <TokenBalance>
                    {formatBalance(balances[token.denom], token.decimals)}
                  </TokenBalance>
                )}
              </TokenItem>
            ))
          )}
        </TokenList>
      </ModalContent>
    </Modal>
  );
};

export default TokenSelector;
