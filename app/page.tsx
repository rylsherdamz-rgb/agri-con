import Footer from "@/components/Footer";
import NavigationBar from "@/components/NavigationBar";
import HeroComponent from "@/components/HeroComponent";
import NFTLifecycleFlow from "@/components/NFTLifecycleFlow";
import Link from "next/link";
import { Sprout, ShieldCheck, ArrowRight, User, ShoppingBag } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-transparent text-stone-900">
      <NavigationBar />
      <main className="pb-12">
        <HeroComponent />

        {/* How It Works */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-farm-700">
              How It Works
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
              From Seed to Settlement
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-stone-500">
              Every crop follows a simple path — minted as an NFT, verified by satellite,
              and settled on-chain with USDC.
            </p>
          </div>
          <div className="overflow-x-auto pb-4">
            <NFTLifecycleFlow current="minted" />
          </div>
        </section>

        {/* I am a... (Role selector) */}
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-center font-display text-xl font-bold text-stone-900 sm:text-2xl">
            I am a...
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Farmer card */}
            <div className="card-farm card-hover p-6 sm:p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-farm-100 text-farm-700">
                <Sprout size={24} />
              </div>
              <h3 className="font-display text-lg font-bold text-stone-900">Farmer</h3>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-farm-700">
                I grow crops and want to sell them
              </p>
              <p className="mt-2 text-sm leading-relaxed text-stone-500">
                Mint your harvest as a Crop NFT and get paid upfront when a buyer reserves it. 
                Satellite data verifies your crop so you never need paperwork.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-stone-600">
                <li className="flex items-center gap-2">
                  <span className="text-farm-600 font-bold">1.</span> Register your farm profile
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-farm-600 font-bold">2.</span> Upload ID for verification
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-farm-600 font-bold">3.</span> Select your parcel & run satellite check
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-farm-600 font-bold">4.</span> Mint Crop NFT & list on marketplace
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-farm-600 font-bold">5.</span> Get 20% upfront, 70% on delivery
                </li>
              </ul>
              <Link href="/profile" className="btn-primary mt-6">
                <User size={14} /> Register as Farmer <ArrowRight size={14} />
              </Link>
            </div>

            {/* Buyer card */}
            <div className="card-farm card-hover p-6 sm:p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-harvest-100 text-harvest-700">
                <ShieldCheck size={24} />
              </div>
              <h3 className="font-display text-lg font-bold text-stone-900">Buyer</h3>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-harvest-700">
                I want to buy verified crops
              </p>
              <p className="mt-2 text-sm leading-relaxed text-stone-500">
                Browse verified crop parcels with real NDVI satellite data. Your USDC is
                held in escrow until delivery — no risk, full transparency.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-stone-600">
                <li className="flex items-center gap-2">
                  <span className="text-harvest-600 font-bold">1.</span> Browse marketplace with satellite data
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-harvest-600 font-bold">2.</span> View NDVI health scores & AI analysis
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-harvest-600 font-bold">3.</span> Purchase with USDC — funds held in escrow
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-harvest-600 font-bold">4.</span> Track delivery & settlement
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-harvest-600 font-bold">5.</span> Full refund if crop fails (treasury backed)
                </li>
              </ul>
              <Link href="/marketplace" className="btn-primary mt-6 bg-harvest-700 hover:bg-harvest-600">
                <ShoppingBag size={14} /> Browse Marketplace <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>

        {/* Stats banner */}
        <section className="border-y border-farm-200/60 bg-farm-50/50 py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-center">
              {[
                { value: "1,247+", label: "Crop NFTs Minted" },
                { value: "$856K", label: "USDC in Escrow" },
                { value: "389+", label: "Satellite Verifications" },
                { value: "12", label: "Farmers Onboarded" },
              ].map(({ value, label }) => (
                <div key={label}>
                  <p className="text-2xl font-bold tabular-nums text-farm-900 sm:text-3xl">
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
      </main>
      <Footer />
    </div>
  );
}