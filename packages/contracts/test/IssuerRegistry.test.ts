import { expect } from "chai";
import { ethers } from "hardhat";
import { IssuerRegistry } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * Test Suite for IssuerRegistry Contract
 * 
 * These tests verify:
 * 1. Deployment and ownership
 * 2. Adding/removing issuers
 * 3. Access control (only owner can modify)
 * 4. Issuer enumeration and status checks
 */
describe("IssuerRegistry", function () {
    let registry: IssuerRegistry;
    let owner: SignerWithAddress;
    let issuer1: SignerWithAddress;
    let issuer2: SignerWithAddress;
    let randomUser: SignerWithAddress;

    // Sample issuer data
    const ISSUER_NAME = "Delhi University";
    const ISSUER_TYPE = "University";

    beforeEach(async function () {
        // Get signers
        [owner, issuer1, issuer2, randomUser] = await ethers.getSigners();

        // Deploy fresh contract for each test
        const IssuerRegistryFactory = await ethers.getContractFactory("IssuerRegistry");
        registry = await IssuerRegistryFactory.deploy();
        await registry.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the correct owner", async function () {
            expect(await registry.owner()).to.equal(owner.address);
        });

        it("Should start with no issuers", async function () {
            expect(await registry.getIssuerCount()).to.equal(0);
        });
    });

    describe("Adding Issuers", function () {
        it("Should allow owner to add an issuer", async function () {
            await registry.addIssuer(issuer1.address, ISSUER_NAME, ISSUER_TYPE);

            expect(await registry.isIssuerAuthorized(issuer1.address)).to.be.true;
            expect(await registry.getIssuerCount()).to.equal(1);
        });

        it("Should emit IssuerAdded event", async function () {
            await expect(registry.addIssuer(issuer1.address, ISSUER_NAME, ISSUER_TYPE))
                .to.emit(registry, "IssuerAdded")
                .withArgs(issuer1.address, ISSUER_NAME, ISSUER_TYPE);
        });

        it("Should store correct issuer info", async function () {
            await registry.addIssuer(issuer1.address, ISSUER_NAME, ISSUER_TYPE);

            const info = await registry.getIssuerInfo(issuer1.address);
            expect(info.name).to.equal(ISSUER_NAME);
            expect(info.issuerType).to.equal(ISSUER_TYPE);
            expect(info.isActive).to.be.true;
            expect(info.registeredAt).to.be.greaterThan(0);
        });

        it("Should reject zero address", async function () {
            await expect(
                registry.addIssuer(ethers.ZeroAddress, ISSUER_NAME, ISSUER_TYPE)
            ).to.be.revertedWith("IssuerRegistry: Invalid issuer address");
        });

        it("Should reject duplicate issuer", async function () {
            await registry.addIssuer(issuer1.address, ISSUER_NAME, ISSUER_TYPE);

            await expect(
                registry.addIssuer(issuer1.address, "Another Name", "Another Type")
            ).to.be.revertedWith("IssuerRegistry: Issuer already registered");
        });

        it("Should reject empty name", async function () {
            await expect(
                registry.addIssuer(issuer1.address, "", ISSUER_TYPE)
            ).to.be.revertedWith("IssuerRegistry: Name cannot be empty");
        });

        it("Should reject non-owner adding issuer", async function () {
            await expect(
                registry.connect(randomUser).addIssuer(issuer1.address, ISSUER_NAME, ISSUER_TYPE)
            ).to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
        });
    });

    describe("Removing Issuers", function () {
        beforeEach(async function () {
            await registry.addIssuer(issuer1.address, ISSUER_NAME, ISSUER_TYPE);
        });

        it("Should allow owner to remove an issuer", async function () {
            await registry.removeIssuer(issuer1.address);

            expect(await registry.isIssuerAuthorized(issuer1.address)).to.be.false;
        });

        it("Should emit IssuerRemoved event", async function () {
            await expect(registry.removeIssuer(issuer1.address))
                .to.emit(registry, "IssuerRemoved")
                .withArgs(issuer1.address);
        });

        it("Should reject removing non-existent issuer", async function () {
            await expect(
                registry.removeIssuer(issuer2.address)
            ).to.be.revertedWith("IssuerRegistry: Issuer not found");
        });

        it("Should reject non-owner removing issuer", async function () {
            await expect(
                registry.connect(randomUser).removeIssuer(issuer1.address)
            ).to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
        });
    });

    describe("Issuer Status", function () {
        beforeEach(async function () {
            await registry.addIssuer(issuer1.address, ISSUER_NAME, ISSUER_TYPE);
        });

        it("Should allow owner to disable an issuer", async function () {
            await registry.setIssuerStatus(issuer1.address, false);

            expect(await registry.isIssuerAuthorized(issuer1.address)).to.be.false;
            const info = await registry.getIssuerInfo(issuer1.address);
            expect(info.isActive).to.be.false;
        });

        it("Should allow owner to re-enable an issuer", async function () {
            await registry.setIssuerStatus(issuer1.address, false);
            await registry.setIssuerStatus(issuer1.address, true);

            expect(await registry.isIssuerAuthorized(issuer1.address)).to.be.true;
        });

        it("Should emit IssuerStatusUpdated event", async function () {
            await expect(registry.setIssuerStatus(issuer1.address, false))
                .to.emit(registry, "IssuerStatusUpdated")
                .withArgs(issuer1.address, false);
        });
    });

    describe("Enumeration", function () {
        beforeEach(async function () {
            await registry.addIssuer(issuer1.address, "University A", "University");
            await registry.addIssuer(issuer2.address, "Institute B", "ITI");
        });

        it("Should return all issuers", async function () {
            const allIssuers = await registry.getAllIssuers();
            expect(allIssuers.length).to.equal(2);
            expect(allIssuers).to.include(issuer1.address);
            expect(allIssuers).to.include(issuer2.address);
        });

        it("Should return only active issuers", async function () {
            await registry.removeIssuer(issuer1.address);

            const activeIssuers = await registry.getActiveIssuers();
            expect(activeIssuers.length).to.equal(1);
            expect(activeIssuers[0]).to.equal(issuer2.address);
        });
    });

    describe("ZK-Proof Integration Scenario", function () {
        /**
         * This test simulates the real-world flow:
         * 1. Government adds a University as authorized issuer
         * 2. Verifier checks if an issuer is authorized
         * 3. Issuer gets temporarily suspended
         * 4. Issuer gets reinstated
         */
        it("Should support the full issuer lifecycle", async function () {
            // Step 1: Government authorizes Delhi University
            await registry.addIssuer(
                issuer1.address,
                "Delhi University",
                "University"
            );
            expect(await registry.isIssuerAuthorized(issuer1.address)).to.be.true;

            // Step 2: Employer verifies credential is from authorized issuer
            // (In real flow, this address would be derived from the issuer's DID)
            const isValid = await registry.isIssuerAuthorized(issuer1.address);
            expect(isValid).to.be.true;

            // Step 3: Government temporarily suspends the issuer
            await registry.setIssuerStatus(issuer1.address, false);
            expect(await registry.isIssuerAuthorized(issuer1.address)).to.be.false;

            // Step 4: Government reinstates the issuer after review
            await registry.setIssuerStatus(issuer1.address, true);
            expect(await registry.isIssuerAuthorized(issuer1.address)).to.be.true;
        });
    });
});
