# 📖 Cosmos DEX Deployment Guide

This guide walks you through deploying the Cosmos DEX smart contract and frontend to Cosmos Hub.

## 🎯 Overview

The deployment process involves:
1. Setting up the development environment
2. Building the smart contracts  
3. Generating and funding deployer keys
4. Deploying contracts to Cosmos Hub
5. Configuring and deploying the frontend

## 🔧 Environment Setup

### Prerequisites

Ensure you have the following installed:

- **Docker**: Version 20.0 or higher
- **Docker Compose**: Version 2.0 or higher  
- **Git**: For cloning the repository
- **Keplr Wallet**: Browser extension for testing

### Clone Repository

```bash
git clone <your-repo-url>
cd cosmos-dex
```

## 🏗️ Build Smart Contracts

### Using Docker (Recommended)

The project uses CosmWasm's workspace optimizer for reproducible builds:

```bash
# Build all contracts
make build-contracts

# This runs the equivalent of:
docker run --rm -v "$(pwd)":/code \
  --mount type=volume,source="$(basename "$(pwd)")_cache",target=/code/target \
  --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
  cosmwasm/workspace-optimizer:0.14.0
```

### Build Artifacts

After successful build, you'll find:

```
artifacts/
├── dex_contract.wasm        # Optimized contract bytecode
├── checksums.txt           # File hashes
└── checksums_intermediate.txt
```

## 🔐 Key Management

### Generate Deployer Keys

```bash
make generate-keys

# This creates:
# - keys/current-deployer.json (current deployer info)
# - keys/deployer-<timestamp>.json (backup)
```

The output will show:
```
Generated address: cosmos1abc123...
Mnemonic: word1 word2 word3 ... (24 words)
```

**⚠️ SECURITY WARNING**: Store the mnemonic phrase securely! This controls your deployer wallet.

### Key File Structure

```json
{
  "address": "cosmos1abc123...",
  "mnemonic": "abandon abandon ... abandon art",
  "created": "2024-01-01T00:00:00.000Z",
  "network": "cosmoshub-4"
}
```

## 💰 Fund Deployer Address

### Mainnet Funding

Send ATOM to the generated deployer address:

```bash
# Minimum recommended: 10 ATOM
# Covers deployment (~1 ATOM) + operations (~9 ATOM buffer)

# You can fund via:
# 1. Keplr wallet transfer
# 2. Exchange withdrawal  
# 3. IBC transfer from other Cosmos chains
```

### Testnet Funding

For testnet deployment, use testnet faucets:

```bash
# Set testnet configuration
export CHAIN_ID=theta-testnet-001
export RPC_URL=https://rpc.sentry-01.theta-testnet.polypore.xyz
export REST_URL=https://rest.sentry-01.theta-testnet.polypore.xyz

# Use testnet faucet to fund address
```

## 🚀 Contract Deployment

### Deploy to Mainnet

```bash
make deploy-contracts

# This will:
# 1. Check deployer balance
# 2. Upload contract code  
# 3. Instantiate contract
# 4. Save deployment info
```

### Deploy to Testnet  

```bash
# Set testnet environment
export CHAIN_ID=theta-testnet-001  
export RPC_URL=https://rpc.sentry-01.theta-testnet.polypore.xyz
export REST_URL=https://rest.sentry-01.theta-testnet.polypore.xyz

make deploy-contracts
```

### Deployment Output

Successful deployment shows:

```
🎊 Deployment Summary:
━━━━━━━━━━━━━━━━━━━━━━━━
Network:           cosmoshub-4
Code ID:           1234
Contract Address:  cosmos1def456...
Deployer:          cosmos1abc123...  
Fee Rate:          30 (0.3%)
Deployed At:       2024-01-01T00:00:00.000Z
```

### Deployment Info Storage

Deployment details are saved to:
- `keys/deployment-info.json` - Contract addresses and config
- `keys/current-deployer.json` - Deployer wallet info

## 🌐 Frontend Configuration

