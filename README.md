# Agri-Block (AgriCon) 🌾

## Project Overview

Agri-Block is a decentralized agricultural forward-contracts platform that lets farmers sell crop yields before harvest, verified by real Copernicus Sentinel-2 satellite data and settled transparently on Stellar.

It replaces paperwork-heavy crop trading with blockchain-verified Crop NFTs, NDVI satellite health scoring, and automated USDC escrow -- giving both farmers and buyers trustless transparency from seed to settlement.

### Target Users

**Farmers** in agricultural regions who pre-sell harvests need working capital before the season ends. Traditional forward contracts rely on manual inspections, paper records, and delayed payments. Agri-Block lets farmers register their land, draw parcel boundaries on a map, run a free satellite vegetation check, and mint a Crop NFT -- receiving 20% upfront USDC with 70% held securely in escrow until delivery.

**Buyers** -- commodity traders, food processors, importers -- need confidence that a listed crop actually exists and is healthy before committing funds. Instead of trusting a seller's word, buyers compare NDVI scores across listings, read AI-generated crop health analysis, and purchase with USDC knowing their funds are protected by a Soroban smart escrow contract.

**Validators** (insurance providers, third-party inspectors) verify delivery outcomes -- Delivered, Disaster, or Fraud -- triggering automated escrow settlement and ensuring neither side can unilaterally walk away.

### The Problem

Agricultural forward contracting is plagued by information asymmetry and trust gaps:

- Buyers cannot verify a crop's existence or health before paying
- Farmers wait weeks or months for payment after delivery
- Manual NDVI reports are expensive, slow, and can be falsified
- Paper contracts offer no automated recourse when deliveries fail
- No transparent audit trail exists for either side
- Smallholder farmers are excluded from formal commodity markets

The result: farmers get squeezed on price, buyers take on hidden risk, and billions in crop value trade on trust alone.

### The Solution

Agri-Block combines three technologies to solve this:

- **Copernicus Sentinel-2 openEO** -- Free 10m-resolution satellite NDVI data processed in real time. Every parcel gets an immutable vegetation health score.
- **Stellar Soroban smart contracts** -- Three contracts handle NFT minting, escrow custody, and verification attestations. All on-chain, all auditable.
- **AI crop analysis (NVIDIA Llama 3.3)** -- Plain-language summaries of what the satellite data means plus harvest recommendations.

Instead of trusting paper reports, both sides trust math. Instead of chasing payments, escrow releases automatically on verified delivery. Instead of being locked out, smallholder farmers get the same tools as large agribusinesses.

---

## Key Features

- **Satellite-Verified Crop NFTs** -- Every listing is gated by real NDVI data from Copernicus Sentinel-2
- **On-Chain Escrow (70/20/10 split)** -- 70% held until delivery, 20% upfront to farmer, 10% to farmer aid pool
- **Forward Contract Marketplace** -- Browse, filter, and compare verified crop listings with NDVI health rings
- **Interactive Parcel Map** -- Draw polygons, bookmark parcels, run satellite checks directly on Google Maps
- **Farmer ID Verification** -- Government ID upload to Google Cloud Storage with on-chain profile attestation
- **Proof-Based Aid Claims** -- Farmers submit disaster/damage evidence for treasury compensation
- **AI Crop Health Summaries** -- Automatic plain-language analysis after each satellite check
- **Real-Time On-Chain Stats** -- Live counters for parcels listed, market volume, buyable listings, verified farmers
- **Zero-Knowledge Friendly** -- BLAKE2b-256 attestation hashes anchor verification data without exposing raw coordinates
- **Wallet-Agnostic** -- Connect via Freighter, Albedo, Lobstr, or WalletConnect through Stellar Wallets Kit

---

# Live Site

https://agri-con.vercel.app

---

## System Evolution & Demo

### 1. Smart Contract Deployment

Three Soroban smart contracts are deployed on Stellar Testnet. Each is immutable, publicly verifiable, and handles a distinct part of the protocol.

| Contract | ID | Purpose |
|---|---|---|
| Crop NFT | `CCA2E4OOZOR2NLAL2XEWE3KDHTTPDEBWOUX3BMR5QLOITWHOKWKULULR` | Mint, list, and track crop-backed NFTs |
| Escrow | `CDMKYC3VBHZJZMTEN6FQPFKG6LRYXIYOIP5KHEOPGSWCCYRSYXJSZFOQ` | Hold USDC, enforce 70/20/10 split, release on verification |
| Verification | `CA3NIAKLHQN3SKNBUGSWLOZRWY4BNNSKWCPI2BJIHZGYZM4J3QLW4GSA` | Record satellite attestations, manage validators, gate buyability |

