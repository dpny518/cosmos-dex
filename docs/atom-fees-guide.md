# 💰 ATOM Fees and Deposit Guide

This comprehensive guide explains how ATOM tokens are used for fees in the Cosmos DEX, where to deposit them, and how to optimize your usage.

## 🎯 Overview

ATOM is the native token of Cosmos Hub and is required for:
- **Gas Fees**: All transactions require ATOM for execution
- **Trading**: Some trading pairs may include ATOM
- **Liquidity**: ATOM can be paired with other tokens in pools

## ⛽ Gas Fee Structure

### Base Gas Costs

All blockchain transactions consume gas paid in ATOM (uatom):

| Operation | Estimated Gas | ATOM Cost* |
|-----------|---------------|------------|
| Deploy Contract | 1,500,000 gas | ~0.5-1.0 ATOM |
| Create Pool | 500,000 gas | ~0.01-0.02 ATOM |
| Add Liquidity | 300,000 gas | ~0.008-0.015 ATOM |
| Remove Liquidity | 300,000 gas | ~0.008-0.015 ATOM |
| Token Swap | 200,000 gas | ~0.005-0.01 ATOM |
| Query (Read) | 0 gas | Free |

*Gas costs vary with network congestion. Prices shown are for 0.025 uatom/gas

### Gas Price Levels

The network supports different gas price levels:

```javascript
gasPriceStep: {
  low: 0.01,      // Slower confirmation
  average: 0.025, // Standard speed  
  high: 0.04,     // Faster confirmation
}
```

### Gas Calculation

Gas cost = Gas Used × Gas Price

Example swap calculation:
- Gas used: 200,000
- Gas price: 0.025 uatom/gas  
- Total cost: 200,000 × 0.025 = 5,000 uatom = 0.005 ATOM

## 💱 DEX Trading Fees

### Trading Fee Structure

The DEX charges a **0.3%** fee on all token swaps:

- **Fee Rate**: 30 basis points (0.30%)
- **Applied To**: Input token amount
- **Distribution**: 100% to liquidity providers
- **Calculation**: `fee = input_amount × 0.003`

### Fee Examples

#### Example 1: ATOM Swap
- Swap: 10 ATOM → Other Token  
- Trading Fee: 10 × 0.003 = 0.03 ATOM
- Gas Fee: ~0.005 ATOM
- **Total Cost**: 0.035 ATOM

#### Example 2: Token Swap via ATOM
- Swap: 100 TokenA → ATOM → TokenB
- Trading Fee: 100 × 0.003 = 0.3 TokenA (first swap) + ATOM × 0.003 (second swap)  
- Gas Fee: ~0.01 ATOM (two transactions)
- **Total Gas**: 0.01 ATOM

## 💳 Where to Deposit ATOM

### For Contract Deployment

#### Step 1: Generate Deployer Keys
```bash
make generate-keys
# Output: cosmos1abc123... (your deployer address)
```

#### Step 2: Fund Deployer Address
Send ATOM to the generated address using any of these methods:

**🌐 Keplr Wallet**
1. Open Keplr extension
2. Select "Send" 
3. Enter deployer address
4. Send 10+ ATOM for deployment

**🏦 Centralized Exchange**
1. Withdraw ATOM from exchange
2. Use "Cosmos" or "ATOM" network
3. Send to deployer address
4. Confirm network is Cosmos Hub (cosmoshub-4)

**🔗 IBC Transfer**
```bash
# From Osmosis to Cosmos Hub
osmosisd tx ibc-transfer transfer transfer channel-0 \
  <deployer-address> 10000000uosmo \
  --from <your-osmosis-address> \
  --chain-id osmosis-1
```

#### Step 3: Verify Balance
```bash
gaiad query bank balances <deployer-address>
```

### For Trading and Liquidity

#### Connect Keplr Wallet
1. Install Keplr browser extension
2. Import or create wallet  
3. Ensure wallet has ATOM balance
4. Connect to DEX frontend

#### Wallet Requirements
- **Traders**: 1+ ATOM for regular trading
- **Liquidity Providers**: 2+ ATOM for pool operations
- **Heavy Users**: 5+ ATOM for frequent operations

## 💰 ATOM Balance Recommendations

### By User Type

| User Type | Recommended Balance | Purpose |
|-----------|-------------------|---------|
| **Deployer** | 10+ ATOM | Contract deployment + operations |
| **Day Trader** | 2-5 ATOM | Multiple swaps per day |
| **Casual User** | 0.5-1 ATOM | Occasional swaps |
| **LP Provider** | 2-10 ATOM | Pool creation and management |
| **Market Maker** | 5-20 ATOM | High frequency operations |

