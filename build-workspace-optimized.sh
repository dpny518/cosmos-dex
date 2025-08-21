#!/bin/bash

set -e

echo "🔧 Building optimized contract using workspace optimizer..."

# Ensure we're in the right directory
cd "$(dirname "$0")"

# Create artifacts directory if it doesn't exist
mkdir -p artifacts

# Clean any previous builds
echo "Cleaning previous builds..."
rm -rf contracts/target
rm -rf artifacts/*

# Use CosmWasm workspace optimizer for production-ready build
echo "Running CosmWasm workspace optimizer (this may take a few minutes)..."
docker run --rm -v "$(pwd)":/code \
  --mount type=volume,source="$(basename "$(pwd)")_cache",target=/target \
  --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
  cosmwasm/optimizer:0.17.0

# Check if artifacts were created
echo "Checking for built artifacts..."
if [ -d "artifacts" ] && [ "$(ls -A artifacts)" ]; then
    echo "✅ Contract optimized successfully!"
    for file in artifacts/*.wasm; do
        if [ -f "$file" ]; then
            echo "📦 $(basename "$file"): $(du -h "$file" | cut -f1)"
        fi
    done
    echo "📍 Artifacts location: $(pwd)/artifacts/"
else
    echo "❌ Optimization failed - no artifacts found"
    exit 1
fi

# Verify the contracts
echo "🔍 Verifying contracts..."
if command -v cosmwasm-check &> /dev/null; then
    for file in artifacts/*.wasm; do
        if [ -f "$file" ]; then
            echo "Checking $(basename "$file")..."
            cosmwasm-check "$file"
        fi
    done
else
    echo "⚠️  cosmwasm-check not installed, skipping verification"
    echo "   Install with: cargo install cosmwasm-check"
fi

echo "🎉 Contracts ready for mainnet deployment!"
