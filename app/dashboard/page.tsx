import NavigationBar from "@/components/NavigationBar";
import { getLiveListings, getLiveFarmerProfiles } from "@/lib/stellar/live-data";
import NFTLifecycleFlow from "@/components/NFTLifecycleFlow";
import LiquityPool from "@/components/LiquityPool";
import { Leaf, CheckCircle, DollarSign, Users, Sprout, ShieldCheck, Map, Store, Plus, AlertTriangle, ArrowRight } from "lucide-react";
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
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold tracking-tight text-stone-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-stone-500">Your agricultural command center</p>
        </div>

        {/* Quick Actions */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Map, label: "Verify Parcel", href: "/explore", color: "bg-farm-50 text-farm-700 border-farm-200" },
            { icon: Plus, label: "List Crop", href: "/explore", color: "bg-harvest-50 text-harvest-700 border-harvest-200" },
            { icon: Store, label: "Browse Market", href: "/marketplace", color: "bg-soil-50 text-soil-700 border-soil-200" },
            { icon: AlertTriangle, label: "Request Aid", href: "/aid", color: "bg-red-50 text-red-600 border-red-200" },
          ].map(({ icon: Icon, label, href, color }) => (
            <Link
              key={label}
              href={href}
              className={`flex flex-col items-center gap-2 rounded-2xl border p-4 transition hover:shadow-md ${color}`}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                <Icon size={18} />
              </div>
              <span className="text-xs font-semibold">{label}</span>
              <ArrowRight size={12} className="opacity-50" />
            </Link>
          ))}
        </div>

        {/* Key Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Leaf, label: "Total Parcels", value: listings.length, color: "bg-farm-100 text-farm-700" },
            { icon: CheckCircle, label: "Buyable Now", value: buyable.length, color: "bg-farm-100 text-farm-600" },
            { icon: DollarSign, label: "Market Volume", value: `$${totalVolume.toFixed(0)}`, color: "bg-harvest-100 text-harvest-700" },
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

        {/* Lifecycle + Treasury */}
        <div className="mb-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Lifecycle Flow */}
          <div className="card-farm p-5">
            <p className="mb-4 text-xs font-bold uppercase tracking-wider text-stone-500">
              Crop Lifecycle Status
            </p>
            <NFTLifecycleFlow current="listed" />
          </div>

          {/* Treasury Pool */}
          <LiquityPool />
        </div>

        {/* Bottom: Recent Parcels + Farmers */}
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          {/* Recent Parcels */}
          <div className="card-farm p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                Recent Parcels
              </h2>
              <Link href="/marketplace" className="text-xs font-medium text-farm-700 hover:underline flex items-center gap-1">
                View All <ArrowRight size={12} />
              </Link>
            </div>
            {listings.length === 0 ? (
              <div className="flex flex-col items-center py-10">
                <Sprout size={32} className="mb-2 text-stone-300" />
                <p className="text-sm text-stone-400">No parcels listed yet</p>
                <Link href="/explore" className="mt-2 text-xs font-medium text-farm-700 hover:underline">
                  Start by listing a crop
                </Link>
              </div>
            ) : (
              <div className="space-y-1.5">
                {listings.slice(0, 6).map((l) => {
                  const label = l.parcelName ?? l.cropType ?? `Parcel #${l.nftId}`;
                  const ndviPct = l.ndviBps !== null ? `${(l.ndviBps / 100).toFixed(0)}%` : null;
                  return (
                    <Link
                      key={l.nftId}
                      href={`/order?nftId=${l.nftId}`}
                      className="flex items-center justify-between rounded-xl border border-stone-100 px-4 py-3 transition hover:border-farm-200 hover:bg-farm-50/30"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-stone-800">{label}</p>
                        <p className="text-xs text-stone-400">
                          {l.region ?? "Unknown"}
                          {l.cropType ? <> &middot; {l.cropType}</> : ""}
                          {ndviPct ? <> &middot; NDVI {ndviPct}</> : ""}
                        </p>
                      </div>
                      <div className="ml-4 flex items-center gap-3 shrink-0">
                        {l.priceUsdc && (
                          <span className="text-sm font-semibold tabular-nums text-stone-800">{l.priceUsdc} USDC</span>
                        )}
                        <span className={l.buyable ? "badge-buyable" : "badge-pending"}>
                          {l.buyable ? "Ready" : "Pending"}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Farmers */}
          <div className="card-farm p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-600">Farmers</h2>
              <ShieldCheck size={14} className="text-stone-400" />
            </div>
            {profiles.length === 0 ? (
              <div className="flex flex-col items-center py-10">
                <Users size={32} className="mb-2 text-stone-300" />
                <p className="text-sm text-stone-400">No profiles yet</p>
                <Link href="/profile" className="mt-2 text-xs font-medium text-farm-700 hover:underline">
                  Register as a farmer
                </Link>
              </div>
            ) : (
              <div className="space-y-1.5">
                {profiles.map((p) => (
                  <div key={p.farmer} className="rounded-xl border border-stone-100 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-stone-800">
                        {p.fullName || "Farmer"}
                      </p>
                      {p.verified && <CheckCircle size={14} className="text-farm-600" />}
                    </div>
                    <p className="text-xs text-stone-400">
                      {p.farmName || "Farm"}
                      {p.region ? <> &middot; {p.region}</> : ""}
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