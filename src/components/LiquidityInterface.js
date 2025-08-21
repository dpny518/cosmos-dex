import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import toast from 'react-hot-toast';

const LiquidityContainer = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  margin: 0 auto;
`;

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 2rem;
  background: #f3f4f6;
  border-radius: 12px;
  padding: 4px;
`;

const Tab = styled.button`
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  background: ${props => props.active ? 'white' : 'transparent'};
  color: ${props => props.active ? '#1f2937' : '#6b7280'};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: ${props => props.active ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'};
`;

const Title = styled.h2`
  color: #1f2937;
  margin-bottom: 1.5rem;
  text-align: center;
`;

const TokenPairContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const TokenInput = styled.div`
  flex: 1;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem;
  transition: border-color 0.2s;

  &:focus-within {
    border-color: #3b82f6;
  }
`;

const TokenHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const TokenSelect = styled.select`
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.5rem;
  font-weight: 500;
`;

const AmountInput = styled.input`
  width: 100%;
  background: transparent;
  border: none;
  font-size: 1.2rem;
  font-weight: 600;
  color: #1f2937;
  outline: none;

  &::placeholder {
    color: #9ca3af;
  }
`;

const InfoCard = styled.div`
  background: #f3f4f6;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  color: #6b7280;
  
  &:last-child {
    margin-bottom: 0;
    color: #1f2937;
    font-weight: 600;
  }
`;

const ExecuteButton = styled.button`
  width: 100%;
  background: linear-gradient(135deg, #10b981, #047857);
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 1rem;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(16, 185, 129, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const UserPositions = styled.div`
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
`;

const PositionCard = styled.div`
  background: #f9fafb;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  border: 1px solid #e5e7eb;
