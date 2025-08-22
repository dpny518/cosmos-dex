import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { toast } from 'react-hot-toast';
import TokenSelector from './TokenSelector';
import { tokenRegistry } from '../services/tokenRegistry';

const Container = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  margin: 0 auto;
`;

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 24px;
  background: #f3f4f6;
  border-radius: 12px;
  padding: 4px;
`;

const Tab = styled.button`
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: ${props => props.$active ? 'white' : 'transparent'};
  color: ${props => props.$active ? '#1f2937' : '#6b7280'};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    color: #1f2937;
  }
`;

const Title = styled.h3`
  margin: 0 0 20px 0;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TokenPairContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 16px;
  align-items: center;
  margin-bottom: 24px;
`;

const TokenInputCard = styled.div`
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 16px;
  background: white;
  transition: border-color 0.2s;
  
  &:focus-within {
    border-color: #007bff;
  }
`;

const TokenHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const TokenButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #e9ecef;
  }
`;

const TokenLogo = styled.img`
  width: 20px;
  height: 20px;
  border-radius: 50%;
`;

const Balance = styled.div`
  font-size: 14px;
  color: #666;
  text-align: right;
`;

const AmountInput = styled.input`
  width: 100%;
  padding: 12px 0;
  border: none;
  font-size: 18px;
  font-weight: 600;
  background: transparent;
  
  &:focus {
    outline: none;
  }
  
  &::placeholder {
    color: #ccc;
  }
`;

const PlusIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #666;
`;

const PoolInfo = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
  font-size: 14px;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const ActionButton = styled.button`
  width: 100%;
  padding: 16px;
  background: ${props => props.disabled ? '#ccc' : '#007bff'};
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: background-color 0.2s;
  margin-top: 16px;
  
  &:hover {
    background: ${props => props.disabled ? '#ccc' : '#0056b3'};
  }
`;

const LiquidityList = styled.div`
  margin-top: 24px;
`;

const LiquidityItem = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const LiquidityInfo = styled.div`
  flex: 1;
`;

const LiquidityPair = styled.div`
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
`;

const LiquidityAmount = styled.div`
  font-size: 14px;
  color: #666;
`;

const RemoveButton = styled.button`
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    background: #c82333;
  }
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const RemoveContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const PositionSelector = styled.div`
  margin-bottom: 24px;
`;

const PositionCard = styled.div`
  border: 2px solid ${props => props.$selected ? '#3b82f6' : '#e5e7eb'};
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: #3b82f6;
  }
`;

const SliderContainer = styled.div`
  margin: 24px 0;
`;

const SliderLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 600;
  color: #374151;
`;

const PercentageDisplay = styled.span`
  color: #3b82f6;
  font-size: 1.2em;
  font-weight: 700;
`;

const Slider = styled.input`
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: #e5e7eb;
  outline: none;
  appearance: none;
  margin: 12px 0;
  
  &::-webkit-slider-thumb {
    appearance: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }
  
  &::-moz-range-thumb {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }
`;

const QuickButtons = styled.div`
  display: flex;
  gap: 8px;
  margin: 12px 0;
`;

const QuickButton = styled.button`
  background: ${props => props.$active ? '#3b82f6' : '#f3f4f6'};
  color: ${props => props.$active ? 'white' : '#374151'};
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  flex: 1;
  
  &:hover {
    background: ${props => props.$active ? '#2563eb' : '#e5e7eb'};
  }
`;

const BreakdownContainer = styled.div`
  background: #f9fafb;
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
`;

const BreakdownTitle = styled.h4`
  margin: 0 0 16px 0;
  color: #374151;
  font-size: 1.1rem;
`;

const BreakdownRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #e5e7eb;
  
  &:last-child {
    border-bottom: none;
  }
`;

const TokenReceive = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TokenAmount = styled.span`
  font-weight: 600;
  color: #059669;
