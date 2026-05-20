"use client";

import { useState } from "react";

import { useWallet } from "@/components/stellar/wallet-context";
import { signPreparedXdr, submitSignedXdr } from "@/lib/stellar/agri-block";

type Props = {
  nftId: number;
  bbox: { west: number; south: number; east: number; north: number };
  minNdviBps?: number;
  temporalExtent?: { start: string; end: string };
  sampleGridSize?: number;
};

type RunResponse =
  | {
      ok: true;
      nftId: number;
      temporalExtent: { start: string; end: string };
      ndviMean: number;
      ndviBps: number;
      minNdviBps: number;
      buyable: boolean;
      sampleGridSize: number;
      attestation: {
        observedAt: number;
        bboxHash: string;
        reportHash: string;
        source: string;
      };
      oracleAddress: string | null;
      preparedRecordAttestation: {
        xdr: string;
        hash: string;
        contractId: string;
        method: string;
      } | null;
    }
  | { ok: false; error: string; details?: string; raw?: string };

function shortAddress(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-6)}`;
}

export default function SatelliteVerificationPanel({
  nftId,
  bbox,
  minNdviBps = 3500,
  temporalExtent,
  sampleGridSize = 16,
}: Props) {
  const { address, connect } = useWallet();
  const [isRunning, setIsRunning] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [result, setResult] = useState<RunResponse | null>(null);
  const [submissionHash, setSubmissionHash] = useState<string | null>(null);
  const [preparedHash, setPreparedHash] = useState<string | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = isRunning || isApplying;
  const requiredOracle = result?.ok ? result.oracleAddress : null;
  const canApply =
    result?.ok &&
    Boolean(result.preparedRecordAttestation) &&
    Boolean(requiredOracle) &&
    (!address || address === requiredOracle);

  async function run() {
    setIsRunning(true);
    setError(null);
    setSubmissionHash(null);
    setPreparedHash(null);
    setSubmissionStatus(null);
    try {
      const res = await fetch("/api/verification/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nftId, bbox, minNdviBps, temporalExtent, sampleGridSize }),
      });
      const json = (await res.json()) as RunResponse;
      setResult(json);
      if (json.ok) {
        setPreparedHash(json.preparedRecordAttestation?.hash ?? null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to run verification");
    } finally {
      setIsRunning(false);
    }
  }

  async function applyBuyable() {
    if (!result?.ok || !result.preparedRecordAttestation || !result.oracleAddress) {
      setError("No prepared attestation transaction is available.");
      return;
    }

    setIsApplying(true);
    setError(null);
    try {
      const admin = address ?? (await connect());
      if (!admin) throw new Error("Connect wallet first.");
      if (admin !== result.oracleAddress) {
        throw new Error(`Connect the oracle wallet ${shortAddress(result.oracleAddress)} to continue.`);
      }

      const { signedTxXdr, hash } = await signPreparedXdr(admin, result.preparedRecordAttestation.xdr);
      setPreparedHash(hash);

      const submission = await submitSignedXdr(signedTxXdr);
      setSubmissionHash(submission.hash ?? hash);
      setSubmissionStatus(submission.status ?? "PENDING");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to set buyability");
    } finally {
      setIsApplying(false);
    }
  }

  return (
    <div className="rounded-2xl border border-emerald-100/20 bg-emerald-900/40 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-emerald-200">
        Satellite Verification (Phase 4)
      </p>
      <p className="mt-2 text-sm text-emerald-50">
        Compute NDVI mean for this parcel, create an attestation, and update listing buyability on-chain.
      </p>
      <div className="mt-3 rounded-xl border border-emerald-100/20 bg-emerald-950/40 p-3 text-xs text-emerald-100">
        <div>Policy threshold: {(minNdviBps / 10000).toFixed(2)} NDVI</div>
        <div>Sampling grid: {sampleGridSize} x {sampleGridSize}</div>
        {temporalExtent ? (
          <div>
            Window: {temporalExtent.start} to {temporalExtent.end}
          </div>
        ) : (
          <div>Window: trailing 30 days</div>
        )}
      </div>
      <button
        onClick={run}
        disabled={busy}
        className="mt-3 w-full rounded-full bg-white px-4 py-2 text-sm font-semibold text-emerald-900 disabled:opacity-60"
      >
        {isRunning ? "Running..." : "Run NDVI check"}
      </button>

      {result?.ok && (
        <div className="mt-3 text-sm text-emerald-50">
          <div>NDVI mean: {result.ndviMean.toFixed(3)}</div>
          <div>Threshold: {(result.minNdviBps / 10000).toFixed(2)}</div>
          <div>Grid used: {result.sampleGridSize} x {result.sampleGridSize}</div>
          <div>Window start: {result.temporalExtent.start}</div>
          <div>Window end: {result.temporalExtent.end}</div>
          <div>Decision: {result.buyable ? "buyable" : "hold listing"}</div>
          <div>Observed at: {new Date(result.attestation.observedAt * 1000).toLocaleString()}</div>
          <div>Source: {result.attestation.source}</div>
          <div>Report hash: {shortAddress(result.attestation.reportHash)}</div>
          <div>BBox hash: {shortAddress(result.attestation.bboxHash)}</div>
          <div>Required oracle: {result.oracleAddress ? shortAddress(result.oracleAddress) : "missing"}</div>
          <div>Prepared tx: {result.preparedRecordAttestation ? shortAddress(result.preparedRecordAttestation.hash) : "unavailable"}</div>
          <button
            onClick={() => applyBuyable()}
            disabled={busy || !canApply}
            className="mt-3 w-full rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900 disabled:opacity-60"
          >
            {isApplying ? "Signing and submitting..." : "Record attestation on-chain"}
          </button>
          {!canApply && result.oracleAddress ? (
            <p className="mt-2 text-xs text-emerald-200">
              Connect the oracle wallet {shortAddress(result.oracleAddress)} to submit this change.
            </p>
          ) : null}
        </div>
      )}

      {result && !result.ok && (
        <p className="mt-3 text-sm text-rose-200">
          {result.error}
          {result.details ? `: ${result.details}` : ""}
          {"raw" in result && result.raw ? `: ${result.raw}` : ""}
        </p>
      )}

      {preparedHash && (
        <p className="mt-3 text-xs text-emerald-200">
          Signed tx hash: {preparedHash}
        </p>
      )}
      {submissionHash && (
        <p className="mt-2 text-xs text-emerald-200">
          Submitted tx: {submissionHash} {submissionStatus ? `(${submissionStatus})` : ""}
        </p>
      )}

      {error && <p className="mt-3 text-sm text-rose-200">{error}</p>}
    </div>
  );
}
