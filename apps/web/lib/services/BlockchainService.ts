/**
 * BlockchainService
 * 
 * This service handles all interactions with the Polygon Amoy blockchain,
 * specifically the IssuerRegistry smart contract.
 * 
 * --- Smart Contract Integration ---
 * The IssuerRegistry acts as the "Government Trust Layer" for BharatVerify.
 * This service provides methods to:
 * 1. Check if an issuer is authorized (read-only, used by verifiers)
 * 2. Add new issuers (write, requires owner privileges)
 * 3. Fetch issuer metadata (read-only)
 * 
 * All write operations require a wallet with owner privileges.
 * Read operations can use a public RPC endpoint.
 */

import { ethers, Contract, JsonRpcProvider, Wallet } from "ethers";
import { IssuerInfo } from "@/lib/types/credentials";

// Polygon Amoy Testnet configuration
const POLYGON_AMOY_CONFIG = {
    chainId: 80002,
    name: "Polygon Amoy",
    rpcUrl: process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC || "https://rpc-amoy.polygon.technology",
    explorer: "https://amoy.polygonscan.com",
};

// IssuerRegistry ABI (minimal interface for our needs)
const ISSUER_REGISTRY_ABI = [
    // Read functions
    "function isIssuerAuthorized(address _issuer) public view returns (bool)",
    "function getIssuerCount() public view returns (uint256)",
    "function getIssuerInfo(address _issuer) public view returns (tuple(string name, string issuerType, uint256 registeredAt, bool isActive))",
    "function getAllIssuers() public view returns (address[])",
    "function getActiveIssuers() public view returns (address[])",
    "function owner() public view returns (address)",

    // Write functions
    "function addIssuer(address _issuer, string calldata _name, string calldata _issuerType) external",
    "function removeIssuer(address _issuer) external",
    "function setIssuerStatus(address _issuer, bool _isActive) external",

    // Events
    "event IssuerAdded(address indexed issuer, string name, string issuerType)",
    "event IssuerRemoved(address indexed issuer)",
    "event IssuerStatusUpdated(address indexed issuer, bool isActive)",
];

export class BlockchainService {
    private provider: JsonRpcProvider;
    private registryAddress: string;
    private contract: Contract;
    private signer?: Wallet;

    constructor() {
        // Initialize provider
        this.provider = new JsonRpcProvider(POLYGON_AMOY_CONFIG.rpcUrl);

        // Contract address from environment
        this.registryAddress = process.env.NEXT_PUBLIC_ISSUER_REGISTRY_ADDRESS || "";

        // Initialize contract (read-only by default)
        this.contract = new Contract(
            this.registryAddress,
            ISSUER_REGISTRY_ABI,
            this.provider
        );

        // Initialize signer if private key is available (for write operations)
        if (process.env.ADMIN_PRIVATE_KEY) {
            this.signer = new Wallet(process.env.ADMIN_PRIVATE_KEY, this.provider);
        }
    }

    /**
     * Check if the service is properly configured
     */
    isConfigured(): boolean {
        return !!this.registryAddress && this.registryAddress.length === 42;
    }

    /**
     * Get the contract address
     */
    getContractAddress(): string {
        return this.registryAddress;
    }

    // ============================================
    // READ OPERATIONS (Public)
    // ============================================

    /**
     * Check if an issuer address is authorized
     * 
     * This is the primary function used by verifiers to validate
     * that a credential comes from a trusted source.
     * 
     * --- ZK-Proof Flow ---
     * When a verifier receives a ZK-proof, they extract the issuer's
     * address (derived from the issuer's DID) and call this function.
     * If true, the credential is from a government-authorized institution.
     * 
     * @param issuerAddress - Ethereum address of the issuer
     * @returns boolean - True if authorized
     */
    async isIssuerAuthorized(issuerAddress: string): Promise<boolean> {
        if (!this.isConfigured()) {
            console.warn("BlockchainService: Contract not configured");
            return false;
        }

        try {
            const isAuthorized = await this.contract.isIssuerAuthorized(issuerAddress);
            return isAuthorized;
        } catch (error) {
            console.error("Error checking issuer authorization:", error);
            return false;
        }
    }

    /**
     * Get total number of registered issuers
     */
    async getIssuerCount(): Promise<number> {
        if (!this.isConfigured()) return 0;

        try {
            const count = await this.contract.getIssuerCount();
            return Number(count);
        } catch (error) {
            console.error("Error getting issuer count:", error);
            return 0;
        }
    }

    /**
     * Get detailed information about an issuer
     * 
     * @param issuerAddress - Ethereum address of the issuer
     * @returns IssuerInfo or null if not found
     */
    async getIssuerInfo(issuerAddress: string): Promise<IssuerInfo | null> {
        if (!this.isConfigured()) return null;

        try {
            const info = await this.contract.getIssuerInfo(issuerAddress);

            // Check if issuer exists (registeredAt will be 0 if not registered)
            if (info.registeredAt === BigInt(0)) {
                return null;
            }

            return {
                address: issuerAddress,
                name: info.name,
                issuerType: info.issuerType,
                registeredAt: Number(info.registeredAt),
                isActive: info.isActive,
            };
        } catch (error) {
            console.error("Error getting issuer info:", error);
            return null;
        }
    }

