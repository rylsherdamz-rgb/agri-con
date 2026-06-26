# Agri-Block

Agricultural forward contracts on Stellar with crop NFTs, escrow settlement, satellite-gated buyability, and disaster aid.

## Features

- **Crop NFTs** — Farmers mint NFTs representing crop parcels with metadata (crop type, quantity, price, region)
- **Satellite Verification** — Oracle runs NDVI analysis via Copernicus Sentinel-2 to verify crop health before a listing becomes buyable
- **USDC Escrow** — Buyers pay USDC; 20% upfront to farmer, 70% held in escrow until delivery, 10% to disaster treasury
- **Disaster Aid** — Farmers file claims for crop loss; on-chain proof of damage
- **Oracle Dashboard** — Dedicated `/verify` page for the oracle to run NDVI checks and record attestations on-chain
- **AI Assistant** — NVIDIA NIM-powered chat for agricultural guidance

## Smart Contract

Deployed on Stellar Testnet.

| Contract | ID |
|---|---|
| agri_con | `CAEQDFMVO2FNEPVZBA2VNKSURUJ6HTUEFJWOAQVGGIN2DUIHSRB74ZC2` |

**Source:** [contracts/agri_con/src/](contracts/agri_con/src/)

**Explorer:** https://stellar.expert/explorer/testnet/contract/CAEQDFMVO2FNEPVZBA2VNKSURUJ6HTUEFJWOAQVGGIN2DUIHSRB74ZC2

### Contract Methods

| Method | Description |
|---|---|
| `mint_crop_nft_with_listing` | Mint a new crop NFT with listing metadata |
| `buy_crop_nft` | Purchase a listed crop NFT (USDC escrow) |
| `record_satellite_attestation` | Record NDVI attestation, sets buyability |
| `add_oracle` | Register an oracle address |
| `is_oracle` | Check if address is a registered oracle |
| `submit_proof` | File a disaster proof for a crop |
| `verify_delivery` | Validator confirms delivery |
| `get_crop` | Read crop metadata |
| `get_listing_metadata` | Read listing metadata |
| `get_admin` | Get contract admin address |
| `get_treasury_pool_balance` | Get treasury pool balance |

### Transaction Example

Mint transaction hash: `9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a` (example — see explorer for real tx hashes)

## Tech Stack

- **Frontend:** Next.js 16 (App Router, Turbopack)
- **Smart Contract:** Soroban (Rust) on Stellar Testnet
- **Database:** Supabase (PostgreSQL) — farmers, listings, orders, reviews, attestations
- **Satellite Data:** openEO API (Copernicus Sentinel-2)
- **AI:** NVIDIA NIM (meta/llama-3.3-70b-instruct)
- **Wallet:** @creit.tech/stellar-wallets-kit (Freighter, XBull)
- **CI/CD:** GitHub Actions + Vercel

## Prerequisites

- Node.js 20+
- npm
- Stellar CLI (`cargo install stellar-cli`) — for contract deployment
- A funded Stellar testnet identity

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Fill in the required values (see below)

# Run dev server
npm run dev
```

### Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_STELLAR_RPC_URL` | Soroban RPC endpoint |
| `NEXT_PUBLIC_AGRI_CON_CONTRACT_ID` | Deployed contract ID |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key |
| `NVIDIA_API_KEY` | NVIDIA NIM API key |
| `OPENEO_CLIENT_ID` | Copernicus openEO client ID |
| `OPENEO_CLIENT_SECRET` | Copernicus openEO client secret |
| `ORACLE_SECRET_KEY` | Stellar secret key for oracle attestation signing |

### Database

Tables are created via Supabase migrations:

```bash
SUPABASE_ACCESS_TOKEN=xxx SUPABASE_PROJECT_REF=xxx node scripts/migrate.mjs
```

### Deploy Contract

```bash
ORACLE_ADDRESS="G..." bash deploy.sh
```

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/profile` | GET/POST | Farmer profile CRUD (Supabase) |
| `/api/listings` | GET/POST | Crop listings CRUD |
| `/api/orders` | GET/POST | Order tracking |
| `/api/reviews` | GET/POST | Farmer reviews |
| `/api/attestations` | POST | Record attestation |
| `/api/stellar` | POST | Contract interaction (prepare/sign/submit) |
| `/api/verification/run` | POST | Run NDVI check + submit attestation |
| `/api/ai/chat` | POST | AI agricultural assistant |
| `/api/ai/ndvi-summary` | POST | NDVI data explanation |

## Pages

| Route | Description | Wallet Required |
|---|---|---|
| `/` | Landing page | No |
| `/explore` | Draw parcels, mint NFTs, satellite verification | Yes |
| `/marketplace` | Browse and buy listed crops | Yes |
| `/verify` | Oracle NDVI checks and attestation | Yes |
| `/aid` | File disaster claims | Yes |
| `/profile` | Farmer profile management | Yes |
| `/mylistings` | View your listed crops | Yes |
| `/order` | Track purchase orders | Yes |
| `/dashboard` | Analytics dashboard | Yes |

## CI/CD

- **Contract Deployment:** GitHub Action deploys Soroban contract on push to `main` (when contracts/ changes)
- **Frontend:** Auto-deployed to Vercel on push to `main`
- **Tests:** Unit tests run on every PR

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes
4. Submit a pull request

## License

MIT
