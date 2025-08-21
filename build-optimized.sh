#!/bin/bash

set -e

echo "🔧 Building optimized contract for Cosmos Hub mainnet deployment..."

# Ensure we're in the right directory
cd "$(dirname "$0")"

# Create artifacts directory if it doesn't exist
mkdir -p artifacts

# Clean any previous builds
echo "Cleaning previous builds..."
rm -rf contracts/target
rm -rf artifacts/*

# Use CosmWasm optimizer for production-ready build
echo "Running CosmWasm optimizer (this may take a few minutes)..."
docker run --rm -v "$(pwd)/contracts":/code \
  --mount type=volume,source="$(basename "$(pwd)")_cache",target=/code/target \
  --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
  cosmwasm/optimizer:0.17.0

# Move optimized contracts to artifacts directory
echo "Moving optimized contracts..."
if [ -f contracts/artifacts/dex_contract.wasm ]; then
    cp contracts/artifacts/dex_contract.wasm artifacts/
    echo "✅ Contract optimized successfully!"
    echo "📦 Contract size: $(du -h artifacts/dex_contract.wasm | cut -f1)"
    echo "📍 Location: $(pwd)/artifacts/dex_contract.wasm"
else
    echo "❌ Optimization failed - contract not found"
    exit 1
fi

# Verify the contract
echo "🔍 Verifying contract..."
if command -v cosmwasm-check &> /dev/null; then
    cosmwasm-check artifacts/dex_contract.wasm
else
    echo "⚠️  cosmwasm-check not installed, skipping verification"
    echo "   Install with: cargo install cosmwasm-check"
fi

echo "🎉 Contract ready for mainnet deployment!"
