#!/bin/bash

set -e

echo "🔨 Building CosmWasm contracts..."

# Create artifacts directory
mkdir -p artifacts

echo "Building with Rust Docker container..."

# Build the contract using a standard Rust container
docker run --rm \
  -v "$(pwd)/contracts:/workspace" \
  -v "$(pwd)/artifacts:/artifacts" \
  -w /workspace/dex-contract \
  --platform linux/amd64 \
  rust:1.70 bash -c "
    # Install wasm target
    rustup target add wasm32-unknown-unknown
    
    # Build the contract
    cargo build --release --target wasm32-unknown-unknown --lib
    
    # Copy the wasm file to artifacts
    cp target/wasm32-unknown-unknown/release/dex_contract.wasm /artifacts/
    
    # Show file info
    ls -la target/wasm32-unknown-unknown/release/*.wasm
    echo 'Contract built successfully!'
  "

echo "✅ Contract build completed!"
echo "📦 Artifacts created in ./artifacts/"

# List generated artifacts
if [ -d "artifacts" ]; then
    echo ""
    echo "Generated files:"
    ls -la artifacts/
fi