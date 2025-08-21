#!/bin/bash

set -e

echo "🔨 Building CosmWasm contracts with simple Docker build..."

# Create artifacts directory
mkdir -p artifacts

# Build using custom Dockerfile
echo "Building container..."
docker build -f Dockerfile.build -t cosmos-dex-builder .

echo "Extracting artifacts..."
docker run --rm -v "$(pwd)/artifacts:/output" cosmos-dex-builder cp /artifacts/dex_contract.wasm /output/

echo "✅ Contract build completed!"
echo "📦 Artifacts created in ./artifacts/"

# List generated artifacts
if [ -d "artifacts" ]; then
    echo ""
    echo "Generated files:"
    ls -la artifacts/
    
    if [ -f "artifacts/dex_contract.wasm" ]; then
        echo ""
        echo "Contract size: $(du -h artifacts/dex_contract.wasm | cut -f1)"
    fi
fi