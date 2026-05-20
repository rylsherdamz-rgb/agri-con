import {
  BASE_FEE,
  Contract,
  rpc,
  Soroban,
  TimeoutInfinite,
  TransactionBuilder,
  nativeToScVal,
  xdr,
} from "@stellar/stellar-sdk";

import { CONTRACT_IDS, STELLAR_NETWORK_PASSPHRASE, STELLAR_RPC_URL } from "./config";

type ContractKey = keyof typeof CONTRACT_IDS;

type MintCropInput = {
  farmer: string;
  cropType: string;
  quantityKg: number;
  priceUsdc: string;
  harvestDate: string;
  parcelName: string;
  parcelBboxHash: string;
  parcelAreaHectares: number;
  region: string;
  minNdviBps: number;
  observationWindowDays: number;
};

type BuyCropInput = {
  buyer: string;
  nftId: number;
};
type UpsertFarmerProfileInput = {
  farmer: string;
  fullName: string;
  farmName: string;
  region: string;
  governmentIdObject: string;
  totalYieldKg: number;
};
type SetFarmerProfileVerifiedInput = {
  admin: string;
  farmer: string;
  verified: boolean;
};

type ProofInput = {
  farmer: string;
  nftId: number;
  proofHash: string;
};

type VerifyInput = {
  validator: string;
  nftId: number;
  status: "Delivered" | "Disaster" | "Fraud" | "Pending";
  notesHash: string;
  refundAmount: string;
  treasuryCompensation: string;
};
type SetListingBuyableInput = {
  admin: string;
  nftId: number;
  buyable: boolean;
};
type RecordSatelliteAttestationInput = {
  admin: string;
  nftId: number;
  observedAt: number;
  ndviBps: number;
  minNdviBps: number;
  buyable: boolean;
  bboxHash: string;
  reportHash: string;
  source: string;
};
type RecordSatelliteAttestationByOracleInput = {
  oracle: string;
  nftId: number;
  observedAt: number;
  ndviBps: number;
  minNdviBps: number;
  buyable: boolean;
  bboxHash: string;
  reportHash: string;
  source: string;
};

export type UnsignedTxPreview = {
  xdr: string;
  hash: string;
  contractId: string;
  method: string;
};

function makeRpcServer() {
  return new rpc.Server(STELLAR_RPC_URL, { allowHttp: STELLAR_RPC_URL.startsWith("http://") });
}

function getContractId(contract: ContractKey) {
  const value = CONTRACT_IDS[contract];
  if (!value) {
    throw new Error(`Missing contract ID for ${contract}`);
  }
  return value;
}

function parseUsdcAmount(amount: string) {
  return BigInt(Soroban.parseTokenAmount(amount || "0", 7));
}

function hectaresToBps(area: number) {
  return Math.round(area * 10_000);
}

function harvestDateToUnix(date: string) {
  return Math.floor(new Date(date).getTime() / 1000);
}

async function buildPreparedContractTransaction(
  address: string,
  contractId: string,
  method: string,
  args: xdr.ScVal[],
) {
  const server = makeRpcServer();
  const account = await server.getAccount(address);
  const contract = new Contract(contractId);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(TimeoutInfinite)
    .build();
  return server.prepareTransaction(tx);
}

function hashFromXdr(xdrTx: string) {
  return TransactionBuilder.fromXDR(xdrTx, STELLAR_NETWORK_PASSPHRASE).hash().toString("hex");
}

export async function prepareMintCropNft(input: MintCropInput): Promise<UnsignedTxPreview> {
  const contractId = getContractId("cropNft");
  const prepared = await buildPreparedContractTransaction(
    input.farmer,
    contractId,
    "mint_crop_nft_with_listing",
    [
      nativeToScVal(input.farmer, { type: "address" }),
      nativeToScVal(input.cropType, { type: "string" }),
      nativeToScVal(BigInt(input.quantityKg), { type: "i128" }),
      nativeToScVal(parseUsdcAmount(input.priceUsdc), { type: "i128" }),
      nativeToScVal(harvestDateToUnix(input.harvestDate), { type: "u64" }),
      nativeToScVal(input.parcelName, { type: "string" }),
      nativeToScVal(input.parcelBboxHash, { type: "string" }),
      nativeToScVal(hectaresToBps(input.parcelAreaHectares), { type: "u64" }),
      nativeToScVal(input.region, { type: "string" }),
      nativeToScVal(input.minNdviBps, { type: "u64" }),
      nativeToScVal(input.observationWindowDays, { type: "u32" }),
    ],
  );
  const xdr = prepared.toXDR();
  return { xdr, hash: hashFromXdr(xdr), contractId, method: "mint_crop_nft_with_listing" };
}

export async function prepareBuyCropNft(input: BuyCropInput): Promise<UnsignedTxPreview> {
  const contractId = getContractId("escrow");
  const prepared = await buildPreparedContractTransaction(input.buyer, contractId, "buy_crop_nft", [
    nativeToScVal(input.buyer, { type: "address" }),
    nativeToScVal(input.nftId, { type: "u64" }),
  ]);
  const xdr = prepared.toXDR();
  return { xdr, hash: hashFromXdr(xdr), contractId, method: "buy_crop_nft" };
}

