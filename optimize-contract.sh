#!/bin/bash

set -e

echo "🔧 Optimizing contract for CosmWasm compatibility..."

# Go to contract directory
cd contracts/dex-contract

# Clean previous builds
cargo clean

# Build with CosmWasm-compatible settings
RUSTFLAGS='-C link-arg=-s' cargo build --release --target wasm32-unknown-unknown

# Use wasm-opt for further optimization (install if not present)
if command -v wasm-opt &> /dev/null; then
    echo "Optimizing with wasm-opt..."
    wasm-opt -Oz ../../contracts/target/wasm32-unknown-unknown/release/dex_contract.wasm -o ../../artifacts/dex_contract_optimized.wasm
else
    echo "wasm-opt not found, copying unoptimized version..."
    cp ../../contracts/target/wasm32-unknown-unknown/release/dex_contract.wasm ../../artifacts/dex_contract_optimized.wasm
fi

echo "✅ Contract optimized successfully!"
ls -la ../../artifacts/dex_contract_optimized.wasm