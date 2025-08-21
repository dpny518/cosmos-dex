# Cosmos DEX - Decentralized Exchange on Cosmos Hub

A fully functional decentralized exchange (DEX) built on Cosmos Hub using CosmWasm smart contracts. This DEX enables users to create liquidity pools, provide liquidity, and swap tokens with automated market maker (AMM) functionality.

## 🚀 Live Deployment

**Mainnet Contract Details:**
- **Network**: Cosmos Hub (cosmoshub-4)
- **Code ID**: `250`
- **Contract Address**: `cosmos1svd8fpfwrf237qprqt33ajylg302s05neruqt37p3ju2qktkt6wqytq4ez`
- **Admin**: `cosmos1ch8mj9l4xeq0re62xs90aga0e9f8pxxc49zedu`
- **Fee Rate**: 30 basis points (0.3%)

**Transaction Hashes:**
- Store Contract: `F7895B24EFB41D808FF9EDE77743C26C144B25C1D7715731309DC6156EC87301`
- Instantiate Contract: `E797B3D79A42D8A76EF666A7BEED21D652BF48443A2B28D403B4CDAA4E00D8CD`

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Smart Contract](#smart-contract)
- [Frontend](#frontend)
- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Contributing](#contributing)

## ✨ Features

### Core DEX Functionality
- **Liquidity Pools**: Create and manage token pairs
- **Add/Remove Liquidity**: Provide liquidity to earn trading fees
- **Token Swaps**: Swap between any tokens in available pools
- **Price Discovery**: Automated market maker (AMM) pricing
- **Fee Collection**: Configurable trading fees for liquidity providers

### Advanced Features
- **Admin Controls**: Update fee rates and admin settings
- **Pool Analytics**: Query pool reserves, liquidity, and statistics
- **Swap Simulation**: Preview swap outcomes before execution
- **Slippage Protection**: Minimum output amount protection
- **Gas Optimization**: Optimized contract code for minimal gas usage

## 🏗 Architecture

```
cosmos-dex/
├── contracts/
│   └── dex-contract/          # Main DEX smart contract
│       ├── src/
│       │   ├── contract.rs    # Entry points
│       │   ├── execute.rs     # Execute message handlers
│       │   ├── query.rs       # Query handlers
│       │   ├── state.rs       # State management
│       │   ├── msg.rs         # Message definitions
│       │   ├── error.rs       # Error types
│       │   └── lib.rs         # Library exports
│       └── Cargo.toml
├── frontend/                  # React frontend application
├── scripts/                   # Deployment and utility scripts
├── artifacts/                 # Compiled WASM contracts
└── docs/                      # Documentation
```

## 📝 Smart Contract

### Contract Overview

The DEX contract is built using CosmWasm and implements a constant product AMM (x * y = k) similar to Uniswap V2.

### Key Components

#### State Management
- **CONFIG**: Stores admin address and fee rate
- **POOLS**: Maps token pairs to pool information
- **LIQUIDITY**: Tracks user liquidity positions

#### Message Types

**InstantiateMsg**
```rust
pub struct InstantiateMsg {
    pub admin: Option<String>,
    pub fee_rate: Uint128, // Fee rate in basis points (e.g., 30 = 0.3%)
}
```

**ExecuteMsg**
- `CreatePool`: Create a new trading pair
- `AddLiquidity`: Add liquidity to existing pool
- `RemoveLiquidity`: Remove liquidity from pool
- `Swap`: Execute token swap
- `UpdateAdmin`: Update contract admin
- `UpdateFeeRate`: Update trading fee rate

**QueryMsg**
- `Config`: Get contract configuration
- `Pool`: Get specific pool information
- `Pools`: Get all pools with pagination
- `Liquidity`: Get user's liquidity position
- `Simulation`: Simulate swap outcome

### Contract Functions

#### Pool Creation
```rust
pub fn execute_create_pool(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    token_a: String,
    token_b: String,
    initial_a: Uint128,
    initial_b: Uint128,
) -> Result<Response, ContractError>
```

#### Liquidity Management
```rust
pub fn execute_add_liquidity(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    token_a: String,
    token_b: String,
    amount_a: Uint128,
    amount_b: Uint128,
    min_liquidity: Uint128,
) -> Result<Response, ContractError>
```

#### Token Swapping
```rust
pub fn execute_swap(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    token_in: String,
    token_out: String,
    amount_in: Uint128,
    min_amount_out: Uint128,
) -> Result<Response, ContractError>
```

## 🖥 Frontend

The frontend is a React application that provides a user-friendly interface for interacting with the DEX contract.

### Features
- **Wallet Connection**: Connect Keplr and other Cosmos wallets
- **Pool Management**: Create pools and manage liquidity
- **Token Swapping**: Intuitive swap interface
- **Portfolio Tracking**: View your liquidity positions
- **Real-time Data**: Live pool statistics and pricing

### Technology Stack
- **React 18**: Modern React with hooks
- **TypeScript**: Type-safe development
- **CosmJS**: Cosmos blockchain interaction
- **Tailwind CSS**: Utility-first styling
- **Vite**: Fast build tool and dev server

## 🛠 Installation

### Prerequisites
- Node.js 18+
- Rust 1.70+
- Docker (for contract optimization)
- `gaiad` CLI tool

### Clone Repository
```bash
git clone https://github.com/your-username/cosmos-dex.git
cd cosmos-dex
```

### Install Dependencies
```bash
# Install frontend dependencies
cd frontend
npm install

# Install Rust dependencies (for contract development)
cd ../contracts
cargo build
```

### Environment Setup
```bash
# Copy environment template
cp frontend/.env.example frontend/.env

# Edit environment variables
nano frontend/.env
```

## 🚀 Usage

### Building the Contract

#### Development Build
```bash
./build-simple.sh
```

#### Production Build (Optimized)
```bash
./build-workspace-optimized.sh
```

### Running the Frontend
```bash
cd frontend
npm run dev
```

### Deploying to Mainnet
```bash
# Make sure you have a funded wallet
./deploy-mainnet.sh
```

## 📚 API Reference

### Query Contract State

#### Get Contract Config
```bash
gaiad query wasm contract-state smart cosmos1svd8fpfwrf237qprqt33ajylg302s05neruqt37p3ju2qktkt6wqytq4ez '{"config":{}}' --node https://cosmos-rpc.polkachu.com/
```

#### Get Pool Information
```bash
gaiad query wasm contract-state smart cosmos1svd8fpfwrf237qprqt33ajylg302s05neruqt37p3ju2qktkt6wqytq4ez '{"pool":{"token_a":"uatom","token_b":"token_address"}}' --node https://cosmos-rpc.polkachu.com/
```

#### Simulate Swap
```bash
gaiad query wasm contract-state smart cosmos1svd8fpfwrf237qprqt33ajylg302s05neruqt37p3ju2qktkt6wqytq4ez '{"simulation":{"token_in":"uatom","token_out":"token_address","amount_in":"1000000"}}' --node https://cosmos-rpc.polkachu.com/
```

### Execute Contract Functions

#### Create Pool
```bash
gaiad tx wasm execute cosmos1svd8fpfwrf237qprqt33ajylg302s05neruqt37p3ju2qktkt6wqytq4ez '{"create_pool":{"token_a":"uatom","token_b":"token_address","initial_a":"1000000","initial_b":"1000000"}}' --from your-key --chain-id cosmoshub-4 --gas-prices 0.025uatom --gas auto --gas-adjustment 1.3 --yes
```

#### Add Liquidity
```bash
gaiad tx wasm execute cosmos1svd8fpfwrf237qprqt33ajylg302s05neruqt37p3ju2qktkt6wqytq4ez '{"add_liquidity":{"token_a":"uatom","token_b":"token_address","amount_a":"500000","amount_b":"500000","min_liquidity":"1000"}}' --from your-key --chain-id cosmoshub-4 --gas-prices 0.025uatom --gas auto --gas-adjustment 1.3 --yes
```

#### Swap Tokens
```bash
gaiad tx wasm execute cosmos1svd8fpfwrf237qprqt33ajylg302s05neruqt37p3ju2qktkt6wqytq4ez '{"swap":{"token_in":"uatom","token_out":"token_address","amount_in":"100000","min_amount_out":"95000"}}' --from your-key --chain-id cosmoshub-4 --gas-prices 0.025uatom --gas auto --gas-adjustment 1.3 --yes
```

## 🚀 Deployment

### Contract Deployment

The contract has been deployed to Cosmos Hub mainnet. To deploy to other networks:

1. **Update Network Configuration**
   ```bash
   # Edit deploy-mainnet.sh
   CHAIN_ID="your-chain-id"
   NODE="your-rpc-endpoint"
   ```

2. **Build Optimized Contract**
   ```bash
   ./build-workspace-optimized.sh
   ```

3. **Deploy Contract**
   ```bash
   ./deploy-mainnet.sh
   ```

### Frontend Deployment

#### Cloudflare Pages
1. **Build the frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy to Cloudflare Pages**
   - Connect your GitHub repository to Cloudflare Pages
   - Set build command: `npm run build`
   - Set build output directory: `dist`
   - Add environment variables from `.env`

#### Environment Variables for Production
```env
VITE_CHAIN_ID=cosmoshub-4
VITE_CHAIN_NAME=Cosmos Hub
VITE_RPC_ENDPOINT=https://cosmos-rpc.polkachu.com
VITE_REST_ENDPOINT=https://cosmos-rest.polkachu.com
VITE_CONTRACT_ADDRESS=cosmos1svd8fpfwrf237qprqt33ajylg302s05neruqt37p3ju2qktkt6wqytq4ez
VITE_DENOM=uatom
VITE_COIN_DECIMALS=6
VITE_COIN_MINIMAL_DENOM=uatom
```

## 🧪 Testing

### Unit Tests
```bash
cd contracts/dex-contract
cargo test
```

### Integration Tests
```bash
cd contracts
cargo test --test integration
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📊 Gas Costs

| Operation | Estimated Gas | Cost (0.025 uatom/gas) |
|-----------|---------------|------------------------|
| Store Contract | ~2.3M | ~57,500 uatom |
| Instantiate | ~240K | ~6,000 uatom |
| Create Pool | ~200K | ~5,000 uatom |
| Add Liquidity | ~150K | ~3,750 uatom |
| Swap | ~120K | ~3,000 uatom |
| Remove Liquidity | ~130K | ~3,250 uatom |

## 🔒 Security

### Audit Status
- **Status**: Self-audited
- **Recommendations**: Professional audit recommended before mainnet use
- **Known Issues**: None currently identified

### Security Features
- **Admin Controls**: Limited admin functions
- **Slippage Protection**: Minimum output validation
- **Overflow Protection**: Safe math operations
- **Access Control**: Proper permission checks

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow Rust best practices for contract code
- Use TypeScript for frontend development
- Add tests for new features
- Update documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **CosmWasm**: Smart contract framework
- **Cosmos SDK**: Blockchain framework
- **Cosmos Hub**: Deployment network
- **React**: Frontend framework

## 📞 Support

- **GitHub Issues**: [Create an issue](https://github.com/your-username/cosmos-dex/issues)
- **Discord**: Join our community
- **Documentation**: [Full docs](https://docs.cosmos-dex.com)

---

**Built with ❤️ for the Cosmos ecosystem**
