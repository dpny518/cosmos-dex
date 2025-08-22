// CW20 Service - Handles CW20 token deployment and interactions

import { toast } from 'react-hot-toast';

// CW20 Code ID on Cosmos Hub (this needs to be updated with actual CW20 code ID)
const CW20_CODE_ID = 1; // Placeholder - needs to be updated

/**
 * Deploy a new CW20 token
 */
export async function deployToken(client, senderAddress, tokenConfig) {
  try {
    console.log('🚀 Deploying CW20 token:', tokenConfig);

    // Validate required fields
    if (!tokenConfig.name || !tokenConfig.symbol || !tokenConfig.initialSupply) {
      throw new Error('Name, symbol, and initial supply are required');
    }

    // Convert amounts to proper format (multiply by 10^decimals)
    const decimals = parseInt(tokenConfig.decimals) || 6;
    const initialSupply = (parseFloat(tokenConfig.initialSupply) * Math.pow(10, decimals)).toString();
    const maxSupply = tokenConfig.maxSupply 
      ? (parseFloat(tokenConfig.maxSupply) * Math.pow(10, decimals)).toString() 
      : null;

    // Prepare CW20 instantiate message
    const instantiateMsg = {
      name: tokenConfig.name,
      symbol: tokenConfig.symbol.toUpperCase(),
      decimals: decimals,
      initial_balances: [
        {
          address: tokenConfig.recipient || senderAddress,
          amount: initialSupply
        }
      ],
      mint: tokenConfig.mintable ? {
        minter: senderAddress,
        cap: maxSupply
      } : null,
      marketing: {
        project: tokenConfig.name,
        description: tokenConfig.description || null,
        marketing: senderAddress,
        logo: tokenConfig.logoUrl ? { url: tokenConfig.logoUrl } : null
      }
    };

    console.log('📝 CW20 instantiate message:', instantiateMsg);

    // Calculate gas fee
    const fee = {
      amount: [{ denom: 'uatom', amount: '10000' }], // 0.01 ATOM
      gas: '400000', // Higher gas limit for contract instantiation
    };

    // Deploy the token
    const result = await client.instantiate(
      senderAddress,
      CW20_CODE_ID,
      instantiateMsg,
      `${tokenConfig.name} (${tokenConfig.symbol})`,
      fee,
      {
        admin: tokenConfig.mintable ? senderAddress : null
      }
    );

    console.log('✅ Token deployed successfully:', result);

    return {
      success: true,
      contractAddress: result.contractAddress,
      transactionHash: result.transactionHash,
      tokenInfo: {
        name: tokenConfig.name,
        symbol: tokenConfig.symbol.toUpperCase(),
        decimals: decimals,
        totalSupply: initialSupply,
        maxSupply: maxSupply,
        mintable: tokenConfig.mintable,
        contractAddress: result.contractAddress
      }
    };

  } catch (error) {
    console.error('❌ Token deployment failed:', error);
    
    // Handle specific error cases
    if (error.message.includes('code id')) {
      throw new Error('CW20 contract code not found. Please contact support.');
    } else if (error.message.includes('insufficient funds')) {
      throw new Error('Insufficient ATOM balance for deployment fees.');
    } else if (error.message.includes('gas')) {
      throw new Error('Transaction failed due to gas issues. Please try again.');
    }
    
    throw error;
  }
}

/**
 * Query CW20 token information
 */
export async function getTokenInfo(client, contractAddress) {
  try {
    const tokenInfo = await client.queryContractSmart(contractAddress, {
      token_info: {}
    });
    
    return tokenInfo;
  } catch (error) {
    console.error('❌ Failed to get token info:', error);
    throw new Error('Failed to query token information');
  }
}

/**
 * Query CW20 token balance for an address
 */
export async function getTokenBalance(client, contractAddress, address) {
  try {
    const balance = await client.queryContractSmart(contractAddress, {
      balance: { address }
    });
    
    return balance.balance;
  } catch (error) {
    console.error('❌ Failed to get token balance:', error);
    return '0';
  }
}

/**
 * Transfer CW20 tokens
 */
export async function transferTokens(client, senderAddress, contractAddress, recipient, amount) {
  try {
    const fee = {
      amount: [{ denom: 'uatom', amount: '5000' }],
      gas: '200000',
    };

    const executeMsg = {
      transfer: {
        recipient: recipient,
        amount: amount.toString()
      }
    };

    const result = await client.execute(
      senderAddress,
      contractAddress,
      executeMsg,
      fee
    );

    return result;
  } catch (error) {
    console.error('❌ Token transfer failed:', error);
    throw error;
  }
}

/**
 * Mint CW20 tokens (only if mintable and sender is minter)
 */
export async function mintTokens(client, senderAddress, contractAddress, recipient, amount) {
  try {
    const fee = {
      amount: [{ denom: 'uatom', amount: '5000' }],
      gas: '200000',
    };

    const executeMsg = {
      mint: {
        recipient: recipient,
        amount: amount.toString()
      }
    };

    const result = await client.execute(
      senderAddress,
      contractAddress,
      executeMsg,
      fee
    );

    return result;
  } catch (error) {
    console.error('❌ Token minting failed:', error);
    throw error;
  }
}

/**
 * Burn CW20 tokens
 */
export async function burnTokens(client, senderAddress, contractAddress, amount) {
  try {
    const fee = {
      amount: [{ denom: 'uatom', amount: '5000' }],
      gas: '200000',
    };

    const executeMsg = {
      burn: {
        amount: amount.toString()
      }
    };

    const result = await client.execute(
      senderAddress,
      contractAddress,
      executeMsg,
      fee
    );

    return result;
  } catch (error) {
    console.error('❌ Token burning failed:', error);
    throw error;
  }
}

/**
 * Get minter information
 */
export async function getMinterInfo(client, contractAddress) {
  try {
    const minter = await client.queryContractSmart(contractAddress, {
      minter: {}
    });
    
    return minter;
  } catch (error) {
    console.error('❌ Failed to get minter info:', error);
    return null;
  }
}

/**
 * Validate token configuration
 */
export function validateTokenConfig(config) {
  const errors = [];

  if (!config.name || config.name.trim().length === 0) {
    errors.push('Token name is required');
  }

  if (!config.symbol || config.symbol.trim().length === 0) {
    errors.push('Token symbol is required');
  }

  if (config.symbol && config.symbol.length > 12) {
    errors.push('Token symbol must be 12 characters or less');
  }

  if (!config.initialSupply || parseFloat(config.initialSupply) <= 0) {
    errors.push('Initial supply must be greater than 0');
  }

  if (config.maxSupply && parseFloat(config.maxSupply) < parseFloat(config.initialSupply)) {
    errors.push('Max supply must be greater than or equal to initial supply');
  }

  if (!config.recipient || config.recipient.trim().length === 0) {
    errors.push('Recipient address is required');
  }

  if (config.recipient && !config.recipient.startsWith('cosmos1')) {
    errors.push('Recipient must be a valid Cosmos address');
  }

  return errors;
}

/**
 * Format token amount for display
 */
export function formatTokenAmount(amount, decimals = 6) {
  if (!amount) return '0';
  
  const divisor = Math.pow(10, decimals);
  const formatted = (parseInt(amount) / divisor).toLocaleString();
  
  return formatted;
}

/**
 * Parse token amount from user input
 */
export function parseTokenAmount(amount, decimals = 6) {
  if (!amount) return '0';
  
  const multiplier = Math.pow(10, decimals);
  const parsed = (parseFloat(amount) * multiplier).toString();
  
  return parsed;
}