![Smart Contract Deployment](docs/deployed.png)

---

### 2. Local Protocol Testing

Core contract functions -- `mint_crop_nft_with_listing`, `buy_crop_nft`, `record_satellite_attestation`, `verify_delivery`, `release_escrow`, `refund_after_disaster` -- were tested locally for correct state transitions, access control, and edge cases before deployment.

![Local Protocol Testing](docs/test.png)

---

### 3. On-Chain Verification (Explorer)

Every crop listing, purchase, satellite attestation, and escrow release is recorded on Stellar. This gives buyers, farmers, and auditors a fully transparent ledger.

**Crop NFT Contract Explorer:**

```txt
https://stellar.expert/explorer/testnet/contract/CCA2E4OOZOR2NLAL2XEWE3KDHTTPDEBWOUX3BMR5QLOITWHOKWKULULR
```

**Escrow Contract Explorer:**

```txt
https://stellar.expert/explorer/testnet/contract/CDMKYC3VBHZJZMTEN6FQPFKG6LRYXIYOIP5KHEOPGSWCCYRSYXJSZFOQ
```

![On-Chain Verification](docs/explorer.png)

---

### 4. Marketplace & NDVI Verification

The marketplace shows live on-chain listings with NDVI health rings, AI crop summaries, and full parcel metadata. Each listing is linked to a satellite-verified attestation, so buyers know the vegetation data is real.

Buyers select a crop, review the AI-powered satellite analysis, and purchase with USDC. Funds are automatically split by the escrow contract: 20% to the farmer, 70% held in escrow, 10% to the aid pool.

![Marketplace](docs/marketplace.png)

---

### 5. Explore & Satellite Verification

Farmers draw parcel polygons on an interactive map. The platform queries Copernicus Sentinel-2 via openEO, processes a GeoTIFF NDVI raster, and returns a mean vegetation score plus automatic AI analysis.

The result: every parcel gets a buyability gate -- if NDVI meets the policy threshold, the crop is available for forward contracts. Everything is timestamped, hashed, and attestable on-chain.

![Satellite Verification](docs/explore.png)

---

### 6. Admin Dashboard

The dashboard provides farmers and buyers with a unified view of their assets:

- **For farmers**: minted NFTs, listing status, escrow positions, verified profile
- **For buyers**: purchased crops, delivery status, escrow state
- **Cross-cutting**: market stats, on-chain activity, recent attestations

Every data point is backed by on-chain state, eliminating the gap between what the UI shows and what the blockchain records.

![Dashboard](docs/dashboard.png)

### 7. Order Tracking & Escrow Settlement

Once a crop is purchased, both farmer and buyer track its lifecycle through the order system. Delivery verification (Delivered/Disaster/Fraud) by a registered validator triggers escrow release or refund.

The escrow contract enforces the 70/20/10 split programmatically -- no manual intervention, no disputes, just code.

![Orders](docs/orders.png)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Rust (Soroban SDK 25.0.1), Stellar Testnet |
| Frontend | Next.js 16, React 19, Tailwind CSS v4, GSAP |
| Blockchain SDK | @stellar/stellar-sdk 13.3, @creit.tech/stellar-wallets-kit 2.2 |
| Backend | Express 4, Prisma 6 (PostgreSQL 16) |
| Satellite Data | Copernicus Sentinel-2 via openEO, sharp (GeoTIFF processing) |
| AI | NVIDIA Llama 3.3 70B (ndvi-summary), Google Gemini (fallback) |
| Storage | Google Cloud Storage (farmer ID documents) |
| Deployment | Vercel (frontend), Render (backend) |

---

## Project Structure

