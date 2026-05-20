"use client";

import { useState } from "react";
import NavigationBar from "@/components/NavigationBar";
import { MapPin, Clock, Leaf, ExternalLink } from "lucide-react";
import { truncate } from "@/lib/utils/truncate";
import { useEffect } from "react";
import type { LiveListing } from "@/lib/stellar/live-data";

const TABS = [
  { key: "all", label: "All Orders" },
  { key: "escrow", label: "In Escrow" },
  { key: "completed", label: "Completed" },
];

export default function OrderPage() {
  const [listings, setListings] = useState<LiveListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/stellar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "get_listings" }),
        });
        const data = await res.json();
        if (data.ok) setListings(data.listings ?? []);
      } catch {} finally { setLoading(false); }
    }
    load();
  }, []);

  const filtered = listings.filter((l) => {
    if (activeTab === "escrow") return !l.buyable;
    if (activeTab === "completed") return l.buyable;
    return true;
  });

  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <NavigationBar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="font-display text-2xl font-bold tracking-tight text-stone-900">My Orders</h1>
        <p className="mt-1 text-sm text-stone-500">Track your crop purchases and settlements</p>

        {/* Tabs */}
        <div className="mt-6 flex gap-1 rounded-xl border border-stone-200 bg-stone-100 p-1 w-fit">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                activeTab === t.key
                  ? "bg-white text-farm-800 shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Listings */}
        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-farm-300 border-t-farm-700" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="card-farm flex flex-col items-center py-16">
              <Leaf size={36} className="mb-3 text-stone-300" />
              <p className="text-sm font-medium text-stone-400">No orders found</p>
              <p className="mt-1 text-xs text-stone-300">Visit the marketplace to make your first purchase</p>
            </div>
          ) : (
            filtered.map((l) => {
              const label = l.parcelName ?? l.cropType ?? `Parcel #${l.nftId}`;
              const ndviPct = l.ndviBps !== null ? `${(l.ndviBps / 100).toFixed(0)}%` : null;
              const isExpanded = expandedId === l.nftId;

              return (
                <div
                  key={l.nftId}
                  className={`card-farm card-hover overflow-hidden ${isExpanded ? "border-farm-300" : ""}`}
                >
                  {/* Main row - always visible */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : l.nftId)}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-farm-100 text-farm-700">
                      <Leaf size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-stone-800">{label}</p>
                      <p className="flex items-center gap-1 text-xs text-stone-400">
                        <MapPin size={10} />
                        {l.region ?? "Unknown"}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-right text-sm">
                      <div>
                        <p className="text-[10px] uppercase text-stone-400">Amount</p>
                        <p className="font-semibold text-stone-800">
                          {l.priceUsdc ? `${l.priceUsdc} USDC` : "—"}
                        </p>
                      </div>
                      {ndviPct && (
                        <div>
                          <p className="text-[10px] uppercase text-stone-400">NDVI</p>
                          <p className="font-semibold text-farm-700">{ndviPct}</p>
                        </div>
                      )}
                      <span className={l.buyable ? "badge-buyable" : "badge-pending"}>
                        {l.buyable ? "Settled" : "Escrow"}
                      </span>
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-stone-100 bg-stone-50/50 px-5 py-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-stone-400">Crop</span>
                            <span className="font-medium capitalize">{l.cropType ?? "—"}</span>
                          </div>
                          {l.quantityKg !== null && (
                            <div className="flex justify-between">
                              <span className="text-stone-400">Quantity</span>
                              <span className="font-medium">{l.quantityKg.toLocaleString()} kg</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-stone-400">Seller</span>
                            <span className="font-mono text-xs text-stone-600">
                              {l.farmer ? truncate(l.farmer, 14) : "—"}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-stone-400">Payment Split</span>
                            <span className="font-medium text-stone-800">70/20/10</span>
                          </div>
                          {l.parcelAreaHectares !== null && (
                            <div className="flex justify-between">
                              <span className="text-stone-400">Area</span>
                              <span className="font-medium">{l.parcelAreaHectares.toFixed(2)} ha</span>
                            </div>
                          )}
                          {l.observedAt && (
                            <div className="flex justify-between">
                              <span className="text-stone-400">Verified</span>
                              <span className="flex items-center gap-1 text-xs text-farm-700">
                                <Clock size={11} />
                                {new Date(l.observedAt * 1000).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex gap-3 text-xs">
                        <a href={`/explore`} className="font-medium text-farm-700 hover:underline">
                          View on Map
                        </a>
                        {l.parcelBboxHash && (
                          <a
                            href={`https://stellar.expert/explorer/testnet/tx/${l.parcelBboxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 font-medium text-farm-700 hover:underline"
                          >
                            <ExternalLink size={11} /> View on Explorer
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}