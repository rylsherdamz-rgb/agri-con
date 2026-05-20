import SidebarShell from "@/components/SidebarShell";
import { getLiveListings } from "@/lib/stellar/live-data";
import NavigationBar from "@/components/NavigationBar";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function MarketplacePage() {
  const listings = await getLiveListings();
  return (
    <div className="w-full h-screen px-5   shadow-xl">
        <NavigationBar />

        <div className="w-[90%] h-[90%] mx-[5%]">
            {/* this is where the listing will show with the filtering options and search options */}

        </div>


    </div>

  );
}