```txt
agri-con/
├── contracts/                    # Soroban smart contracts (Rust workspace)
│   ├── crop_nft/                 # agri-block-crop-nft — Crop NFT minting & listing
│   ├── escrow/                   # agri-block-escrow — USDC escrow (70/20/10 split)
│   ├── verification/             # agri-block-verification — Satellite attestations & validators
│   └── Cargo.toml                # Workspace manifest
├── app/                          # Next.js 16 App Router
│   ├── marketplace/              # Browse & purchase verified crop listings
│   ├── explore/                  # Interactive parcel map + satellite verification
│   ├── dashboard/                # Farmer & buyer asset overview
│   ├── order/                    # Order tracking & escrow settlement
│   ├── aid/                      # Farmer aid/disaster claims
│   ├── profile/                  # Farmer ID verification & profile
│   ├── mylistings/               # Farmer's own crop NFT listings
│   └── api/                      # Route handlers (stellar, openeo, ai, verification, farmer-id)
├── components/                   # React components
│   ├── SatelliteVerificationPanel.tsx  # NDVI check + AI summary UI
│   ├── CheckOutComponent.tsx     # Marketplace purchase flow
│   ├── HeroComponent.tsx         # Animated GSAP hero
│   ├── NFTLifecycleFlow.tsx      # 6-step crop lifecycle visualization
│   ├── ParcelMap.tsx             # Google Maps parcel selection
│   └── stellar/                  # Wallet context, connect button
├── lib/                          # Shared utilities
│   └── stellar/                  # Tx builders, live data queries, network config
├── backend/                      # Express REST API
│   ├── server.js                 # Profiles, listings, orders, attestations, AI
│   ├── prisma/                   # PostgreSQL schema (Farmer, Listing, Order, Attestation)
│   └── Dockerfile                # Container deployment
├── render.yaml                   # Render backend deployment config
├── vercel.json                   # Vercel frontend deployment config
└── package.json                  # Next.js 16.2.6, React 19.2.4
```

---

## Smart Contracts

### Crop NFT — `CCA2E4OOZOR2NLAL2XEWE3KDHTTPDEBWOUX3BMR5QLOITWHOKWKULULR`

Mints crop-backed NFTs with full metadata: crop type, quantity, price, farmer profile, parcel bounding box, NDVI threshold, and observation window. Handles farmer profile registration, verification gating, escrow-controlled transfers, and status lifecycle (Available -> Reserved -> Growing -> Verified -> Completed -> Failed).

### Escrow — `CDMKYC3VBHZJZMTEN6FQPFKG6LRYXIYOIP5KHEOPGSWCCYRSYXJSZFOQ`

Holds USDC and enforces the 70/20/10 payment split. The `buy_crop_nft` entrypoint reserves escrow and transfers funds atomically. `release_escrow` and `refund_after_disaster` can only be called once the Verification contract has recorded a delivery decision.

### Verification — `CA3NIAKLHQN3SKNBUGSWLOZRWY4BNNSKWCPI2BJIHZGYZM4J3QLW4GSA`

Records satellite NDVI attestations (ndvi_bps, buyable, bbox hash, report hash, source) through an oracle address. Manages validator set, delivery verification (Delivered/Disaster/Fraud), proof submissions for aid claims, and cross-contract calls to unlock escrow.

**Oracle Address:** `GAQTXZLBZ2MTU2GWFEDHXBMJ7BMUZFXTW37ZNZF2IQYWQFPWPHTJWNA3`  
**USDC Token:** `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`  
**Treasury:** `GAJPZCOVW34KTYF764X74ZRYOJIF3H2XKCRWH4CARVRZD5M4WJ2XVWLW`

---

## Installation & Setup

```bash
# Clone the repo
git clone https://github.com/rylsherdamz-rgb/agri-con.git
cd agri-con

# Install dependencies
npm install

# Set up environment variables
cp .env .env.local
# Edit .env.local with your keys (see .env for template)

# Run the frontend
npm run dev
# Open http://localhost:3000
```

### Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
node start.js
# Runs on port 8080
```

### Smart Contracts

```bash
cd contracts
rustup target add wasm32-unknown-unknown
soroban contract build

soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/agri_block_crop_nft.wasm \
  --source deployer \
  --network testnet
```

---

## Why Stellar

Stellar's sub-second finality, sub-cent fees, and native USDC support make it ideal for agricultural payments where margins matter. Soroban smart contracts provide deterministic escrow logic without the gas unpredictability of other chains. The SEP-41 SAC bridge means USDC flows natively between contracts and wallets.

---

## Future Improvements

- Multi-chain satellite data sources (Landsat, PlanetScope) for higher resolution
- Mobile-first offline parcel drawing with sync
- Automated NDVI monitoring with threshold alerts
- Harvest prediction models from multi-year NDVI time series
- DAO-governed validator selection for escrow settlement
- Mainnet deployment with real USDC from regulated issuers

---

## License

MIT License