`;

const LiquidityInterface = ({ dex, account, balance, getBalance }) => {
  const [activeTab, setActiveTab] = useState('add');
  const [tokenA, setTokenA] = useState('uatom');
  const [tokenB, setTokenB] = useState('');
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [pool, setPool] = useState(null);
  const [userLiquidity, setUserLiquidity] = useState(null);

  // Mock tokens
  const tokens = [
    { denom: 'uatom', symbol: 'ATOM', decimals: 6 },
    // Add more tokens as needed
  ];

  useEffect(() => {
    const fetchPoolInfo = async () => {
      if (!tokenA || !tokenB || !dex) return;
      
      try {
        const poolInfo = await dex.getPool(tokenA, tokenB);
        setPool(poolInfo);
      } catch (error) {
        console.error('Failed to fetch pool info:', error);
        setPool(null);
      }
    };

    fetchPoolInfo();
  }, [tokenA, tokenB, dex]);

  useEffect(() => {
    const fetchUserLiquidity = async () => {
      if (!tokenA || !tokenB || !account || !dex) return;
      
      try {
        const liquidity = await dex.getUserLiquidity(account.address, tokenA, tokenB);
        setUserLiquidity(liquidity);
      } catch (error) {
        console.error('Failed to fetch user liquidity:', error);
        setUserLiquidity(null);
      }
    };

    fetchUserLiquidity();
  }, [tokenA, tokenB, account, dex]);

  const handleAddLiquidity = async () => {
    if (!amountA || !amountB || !tokenA || !tokenB || !account) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const amountAMicro = Math.floor(parseFloat(amountA) * 1000000);
      const amountBMicro = Math.floor(parseFloat(amountB) * 1000000);
      const minLiquidity = 1; // Minimum liquidity tokens

      if (!pool) {
        // Create new pool
        await dex.createPool(tokenA, tokenB, amountAMicro, amountBMicro);
      } else {
        // Add to existing pool
        await dex.addLiquidity(tokenA, tokenB, amountAMicro, amountBMicro, minLiquidity);
      }

      // Refresh data
      if (getBalance && account) {
        await getBalance(account.address);
      }
      
      setAmountA('');
      setAmountB('');
    } catch (error) {
      console.error('Add liquidity failed:', error);
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!userLiquidity || !userLiquidity.liquidity || userLiquidity.liquidity === '0') {
      toast.error('No liquidity to remove');
      return;
    }

    try {
      const liquidityAmount = userLiquidity.liquidity;
      const minA = Math.floor(parseInt(userLiquidity.share_a) * 0.99); // 1% slippage
      const minB = Math.floor(parseInt(userLiquidity.share_b) * 0.99);

      await dex.removeLiquidity(tokenA, tokenB, liquidityAmount, minA, minB);

      // Refresh data
      if (getBalance && account) {
        await getBalance(account.address);
      }
    } catch (error) {
      console.error('Remove liquidity failed:', error);
    }
  };

  const calculateRatio = () => {
    if (!pool || !amountA) return '';
    const ratio = parseInt(pool.reserve_b) / parseInt(pool.reserve_a);
    return (parseFloat(amountA) * ratio).toFixed(6);
  };

  const formatBalance = (balance) => {
    if (!balance) return '0';
    return (parseInt(balance.amount) / 1000000).toFixed(6);
  };

  const canAddLiquidity = amountA && amountB && tokenA && tokenB && !dex.loading;
  const canRemoveLiquidity = userLiquidity && parseInt(userLiquidity.liquidity) > 0 && !dex.loading;

  return (
    <LiquidityContainer>
      <TabContainer>
        <Tab active={activeTab === 'add'} onClick={() => setActiveTab('add')}>
          Add Liquidity
        </Tab>
        <Tab active={activeTab === 'remove'} onClick={() => setActiveTab('remove')}>
          Remove Liquidity
        </Tab>
      </TabContainer>

      {activeTab === 'add' && (
        <>
          <Title>Add Liquidity</Title>
          
          <TokenPairContainer>
            <TokenInput>
              <TokenHeader>
                <TokenSelect 
                  value={tokenA} 
                  onChange={(e) => setTokenA(e.target.value)}
                >
                  {tokens.map(token => (
                    <option key={token.denom} value={token.denom}>
                      {token.symbol}
                    </option>
                  ))}
                </TokenSelect>
              </TokenHeader>
              <AmountInput
                type="number"
                placeholder="0.0"
                value={amountA}
                onChange={(e) => {
                  setAmountA(e.target.value);
                  if (pool && e.target.value) {
                    setAmountB(calculateRatio());
                  }
                }}
              />
            </TokenInput>

            <TokenInput>
              <TokenHeader>
                <TokenSelect 
                  value={tokenB} 
                  onChange={(e) => setTokenB(e.target.value)}
                >
                  <option value="">Select token</option>
                  {tokens
                    .filter(token => token.denom !== tokenA)
                    .map(token => (
                      <option key={token.denom} value={token.denom}>
                        {token.symbol}
                      </option>
                    ))
                  }
                </TokenSelect>
              </TokenHeader>
              <AmountInput
                type="number"
                placeholder="0.0"
                value={amountB}
                onChange={(e) => setAmountB(e.target.value)}
              />
            </TokenInput>
          </TokenPairContainer>

          {pool && (
            <InfoCard>
              <InfoRow>
                <span>Pool reserves:</span>
                <span>{(parseInt(pool.reserve_a) / 1000000).toFixed(2)} / {(parseInt(pool.reserve_b) / 1000000).toFixed(2)}</span>
              </InfoRow>
              <InfoRow>
                <span>Pool ratio:</span>
                <span>1 {tokens.find(t => t.denom === tokenA)?.symbol} = {(parseInt(pool.reserve_b) / parseInt(pool.reserve_a)).toFixed(6)} {tokens.find(t => t.denom === tokenB)?.symbol}</span>
              </InfoRow>
              <InfoRow>
                <span>Total liquidity:</span>
                <span>{(parseInt(pool.total_liquidity) / 1000000).toFixed(2)}</span>
              </InfoRow>
            </InfoCard>
          )}

          <ExecuteButton
            onClick={handleAddLiquidity}
            disabled={!canAddLiquidity}
          >
            {dex.loading ? 'Adding...' : pool ? 'Add Liquidity' : 'Create Pool'}
          </ExecuteButton>
        </>
      )}

      {activeTab === 'remove' && (
        <>
          <Title>Remove Liquidity</Title>
          
          {userLiquidity && parseInt(userLiquidity.liquidity) > 0 ? (
            <>
              <InfoCard>
                <InfoRow>
                  <span>Your liquidity tokens:</span>
                  <span>{(parseInt(userLiquidity.liquidity) / 1000000).toFixed(6)}</span>
                </InfoRow>
                <InfoRow>
                  <span>Your share of {tokens.find(t => t.denom === tokenA)?.symbol}:</span>
                  <span>{(parseInt(userLiquidity.share_a) / 1000000).toFixed(6)}</span>
                </InfoRow>
                <InfoRow>
                  <span>Your share of {tokens.find(t => t.denom === tokenB)?.symbol}:</span>
                  <span>{(parseInt(userLiquidity.share_b) / 1000000).toFixed(6)}</span>
                </InfoRow>
              </InfoCard>

              <ExecuteButton
                onClick={handleRemoveLiquidity}
                disabled={!canRemoveLiquidity}
              >
                {dex.loading ? 'Removing...' : 'Remove All Liquidity'}
              </ExecuteButton>
            </>
          ) : (
            <InfoCard>
              <div style={{ textAlign: 'center', color: '#6b7280' }}>
                No liquidity positions found for this pair.
              </div>
            </InfoCard>
          )}
        </>
      )}
    </LiquidityContainer>
  );
};

export default LiquidityInterface;