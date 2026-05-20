import NavigationBar from "@/components/NavigationBar";
import { getLiveListings } from "@/lib/stellar/live-data";
import ExploreWorkspace from "./ExploreWorkspace";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VERIFICATION_WINDOW = {
  start: "2026-04-19T00:00:00Z",
  end: "2026-05-19T23:59:59Z",
};

export default async function ExplorePage() {
  let listings: Awaited<ReturnType<typeof getLiveListings>> = [];
  try {
    listings = await getLiveListings();
  } catch {}

  const parcels = listings.map((l) => ({
    id: l.nftId,
    title: l.parcelName ?? l.cropType ?? `Parcel #${l.nftId}`,
    lat: 14.5995 + l.nftId * 0.003,
    lng: 120.9842 + l.nftId * 0.002,
    temporalExtent: VERIFICATION_WINDOW,
    region: l.region,
    ndviBps: l.ndviBps,
    buyable: l.buyable,
  }));

  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <NavigationBar />
      <div className="mx-auto w-full max-w-7xl flex-1 px-3 py-4 sm:px-6 sm:py-6">
        <ExploreWorkspace parcels={parcels} />
      </div>
    </div>
  );
}