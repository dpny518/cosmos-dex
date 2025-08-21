import { useState, useCallback } from 'react';
import { coin } from '@cosmjs/stargate';
import { config } from '../config';
import toast from 'react-hot-toast';

export const useDex = (client, account) => {
  const [loading, setLoading] = useState(false);

  // Query contract
  const queryContract = useCallback(async (msg) => {
    if (!client) return null;
    
    try {
      const result = await client.queryContractSmart(config.contractAddress, msg);
      return result;
    } catch (error) {
      console.error('Query failed:', error);
      return null;
    }
  }, [client]);

  // Execute contract
  const executeContract = useCallback(async (msg, funds = []) => {
    if (!client || !account) {
      toast.error('Please connect your wallet');
      return null;
    }

    setLoading(true);
    try {
      const result = await client.execute(
        account.address,
        config.contractAddress,
        msg,
        'auto',
        undefined,
        funds
      );
      
      toast.success('Transaction successful!');
      return result;
    } catch (error) {
      console.error('Transaction failed:', error);
      toast.error(`Transaction failed: ${error.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [client, account]);

  // Create pool
  const createPool = useCallback(async (tokenA, tokenB, amountA, amountB) => {
    const msg = {
      create_pool: {
        token_a: tokenA,
        token_b: tokenB,
        initial_a: amountA.toString(),
        initial_b: amountB.toString()
      }
    };

    // Handle native token funds
    const funds = [];
    if (tokenA === 'uatom') {
      funds.push(coin(amountA.toString(), 'uatom'));
    }
    if (tokenB === 'uatom') {
      funds.push(coin(amountB.toString(), 'uatom'));
    }

    return await executeContract(msg, funds);
  }, [executeContract]);

  // Add liquidity
  const addLiquidity = useCallback(async (tokenA, tokenB, amountA, amountB, minLiquidity) => {
    const msg = {
      add_liquidity: {
        token_a: tokenA,
        token_b: tokenB,
        amount_a: amountA.toString(),
        amount_b: amountB.toString(),
        min_liquidity: minLiquidity.toString()
      }
    };

    const funds = [];
    if (tokenA === 'uatom') {
      funds.push(coin(amountA.toString(), 'uatom'));
    }
    if (tokenB === 'uatom') {
      funds.push(coin(amountB.toString(), 'uatom'));
    }

    return await executeContract(msg, funds);
  }, [executeContract]);

  // Remove liquidity
  const removeLiquidity = useCallback(async (tokenA, tokenB, liquidity, minA, minB) => {
    const msg = {
      remove_liquidity: {
        token_a: tokenA,
        token_b: tokenB,
        liquidity: liquidity.toString(),
        min_a: minA.toString(),
        min_b: minB.toString()
      }
    };

    return await executeContract(msg);
  }, [executeContract]);

  // Swap tokens
  const swap = useCallback(async (tokenIn, tokenOut, amountIn, minAmountOut) => {
    const msg = {
      swap: {
        token_in: tokenIn,
        token_out: tokenOut,
        amount_in: amountIn.toString(),
        min_amount_out: minAmountOut.toString()
      }
    };

    const funds = [];
    if (tokenIn === 'uatom') {
      funds.push(coin(amountIn.toString(), 'uatom'));
    }

    return await executeContract(msg, funds);
  }, [executeContract]);

  // Get pool info
  const getPool = useCallback(async (tokenA, tokenB) => {
    return await queryContract({
      pool: { token_a: tokenA, token_b: tokenB }
    });
  }, [queryContract]);

  // Get all pools
  const getPools = useCallback(async (startAfter = null, limit = 10) => {
    return await queryContract({
      pools: { start_after: startAfter, limit }
    });
  }, [queryContract]);

  // Get user liquidity
  const getUserLiquidity = useCallback(async (userAddress, tokenA, tokenB) => {
    return await queryContract({
      liquidity: {
        user: userAddress,
        token_a: tokenA,
        token_b: tokenB
      }
    });
  }, [queryContract]);

  // Simulate swap
  const simulateSwap = useCallback(async (tokenIn, tokenOut, amountIn) => {
    return await queryContract({
      simulation: {
        token_in: tokenIn,
        token_out: tokenOut,
        amount_in: amountIn.toString()
      }
    });
  }, [queryContract]);

  // Get config
  const getConfig = useCallback(async () => {
    return await queryContract({ config: {} });
  }, [queryContract]);

  return {
    loading,
    createPool,
    addLiquidity,
    removeLiquidity,
    swap,
    getPool,
    getPools,
    getUserLiquidity,
    simulateSwap,
    getConfig,
    queryContract,
    executeContract
  };
};