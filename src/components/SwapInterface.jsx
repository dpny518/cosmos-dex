import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { toast } from 'react-hot-toast';
import TokenSelector from './TokenSelector';
import { tokenRegistry } from '../services/tokenRegistry';
import { config } from '../config';

const Container = styled.div`
  background: rgba(15, 17, 25, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  max-width: 480px;
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
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.03) 0%, rgba(118, 75, 162, 0.03) 100%);
    pointer-events: none;
  }
`;

const Title = styled.h3`
  margin: 0 0 32px 0;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.5rem;
  font-weight: 700;
  position: relative;
  z-index: 1;
`;

const SwapCard = styled.div`
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 16px;
  position: relative;
  background: rgba(20, 23, 31, 0.4);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  
  &:hover {
    border-color: rgba(102, 126, 234, 0.3);
    background: rgba(20, 23, 31, 0.6);
  }
`;

const TokenRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const TokenButton = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #ffffff;
  font-weight: 600;
  font-size: 0.95rem;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(102, 126, 234, 0.3);
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const TokenLogo = styled.img`
  width: 20px;
  height: 20px;
  border-radius: 50%;
`;

const AmountInput = styled.input`
  width: 100%;
  padding: 20px 0;
  border: none;
  font-size: 28px;
  font-weight: 700;
  background: transparent;
  color: #ffffff;
  
  &:focus {
    outline: none;
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
  
  /* Remove number input arrows */
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  
  &[type=number] {
    -moz-appearance: textfield;
  }
`;

const Balance = styled.div`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  text-align: right;
  font-weight: 500;
`;

const SwapButton = styled.div`
  display: flex;
  justify-content: center;
  margin: -12px 0;
  position: relative;
  z-index: 10;
`;

const SwapIcon = styled.button`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: 4px solid rgba(15, 17, 25, 0.8);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all 0.3s ease;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
  
  &:hover {
    background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
    transform: rotate(180deg) translateY(-2px);
    box-shadow: 0 12px 24px rgba(102, 126, 234, 0.4);
  }
  
  &:active {
    transform: rotate(180deg) translateY(0);
  }
`;

const SwapDetails = styled.div`
  background: rgba(20, 23, 31, 0.6);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  margin: 24px 0;
  font-size: 14px;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  color: rgba(255, 255, 255, 0.8);
  
  &:last-child {
    margin-bottom: 0;
    font-weight: 600;
    color: #ffffff;
  }
  
  span:first-child {
    color: rgba(255, 255, 255, 0.6);
  }
  
  span:last-child {
    font-weight: 600;
  }
`;

