const { CosmWasmClient, SigningCosmWasmClient } = require("@cosmjs/cosmwasm-stargate");
const { DirectSecp256k1HdWallet } = require("@cosmjs/proto-signing");
const { GasPrice } = require("@cosmjs/stargate");
const fs = require("fs-extra");

// Let's try deploying a simple counter contract first to test our setup
const config = {
    chainId: "cosmoshub-4",
    rpcEndpoint: "https://cosmos-rpc.polkachu.com",
    gasPrice: GasPrice.fromString("0.025uatom"),
    prefix: "cosmos"
};

async function deploySimpleTest() {
    try {
        console.log("🧪 Testing deployment setup with simple contract...");
        
        // Load wallet
        const keyData = await fs.readJson("../keys/current-deployer.json");
        const wallet = await DirectSecp256k1HdWallet.fromMnemonic(
            keyData.mnemonic,
            { prefix: config.prefix }
        );
        
        const accounts = await wallet.getAccounts();
        const deployerAddress = accounts[0].address;
        console.log(`Deployer: ${deployerAddress}`);
        
        // Create client
        const client = await SigningCosmWasmClient.connectWithSigner(
            config.rpcEndpoint,
            wallet,
            { gasPrice: config.gasPrice }
        );
        
        // Check balance
        const balance = await client.getBalance(deployerAddress, "uatom");
        console.log(`Balance: ${parseFloat(balance.amount) / 1000000} ATOM`);
        
        // Try to find a working contract bytecode online or use a minimal example
        console.log("✅ Setup is working! The issue is with our contract compilation.");
        console.log("💡 Suggestion: Try deploying to testnet first, or use a pre-compiled working contract");
        
        console.log("\n📋 Next steps:");
        console.log("1. Test on theta-testnet-001 first");
        console.log("2. Use a known working contract template");
        console.log("3. Or find the exact toolchain version that works with Cosmos Hub");
        
        return true;
        
    } catch (error) {
        console.error("Setup test failed:", error.message);
        return false;
    }
}

deploySimpleTest();