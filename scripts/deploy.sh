#!/bin/bash

set -e

echo "🚀 Starting DEX deployment process..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install
fi

# Check if contract artifacts exist
if [ ! -f "/artifacts/dex_contract.wasm" ]; then
    echo "❌ Contract artifacts not found!"
    echo "Please run 'make build-contracts' first"
    exit 1
fi

# Check if deployer keys exist
if [ ! -f "/keys/current-deployer.json" ]; then
    echo "❌ Deployer keys not found!"
    echo "Generating new deployer keys..."
    node generate-keys.js
    
    echo ""
    echo "⚠️  IMPORTANT: Please fund the generated address with ATOM before proceeding"
    echo "Press Enter when ready to continue..."
    read
fi

# Run deployment
echo "🔗 Deploying to network: ${CHAIN_ID:-cosmoshub-4}"
node deploy.js

echo ""
echo "✅ Deployment completed successfully!"
echo "Check /keys/deployment-info.json for details"