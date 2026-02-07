import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Hardhat Configuration for BharatVerify Contracts
 * 
 * Networks:
 * - hardhat: Local development network
 * - amoy: Polygon Amoy Testnet (Chain ID: 80002)
 * 
 * To deploy to Amoy, you need:
 * 1. PRIVATE_KEY in .env file (your deployer wallet private key)
 * 2. POLYGON_AMOY_RPC_URL in .env file (or use the default public RPC)
 * 3. Test POL tokens from https://faucet.polygon.technology/
 */
const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.24",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    networks: {
        // Local Hardhat network for testing
        hardhat: {
            chainId: 31337,
        },
        // Polygon Amoy Testnet
        amoy: {
            url: process.env.POLYGON_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology",
            chainId: 80002,
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            gasPrice: 30000000000, // 30 gwei
        },
    },
    // Etherscan verification (for Polygonscan on Amoy)
    etherscan: {
        apiKey: {
            polygonAmoy: process.env.POLYGONSCAN_API_KEY || "",
        },
        customChains: [
            {
                network: "polygonAmoy",
                chainId: 80002,
                urls: {
                    apiURL: "https://api-amoy.polygonscan.com/api",
                    browserURL: "https://amoy.polygonscan.com",
                },
            },
        ],
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts",
    },
    typechain: {
        outDir: "typechain-types",
        target: "ethers-v6",
    },
};

export default config;
