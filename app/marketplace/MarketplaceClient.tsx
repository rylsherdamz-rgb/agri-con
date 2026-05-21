"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  MapPin,
  Plus,
  Leaf,
  DollarSign,
  Scale,
  CheckCircle,
  XCircle,
  Search,
  Sprout,
  Shield,
  TrendingUp,
  Users,
  ShoppingBag,
  ArrowRight,
  Loader2,
} from "lucide-react";
import SearchBar from "@/components/SearchBar";
import Filter, { type FilterState } from "@/components/Filter";
import NFTLifecycleFlow from "@/components/NFTLifecycleFlow";
import CheckOutComponent from "@/components/CheckOutComponent";
import { useWallet } from "@/components/stellar/wallet-context";
import { buyCropNft, submitSignedXdr } from "@/lib/stellar/agri-block";
import type { LiveListing } from "@/lib/stellar/live-data";

function NvdiRing({ value, size = 48 }: { value: number; size?: number }) {
  const pct = Math.min(value / 100, 100);
  const stroke = size / 8;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  const color =
    pct > 70 ? "#16a34a" : pct > 40 ? "#f59e0b" : "#dc2626";

  return (
    <div className="relative flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#e8e8e0"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <span className="absolute text-[11px] font-bold tabular-nums" style={{ color }}>
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}

function ListingCard({ listing, onBuy }: { listing: LiveListing; onBuy: () => void }) {
  const label = listing.parcelName ?? listing.cropType ?? `Parcel #${listing.nftId}`;
  const ndviBps = listing.ndviBps ?? 0;
  const ndviPct = ndviBps / 100;

  return (
    <div className="group card-farm card-hover flex flex-col p-5">
      {/* Top row: NDVI ring + title */}
      <div className="flex items-start gap-4">
        <NvdiRing value={ndviPct} size={48} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-bold text-stone-800 leading-snug line-clamp-2">{label}</p>
            <span className={listing.buyable ? "badge-buyable shrink-0" : "badge-pending shrink-0"}>
              {listing.buyable ? (
                <><CheckCircle size={10} /> Ready</>
              ) : (
                <><XCircle size={10} /> Pending</>
              )}
            </span>
          </div>

          <p className="mt-1 flex items-center gap-1 text-[11px] text-stone-400">
            <MapPin size={10} />
            {listing.region ?? "Unknown"}
            {listing.parcelAreaHectares !== null && (
              <> &middot; {listing.parcelAreaHectares.toFixed(1)} ha</>
            )}
          </p>
        </div>
      </div>

      {/* Info grid */}
      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        {listing.cropType && (
          <div className="flex items-center gap-1.5 rounded-lg bg-stone-50 px-2.5 py-1.5 text-stone-600">
            <Leaf size={13} className="text-farm-600 shrink-0" />
            <span className="capitalize truncate">{listing.cropType}</span>
          </div>
        )}
        {listing.priceUsdc && (
          <div className="flex items-center gap-1.5 rounded-lg bg-stone-50 px-2.5 py-1.5 text-stone-600">
            <DollarSign size={13} className="text-farm-600 shrink-0" />
            <span className="font-semibold tabular-nums">{listing.priceUsdc} USDC</span>
          </div>
        )}
        {listing.quantityKg !== null && (
          <div className="flex items-center gap-1.5 rounded-lg bg-stone-50 px-2.5 py-1.5 text-stone-600">
            <Scale size={13} className="text-farm-600 shrink-0" />
            <span className="tabular-nums">{listing.quantityKg.toLocaleString()} kg</span>
          </div>
        )}
        {listing.totalYieldKg !== null && listing.totalYieldKg > 0 && (
          <div className="flex items-center gap-1.5 rounded-lg bg-stone-50 px-2.5 py-1.5 text-stone-600">
            <Sprout size={13} className="text-farm-600 shrink-0" />
            <span className="tabular-nums">{listing.totalYieldKg.toLocaleString()} kg yield</span>
          </div>
        )}
        {listing.minNdviBps !== null && (
          <div className="flex items-center gap-1.5 rounded-lg bg-stone-50 px-2.5 py-1.5 text-stone-600">
            <TrendingUp size={13} className="text-farm-600 shrink-0" />
            <span className="tabular-nums">min {(listing.minNdviBps / 100).toFixed(0)}%</span>
          </div>
        )}
      </div>

      {/* Trust info */}
      {listing.farmer && (
        <div className="mt-3 flex items-center gap-1.5 border-t border-stone-100 pt-3 text-[10px] text-stone-400">
          <Shield size={11} className="text-farm-500" />
          <span className="truncate font-mono text-[10px]">{listing.farmer.slice(0, 4)}...{listing.farmer.slice(-4)}</span>
        </div>
      )}

      {/* Buy button */}
      {listing.buyable ? (
        <button
          onClick={onBuy}
          className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-farm-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-farm-800 active:scale-[0.98]"
        >
          <ShoppingBag size={15} />
          Buy Now
        </button>
      ) : (
        <div className="mt-3 rounded-xl bg-stone-100 px-4 py-2.5 text-center text-xs font-medium text-stone-400">
          Awaiting satellite verification
        </div>
      )}
    </div>
  );
}

export default function MarketplaceClient({ listings }: { listings: LiveListing[] }) {
  const { address } = useWallet();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    cropType: "", region: "", status: "", ndviMin: null, ndviMax: null,
  });
  const [checkoutListing, setCheckoutListing] = useState<LiveListing | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      const label = (l.parcelName ?? l.cropType ?? "").toLowerCase();
      const region = (l.region ?? "").toLowerCase();
      const crop = (l.cropType ?? "").toLowerCase();
      const q = searchQuery.toLowerCase();
      if (q && !label.includes(q) && !region.includes(q) && !crop.includes(q)) return false;
      if (filters.cropType && crop !== filters.cropType) return false;
      if (filters.region && region !== filters.region) return false;
      if (filters.status === "buyable" && !l.buyable) return false;
      if (filters.status === "pending" && l.buyable) return false;
      if (filters.ndviMin !== null && (l.ndviBps ?? 0) < filters.ndviMin) return false;
      if (filters.ndviMax !== null && (l.ndviBps ?? 0) > filters.ndviMax) return false;
      return true;
    });
  }, [listings, searchQuery, filters]);

  const buyable = listings.filter((l) => l.buyable);
  const avgNdvi = listings.length > 0
    ? listings.reduce((s, l) => s + (l.ndviBps ?? 0), 0) / listings.length / 100
    : 0;
  const totalVolume = listings
    .filter((l) => l.priceUsdc !== null)
    .reduce((s, l) => s + parseFloat(l.priceUsdc ?? "0"), 0);
  const regions = [...new Set(listings.map((l) => l.region).filter(Boolean))];

  async function handleConfirm() {
    if (!address || !checkoutListing) return;
    setConfirming(true);
    setBuyError(null);
    try {
      const { signedTxXdr } = await buyCropNft({
        buyer: address,
        nftId: checkoutListing.nftId,
      });
      await submitSignedXdr(signedTxXdr);
      setCheckoutListing(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Purchase failed";
      setBuyError(msg);
      console.error("Purchase failed:", e);
    } finally {
      setConfirming(false);
    }
  }

  if (checkoutListing) {
    return (
      <div className="flex min-h-screen flex-col bg-stone-50">
        <div className="mx-auto w-full max-w-lg flex-1 px-4 py-10 sm:px-6">
          {buyError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {buyError}
            </div>
          )}
          <CheckOutComponent
            listing={checkoutListing}
            onConfirm={handleConfirm}
            onCancel={() => { setCheckoutListing(null); setBuyError(null); }}
            confirming={confirming}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-stone-900">
            Marketplace
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Satellite-verified crop parcels ready for purchase
          </p>
        </div>
        <Link href="/explore" className="btn-primary">
          <Plus size={18} /> List Your Crop
        </Link>
      </div>

      {/* Stats bar */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Sprout, label: "Active Listings", value: listings.length, color: "bg-farm-50 text-farm-700" },
          { icon: TrendingUp, label: "Avg NDVI", value: `${avgNdvi.toFixed(0)}%`, color: "bg-farm-50 text-farm-700" },
          { icon: DollarSign, label: "Total Volume", value: `${totalVolume.toFixed(0)} USDC`, color: "bg-harvest-50 text-harvest-700" },
          { icon: Users, label: "Regions Covered", value: regions.length, color: "bg-soil-50 text-soil-700" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card-farm flex items-center gap-3 px-4 py-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color}`}>
              <Icon size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold tabular-nums text-stone-900 leading-none">{value}</p>
              <p className="mt-0.5 text-[10px] text-stone-400 uppercase">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <SearchBar
          placeholder="Search by crop, region, or parcel name..."
          onSearch={setSearchQuery}
          debounceMs={250}
        />
        <Filter activeFilters={filters} onFilterChange={setFilters} variant="compact" />
      </div>

      {/* Lifecycle flow */}
      <div className="mb-6 overflow-x-auto rounded-2xl border border-farm-100/60 bg-farm-50/30 p-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-stone-500">
          Crop NFT Lifecycle
        </p>
        <NFTLifecycleFlow current="listed" compact />
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="card-farm flex flex-col items-center justify-center py-20">
          <Search size={40} className="mb-3 text-stone-200" />
          <p className="text-sm font-semibold text-stone-400">
            {listings.length === 0 ? "No listings yet" : "No results match your search"}
          </p>
          <p className="mt-1 text-xs text-stone-300">
            {listings.length === 0
              ? "Be the first to list a crop parcel"
              : "Try a different search term or adjust your filters"}
          </p>
          {listings.length === 0 && (
            <Link href="/explore" className="btn-primary mt-4">
              <Plus size={16} /> List Your First Crop
            </Link>
          )}
        </div>
      ) : (
        <>
          <p className="mb-3 text-xs text-stone-400">
            {filtered.length} parcel{filtered.length === 1 ? "" : "s"} found
            {searchQuery && <> for &quot;{searchQuery}&quot;</>}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((listing) => (
              <ListingCard
                key={listing.nftId}
                listing={listing}
                onBuy={() => setCheckoutListing(listing)}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}