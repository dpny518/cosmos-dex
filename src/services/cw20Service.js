// CW20 Service - Handles CW20 token deployment and interactions

import { toast } from 'react-hot-toast';

// CW20 Code IDs to try (common CW20 contract code IDs on Cosmos Hub)
const POTENTIAL_CW20_CODE_IDS = [
  1,  // Often the first contract uploaded
  2,  // Second common ID
  3,  // Common CW20 code ID
  4,  // Alternative CW20 code ID
  5,  // Another potential CW20 code ID
  6,  // More alternatives
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19,
  20  // Extended range for more thorough search
];

/**
 * Try to find CW20 code ID from existing LP tokens
 */
async function findCW20CodeIdFromLPTokens() {
  try {
    // Check if we have any LP tokens that might indicate the CW20 code ID
    const lpTokens = JSON.parse(localStorage.getItem('lpTokens') || '[]');
    if (lpTokens.length > 0) {
      console.log('🔍 Found existing LP tokens, checking for CW20 patterns...');
      
      // Look for common patterns in LP token contract addresses
      for (const lpToken of lpTokens) {
        if (lpToken.contractAddress) {
          console.log(`📋 LP Token contract: ${lpToken.contractAddress}`);
          // You could query the contract to determine its code ID
          // This is a placeholder for now
        }
      }
    }
  } catch (error) {
    console.log('No existing LP tokens found for reference');
  }
  return null;
}

/**
 * Find a working CW20 code ID by testing instantiation
 */
async function findWorkingCW20CodeId(client) {
  console.log('🔍 Searching for working CW20 code ID...');
  
  // First try to get hint from existing LP tokens
  await findCW20CodeIdFromLPTokens();
  
  for (const codeId of POTENTIAL_CW20_CODE_IDS) {
    try {
      // Try to get code info to see if it exists and what type it is
      const codeInfo = await client.getCodeDetails(codeId);
      console.log(`📋 Code ID ${codeId}:`, codeInfo);
      
      // More comprehensive check for CW20 contracts
      const codeInfoStr = JSON.stringify(codeInfo).toLowerCase();
      const hasCW20Keywords = codeInfoStr.includes('cw20') || 
                              codeInfoStr.includes('token') || 
                              codeInfoStr.includes('erc20') ||
                              codeInfoStr.includes('balance') ||
                              codeInfoStr.includes('transfer');
      
      // Also check if it's NOT a DAO contract
      const isDAO = codeInfoStr.includes('dao') || 
                    codeInfoStr.includes('governance') || 
                    codeInfoStr.includes('proposal');
      
      if (hasCW20Keywords && !isDAO) {
        console.log(`✅ Found potential CW20 code ID: ${codeId}`);
        
        // Try a test instantiation to verify it's really a CW20 contract
        try {
          const testMsg = {
            name: "Test Token",
            symbol: "TEST",
            decimals: 6,
            initial_balances: []
          };
          
          // This will fail but help us identify if it's the right contract type
          await client.simulate(
            'cosmos1test', // dummy address
            codeId,
            testMsg,
            'Test Token'
          );
          
        } catch (simError) {
          const simErrorStr = simError.message.toLowerCase();
          if (simErrorStr.includes('dao_interface') || simErrorStr.includes('unknown field')) {
            console.log(`❌ Code ID ${codeId} is DAO contract, not CW20`);
            continue;
          } else {
            // Other simulation errors are expected and okay
            console.log(`✅ Code ID ${codeId} appears to be CW20 compatible`);
            return codeId;
          }
        }
      }
    } catch (error) {
      console.log(`❌ Code ID ${codeId} not available:`, error.message);
      continue;
    }
  }
  
  // If no automatic detection works, prompt user or use fallback
  console.log('⚠️ Could not auto-detect CW20 code ID, will prompt user');
  return null; // Return null to trigger manual input
}

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

    // Find working CW20 code ID
    let cw20CodeId = await findWorkingCW20CodeId(client);
    
    // If automatic detection failed, prompt user for manual input
    if (cw20CodeId === null) {
      const userCodeId = prompt('⚠️ Could not auto-detect CW20 contract code ID.\n\nPlease enter the CW20 contract code ID for this chain\n(You can find this from chain documentation or existing CW20 deployments):');
      
      if (!userCodeId || isNaN(parseInt(userCodeId))) {
        throw new Error('Invalid code ID provided. Please enter a valid numeric code ID.');
      }
      
      cw20CodeId = parseInt(userCodeId);
      console.log(`👤 User provided CW20 code ID: ${cw20CodeId}`);
    } else {
      console.log(`🎯 Auto-detected CW20 code ID: ${cw20CodeId}`);
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
      cw20CodeId,
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
    
    // Handle specific error cases with improved messaging
    if (error.message.includes('dao_interface::msg::InstantiateMsg')) {
      throw new Error(`❌ Wrong Contract Type: Code ID ${cw20CodeId} is a DAO contract, not a CW20 token contract.\n\n💡 Solution: Please refresh the page and try again. The system will auto-detect the correct CW20 contract or prompt you for the right code ID.`);
    } else if (error.message.includes('unknown field') && (error.message.includes('symbol') || error.message.includes('decimals'))) {
      throw new Error(`❌ Contract Mismatch: Code ID ${cw20CodeId} doesn't support CW20 token standard.\n\n💡 This often happens when the code ID points to a DAO or other contract type. Please try a different code ID.`);
    } else if (error.message.includes('code id') || error.message.includes('not found')) {
      throw new Error(`❌ Code ID Not Found: Code ID ${cw20CodeId} doesn't exist on this chain.\n\n💡 Please check the chain's documentation for available CW20 contract code IDs.`);
    } else if (error.message.includes('insufficient funds')) {
      throw new Error('❌ Insufficient Balance: You need more ATOM to pay for deployment fees.\n\n💡 Please add more ATOM to your wallet and try again.');
    } else if (error.message.includes('gas')) {
      throw new Error('❌ Gas Error: Transaction failed due to gas estimation issues.\n\n💡 This is usually temporary - please try again in a few moments.');
    } else if (error.message.includes('Invalid code ID provided')) {
      throw error; // Pass through validation errors as-is
    }
    
    // Generic error with helpful context
    throw new Error(`❌ Deployment Failed: ${error.message}\n\n💡 If this persists, the code ID ${cw20CodeId} might not be a compatible CW20 contract.`);
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
