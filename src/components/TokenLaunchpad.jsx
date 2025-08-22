import React, { useState } from 'react';
import styled from 'styled-components';
import { toast } from 'react-hot-toast';
import { useKeplr } from '../hooks/useKeplr';
import { deployToken, validateTokenConfig } from '../services/cw20Service';

const LaunchpadContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
`;

const Title = styled.h1`
  text-align: center;
  color: white;
  margin-bottom: 2rem;
  font-size: 2.5rem;
  font-weight: bold;
`;

const Subtitle = styled.p`
  text-align: center;
  color: rgba(255,255,255,0.8);
  margin-bottom: 3rem;
  font-size: 1.1rem;
`;

const Form = styled.form`
  display: grid;
  gap: 1.5rem;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: ${props => props.columns || '1fr'};
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  color: white;
  font-weight: 600;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
`;

const Input = styled.input`
  padding: 1rem;
  border: 2px solid rgba(255,255,255,0.2);
  border-radius: 10px;
  background: rgba(255,255,255,0.1);
  color: white;
  font-size: 1rem;
  backdrop-filter: blur(10px);
  
  &::placeholder {
    color: rgba(255,255,255,0.6);
  }
  
  &:focus {
    outline: none;
    border-color: rgba(255,255,255,0.5);
    background: rgba(255,255,255,0.15);
  }
`;

const TextArea = styled.textarea`
  padding: 1rem;
  border: 2px solid rgba(255,255,255,0.2);
  border-radius: 10px;
  background: rgba(255,255,255,0.1);
  color: white;
  font-size: 1rem;
  backdrop-filter: blur(10px);
  resize: vertical;
  min-height: 100px;
  
  &::placeholder {
    color: rgba(255,255,255,0.6);
  }
  
  &:focus {
    outline: none;
    border-color: rgba(255,255,255,0.5);
    background: rgba(255,255,255,0.15);
  }
