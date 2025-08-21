# Cosmos DEX Smart Contract

A CosmWasm smart contract implementing a decentralized exchange (DEX) with automated market maker (AMM) functionality on Cosmos Hub.

## 📋 Contract Overview

The DEX contract implements a constant product AMM (x * y = k) similar to Uniswap V2, allowing users to:
- Create liquidity pools for token pairs
- Add and remove liquidity to earn trading fees
- Swap tokens with minimal slippage
- Manage pool parameters as admin

## 🏗 Architecture

### Contract Structure
```
contracts/
└── dex-contract/
    ├── src/
    │   ├── contract.rs    # Entry points (instantiate, execute, query)
    │   ├── execute.rs     # Execute message handlers
    │   ├── query.rs       # Query handlers
    │   ├── state.rs       # State management and storage
    │   ├── msg.rs         # Message type definitions
    │   ├── error.rs       # Custom error types
    │   └── lib.rs         # Library exports
    └── Cargo.toml         # Dependencies and metadata
```

### State Management

#### Primary Storage
- **CONFIG**: Contract configuration (admin, fee rate)
- **POOLS**: Pool information indexed by token pair
- **LIQUIDITY**: User liquidity positions

#### Storage Keys
```rust
// Config storage
pub const CONFIG: Item<Config> = Item::new("config");

// Pool storage - maps (token_a, token_b) -> PoolInfo
pub const POOLS: Map<(&str, &str), PoolInfo> = Map::new("pools");

// Liquidity storage - maps (user, token_a, token_b) -> Uint128
pub const LIQUIDITY: Map<(&str, &str, &str), Uint128> = Map::new("liquidity");
```

## 📝 Message Types

### InstantiateMsg
Initialize the contract with admin and fee rate.

```rust
pub struct InstantiateMsg {
    pub admin: Option<String>,      // Contract admin address
    pub fee_rate: Uint128,          // Fee rate in basis points (30 = 0.3%)
}
```

### ExecuteMsg
Execute messages for contract interactions.

```rust
pub enum ExecuteMsg {
    // Pool Management
    CreatePool {
        token_a: String,            // First token address
        token_b: String,            // Second token address
        initial_a: Uint128,         // Initial amount of token A
        initial_b: Uint128,         // Initial amount of token B
    },
    
    // Liquidity Management
    AddLiquidity {
        token_a: String,            // First token address
        token_b: String,            // Second token address
        amount_a: Uint128,          // Amount of token A to add
        amount_b: Uint128,          // Amount of token B to add
        min_liquidity: Uint128,     // Minimum liquidity tokens to receive
    },
    
    RemoveLiquidity {
        token_a: String,            // First token address
        token_b: String,            // Second token address
        liquidity: Uint128,         // Liquidity tokens to burn
        min_a: Uint128,             // Minimum token A to receive
        min_b: Uint128,             // Minimum token B to receive
    },
    
    // Trading
    Swap {
        token_in: String,           // Input token address
        token_out: String,          // Output token address
        amount_in: Uint128,         // Input amount
        min_amount_out: Uint128,    // Minimum output amount (slippage protection)
    },
    
    // Admin Functions
    UpdateAdmin {
        admin: String,              // New admin address
    },
    
    UpdateFeeRate {
        fee_rate: Uint128,          // New fee rate in basis points
    },
}
```

### QueryMsg
Query messages for reading contract state.

```rust
pub enum QueryMsg {
    // Configuration
    Config {},                      // Get contract config
    
    // Pool Information
    Pool {
        token_a: String,            // First token address
        token_b: String,            // Second token address
    },
    
    Pools {
        start_after: Option<String>, // Pagination start
        limit: Option<u32>,         // Results limit
    },
    
    // User Information
    Liquidity {
        user: String,               // User address
        token_a: String,            // First token address
        token_b: String,            // Second token address
    },
    
    // Trading Simulation
    Simulation {
        token_in: String,           // Input token address
        token_out: String,          // Output token address
        amount_in: Uint128,         // Input amount
    },
}
```

## 🔧 Core Functions

### Pool Creation
Creates a new liquidity pool for a token pair.

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

**Requirements:**
- Pool must not already exist
- Both initial amounts must be > 0
- User must send the initial tokens

**Process:**
1. Validate token addresses and amounts
2. Create pool with initial reserves
3. Mint initial liquidity tokens to creator
4. Transfer tokens from user to contract

### Liquidity Management

#### Add Liquidity
Adds liquidity to an existing pool.

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

**Formula:**
```
liquidity_minted = min(
    (amount_a * total_liquidity) / reserve_a,
    (amount_b * total_liquidity) / reserve_b
)
```

#### Remove Liquidity
Removes liquidity from a pool.

```rust
pub fn execute_remove_liquidity(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    token_a: String,
    token_b: String,
    liquidity: Uint128,
    min_a: Uint128,
    min_b: Uint128,
) -> Result<Response, ContractError>
```

**Formula:**
```
amount_a = (liquidity * reserve_a) / total_liquidity
amount_b = (liquidity * reserve_b) / total_liquidity
```

### Token Swapping

#### Swap Execution
Executes a token swap using the constant product formula.

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

**Formula (with fees):**
```
amount_in_with_fee = amount_in * (10000 - fee_rate) / 10000
amount_out = (amount_in_with_fee * reserve_out) / (reserve_in + amount_in_with_fee)
```

**Process:**
1. Validate pool exists and has liquidity
2. Calculate output amount using AMM formula
3. Apply trading fee
4. Check slippage protection
5. Update pool reserves
6. Transfer tokens

