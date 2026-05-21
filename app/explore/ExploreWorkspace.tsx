"use client";

import { useState, useCallback, useMemo } from "react";
import {
  MapPin, Crosshair,
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
  MapPinned,
  Rocket,
  Sprout,
  DollarSign,
  Scale,
  User,
  Hash,
} from "lucide-react";
import ParcelMap from "@/components/ParcelMap";
import SatelliteVerificationPanel from "@/components/SatelliteVerificationPanel"; import { useWallet } from "@/components/stellar/wallet-context";
import { signPreparedXdr, submitSignedXdr } from "@/lib/stellar/agri-block";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "https://agri-con-backend.onrender.com";

const CROP_TYPES = ["rice", "corn", "wheat", "sugarcane", "soybean", "coconut", "banana", "coffee", "cacao", "mango"] as const;

type Parcel = {
  id: number;
  title: string;
  lat: number;
  lng: number;
  temporalExtent: { start: string; end: string };
  region?: string | null;
  ndviBps?: number | null;
  buyable?: boolean;
  noCoords?: boolean;
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

function simpleHash(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return "bbox-" + Math.abs(hash).toString(16).slice(0, 10);
}

function approximateHectares(coords: { lat: number; lng: number }[]) {
  if (coords.length < 3) return 0;
  const R = 6371 * 1000;
  let area = 0;
  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    const x1 = (coords[i].lng * Math.PI / 180) * R * Math.cos(coords[i].lat * Math.PI / 180);
    const y1 = (coords[i].lat * Math.PI / 180) * R;
    const x2 = (coords[j].lng * Math.PI / 180) * R * Math.cos(coords[j].lat * Math.PI / 180);
    const y2 = (coords[j].lat * Math.PI / 180) * R;
    area += x1 * y2 - x2 * y1;
  }
  return Math.round(Math.abs(area) / 2 / 10000 * 100) / 100;
}

type BookmarkEntry = {
  id: string;
  label: string;
  coords: { lat: number; lng: number }[];
  center: { lat: number; lng: number };
  bbox: { west: number; south: number; east: number; north: number };
  createdAt: number;
};

type MintStep = "draw" | "form" | "ndvi" | "minting" | "done";

