import {
  BASE_FEE,
  Contract,
  rpc,
  scValToNative,
  TimeoutInfinite,
  TransactionBuilder,
  nativeToScVal,
  xdr,
} from "@stellar/stellar-sdk";

import { CONTRACT_IDS, STELLAR_NETWORK_PASSPHRASE, STELLAR_RPC_URL } from "./config";

export type LiveListing = {
  nftId: number;
  cropType: string | null;
  quantityKg: number | null;
  priceUsdc: string | null;
  farmer: string | null;
  harvestDate: number | null;
  cropStatus: string | null;
  buyable: boolean;
  observedAt: number | null;
  ndviBps: number | null;
  minNdviBps: number | null;
  source: string | null;
  parcelName: string | null;
  parcelBboxHash: string | null;
  parcelAreaHectares: number | null;
  region: string | null;
  observationWindowDays: number | null;
  totalYieldKg: number | null;
};

export type LiveFarmerProfile = {
  farmer: string;
  fullName: string;
  farmName: string;
  region: string;
  governmentIdObject: string;
  verified: boolean;
  totalYieldKg: number;
  updatedAt: number;
};

function makeRpcServer() {
  return new rpc.Server(STELLAR_RPC_URL, { allowHttp: STELLAR_RPC_URL.startsWith("http://") });
}

function withTimeout<T>(promise: Promise<T>, label: string, ms = 7000) {
  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) => {
      const timer = setTimeout(() => {
        clearTimeout(timer);
        reject(new Error(`${label} timed out after ${ms}ms`));
      }, ms);
    }),
  ]);
}

function getProbeAddress() {
  return (
    process.env.ORACLE_ADDRESS ??
    process.env.NEXT_PUBLIC_ORACLE_ADDRESS ??
    process.env.TREASURY_ADDRESS ??
    process.env.NEXT_PUBLIC_TREASURY_ADDRESS ??
    ""
  );
}

function parseNftIds() {
  const raw = process.env.ACTIVE_NFT_IDS ?? process.env.NEXT_PUBLIC_ACTIVE_NFT_IDS ?? "1";
  return raw
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value) && value > 0);
}