    /**
     * Get all registered issuer addresses
     */
    async getAllIssuers(): Promise<string[]> {
        if (!this.isConfigured()) return [];

        try {
            const issuers = await this.contract.getAllIssuers();
            return issuers;
        } catch (error) {
            console.error("Error getting all issuers:", error);
            return [];
        }
    }

    /**
     * Get only active issuer addresses
     */
    async getActiveIssuers(): Promise<string[]> {
        if (!this.isConfigured()) return [];

        try {
            const issuers = await this.contract.getActiveIssuers();
            return issuers;
        } catch (error) {
            console.error("Error getting active issuers:", error);
            return [];
        }
    }

    /**
     * Get the contract owner address
     */
    async getOwner(): Promise<string | null> {
        if (!this.isConfigured()) return null;

        try {
            const owner = await this.contract.owner();
            return owner;
        } catch (error) {
            console.error("Error getting owner:", error);
            return null;
        }
    }

    // ============================================
    // WRITE OPERATIONS (Admin Only)
    // ============================================

    /**
     * Add a new authorized issuer
     * 
     * This function can only be called by the contract owner (Government/Admin).
     * It adds a new institution (University, Training Institute) to the
     * trusted issuer registry.
     * 
     * @param issuerAddress - Ethereum address of the new issuer
     * @param name - Human-readable name (e.g., "Delhi University")
     * @param issuerType - Type classification (e.g., "University", "ITI")
     * @returns Transaction hash or null if failed
     */
    async addIssuer(
        issuerAddress: string,
        name: string,
        issuerType: string
    ): Promise<string | null> {
        if (!this.signer) {
            throw new Error("Admin private key not configured");
        }

        try {
            const contractWithSigner = this.contract.connect(this.signer) as Contract;
            const tx = await contractWithSigner.addIssuer(issuerAddress, name, issuerType);
            const receipt = await tx.wait();
            return receipt.hash;
        } catch (error) {
            console.error("Error adding issuer:", error);
            throw error;
        }
    }

    /**
     * Authorize an issuer (admin panel wrapper)
     * 
     * Higher-level method for the admin panel that returns structured response.
     * 
     * @param walletAddress - Ethereum address of the issuer
     * @param name - Organization name
     * @param issuerType - Type of issuer
     * @returns Object with success status and transaction hash
     */
    async authorizeIssuer(
        walletAddress: string,
        name: string,
        issuerType: string
    ): Promise<{ success: boolean; txHash?: string; error?: string }> {
        try {
            // Check if already authorized
            const isAlreadyAuthorized = await this.isIssuerAuthorized(walletAddress);
            if (isAlreadyAuthorized) {
                return { success: true, txHash: undefined };
            }

            const txHash = await this.addIssuer(walletAddress, name, issuerType);
            return { success: true, txHash: txHash || undefined };
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            console.error("Error authorizing issuer:", message);
            return { success: false, error: message };
        }
    }

    /**
     * Remove an issuer from the registry
     * 
     * @param issuerAddress - Address of the issuer to remove
     * @returns Transaction hash or null if failed
     */
    async removeIssuer(issuerAddress: string): Promise<string | null> {
        if (!this.signer) {
            throw new Error("Admin private key not configured");
        }

        try {
            const contractWithSigner = this.contract.connect(this.signer) as Contract;
            const tx = await contractWithSigner.removeIssuer(issuerAddress);
            const receipt = await tx.wait();
            return receipt.hash;
        } catch (error) {
            console.error("Error removing issuer:", error);
            throw error;
        }
    }

    /**
     * Update issuer active status
     * 
     * @param issuerAddress - Address of the issuer
     * @param isActive - New active status
     * @returns Transaction hash or null if failed
     */
    async setIssuerStatus(
        issuerAddress: string,
        isActive: boolean
    ): Promise<string | null> {
        if (!this.signer) {
            throw new Error("Admin private key not configured");
        }

        try {
            const contractWithSigner = this.contract.connect(this.signer) as Contract;
            const tx = await contractWithSigner.setIssuerStatus(issuerAddress, isActive);
            const receipt = await tx.wait();
            return receipt.hash;
        } catch (error) {
            console.error("Error updating issuer status:", error);
            throw error;
        }
    }

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================

    /**
     * Get network information
     */
    async getNetworkInfo() {
        try {
            const network = await this.provider.getNetwork();
            const blockNumber = await this.provider.getBlockNumber();

            return {
                chainId: Number(network.chainId),
                name: POLYGON_AMOY_CONFIG.name,
                blockNumber,
                isConnected: true,
            };
        } catch (error) {
            return {
                chainId: 0,
                name: "Unknown",
                blockNumber: 0,
                isConnected: false,
            };
        }
    }

    /**
     * Get explorer URL for a transaction or address
     */
    getExplorerUrl(hashOrAddress: string, type: "tx" | "address" = "tx"): string {
        return `${POLYGON_AMOY_CONFIG.explorer}/${type}/${hashOrAddress}`;
    }
}

// Singleton instance
let blockchainServiceInstance: BlockchainService | null = null;

export function getBlockchainService(): BlockchainService {
    if (!blockchainServiceInstance) {
        blockchainServiceInstance = new BlockchainService();
    }
    return blockchainServiceInstance;
}
