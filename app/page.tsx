import Footer from "@/components/Footer";
import NavigationBar from "@/components/NavigationBar";
import HeroComponent from "@/components/HeroComponent";
import NFTLifecycleFlow from "@/components/NFTLifecycleFlow";
import Link from "next/link";
import { Sprout, ShieldCheck, ArrowRight, User, ShoppingBag, Map, Satellite, Users, TrendingUp } from "lucide-react";
import { getLiveListings, getLiveFarmerProfiles } from "@/lib/stellar/live-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Home() {
  let listings: Awaited<ReturnType<typeof getLiveListings>> = [];
  let profiles: Awaited<ReturnType<typeof getLiveFarmerProfiles>> = [];
  try { listings = await getLiveListings(); } catch {}
  try { profiles = await getLiveFarmerProfiles(); } catch {}

  const buyableCount = listings.filter((l) => l.buyable).length;
  const totalVolume = listings
    .filter((l) => l.priceUsdc !== null)
    .reduce((s, l) => s + parseFloat(l.priceUsdc ?? "0"), 0);
  const verifiedCount = profiles.filter((p) => p.verified).length;

  return (
    <div className="min-h-screen bg-transparent text-stone-900">
      <NavigationBar />
      <main className="pb-12">
        <HeroComponent
          listingCount={listings.length}
          buyableCount={buyableCount}
          totalVolume={totalVolume}
          farmerCount={profiles.length}
        />

        {/* How It Works */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-farm-700">
              How It Works
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
              From Seed to Settlement
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-stone-500">
              Every crop follows a simple path &mdash; minted as an NFT, verified by satellite,
              and settled on-chain with USDC.
            </p>
          </div>
          <div className="overflow-x-auto pb-4">
            <NFTLifecycleFlow current="minted" />
          </div>
        </section>

        {/* I am a... */}
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-center font-display text-2xl font-bold text-stone-900">
            Choose your path
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">

            {/* Farmer Card */}
            <div className="card-farm card-hover p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-farm-100/60" />
              <div className="relative z-10">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-farm-100 text-farm-700">
                  <Sprout size={24} />
                </div>
                <h3 className="font-display text-xl font-bold text-stone-900">Grower</h3>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-farm-700">
                  I grow crops and want to sell them
                </p>
                <p className="mt-3 text-sm leading-relaxed text-stone-500">
                  Mint your harvest as a Crop NFT and get paid upfront when a buyer reserves it.
                  Satellite data verifies your crop so you never need paperwork.
                </p>

                <div className="mt-5 space-y-2.5">
                  {[
                    { num: 1, label: "Register your farm profile and verify identity" },
                    { num: 2, label: "Draw your parcel on the map and run satellite checks" },
                    { num: 3, label: "Mint Crop NFT and list on the marketplace" },
                    { num: 4, label: "Get 20% upfront, 70% held in escrow until delivery" },
                  ].map(({ num, label }) => (
                    <div key={num} className="flex items-start gap-3 text-sm text-stone-600">
                      <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-farm-100 text-[11px] font-bold text-farm-700">
                        {num}
                      </span>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap gap-2.5">
                  <Link href="/profile" className="btn-primary">
                    <User size={15} /> Register Now <ArrowRight size={15} />
                  </Link>
                  <Link href="/explore" className="btn-outline">
                    <Map size={15} /> Map a Parcel
                  </Link>
                </div>
              </div>
            </div>

            {/* Buyer Card */}
            <div className="card-farm card-hover p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-harvest-100/60" />
              <div className="relative z-10">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-harvest-100 text-harvest-700">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="font-display text-xl font-bold text-stone-900">Buyer</h3>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-harvest-700">
                  I want to buy verified crops
                </p>
                <p className="mt-3 text-sm leading-relaxed text-stone-500">
                  Browse verified crop parcels with real NDVI satellite data. Your USDC is
                  held in escrow until delivery &mdash; no risk, full transparency.
                </p>

                <div className="mt-5 space-y-2.5">
                  {[
                    { num: 1, label: "Browse marketplace with satellite-verified listings" },
                    { num: 2, label: "Compare NDVI health scores and AI crop analysis" },
                    { num: 3, label: "Purchase with USDC — funds held securely in escrow" },
                    { num: 4, label: "Track delivery, release escrow, or claim refund" },
                  ].map(({ num, label }) => (
                    <div key={num} className="flex items-start gap-3 text-sm text-stone-600">
                      <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-harvest-100 text-[11px] font-bold text-harvest-700">
                        {num}
                      </span>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>

                <Link href="/marketplace" className="btn-primary mt-6 bg-harvest-700 hover:bg-harvest-600 shadow-harvest-700/20">
                  <ShoppingBag size={15} /> Browse Marketplace <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Banner — live data */}
        {(listings.length > 0 || profiles.length > 0) && (
          <section className="border-y border-farm-200/30 bg-gradient-to-r from-farm-50/60 via-white to-harvest-50/60 py-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-6 text-center">
                {[
                  { value: listings.length.toLocaleString(), label: "Crop NFTs Minted", icon: Sprout },
                  { value: `${totalVolume.toFixed(0)} USDC`, label: "Market Volume", icon: Satellite },
                  { value: verifiedCount, label: "Verified Farmers", icon: Users },
                  { value: buyableCount, label: "Buyable Listings", icon: TrendingUp },
                ].map(({ value, label, icon: Icon }) => (
                  <div key={label} className="flex flex-col items-center">
                    <Icon size={16} className="mb-2 text-stone-400" />
                    <p className="text-2xl font-bold tabular-nums text-stone-900 sm:text-3xl">
                      {value}
                    </p>
                    <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-stone-500">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}