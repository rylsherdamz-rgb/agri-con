"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { MapPin, Plus, Leaf, DollarSign, Scale, CheckCircle, XCircle, ChevronRight, Search } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import Filter, { type FilterState } from "@/components/Filter";
import NFTLifecycleFlow from "@/components/NFTLifecycleFlow";
import type { LiveListing } from "@/lib/stellar/live-data";

function ListingCard({ listing }: { listing: LiveListing }) {
  const label = listing.parcelName ?? listing.cropType ?? `Parcel #${listing.nftId}`;
  const ndviLabel = listing.ndviBps !== null ? `${(listing.ndviBps / 100).toFixed(0)}%` : null;
  const ndviPct = listing.ndviBps !== null ? listing.ndviBps / 100 : 0;

  return (
    <Link
      href={`/order?nftId=${listing.nftId}`}
      className="group card-farm card-hover flex flex-col p-5"
    >
      {/* NDVI gauge bar */}
      {ndviLabel && (
        <div className="-mx-5 -mt-5 mb-3 h-1.5 w-[calc(100%+2.5rem)] overflow-hidden rounded-t-2xl bg-stone-100">
          <div
            className="h-full rounded-t-2xl bg-farm-500 transition-all"
            style={{ width: `${Math.min(ndviPct, 100)}%` }}
          />
        </div>
      )}

      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="text-base font-semibold text-stone-900">{label}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-400">
            <MapPin size={11} />
            {listing.region ?? "Unknown"}
          </p>
        </div>
        <span className={listing.buyable ? "badge-buyable" : "badge-pending"}>
          {listing.buyable ? (
            <><CheckCircle size={12} /> Buyable</>
          ) : (
            <><XCircle size={12} /> Pending</>
          )}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        {listing.cropType && (
          <div className="flex items-center gap-1.5 text-stone-600">
            <Leaf size={14} className="text-farm-700" />
            <span className="capitalize">{listing.cropType}</span>
          </div>
        )}
        {listing.priceUsdc && (
          <div className="flex items-center gap-1.5 text-stone-600">
            <DollarSign size={14} className="text-farm-700" />
            <span className="font-semibold">{listing.priceUsdc} USDC</span>
          </div>
        )}
        {listing.quantityKg !== null && (
          <div className="flex items-center gap-1.5 text-stone-600">
            <Scale size={14} className="text-farm-700" />
            <span>{listing.quantityKg.toLocaleString()} kg</span>
          </div>
        )}
        {ndviLabel && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-stone-400">NDVI</span>
            <span className="font-semibold text-farm-700">{ndviLabel}</span>
          </div>
        )}
      </div>

      {listing.parcelAreaHectares !== null && (
        <div className="mt-3 border-t border-stone-100 pt-3 text-xs text-stone-400">
          {listing.parcelAreaHectares.toFixed(2)} ha
          {listing.minNdviBps !== null && (
            <> &middot; min NDVI {(listing.minNdviBps / 100).toFixed(0)}%</>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-end gap-1 text-xs font-medium text-farm-700 opacity-0 transition group-hover:opacity-100">
        View Details <ChevronRight size={14} />
      </div>
    </Link>
  );
}

export default function MarketplaceClient({ listings }: { listings: LiveListing[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    cropType: "", region: "", status: "", ndviMin: null, ndviMax: null,
  });

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

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-stone-900">
            Marketplace
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Browse verified crop parcels ready for purchase
          </p>
        </div>
        <Link href="/explore" className="btn-primary">
          <Plus size={18} /> List Your Crop
        </Link>
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

      {/* Lifecycle flow — shows the whole journey */}
      <div className="mb-6 overflow-x-auto rounded-2xl border border-farm-100/60 bg-farm-50/30 p-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-stone-500">
          Crop NFT Lifecycle
        </p>
        <NFTLifecycleFlow current="listed" compact />
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="card-farm flex flex-col items-center justify-center py-16">
          <Search size={36} className="mb-3 text-stone-300" />
          <p className="text-sm font-medium text-stone-400">
            {listings.length === 0 ? "No listings yet" : "No results match your search"}
          </p>
          <p className="mt-1 text-xs text-stone-300">
            {listings.length === 0 ? "List your first crop to appear here" : "Try a different search term"}
          </p>
        </div>
      ) : (
        <>
          <p className="mb-3 text-xs text-stone-400">
            {filtered.length} parcel{filtered.length === 1 ? "" : "s"} found
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((listing) => (
              <ListingCard key={listing.nftId} listing={listing} />
            ))}
          </div>
        </>
      )}
    </>
  );
}