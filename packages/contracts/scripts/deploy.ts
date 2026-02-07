import { ethers } from "hardhat";

/**
 * Deployment Script for IssuerRegistry Contract
 * 
 * This script deploys the IssuerRegistry contract to the configured network.
 * The deployer wallet becomes the contract owner (Government/Admin).
 * 
 * Usage:
 *   - Local: npm run deploy:local
 *   - Amoy:  npm run deploy (requires PRIVATE_KEY in .env)
 * 
 * Post-Deployment:
 *   1. Save the contract address for frontend integration
 *   2. Verify the contract on Polygonscan (if deploying to Amoy)
 *   3. Add initial authorized issuers via the admin interface
 */
async function main() {
    console.log("🚀 Starting IssuerRegistry Deployment...\n");

    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying with account:", deployer.address);

    // Check deployer balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "POL/ETH\n");

    // Deploy the contract
    console.log("📦 Deploying IssuerRegistry contract...");
    const IssuerRegistry = await ethers.getContractFactory("IssuerRegistry");
    const registry = await IssuerRegistry.deploy();

    // Wait for deployment to complete
    await registry.waitForDeployment();

    const contractAddress = await registry.getAddress();
    console.log("✅ IssuerRegistry deployed to:", contractAddress);

    // Get network info
    const network = await ethers.provider.getNetwork();
    console.log("🌐 Network:", network.name, "(Chain ID:", network.chainId.toString(), ")\n");

    // Verify owner
    const owner = await registry.owner();
    console.log("👑 Contract Owner:", owner);

    // Output deployment summary
    console.log("\n" + "=".repeat(60));
    console.log("📋 DEPLOYMENT SUMMARY");
    console.log("=".repeat(60));
    console.log(`Contract Address: ${contractAddress}`);
    console.log(`Owner Address:    ${owner}`);
    console.log(`Network:          ${network.name}`);
    console.log(`Chain ID:         ${network.chainId}`);
    console.log("=".repeat(60));

    // Instructions for next steps
    console.log("\n📌 NEXT STEPS:");
    console.log("1. Update apps/web/.env.local with:");
    console.log(`   NEXT_PUBLIC_ISSUER_REGISTRY_ADDRESS=${contractAddress}`);
    console.log("\n2. To verify on Polygonscan (if on Amoy):");
    console.log(`   npx hardhat verify --network amoy ${contractAddress}`);
    console.log("\n3. Add authorized issuers using the admin dashboard or:");
    console.log("   Call addIssuer(address, name, type) on the contract");

    // Write address to file for automation
    const fs = require("fs");
    fs.writeFileSync("deployed_address.txt", contractAddress);
    console.log(`\n💾 Address saved to deployed_address.txt`);

    return contractAddress;
}

// Execute and handle errors
main()
    .then((address) => {
        console.log("\n✨ Deployment completed successfully!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Deployment failed:", error);
        process.exit(1);
    });
