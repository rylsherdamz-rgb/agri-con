import { getFarmer, listFarmers, upsertFarmer } from "@/lib/db";
import { submitSetFarmerProfileVerified } from "@/lib/stellar/backend";

function toCamel(row: Record<string, unknown> | null) {
  if (!row) return null;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    out[k.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] = v;
  }
  return out;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");
    if (address) {
      const profile = await getFarmer(address);
      return Response.json({ ok: true, profile: toCamel(profile as Record<string, unknown> | null) });
    }
    const farmers = await listFarmers();
    return Response.json({ ok: true, profiles: farmers.map((f) => toCamel(f as Record<string, unknown>)) });
  } catch (err) {
    console.error("GET /api/profile:", err);
    return Response.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { address, fullName, farmName, region, totalYieldKg, idDocPath } = body;
    if (!address || !fullName) {
      return Response.json({ ok: false, error: "address and fullName required" }, { status: 400 });
    }
    const profile = await upsertFarmer({
      id: address, fullName, farmName, region,
      totalYieldKg: totalYieldKg || 0, idDocPath, verified: true,
    });

    // Auto-verify on-chain via admin key
    const adminSecretKey = process.env.ADMIN_SECRET_KEY ?? "";
    if (adminSecretKey) {
      submitSetFarmerProfileVerified(address, adminSecretKey).catch(() => {});
    }

    return Response.json({ ok: true, profile: toCamel(profile as Record<string, unknown>) });
  } catch (err) {
    console.error("POST /api/profile:", err);
    return Response.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