export default function ExploreWorkspace({ parcels }: { parcels: Parcel[] }) {
  const { address, connect } = useWallet();
  const [selected, setSelected] = useState<Parcel | null>(null);
  const [bbox, setBbox] = useState({ west: 0, south: 0, east: 0, north: 0 });
  const [drawMode, setDrawMode] = useState<"rect" | "polygon" | "none">("rect");
  const [polygonCoords, setPolygonCoords] = useState<{ lat: number; lng: number }[]>([]);
  const [polygonCenter, setPolygonCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [draftLabel, setDraftLabel] = useState("");
  const [bookmarks, setBookmarks] = useState<BookmarkEntry[]>([]);

  // Listing form state
  const [mintStep, setMintStep] = useState<MintStep>("draw");
  const [parcelName, setParcelName] = useState("");
  const [cropType, setCropType] = useState("rice");
  const [cropTypeCustom, setCropTypeCustom] = useState("");
  const [quantityKg, setQuantityKg] = useState("");
  const [priceUsdc, setPriceUsdc] = useState("");
  const [totalYieldKg, setTotalYieldKg] = useState("");
  const [region, setRegion] = useState("");
  const [harvestDate, setHarvestDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().slice(0, 10);
  });
  const [mintError, setMintError] = useState<string | null>(null);
  const [mintTxHash, setMintTxHash] = useState<string | null>(null);
  const [mintedNftId, setMintedNftId] = useState<number | null>(null);

  // NDVI state
  const [ndviRun, setNdviRun] = useState(false);
  const [ndviBpsResult, setNdviBpsResult] = useState<number | null>(null);

  const effectiveCropType = cropType === "other" ? cropTypeCustom : cropType;

  const clearPolygon = useCallback(() => {
    setPolygonCoords([]);
    setPolygonCenter(null);
    setBbox({ west: 0, south: 0, east: 0, north: 0 });
    setDrawMode("rect");
    setDraftLabel("");
    setMintStep("draw");
    resetListingForm();
  }, []);

  const resetListingForm = () => {
    setParcelName("");
    setCropType("rice");
    setCropTypeCustom("");
    setQuantityKg("");
    setPriceUsdc("");
    setTotalYieldKg("");
    setRegion("");
    setHarvestDate(() => {
      const d = new Date();
      d.setMonth(d.getMonth() + 3);
      return d.toISOString().slice(0, 10);
    });
    setMintError(null);
    setMintTxHash(null);
    setMintedNftId(null);
    setNdviRun(false);
    setNdviBpsResult(null);
  };

  const handleSelect = (id: number) => {
    const match = parcels.find((p) => p.id === id);
    if (!match) return;
    setSelected(match);
    if (match.noCoords) {
      setBbox({ west: 0, south: 0, east: 0, north: 0 });
    } else {
      setBbox({
        west: round(match.lng - 0.05),
        south: round(match.lat - 0.05),
        east: round(match.lng + 0.05),
        north: round(match.lat + 0.05),
      });
    }
    setDrawMode("none");
    setPolygonCoords([]);
    setPolygonCenter(null);
    setDraftLabel("");
    setMintStep("draw");
    resetListingForm();
  };

  const handleClearSelection = () => {
    setSelected(null);
    setDrawMode("rect");
    setPolygonCoords([]);
    setPolygonCenter(null);
    setBbox({ west: 0, south: 0, east: 0, north: 0 });
    setDraftLabel("");
    setMintStep("draw");
    resetListingForm();
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
    setMintStep("draw");
    resetListingForm();
  };

  const handlePolygonComplete = (coords: { lat: number; lng: number }[]) => {
    setPolygonCoords(coords);
    if (coords.length < 3) return;
    setDrawMode("none");
    const center = centerOf(coords);
    setPolygonCenter(center);
    setBbox(bboxFromCoords(coords));
    if (coords.length >= 3) {
      setMintStep("form");
    }
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
    setMintStep("form");
    resetListingForm();
  };

  const handleStartListing = () => {
    resetListingForm();
    setMintStep("form");
  };

  const handleMintSubmit = async () => {
    setMintError(null);
    setMintStep("minting");

    try {
      const farmer = address ?? (await connect());
      if (!farmer) throw new Error("Connect your wallet to list a crop.");

      const qty = parseInt(quantityKg, 10);
      if (!qty || qty <= 0) throw new Error("Enter a valid quantity.");

      const yieldKg = parseInt(totalYieldKg, 10);
      if (!yieldKg || yieldKg <= 0) throw new Error("Enter a valid total yield.");

      const price = parseFloat(priceUsdc);
      if (!price || price <= 0) throw new Error("Enter a valid price.");

      const name = parcelName.trim() || draftLabel.trim() || `Parcel at ${polygonCenter?.lat.toFixed(4)}N`;
      const reg = region.trim() || "Unknown";
      const hectares = approximateHectares(polygonCoords);
      const bboxHash = simpleHash(`${bbox.west}${bbox.south}${bbox.east}${bbox.north}`);
      const minNdvi = 3500;

      const prepareRes = await fetch("/api/stellar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "prepare_mint_crop_nft",
          farmer,
          cropType: effectiveCropType,
          quantityKg: qty,
          priceUsdc: price.toFixed(2),
          harvestDate,
          parcelName: name,
          parcelBboxHash: bboxHash,
          parcelAreaHectares: hectares,
          region: reg,
          minNdviBps: minNdvi,
          observationWindowDays: 30,
        }),
      });

      if (!prepareRes.ok) {
        const err = await prepareRes.json().catch(() => ({}));
        throw new Error((err as Record<string, unknown>).error as string || "Failed to prepare mint transaction");
      }

      const prepared = await prepareRes.json() as { xdr: string; hash: string; contractId: string };
      const { signedTxXdr, hash } = await signPreparedXdr(farmer, prepared.xdr);
      const submission = await submitSignedXdr(signedTxXdr);
      const txHash = submission.hash ?? hash;

      setMintTxHash(txHash);

      try {
        const { getLiveListings } = await import("@/lib/stellar/live-data");
        const all = await getLiveListings();
        const mine = all.filter((l) => l.farmer === farmer);
        const maxId = mine.length > 0 ? Math.max(...mine.map((l) => l.nftId)) : 0;
        const newNftId = maxId + 1;
        setMintedNftId(newNftId);

        await fetch(`${BACKEND_URL}/api/listings`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            nftId: newNftId,
            cropType: effectiveCropType,
            quantityKg: qty,
            priceUsdc: parseFloat(priceUsdc),
            farmerId: farmer,
            parcelName: name,
            region: reg,
            buyable: false,
            ndviBps: ndviBpsResult ?? null,
            minNdviBps: minNdvi,
            areaHa: hectares,
            totalYieldKg: yieldKg,
            status: "listed",
          }),
        });
      } catch (dbErr) {
        console.warn("Failed to save listing to backend:", dbErr);
      }

      clearPolygon();
      setMintStep("done");
    } catch (e) {
      setMintError(e instanceof Error ? e.message : "Listing failed");
      setMintStep("form");
    }
  };

  const hasPolygon = polygonCoords.length >= 3;
  const hasActiveSelection = selected !== null || hasPolygon;
  const displayBbox = hasActiveSelection
    ? bbox
    : selected
      ? bbox
      : { west: 0, south: 0, east: 0, north: 0 };

  const activeNftId = selected?.id ?? (hasPolygon ? 0 : null);

  const formValid = parcelName.trim().length > 0
    && quantityKg.trim().length > 0
    && parseInt(quantityKg, 10) > 0
    && priceUsdc.trim().length > 0
    && parseFloat(priceUsdc) > 0
    && totalYieldKg.trim().length > 0
    && parseInt(totalYieldKg, 10) > 0;

  const selectedRegion = selected?.region ?? polygonCenter
    ? "Drawn Area"
    : null;

  return (
    <div className="grid h-[calc(100vh-8rem)] gap-4 lg:grid-cols-[1fr_380px]">
      {/* Left: Map + draw toggle */}
      <div className="relative overflow-hidden rounded-2xl border border-farm-200/60 bg-stone-100">
        <ParcelMap
          markers={parcels.filter((p) => !p.noCoords)}
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
              <Trash2 size={14} className="inline mr-1" /> Clear
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
            Click to place polygon vertices. Double-click or click first point to close.
          </div>
        )}
      </div>

      {/* Right panel */}
      <div className="flex flex-col gap-4 overflow-y-auto">
        {/* === DONE === */}
        {mintStep === "done" && (
          <div className="card-farm p-5 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-farm-100 text-farm-600">
              <CheckCircle size={30} />
            </div>
            <h3 className="mt-3 text-base font-bold text-stone-800">Listing Submitted!</h3>
            <p className="mt-1 text-sm text-stone-500">
              Your parcel is listed as <span className="font-semibold text-harvest-600">Pending</span>.
            </p>
            <p className="mt-1 text-xs text-stone-400">
              An admin will attest the NDVI data to complete verification.
            </p>
            {mintTxHash && (
              <p className="mt-2 font-mono text-[10px] text-stone-400 break-all">
                tx: {mintTxHash.slice(0, 30)}...
              </p>
            )}
            {mintedNftId && (
              <p className="mt-1 text-xs font-medium text-farm-700">
                NFT #{mintedNftId} minted
              </p>
            )}
            <button
              onClick={() => { resetListingForm(); setMintStep("draw"); }}
              className="btn-primary mt-4 w-full justify-center"
            >
              <Rocket size={16} /> List Another Parcel
            </button>
          </div>
        )}

        {/* === CREATING LISTING FORM (step "form" or "ndvi") === */}
        {hasPolygon && (mintStep === "form" || mintStep === "ndvi") && (
          <div className="card-farm overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                <MapPinned size={12} className="inline mr-1.5" />
                Create Listing
              </h3>
              <button
                onClick={clearPolygon}
                className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
              >
                <X size={14} />
              </button>
            </div>

            {/* Location summary */}
            <div className="mb-4 rounded-lg bg-farm-50 px-3 py-2.5 text-xs text-farm-700">
              <div className="flex items-center gap-1.5 font-semibold">
                <MapPin size={11} />
                {polygonCoords.length} vertex polygon
              </div>
              <p className="mt-0.5 text-stone-500">
                Center: {polygonCenter?.lat.toFixed(4)}, {polygonCenter?.lng.toFixed(4)}
                {polygonCoords.length >= 3 && (
                  <> &middot; ~{approximateHectares(polygonCoords).toFixed(1)} ha</>
                )}
              </p>
              <div className="mt-1 grid grid-cols-4 gap-1 text-[10px] text-stone-400 font-mono">
                <span>N:{displayBbox.north.toFixed(5)}</span>
                <span>S:{displayBbox.south.toFixed(5)}</span>
                <span>E:{displayBbox.east.toFixed(5)}</span>
                <span>W:{displayBbox.west.toFixed(5)}</span>
              </div>
            </div>

            {/* Form fields */}
            <div className="space-y-3">
              {/* Parcel Name */}
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase text-stone-500">
                  <MapPin size={10} className="inline mr-1" /> Parcel Name
                </label>
                <input
                  type="text"
                  value={parcelName}
                  onChange={(e) => setParcelName(e.target.value)}
                  placeholder="e.g. Central Valley Field A"
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-800 outline-none focus:border-farm-400"
                />
              </div>

              {/* Crop Type */}
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase text-stone-500">
                  <Sprout size={10} className="inline mr-1" /> Crop Type
                </label>
                <div className="grid grid-cols-5 gap-1 mb-1.5">
                  {CROP_TYPES.map((ct) => (
                    <button
                      key={ct}
                      onClick={() => setCropType(ct)}
                      className={`rounded-md px-2 py-1 text-[11px] font-medium capitalize transition ${
                        cropType === ct
                          ? "bg-farm-900 text-white"
                          : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                      }`}
                    >
                      {ct}
                    </button>
                  ))}
                  <button
                    onClick={() => setCropType("other")}
                    className={`rounded-md px-2 py-1 text-[11px] font-medium transition ${
                      cropType === "other"
                        ? "bg-farm-900 text-white"
                        : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                    }`}
                  >
                    Other
                  </button>
                </div>
                {cropType === "other" && (
                  <input
                    type="text"
                    value={cropTypeCustom}
                    onChange={(e) => setCropTypeCustom(e.target.value)}
                    placeholder="Enter crop type..."
                    className="w-full rounded-lg border border-stone-200 px-3 py-1.5 text-sm text-stone-800 outline-none focus:border-farm-400"
                  />
                )}
              </div>

              {/* Quantity + Price row */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase text-stone-500">
                    <Scale size={10} className="inline mr-1" /> Quantity (kg)
                  </label>
                  <input
                    type="number"
                    value={quantityKg}
                    onChange={(e) => setQuantityKg(e.target.value)}
                    placeholder="5000"
                    min={1}
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-800 outline-none focus:border-farm-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase text-stone-500">
                    <DollarSign size={10} className="inline mr-1" /> Price (USDC)
                  </label>
                  <input
                    type="number"
                    value={priceUsdc}
                    onChange={(e) => setPriceUsdc(e.target.value)}
                    placeholder="250.00"
                    min={0}
                    step="0.01"
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-800 outline-none focus:border-farm-400"
                  />
                </div>
              </div>

              {/* Total Yield + Region */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase text-stone-500">
                    <Hash size={10} className="inline mr-1" /> Total Yield (kg)
                  </label>
                  <input
                    type="number"
                    value={totalYieldKg}
                    onChange={(e) => setTotalYieldKg(e.target.value)}
                    placeholder="10000"
                    min={1}
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-800 outline-none focus:border-farm-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase text-stone-500">
                    <User size={10} className="inline mr-1" /> Region
                  </label>
                  <input
                    type="text"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="e.g. Nueva Ecija"
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-800 outline-none focus:border-farm-400"
                  />
                </div>
              </div>

              {/* Harvest Date */}
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase text-stone-500">
                  <Crosshair size={10} className="inline mr-1" /> Harvest Date
                </label>
                <input
                  type="date"
                  value={harvestDate}
                  onChange={(e) => setHarvestDate(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-800 outline-none focus:border-farm-400"
                />
              </div>

              {/* NDVI action */}
              {!ndviRun && (
                <button
                  type="button"
                  onClick={() => setMintStep("ndvi")}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-farm-200 bg-farm-50 px-3 py-2 text-xs font-semibold text-farm-700 hover:bg-farm-100 transition"
                >
                  <Satellite size={13} />
                  Run Satellite NDVI Check (optional)
                </button>
              )}

              {ndviRun && ndviBpsResult !== null && (
                <div className="rounded-lg border border-farm-200 bg-farm-50/30 px-3 py-2 text-xs">
                  <span className="font-semibold text-farm-700">NDVI: {(ndviBpsResult / 100).toFixed(1)}%</span>
                  <span className="ml-2 text-stone-400">Recorded</span>
                </div>
              )}

              {/* Mint error */}
              {mintError && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 border border-red-100">
                  {mintError}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleMintSubmit}
                disabled={!formValid || mintStep === "minting"}
                className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98] ${
                  formValid && mintStep !== "minting"
                    ? "bg-stone-900 text-white hover:bg-stone-800 shadow-sm"
                    : "bg-stone-100 text-stone-400 cursor-not-allowed"
                }`}
              >
                {mintStep === "minting" ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Minting Crop NFT...
                  </>
                ) : (
                  <>
                    <Rocket size={15} /> List Crop &mdash; Pending Attestation
                  </>
                )}
              </button>
              <p className="text-center text-[10px] text-stone-400 -mt-1.5">
                After minting, an admin will attest NDVI to make it buyable.
              </p>
            </div>
          </div>
        )}

        {/* === NDVI step (expanded verification panel) === */}
        {hasPolygon && mintStep === "ndvi" && (
          <div className="card-farm flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                <Satellite size={13} className="inline mr-1.5" />
                Satellite NDVI Verification
              </h3>
              <button
                onClick={() => setMintStep("form")}
                className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
              >
                <X size={14} />
              </button>
            </div>
            <SatelliteVerificationPanel
              nftId={0}
              bbox={displayBbox}
              minNdviBps={3500}
              sampleGridSize={20}
            />
            <button
              onClick={() => setMintStep("form")}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-600 hover:bg-stone-50 transition"
            >
              <ChevronRight size={13} className="rotate-180" /> Back to Listing Form
            </button>
          </div>
        )}

        {/* === SELECTION CARD (existing parcels) === */}
        {hasActiveSelection && !hasPolygon && (
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
                <div className="flex flex-col items-center py-3">
                  <p className="text-xs text-stone-400">Draw a polygon to create a new listing.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* === NO SELECTION === */}
        {!hasActiveSelection && mintStep === "draw" && (
          <div className="card-farm flex flex-col items-center justify-center p-5 text-center">
            <Target size={24} className="mb-2 text-stone-300" />
            <p className="text-xs font-medium text-stone-400">Select a parcel or draw a polygon</p>
            <p className="mt-0.5 text-[11px] text-stone-300">
              Draw an area on the map to create a new listing with satellite verification
            </p>
          </div>
        )}

        {/* === SATELLITE VERIFICATION PANEL (existing parcels) === */}
        {activeNftId !== null && !hasPolygon && displayBbox.west !== 0 && (
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
