import { useState, useEffect, useCallback } from 'react';
import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { GasPrice } from '@cosmjs/stargate';
import { config, keplrChainConfig } from '../config';
import toast from 'react-hot-toast';

export const useKeplr = () => {
  const [account, setAccount] = useState(null);
  const [client, setClient] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connectWallet = useCallback(async () => {
    if (!window.keplr) {
      toast.error('Keplr wallet not found. Please install Keplr extension.');
      return;
    }

    setIsConnecting(true);
    try {
      // Suggest chain to Keplr
      await window.keplr.experimentalSuggestChain(keplrChainConfig);
      
      // Enable chain
      await window.keplr.enable(config.chainId);
      
      // Get offline signer
      const offlineSigner = window.keplr.getOfflineSigner(config.chainId);
      
      // Get accounts
      const accounts = await offlineSigner.getAccounts();
      const account = accounts[0];
      
      // Create signing client
      const signingClient = await SigningCosmWasmClient.connectWithSigner(
        config.rpc,
        offlineSigner,
        {
          gasPrice: GasPrice.fromString(`${config.gasPriceStep.average}${config.coinMinimalDenom}`)
        }
      );
      
      setAccount(account);
      setClient(signingClient);
      toast.success('Wallet connected successfully!');
      
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      toast.error('Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setClient(null);
    toast.success('Wallet disconnected');
  }, []);

  const getBalance = useCallback(async (address, denom = config.coinMinimalDenom) => {
    if (!client) return null;
    
    try {
      const balance = await client.getBalance(address, denom);
      return balance;
    } catch (error) {
      console.error('Failed to get balance:', error);
      return null;
    }
  }, [client]);

  const getAllBalances = useCallback(async (address) => {
    if (!client) return {};
    
    try {
      const balances = await client.getAllBalances(address);
      // Convert to object with denom as key and amount as value
      const balanceMap = {};
      balances.forEach(balance => {
        balanceMap[balance.denom] = balance.amount;
      });
      console.log('💰 getAllBalances result:', balanceMap);
      return balanceMap;
    } catch (error) {
      console.error('Failed to get all balances:', error);
      // Fallback: try to get individual balances for known tokens
      try {
        const atomBalance = await client.getBalance(address, 'uatom');
        const usdcBalance = await client.getBalance(address, 'ibc/F663521BF1836B00F5F177680F74BFB9A8B5654A694D0D2BC249E03CF2509013');
        
        const fallbackBalances = {};
        if (atomBalance.amount !== '0') {
          fallbackBalances[atomBalance.denom] = atomBalance.amount;
        }
        if (usdcBalance.amount !== '0') {
          fallbackBalances[usdcBalance.denom] = usdcBalance.amount;
        }
        
        console.log('💰 Fallback balances:', fallbackBalances);
        return fallbackBalances;
      } catch (fallbackError) {
        console.error('Fallback balance fetch failed:', fallbackError);
        return {};
      }
    }
  }, [client]);

  // Auto-connect on page load if previously connected
  useEffect(() => {
    const autoConnect = async () => {
      if (window.keplr && localStorage.getItem('keplr-connected') === 'true') {
        await connectWallet();
      }
    };
    
    autoConnect();
  }, [connectWallet]);

  // Save connection state
  useEffect(() => {
    if (account) {
      localStorage.setItem('keplr-connected', 'true');
    } else {
      localStorage.removeItem('keplr-connected');
    }
  }, [account]);

  // Listen for account changes
  useEffect(() => {
    if (window.keplr) {
      const handleAccountChange = () => {
        if (account) {
          connectWallet();
        }
      };

      window.addEventListener('keplr_keystorechange', handleAccountChange);
      return () => {
        window.removeEventListener('keplr_keystorechange', handleAccountChange);
      };
    }
  }, [account, connectWallet]);

  return {
    account,
    client,
    isConnecting,
    connectWallet,
    disconnectWallet,
    getBalance,
    getAllBalances,
    isConnected: !!account
  };
};