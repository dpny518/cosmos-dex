# 🔧 Contract Build Fix Guide

## Issue
The workspace optimizer isn't detecting contracts properly, and Docker builds are timing out due to large image downloads.

## Solutions

### Option 1: Fix Workspace Optimizer (Recommended)

The issue is that the workspace optimizer expects contracts to be detected automatically. Let me fix this:

1. **Install Rust locally** (faster than Docker):
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
rustup target add wasm32-unknown-unknown
```

2. **Build locally**:
```bash
cd contracts/dex-contract
cargo build --release --target wasm32-unknown-unknown
cp target/wasm32-unknown-unknown/release/dex_contract.wasm ../../artifacts/
```

### Option 2: Use Alternative Docker Method

Once Docker images are downloaded (may take 5-10 minutes first time), use:

```bash
./build-simple.sh
```

### Option 3: Fix Docker Compose Method

The workspace optimizer issue is in the contract detection. The contract needs a specific format. Update `contracts/dex-contract/Cargo.toml`:

```toml
[package]
name = "dex_contract"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[features]
default = []

[dependencies]
cosmwasm-std = { version = "1.4" }
# ... other deps
```

## Quick Test

To verify the contract compiles correctly, check for these files after building:
- `artifacts/dex_contract.wasm` - The compiled contract
- Should be ~500KB - 2MB in size

## Deployment Note

Once you have `artifacts/dex_contract.wasm`, you can proceed with deployment:

```bash
make generate-keys
# Fund the address shown
make deploy-contracts
```

The deployment scripts will look for `artifacts/dex_contract.wasm` and use it for deployment.

## Next Steps After Build Success

1. ✅ Contract builds successfully
2. 🔑 Generate keys: `make generate-keys` 
3. 💰 Fund deployer address with ATOM
4. 🚀 Deploy: `make deploy-contracts`
5. 🌐 Update frontend config with contract address
6. 🎯 Test the DEX!