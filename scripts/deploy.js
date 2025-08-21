const { CosmWasmClient, SigningCosmWasmClient } = require("@cosmjs/cosmwasm-stargate");
const { DirectSecp256k1HdWallet } = require("@cosmjs/proto-signing");
const { GasPrice } = require("@cosmjs/stargate");
const fs = require("fs-extra");
const path = require("path");

// Network configuration
const config = {
    chainId: process.env.CHAIN_ID || "cosmoshub-4",
    rpcEndpoint: process.env.RPC_URL || "https://cosmos-rpc.polkachu.com",
    restEndpoint: process.env.REST_URL || "https://cosmos-api.polkachu.com",
    gasPrice: GasPrice.fromString("0.025uatom"),
    prefix: "cosmos"
};

async function loadWallet() {
    try {
        const keyFile = "/keys/current-deployer.json";
        const keyData = await fs.readJson(keyFile);
        
        console.log(`Loading wallet from: ${keyFile}`);
        console.log(`Deployer address: ${keyData.address}`);
        
        const wallet = await DirectSecp256k1HdWallet.fromMnemonic(
            keyData.mnemonic,
            { prefix: config.prefix }
        );
        
        return wallet;
    } catch (error) {
        console.error("Failed to load wallet:", error.message);
        console.log("Please run 'make generate-keys' first to create a deployer wallet");
        process.exit(1);
    }
}

async function uploadContract(client, wallet, contractPath) {
    console.log(`\nUploading contract: ${contractPath}`);
    
    const wasmCode = await fs.readFile(contractPath);
    const accounts = await wallet.getAccounts();
    
    const uploadResult = await client.upload(
        accounts[0].address,
        wasmCode,
        "auto",
        "DEX Contract v1.0"
    );
    
    console.log(`✅ Contract uploaded successfully!`);
    console.log(`Code ID: ${uploadResult.codeId}`);
    console.log(`Transaction hash: ${uploadResult.transactionHash}`);
    console.log(`Gas used: ${uploadResult.gasUsed}`);
    
    return uploadResult.codeId;
}

async function instantiateContract(client, wallet, codeId) {
    console.log(`\nInstantiating contract with code ID: ${codeId}`);
    
    const accounts = await wallet.getAccounts();
    const deployerAddress = accounts[0].address;
    
    const instantiateMsg = {
        admin: deployerAddress,
        fee_rate: "30" // 0.3% fee
    };
    
    const result = await client.instantiate(
        deployerAddress,
        codeId,
        instantiateMsg,
        "Cosmos DEX",
        "auto",
        {
            admin: deployerAddress
        }
    );
    
    console.log(`✅ Contract instantiated successfully!`);
    console.log(`Contract address: ${result.contractAddress}`);
    console.log(`Transaction hash: ${result.transactionHash}`);
    console.log(`Gas used: ${result.gasUsed}`);
    
    return result.contractAddress;
}

async function saveDeploymentInfo(codeId, contractAddress, deployerAddress) {
    const deploymentInfo = {
        network: config.chainId,
        codeId: codeId,
        contractAddress: contractAddress,
        deployerAddress: deployerAddress,
        deployedAt: new Date().toISOString(),
        rpcEndpoint: config.rpcEndpoint,
        restEndpoint: config.restEndpoint,
        feeRate: "30", // 0.3%
        gasPrice: config.gasPrice.toString()
    };
    
    // Save deployment info
    await fs.writeJson("/keys/deployment-info.json", deploymentInfo, { spaces: 2 });
    
    console.log("\n📄 Deployment information saved to: /keys/deployment-info.json");
    console.log("🎉 DEX deployment completed successfully!");
    
    return deploymentInfo;
}

async function checkBalance(client, address) {
    console.log(`\nChecking balance for: ${address}`);
    
    try {
        const balance = await client.getBalance(address, "uatom");
        console.log(`Balance: ${balance.amount} uatom (${parseFloat(balance.amount) / 1000000} ATOM)`);
        
        if (parseFloat(balance.amount) < 1000000) { // Less than 1 ATOM
            console.log("⚠️  Warning: Low balance detected!");
            console.log("Please fund the deployer address with ATOM for gas fees");
            console.log(`Fund address: ${address}`);
        }
        
        return balance;
    } catch (error) {
        console.error("Failed to check balance:", error.message);
        return null;
    }
}

async function main() {
    try {
        console.log("🚀 Starting DEX contract deployment...");
        console.log(`Network: ${config.chainId}`);
        console.log(`RPC: ${config.rpcEndpoint}`);
        
        // Load wallet
        const wallet = await loadWallet();
        const accounts = await wallet.getAccounts();
        const deployerAddress = accounts[0].address;
        
        // Create client
        const client = await SigningCosmWasmClient.connectWithSigner(
            config.rpcEndpoint,
            wallet,
            {
                gasPrice: config.gasPrice
            }
        );
        
        // Check balance
        await checkBalance(client, deployerAddress);
        
        // Find contract file
        const contractPath = "/artifacts/dex_contract.wasm";
        if (!await fs.pathExists(contractPath)) {
            console.error(`Contract file not found: ${contractPath}`);
            console.log("Please run 'make build-contracts' first");
            process.exit(1);
        }
        
        // Upload contract
        const codeId = await uploadContract(client, wallet, contractPath);
        
        // Instantiate contract
        const contractAddress = await instantiateContract(client, wallet, codeId);
        
        // Save deployment info
        const deploymentInfo = await saveDeploymentInfo(codeId, contractAddress, deployerAddress);
        
        console.log("\n🎊 Deployment Summary:");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log(`Network:           ${deploymentInfo.network}`);
        console.log(`Code ID:           ${deploymentInfo.codeId}`);
        console.log(`Contract Address:  ${deploymentInfo.contractAddress}`);
        console.log(`Deployer:          ${deploymentInfo.deployerAddress}`);
        console.log(`Fee Rate:          ${deploymentInfo.feeRate} (0.3%)`);
        console.log(`Deployed At:       ${deploymentInfo.deployedAt}`);
        
        console.log("\n📝 Next Steps:");
        console.log("1. Update frontend configuration with contract address");
        console.log("2. Create initial trading pairs");
        console.log("3. Fund pools with initial liquidity");
        console.log("4. Test trading functionality");
        
    } catch (error) {
        console.error("\n❌ Deployment failed:", error.message);
        if (error.stack) {
            console.error("Stack trace:", error.stack);
        }
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { main, config };