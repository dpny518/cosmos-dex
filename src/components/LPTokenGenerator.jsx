import React, { useState } from 'react';
import styled from 'styled-components';
import { tokenRegistry } from '../services/tokenRegistry';
import TokenSelector from './TokenSelector';

const Container = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
`;

const Title = styled.h3`
  margin: 0 0 20px 0;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TokenPairSelector = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 16px;
  align-items: center;
  margin-bottom: 24px;
`;

const TokenButton = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: #007bff;
  }
  
  ${props => props.selected && `
    border-color: #007bff;
    background: #f8f9ff;
  `}
`;

const TokenLogo = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #f0f0f0;
`;

const TokenInfo = styled.div`
  text-align: left;
`;

const TokenSymbol = styled.div`
  font-weight: 600;
  color: #333;
`;

const TokenName = styled.div`
  font-size: 14px;
  color: #666;
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

const GeneratedLP = styled.div`
  background: #f8f9ff;
  border: 2px solid #007bff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
`;

const LPTitle = styled.h4`
  margin: 0 0 16px 0;
  color: #007bff;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LPDetails = styled.div`
  display: grid;
  gap: 12px;
`;

const LPDetail = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Label = styled.span`
  color: #666;
  font-weight: 500;
`;

const Value = styled.span`
  color: #333;
  font-family: monospace;
  font-size: 14px;
`;

const CodeBlock = styled.div`
  background: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
  border-left: 4px solid #007bff;
`;

const CodeTitle = styled.h5`
  margin: 0 0 12px 0;
  color: #333;
  font-size: 14px;
`;

const Code = styled.pre`
  margin: 0;
  font-family: monospace;
  font-size: 12px;
  color: #333;
  white-space: pre-wrap;
  word-break: break-all;