### Update Contract Address

Edit `frontend/src/config.js`:

```javascript
export const config = {
  // ... other config
  contractAddress: 'cosmos1def456...', // Your deployed contract address
  // ...
};
```

### Environment Variables

Create `frontend/.env`:

```bash
REACT_APP_CHAIN_ID=cosmoshub-4
REACT_APP_RPC_URL=https://cosmos-rpc.polkachu.com
REACT_APP_REST_URL=https://cosmos-api.polkachu.com  
REACT_APP_CONTRACT_ADDRESS=cosmos1def456...
```

### Build and Deploy Frontend

```bash
# Local development
make run-frontend

# Production build
cd frontend && npm run build
```

## ✅ Verification

### Test Contract Functions

After deployment, verify the contract works:

#### 1. Query Contract Config

```bash
gaiad query wasm contract-state smart <CONTRACT_ADDRESS> '{"config":{}}'
```

#### 2. Create Test Pool (Optional)

Use the frontend or direct transaction to create a test pool with small amounts.

#### 3. Check Pool Creation

```bash
gaiad query wasm contract-state smart <CONTRACT_ADDRESS> '{"pools":{"limit":10}}'
```

### Frontend Testing

1. **Connect Keplr**: Ensure wallet connects successfully
2. **Check Balance**: Verify ATOM balance displays correctly
3. **Create Pool**: Test pool creation with small amounts
4. **Test Swap**: Verify swap simulation works

## 🔍 Troubleshooting

### Common Deployment Issues

#### Insufficient Gas

```
Error: insufficient fees; got: 5000uatom required: 7500uatom
```

**Solution**: Increase gas price or amount in deployment script.

#### Network Connection

```  
Error: connect ECONNREFUSED
```

**Solution**: Check RPC/REST endpoints are accessible and working.

#### Key Not Found

```
Error: Failed to load wallet: ENOENT: no such file
```

**Solution**: Run `make generate-keys` first.

### Frontend Issues

#### Contract Address Not Set

The frontend shows a warning if the contract address is not configured.

**Solution**: Update `frontend/src/config.js` with deployed contract address.

#### Keplr Connection Failed

**Solution**: 
1. Ensure Keplr extension is installed
2. Check network configuration matches deployed contract
3. Clear browser cache and try again

### Log Investigation

Check Docker logs for detailed error information:

```bash
# View deployment logs
docker-compose logs deployer

# View frontend logs
docker-compose logs frontend
```

## 🛡️ Security Best Practices

### Deployer Key Security

1. **Never commit keys** to version control
2. **Use hardware wallets** for production mainnet deployments  
3. **Backup mnemonics** in secure offline storage
4. **Use different keys** for testnet and mainnet

### Network Security

1. **Verify RPC endpoints** are trusted sources
2. **Use HTTPS** endpoints only
3. **Monitor gas prices** to avoid overpaying
4. **Test on testnet first** before mainnet deployment

### Contract Security

1. **Audit contract code** before mainnet deployment
2. **Test thoroughly** on testnet
3. **Start with small amounts** for initial liquidity
4. **Monitor contract** after deployment for unusual activity

## 📋 Deployment Checklist

Before mainnet deployment:

- [ ] Contract code audited and tested
- [ ] Deployer keys generated and secured  
- [ ] Sufficient ATOM balance for deployment
- [ ] Network configuration verified
- [ ] Frontend configuration updated
- [ ] Testnet deployment successful
- [ ] All functionality tested on testnet
- [ ] Backup plan prepared
- [ ] Monitoring setup ready

## 🎉 Post-Deployment

After successful deployment:

1. **Save deployment info** securely
2. **Update documentation** with contract addresses
3. **Test all functions** with small amounts
4. **Monitor gas usage** and optimize if needed
5. **Set up monitoring** for contract activity
6. **Announce deployment** to community
7. **Provide user guides** for interacting with DEX

This completes the deployment process. Your Cosmos DEX should now be live and ready for trading!