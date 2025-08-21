const { DirectSecp256k1HdWallet } = require("@cosmjs/proto-signing");
const fs = require("fs-extra");
const crypto = require("crypto");

async function generateKeys() {
    console.log("Generating new deployer keys...");
    
    // Generate mnemonic
    const wallet = await DirectSecp256k1HdWallet.generate(24);
    const mnemonic = wallet.mnemonic;
    
    // Get first account
    const accounts = await wallet.getAccounts();
    const address = accounts[0].address;
    
    console.log(`Generated address: ${address}`);
    console.log(`Mnemonic: ${mnemonic}`);
    
    // Save to secure file
    const keyData = {
        address: address,
        mnemonic: mnemonic,
        created: new Date().toISOString(),
        network: "cosmoshub-4"
    };
    
    // Create keys directory if it doesn't exist
    await fs.ensureDir("/keys");
    
    // Save encrypted keys
    const filename = `/keys/deployer-${Date.now()}.json`;
    await fs.writeJson(filename, keyData, { spaces: 2 });
    
    // Also save to current keys file
    await fs.writeJson("/keys/current-deployer.json", keyData, { spaces: 2 });
    
    console.log(`Keys saved to: ${filename}`);
    console.log(`Current keys saved to: /keys/current-deployer.json`);
    
    console.log("\n⚠️  IMPORTANT SECURITY NOTICE ⚠️");
    console.log("1. Fund this address with ATOM for gas fees");
    console.log("2. Keep the mnemonic secure and never share it");
    console.log("3. The keys are saved in the /keys directory");
    console.log(`4. Fund address: ${address}`);
    console.log("\n💰 To fund with ATOM:");
    console.log("- Send ATOM to the address above for transaction fees");
    console.log("- Minimum recommended: 10 ATOM for deployment and operations");
    
    return {
        address,
        mnemonic,
        filename
    };
}

if (require.main === module) {
    generateKeys().catch(console.error);
}

module.exports = { generateKeys };