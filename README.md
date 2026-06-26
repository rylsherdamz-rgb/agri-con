# Agri-Block

Agricultural forward contracts on Stellar with crop NFTs, escrow settlement, satellite-gated buyability, and disaster aid.

## Features

- **Crop NFTs** — Farmers mint NFTs representing crop parcels with metadata (crop type, quantity, price, region)
- **Satellite Verification** — NDVI analysis via Copernicus Sentinel-2 (openEO) gated by **X402 micro-payment** (0.1 XLM). All farmers auto-verified on signup.
- **XLM Escrow** — Buyers pay XLM; 20% upfront to farmer, 70% held in escrow until delivery, 10% to disaster treasury
- **Disaster Aid** — Farmers file claims for crop loss; on-chain proof of damage
- **AI Assistant** — NVIDIA NIM-powered chat for agricultural guidance

## Smart Contract

Deployed on Stellar Testnet.

| Contract | ID |
|---|---|
| agri_con | `CC7CCIMTME2KBV7RRUTXAW6XTPE2FBRYLV3CLKF2YQNU5NHX5NYH37TC` |

**Source:** [contracts/agri_con/src/](contracts/agri_con/src/)

**Explorer:** https://stellar.expert/explorer/testnet/contract/CC7CCIMTME2KBV7RRUTXAW6XTPE2FBRYLV3CLKF2YQNU5NHX5NYH37TC

### Contract Methods

| Method | Description |
|---|---|
| `mint_crop_nft_with_listing` | Mint a new crop NFT with listing metadata |
| `buy_crop_nft` | Purchase a listed crop NFT (XLM escrow) |
| `record_satellite_attestation` | Record NDVI attestation, sets buyability |
| `set_farmer_profile_verified` | Admin-signed on-chain verification |
| `submit_proof` | File a disaster proof for a crop |
| `verify_delivery` | Validator confirms delivery |
| `get_crop` | Read crop metadata |
| `get_listing_metadata` | Read listing metadata |
| `get_satellite_attestation` | Read NDVI attestation |
| `is_listing_buyable` | Check if a listing is buyable |
| `get_admin` | Get contract admin address |
| `get_treasury_pool_balance` | Get treasury pool balance |
| `get_next_nft_id` | Get the next NFT ID to be minted (used for full discovery) |

## Tech Stack

- **Frontend:** Next.js 16 (App Router, Turbopack)
- **Smart Contract:** Soroban (Rust) on Stellar Testnet
- **Database:** Supabase (PostgreSQL) — farmers, listings, orders, reviews, attestations
- **Satellite Data:** openEO API (Copernicus Sentinel-2)
- **AI:** NVIDIA NIM (meta/llama-3.3-70b-instruct)
- **Wallet:** @creit.tech/stellar-wallets-kit (Freighter, XBull)
- **Payments:** x402-stellar-sdk (XLM micro-payments for NDVI verification)
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
| `NEXT_PUBLIC_TREASURY_ADDRESS` | Treasury/admin Stellar address |
| `ADMIN_SECRET_KEY` | Server-side secret key for admin-signed transactions (attestations, farmer verification) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key |
| `NVIDIA_API_KEY` | NVIDIA NIM API key |
| `OPENEO_CLIENT_ID` | Copernicus openEO client ID |
| `OPENEO_CLIENT_SECRET` | Copernicus openEO client secret |
| `X402_PRICE` | X402 micro-payment amount in XLM (default `0.1`) |

### Database

Tables are created via Supabase migrations:

```bash
SUPABASE_ACCESS_TOKEN=xxx SUPABASE_PROJECT_REF=xxx node scripts/migrate.mjs
```

### Deploy Contract

```bash
bash deploy.sh
```

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/profile` | GET/POST | Farmer profile CRUD (auto-verified on create) |
| `/api/listings` | GET/POST | Crop listings CRUD |
| `/api/orders` | GET/POST | Order tracking |
| `/api/reviews` | GET/POST | Farmer reviews |
| `/api/attestations` | POST | Record attestation |
| `/api/stellar` | POST | Contract interaction (prepare/sign/submit) |
| `/api/verification/run` | POST | Run NDVI check (X402-gated, 0.1 XLM) |
| `/api/ai/chat` | POST | AI agricultural assistant |
| `/api/ai/ndvi-summary` | POST | NDVI data explanation |

## Pages

| Route | Description | Wallet Required |
|---|---|---|
| `/` | Landing page | No |
| `/explore` | Draw parcels, mint NFTs, satellite verification | Yes |
| `/marketplace` | Browse and buy listed crops | Yes |
| `/verify` | NDVI checks and attestation | Yes |
| `/aid` | File disaster claims | Yes |
| `/profile` | Farmer profile management | Yes |
| `/mylistings` | View your listed crops | Yes |
| `/order` | Track purchase orders | Yes |
| `/dashboard` | Analytics dashboard | Yes |

## Testing

```bash
# Unit tests (Stellar RPC, contract ID)
npm test

# E2E tests (production)
npx playwright test --config=e2e/playwright.config.ts
```

Tests target `https://agri-con-one.vercel.app` by default. Set `PLAYWRIGHT_BASE_URL` to test locally.

## CI/CD

- **Contract Deployment:** GitHub Action deploys Soroban contract on push to `main` (when contracts/ changes)
- **Frontend:** Auto-deployed to Vercel on push to `main`
- **Tests:** Unit tests run on every PR

## License

MIT
