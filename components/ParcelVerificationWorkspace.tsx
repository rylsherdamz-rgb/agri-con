"use client";

import { useMemo, useState } from "react";

import ParcelMap from "@/components/ParcelMap";
import SatelliteVerificationPanel from "@/components/SatelliteVerificationPanel";

type Props = {
  nftId: number;
  title: string;
  initialCenter: { lat: number; lng: number };
  temporalExtent: { start: string; end: string };
};

function round(value: number) {
  return Number(value.toFixed(6));
}

function buildBbox(center: { lat: number; lng: number }, span: number) {
  return {
    west: round(center.lng - span),
    south: round(center.lat - span),
    east: round(center.lng + span),
    north: round(center.lat + span),
  };
}

export default function ParcelVerificationWorkspace({
  nftId,
  title,
  initialCenter,
  temporalExtent,
}: Props) {
  const [selectedCenter, setSelectedCenter] = useState(initialCenter);
  const [span, setSpan] = useState(0.08);
  const bbox = useMemo(() => buildBbox(selectedCenter, span), [selectedCenter, span]);
  const approxKm = (span * 111).toFixed(1);

  return (
    <section className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
      <article className="overflow-hidden  border border-stone-200 bg-white">
        <div className="border-b border-stone-200 px-4 py-4 sm:px-6">
          <h2 className="mt-1 text-lg font-semibold text-stone-900">{title}</h2>
        </div>
        <ParcelMap
          lat={initialCenter.lat}
          lng={initialCenter.lng}
          title={title}
          selectedCenter={selectedCenter}
          selectionSpan={span}
          onPick={setSelectedCenter}
        />
      </article>

      <article className="rounded-[30px] bg-gradient-to-b from-emerald-950 to-emerald-900 p-6 text-emerald-50">
        <p className="text-xs uppercase tracking-[0.16em] text-emerald-200">Parcel Profile</p>
        <h1 className="mt-2 text-2xl font-semibold">{title}</h1>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-emerald-100/20 bg-emerald-900/40 p-3">
            <p className="text-xs text-emerald-200">Analysis Radius</p>
            <p className="mt-1 text-lg font-semibold">{approxKm} km</p>
          </div>
          <div className="rounded-xl border border-emerald-100/20 bg-emerald-900/40 p-3">
            <p className="text-xs text-emerald-200">Center</p>
            <p className="mt-1 text-sm font-semibold">
              {selectedCenter.lat.toFixed(4)}, {selectedCenter.lng.toFixed(4)}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-100/20 bg-emerald-900/40 p-3">
            <p className="text-xs text-emerald-200">Window</p>
            <p className="mt-1 text-sm font-semibold">
              {temporalExtent.start.slice(0, 10)} to {temporalExtent.end.slice(0, 10)}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-100/20 bg-emerald-900/40 p-3">
            <p className="text-xs text-emerald-200">Mode</p>
            <p className="mt-1 text-sm font-semibold">Oracle-signed attestation</p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-emerald-100/20 bg-emerald-900/35 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-emerald-50">Analysis window</p>
            <span className="text-xs text-emerald-200">Half-span {span.toFixed(3)}°</span>
          </div>
          <input
            type="range"
            min="0.01"
            max="0.2"
            step="0.01"
            value={span}
            onChange={(event) => setSpan(Number(event.target.value))}
            className="mt-3 h-2 w-full accent-lime-300"
          />
          <div className="mt-3 grid gap-2 text-xs text-emerald-100 sm:grid-cols-2">
            <div className="rounded-xl border border-emerald-100/15 bg-emerald-950/40 p-3">
              West / East: {bbox.west}, {bbox.east}
            </div>
            <div className="rounded-xl border border-emerald-100/15 bg-emerald-950/40 p-3">
              South / North: {bbox.south}, {bbox.north}
            </div>
          </div>
        </div>

        <div className="mt-5">
          <SatelliteVerificationPanel
            nftId={nftId}
            bbox={bbox}
            minNdviBps={3500}
            temporalExtent={temporalExtent}
            sampleGridSize={20}
          />
        </div>
      </article>
    </section>
  );
}
