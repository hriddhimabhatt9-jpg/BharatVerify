<p align="center">
  <img src="https://img.shields.io/badge/Blockchain-Polygon-8247E5?style=for-the-badge&logo=polygon&logoColor=white" alt="Polygon" />
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Solidity-0.8-363636?style=for-the-badge&logo=solidity&logoColor=white" alt="Solidity" />
  <img src="https://img.shields.io/badge/Identity-Privado%20ID-00D4AA?style=for-the-badge" alt="Privado ID" />
</p>

<h1 align="center">🇮🇳 BharatVerify</h1>

<p align="center">
  <strong>Decentralized Identity Verification Platform for India's Workforce</strong>
</p>

<p align="center">
  Empowering workers with portable, tamper-proof digital credentials using Zero-Knowledge Proofs on Polygon blockchain
</p>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#️-architecture)
- [Technology Stack](#-technology-stack)
- [User Flows](#-user-flows)
- [Project Structure](#-project-structure)
- [Setup Guide](#-setup-guide)
- [API Reference](#-api-reference)
- [Smart Contracts](#-smart-contracts)
- [Privacy & Security](#-privacy--security)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**BharatVerify** is a production-grade decentralized identity (DID) platform built on the Polygon blockchain using Privado ID (formerly Polygon ID). It creates a trustless verification ecosystem for India's workforce:

| Role | Description |
|------|-------------|
| **🏛️ Issuers** | Universities, training institutes, and certification bodies issue tamper-proof Verifiable Credentials |
| **👨‍💼 Holders** | Workers store credentials in their Privado ID mobile wallet with full data ownership |
| **🏢 Verifiers** | Employers verify qualifications using Zero-Knowledge Proofs - no data exposure |

### Why BharatVerify?

- **🔐 Privacy-First**: ZK-proofs enable verification without revealing personal data
- **⛓️ Blockchain-Backed**: Immutable credential registry on Polygon
- **🏛️ Government-Ready**: Trust layer for regulatory compliance
- **📱 Mobile-First**: Works with Privado ID wallet app
- **🇮🇳 India-Focused**: Built for Aadhaar integration and Indian credential types

---

## ✨ Key Features

### For Issuers (Universities/Institutions)
- ✅ Issue Verifiable Credentials with QR codes
- ✅ Manage credential schemas (Education, Skill, Experience)
- ✅ Track issued credentials dashboard
- ✅ Revocation support

### For Holders (Workers)
- ✅ Claim credentials via QR code scan
- ✅ Store in Privado ID mobile wallet
- ✅ Full control over data sharing
- ✅ Selective disclosure with ZK-proofs

### For Verifiers (Employers)
- ✅ Generate verification requests
- ✅ Instant ZK-proof verification
- ✅ No access to underlying data
- ✅ Verification history tracking

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              BharatVerify Platform                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐              │
│  │   🏛️ ISSUER     │    │   👤 HOLDER     │    │   🏢 VERIFIER   │              │
│  │   Portal        │    │   (Worker)       │    │   Portal        │              │
│  │   (University)  │    │                  │    │   (Employer)    │              │
│  └────────┬────────┘    └────────┬────────┘    └────────┬────────┘              │
│           │                      │                      │                        │
│           │ 1. Issue VC          │ 2. Store in         │ 3. ZK-Proof            │
│           │ (QR Code)            │ Wallet              │ Request                │
│           ▼                      ▼                      ▼                        │
│  ┌──────────────────────────────────────────────────────────────────────┐       │
│  │                        Next.js 14 Web Application                      │       │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────────┐  │       │
│  │  │ Issuer API │  │ Holder API │  │Verifier API│  │ Registry API   │  │       │
│  │  └──────┬─────┘  └──────┬─────┘  └──────┬─────┘  └───────┬────────┘  │       │
│  └─────────┼───────────────┼───────────────┼─────────────────┼──────────┘       │
│            │               │               │                 │                   │
│            ▼               ▼               ▼                 ▼                   │
│  ┌──────────────────────────────────────────────────────────────────────┐       │
│  │                     Privado ID Issuer Node (Go)                        │       │
│  │  • Credential Issuance    • Schema Management    • Identity Trees     │       │
│  │  • Revocation Service     • Merkle Tree Proofs   • State Management   │       │
│  └───────────────────────────────────┬──────────────────────────────────┘       │
│                                      │                                           │
│            ┌─────────────────────────┴─────────────────────────┐                │
│            ▼                                                   ▼                 │
│  ┌───────────────────────┐                      ┌───────────────────────┐       │
│  │   📱 Privado ID App   │                      │   ⛓️ Polygon Amoy     │       │
│  │   (Mobile Wallet)     │                      │   (Testnet)           │       │
│  │                       │                      │                       │       │
│  │   • Store Credentials │                      │   • IssuerRegistry.sol│       │
│  │   • Generate ZK-Proofs│                      │   • State Contract    │       │
│  │   • Selective Sharing │                      │   • Identity States   │       │
│  └───────────────────────┘                      └───────────────────────┘       │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────┐       │
│  │                          Supporting Services                           │       │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐    │       │
│  │  │   Firebase   │  │    IPFS      │  │   RPC (Alchemy/Infura)   │    │       │
│  │  │   Firestore  │  │   (Pinata)   │  │                          │    │       │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘    │       │
│  └──────────────────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Web App** | Next.js 14, TypeScript | Issuer/Verifier portals, API routes |
| **Issuer Node** | Go, PostgreSQL | Privado ID credential issuance engine |
| **Mobile Wallet** | Privado ID App | Holder credential storage & ZK-proofs |
| **Smart Contract** | Solidity, Hardhat | Authorized issuer registry on-chain |
| **Database** | Firebase Firestore | Credential metadata, user sessions |
| **Schemas** | JSON-LD, IPFS | Credential type definitions |

---

## 🛠 Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.1.0 | React framework with App Router |
| TypeScript | 5.3.3 | Type-safe JavaScript |
| Tailwind CSS | 3.4.0 | Utility-first styling |
| Shadcn/UI | Latest | Radix-based component library |
| Framer Motion | 10.18 | Animations & transitions |
| Lucide React | 0.309 | Icon library |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js API Routes | 14.1.0 | RESTful API endpoints |
| Privado ID Issuer Node | Latest | Go-based credential issuance |
| Firebase Admin | 13.6.1 | Firestore database |
| jsonwebtoken | 9.0.3 | JWT authentication |
| bcryptjs | 3.0.3 | Password hashing |

### Blockchain
| Technology | Version | Purpose |
|------------|---------|---------|
| Polygon Amoy | Testnet | L2 blockchain network |
| Hardhat | Latest | Smart contract development |
| ethers.js | 6.9.2 | Blockchain interaction |
| Solidity | 0.8.x | Smart contract language |

### Identity Layer
| Technology | Purpose |
|------------|---------|
| Privado ID SDK | Verifiable Credential issuance |
| Privado ID App | Mobile wallet for holders |
| JSON-LD Schemas | Credential type definitions |
| IPFS (Pinata) | Schema storage |

---

## 🔄 User Flows

### Flow 1: Credential Issuance

```mermaid
sequenceDiagram
    participant U as University (Issuer)
    participant W as Web Portal
    participant I as Issuer Node
    participant P as Polygon
    participant S as Student (Holder)
    participant M as Mobile Wallet

    U->>W: Login to Issuer Portal
    U->>W: Fill credential form (name, degree, etc.)
    W->>I: POST /api/issuer/create-claim
    I->>I: Create credential with schema
    I->>P: Publish identity state
    I-->>W: Return claim ID + QR code
    W-->>U: Display QR code
    S->>M: Scan QR code with Privado ID app
    M->>I: Fetch credential offer
    I-->>M: Return signed credential
    M->>M: Store credential locally
```

### Flow 2: Zero-Knowledge Verification

```mermaid
sequenceDiagram
    participant E as Employer (Verifier)
    participant W as Web Portal
    participant S as Worker (Holder)
    participant M as Mobile Wallet
    participant P as Polygon

    E->>W: Login to Verifier Portal
    E->>W: Select verification criteria
    W->>W: Generate ZK-proof request
    W-->>E: Display verification QR
    S->>M: Scan QR with Privado ID app
    M->>M: Generate ZK-proof locally
    M->>W: POST /api/verifier/callback
    W->>P: Verify issuer authorization
    W->>W: Validate ZK-proof
    W-->>E: ✅ Verification successful
    Note over E,M: Employer never sees actual credential data!
```

### Flow 3: Issuer Registration (Admin)

```mermaid
sequenceDiagram
    participant G as Government Admin
    participant W as Web Portal
    participant C as IssuerRegistry Contract
    participant P as Polygon

    G->>W: Login to Admin Portal
    G->>W: Submit issuer details (address, name, type)
    W->>C: addIssuer(address, name, type)
    C->>P: Write transaction
    P-->>C: Confirm block inclusion
    C-->>W: Event: IssuerAdded
    W-->>G: ✅ Issuer registered on-chain
```

---

## 📁 Project Structure

```
BharatVerify/
├── 📱 apps/
│   └── web/                          # Next.js 14 Web Application
│       ├── app/                      # App Router
│       │   ├── api/                  # API Routes
│       │   │   ├── issuer/           # Credential issuance endpoints
│       │   │   │   ├── create-claim/ # Create new credential
│       │   │   │   └── claim-qr/     # Get QR code for claim
│       │   │   ├── verifier/         # Verification endpoints
│       │   │   │   ├── generate-request/  # Create ZK-proof request
│       │   │   │   ├── callback/     # Receive ZK-proof
│       │   │   │   └── status/       # Check verification status
│       │   │   └── registry/         # Smart contract queries
│       │   ├── issuer/               # Issuer Dashboard UI
│       │   ├── verifier/             # Verifier Dashboard UI
│       │   ├── holder/               # Holder Status Page
│       │   ├── admin/                # Admin Portal
│       │   └── login/                # Authentication
│       ├── components/               # React Components
│       │   ├── ui/                   # Shadcn UI components
│       │   ├── BentoGrid.tsx         # Apple-style grid layout
│       │   └── Navigation.tsx        # Site navigation
│       ├── lib/
│       │   ├── services/             # Core Business Logic
│       │   │   ├── CredentialService.ts   # Issue credentials
│       │   │   ├── ProofService.ts        # ZK-proof handling
│       │   │   └── BlockchainService.ts   # Chain interaction
│       │   ├── types/                # TypeScript definitions
│       │   └── utils.ts              # Helper functions
│       └── public/
│           └── schemas/              # JSON-LD Credential Schemas
│
├── 📦 packages/
│   └── contracts/                    # Hardhat Smart Contracts
│       ├── contracts/
│       │   └── IssuerRegistry.sol    # Government Trust Layer
│       ├── scripts/
│       │   └── deploy.ts             # Deployment script
│       ├── test/
│       │   └── IssuerRegistry.test.ts
│       └── hardhat.config.ts
│
├── 🔧 issuer-node/                   # Privado ID Issuer Node (Go)
│   ├── api/                          # API definitions
│   ├── cmd/                          # CLI commands
│   ├── internal/                     # Core logic
│   ├── infrastructure/               # Docker, configs
│   ├── ui/                           # Issuer Node UI
│   └── Makefile                      # Build commands
│
├── 📄 SETUP_GUIDE.md                 # Detailed setup instructions
├── 📄 WALLET_GUIDE.md                # Mobile wallet usage guide
└── 📄 package.json                   # Monorepo root
```

---

## 🚀 Setup Guide

### Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | ≥18.0.0 | LTS recommended |
| npm | ≥9.0.0 | Comes with Node |
| Docker | Latest | For issuer-node |
| MetaMask | Extension | With Polygon Amoy testnet |
| Privado ID App | Latest | [iOS](https://apps.apple.com/app/polygon-id/id1629870183) / [Android](https://play.google.com/store/apps/details?id=com.polygonid.wallet) |

### Step 1: Clone & Install

```bash
# Clone the repository
git clone https://github.com/hriddhimabhatt9-jpg/BharatVerify.git
cd BharatVerify

# Install all dependencies
npm install
```

### Step 2: Environment Configuration

#### Web Application

```bash
# Copy example env file
cp apps/web/.env.example apps/web/.env.local
```

Edit `apps/web/.env.local`:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Blockchain Configuration
NEXT_PUBLIC_POLYGON_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/YOUR_KEY
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...deployed-contract-address
PRIVATE_KEY=your-wallet-private-key

# Issuer Node Configuration
NEXT_PUBLIC_ISSUER_NODE_URL=http://localhost:3001
ISSUER_DID=did:polygonid:polygon:amoy:...
ISSUER_NODE_AUTH_USER=admin
ISSUER_NODE_AUTH_PASS=your-password

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key
```

#### Smart Contracts

```bash
# Copy example env file
cp packages/contracts/.env.example packages/contracts/.env
```

Edit `packages/contracts/.env`:

```env
PRIVATE_KEY=your-wallet-private-key
POLYGON_AMOY_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/YOUR_KEY
POLYGONSCAN_API_KEY=your-polygonscan-api-key
```

### Step 3: Deploy Smart Contract

```bash
# Compile contracts
npm run contract:compile

# Run tests
npm run contract:test

# Deploy to Polygon Amoy
npm run contract:deploy
```

> 💡 Copy the deployed contract address to your `.env.local`

### Step 4: Setup Issuer Node

```bash
cd issuer-node

# Copy environment file
cp .env-issuer.sample .env-issuer

# Start with Docker
make up
```

See [issuer-node/README.md](./issuer-node/README.md) for detailed instructions.

### Step 5: Run Development Server

```bash
# From project root
npm run dev
```

🎉 Open [http://localhost:3000](http://localhost:3000)

---

## 📡 API Reference

### Issuer Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/issuer/create-claim` | Create a new verifiable credential |
| `GET` | `/api/issuer/claim-qr/[id]` | Get QR code data for credential claim |
| `GET` | `/api/issuer/claims` | List all issued credentials |
| `POST` | `/api/issuer/revoke` | Revoke a credential |

#### Create Claim Request

```json
POST /api/issuer/create-claim
{
  "type": "EducationCredential",
  "subjectId": "did:polygonid:polygon:amoy:...",
  "data": {
    "degree": "B.Tech Computer Science",
    "institution": "IIT Delhi",
    "graduationYear": 2024,
    "cgpa": 8.5
  }
}
```

### Verifier Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/verifier/generate-request` | Create ZK-proof verification request |
| `POST` | `/api/verifier/callback` | Receive ZK-proof from mobile wallet |
| `GET` | `/api/verifier/status/[id]` | Check verification status |

#### Generate Verification Request

```json
POST /api/verifier/generate-request
{
  "credentialType": "EducationCredential",
  "query": {
    "field": "degree",
    "operator": "$eq",
    "value": "B.Tech Computer Science"
  }
}
```

### Registry Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/registry/status` | Get blockchain & contract status |
| `GET` | `/api/registry/issuers` | List all registered issuers |
| `GET` | `/api/registry/check/[address]` | Check if address is authorized issuer |

---

## 📜 Smart Contracts

### IssuerRegistry.sol

The **Government Trust Layer** - a registry of authorized credential issuers on Polygon.

```solidity
contract IssuerRegistry is Ownable {
    struct Issuer {
        string name;
        IssuerType issuerType;
        bool isActive;
        uint256 addedAt;
    }

    enum IssuerType { UNIVERSITY, TRAINING_INSTITUTE, CERTIFICATION_BODY }

    // Core functions
    function addIssuer(address, string, IssuerType) external onlyOwner;
    function removeIssuer(address) external onlyOwner;
    function isIssuerAuthorized(address) external view returns (bool);
    function getIssuerInfo(address) external view returns (Issuer);
}
```

**Deployed Contract:** `0x...` (Polygon Amoy Testnet)

[View on Polygonscan](https://amoy.polygonscan.com/address/YOUR_CONTRACT)

---

## 🔒 Privacy & Security

### Zero-Knowledge Proofs

BharatVerify uses ZK-proofs for privacy-preserving verification:

```
Example: Prove "Age > 18" without revealing actual birthdate

┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Credential    │     │    ZK Circuit    │     │  Verification   │
│   DOB: 1998-05  │ ──▶ │  age > 18?       │ ──▶ │  ✅ TRUE        │
│   (hidden)      │     │  (computed)      │     │  (no DOB shown) │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### Aadhaar Privacy

```typescript
// Aadhaar numbers are hashed, never stored raw
const maskedAadhaar = maskAadhaar("123456789012");
// Returns: SHA-256 hash, not the actual number
```

### Selective Disclosure Examples

| Query | What Verifier Learns |
|-------|---------------------|
| `cgpa >= 7.0` | Student meets minimum CGPA |
| `degree == "B.Tech"` | Student has B.Tech degree |
| `graduationYear <= 2024` | Student graduated by 2024 |

> 🔐 **Key Point:** Verifiers never see actual credential values, only proof results!

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md).

### Development Workflow

```bash
# Create feature branch
git checkout -b feature/amazing-feature

# Make changes and commit
git commit -m "feat: add amazing feature"

# Push and create PR
git push origin feature/amazing-feature
```

### Code Style

- TypeScript strict mode enabled
- ESLint + Prettier for formatting
- Conventional commits required

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Privado ID](https://privado.id/) (formerly Polygon ID) for the identity framework
- [Polygon](https://polygon.technology/) for the L2 blockchain
- [Iden3](https://iden3.io/) for ZK-proof circuits
- The open-source community

---

<p align="center">
  <strong>Built with ❤️ for India's Workforce</strong>
</p>

<p align="center">
  <a href="https://github.com/hriddhimabhatt9-jpg/BharatVerify/issues">Report Bug</a>
  ·
  <a href="https://github.com/hriddhimabhatt9-jpg/BharatVerify/issues">Request Feature</a>
</p>
