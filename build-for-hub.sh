#!/bin/bash

set -e

echo "🔧 Building contract specifically for Cosmos Hub v25.1.0..."

# Create a minimal, maximally compatible build
cd contracts/dex-contract

# Use the most conservative Rust settings possible
source ~/.cargo/env

# Clean everything
cargo clean
rm -rf target/

echo "Building with maximum compatibility..."

# Use the most conservative flags possible
RUSTFLAGS='-C link-arg=-s -C panic=abort -C target-feature=-bulk-memory -C target-feature=-sign-ext -C lto=thin' \
cargo +1.60.0 build --release --target wasm32-unknown-unknown --locked 2>/dev/null || \
RUSTFLAGS='-C link-arg=-s -C panic=abort -C target-feature=-bulk-memory -C target-feature=-sign-ext' \
cargo build --release --target wasm32-unknown-unknown --locked

# Copy to artifacts with hub-specific name
cp target/wasm32-unknown-unknown/release/dex_contract.wasm ../../artifacts/dex_contract_hub.wasm

echo "✅ Hub-compatible contract built!"
echo "Size: $(du -h ../../artifacts/dex_contract_hub.wasm | cut -f1)"