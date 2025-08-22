import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';
import { Toaster } from 'react-hot-toast';

import { useKeplr } from './hooks/useKeplr.js';
import { useDex } from './hooks/useDex.js';
import Header from './components/Header.jsx';
import SwapInterface from './components/SwapInterface.jsx';
import LiquidityInterface from './components/LiquidityInterface.jsx';
import PoolsInterface from './components/PoolsInterface.jsx';
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
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
                 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
    background: #0a0b0d;
    min-height: 100vh;
    color: #ffffff;
    overflow-x: hidden;
  }

  #root {
    min-height: 100vh;
  }

  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: #1a1b1e;
  }

  ::-webkit-scrollbar-thumb {
    background: #404040;
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #505050;
  }

  /* Glass effect utilities */
  .glass {
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .gradient-text {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
`;

const AppContainer = styled.div`
  min-height: 100vh;
  background: radial-gradient(ellipse at top, rgba(102, 126, 234, 0.1) 0%, transparent 70%),
              radial-gradient(ellipse at bottom, rgba(118, 75, 162, 0.1) 0%, transparent 70%),
              #0a0b0d;
  position: relative;
  
  &::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.2) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.1) 0%, transparent 50%);
    pointer-events: none;
    z-index: -1;
  }
`;

const Navigation = styled.nav`
  background: rgba(13, 15, 20, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
`;

const NavContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  gap: 0;
  padding: 0 2rem;
  align-items: center;
`;

const NavButton = styled(NavLink)`
  padding: 1.25rem 2rem;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  position: relative;
  border-radius: 0;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    width: 0;
    height: 2px;
    background: linear-gradient(90deg, #667eea, #764ba2);
    transition: all 0.3s ease;
    transform: translateX(-50%);
  }
  
  &:hover {
    color: rgba(255, 255, 255, 0.9);
    background: rgba(255, 255, 255, 0.02);
    
    &::after {
      width: 60%;
    }
  }
  
  &.active {
    color: #ffffff;
    background: rgba(102, 126, 234, 0.1);
    
    &::after {
      width: 80%;
    }
  }
`;

const MainContent = styled.main`
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  position: relative;
  z-index: 1;
`;

const WelcomeCard = styled.div`
  background: rgba(15, 17, 25, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 4rem 3rem;
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
    pointer-events: none;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.3));
    border-radius: 26px;
    z-index: -1;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover::after {
    opacity: 0.5;
  }
`;

const WelcomeTitle = styled.h1`
  color: #ffffff;
  margin-bottom: 1.5rem;
  font-size: 3.5rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  position: relative;
  z-index: 1;
`;

const WelcomeDescription = styled.p`
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.2rem;
  line-height: 1.7;
  margin-bottom: 3rem;
  font-weight: 400;
  position: relative;
  z-index: 1;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-top: 3rem;
  position: relative;
  z-index: 1;
`;

const FeatureCard = styled.div`
  background: rgba(20, 23, 31, 0.6);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: 2rem 1.5rem;
  border-radius: 16px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.02) 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover {
    transform: translateY(-4px);
    border-color: rgba(102, 126, 234, 0.3);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    
    &::before {
      opacity: 1;
    }
  }
`;

const FeatureIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 1rem;
  filter: grayscale(0.2);
  transition: filter 0.3s ease;
  
  ${FeatureCard}:hover & {
    filter: grayscale(0);
  }
`;

const FeatureTitle = styled.h3`
  color: #ffffff;
  margin-bottom: 0.75rem;
  font-size: 1.1rem;
  font-weight: 700;
`;

const FeatureDescription = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  line-height: 1.5;
`;

const ContractInfo = styled.div`
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 2rem;
  text-align: center;
  color: #fbbf24;
  font-weight: 500;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
`;

const ConnectButton = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1rem 2.5rem;
  border-radius: 16px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  margin-bottom: 3rem;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(102, 126, 234, 0.4);
    
    &::before {
      left: 100%;
    }
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
    
    &:hover {
      box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
    }
  }
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
            <NavButton to="/pools">
              Pools
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
                  <ConnectButton
                    onClick={connectWallet}
                    disabled={isConnecting}
                  >
                    {isConnecting ? '⏳ Connecting...' : '🔗 Connect Keplr Wallet'}
                  </ConnectButton>
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
                    <FeatureIcon>🏊</FeatureIcon>
                    <FeatureTitle>Pool Overview</FeatureTitle>
                    <FeatureDescription>
                      View all liquidity pools and their stats
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
            
            <Route path="/pools" element={
              <PoolsInterface 
                dex={dex}
              />
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