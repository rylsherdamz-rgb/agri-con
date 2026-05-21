"use client";

import { useState, useCallback } from "react";
import {
  MapPin,
  Crosshair,
  Leaf,
  Satellite,
  ChevronRight,
  X,
  Square,
  Edit,
  Bookmark,
  Target,
  Trash2,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
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

function centerOf(coords: { lat: number; lng: number }[]) {
  if (coords.length === 0) return { lat: 0, lng: 0 };
  const lat = coords.reduce((s, c) => s + c.lat, 0) / coords.length;
  const lng = coords.reduce((s, c) => s + c.lng, 0) / coords.length;
  return { lat: round(lat), lng: round(lng) };
}

function bboxFromCoords(coords: { lat: number; lng: number }[]) {
  if (coords.length < 3) return { west: 0, south: 0, east: 0, north: 0 };
  const lats = coords.map((c) => c.lat);
  const lngs = coords.map((c) => c.lng);
  return {
    north: round(Math.max(...lats)),
    south: round(Math.min(...lats)),
    east: round(Math.max(...lngs)),
    west: round(Math.min(...lngs)),
  };
}

type BookmarkEntry = {
  id: string;
  label: string;
  coords: { lat: number; lng: number }[];
  center: { lat: number; lng: number };
  bbox: { west: number; south: number; east: number; north: number };
  createdAt: number;
};

export default function ExploreWorkspace({ parcels }: { parcels: Parcel[] }) {
  const [selected, setSelected] = useState<Parcel | null>(null);
  const [bbox, setBbox] = useState({ west: 0, south: 0, east: 0, north: 0 });
  const [drawMode, setDrawMode] = useState<"rect" | "polygon" | "none">("rect");
  const [polygonCoords, setPolygonCoords] = useState<{ lat: number; lng: number }[]>([]);
  const [polygonCenter, setPolygonCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [draftLabel, setDraftLabel] = useState("");
  const [bookmarks, setBookmarks] = useState<BookmarkEntry[]>([]);

  const clearPolygon = useCallback(() => {
    setPolygonCoords([]);
    setPolygonCenter(null);
    setBbox({ west: 0, south: 0, east: 0, north: 0 });
    setDrawMode("rect");
    setDraftLabel("");
  }, []);

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
    setDrawMode("none");
    setPolygonCoords([]);
    setPolygonCenter(null);
    setDraftLabel("");
  };

  const handleClearSelection = () => {
    setSelected(null);
    setDrawMode("rect");
    setPolygonCoords([]);
    setPolygonCenter(null);
    setBbox({ west: 0, south: 0, east: 0, north: 0 });
    setDraftLabel("");
  };

  const handleToggleDraw = () => {
    if (drawMode === "polygon") {
      setDrawMode("rect");
      return;
    }
    setDrawMode("polygon");
    setPolygonCoords([]);
    setPolygonCenter(null);
    setSelected(null);
  };

  const handlePolygonComplete = (coords: { lat: number; lng: number }[]) => {
    setPolygonCoords(coords);
    if (coords.length < 3) return;
    setDrawMode("none");
    const center = centerOf(coords);
    setPolygonCenter(center);
    setBbox(bboxFromCoords(coords));
  };

  const handleBookmark = () => {
    if (polygonCoords.length < 3 || !polygonCenter) return;
    const label = draftLabel.trim() || `Area #${bookmarks.length + 1}`;
    setBookmarks((prev) => [
      {
        id: String(Date.now()),
        label,
        coords: polygonCoords,
        center: polygonCenter,
        bbox,
        createdAt: Date.now(),
      },
      ...prev,
    ]);
    clearPolygon();
    setDraftLabel("");
  };

  const handleDeleteBookmark = (id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleRestoreBookmark = (entry: BookmarkEntry) => {
    setSelected(null);
    setPolygonCoords(entry.coords);
    setPolygonCenter(entry.center);
    setBbox(entry.bbox);
    setDrawMode("none");
  };

  const hasPolygon = polygonCoords.length >= 3;
  const hasActiveSelection = selected !== null || hasPolygon;
  const displayBbox = hasActiveSelection
    ? bbox
    : selected
      ? bbox
      : { west: 0, south: 0, east: 0, north: 0 };

  const activeNftId = selected?.id ?? (hasPolygon ? 0 : null);

  return (
    <div className="grid h-[calc(100vh-8rem)] gap-4 lg:grid-cols-[1fr_380px]">
      {/* Left: Map + draw toggle */}
      <div className="relative overflow-hidden rounded-2xl border border-farm-200/60 bg-stone-100">
        <ParcelMap
          markers={parcels}
          activeMarkerId={selected?.id}
          onSelectMarker={handleSelect}
          onBoundsChange={(b) =>
            setBbox({ west: round(b.west), south: round(b.south), east: round(b.east), north: round(b.north) })
          }
          drawMode={drawMode}
          onPolygonComplete={handlePolygonComplete}
          polygonCoords={hasPolygon ? polygonCoords : []}
          polygonCenter={polygonCenter}
        />
        {/* Map overlay controls */}
        <div className="absolute right-3 top-3 z-10 flex flex-col gap-1">
          <button
            onClick={handleToggleDraw}
            disabled={drawMode === "none" && !!selected}
            className={`rounded-xl px-3 py-2 text-xs font-semibold shadow backdrop-blur transition ${
              drawMode === "polygon"
                ? "bg-emerald-800 text-emerald-100"
                : "bg-white/90 text-stone-700 hover:bg-stone-100"
            }`}
            title={drawMode === "polygon" ? "Back to rectangle" : "Draw custom area"}
          >
            {drawMode === "polygon" ? (
              <><Square size={14} className="inline mr-1" /> Exit Draw</>
            ) : (
              <><Edit size={14} className="inline mr-1" /> Draw Area</>
            )}
          </button>
          {hasPolygon && (
            <button
              onClick={clearPolygon}
              className="rounded-xl bg-white/90 px-3 py-2 text-xs font-semibold text-stone-700 shadow backdrop-blur hover:bg-red-50 hover:text-red-600 transition"
            >
              <Trash2 size={14} className="inline mr-1" /> Clear Polygon
            </button>
          )}
          {selected && (
            <button
              onClick={handleClearSelection}
              className="rounded-xl bg-white/90 px-3 py-2 text-xs font-semibold text-stone-700 shadow backdrop-blur hover:bg-stone-100 transition"
            >
              <X size={14} className="inline mr-1" /> Deselect
            </button>
          )}
        </div>
        {/* Drawing instruction */}
        {drawMode === "polygon" && (
          <div className="absolute bottom-3 left-3 rounded-lg bg-emerald-900/85 px-3 py-2 text-xs font-medium text-emerald-100 shadow-lg">
            Click to place polygon vertices. First click on starting point to close.
          </div>
        )}
      </div>

      {/* Right panel — redesigned */}
      <div className="flex flex-col gap-4 overflow-hidden">
        {/* === SELECTION CARD === */}
        {hasActiveSelection ? (
          <div className="card-farm overflow-hidden">
            <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                <Target size={12} className="inline mr-1.5" />
                {selected ? "Selected Parcel" : "Drawn Area"}
              </h3>
              <button
                onClick={selected ? handleClearSelection : clearPolygon}
                className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
              >
                <X size={14} />
              </button>
            </div>

            <div className="p-4">
              {selected ? (
                <>
                  <p className="text-base font-bold text-stone-800">{selected.title}</p>
                  <p className="mt-0.5 text-xs text-stone-400">
                    {selected.region ?? "Unknown region"}
                    {selected.ndviBps !== null && <> &middot; NDVI {(selected.ndviBps / 100).toFixed(0)}%</>}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-stone-500">
                    {selected.lat.toFixed(4)}N, {selected.lng.toFixed(4)}E
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <Edit size={18} />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={draftLabel}
                        onChange={(e) => setDraftLabel(e.target.value)}
                        placeholder="Name this area..."
                        className="w-full rounded-lg border border-stone-200 px-2.5 py-1.5 text-sm font-semibold text-stone-800 outline-none focus:border-emerald-400"
                      />
                      <p className="mt-0.5 text-[11px] text-stone-400">
                        {polygonCoords.length} vertices &middot; center ({polygonCenter?.lat.toFixed(4)}, {polygonCenter?.lng.toFixed(4)})
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={handleBookmark}
                      disabled={!hasPolygon}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                    >
                      <Bookmark size={13} /> Bookmark
                    </button>
                    <button
                      onClick={clearPolygon}
                      className="flex items-center justify-center gap-1.5 rounded-lg bg-stone-50 px-3 py-2 text-xs font-medium text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition"
                    >
                      <Trash2 size={13} /> Discard
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="card-farm flex flex-col items-center justify-center p-5 text-center">
            <Target size={24} className="mb-2 text-stone-300" />
            <p className="text-xs font-medium text-stone-400">Select a parcel or draw a polygon</p>
            <p className="mt-0.5 text-[11px] text-stone-300">to run satellite verification</p>
          </div>
        )}

        {/* === SATELLITE VERIFICATION PANEL === */}
        {activeNftId !== null && displayBbox.west !== 0 && (
          <div className="card-farm flex-1 overflow-y-auto p-4">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-stone-600">
              <Satellite size={13} className="inline mr-1.5" />
              Satellite Verification
            </h3>
            <div className="mb-3 rounded-lg bg-stone-50 p-3 text-xs text-stone-500">
              <div className="flex justify-between">
                <span>North</span>
                <span className="font-mono">{displayBbox.north.toFixed(5)}</span>
              </div>
              <div className="flex justify-between mt-0.5">
                <span>South</span>
                <span className="font-mono">{displayBbox.south.toFixed(5)}</span>
              </div>
              <div className="flex justify-between mt-0.5">
                <span>East</span>
                <span className="font-mono">{displayBbox.east.toFixed(5)}</span>
              </div>
              <div className="flex justify-between mt-0.5">
                <span>West</span>
                <span className="font-mono">{displayBbox.west.toFixed(5)}</span>
              </div>
              {hasPolygon && (
                <div className="mt-2 border-t border-stone-200 pt-2 text-emerald-600">
                  {polygonCoords.length} vertex polygon — custom area
                </div>
              )}
            </div>
            <SatelliteVerificationPanel
              nftId={selected?.id ?? 0}
              bbox={displayBbox}
              minNdviBps={3500}
              temporalExtent={selected?.temporalExtent}
              sampleGridSize={20}
            />
          </div>
        )}

        {/* === BOOKMARKS === */}
        {bookmarks.length > 0 && (
          <div className="card-farm overflow-y-auto p-4">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-stone-600">
              <Bookmark size={12} className="inline mr-1.5" />
              Saved Areas
            </h3>
            <div className="space-y-1.5">
              {bookmarks.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-lg border border-stone-100 px-3 py-2 text-left transition hover:border-farm-200"
                >
                  <button
                    onClick={() => handleRestoreBookmark(b)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-sm font-medium text-stone-700">{b.label}</p>
                    <p className="text-[10px] text-stone-400">
                      {b.coords.length} pts &middot; {b.center.lat.toFixed(4)}, {b.center.lng.toFixed(4)}
                    </p>
                  </button>
                  <button
                    onClick={() => handleDeleteBookmark(b.id)}
                    className="ml-2 shrink-0 rounded p-1 text-stone-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === PARCELS LIST === */}
        <div className="card-farm flex-1 overflow-y-auto p-4">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-stone-600">
            <Leaf size={12} className="inline mr-1.5" />
            Registered Parcels
          </h3>
          {parcels.length === 0 ? (
            <div className="flex flex-col items-center py-8">
              <MapPin size={24} className="mb-2 text-stone-300" />
              <p className="text-xs text-stone-400">No parcels available</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {parcels.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelect(p.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                    selected?.id === p.id
                      ? "border-farm-400 bg-farm-50 shadow-sm"
                      : "border-stone-100 hover:border-farm-200 hover:bg-farm-50/30"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      selected?.id === p.id
                        ? "bg-farm-200 text-farm-800"
                        : "bg-farm-50 text-farm-600"
                    }`}
                  >
                    <Leaf size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-stone-800">{p.title}</p>
                    <p className="text-[11px] text-stone-400">
                      {p.region ?? "Unknown"}
                      {p.ndviBps !== null && <> &middot; NDVI {(p.ndviBps / 100).toFixed(0)}%</>}
                    </p>
                  </div>
                  {p.buyable && (
                    <span className="shrink-0 badge-buyable">
                      <CheckCircle size={10} /> Ready
                    </span>
                  )}
                  <ChevronRight size={14} className="shrink-0 text-stone-300" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