`;

const CopyButton = styled.button`
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 12px;
  margin-top: 8px;
  
  &:hover {
    background: #0056b3;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
`;

const Button = styled.button`
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  ${props => props.primary ? `
    background: #007bff;
    color: white;
    
    &:hover {
      background: #0056b3;
    }
    
    &:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
  ` : `
    background: #f8f9fa;
    color: #333;
    border: 1px solid #e0e0e0;
    
    &:hover {
      background: #e9ecef;
    }
  `}
`;

const LPTokenGenerator = ({ onCreatePool }) => {
  const [tokenA, setTokenA] = useState(null);
  const [tokenB, setTokenB] = useState(null);
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [selectingFor, setSelectingFor] = useState(null); // 'A' or 'B'
  const [generatedLP, setGeneratedLP] = useState(null);

  const handleTokenSelect = (token) => {
    if (selectingFor === 'A') {
      setTokenA(token);
    } else if (selectingFor === 'B') {
      setTokenB(token);
    }
    setShowTokenSelector(false);
    setSelectingFor(null);
  };

  const generateLP = () => {
    if (!tokenA || !tokenB) return;
    
    const lpToken = tokenRegistry.createLPToken(tokenA, tokenB);
    const pair = tokenRegistry.getPair(tokenA, tokenB);
    const contractData = tokenRegistry.generateContractData(pair);
    
    setGeneratedLP({
      lpToken,
      pair,
      contractData
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could show a toast notification here
      console.log('Copied to clipboard');
    });
  };

  const canGenerate = tokenA && tokenB && tokenA.denom !== tokenB.denom;

  return (
    <Container>
      <Title>
        🏭 LP Token Generator
      </Title>
      
      <TokenPairSelector>
        <TokenButton
          selected={tokenA}
          onClick={() => {
            setSelectingFor('A');
            setShowTokenSelector(true);
          }}
        >
          {tokenA ? (
            <>
              <TokenLogo
                src={tokenA.logo || '/default-token-logo.png'}
                alt={tokenA.symbol}
                onError={(e) => {
                  e.target.src = '/default-token-logo.png';
                }}
              />
              <TokenInfo>
                <TokenSymbol>{tokenA.symbol}</TokenSymbol>
                <TokenName>{tokenA.name}</TokenName>
              </TokenInfo>
            </>
          ) : (
            <TokenInfo>
              <TokenSymbol>Select Token A</TokenSymbol>
              <TokenName>Choose first token</TokenName>
            </TokenInfo>
          )}
        </TokenButton>

        <PlusIcon>+</PlusIcon>

        <TokenButton
          selected={tokenB}
          onClick={() => {
            setSelectingFor('B');
            setShowTokenSelector(true);
          }}
        >
          {tokenB ? (
            <>
              <TokenLogo
                src={tokenB.logo || '/default-token-logo.png'}
                alt={tokenB.symbol}
                onError={(e) => {
                  e.target.src = '/default-token-logo.png';
                }}
              />
              <TokenInfo>
                <TokenSymbol>{tokenB.symbol}</TokenSymbol>
                <TokenName>{tokenB.name}</TokenName>
              </TokenInfo>
            </>
          ) : (
            <TokenInfo>
              <TokenSymbol>Select Token B</TokenSymbol>
              <TokenName>Choose second token</TokenName>
            </TokenInfo>
          )}
        </TokenButton>
      </TokenPairSelector>

      {generatedLP && (
        <GeneratedLP>
          <LPTitle>
            🎯 Generated LP Token
          </LPTitle>
          
          <LPDetails>
            <LPDetail>
              <Label>LP Token Symbol:</Label>
              <Value>{generatedLP.lpToken.symbol}</Value>
            </LPDetail>
            <LPDetail>
              <Label>LP Token Name:</Label>
              <Value>{generatedLP.lpToken.name}</Value>
            </LPDetail>
            <LPDetail>
              <Label>LP Token Denom:</Label>
              <Value>{generatedLP.lpToken.denom}</Value>
            </LPDetail>
            <LPDetail>
              <Label>Pair ID:</Label>
              <Value>{generatedLP.pair.id}</Value>
            </LPDetail>
          </LPDetails>

          <CodeBlock>
            <CodeTitle>📄 Add to assetlist.json:</CodeTitle>
            <Code>{JSON.stringify(generatedLP.contractData.assetlist_entry, null, 2)}</Code>
            <CopyButton onClick={() => copyToClipboard(JSON.stringify(generatedLP.contractData.assetlist_entry, null, 2))}>
              Copy JSON
            </CopyButton>
          </CodeBlock>

          <CodeBlock>
            <CodeTitle>🔗 Add to pairs.json:</CodeTitle>
            <Code>{JSON.stringify(generatedLP.contractData.pair_entry, null, 2)}</Code>
            <CopyButton onClick={() => copyToClipboard(JSON.stringify(generatedLP.contractData.pair_entry, null, 2))}>
              Copy JSON
            </CopyButton>
          </CodeBlock>

          <CodeBlock>
            <CodeTitle>🚀 Contract Execute Message:</CodeTitle>
            <Code>{`gaiad tx wasm execute ${import.meta.env.VITE_CONTRACT_ADDRESS} \\
  '{"create_pool":{"token_a":"${tokenA.denom}","token_b":"${tokenB.denom}","initial_a":"1000000","initial_b":"1000000"}}' \\
  --from your-key --chain-id cosmoshub-4 --gas-prices 0.025uatom --gas auto --gas-adjustment 1.3 --yes`}</Code>
            <CopyButton onClick={() => copyToClipboard(`gaiad tx wasm execute ${import.meta.env.VITE_CONTRACT_ADDRESS} '{"create_pool":{"token_a":"${tokenA.denom}","token_b":"${tokenB.denom}","initial_a":"1000000","initial_b":"1000000"}}' --from your-key --chain-id cosmoshub-4 --gas-prices 0.025uatom --gas auto --gas-adjustment 1.3 --yes`)}>
              Copy Command
            </CopyButton>
          </CodeBlock>
        </GeneratedLP>
      )}

      <ActionButtons>
        <Button onClick={() => {
          setTokenA(null);
          setTokenB(null);
          setGeneratedLP(null);
        }}>
          Clear
        </Button>
        <Button 
          primary 
          disabled={!canGenerate}
          onClick={generateLP}
        >
          Generate LP Token
        </Button>
        {generatedLP && onCreatePool && (
          <Button 
            primary
            onClick={() => onCreatePool(generatedLP.pair)}
          >
            Create Pool
          </Button>
        )}
      </ActionButtons>

      <TokenSelector
        isOpen={showTokenSelector}
        onClose={() => {
          setShowTokenSelector(false);
          setSelectingFor(null);
        }}
        onSelect={handleTokenSelect}
      />
    </Container>
  );
};

export default LPTokenGenerator;