export async function prepareUpsertFarmerProfile(
  input: UpsertFarmerProfileInput,
): Promise<UnsignedTxPreview> {
  const contractId = getContractId("cropNft");
  const prepared = await buildPreparedContractTransaction(
    input.farmer,
    contractId,
    "upsert_farmer_profile",
    [
      nativeToScVal(input.farmer, { type: "address" }),
      nativeToScVal(input.fullName, { type: "string" }),
      nativeToScVal(input.farmName, { type: "string" }),
      nativeToScVal(input.region, { type: "string" }),
      nativeToScVal(input.governmentIdObject, { type: "string" }),
      nativeToScVal(BigInt(input.totalYieldKg), { type: "i128" }),
    ],
  );
  const xdr = prepared.toXDR();
  return { xdr, hash: hashFromXdr(xdr), contractId, method: "upsert_farmer_profile" };
}

export async function prepareSetFarmerProfileVerified(
  input: SetFarmerProfileVerifiedInput,
): Promise<UnsignedTxPreview> {
  const contractId = getContractId("cropNft");
  const prepared = await buildPreparedContractTransaction(
    input.admin,
    contractId,
    "set_farmer_profile_verified",
    [
      nativeToScVal(input.farmer, { type: "address" }),
      nativeToScVal(input.verified, { type: "bool" }),
    ],
  );
  const xdr = prepared.toXDR();
  return { xdr, hash: hashFromXdr(xdr), contractId, method: "set_farmer_profile_verified" };
}

export async function prepareSubmitProof(input: ProofInput): Promise<UnsignedTxPreview> {
  const contractId = getContractId("verification");
  const prepared = await buildPreparedContractTransaction(input.farmer, contractId, "submit_proof", [
    nativeToScVal(input.farmer, { type: "address" }),
    nativeToScVal(input.nftId, { type: "u64" }),
    nativeToScVal(input.proofHash, { type: "string" }),
  ]);
  const xdr = prepared.toXDR();
  return { xdr, hash: hashFromXdr(xdr), contractId, method: "submit_proof" };
}

export async function prepareVerifyDelivery(input: VerifyInput): Promise<UnsignedTxPreview> {
  const contractId = getContractId("verification");
  const prepared = await buildPreparedContractTransaction(
    input.validator,
    contractId,
    "verify_delivery",
    [
      nativeToScVal(input.validator, { type: "address" }),
      nativeToScVal(input.nftId, { type: "u64" }),
      nativeToScVal(input.status, { type: "string" }),
      nativeToScVal(input.notesHash, { type: "string" }),
      nativeToScVal(parseUsdcAmount(input.refundAmount), { type: "i128" }),
      nativeToScVal(parseUsdcAmount(input.treasuryCompensation), { type: "i128" }),
    ],
  );
  const xdr = prepared.toXDR();
  return { xdr, hash: hashFromXdr(xdr), contractId, method: "verify_delivery" };
}

export async function prepareSetListingBuyable(
  input: SetListingBuyableInput,
): Promise<UnsignedTxPreview> {
  const contractId = getContractId("verification");
  const prepared = await buildPreparedContractTransaction(
    input.admin,
    contractId,
    "set_listing_buyable",
    [
      nativeToScVal(input.nftId, { type: "u64" }),
      nativeToScVal(input.buyable, { type: "bool" }),
    ],
  );
  const xdr = prepared.toXDR();
  return { xdr, hash: hashFromXdr(xdr), contractId, method: "set_listing_buyable" };
}

export async function prepareRecordSatelliteAttestation(
  input: RecordSatelliteAttestationInput,
): Promise<UnsignedTxPreview> {
  const contractId = getContractId("verification");
  const prepared = await buildPreparedContractTransaction(
    input.admin,
    contractId,
    "record_satellite_attestation",
    [
      nativeToScVal(input.nftId, { type: "u64" }),
      nativeToScVal(input.observedAt, { type: "u64" }),
      nativeToScVal(input.ndviBps, { type: "u64" }),
      nativeToScVal(input.minNdviBps, { type: "u64" }),
      nativeToScVal(input.buyable, { type: "bool" }),
      nativeToScVal(input.bboxHash, { type: "string" }),
      nativeToScVal(input.reportHash, { type: "string" }),
      nativeToScVal(input.source, { type: "string" }),
    ],
  );
  const xdr = prepared.toXDR();
  return { xdr, hash: hashFromXdr(xdr), contractId, method: "record_satellite_attestation" };
}

export async function prepareRecordSatelliteAttestationByOracle(
  input: RecordSatelliteAttestationByOracleInput,
): Promise<UnsignedTxPreview> {
  const contractId = getContractId("verification");
  const prepared = await buildPreparedContractTransaction(
    input.oracle,
    contractId,
    "record_sat_attest_oracle",
    [
      nativeToScVal(input.oracle, { type: "address" }),
      nativeToScVal(input.nftId, { type: "u64" }),
      nativeToScVal(input.observedAt, { type: "u64" }),
      nativeToScVal(input.ndviBps, { type: "u64" }),
      nativeToScVal(input.minNdviBps, { type: "u64" }),
      nativeToScVal(input.buyable, { type: "bool" }),
      nativeToScVal(input.bboxHash, { type: "string" }),
      nativeToScVal(input.reportHash, { type: "string" }),
      nativeToScVal(input.source, { type: "string" }),
    ],
  );
  const xdr = prepared.toXDR();
  return {
    xdr,
    hash: hashFromXdr(xdr),
    contractId,
    method: "record_sat_attest_oracle",
  };
}

export async function submitSignedTransaction(signedXdr: string) {
  const server = makeRpcServer();
  const tx = TransactionBuilder.fromXDR(signedXdr, STELLAR_NETWORK_PASSPHRASE);
  const sendResult = await server.sendTransaction(tx);
  return sendResult;
}
