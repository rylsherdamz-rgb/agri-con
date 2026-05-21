"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@/components/stellar/wallet-context";
import NavigationBar from "@/components/NavigationBar";
import Link from "next/link";
import {
  MapPin,
  Plus,
  Leaf,
  DollarSign,
  Scale,
  CheckCircle,
  XCircle,
  ChevronRight,
  Sprout,
  List,
} from "lucide-react";
import type { LiveListing } from "@/lib/stellar/live-data";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "https://agri-con-backend.onrender.com";

function ListingCard({ listing }: { listing: LiveListing }) {
  const label = listing.parcelName ?? listing.cropType ?? `Parcel #${listing.nftId}`;
  const ndviLabel = listing.ndviBps !== null ? `${(listing.ndviBps / 100).toFixed(0)}%` : null;
  const ndviPct = listing.ndviBps !== null ? listing.ndviBps / 100 : 0;

  return (
    <Link
      href={`/order?nftId=${listing.nftId}`}
      className="group card-farm card-hover flex flex-col p-5"
    >
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

export default function MyListingsPage() {
  const { address, connect } = useWallet();
  const [listings, setListings] = useState<LiveListing[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) return;
    const ctrl = new AbortController();

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(
          `${BACKEND_URL}/api/listings?farmerId=${encodeURIComponent(address)}`,
          { signal: ctrl.signal },
        );
        const data = await res.json();
        if (!ctrl.signal.aborted && data.ok && Array.isArray(data.listings)) {
          const mapped: LiveListing[] = data.listings.map((l: Record<string, unknown>) => ({
            nftId: l.nftId as number ?? (l.nft_id as number),
            cropType: (l.cropType ?? l.crop_type ?? null) as string | null,
            quantityKg: (l.quantityKg ?? l.quantity_kg ?? null) as number | null,
            priceUsdc: l.priceUsdc != null ? String(l.priceUsdc) : (l.price_usdc != null ? String(l.price_usdc) : null),
            farmer: (l.farmerId ?? l.farmer_id ?? address) as string,
            harvestDate: null,
            cropStatus: null,
            buyable: Boolean(l.buyable),
            observedAt: null,
            ndviBps: (l.ndviBps ?? l.ndvi_bps ?? null) as number | null,
            minNdviBps: (l.minNdviBps ?? l.min_ndvi_bps ?? null) as number | null,
            source: null,
            parcelName: (l.parcelName ?? l.parcel_name ?? null) as string | null,
            parcelBboxHash: null,
            parcelAreaHectares: (l.areaHa ?? l.area_ha ?? null) as number | null,
            region: (l.region ?? null) as string | null,
            observationWindowDays: null,
          }));
          setListings(mapped);
          return;
        }
      } catch {
        // Backend unavailable — fallback to stellar RPC
      }

      try {
        const { getLiveListings } = await import("@/lib/stellar/live-data");
        const all = await getLiveListings();
        if (!ctrl.signal.aborted) {
          setListings(all.filter((l) => l.farmer === address));
        }
      } catch {
        if (!ctrl.signal.aborted) setListings([]);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => ctrl.abort();
  }, [address]);

  if (!address) {
    return (
      <div className="flex min-h-screen flex-col bg-stone-50">
        <NavigationBar />
        <main className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center px-4">
          <div className="card-farm flex flex-col items-center py-16 px-8 text-center">
            <List size={36} className="mb-3 text-stone-300" />
            <p className="text-sm font-medium text-stone-600">Connect your wallet to view your listings</p>
            <button onClick={connect} className="btn-primary mt-4">
              Connect Wallet
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <NavigationBar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-stone-900">
              My Listings
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              Manage your crop NFTs and track their status
            </p>
          </div>
          <Link href="/explore" className="btn-primary">
            <Plus size={18} /> List New Crop
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-farm-300 border-t-farm-700" />
          </div>
        ) : listings.length === 0 ? (
          <div className="card-farm flex flex-col items-center py-16">
            <Sprout size={36} className="mb-3 text-stone-300" />
            <p className="text-sm font-medium text-stone-400">No listings yet</p>
            <p className="mt-1 text-xs text-stone-300">
              List your first crop parcel to start selling
            </p>
            <Link href="/explore" className="btn-primary mt-4">
              <Plus size={18} /> List Your First Crop
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-3 text-xs text-stone-400">
              {listings.length} listing{listings.length === 1 ? "" : "s"}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <ListingCard key={listing.nftId} listing={listing} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}