`;

const Select = styled.select`
  padding: 1rem;
  border: 2px solid rgba(255,255,255,0.2);
  border-radius: 10px;
  background: rgba(255,255,255,0.1);
  color: white;
  font-size: 1rem;
  backdrop-filter: blur(10px);
  
  &:focus {
    outline: none;
    border-color: rgba(255,255,255,0.5);
    background: rgba(255,255,255,0.15);
  }
  
  option {
    background: #333;
    color: white;
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Checkbox = styled.input`
  width: 20px;
  height: 20px;
  accent-color: #4CAF50;
`;

const LaunchButton = styled.button`
  background: linear-gradient(45deg, #4CAF50, #45a049);
  color: white;
  border: none;
  padding: 1.2rem 2rem;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(76, 175, 80, 0.3);
  }
  
  &:disabled {
    background: #666;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const InfoBox = styled.div`
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1rem;
`;

const InfoTitle = styled.h3`
  color: white;
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
`;

const InfoText = styled.p`
  color: rgba(255,255,255,0.8);
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
`;

const PreviewBox = styled.div`
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 10px;
  padding: 1.5rem;
  margin-top: 1rem;
`;

const PreviewTitle = styled.h3`
  color: white;
  margin: 0 0 1rem 0;
`;

const PreviewItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  color: rgba(255,255,255,0.9);
  font-size: 0.9rem;
`;

const TokenLaunchpad = () => {
  const { account, client } = useKeplr();
  const [isLaunching, setIsLaunching] = useState(false);
  
  const [tokenData, setTokenData] = useState({
    name: '',
    symbol: '',
    decimals: 6,
    description: '',
    initialSupply: '',
    maxSupply: '',
    mintable: true,
    burnable: true,
    transferable: true,
    recipient: '',
    logoUrl: '',
    website: '',
    telegram: '',
    twitter: '',
    discord: ''
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTokenData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const launchToken = async (e) => {
    e.preventDefault();
    
    if (!account) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!client) {
      toast.error('Wallet client not ready. Please try again.');
      return;
    }

    // Validate form data
    const errors = validateTokenConfig(tokenData);
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }

    setIsLaunching(true);

    try {
      // Set recipient to current user if not specified
      const finalTokenData = {
        ...tokenData,
        recipient: tokenData.recipient || account.address
      };

      const result = await deployToken(client, account.address, finalTokenData);

      if (result.success) {
        toast.success(
          <div>
            <div>🎉 Token launched successfully!</div>
            <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
              Contract: {result.contractAddress}
            </div>
            <div style={{ fontSize: '0.8rem' }}>
              Symbol: {result.tokenInfo.symbol}
            </div>
          </div>,
          { duration: 10000 }
        );

        // Reset form
        setTokenData({
          name: '',
          symbol: '',
          decimals: 6,
          description: '',
          initialSupply: '',
          maxSupply: '',
          mintable: true,
          burnable: true,
          transferable: true,
          recipient: '',
          logoUrl: '',
          website: '',
          telegram: '',
          twitter: '',
          discord: ''
        });
      }

    } catch (error) {
      console.error('❌ Token launch failed:', error);
      toast.error(`Failed to launch token: ${error.message}`);
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <LaunchpadContainer>
      <Title>🚀 Token Launchpad</Title>
      <Subtitle>
        Create and deploy your own CW20 token on Cosmos Hub
      </Subtitle>

      <InfoBox>
        <InfoTitle>💡 How it works</InfoTitle>
        <InfoText>
          Deploy your custom CW20 token with advanced features like minting, burning, and marketing info. 
          Your token will be immediately tradeable on this DEX and compatible with the entire Cosmos ecosystem.
        </InfoText>
      </InfoBox>

      <InfoBox style={{ background: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
        <InfoTitle>🔍 Smart Contract Detection</InfoTitle>
        <InfoText>
          Our system automatically detects the correct CW20 contract code ID for deployment. If auto-detection fails, 
          you'll be prompted to enter the code ID manually. This ensures your token deploys correctly every time.
        </InfoText>
      </InfoBox>

      <Form onSubmit={launchToken}>
        <FormRow columns="1fr 1fr">
          <FormGroup>
            <Label>Token Name *</Label>
            <Input
              type="text"
              name="name"
              value={tokenData.name}
              onChange={handleInputChange}
              placeholder="e.g., My Awesome Token"
              required
            />
          </FormGroup>
          <FormGroup>
            <Label>Symbol *</Label>
            <Input
              type="text"
              name="symbol"
              value={tokenData.symbol}
              onChange={handleInputChange}
              placeholder="e.g., MAT"
              maxLength="12"
              required
            />
          </FormGroup>
        </FormRow>

        <FormRow columns="1fr 1fr 1fr">
          <FormGroup>
            <Label>Decimals</Label>
            <Select
              name="decimals"
              value={tokenData.decimals}
              onChange={handleInputChange}
            >
              <option value={0}>0</option>
              <option value={2}>2</option>
              <option value={6}>6</option>
              <option value={8}>8</option>
              <option value={18}>18</option>
            </Select>
          </FormGroup>
          <FormGroup>
            <Label>Initial Supply *</Label>
            <Input
              type="number"
              name="initialSupply"
              value={tokenData.initialSupply}
              onChange={handleInputChange}
              placeholder="1000000"
              min="1"
              step="any"
              required
            />
          </FormGroup>
          <FormGroup>
            <Label>Max Supply (Optional)</Label>
            <Input
              type="number"
              name="maxSupply"
              value={tokenData.maxSupply}
              onChange={handleInputChange}
              placeholder="Leave empty for unlimited"
              min="1"
              step="any"
            />
          </FormGroup>
        </FormRow>

        <FormGroup>
          <Label>Recipient Address *</Label>
          <Input
            type="text"
            name="recipient"
            value={tokenData.recipient}
            onChange={handleInputChange}
            placeholder={account?.address || "cosmos1..."}
            required
          />
        </FormGroup>

        <FormGroup>
          <Label>Description</Label>
          <TextArea
            name="description"
            value={tokenData.description}
            onChange={handleInputChange}
            placeholder="Describe your token's purpose and utility..."
          />
        </FormGroup>

        <FormRow columns="1fr 1fr">
          <FormGroup>
            <Label>Logo URL (Optional)</Label>
            <Input
              type="url"
              name="logoUrl"
              value={tokenData.logoUrl}
              onChange={handleInputChange}
              placeholder="https://example.com/logo.png"
            />
          </FormGroup>
          <FormGroup>
            <Label>Website (Optional)</Label>
            <Input
              type="url"
              name="website"
              value={tokenData.website}
              onChange={handleInputChange}
              placeholder="https://yourproject.com"
            />
          </FormGroup>
        </FormRow>

        <FormRow columns="1fr 1fr 1fr">
          <FormGroup>
            <Label>Twitter (Optional)</Label>
            <Input
              type="text"
              name="twitter"
              value={tokenData.twitter}
              onChange={handleInputChange}
              placeholder="@yourproject"
            />
          </FormGroup>
          <FormGroup>
            <Label>Telegram (Optional)</Label>
            <Input
              type="text"
              name="telegram"
              value={tokenData.telegram}
              onChange={handleInputChange}
              placeholder="@yourproject"
            />
          </FormGroup>
          <FormGroup>
            <Label>Discord (Optional)</Label>
            <Input
              type="text"
              name="discord"
              value={tokenData.discord}
              onChange={handleInputChange}
              placeholder="discord.gg/yourproject"
            />
          </FormGroup>
        </FormRow>

        <FormRow columns="1fr 1fr 1fr">
          <CheckboxGroup>
            <Checkbox
              type="checkbox"
              name="mintable"
              checked={tokenData.mintable}
              onChange={handleInputChange}
            />
            <Label>Mintable</Label>
          </CheckboxGroup>
          <CheckboxGroup>
            <Checkbox
              type="checkbox"
              name="burnable"
              checked={tokenData.burnable}
              onChange={handleInputChange}
            />
            <Label>Burnable</Label>
          </CheckboxGroup>
          <CheckboxGroup>
            <Checkbox
              type="checkbox"
              name="transferable"
              checked={tokenData.transferable}
              onChange={handleInputChange}
            />
            <Label>Transferable</Label>
          </CheckboxGroup>
        </FormRow>

        {tokenData.name && tokenData.symbol && (
          <PreviewBox>
            <PreviewTitle>📋 Token Preview</PreviewTitle>
            <PreviewItem>
              <span>Name:</span>
              <span>{tokenData.name}</span>
            </PreviewItem>
            <PreviewItem>
              <span>Symbol:</span>
              <span>{tokenData.symbol.toUpperCase()}</span>
            </PreviewItem>
            <PreviewItem>
              <span>Decimals:</span>
              <span>{tokenData.decimals}</span>
            </PreviewItem>
            <PreviewItem>
              <span>Initial Supply:</span>
              <span>{tokenData.initialSupply ? parseFloat(tokenData.initialSupply).toLocaleString() : '0'}</span>
            </PreviewItem>
            <PreviewItem>
              <span>Max Supply:</span>
              <span>{tokenData.maxSupply ? parseFloat(tokenData.maxSupply).toLocaleString() : 'Unlimited'}</span>
            </PreviewItem>
            <PreviewItem>
              <span>Features:</span>
              <span>
                {tokenData.mintable && '🔨 Mintable '}
                {tokenData.burnable && '🔥 Burnable '}
                {tokenData.transferable && '↔️ Transferable'}
              </span>
            </PreviewItem>
          </PreviewBox>
        )}

        <LaunchButton
          type="submit"
          disabled={isLaunching || !account}
        >
          {isLaunching ? '🚀 Launching Token...' : '🚀 Launch Token'}
        </LaunchButton>
      </Form>
    </LaunchpadContainer>
  );
};

export default TokenLaunchpad;
