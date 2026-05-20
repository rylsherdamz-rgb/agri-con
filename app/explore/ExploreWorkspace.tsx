"use client";

import { useState } from "react";
import { MapPin, Crosshair, Leaf, Satellite, ChevronRight, X } from "lucide-react";
import ParcelMap from "@/components/ParcelMap";
import SatelliteVerificationPanel from "@/components/SatelliteVerificationPanel";

type Parcel = {
  id: number;
  title: string;
  lat: number;
  lng: number;
  temporalExtent: { start: string; end: string };
  region?: string | null;
  ndviBps?: number | null;
  buyable?: boolean;
};

function round(v: number) {
  return Number(v.toFixed(6));
}

export default function ExploreWorkspace({ parcels }: { parcels: Parcel[] }) {
  const [selected, setSelected] = useState<Parcel | null>(null);
  const [bbox, setBbox] = useState({ west: 0, south: 0, east: 0, north: 0 });

  const handleSelect = (id: number) => {
    const match = parcels.find((p) => p.id === id);
    if (!match) return;
    setSelected(match);
    setBbox({
      west: round(match.lng - 0.05),
      south: round(match.lat - 0.05),
      east: round(match.lng + 0.05),
      north: round(match.lat + 0.05),
    });
  };

  return (
    <div className="grid h-[calc(100vh-8rem)] gap-4 lg:grid-cols-[1fr_380px]">
      {/* Left: Full-height map */}
      <div className="relative overflow-hidden rounded-2xl border border-farm-200/60 bg-stone-100">
        <ParcelMap
          markers={parcels}
          activeMarkerId={selected?.id}
          onSelectMarker={handleSelect}
          onBoundsChange={(b) =>
            setBbox({ west: round(b.west), south: round(b.south), east: round(b.east), north: round(b.north) })
          }
        />
      </div>

      {/* Right: Side panel */}
      <div className="flex flex-col gap-4 overflow-hidden">
        {/* Parcel List */}
        <div className="card-farm flex-1 overflow-y-auto p-4">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-stone-600">
            <MapPin size={14} className="inline mr-1.5" />
            Parcels
          </h2>
          {parcels.length === 0 ? (
            <div className="flex flex-col items-center py-10">
              <Leaf size={28} className="mb-2 text-stone-300" />
              <p className="text-sm text-stone-400">No parcels to explore</p>
            </div>
          ) : (
            <div className="space-y-2">
              {parcels.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelect(p.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                    selected?.id === p.id
                      ? "border-farm-400 bg-farm-50"
                      : "border-stone-100 hover:border-farm-300 hover:bg-farm-50/50"
                  }`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-farm-100 text-farm-700">
                    <Leaf size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-stone-800">{p.title}</p>
                    <p className="text-xs text-stone-400">
                      {p.region ?? "Unknown"}
                      {p.ndviBps !== null && <> &middot; NDVI {(p.ndviBps / 100).toFixed(0)}%</>}
                    </p>
                  </div>
                  <ChevronRight size={14} className="shrink-0 text-stone-300" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Verification Panel (shows when parcel selected) */}
        {selected ? (
          <div className="card-farm p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-800">{selected.title}</h3>
              <button
                onClick={() => setSelected(null)}
                className="rounded-lg p-1 text-stone-400 hover:bg-stone-100"
              >
                <X size={16} />
              </button>
            </div>
            <div className="text-xs text-stone-500 mb-3">
              <Crosshair size={12} className="inline mr-1" />
              Bbox: {bbox.west.toFixed(4)}W, {bbox.south.toFixed(4)}S, {bbox.east.toFixed(4)}E, {bbox.north.toFixed(4)}N
            </div>
            <SatelliteVerificationPanel
              nftId={selected.id}
              bbox={bbox}
              minNdviBps={3500}
              temporalExtent={selected.temporalExtent}
              sampleGridSize={20}
            />
          </div>
        ) : (
          <div className="card-farm flex flex-col items-center justify-center p-6 text-center">
            <Satellite size={24} className="mb-2 text-stone-300" />
            <p className="text-xs text-stone-400">Select a parcel from the list above to verify with satellite data</p>
          </div>
        )}
      </div>
    </div>
  );
}