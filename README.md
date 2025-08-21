# 🌌 Cosmos DEX

A decentralized exchange (DEX) smart contract built on CosmWasm for Cosmos Hub, featuring automated market making (AMM) functionality similar to Uniswap V2.

## 🚀 Features

- **Token Swaps**: Trade tokens with automated pricing via constant product formula
- **Liquidity Pools**: Create and manage liquidity pools for token pairs
- **Liquidity Mining**: Earn fees by providing liquidity to pools
- **React Frontend**: Modern web interface for interacting with the DEX
- **Docker Support**: Containerized deployment and development environment
- **Key Management**: Secure deployer key generation and storage

## 📋 Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Keplr Wallet browser extension
- ATOM tokens for gas fees

## 🛠️ Quick Start

### 1. Clone and Build

```bash
git clone <repository-url>
cd cosmos-dex

# Build smart contracts
make build-contracts

# Generate deployer keys
make generate-keys
```

### 2. Fund Deployer Address

After generating keys, you'll see a deployer address. Fund this address with ATOM:

```bash
# The deployer address will be shown after key generation
# Send at least 10 ATOM to this address for deployment costs
```

### 3. Deploy Contracts

```bash
# Deploy to Cosmos Hub mainnet
make deploy-contracts

# Or for testnet deployment, set environment variables:
export CHAIN_ID=theta-testnet-001
export RPC_URL=https://rpc.sentry-01.theta-testnet.polypore.xyz
export REST_URL=https://rest.sentry-01.theta-testnet.polypore.xyz
make deploy-contracts
```

### 4. Update Frontend Configuration

After deployment, update the contract address in the frontend:

```bash
# Edit frontend/src/config.js and update:
contractAddress: 'cosmos1...' # Replace with your deployed contract address
```

### 5. Start Frontend

```bash
make run-frontend
# Frontend will be available at http://localhost:3000
```

## 💰 ATOM Deposit and Fee Structure

### Gas Fees

All transactions on Cosmos Hub require ATOM for gas fees:

- **Contract Deployment**: ~0.5-1 ATOM
- **Create Pool**: ~0.01-0.02 ATOM
- **Add Liquidity**: ~0.008-0.015 ATOM  
- **Remove Liquidity**: ~0.008-0.015 ATOM
- **Token Swap**: ~0.005-0.01 ATOM

### DEX Trading Fees

The DEX charges a **0.3%** trading fee on all swaps:

- Fee is automatically deducted from input tokens
- Fees are distributed proportionally to liquidity providers
- Fee rate is configurable by contract admin

### Where to Deposit ATOM

#### For Deployment:
1. **Generate Keys**: Run `make generate-keys`
2. **Fund Address**: Send ATOM to the generated deployer address
3. **Deploy**: Run `make deploy-contracts`

#### For Trading:
1. **Connect Keplr**: Use the frontend to connect your Keplr wallet
2. **Ensure Balance**: Have sufficient ATOM for gas fees
3. **Trade**: Gas fees will be automatically calculated and paid

### Recommended ATOM Holdings:

- **Deployers**: 10+ ATOM for deployment and initial operations
- **Traders**: 1+ ATOM for regular trading activities  
- **Liquidity Providers**: 2+ ATOM for pool creation and management

## 🏗️ Architecture

### Smart Contract Components

- **Pool Management**: Create and manage AMM pools
- **Swap Engine**: Constant product market maker
- **Liquidity Tracking**: LP token accounting
- **Fee Collection**: Configurable trading fees

### Frontend Components

- **Wallet Integration**: Keplr wallet connection
- **Swap Interface**: Token trading interface
- **Liquidity Interface**: Pool management UI
- **Real-time Updates**: Live balance and pool data

## 🔧 Development

### Local Development

```bash
# Start development environment
docker-compose up -d

# Build contracts locally
./build-contracts.sh

# Run tests
cd contracts/dex-contract && cargo test
```

### Contract Schema

Generate JSON schema for contract messages:

```bash
cd contracts/dex-contract
cargo schema
```

## 📝 Contract Messages

### Instantiate
```json
{
  "admin": "cosmos1...", // Optional admin address
  "fee_rate": "30"       // Fee rate in basis points (30 = 0.3%)
}
```

### Execute Messages

#### Create Pool
```json
{
  "create_pool": {
    "token_a": "uatom",
    "token_b": "cosmos1...", // CW20 token address
    "initial_a": "1000000",  // 1 ATOM
    "initial_b": "1000000"   // Token B amount
  }
}
```

#### Swap
```json
{
  "swap": {
    "token_in": "uatom",
    "token_out": "cosmos1...",
    "amount_in": "1000000",
    "min_amount_out": "990000" // Slippage protection
  }
}
```

### Query Messages

#### Pool Info
```json
{
  "pool": {
    "token_a": "uatom",
    "token_b": "cosmos1..."
  }
}
```

#### Simulate Swap
```json
{
  "simulation": {
    "token_in": "uatom", 
    "token_out": "cosmos1...",
    "amount_in": "1000000"
  }
}
```

## 🔐 Security

### Key Management

- Deployer keys are stored in `/keys/` directory
- Keys are in JSON format with mnemonic phrases
- **Keep keys secure** and never commit to version control
- Use different keys for mainnet and testnet

### Smart Contract Security

- Implements slippage protection
- Validates all inputs and state transitions
- Uses proven AMM formulas
- Admin functions are access-controlled

## 🚨 Important Notes

1. **Mainnet Deployment**: Ensure thorough testing on testnet first
2. **Key Security**: Store deployer keys securely, consider hardware wallets for production
3. **Gas Prices**: Monitor network congestion and adjust gas prices accordingly
4. **Slippage**: Always use appropriate slippage settings for swaps
5. **Pool Ratios**: Maintain balanced liquidity ratios for efficient trading

## 📞 Support

- Review logs in Docker containers for troubleshooting
- Check Keplr connection for frontend issues  
- Verify sufficient ATOM balance for all transactions
- Ensure contract address is correctly configured in frontend

## 🛡️ License

This project is open source and available under the MIT License.