### Balance Monitoring

The frontend displays your ATOM balance:
- **Header**: Shows current balance
- **Transaction Forms**: Warns if insufficient balance
- **Gas Estimation**: Shows estimated costs before execution

## ⚙️ Gas Optimization

### Reduce Gas Costs

1. **Batch Operations**: Group multiple actions when possible
2. **Off-Peak Trading**: Trade during low network congestion  
3. **Appropriate Gas Price**: Use "low" setting for non-urgent transactions
4. **Avoid Failed Transactions**: Double-check all inputs before submitting

### Monitor Gas Prices

```bash
# Check current gas prices
gaiad query auth params

# View network congestion  
gaiad query tendermint-validator-set
```

### Gas Price Settings

In frontend configuration:
```javascript
gasPrice: {
  low: 0.01,     // Use for non-urgent transactions
  average: 0.025, // Default setting
  high: 0.04,    // Use during high congestion
}
```

## 🔍 Fee Tracking

### Transaction Receipts

Every transaction shows:
- **Gas Used**: Actual gas consumed
- **Gas Wanted**: Maximum gas limit set
- **Gas Price**: Rate paid per unit of gas
- **Total Fee**: Gas Used × Gas Price

### Frontend Display

The DEX frontend shows:
- **Estimated Gas**: Before transaction
- **Trading Fee**: DEX fee breakdown  
- **Total Cost**: Combined gas + trading fees
- **Balance Impact**: New balance after transaction

### Example Receipt
```json
{
  "gas_wanted": "300000",
  "gas_used": "287451", 
  "tx_fee": "7186uatom", // 0.007186 ATOM
  "trading_fee": "30000utoken" // 0.3% of input
}
```

## ⚠️ Common Fee Issues

### Insufficient Balance
**Error**: `insufficient funds for gas`  
**Solution**: Add more ATOM to wallet

### Out of Gas
**Error**: `out of gas in location`  
**Solution**: Increase gas limit or reduce transaction complexity

### Wrong Network
**Error**: `account not found`  
**Solution**: Verify wallet is on Cosmos Hub (cosmoshub-4)

### High Gas Price
**Warning**: Transaction costs > 0.1 ATOM  
**Action**: Check network congestion, consider waiting

## 📊 Fee Analytics

### Daily Fee Estimation

Based on usage patterns:

| Usage Pattern | Daily Fees | Weekly Fees | Monthly Fees |
|---------------|------------|-------------|--------------|
| **1 swap/day** | 0.01 ATOM | 0.07 ATOM | 0.3 ATOM |
| **5 swaps/day** | 0.05 ATOM | 0.35 ATOM | 1.5 ATOM |
| **LP Management** | 0.02 ATOM | 0.14 ATOM | 0.6 ATOM |
| **Active Trading** | 0.1 ATOM | 0.7 ATOM | 3.0 ATOM |

### Cost vs Volume

For large trades, fees become proportionally smaller:

| Trade Size | Gas Fee | Trading Fee (0.3%) | Total Fee % |
|------------|---------|-------------------|-------------|
| 1 ATOM | 0.005 ATOM | 0.003 ATOM | 0.8% |
| 10 ATOM | 0.005 ATOM | 0.03 ATOM | 0.35% |
| 100 ATOM | 0.005 ATOM | 0.3 ATOM | 0.305% |
| 1,000 ATOM | 0.005 ATOM | 3 ATOM | 0.3005% |

## 🎯 Best Practices

### Fee Management

1. **Maintain Buffer**: Keep 20% more ATOM than needed
2. **Monitor Prices**: Check gas prices before large operations  
3. **Plan Trades**: Group operations to minimize gas costs
4. **Emergency Reserve**: Keep extra ATOM for unexpected fees

### Wallet Security

1. **Hardware Wallets**: Use for large ATOM holdings
2. **Multiple Wallets**: Separate trading and holding wallets
3. **Backup Keys**: Secure mnemonic phrase storage
4. **Regular Updates**: Keep Keplr extension updated

### Cost Optimization

1. **Trade Size**: Larger trades have better fee efficiency
2. **Peak Hours**: Avoid trading during network congestion
3. **Slippage Settings**: Use appropriate slippage to avoid failed transactions
4. **Gas Settings**: Use "low" for non-urgent operations

This guide ensures you understand all aspects of ATOM usage for fees and can optimize your DEX experience efficiently.