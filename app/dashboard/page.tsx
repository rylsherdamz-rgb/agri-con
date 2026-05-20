import NavigationBar from "@/components/NavigationBar";
import { getLiveListings, getLiveFarmerProfiles } from "@/lib/stellar/live-data";
import NFTLifecycleFlow from "@/components/NFTLifecycleFlow";
import { Leaf, CheckCircle, DollarSign, Users, Sprout, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function DashboardPage() {
  const [listings, profiles] = await Promise.all([
    getLiveListings(),
    getLiveFarmerProfiles(),
  ]);

  const buyable = listings.filter((l) => l.buyable);
  const totalVolume = listings
    .filter((l) => l.priceUsdc !== null)
    .reduce((sum, l) => sum + parseFloat(l.priceUsdc ?? "0"), 0);

  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <NavigationBar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold tracking-tight text-stone-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-stone-500">Your farm at a glance</p>
        </div>

        {/* NFT Lifecycle Flow */}
        <div className="mb-8 overflow-x-auto rounded-2xl border border-farm-100/60 bg-farm-50/30 p-5">
          <p className="mb-4 text-xs font-bold uppercase tracking-wider text-stone-500">
            Crop Lifecycle Status
          </p>
          <NFTLifecycleFlow current="listed" />
        </div>

        {/* Stats grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Leaf, label: "Crop NFTs", value: listings.length, color: "bg-farm-100 text-farm-700" },
            { icon: CheckCircle, label: "Ready to Buy", value: buyable.length, color: "bg-farm-100 text-farm-600" },
            { icon: DollarSign, label: "Total USDC Volume", value: `$${totalVolume.toFixed(0)}`, color: "bg-harvest-100 text-harvest-700" },
            { icon: Users, label: "Farmers", value: profiles.length, color: "bg-soil-100 text-soil-600" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="card-farm p-5">
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                <Icon size={18} />
              </div>
              <p className="text-2xl font-bold tabular-nums text-stone-900">{value}</p>
              <p className="mt-0.5 text-xs text-stone-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Bottom grid: recent listings + farmer profiles */}
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="card-farm p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-600">
                Recent Parcels
              </h2>
              <Link href="/marketplace" className="text-xs font-medium text-farm-700 hover:underline">
                View All
              </Link>
            </div>
            {listings.length === 0 ? (
              <div className="flex flex-col items-center py-10">
                <Sprout size={32} className="mb-2 text-stone-300" />
                <p className="text-sm text-stone-400">No crop parcels yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {listings.slice(0, 6).map((l) => {
                  const label = l.parcelName ?? l.cropType ?? `Parcel #${l.nftId}`;
                  return (
                    <div key={l.nftId} className="flex items-center justify-between rounded-xl border border-stone-100 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-stone-800">{label}</p>
                        <p className="text-xs text-stone-400">
                          {l.region ?? "Unknown"} {l.cropType ? `| ${l.cropType}` : ""}
                        </p>
                      </div>
                      <div className="ml-4 flex items-center gap-3">
                        {l.priceUsdc && (
                          <span className="text-sm font-semibold text-stone-800">${l.priceUsdc}</span>
                        )}
                        <span className={l.buyable ? "badge-buyable" : "badge-pending"}>
                          {l.buyable ? "Buyable" : "Pending"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card-farm p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-600">Farmers</h2>
              <ShieldCheck size={16} className="text-stone-400" />
            </div>
            {profiles.length === 0 ? (
              <div className="flex flex-col items-center py-10">
                <Users size={32} className="mb-2 text-stone-300" />
                <p className="text-sm text-stone-400">No farmer profiles yet</p>
                <Link href="/profile" className="mt-2 text-xs font-medium text-farm-700 hover:underline">
                  Register as a farmer
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {profiles.map((p) => (
                  <div key={p.farmer} className="rounded-xl border border-stone-100 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-stone-800">
                        {p.fullName || "Farmer"}
                      </p>
                      {p.verified && <CheckCircle size={14} className="text-farm-600" />}
                    </div>
                    <p className="text-xs text-stone-400">
                      {p.farmName || "Farm"} &middot; {p.region || ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}