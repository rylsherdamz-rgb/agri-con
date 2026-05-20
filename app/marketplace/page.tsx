import { getLiveListings } from "@/lib/stellar/live-data";
import NavigationBar from "@/components/NavigationBar";
import MarketplaceClient from "./MarketplaceClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function MarketplacePage() {
  let listings: Awaited<ReturnType<typeof getLiveListings>> = [];
  try {
    listings = await getLiveListings();
  } catch {
    // Render empty state if RPC unavailable
  }

  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <NavigationBar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <MarketplaceClient listings={listings} />
      </main>
    </div>
  );
}