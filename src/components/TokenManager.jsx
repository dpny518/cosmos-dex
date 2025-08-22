import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { toast } from 'react-hot-toast';
import { useKeplr } from '../hooks/useKeplr';
import { 
  getTokenInfo, 
  getTokenBalance, 
  transferTokens, 
  mintTokens, 
  burnTokens,
  getMinterInfo,
  formatTokenAmount,
  parseTokenAmount
} from '../services/cw20Service';

const ManagerContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
`;

const Title = styled.h1`
  text-align: center;
  color: white;
  margin-bottom: 2rem;
  font-size: 2.5rem;
  font-weight: bold;
`;

const TokenCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  padding: 2rem;
  margin-bottom: 2rem;
  backdrop-filter: blur(10px);
`;

const TokenHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const TokenName = styled.h2`
  color: white;
  margin: 0;
  font-size: 1.5rem;
`;

const TokenSymbol = styled.span`
  background: linear-gradient(45deg, #4CAF50, #45a049);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: bold;
`;

const TokenInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const InfoItem = styled.div`
  background: rgba(255, 255, 255, 0.05);
  padding: 1rem;
  border-radius: 10px;
`;

const InfoLabel = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
`;

const InfoValue = styled.div`
  color: white;
  font-weight: bold;
  font-size: 1.1rem;
`;

const ActionSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
`;

const ActionCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 1.5rem;
`;

const ActionTitle = styled.h3`
  color: white;
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  margin-bottom: 1rem;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.5);
  }