const ExecuteButton = styled.button`
  width: 100%;
  padding: 18px;
  background: ${props => props.disabled ? 
    'rgba(255, 255, 255, 0.1)' : 
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  };
  color: ${props => props.disabled ? 'rgba(255, 255, 255, 0.4)' : 'white'};
  border: none;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 700;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  margin-top: 8px;
  position: relative;
  overflow: hidden;
  box-shadow: ${props => props.disabled ? 
    'none' : 
    '0 8px 20px rgba(102, 126, 234, 0.3)'
  };
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transition: left 0.5s;
  }
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 12px 24px rgba(102, 126, 234, 0.4);
    
    &::before {
      left: 100%;
    }
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

const SwapInterface = ({ dex, balances = {} }) => {
  const [tokenIn, setTokenIn] = useState(null);
  const [tokenOut, setTokenOut] = useState(null);
  const [amountIn, setAmountIn] = useState('');
  const [amountOut, setAmountOut] = useState('');
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [selectingFor, setSelectingFor] = useState(null);
  const [swapDetails, setSwapDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load only swappable tokens (tokens with liquidity pools)
    const loadSwappableTokens = async () => {
      console.log('🔄 SwapInterface: Loading swappable tokens...');
      
      // First load all tokens to populate registry
      await tokenRegistry.loadTokens(balances);
      
      // Then get only tokens with liquidity
      let swappableTokens = [];
      if (dex && dex.client) {
        // Try to get contract address from multiple sources
        const contractAddress = dex.contractAddress || 
                               config.contractAddress ||
                               import.meta.env?.VITE_CONTRACT_ADDRESS;
        
        if (contractAddress && contractAddress !== 'cosmos1...') {
          console.log('🔗 Using contract address:', contractAddress);
          swappableTokens = await tokenRegistry.getSwappableTokens(dex.client, contractAddress);
        } else {
          console.log('⚠️ No valid contract address found');
        }
      }
      
      // Fallback to all tokens if we couldn't get swappable ones
      if (swappableTokens.length === 0) {
        console.log('⚠️ No swappable tokens found, using fallback');
        swappableTokens = tokenRegistry.getAllTokens().filter(token => 
          token.symbol === 'ATOM' || 
          token.symbol === 'USDC' ||
          token.force_added ||
          token.manually_added
        );
      }
      
      console.log('📋 SwapInterface: Loaded swappable tokens:', swappableTokens.length);
      console.log('🎯 Available for swap:', swappableTokens.map(t => t.symbol).join(', '));
      
      if (swappableTokens.length > 0 && !tokenIn) {
        const atomToken = swappableTokens.find(t => t.symbol === 'ATOM') || swappableTokens[0];
        setTokenIn(atomToken);
      }
    };
    
    loadSwappableTokens();
  }, [balances, dex]);

  useEffect(() => {
    if (tokenIn && tokenOut && amountIn && parseFloat(amountIn) > 0) {
      simulateSwap();
    } else {
      setAmountOut('');
      setSwapDetails(null);
    }
  }, [tokenIn, tokenOut, amountIn]);

  const simulateSwap = async () => {
    if (!dex || !tokenIn || !tokenOut || !amountIn) return;
    
    try {
      const simulation = await dex.simulateSwap(
        tokenIn.denom,
        tokenOut.denom,
        (parseFloat(amountIn) * Math.pow(10, tokenIn.decimals)).toString()
      );
      
      const outputAmount = parseFloat(simulation.amount_out) / Math.pow(10, tokenOut.decimals);
      const fee = parseFloat(simulation.fee) / Math.pow(10, tokenIn.decimals);
      
      setAmountOut(outputAmount.toFixed(6));
      setSwapDetails({
        fee: fee.toFixed(6),
        priceImpact: simulation.price_impact,
        rate: (outputAmount / parseFloat(amountIn)).toFixed(6)
      });
    } catch (error) {
      console.error('Swap simulation failed:', error);
      setAmountOut('');
      setSwapDetails(null);
    }
  };

  const handleTokenSelect = (token) => {
    if (selectingFor === 'in') {
      setTokenIn(token);
    } else if (selectingFor === 'out') {
      setTokenOut(token);
    }
    setShowTokenSelector(false);
    setSelectingFor(null);
  };

  const handleSwapTokens = () => {
    const temp = tokenIn;
    setTokenIn(tokenOut);
    setTokenOut(temp);
    setAmountIn(amountOut);
    setAmountOut('');
  };

  const handleMaxClick = () => {
    if (tokenIn && balances[tokenIn.denom]) {
      const balance = parseFloat(balances[tokenIn.denom]) / Math.pow(10, tokenIn.decimals);
      setAmountIn(balance.toString());
    }
  };

  const executeSwap = async () => {
    if (!dex || !tokenIn || !tokenOut || !amountIn) return;
    
    setLoading(true);
    try {
      const amountInWei = Math.floor(parseFloat(amountIn) * Math.pow(10, tokenIn.decimals)).toString();
      const minAmountOut = Math.floor(parseFloat(amountOut) * 0.95 * Math.pow(10, tokenOut.decimals)).toString(); // 5% slippage
      
      await dex.swap(tokenIn.denom, tokenOut.denom, amountInWei, minAmountOut);
      
      toast.success('Swap executed successfully!');
      setAmountIn('');
      setAmountOut('');
      setSwapDetails(null);
    } catch (error) {
      console.error('Swap failed:', error);
      toast.error('Swap failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const canSwap = tokenIn && tokenOut && amountIn && parseFloat(amountIn) > 0 && amountOut;

  return (
    <Container>
      <Title>
        🔄 Swap Tokens
      </Title>

      <SwapCard>
        <TokenRow>
          <TokenButton onClick={() => {
            setSelectingFor('in');
            setShowTokenSelector(true);
          }}>
            {tokenIn ? (
              <>
                <TokenLogo 
                  src={tokenIn.logo || '/default-token-logo.svg'} 
                  alt={tokenIn.symbol}
                  onError={(e) => {
                    e.target.src = '/default-token-logo.svg';
                  }}
                />
                {tokenIn.symbol}
              </>
            ) : (
              'Select Token'
            )}
          </TokenButton>
          <Balance>
            Balance: {tokenIn && balances[tokenIn.denom] 
              ? (parseFloat(balances[tokenIn.denom]) / Math.pow(10, tokenIn.decimals)).toFixed(6)
              : '0'
            }
            {tokenIn && balances[tokenIn.denom] && (
              <button 
                onClick={handleMaxClick}
                style={{ marginLeft: '8px', color: '#007bff', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                MAX
              </button>
            )}
          </Balance>
        </TokenRow>
        <AmountInput
          type="number"
          placeholder="0.0"
          value={amountIn}
          onChange={(e) => setAmountIn(e.target.value)}
        />
      </SwapCard>

      <SwapButton>
        <SwapIcon onClick={handleSwapTokens}>
          ↕
        </SwapIcon>
      </SwapButton>

      <SwapCard>
        <TokenRow>
          <TokenButton onClick={() => {
            setSelectingFor('out');
            setShowTokenSelector(true);
          }}>
            {tokenOut ? (
              <>
                <TokenLogo 
                  src={tokenOut.logo || '/default-token-logo.svg'} 
                  alt={tokenOut.symbol}
                  onError={(e) => {
                    e.target.src = '/default-token-logo.svg';
                  }}
                />
                {tokenOut.symbol}
              </>
            ) : (
              'Select Token'
            )}
          </TokenButton>
          <Balance>
            Balance: {tokenOut && balances[tokenOut.denom] 
              ? (parseFloat(balances[tokenOut.denom]) / Math.pow(10, tokenOut.decimals)).toFixed(6)
              : '0'
            }
          </Balance>
        </TokenRow>
        <AmountInput
          type="number"
          placeholder="0.0"
          value={amountOut}
          readOnly
        />
      </SwapCard>

      {swapDetails && (
        <SwapDetails>
          <DetailRow>
            <span>Rate:</span>
            <span>1 {tokenIn.symbol} = {swapDetails.rate} {tokenOut.symbol}</span>
          </DetailRow>
          <DetailRow>
            <span>Fee:</span>
            <span>{swapDetails.fee} {tokenIn.symbol}</span>
          </DetailRow>
          <DetailRow>
            <span>Price Impact:</span>
            <span>{swapDetails.priceImpact}</span>
          </DetailRow>
        </SwapDetails>
      )}

      <ExecuteButton
        disabled={!canSwap || loading}
        onClick={executeSwap}
      >
        {loading ? 'Swapping...' : 'Swap'}
      </ExecuteButton>

      <TokenSelector
        isOpen={showTokenSelector}
        onClose={() => {
          setShowTokenSelector(false);
          setSelectingFor(null);
        }}
        onSelect={handleTokenSelect}
        balances={balances}
        swappableOnly={true}
        dex={dex}
      />
    </Container>
  );
};

export default SwapInterface;
