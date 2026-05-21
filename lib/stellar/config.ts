export const STELLAR_NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ??
  "Test SDF Network ; September 2015";

export const STELLAR_RPC_URL =
  process.env.NEXT_PUBLIC_STELLAR_RPC_URL ??
  "https://soroban-testnet.stellar.org";

export const STELLAR_HORIZON_URL =
  process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL ??
  "https://horizon-testnet.stellar.org";

export const CONTRACT_IDS = {
  agriCon: process.env.NEXT_PUBLIC_AGRI_CON_CONTRACT_ID ?? "",
  cropNft: process.env.NEXT_PUBLIC_AGRI_CON_CONTRACT_ID ?? "",
  escrow: process.env.NEXT_PUBLIC_AGRI_CON_CONTRACT_ID ?? "",
  verification: process.env.NEXT_PUBLIC_AGRI_CON_CONTRACT_ID ?? "",
} as const;