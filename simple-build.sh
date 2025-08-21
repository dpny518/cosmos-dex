#!/bin/bash

set -e

echo "🔧 Building with maximum compatibility for Cosmos Hub..."

cd contracts/dex-contract

# Use specific older Rust version for compatibility
docker run --rm -v "$(pwd):/code" -w /code \
  --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
  rust:1.60.0 bash -c "
    rustup target add wasm32-unknown-unknown
    
    # Build with maximum compatibility flags
    RUSTFLAGS='-C link-arg=-s -C target-feature=-bulk-memory' \
    cargo build --release --target wasm32-unknown-unknown --no-default-features
    
    # Copy to artifacts
    mkdir -p /code/../../artifacts
    cp target/wasm32-unknown-unknown/release/dex_contract.wasm /code/../../artifacts/dex_contract_legacy.wasm
    
    echo 'Contract size:'
    ls -lh /code/../../artifacts/dex_contract_legacy.wasm
  "

echo "✅ Legacy compatible contract built!"