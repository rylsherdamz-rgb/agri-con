"use client";

import { useState, useEffect } from "react";
import NavigationBar from "@/components/NavigationBar";
import NFTLifecycleFlow from "@/components/NFTLifecycleFlow";
import CheckOutComponent from "@/components/CheckOutComponent";
import { MapPin, Leaf, ChevronDown, ChevronUp, Sprout, ShoppingBag, Clock, Shield } from "lucide-react";
import { truncate } from "@/lib/utils/truncate";
import type { LiveListing } from "@/lib/stellar/live-data";

const TABS = [
  { key: "all", label: "All Orders" },
  { key: "escrow", label: "In Escrow" },
  { key: "completed", label: "Settled" },
];

export default function OrderPage() {
  const [listings, setListings] = useState<LiveListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [checkoutListing, setCheckoutListing] = useState<LiveListing | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/stellar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "get_all_listings" }),
        });
        const data = await res.json();
        if (!cancelled && data.ok && Array.isArray(data.listings)) {
          setListings(data.listings);
          return;
        }
      } catch {}

      try {
        const { getLiveListings } = await import("@/lib/stellar/live-data");
        const live = await getLiveListings();
        if (!cancelled) setListings(live);
      } catch {} finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Check URL for nftId param (linked from marketplace cards)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nftId = params.get("nftId");
    if (nftId && listings.length > 0) {
      const match = listings.find((l) => l.nftId === parseInt(nftId, 10));
      if (match) {
        setExpandedId(match.nftId);
        setCheckoutListing(match);
        return;
      }
    }
    // Only try this once listings load
  }, [listings]);

  const filtered = listings.filter((l) => {
    if (activeTab === "escrow") return !l.buyable;
    if (activeTab === "completed") return l.buyable;
    return true;
  });

  const escrowCount = listings.filter((l) => !l.buyable).length;
  const settledCount = listings.filter((l) => l.buyable).length;

  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <NavigationBar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-stone-900">My Orders</h1>
            <p className="mt-1 text-sm text-stone-500">Track your crop purchases and settlements</p>
          </div>
          {checkoutListing && (
            <button onClick={() => setCheckoutListing(null)} className="btn-outline text-xs">
              Back to orders
            </button>
          )}
        </div>

        {/* Checkout mode */}
        {checkoutListing ? (
          <div className="mt-6 max-w-lg mx-auto">
            <CheckOutComponent
              listing={checkoutListing}
              onCancel={() => setCheckoutListing(null)}
            />
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="mt-6 flex gap-1 rounded-xl border border-stone-200 bg-stone-100 p-1 w-fit">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                    activeTab === t.key ? "bg-white text-farm-800 shadow-sm" : "text-stone-500 hover:text-stone-700"
                  }`}
                >
                  {t.label}
                  {t.key === "escrow" && escrowCount > 0 && (
                    <span className="ml-1.5 rounded-full bg-harvest-100 px-1.5 text-[10px] font-bold text-harvest-700">{escrowCount}</span>
                  )}
                  {t.key === "completed" && settledCount > 0 && (
                    <span className="ml-1.5 rounded-full bg-farm-100 px-1.5 text-[10px] font-bold text-farm-700">{settledCount}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Orders list */}
            <div className="mt-4 space-y-3">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="card-farm p-5">
                      <div className="flex items-center gap-4">
                        <div className="skeleton h-10 w-10 rounded-xl" />
                        <div className="flex-1 space-y-2">
                          <div className="skeleton h-4 w-48" />
                          <div className="skeleton h-3 w-32" />
                        </div>
                        <div className="skeleton h-6 w-16 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="card-farm flex flex-col items-center py-16">
                  <Sprout size={40} className="mb-3 text-stone-200" />
                  <p className="text-sm font-semibold text-stone-400">No orders yet</p>
                  <p className="mt-1 text-xs text-stone-300">
                    {activeTab === "all"
                      ? "Visit the marketplace to make your first purchase"
                      : activeTab === "escrow" ? "No active escrow orders" : "No settled orders yet"}
                  </p>
                </div>
              ) : (
                filtered.map((l) => {
                  const label = l.parcelName ?? l.cropType ?? `Parcel #${l.nftId}`;
                  const ndviPct = l.ndviBps !== null ? `${(l.ndviBps / 100).toFixed(0)}%` : null;
                  const isExpanded = expandedId === l.nftId;

                  return (
                    <div key={l.nftId} className={`card-farm card-hover overflow-hidden ${isExpanded ? "border-farm-300 ring-1 ring-farm-200" : ""}`}>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : l.nftId)}
                        className="flex w-full items-center gap-4 px-5 py-4 text-left"
                      >
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${l.buyable ? "bg-farm-100 text-farm-700" : "bg-harvest-100 text-harvest-700"}`}>
                          {l.buyable ? <Shield size={18} /> : <Clock size={18} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-stone-800">{label}</p>
                          <p className="flex items-center gap-1 text-xs text-stone-400">
                            <MapPin size={10} /> {l.region ?? "Unknown"}
                            {ndviPct && <> &middot; NDVI {ndviPct}</>}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-right text-sm">
                          {l.priceUsdc && (
                            <span className="font-semibold tabular-nums text-stone-800">{l.priceUsdc} USDC</span>
                          )}
                          <span className={l.buyable ? "badge-buyable" : "badge-pending"}>
                            {l.buyable ? "Settled" : "Escrow"}
                          </span>
                          {isExpanded ? <ChevronUp size={16} className="text-stone-400" /> : <ChevronDown size={16} className="text-stone-400" />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-stone-100 bg-stone-50/50 px-5 py-4">
                          <NFTLifecycleFlow current={l.buyable ? "settled" : "purchased"} compact />
                          <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
                              {l.parcelAreaHectares !== null && (
                                <div className="flex justify-between">
                                  <span className="text-stone-400">Area</span>
                                  <span className="font-medium">{l.parcelAreaHectares.toFixed(2)} ha</span>
                                </div>
                              )}
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-stone-400">Payment Split</span>
                                <span className="font-medium text-stone-700">70% / 20% / 10%</span>
                              </div>
                              {l.farmer && (
                                <div className="flex justify-between">
                                  <span className="text-stone-400">Seller</span>
                                  <span className="font-mono text-[11px] text-stone-600">{truncate(l.farmer, 14)}</span>
                                </div>
                              )}
                              {l.observedAt && (
                                <div className="flex justify-between">
                                  <span className="text-stone-400">Verified</span>
                                  <span className="flex items-center gap-1 text-xs text-farm-700">
                                    <Clock size={11} /> {new Date(l.observedAt * 1000).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="mt-3 flex gap-4 text-xs">
                            <a href="/explore" className="font-medium text-farm-700 hover:underline">
                              View on Map
                            </a>
                            {!l.buyable && (
                              <button
                                onClick={() => setCheckoutListing(l)}
                                className="font-medium text-farm-700 hover:underline flex items-center gap-1"
                              >
                                <ShoppingBag size={11} /> Complete Purchase
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}