`;

const Button = styled.button`
  width: 100%;
  background: ${props => props.variant === 'danger' ? '#f44336' : 'linear-gradient(45deg, #4CAF50, #45a049)'};
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
  }
  
  &:disabled {
    background: #666;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const AddTokenForm = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  padding: 2rem;
  margin-bottom: 2rem;
`;

const TokenManager = () => {
  const { account, client } = useKeplr();
  const [tokens, setTokens] = useState([]);
  const [newTokenAddress, setNewTokenAddress] = useState('');
  const [loading, setLoading] = useState(false);

  // Load tokens from localStorage on mount
  useEffect(() => {
    const savedTokens = localStorage.getItem('user-tokens');
    if (savedTokens) {
      setTokens(JSON.parse(savedTokens));
    }
  }, []);

  // Save tokens to localStorage whenever tokens change
  useEffect(() => {
    localStorage.setItem('user-tokens', JSON.stringify(tokens));
  }, [tokens]);

  const addToken = async () => {
    if (!newTokenAddress.trim()) {
      toast.error('Please enter a token contract address');
      return;
    }

    if (!client) {
      toast.error('Wallet not connected');
      return;
    }

    setLoading(true);
    try {
      const tokenInfo = await getTokenInfo(client, newTokenAddress);
      const balance = await getTokenBalance(client, newTokenAddress, account.address);
      const minterInfo = await getMinterInfo(client, newTokenAddress);

      const newToken = {
        address: newTokenAddress,
        info: tokenInfo,
        balance: balance,
        minterInfo: minterInfo,
        addedAt: Date.now()
      };

      setTokens(prev => {
        const existing = prev.find(t => t.address === newTokenAddress);
        if (existing) {
          toast.error('Token already added');
          return prev;
        }
        return [...prev, newToken];
      });

      setNewTokenAddress('');
      toast.success(`Added ${tokenInfo.symbol} token`);
    } catch (error) {
      console.error('Failed to add token:', error);
      toast.error('Failed to add token. Please check the contract address.');
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async (tokenAddress) => {
    if (!client) return;

    try {
      const balance = await getTokenBalance(client, tokenAddress, account.address);
      const minterInfo = await getMinterInfo(client, tokenAddress);

      setTokens(prev => prev.map(token => 
        token.address === tokenAddress 
          ? { ...token, balance, minterInfo }
          : token
      ));
    } catch (error) {
      console.error('Failed to refresh token:', error);
    }
  };

  const removeToken = (tokenAddress) => {
    setTokens(prev => prev.filter(token => token.address !== tokenAddress));
    toast.success('Token removed');
  };

  const handleTransfer = async (tokenAddress, recipient, amount) => {
    if (!client || !account) return;

    try {
      const token = tokens.find(t => t.address === tokenAddress);
      const parsedAmount = parseTokenAmount(amount, token.info.decimals);
      
      await transferTokens(client, account.address, tokenAddress, recipient, parsedAmount);
      toast.success('Transfer successful');
      refreshToken(tokenAddress);
    } catch (error) {
      console.error('Transfer failed:', error);
      toast.error(`Transfer failed: ${error.message}`);
    }
  };

  const handleMint = async (tokenAddress, recipient, amount) => {
    if (!client || !account) return;

    try {
      const token = tokens.find(t => t.address === tokenAddress);
      const parsedAmount = parseTokenAmount(amount, token.info.decimals);
      
      await mintTokens(client, account.address, tokenAddress, recipient, parsedAmount);
      toast.success('Mint successful');
      refreshToken(tokenAddress);
    } catch (error) {
      console.error('Mint failed:', error);
      toast.error(`Mint failed: ${error.message}`);
    }
  };

  const handleBurn = async (tokenAddress, amount) => {
    if (!client || !account) return;

    try {
      const token = tokens.find(t => t.address === tokenAddress);
      const parsedAmount = parseTokenAmount(amount, token.info.decimals);
      
      await burnTokens(client, account.address, tokenAddress, parsedAmount);
      toast.success('Burn successful');
      refreshToken(tokenAddress);
    } catch (error) {
      console.error('Burn failed:', error);
      toast.error(`Burn failed: ${error.message}`);
    }
  };

  if (!account) {
    return (
      <ManagerContainer>
        <Title>🎛️ Token Manager</Title>
        <TokenCard>
          <div style={{ textAlign: 'center', color: 'white' }}>
            Please connect your wallet to manage tokens
          </div>
        </TokenCard>
      </ManagerContainer>
    );
  }

  return (
    <ManagerContainer>
      <Title>🎛️ Token Manager</Title>
      
      <AddTokenForm>
        <ActionTitle>Add Token Contract</ActionTitle>
        <Input
          type="text"
          placeholder="Enter CW20 contract address (cosmos1...)"
          value={newTokenAddress}
          onChange={(e) => setNewTokenAddress(e.target.value)}
        />
        <Button onClick={addToken} disabled={loading}>
          {loading ? 'Adding...' : 'Add Token'}
        </Button>
      </AddTokenForm>

      {tokens.length === 0 ? (
        <TokenCard>
          <div style={{ textAlign: 'center', color: 'white' }}>
            No tokens added yet. Add a CW20 token contract address above.
          </div>
        </TokenCard>
      ) : (
        tokens.map(token => (
          <TokenCard key={token.address}>
            <TokenHeader>
              <div>
                <TokenName>{token.info.name}</TokenName>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  {token.address}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <TokenSymbol>{token.info.symbol}</TokenSymbol>
                <Button 
                  onClick={() => removeToken(token.address)}
                  variant="danger"
                  style={{ width: 'auto', padding: '0.5rem 1rem' }}
                >
                  Remove
                </Button>
              </div>
            </TokenHeader>

            <TokenInfo>
              <InfoItem>
                <InfoLabel>Your Balance</InfoLabel>
                <InfoValue>{formatTokenAmount(token.balance, token.info.decimals)} {token.info.symbol}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Total Supply</InfoLabel>
                <InfoValue>{formatTokenAmount(token.info.total_supply, token.info.decimals)}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Decimals</InfoLabel>
                <InfoValue>{token.info.decimals}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Mintable</InfoLabel>
                <InfoValue>{token.minterInfo ? 'Yes' : 'No'}</InfoValue>
              </InfoItem>
            </TokenInfo>

            <ActionSection>
              <ActionCard>
                <ActionTitle>Transfer Tokens</ActionTitle>
                <Input placeholder="Recipient address" id={`transfer-recipient-${token.address}`} />
                <Input placeholder="Amount" id={`transfer-amount-${token.address}`} />
                <Button onClick={() => {
                  const recipient = document.getElementById(`transfer-recipient-${token.address}`).value;
                  const amount = document.getElementById(`transfer-amount-${token.address}`).value;
                  handleTransfer(token.address, recipient, amount);
                }}>
                  Transfer
                </Button>
              </ActionCard>

              {token.minterInfo && token.minterInfo.minter === account.address && (
                <ActionCard>
                  <ActionTitle>Mint Tokens</ActionTitle>
                  <Input placeholder="Recipient address" id={`mint-recipient-${token.address}`} />
                  <Input placeholder="Amount to mint" id={`mint-amount-${token.address}`} />
                  <Button onClick={() => {
                    const recipient = document.getElementById(`mint-recipient-${token.address}`).value;
                    const amount = document.getElementById(`mint-amount-${token.address}`).value;
                    handleMint(token.address, recipient, amount);
                  }}>
                    Mint
                  </Button>
                </ActionCard>
              )}

              <ActionCard>
                <ActionTitle>Burn Tokens</ActionTitle>
                <Input placeholder="Amount to burn" id={`burn-amount-${token.address}`} />
                <Button 
                  variant="danger"
                  onClick={() => {
                    const amount = document.getElementById(`burn-amount-${token.address}`).value;
                    handleBurn(token.address, amount);
                  }}
                >
                  Burn
                </Button>
              </ActionCard>
            </ActionSection>
          </TokenCard>
        ))
      )}
    </ManagerContainer>
  );
};

export default TokenManager;
