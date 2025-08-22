import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';
import { Toaster } from 'react-hot-toast';

import { useKeplr } from './hooks/useKeplr.js';
import { useDex } from './hooks/useDex.js';
import Header from './components/Header.jsx';
import SwapInterface from './components/SwapInterface.jsx';
import LiquidityInterface from './components/LiquidityInterface.jsx';
import TokenLaunchpad from './components/TokenLaunchpad.jsx';
import { config } from './config';

// Import tokenRegistry for LP token balance updates
import tokenRegistryService from './services/tokenRegistry.js';

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
                 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 
                 'Helvetica Neue', sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
  }

  #root {
    min-height: 100vh;
  }
`;

const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f2f5 0%, #e6e9f0 100%);
`;

const Navigation = styled.nav`
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
`;

const NavContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  gap: 2rem;
  padding: 1rem 2rem;
`;

const NavButton = styled(NavLink)`
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  color: #6b7280;
  font-weight: 500;
  transition: all 0.2s;
  
  &:hover {
    color: #3b82f6;
    background: #f3f4f6;
  }
  
  &.active {
    color: #3b82f6;
    background: #dbeafe;
  }
`;

const MainContent = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem 2rem;
`;

const WelcomeCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 3rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
`;

const WelcomeTitle = styled.h1`
  color: #1f2937;
  margin-bottom: 1rem;
  font-size: 2.5rem;
`;

const WelcomeDescription = styled.p`
  color: #6b7280;
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 2rem;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 2rem;
`;

const FeatureCard = styled.div`
  background: #f9fafb;
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
`;

const FeatureIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 0.5rem;
`;

const FeatureTitle = styled.h3`
  color: #1f2937;
  margin-bottom: 0.5rem;
`;

const FeatureDescription = styled.p`
  color: #6b7280;
  font-size: 0.9rem;
`;

const ContractInfo = styled.div`
  background: #fef3c7;
  border: 1px solid #fbbf24;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 2rem;
  text-align: center;
`;

function App() {
  const { account, client, isConnecting, connectWallet, disconnectWallet, isConnected, getBalance, getAllBalances } = useKeplr();
  const dex = useDex(client, account);
  const [balance, setBalance] = useState(null);
  const [allBalances, setAllBalances] = useState({});

  useEffect(() => {
    const fetchBalances = async () => {
      if (account && getBalance && getAllBalances) {
        // Get ATOM balance for display
        const atomBalance = await getBalance(account.address);
        setBalance(atomBalance);
        
        // Get all balances for token detection
        const balances = await getAllBalances(account.address);
        setAllBalances(balances);
        
        // Update LP token balances if we have a client and contract
        if (client && config.contractAddress && config.contractAddress !== 'cosmos1...' && tokenRegistryService) {
          try {
            await tokenRegistryService.updateLPTokenBalances(client, config.contractAddress, account.address);
            console.log('✅ LP token balances updated');
          } catch (error) {
            console.error('❌ Error updating LP token balances:', error);
          }
        }
      }
    };

    fetchBalances();
  }, [account, getBalance, getAllBalances, client]);

  const handleGetBalance = async (address) => {
    const atomBalance = await getBalance(address);
    setBalance(atomBalance);
    
    const balances = await getAllBalances(address);
    setAllBalances(balances);
    
    return atomBalance;
  };

  return (
    <Router>
      <GlobalStyle />
      <AppContainer>
        <Header
          account={account}
          isConnecting={isConnecting}
          isConnected={isConnected}
          connectWallet={connectWallet}
          disconnectWallet={disconnectWallet}
          balance={balance}
        />

        {config.contractAddress === 'cosmos1...' && (
          <div style={{ padding: '0 2rem' }}>
            <ContractInfo>
              ⚠️ Contract not deployed yet. Please run deployment scripts first.
            </ContractInfo>
          </div>
        )}

        <Navigation>
          <NavContainer>
            <NavButton to="/" end>
              Home
            </NavButton>
            <NavButton to="/swap">
              Swap
            </NavButton>
            <NavButton to="/liquidity">
              Liquidity
            </NavButton>
            <NavButton to="/launchpad">
              🚀 Token Launchpad
            </NavButton>
          </NavContainer>
        </Navigation>

        <MainContent>
          <Routes>
            <Route path="/" element={
              <WelcomeCard>
                <WelcomeTitle>🌌 Cosmos DEX</WelcomeTitle>
                <WelcomeDescription>
                  Welcome to the Cosmos Hub Decentralized Exchange. 
                  Trade tokens, provide liquidity, and earn fees on the Cosmos network.
                </WelcomeDescription>
                
                {!isConnected && (
                  <button
                    onClick={connectWallet}
                    disabled={isConnecting}
                    style={{
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      padding: '1rem 2rem',
                      borderRadius: '8px',
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      marginBottom: '2rem'
                    }}
                  >
                    {isConnecting ? 'Connecting...' : 'Connect Keplr Wallet'}
                  </button>
                )}

                <FeatureGrid>
                  <FeatureCard>
                    <FeatureIcon>💱</FeatureIcon>
                    <FeatureTitle>Token Swaps</FeatureTitle>
                    <FeatureDescription>
                      Swap tokens instantly with minimal slippage
                    </FeatureDescription>
                  </FeatureCard>
                  
                  <FeatureCard>
                    <FeatureIcon>💧</FeatureIcon>
                    <FeatureTitle>Liquidity Pools</FeatureTitle>
                    <FeatureDescription>
                      Provide liquidity and earn trading fees
                    </FeatureDescription>
                  </FeatureCard>
                  
                  <FeatureCard>
                    <FeatureIcon>🔒</FeatureIcon>
                    <FeatureTitle>Secure</FeatureTitle>
                    <FeatureDescription>
                      Built on CosmWasm smart contracts
                    </FeatureDescription>
                  </FeatureCard>
                </FeatureGrid>
              </WelcomeCard>
            } />
            
            <Route path="/swap" element={
              <SwapInterface 
                dex={dex} 
                balances={allBalances}
              />
            } />
            
            <Route path="/liquidity" element={
              <LiquidityInterface 
                dex={dex} 
                balances={allBalances}
              />
            } />
            
            <Route path="/launchpad" element={
              <TokenLaunchpad />
            } />
          </Routes>
        </MainContent>

        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1f2937',
              color: 'white',
            },
          }}
        />
      </AppContainer>
    </Router>
  );
}

export default App;