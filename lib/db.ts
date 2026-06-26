import { getSupabaseAdmin } from "./supabase-client";

function getDb() {
  const db = getSupabaseAdmin();
  if (!db) throw new Error("Supabase not configured");
  return db;
}

export async function upsertFarmer(data: {
  id: string; fullName: string; farmName?: string; region?: string;
  totalYieldKg?: number; idDocPath?: string | null; verified?: boolean;
}) {
  const { error } = await getDb().from("farmers").upsert({
    id: data.id, full_name: data.fullName, farm_name: data.farmName ?? "",
    region: data.region ?? "", total_yield_kg: data.totalYieldKg ?? 0,
    id_doc_path: data.idDocPath ?? null, verified: data.verified ?? false,
  }, { onConflict: "id" });
  if (error) throw error;
  return getFarmer(data.id);
}

export async function getFarmer(id: string) {
  const { data } = await getDb().from("farmers").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export async function listFarmers() {
  const { data } = await getDb().from("farmers").select("*").order("updated_at", { ascending: false });
  return data ?? [];
}

export async function upsertListing(data: {
  nftId: number; cropType?: string; quantityKg?: number; priceUsdc?: number;
  farmerId: string; parcelName?: string; region?: string; buyable?: boolean;
  ndviBps?: number; minNdviBps?: number; areaHa?: number; totalYieldKg?: number; status?: string;
}) {
  const { error } = await getDb().from("listings").upsert({
    nft_id: data.nftId, crop_type: data.cropType ?? null, quantity_kg: data.quantityKg ?? null,
    price_usdc: data.priceUsdc ?? null, farmer_id: data.farmerId,
    parcel_name: data.parcelName ?? null, region: data.region ?? null,
    buyable: data.buyable ?? false, ndvi_bps: data.ndviBps ?? null,
    min_ndvi_bps: data.minNdviBps ?? null, area_ha: data.areaHa ?? null,
    total_yield_kg: data.totalYieldKg ?? null, status: data.status ?? "minted",
  }, { onConflict: "nft_id" });
  if (error) throw error;
}

export async function getListings(filters: {
  buyable?: boolean; region?: string; farmerId?: string; search?: string;
} = {}) {
  let query = getDb().from("listings").select("*, farmer:farmers!farmer_id(full_name, farm_name, region, verified)").order("created_at", { ascending: false });
  if (filters.buyable !== undefined) query = query.eq("buyable", filters.buyable);
  if (filters.region) query = query.eq("region", filters.region);
  if (filters.farmerId) query = query.eq("farmer_id", filters.farmerId);
  if (filters.search) {
    query = query.or(`parcel_name.ilike.%${filters.search}%,crop_type.ilike.%${filters.search}%,region.ilike.%${filters.search}%`);
  }
  const { data } = await query;
  return data ?? [];
}

export async function createOrder(data: {
  listingId: number; buyerAddress: string; amountUsdc?: number; txHash?: string; status?: string;
}) {
  const { error } = await getDb().from("orders").insert({
    listing_id: data.listingId, buyer_address: data.buyerAddress,
    amount_usdc: data.amountUsdc ?? 0, tx_hash: data.txHash ?? null,
    status: data.status ?? "escrow",
  });
  if (error) throw error;
}

export async function getOrders(filters: {
  buyerAddress?: string; farmerAddress?: string; status?: string;
} = {}) {
  let query = getDb().from("orders").select("*, listing:listings!listing_id(*, farmer:farmers!farmer_id(full_name, farm_name))").order("created_at", { ascending: false });
  if (filters.buyerAddress) query = query.eq("buyer_address", filters.buyerAddress);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.farmerAddress) {
    query = query.eq("listing.farmer_id", filters.farmerAddress);
  }
  const { data } = await query;
  return data ?? [];
}

export async function recordAttestation(data: {
  nftId: number; observedAt: number; ndviBps: number;
  minNdviBps: number; buyable: boolean; bboxHash: string; reportHash: string; source?: string;
}) {
  const { error } = await getDb().from("attestations").insert({
    nft_id: data.nftId, observed_at: new Date(data.observedAt * 1000).toISOString(),
    ndvi_bps: data.ndviBps, min_ndvi_bps: data.minNdviBps, buyable: data.buyable,
    bbox_hash: data.bboxHash, report_hash: data.reportHash, source: data.source ?? "copernicus-sentinel2",
  });
  if (error) throw error;
}

export async function createReview(data: {
  orderId: string; reviewer: string; farmerId: string; rating: number; comment?: string;
}) {
  const { error } = await getDb().from("reviews").insert({
    order_id: data.orderId, reviewer: data.reviewer, farmer_id: data.farmerId,
    rating: data.rating, comment: data.comment ?? null,
  });
  if (error) {
    if (error.code === "23505") throw Object.assign(error, { statusCode: 409 });
    throw error;
  }
}

export async function getReviews(filters: {
  farmerId?: string; orderId?: string; reviewer?: string;
} = {}) {
  let query = getDb().from("reviews").select("*, order:orders!order_id(listing:listings!listing_id(parcel_name, crop_type))").order("created_at", { ascending: false });
  if (filters.farmerId) query = query.eq("farmer_id", filters.farmerId);
  if (filters.orderId) query = query.eq("order_id", filters.orderId);
  if (filters.reviewer) query = query.eq("reviewer", filters.reviewer);
  const { data } = await query;
  return data ?? [];
}

export async function getAverageRating(farmerId: string) {
  const { data } = await getDb().from("reviews").select("rating").eq("farmer_id", farmerId);
  if (!data || data.length === 0) return { average: 0, count: 0 };
  const sum = data.reduce((a, r) => a + r.rating, 0);
  return { average: sum / data.length, count: data.length };
}
