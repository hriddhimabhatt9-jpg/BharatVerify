// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title IssuerRegistry
 * @author BharatVerify
 * @notice This contract serves as the "Government Trust Layer" for the BharatVerify ecosystem.
 *         It maintains a registry of authorized credential issuers (e.g., Universities, Training Institutes).
 *         Only issuers listed in this registry are considered valid and trustworthy.
 * 
 * @dev This is a simple access-controlled registry. The contract owner (Government/Admin) 
 *      has the sole authority to add or remove issuers.
 * 
 *      --- ZK-Proof Context ---
 *      When a Verifier (Employer) receives a credential proof from a user, they can call
 *      `isIssuerAuthorized()` to check if the credential's issuer DID corresponds to
 *      an address that is whitelisted in this on-chain registry. This creates a
 *      decentralized, censorship-resistant trust anchor.
 */
contract IssuerRegistry is Ownable {
    // ============================================
    // STATE VARIABLES
    // ============================================

    /**
     * @notice Mapping to store whether an address is an authorized issuer.
     * @dev address => bool (true if authorized, false otherwise)
     */
    mapping(address => bool) public authorizedIssuers;

    /**
     * @notice Array to keep track of all issuer addresses for enumeration.
     * @dev Useful for off-chain services to fetch the complete list of issuers.
     */
    address[] public issuerList;

    /**
     * @notice Mapping to store issuer metadata (e.g., name, type).
     * @dev address => IssuerInfo struct
     */
    mapping(address => IssuerInfo) public issuerInfo;

    // ============================================
    // STRUCTS
    // ============================================

    /**
     * @notice Struct to hold metadata about an issuer
     * @param name Human-readable name of the issuer (e.g., "Delhi University")
     * @param issuerType Type of issuer (e.g., "University", "Training Institute", "Government")
     * @param registeredAt Timestamp when the issuer was registered
     * @param isActive Whether the issuer is currently active
     */
    struct IssuerInfo {
        string name;
        string issuerType;
        uint256 registeredAt;
        bool isActive;
    }

    // ============================================
    // EVENTS
    // ============================================

    /**
     * @notice Emitted when a new issuer is added to the registry
     * @param issuer The address of the newly authorized issuer
     * @param name The name of the issuer
     * @param issuerType The type of the issuer
     */
    event IssuerAdded(address indexed issuer, string name, string issuerType);

    /**
     * @notice Emitted when an issuer is removed from the registry
     * @param issuer The address of the removed issuer
     */
    event IssuerRemoved(address indexed issuer);

    /**
     * @notice Emitted when an issuer's status is updated
     * @param issuer The address of the issuer
     * @param isActive The new active status
     */
    event IssuerStatusUpdated(address indexed issuer, bool isActive);

    // ============================================
    // CONSTRUCTOR
    // ============================================

    /**
     * @notice Initializes the contract and sets the deployer as the owner
     * @dev The owner represents the Government/Admin authority
     */
    constructor() Ownable(msg.sender) {
        // Owner is automatically set to the deployer via Ownable
    }

    // ============================================
    // EXTERNAL FUNCTIONS (Admin Only)
    // ============================================

    /**
     * @notice Adds a new authorized issuer to the registry
     * @dev Only the contract owner (Government/Admin) can call this function.
     *      This is the primary way to whitelist Universities and Training Institutes.
     * 
     * @param _issuer The address of the issuer to authorize
     * @param _name Human-readable name of the issuer
     * @param _issuerType Type classification (e.g., "University", "ITI", "Government")
     * 
     * Requirements:
     * - Caller must be the owner
     * - Issuer address must not be zero address
     * - Issuer must not already be registered
     */
    function addIssuer(
        address _issuer,
        string calldata _name,
        string calldata _issuerType
    ) external onlyOwner {
        require(_issuer != address(0), "IssuerRegistry: Invalid issuer address");
        require(!authorizedIssuers[_issuer], "IssuerRegistry: Issuer already registered");
        require(bytes(_name).length > 0, "IssuerRegistry: Name cannot be empty");

        // Add to the authorized mapping
        authorizedIssuers[_issuer] = true;
        
        // Add to the enumerable list
        issuerList.push(_issuer);

        // Store issuer metadata
        issuerInfo[_issuer] = IssuerInfo({
            name: _name,
            issuerType: _issuerType,
            registeredAt: block.timestamp,
            isActive: true
        });

        emit IssuerAdded(_issuer, _name, _issuerType);
    }

    /**
     * @notice Removes an issuer from the registry
     * @dev Soft-delete: Sets authorized to false but keeps the record.
     *      For full removal, we would need more complex array management.
     * 
     * @param _issuer The address of the issuer to remove
     * 
     * Requirements:
     * - Caller must be the owner
     * - Issuer must be currently authorized
     */
    function removeIssuer(address _issuer) external onlyOwner {
        require(authorizedIssuers[_issuer], "IssuerRegistry: Issuer not found");

        authorizedIssuers[_issuer] = false;
        issuerInfo[_issuer].isActive = false;

        emit IssuerRemoved(_issuer);
    }

    /**
     * @notice Updates the active status of an issuer
     * @dev Allows temporarily disabling/enabling an issuer without full removal
     * 
     * @param _issuer The address of the issuer
     * @param _isActive The new active status
     */
    function setIssuerStatus(address _issuer, bool _isActive) external onlyOwner {
        require(issuerInfo[_issuer].registeredAt > 0, "IssuerRegistry: Issuer not found");

        authorizedIssuers[_issuer] = _isActive;
        issuerInfo[_issuer].isActive = _isActive;

        emit IssuerStatusUpdated(_issuer, _isActive);
    }

    // ============================================
    // VIEW FUNCTIONS (Public)
    // ============================================

    /**
     * @notice Checks if an address is an authorized issuer
     * @dev This is the primary function Verifiers will call to validate credentials.
     *      
     *      --- ZK-Proof Integration ---
     *      When a user presents a ZK-proof of their credential, the Verifier extracts
     *      the issuer's address (derived from the issuer's DID) and calls this function.
     *      If it returns true, the credential is from a trusted source.
     * 
     * @param _issuer The address to check
     * @return bool True if the issuer is authorized, false otherwise
     */
    function isIssuerAuthorized(address _issuer) public view returns (bool) {
        return authorizedIssuers[_issuer];
    }

    /**
     * @notice Gets the total number of registered issuers
     * @return uint256 The count of all issuers (including inactive)
     */
    function getIssuerCount() public view returns (uint256) {
        return issuerList.length;
    }

    /**
     * @notice Gets the full information about an issuer
     * @param _issuer The address of the issuer
     * @return IssuerInfo The issuer's metadata
     */
    function getIssuerInfo(address _issuer) public view returns (IssuerInfo memory) {
        return issuerInfo[_issuer];
    }

    /**
     * @notice Gets all issuer addresses
     * @dev Use with caution for large registries due to gas costs
     * @return address[] Array of all issuer addresses
     */
    function getAllIssuers() public view returns (address[] memory) {
        return issuerList;
    }

    /**
     * @notice Gets only the active issuers
     * @dev Iterates through all issuers and filters by active status
     * @return address[] Array of active issuer addresses
     */
    function getActiveIssuers() public view returns (address[] memory) {
        uint256 activeCount = 0;
        
        // First pass: count active issuers
        for (uint256 i = 0; i < issuerList.length; i++) {
            if (authorizedIssuers[issuerList[i]]) {
                activeCount++;
            }
        }

        // Second pass: populate array
        address[] memory activeIssuers = new address[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < issuerList.length; i++) {
            if (authorizedIssuers[issuerList[i]]) {
                activeIssuers[index] = issuerList[i];
                index++;
            }
        }

        return activeIssuers;
    }
}