`;

const LiquidityInterface = ({ dex, balances = {} }) => {
  const [activeTab, setActiveTab] = useState('add');
  const [tokenA, setTokenA] = useState(null);
  const [tokenB, setTokenB] = useState(null);
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [selectingFor, setSelectingFor] = useState(null);
  const [poolInfo, setPoolInfo] = useState(null);
  const [userLiquidity, setUserLiquidity] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [removePercentage, setRemovePercentage] = useState(50);

  useEffect(() => {
    // Load tokens including those from user balances
    const loadTokens = async () => {
      const tokens = await tokenRegistry.loadTokens(balances);
      if (tokens.length > 0 && !tokenA) {
        const atomToken = tokens.find(t => t.symbol === 'ATOM') || tokens[0];
        setTokenA(atomToken);
      }
      
      // Load user's LP tokens for remove liquidity
      const lpTokens = tokenRegistry.getAllLPTokens().filter(lp => 
        lp.balance && lp.balance !== '0'
      );
      
      const liquidityPositions = lpTokens.map(lpToken => ({
        pair: lpToken.symbol,
        amount: (parseFloat(lpToken.balance) / Math.pow(10, lpToken.decimals)).toFixed(6),
        lpToken,
        poolInfo: lpToken.poolInfo
      }));
      
      setUserLiquidity(liquidityPositions);
      console.log('🏊 Loaded LP positions:', liquidityPositions);
    };
    loadTokens();
  }, [balances]);

  const loadPoolInfo = useCallback(async () => {
    if (!dex || !tokenA || !tokenB) {
      setPoolInfo(null);
      return;
    }
    
    try {
      const pool = await dex.getPool(tokenA.denom, tokenB.denom);
      setPoolInfo(pool);
    } catch (error) {
      // Pool not found is expected when pools don't exist yet
      if (error.message?.includes('Pool not found')) {
        setPoolInfo(null);
      } else {
        console.error('Failed to load pool info:', error);
        setPoolInfo(null);
      }
    }
  }, [dex, tokenA, tokenB]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (tokenA && tokenB && dex) {
        loadPoolInfo();
      }
    }, 300); // Debounce by 300ms
    
    return () => clearTimeout(timer);
  }, [tokenA, tokenB, dex, loadPoolInfo]);

  const handleTokenSelect = (token) => {
    if (selectingFor === 'A') {
      setTokenA(token);
    } else if (selectingFor === 'B') {
      setTokenB(token);
    }
    setShowTokenSelector(false);
    setSelectingFor(null);
  };

  const handleMaxClick = (tokenType) => {
    const token = tokenType === 'A' ? tokenA : tokenB;
    if (token && balances[token.denom]) {
      const balance = parseFloat(balances[token.denom]) / Math.pow(10, token.decimals);
      if (tokenType === 'A') {
        setAmountA(balance.toString());
      } else {
        setAmountB(balance.toString());
      }
    }
  };

  const addLiquidity = async () => {
    if (!dex || !tokenA || !tokenB || !amountA || !amountB) return;
    
    setLoading(true);
    try {
      const amountAWei = Math.floor(parseFloat(amountA) * Math.pow(10, tokenA.decimals)).toString();
      const amountBWei = Math.floor(parseFloat(amountB) * Math.pow(10, tokenB.decimals)).toString();
      const minLiquidity = '1000'; // Minimum LP tokens to receive
      
      await dex.addLiquidity(tokenA.denom, tokenB.denom, amountAWei, amountBWei, minLiquidity);
      
      toast.success('Liquidity added successfully!');
      setAmountA('');
      setAmountB('');
      loadPoolInfo();
    } catch (error) {
      console.error('Add liquidity failed:', error);
      toast.error('Add liquidity failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createPool = async () => {
    if (!dex || !tokenA || !tokenB || !amountA || !amountB) return;
    
    // Check balances before creating pool
    const balanceA = balances[tokenA.denom] || '0';
    const balanceB = balances[tokenB.denom] || '0';
    const amountAWei = Math.floor(parseFloat(amountA) * Math.pow(10, tokenA.decimals)).toString();
    const amountBWei = Math.floor(parseFloat(amountB) * Math.pow(10, tokenB.decimals)).toString();
    
    if (parseInt(balanceA) < parseInt(amountAWei)) {
      toast.error(`Insufficient ${tokenA.symbol} balance. You have ${(parseInt(balanceA) / Math.pow(10, tokenA.decimals)).toFixed(2)} but need ${amountA}`);
      return;
    }
    
    if (parseInt(balanceB) < parseInt(amountBWei)) {
      toast.error(`Insufficient ${tokenB.symbol} balance. You have ${(parseInt(balanceB) / Math.pow(10, tokenB.decimals)).toFixed(2)} but need ${amountB}`);
      return;
    }
    
    setLoading(true);
    try {
      await dex.createPool(tokenA.denom, tokenB.denom, amountAWei, amountBWei);
      
      toast.success('Pool created successfully!');
      setAmountA('');
      setAmountB('');
      loadPoolInfo();
    } catch (error) {
      console.error('Create pool failed:', error);
      
      // Extract meaningful error message
      let errorMessage = error.message;
      if (errorMessage.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds to create pool. Please check your token balances.';
      } else if (errorMessage.includes('spendable balance')) {
        const match = errorMessage.match(/spendable balance (\d+).*? is smaller than (\d+)/);
        if (match) {
          const [, available, required] = match;
          errorMessage = `Insufficient balance: you have ${(parseInt(available) / 1000000).toFixed(2)} but need ${(parseInt(required) / 1000000).toFixed(2)}`;
        }
      }
      
      toast.error('Create pool failed: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const removeLiquidity = async (lpToken, percentage = 100) => {
    if (!dex || !lpToken) return;
    
    setLoading(true);
    try {
      const liquidityAmount = Math.floor(parseFloat(lpToken.balance) * percentage / 100).toString();
      
      await dex.removeLiquidity(
        lpToken.pair.tokenA.denom,
        lpToken.pair.tokenB.denom,
        liquidityAmount
      );
      
      toast.success(`Successfully removed ${percentage}% liquidity!`);
      
      // Refresh LP tokens
      setTimeout(() => {
        window.location.reload(); // Simple refresh for now
      }, 1000);
      
    } catch (error) {
      console.error('Remove liquidity failed:', error);
      toast.error('Remove liquidity failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateRemovalBreakdown = (position, percentage) => {
    if (!position || !position.poolInfo) return null;
    
    const { poolInfo, lpToken } = position;
    const userLPBalance = parseFloat(lpToken.balance);
    const totalLiquidity = parseFloat(poolInfo.total_liquidity);
    const userShare = userLPBalance / totalLiquidity;
    
    // Calculate proportional amounts
    const tokenAReceive = (parseFloat(poolInfo.reserve_a) * userShare * percentage / 100) / Math.pow(10, lpToken.pair.tokenA.decimals);
    const tokenBReceive = (parseFloat(poolInfo.reserve_b) * userShare * percentage / 100) / Math.pow(10, lpToken.pair.tokenB.decimals);
    const lpTokensToRemove = (userLPBalance * percentage / 100) / Math.pow(10, lpToken.decimals);
    
    return {
      tokenA: {
        symbol: lpToken.pair.tokenA.symbol,
        amount: tokenAReceive.toFixed(6)
      },
      tokenB: {
        symbol: lpToken.pair.tokenB.symbol,
        amount: tokenBReceive.toFixed(6)
      },
      lpTokensRemoved: lpTokensToRemove.toFixed(6)
    };
  };

  const handleQuickPercentage = (percentage) => {
    setRemovePercentage(percentage);
  };

  const canAddLiquidity = tokenA && tokenB && amountA && amountB && parseFloat(amountA) > 0 && parseFloat(amountB) > 0;
  const poolExists = poolInfo && poolInfo.reserve_a && poolInfo.reserve_b;

  return (
    <Container>
      <TabContainer>
        <Tab 
          $active={activeTab === 'add'} 
          onClick={() => setActiveTab('add')}
        >
          Add Liquidity
        </Tab>
        <Tab 
          $active={activeTab === 'remove'} 
          onClick={() => setActiveTab('remove')}
        >
          Remove Liquidity
        </Tab>
      </TabContainer>

      {activeTab === 'add' && (
        <>
          <Title>
            💧 Add Liquidity
          </Title>
          
          <div style={{ 
            background: '#d1ecf1', 
            border: '1px solid #bee5eb', 
            borderRadius: '8px', 
            padding: '12px', 
            marginBottom: '20px',
            color: '#0c5460'
          }}>
            🎉 <strong>New!</strong> This DEX now supports native tokens (ATOM), IBC tokens (like USDC), and CW20 tokens. Create pools with any supported token combination!
          </div>

          <TokenPairContainer>
            <TokenInputCard>
              <TokenHeader>
                <TokenButton onClick={() => {
                  setSelectingFor('A');
                  setShowTokenSelector(true);
                }}>
                  {tokenA ? (
                    <>
                      <TokenLogo 
                        src={tokenA.logo || '/default-token-logo.svg'} 
                        alt={tokenA.symbol}
                        onError={(e) => {
                          e.target.src = '/default-token-logo.svg';
                        }}
                      />
                      {tokenA.symbol}
                    </>
                  ) : (
                    'Select Token A'
                  )}
                </TokenButton>
                <Balance>
                  Balance: {tokenA && balances[tokenA.denom] 
                    ? (parseFloat(balances[tokenA.denom]) / Math.pow(10, tokenA.decimals)).toFixed(6)
                    : '0'
                  }
                  {tokenA && balances[tokenA.denom] && (
                    <button 
                      onClick={() => handleMaxClick('A')}
                      style={{ marginLeft: '8px', color: '#007bff', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      MAX
                    </button>
                  )}
                </Balance>
              </TokenHeader>
              <AmountInput
                type="number"
                placeholder="0.0"
                value={amountA}
                onChange={(e) => setAmountA(e.target.value)}
              />
            </TokenInputCard>

            <PlusIcon>+</PlusIcon>

            <TokenInputCard>
              <TokenHeader>
                <TokenButton onClick={() => {
                  setSelectingFor('B');
                  setShowTokenSelector(true);
                }}>
                  {tokenB ? (
                    <>
                      <TokenLogo 
                        src={tokenB.logo || '/default-token-logo.svg'} 
                        alt={tokenB.symbol}
                        onError={(e) => {
                          e.target.src = '/default-token-logo.svg';
                        }}
                      />
                      {tokenB.symbol}
                    </>
                  ) : (
                    'Select Token B'
                  )}
                </TokenButton>
                <Balance>
                  Balance: {tokenB && balances[tokenB.denom] 
                    ? (parseFloat(balances[tokenB.denom]) / Math.pow(10, tokenB.decimals)).toFixed(6)
                    : '0'
                  }
                  {tokenB && balances[tokenB.denom] && (
                    <button 
                      onClick={() => handleMaxClick('B')}
                      style={{ marginLeft: '8px', color: '#007bff', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      MAX
                    </button>
                  )}
                </Balance>
              </TokenHeader>
              <AmountInput
                type="number"
                placeholder="0.0"
                value={amountB}
                onChange={(e) => setAmountB(e.target.value)}
              />
            </TokenInputCard>
          </TokenPairContainer>

          {poolInfo && (
            <PoolInfo>
              <InfoRow>
                <span>Pool exists:</span>
                <span>{poolExists ? 'Yes' : 'No'}</span>
              </InfoRow>
              {poolExists && (
                <>
                  <InfoRow>
                    <span>{tokenA?.symbol} Reserve:</span>
                    <span>{(parseFloat(poolInfo.reserve_a) / Math.pow(10, tokenA?.decimals || 6)).toFixed(6)}</span>
                  </InfoRow>
                  <InfoRow>
                    <span>{tokenB?.symbol} Reserve:</span>
                    <span>{(parseFloat(poolInfo.reserve_b) / Math.pow(10, tokenB?.decimals || 6)).toFixed(6)}</span>
                  </InfoRow>
                  <InfoRow>
                    <span>Total Liquidity:</span>
                    <span>{(parseFloat(poolInfo.total_liquidity) / Math.pow(10, 6)).toFixed(6)}</span>
                  </InfoRow>
                </>
              )}
            </PoolInfo>
          )}

          <ActionButton
            disabled={!canAddLiquidity || loading}
            onClick={poolExists ? addLiquidity : createPool}
          >
            {loading ? 'Processing...' : poolExists ? 'Add Liquidity' : 'Create Pool'}
          </ActionButton>
        </>
      )}

      {activeTab === 'remove' && (
        <>
          <Title>
            🔥 Remove Liquidity
          </Title>
          
          {userLiquidity.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              No liquidity positions found
            </div>
          ) : (
            <RemoveContainer>
              <PositionSelector>
                <h4 style={{ marginBottom: '16px', color: '#374151' }}>Select Position</h4>
                {userLiquidity.map((position, index) => (
                  <PositionCard 
                    key={index}
                    $selected={selectedPosition === index}
                    onClick={() => setSelectedPosition(index)}
                  >
                    <LiquidityInfo>
                      <LiquidityPair>{position.pair}</LiquidityPair>
                      <LiquidityAmount>Liquidity: {position.amount}</LiquidityAmount>
                    </LiquidityInfo>
                  </PositionCard>
                ))}
              </PositionSelector>

              {selectedPosition !== null && (
                <>
                  <SliderContainer>
                    <SliderLabel>
                      <span>Amount to Remove</span>
                      <PercentageDisplay>{removePercentage}%</PercentageDisplay>
                    </SliderLabel>
                    
                    <Slider
                      type="range"
                      min="1"
                      max="100"
                      value={removePercentage}
                      onChange={(e) => setRemovePercentage(Number(e.target.value))}
                    />
                    
                    <QuickButtons>
                      <QuickButton 
                        $active={removePercentage === 25}
                        onClick={() => handleQuickPercentage(25)}
                      >
                        25%
                      </QuickButton>
                      <QuickButton 
                        $active={removePercentage === 50}
                        onClick={() => handleQuickPercentage(50)}
                      >
                        50%
                      </QuickButton>
                      <QuickButton 
                        $active={removePercentage === 75}
                        onClick={() => handleQuickPercentage(75)}
                      >
                        75%
                      </QuickButton>
                      <QuickButton 
                        $active={removePercentage === 100}
                        onClick={() => handleQuickPercentage(100)}
                      >
                        100%
                      </QuickButton>
                    </QuickButtons>
                  </SliderContainer>

                  {calculateRemovalBreakdown(userLiquidity[selectedPosition], removePercentage) && (
                    <BreakdownContainer>
                      <BreakdownTitle>You will receive:</BreakdownTitle>
                      
                      {(() => {
                        const breakdown = calculateRemovalBreakdown(userLiquidity[selectedPosition], removePercentage);
                        return (
                          <>
                            <BreakdownRow>
                              <TokenReceive>
                                <span>{breakdown.tokenA.symbol}</span>
                              </TokenReceive>
                              <TokenAmount>{breakdown.tokenA.amount}</TokenAmount>
                            </BreakdownRow>
                            
                            <BreakdownRow>
                              <TokenReceive>
                                <span>{breakdown.tokenB.symbol}</span>
                              </TokenReceive>
                              <TokenAmount>{breakdown.tokenB.amount}</TokenAmount>
                            </BreakdownRow>
                            
                            <BreakdownRow>
                              <span style={{ color: '#6b7280' }}>LP Tokens to Remove</span>
                              <span style={{ color: '#6b7280' }}>{breakdown.lpTokensRemoved}</span>
                            </BreakdownRow>
                          </>
                        );
                      })()}
                    </BreakdownContainer>
                  )}

                  <RemoveButton 
                    onClick={() => removeLiquidity(userLiquidity[selectedPosition].lpToken, removePercentage)}
                    disabled={loading}
                    style={{ 
                      width: '100%', 
                      padding: '12px',
                      fontSize: '16px',
                      fontWeight: '600'
                    }}
                  >
                    {loading ? 'Removing...' : `Remove ${removePercentage}% Liquidity`}
                  </RemoveButton>
                </>
              )}
            </RemoveContainer>
          )}
        </>
      )}

      <TokenSelector
        isOpen={showTokenSelector}
        onClose={() => {
          setShowTokenSelector(false);
          setSelectingFor(null);
        }}
        onSelect={handleTokenSelect}
        balances={balances}
      />
    </Container>
  );
};

export default LiquidityInterface;
