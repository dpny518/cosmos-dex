#!/bin/bash

set -e

echo "🔨 Building CosmWasm contracts..."

# Create artifacts directory
mkdir -p artifacts

# Build using Docker with workspace optimizer
echo "Running workspace optimizer..."
docker run --rm -v "$(pwd)":/code \
  --mount type=volume,source="$(basename "$(pwd)")_cache",target=/code/target \
  --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
  cosmwasm/workspace-optimizer:0.14.0

echo "✅ Contract build completed!"
echo "📦 Artifacts created in ./artifacts/"

# List generated artifacts
if [ -d "artifacts" ]; then
    echo ""
    echo "Generated files:"
    ls -la artifacts/
fi