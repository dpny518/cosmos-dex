#!/bin/bash

set -e

# Configuration
CHAIN_ID="cosmoshub-4"
NODE="https://cosmos-rpc.polkachu.com/"
CONTRACT_PATH="./artifacts/dex_contract.wasm"
GAS_PRICES="0.025uatom"
KEYRING_BACKEND="test"

# Check if contract exists
if [ ! -f "$CONTRACT_PATH" ]; then
    echo "❌ Contract not found at $CONTRACT_PATH"
    echo "Run ./build-workspace-optimized.sh first"
    exit 1
fi

echo "🚀 Deploying DEX contract to Cosmos Hub mainnet..."
echo "📍 Chain ID: $CHAIN_ID"
echo "🌐 Node: $NODE"
echo "📦 Contract: $CONTRACT_PATH ($(du -h $CONTRACT_PATH | cut -f1))"

# Check if gaiad is installed
if ! command -v gaiad &> /dev/null; then
    echo "❌ gaiad not found. Please install Gaia:"
    echo "   https://github.com/cosmos/gaia"
    exit 1
fi

# Check if wallet is configured
if ! gaiad keys list --keyring-backend $KEYRING_BACKEND | grep -q .; then
    echo "❌ No keys found. Please add a key first:"
    echo "   gaiad keys add <your-key-name> --keyring-backend $KEYRING_BACKEND"
    exit 1
fi

# Get the first key name
KEY_NAME=$(gaiad keys list --keyring-backend $KEYRING_BACKEND --output json | jq -r '.[0].name')
echo "🔑 Using key: $KEY_NAME"

# Get address and check balance
ADDRESS=$(gaiad keys show $KEY_NAME -a --keyring-backend $KEYRING_BACKEND)
echo "📍 Address: $ADDRESS"

BALANCE=$(gaiad query bank balances $ADDRESS --node $NODE --output json | jq -r '.balances[] | select(.denom=="uatom") | .amount')
if [ -z "$BALANCE" ] || [ "$BALANCE" = "null" ]; then
    BALANCE="0"
fi

echo "💰 Balance: $BALANCE uatom"

if [ "$BALANCE" -lt 1000000 ]; then
    echo "⚠️  Low balance. You need at least 1 ATOM (1000000 uatom) for deployment"
    echo "💡 Please fund your address: $ADDRESS"
    echo "💡 You can get ATOM from exchanges like Coinbase, Binance, or use a faucet for testnet"
    echo ""
    echo "🔗 Mainnet faucets are rare, but you can:"
    echo "   1. Buy ATOM from an exchange"
    echo "   2. Transfer from another wallet"
    echo "   3. Use testnet for testing first"
    echo ""
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled. Please fund your wallet first."
        exit 1
    fi
fi

# Store the contract
echo "📤 Storing contract on-chain..."
STORE_TX=$(gaiad tx wasm store $CONTRACT_PATH \
    --from $KEY_NAME \
    --keyring-backend $KEYRING_BACKEND \
    --chain-id $CHAIN_ID \
    --node $NODE \
    --gas-prices $GAS_PRICES \
    --gas auto \
    --gas-adjustment 1.3 \
    --broadcast-mode sync \
    --yes \
    --output json)

echo "Store transaction: $STORE_TX"

# Extract transaction hash
TX_HASH=$(echo $STORE_TX | jq -r '.txhash')
echo "📋 Transaction hash: $TX_HASH"

echo "⏳ Waiting for transaction to be included in a block..."
sleep 10

# Query the transaction to get code ID
TX_RESULT=$(gaiad query tx $TX_HASH --node $NODE --output json)
CODE_ID=$(echo $TX_RESULT | jq -r '.events[] | select(.type=="store_code") | .attributes[] | select(.key=="code_id") | .value')

if [ "$CODE_ID" = "null" ] || [ -z "$CODE_ID" ]; then
    echo "❌ Failed to get code ID from transaction"
    echo "Transaction result: $TX_RESULT"
    exit 1
fi

echo "✅ Contract stored successfully!"
echo "🆔 Code ID: $CODE_ID"
echo ""
echo "🎯 Next steps:"
echo "1. Instantiate the contract:"
echo "   gaiad tx wasm instantiate $CODE_ID '{\"admin\":\"$ADDRESS\",\"fee_rate\":\"0.003\"}' \\"
echo "     --from $KEY_NAME --keyring-backend $KEYRING_BACKEND --label \"DEX Contract\" \\"
echo "     --chain-id $CHAIN_ID --node $NODE \\"
echo "     --gas-prices $GAS_PRICES --gas auto --gas-adjustment 1.3 \\"
echo "     --broadcast-mode sync --yes"
echo ""
echo "2. Query the contract address after instantiation:"
echo "   gaiad query wasm list-contract-by-code $CODE_ID --node $NODE"
