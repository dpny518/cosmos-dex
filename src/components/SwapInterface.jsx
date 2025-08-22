import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { toast } from 'react-hot-toast';
import TokenSelector from './TokenSelector';
import { tokenRegistry } from '../services/tokenRegistry';
import { config } from '../config';

const Container = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h3`
  margin: 0 0 20px 0;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SwapCard = styled.div`
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  position: relative;
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

const AmountInput = styled.input`
  width: 100%;
  padding: 16px;
  border: none;
  font-size: 24px;
  font-weight: 600;
  background: transparent;
  
  &:focus {
    outline: none;
  }
  
  &::placeholder {
    color: #ccc;
  }
`;

const Balance = styled.div`
  font-size: 14px;
  color: #666;
  text-align: right;
`;

const SwapButton = styled.div`
  display: flex;
  justify-content: center;
  margin: -8px 0;
  position: relative;
  z-index: 1;
`;

const SwapIcon = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #007bff;
  color: white;
  border: 4px solid white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.2s;
  
  &:hover {
    background: #0056b3;
    transform: rotate(180deg);
  }
`;

const SwapDetails = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
  font-size: 14px;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const ExecuteButton = styled.button`
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
  
  &:hover {
    background: ${props => props.disabled ? '#ccc' : '#0056b3'};
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
      console.log('🔄 SwapInterface DEX state:', { 
        hasDex: !!dex, 
        hasClient: !!dex?.client,
        contractAddress: dex?.contractAddress
      });
      
      // First load all tokens to populate registry
      await tokenRegistry.loadTokens(balances);
      
      // Then get only tokens with liquidity - getSwappableTokens has proper fallback logic
      let swappableTokens = [];
      if (dex) {
        // Try to get contract address from multiple sources
        const contractAddress = dex.contractAddress || 
                               config.contractAddress ||
                               import.meta.env?.VITE_CONTRACT_ADDRESS;
        
        console.log('🔗 SwapInterface using contract address:', contractAddress);
        swappableTokens = await tokenRegistry.getSwappableTokens(dex.client, contractAddress);
      } else {
        console.log('⚠️ No DEX object available, getting fallback tokens');
        // Fallback when no DEX is available
        swappableTokens = tokenRegistry.getAllTokens().filter(token => 
          token.symbol === 'ATOM' || 
          token.symbol === 'USDC' ||
          token.force_added ||
          token.manually_added
        );
      }
      
      console.log('📋 SwapInterface: Final swappable tokens:', swappableTokens.length);
      console.log('🎯 Available for swap:', swappableTokens.map(t => t.symbol).join(', '));
      
      if (swappableTokens.length > 0 && !tokenIn) {
        const atomToken = swappableTokens.find(t => t.symbol === 'ATOM') || swappableTokens[0];
        setTokenIn(atomToken);
        console.log('✅ Set default tokenIn:', atomToken.symbol);
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