## 📊 Mathematical Formulas

### Constant Product Formula
The core AMM formula ensuring price discovery:
```
x * y = k (constant)
```

Where:
- `x` = reserve of token A
- `y` = reserve of token B  
- `k` = constant product

### Price Calculation
```
price_a_in_b = reserve_b / reserve_a
price_b_in_a = reserve_a / reserve_b
```

### Liquidity Token Calculation
For initial liquidity:
```
initial_liquidity = sqrt(amount_a * amount_b)
```

For additional liquidity:
```
liquidity_minted = min(
    (amount_a * total_liquidity) / reserve_a,
    (amount_b * total_liquidity) / reserve_b
)
```

### Fee Calculation
Trading fees are calculated as:
```
fee = amount_in * fee_rate / 10000
amount_in_after_fee = amount_in - fee
```

## 🔒 Security Features

### Access Control
- **Admin Functions**: Only admin can update fee rates and admin address
- **Pool Creation**: Anyone can create pools
- **Trading**: Anyone can trade and provide liquidity

### Input Validation
- Token addresses are validated
- Amounts must be positive
- Slippage protection via minimum output amounts
- Pool existence checks

### Overflow Protection
- All arithmetic operations use safe math
- Uint128 prevents overflow in most cases
- Division by zero checks

### Reentrancy Protection
- State updates before external calls
- No recursive calls possible

## 📈 Gas Optimization

### Storage Efficiency
- Minimal storage keys
- Efficient data structures
- Batch operations where possible

### Computation Efficiency
- Optimized mathematical operations
- Early returns for invalid inputs
- Minimal external calls

### Estimated Gas Costs
| Operation | Gas Cost | USD Cost (0.025 uatom/gas) |
|-----------|----------|---------------------------|
| Create Pool | ~200K | ~$0.30 |
| Add Liquidity | ~150K | ~$0.23 |
| Remove Liquidity | ~130K | ~$0.20 |
| Swap | ~120K | ~$0.18 |
| Query | ~10K | ~$0.015 |

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

### Test Coverage
- Pool creation and management
- Liquidity operations
- Token swapping
- Error conditions
- Edge cases

## 🚀 Deployment

### Build Contract
```bash
# Development build
cargo build --release --target wasm32-unknown-unknown

# Production build (optimized)
./build-workspace-optimized.sh
```

### Deploy to Mainnet
```bash
./deploy-mainnet.sh
```

### Verify Deployment
```bash
# Check contract info
gaiad query wasm contract cosmos1svd8fpfwrf237qprqt33ajylg302s05neruqt37p3ju2qktkt6wqytq4ez --node https://cosmos-rpc.polkachu.com/

# Query config
gaiad query wasm contract-state smart cosmos1svd8fpfwrf237qprqt33ajylg302s05neruqt37p3ju2qktkt6wqytq4ez '{"config":{}}' --node https://cosmos-rpc.polkachu.com/
```

## 📚 Usage Examples

### Create a Pool
```bash
gaiad tx wasm execute cosmos1svd8fpfwrf237qprqt33ajylg302s05neruqt37p3ju2qktkt6wqytq4ez \
  '{"create_pool":{"token_a":"uatom","token_b":"ibc/token","initial_a":"1000000","initial_b":"1000000"}}' \
  --from your-key --chain-id cosmoshub-4 --gas-prices 0.025uatom --gas auto --yes
```

### Add Liquidity
```bash
gaiad tx wasm execute cosmos1svd8fpfwrf237qprqt33ajylg302s05neruqt37p3ju2qktkt6wqytq4ez \
  '{"add_liquidity":{"token_a":"uatom","token_b":"ibc/token","amount_a":"500000","amount_b":"500000","min_liquidity":"1000"}}' \
  --from your-key --chain-id cosmoshub-4 --gas-prices 0.025uatom --gas auto --yes
```

### Swap Tokens
```bash
gaiad tx wasm execute cosmos1svd8fpfwrf237qprqt33ajylg302s05neruqt37p3ju2qktkt6wqytq4ez \
  '{"swap":{"token_in":"uatom","token_out":"ibc/token","amount_in":"100000","min_amount_out":"95000"}}' \
  --from your-key --chain-id cosmoshub-4 --gas-prices 0.025uatom --gas auto --yes
```

### Query Pool Info
```bash
gaiad query wasm contract-state smart cosmos1svd8fpfwrf237qprqt33ajylg302s05neruqt37p3ju2qktkt6wqytq4ez \
  '{"pool":{"token_a":"uatom","token_b":"ibc/token"}}' --node https://cosmos-rpc.polkachu.com/
```

## 🔄 Upgrade Path

### Contract Migration
The contract supports migration for future upgrades:
1. Deploy new contract version
2. Migrate state if needed
3. Update admin to new contract

### State Migration
```rust
// Future migration function
pub fn migrate(
    deps: DepsMut,
    _env: Env,
    _msg: MigrateMsg,
) -> Result<Response, ContractError>
```

## 📄 License

This contract is licensed under the MIT License - see [LICENSE](../LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📞 Support

- **GitHub Issues**: [Report bugs](https://github.com/your-username/cosmos-dex/issues)
- **Discussions**: [Ask questions](https://github.com/your-username/cosmos-dex/discussions)
- **Discord**: Join our community

---

**⚠️ Disclaimer**: This contract is provided as-is. Use at your own risk. Consider professional auditing before mainnet deployment.