function parseFarmerAddresses() {
  const raw = process.env.FARMER_ADDRESSES ?? process.env.NEXT_PUBLIC_FARMER_ADDRESSES ?? "";
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function scNumberToNumber(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function formatUsdcFromStroops(value: unknown): string | null {
  const raw = scNumberToNumber(value);
  if (raw === null) return null;
  return (raw / 10_000_000).toFixed(2);
}

async function readContract(method: string, args: xdr.ScVal[]) {
  const contractId = CONTRACT_IDS.verification;
  if (!contractId) {
    throw new Error("Missing verification contract id");
  }

  const probe = getProbeAddress();
  if (!probe) {
    throw new Error("Missing probe address (set ORACLE_ADDRESS or TREASURY_ADDRESS)");
  }

  const server = makeRpcServer();
  const account = await server.getAccount(probe);
  const contract = new Contract(contractId);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(TimeoutInfinite)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(sim.error);
  }
  if (!sim.result?.retval) {
    throw new Error(`No return value for ${method}`);
  }

  return scValToNative(sim.result.retval);
}

export async function getLiveListings(): Promise<LiveListing[]> {
  const ids = parseNftIds();
  return Promise.all(
    ids.map(async (nftId) => {
      let cropType: string | null = null;
      let quantityKg: number | null = null;
      let priceUsdc: string | null = null;
      let farmer: string | null = null;
      let harvestDate: number | null = null;
      let cropStatus: string | null = null;
      let buyable = false;
      try {
        const result = await withTimeout(
          readContract("is_listing_buyable", [nativeToScVal(nftId, { type: "u64" })]),
          `read buyable state for nft ${nftId}`,
        );
        buyable = Boolean(result);
      } catch {
        buyable = false;
      }

      let observedAt: number | null = null;
      let ndviBps: number | null = null;
      let minNdviBps: number | null = null;
      let source: string | null = null;
      let parcelName: string | null = null;
      let parcelBboxHash: string | null = null;
      let parcelAreaHectares: number | null = null;
      let region: string | null = null;
      let observationWindowDays: number | null = null;
      let totalYieldKg: number | null = null;

      try {
        const crop = (await withTimeout(
          readContractFor(CONTRACT_IDS.cropNft, "get_crop", [nativeToScVal(nftId, { type: "u64" })]),
          `read crop metadata for nft ${nftId}`,
        )) as Record<string, unknown>;
        cropType = typeof crop.crop_type === "string" ? crop.crop_type : null;
        quantityKg = scNumberToNumber(crop.quantity);
        priceUsdc = formatUsdcFromStroops(crop.price);
        farmer = typeof crop.farmer === "string" ? crop.farmer : null;
        harvestDate = scNumberToNumber(crop.harvest_date);
        cropStatus = typeof crop.status === "string" ? crop.status : null;
      } catch {
        // Crop might not exist for configured id.
      }

      try {
        const attestation = (await withTimeout(
          readContract("get_satellite_attestation", [nativeToScVal(nftId, { type: "u64" })]),
          `read attestation for nft ${nftId}`,
        )) as Record<string, unknown>;
        observedAt = typeof attestation.observed_at === "number" ? attestation.observed_at : null;
        ndviBps = typeof attestation.ndvi_bps === "number" ? attestation.ndvi_bps : null;
        minNdviBps =
          typeof attestation.min_ndvi_bps === "number" ? attestation.min_ndvi_bps : null;
        source = typeof attestation.source === "string" ? attestation.source : null;
      } catch {
        // No attestation yet for this nft id.
      }

      try {
        const listing = (await withTimeout(
          readContractFor(
            CONTRACT_IDS.cropNft,
            "get_listing_metadata",
            [nativeToScVal(nftId, { type: "u64" })],
          ),
          `read listing metadata for nft ${nftId}`,
        )) as Record<string, unknown>;
        parcelName = typeof listing.parcel_name === "string" ? listing.parcel_name : null;
        parcelBboxHash =
          typeof listing.parcel_bbox_hash === "string" ? listing.parcel_bbox_hash : null;
        const areaBps = scNumberToNumber(listing.parcel_area_hectares_bps);
        parcelAreaHectares = areaBps === null ? null : areaBps / 10_000;
        region = typeof listing.region === "string" ? listing.region : region;
        observationWindowDays = scNumberToNumber(listing.observation_window_days);
        if (minNdviBps === null) {
          minNdviBps = scNumberToNumber(listing.min_ndvi_bps);
        }
      } catch {
        // Listing metadata may not yet exist for older mints.
      }

      return {
        nftId,
        cropType,
        quantityKg,
        priceUsdc,
        farmer,
        harvestDate,
        cropStatus,
        buyable,
        observedAt,
        ndviBps,
        minNdviBps,
        source,
        parcelName,
        parcelBboxHash,
        parcelAreaHectares,
        region,
        observationWindowDays,
        totalYieldKg,
      };
    }),
  );
}

export async function getLiveFarmerProfiles(): Promise<LiveFarmerProfile[]> {
  const contractId = CONTRACT_IDS.cropNft;
  if (!contractId) return [];
  const farmers = parseFarmerAddresses();
  if (farmers.length === 0) return [];

  const profiles = await Promise.all(
    farmers.map(async (farmer) => {
      try {
        const result = (await withTimeout(
          readContractFor(contractId, "get_farmer_profile", [
            nativeToScVal(farmer, { type: "address" }),
          ]),
          `read farmer profile for ${farmer}`,
        )) as Record<string, unknown>;

        return {
          farmer,
          fullName: typeof result.full_name === "string" ? result.full_name : "",
          farmName: typeof result.farm_name === "string" ? result.farm_name : "",
          region: typeof result.region === "string" ? result.region : "",
          governmentIdObject:
            typeof result.government_id_object === "string" ? result.government_id_object : "",
          verified: Boolean(result.verified),
          totalYieldKg:
            typeof result.total_yield_kg === "number"
              ? result.total_yield_kg
              : Number(result.total_yield_kg ?? 0),
          updatedAt: typeof result.updated_at === "number" ? result.updated_at : 0,
        } satisfies LiveFarmerProfile;
      } catch {
        return null;
      }
    }),
  );

  return profiles.filter((profile): profile is LiveFarmerProfile => profile !== null);
}

async function readContractFor(contractId: string, method: string, args: xdr.ScVal[]) {
  if (!contractId) {
    throw new Error("Missing contract id");
  }
  const probe = getProbeAddress();
  if (!probe) {
    throw new Error("Missing probe address (set ORACLE_ADDRESS or TREASURY_ADDRESS)");
  }

  const server = makeRpcServer();
  const account = await server.getAccount(probe);
  const contract = new Contract(contractId);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(TimeoutInfinite)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(sim.error);
  }
  if (!sim.result?.retval) {
    throw new Error(`No return value for ${method}`);
  }

  return scValToNative(sim.result.retval);
}
