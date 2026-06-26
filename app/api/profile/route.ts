import { getFarmer, listFarmers, upsertFarmer } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");
    if (address) {
      const profile = await getFarmer(address);
      return Response.json({ ok: true, profile });
    }
    const farmers = await listFarmers();
    return Response.json({ ok: true, profiles: farmers });
  } catch (err) {
    console.error("GET /api/profile:", err);
    return Response.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { address, fullName, farmName, region, totalYieldKg, idDocPath, verified } = body;
    if (!address || !fullName) {
      return Response.json({ ok: false, error: "address and fullName required" }, { status: 400 });
    }
    const profile = await upsertFarmer({
      id: address, fullName, farmName, region,
      totalYieldKg: totalYieldKg || 0, idDocPath, verified,
    });
    return Response.json({ ok: true, profile });
  } catch (err) {
    console.error("POST /api/profile:", err);
    return Response.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
