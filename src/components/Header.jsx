import React from 'react';
import styled from 'styled-components';

const HeaderContainer = styled.header`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const Nav = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
`;

const Logo = styled.h1`
  color: white;
  font-size: 1.8rem;
  font-weight: bold;
  margin: 0;
`;

const WalletButton = styled.button`
  background: ${props => props.$connected ? '#10b981' : '#3b82f6'};
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.$connected ? '#059669' : '#2563eb'};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const WalletInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Address = styled.span`
  color: white;
  font-family: monospace;
  font-size: 0.9rem;
`;

const Balance = styled.span`
  color: white;
  font-weight: 500;
`;

const Header = ({ 
  account, 
  isConnecting, 
  isConnected, 
  connectWallet, 
  disconnectWallet, 
  balance 
}) => {
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance) => {
    if (!balance) return '0';
    return `${(parseInt(balance.amount) / 1000000).toFixed(2)} ATOM`;
  };

  return (
    <HeaderContainer>
      <Nav>
        <Logo>🌌 Cosmos DEX</Logo>
        
        <WalletInfo>
          {isConnected && account && (
            <>
              {balance && (
                <Balance>{formatBalance(balance)}</Balance>
              )}
              <Address>{formatAddress(account.address)}</Address>
            </>
          )}
          
          <WalletButton
            $connected={isConnected}
            disabled={isConnecting}
            onClick={isConnected ? disconnectWallet : connectWallet}
          >
            {isConnecting 
              ? 'Connecting...' 
              : isConnected 
                ? 'Disconnect' 
                : 'Connect Keplr'
            }
          </WalletButton>
        </WalletInfo>
      </Nav>
    </HeaderContainer>
  );
};

export default Header;