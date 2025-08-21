import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import toast from 'react-hot-toast';

const SwapContainer = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  margin: 0 auto;
`;

const Title = styled.h2`
  color: #1f2937;
  margin-bottom: 1.5rem;
  text-align: center;
`;

const TokenInput = styled.div`
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
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

const Balance = styled.span`
  color: #6b7280;
  font-size: 0.875rem;
`;

const AmountInput = styled.input`
  width: 100%;
  background: transparent;
  border: none;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  outline: none;

  &::placeholder {
    color: #9ca3af;
  }
`;

const SwapButton = styled.button`
  width: 40px;
  height: 40px;
  background: #3b82f6;
  border: none;
  border-radius: 50%;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  margin: 0.5rem auto;
  display: block;
  transition: all 0.2s;

  &:hover {
    background: #2563eb;
    transform: rotate(180deg);
  }
`;

const SwapInfoCard = styled.div`
  background: #f3f4f6;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
`;

const SwapInfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  color: #6b7280;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const ExecuteButton = styled.button`
  width: 100%;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
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
    box-shadow: 0 5px 15px rgba(59, 130, 246, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const SwapInterface = ({ dex, account, balance, getBalance }) => {
  const [tokenIn, setTokenIn] = useState('uatom');
  const [tokenOut, setTokenOut] = useState('');
  const [amountIn, setAmountIn] = useState('');
  const [amountOut, setAmountOut] = useState('');
  const [simulation, setSimulation] = useState(null);
  const [slippage, setSlippage] = useState(0.5);

  // Mock tokens for demo - in production, fetch from contract or config
  const tokens = [
    { denom: 'uatom', symbol: 'ATOM', decimals: 6 },
    // Add more tokens as they become available
  ];

  useEffect(() => {
    const updateSimulation = async () => {
      if (!amountIn || !tokenIn || !tokenOut || !dex) return;
      
      try {
        const amount = Math.floor(parseFloat(amountIn) * 1000000); // Convert to micro units
        const sim = await dex.simulateSwap(tokenIn, tokenOut, amount);
        setSimulation(sim);
        
        if (sim) {
          setAmountOut((parseInt(sim.amount_out) / 1000000).toString());
        }
      } catch (error) {
        console.error('Simulation failed:', error);
        setSimulation(null);
        setAmountOut('');
      }
    };

    const debounceTimer = setTimeout(updateSimulation, 500);
    return () => clearTimeout(debounceTimer);
  }, [amountIn, tokenIn, tokenOut, dex]);

  const handleSwapTokens = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmountIn(amountOut);
    setAmountOut(amountIn);
  };

  const handleSwap = async () => {
    if (!amountIn || !tokenIn || !tokenOut || !account) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const amountInMicro = Math.floor(parseFloat(amountIn) * 1000000);
      const minAmountOut = Math.floor(
        parseFloat(amountOut) * (1 - slippage / 100) * 1000000
      );

      await dex.swap(tokenIn, tokenOut, amountInMicro, minAmountOut);
      
      // Refresh balance
      if (getBalance && account) {
        await getBalance(account.address);
      }
      
      // Clear inputs
      setAmountIn('');
      setAmountOut('');
      setSimulation(null);
    } catch (error) {
      console.error('Swap failed:', error);
    }
  };

  const formatBalance = (balance) => {
    if (!balance) return '0';
    return (parseInt(balance.amount) / 1000000).toFixed(6);
  };

  const canSwap = amountIn && tokenIn && tokenOut && simulation && !dex.loading;

  return (
    <SwapContainer>
      <Title>Swap Tokens</Title>
      
      <TokenInput>
        <TokenHeader>
          <TokenSelect 
            value={tokenIn} 
            onChange={(e) => setTokenIn(e.target.value)}
          >
            {tokens.map(token => (
              <option key={token.denom} value={token.denom}>
                {token.symbol}
              </option>
            ))}
          </TokenSelect>
          <Balance>
            Balance: {balance ? formatBalance(balance) : '0'} ATOM
          </Balance>
        </TokenHeader>
        <AmountInput
          type="number"
          placeholder="0.0"
          value={amountIn}
          onChange={(e) => setAmountIn(e.target.value)}
        />
      </TokenInput>

      <SwapButton onClick={handleSwapTokens}>
        ↕️
      </SwapButton>

      <TokenInput>
        <TokenHeader>
          <TokenSelect 
            value={tokenOut} 
            onChange={(e) => setTokenOut(e.target.value)}
          >
            <option value="">Select token</option>
            {tokens
              .filter(token => token.denom !== tokenIn)
              .map(token => (
                <option key={token.denom} value={token.denom}>
                  {token.symbol}
                </option>
              ))
            }
          </TokenSelect>
          <Balance>Balance: 0</Balance>
        </TokenHeader>
        <AmountInput
          type="number"
          placeholder="0.0"
          value={amountOut}
          readOnly
        />
      </TokenInput>

      {simulation && (
        <SwapInfoCard>
          <SwapInfoRow>
            <span>Minimum received:</span>
            <span>{(parseFloat(amountOut) * (1 - slippage / 100)).toFixed(6)}</span>
          </SwapInfoRow>
          <SwapInfoRow>
            <span>Price impact:</span>
            <span>{simulation.price_impact}</span>
          </SwapInfoRow>
          <SwapInfoRow>
            <span>Liquidity provider fee:</span>
            <span>{(parseInt(simulation.fee) / 1000000).toFixed(6)} {tokens.find(t => t.denom === tokenIn)?.symbol}</span>
          </SwapInfoRow>
          <SwapInfoRow>
            <span>Slippage tolerance:</span>
            <span>{slippage}%</span>
          </SwapInfoRow>
        </SwapInfoCard>
      )}

      <ExecuteButton
        onClick={handleSwap}
        disabled={!canSwap}
      >
        {dex.loading ? 'Swapping...' : 'Swap'}
      </ExecuteButton>
    </SwapContainer>
  );
};

export default SwapInterface;