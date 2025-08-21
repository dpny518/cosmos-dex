#!/bin/bash

# Deploy Updated DEX Contract with IBC Token Support
# This script uploads and instantiates the updated contract

set -e

# Configuration
CHAIN_ID="cosmoshub-4"
NODE="https://cosmos-rpc.polkachu.com"
DEPLOYER_KEY="deployer"
CONTRACT_PATH="./contracts/dex-contract/artifacts/dex_contract.wasm"
GAS_PRICES="0.025uatom"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Deploying Updated DEX Contract with IBC Token Support${NC}"
echo "=================================================="

# Check if contract file exists
if [ ! -f "$CONTRACT_PATH" ]; then
    echo -e "${RED}❌ Contract file not found: $CONTRACT_PATH${NC}"
    echo "Please build the contract first with: cargo build --release --target wasm32-unknown-unknown"
    exit 1
fi

# Get contract size
CONTRACT_SIZE=$(ls -lh "$CONTRACT_PATH" | awk '{print $5}')
echo -e "${BLUE}📦 Contract size: $CONTRACT_SIZE${NC}"

# Import deployer key if not exists
echo -e "${YELLOW}🔑 Setting up deployer key...${NC}"
if ! gaiad keys show $DEPLOYER_KEY --keyring-backend test >/dev/null 2>&1; then
    echo "Importing deployer key..."
    echo "price south weasel profit fatigue phrase mention major nation penalty valley area van bomb property draft veteran barely buddy cat organ alcohol carry used" | gaiad keys add $DEPLOYER_KEY --recover --keyring-backend test
fi

DEPLOYER_ADDRESS=$(gaiad keys show $DEPLOYER_KEY -a --keyring-backend test)
echo -e "${GREEN}✅ Deployer address: $DEPLOYER_ADDRESS${NC}"

# Check balance
echo -e "${YELLOW}💰 Checking deployer balance...${NC}"
BALANCE=$(gaiad query bank balances $DEPLOYER_ADDRESS --node $NODE --output json | jq -r '.balances[] | select(.denom=="uatom") | .amount')
if [ -z "$BALANCE" ] || [ "$BALANCE" = "null" ]; then
    BALANCE="0"
fi
BALANCE_ATOM=$(echo "scale=6; $BALANCE / 1000000" | bc -l)
echo -e "${GREEN}💰 Balance: $BALANCE_ATOM ATOM${NC}"

if [ "$BALANCE" -lt "1000000" ]; then
    echo -e "${RED}❌ Insufficient balance. Need at least 1 ATOM for deployment.${NC}"
    exit 1
fi

# Upload contract
echo -e "${YELLOW}📤 Uploading contract...${NC}"
UPLOAD_RESULT=$(gaiad tx wasm store "$CONTRACT_PATH" \
    --from $DEPLOYER_KEY \
    --keyring-backend test \
    --chain-id $CHAIN_ID \
    --node $NODE \
    --gas-prices $GAS_PRICES \
    --gas auto \
    --gas-adjustment 1.3 \
    --broadcast-mode sync \
    --yes \
    --output json)

echo "Upload transaction result:"
echo "$UPLOAD_RESULT" | jq .

# Extract transaction hash
TX_HASH=$(echo "$UPLOAD_RESULT" | jq -r '.txhash')
echo -e "${BLUE}📋 Transaction hash: $TX_HASH${NC}"

# Wait for transaction to be included
echo -e "${YELLOW}⏳ Waiting for transaction to be included in block...${NC}"
sleep 6

# Get code ID from transaction result
TX_RESULT=$(gaiad query tx $TX_HASH --node $NODE --output json)
CODE_ID=$(echo "$TX_RESULT" | jq -r '.events[] | select(.type=="store_code") | .attributes[] | select(.key=="code_id") | .value')

if [ -z "$CODE_ID" ] || [ "$CODE_ID" = "null" ]; then
    echo -e "${RED}❌ Failed to get code ID from transaction${NC}"
    echo "Transaction result:"
    echo "$TX_RESULT" | jq .
    exit 1
fi

echo -e "${GREEN}✅ Contract uploaded successfully!${NC}"
echo -e "${GREEN}📋 Code ID: $CODE_ID${NC}"

# Instantiate contract
echo -e "${YELLOW}🏗️ Instantiating contract...${NC}"

INSTANTIATE_MSG='{
  "admin": null,
  "fee_rate": "30"
}'

INSTANTIATE_RESULT=$(gaiad tx wasm instantiate $CODE_ID "$INSTANTIATE_MSG" \
    --from $DEPLOYER_KEY \
    --keyring-backend test \
    --chain-id $CHAIN_ID \
    --node $NODE \
    --gas-prices $GAS_PRICES \
    --gas auto \
    --gas-adjustment 1.3 \
    --label "DEX Contract v2 - IBC Support" \
    --broadcast-mode sync \
    --yes \
    --output json)

echo "Instantiate transaction result:"
echo "$INSTANTIATE_RESULT" | jq .

# Extract transaction hash
INSTANTIATE_TX_HASH=$(echo "$INSTANTIATE_RESULT" | jq -r '.txhash')
echo -e "${BLUE}📋 Instantiate TX hash: $INSTANTIATE_TX_HASH${NC}"

# Wait for transaction
echo -e "${YELLOW}⏳ Waiting for instantiate transaction...${NC}"
sleep 6

# Get contract address
INSTANTIATE_TX_RESULT=$(gaiad query tx $INSTANTIATE_TX_HASH --node $NODE --output json)
CONTRACT_ADDRESS=$(echo "$INSTANTIATE_TX_RESULT" | jq -r '.events[] | select(.type=="instantiate") | .attributes[] | select(.key=="_contract_address") | .value')

if [ -z "$CONTRACT_ADDRESS" ] || [ "$CONTRACT_ADDRESS" = "null" ]; then
    echo -e "${RED}❌ Failed to get contract address${NC}"
    echo "Instantiate transaction result:"
    echo "$INSTANTIATE_TX_RESULT" | jq .
    exit 1
fi

echo -e "${GREEN}🎉 Contract deployed successfully!${NC}"
echo "=================================================="
echo -e "${GREEN}📋 Code ID: $CODE_ID${NC}"
echo -e "${GREEN}📍 Contract Address: $CONTRACT_ADDRESS${NC}"
echo -e "${GREEN}👤 Deployer: $DEPLOYER_ADDRESS${NC}"
echo -e "${GREEN}🌐 Network: $CHAIN_ID${NC}"
echo ""
echo -e "${BLUE}🔗 Explorer Links:${NC}"
echo -e "Mintscan: https://www.mintscan.io/cosmos/wasm/contract/$CONTRACT_ADDRESS"
echo -e "Celatone: https://celatone.osmosis.zone/cosmoshub-4/contracts/$CONTRACT_ADDRESS"
echo ""
echo -e "${YELLOW}📝 Update your .env file:${NC}"
echo "VITE_CONTRACT_ADDRESS=$CONTRACT_ADDRESS"
echo ""
echo -e "${GREEN}✅ Deployment complete! The contract now supports IBC tokens.${NC}"
