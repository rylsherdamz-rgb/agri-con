"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { useWallet } from "@/components/stellar/wallet-context";
import {
  buyCropNft,
  loadNetworkSnapshot,
  mintCropNft,
  registerValidator,
  submitSignedXdr,
  submitProof,
  TransactionPreview,
  verifyDelivery,
} from "@/lib/stellar/agri-block";
import { CONTRACT_IDS } from "@/lib/stellar/config";

type Snapshot = {
  rpcStatus: string;
  latestLedger: number;
  baseFee: string;
  networkPassphrase: string;
} | null;

type OpenEOStatus = {
  ok: boolean;
  endpoint?: string;
  apiVersion?: string;
  collections?: number;
  processes?: number;
  authStatus?: string;
  providerId?: string | null;
  error?: string;
} | null;

type DemoStatus = "idle" | "running" | "success" | "error";

type Step = {
  key: "mint" | "reserve" | "proof" | "authorize" | "verify";
  label: string;
  description: string;
};

const steps: Step[] = [
  {
    key: "mint",
    label: "Mint Position",
    description: "Create a crop commitment NFT for a future harvest.",
  },
  {
    key: "reserve",
    label: "Reserve Through Escrow",
    description: "Buyer reserves the NFT and escrow applies 70/20/10 split.",
  },
  {
    key: "proof",
    label: "Submit Proof",
    description: "Farmer anchors proof hash linked to field evidence.",
  },
  {
    key: "authorize",
    label: "Authorize Validator",
    description: "Admin registers the validator before settlement.",
  },
  {
    key: "verify",
    label: "Verify + Settle",
    description: "Validator confirms delivery and settlement path executes.",
  },
];

type SubmissionState = {
  hash: string;
  status: string;
} | null;

const listings = [
  {
    tag: "Rice",
    title: "Nueva Ecija Rice Batch",
    harvest: "Oct 2026",
    yield: "1,000 kg",
    price: "1,000 USDC",
    image:
      "https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=800&q=80",
  },
  {
    tag: "Corn",
    title: "Bukidnon Corn Batch",
    harvest: "Sep 2026",
    yield: "650 kg",
    price: "720 USDC",
    image:
      "https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?auto=format&fit=crop&w=800&q=80",
  },
  {
    tag: "Coconut",
    title: "Bicol Coconut Sugar",
    harvest: "Nov 2026",
    yield: "240 kg",
    price: "540 USDC",
    image:
      "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=800&q=80",
  },
];

function shortAddr(value: string | null) {
  if (!value) return "Not connected";
  return `${value.slice(0, 6)}...${value.slice(-6)}`;
}

export default function AgriBlockExperience() {
  const { address, connect } = useWallet();
  const [snapshot, setSnapshot] = useState<Snapshot>(null);
  const [openEO, setOpenEO] = useState<OpenEOStatus>(null);
  const [demoStatus, setDemoStatus] = useState<DemoStatus>("idle");
  const [activeStep, setActiveStep] = useState<Step["key"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastTx, setLastTx] = useState<TransactionPreview | null>(null);
  const [submission, setSubmission] = useState<SubmissionState>(null);

  useEffect(() => {
    void loadNetworkSnapshot().then(setSnapshot).catch(() => setSnapshot(null));
  }, []);

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/openeo", { cache: "no-store" })
      .then(async (response) => {
        const json = (await response.json()) as OpenEOStatus;
        if (!cancelled) {
          setOpenEO(json);
        }
      })
      .catch((fetchError: unknown) => {
        if (!cancelled) {
          setOpenEO({
            ok: false,
            error:
              fetchError instanceof Error ? fetchError.message : "openEO status check failed",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const checks = useMemo(() => {
    const allContracts =
      Boolean(CONTRACT_IDS.cropNft) &&
      Boolean(CONTRACT_IDS.escrow) &&
      Boolean(CONTRACT_IDS.verification);

    return [
      {
        label: "Wallet",
        value: shortAddr(address),
        ok: Boolean(address),
      },
      {
        label: "Soroban RPC",
        value: snapshot?.rpcStatus ?? "Loading",
        ok: snapshot?.rpcStatus === "healthy",
      },
      {
        label: "Contract Wiring",
        value: allContracts ? "Ready" : "Missing IDs",
        ok: allContracts,
      },
      {
        label: "openEO",
        value: openEO?.ok
          ? `${openEO.authStatus ?? "anonymous"}`
          : openEO?.error ?? "Unavailable",
        ok: Boolean(openEO?.ok),
      },
    ];
  }, [address, snapshot, openEO]);

  async function getActor() {
    if (address) return address;
    const connected = await connect();
    if (!connected) throw new Error("Connect wallet first.");
    return connected;
  }

  async function runStep(step: Step["key"]) {
    setDemoStatus("running");
    setActiveStep(step);
    setError(null);
    setSubmission(null);

    try {
      const actor = await getActor();
      let tx: TransactionPreview;

      if (step === "mint") {
        tx = await mintCropNft({
          farmer: actor,
          cropType: "Rice",
          quantityKg: 1000,
          priceUsdc: "1000",
          harvestDate: "2026-10-15",
          parcelName: "Central Valley Parcel A",
          parcelBboxHash: "central-valley-parcel-a-demo-bbox",
          parcelAreaHectares: 12.5,
          region: "Nueva Ecija",
          minNdviBps: 3500,
          observationWindowDays: 30,
        });
      } else if (step === "reserve") {
        tx = await buyCropNft({ buyer: actor, nftId: 1 });
      } else if (step === "proof") {
        tx = await submitProof({
          farmer: actor,
          nftId: 1,
          proofHash: "ipfs://bafybeigdemoagrihashproof001",
        });
      } else if (step === "authorize") {
        tx = await registerValidator({ admin: actor, validator: actor });
      } else {
        tx = await verifyDelivery({
          validator: actor,
          nftId: 1,
          status: "Delivered",
          notesHash: "ipfs://bafybeigdemoagrihashvalidator001",
          refundAmount: "0",
          treasuryCompensation: "0",
        });
      }

      setLastTx(tx);
      if (!tx.signedTxXdr) {
        throw new Error("Wallet signing did not return a signed transaction.");
      }

      const submissionResult = await submitSignedXdr(tx.signedTxXdr);
      setSubmission({
        hash: submissionResult.hash ?? tx.hash,
        status: submissionResult.status ?? "PENDING",
      });
      setDemoStatus("success");
    } catch (err) {
      setDemoStatus("error");
      setError(err instanceof Error ? err.message : "Step failed");
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1300px] px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[34px] border border-emerald-950/10 bg-[linear-gradient(135deg,#fffdf7_0%,#f7fee7_44%,#ecfdf5_100%)] p-6 shadow-[0_20px_70px_rgba(16,45,30,0.08)] sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
              Agri-Block / HarvestLock
            </p>
            <h1 className="mt-2 max-w-4xl text-4xl font-semibold leading-none tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
              Crop reservations that stay tradable only when the land can still deliver.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-stone-700 sm:text-base">
              This app combines Soroban crop NFTs, escrow settlement, validator delivery proof,
              and satellite attestations into one operating surface for agricultural forward
              contracts.
            </p>
          </div>
          <div className="grid min-w-[280px] gap-3 sm:grid-cols-2">
            <Link
              href="/parcel"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
            >
              Run parcel verification
            </Link>
            <Link
              href="/marketplace"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-emerald-950/20 bg-white/70 px-5 py-3 text-sm font-semibold text-stone-900 transition hover:-translate-y-0.5"
            >
              Inspect live listings
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-[28px] border border-white/80 bg-white/80 p-5 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.16em] text-stone-500">Operational thesis</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-stone-950 p-4 text-stone-50">
                <p className="text-xs uppercase tracking-[0.14em] text-stone-400">On-chain asset</p>
                <p className="mt-2 text-lg font-semibold">Crop commitment NFT</p>
              </div>
              <div className="rounded-2xl border border-emerald-950/10 bg-emerald-50 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-emerald-700">Risk gate</p>
                <p className="mt-2 text-lg font-semibold text-emerald-950">Satellite buyability</p>
              </div>
              <div className="rounded-2xl border border-amber-300/50 bg-amber-50 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-amber-700">Settlement</p>
                <p className="mt-2 text-lg font-semibold text-amber-950">Escrow + validator release</p>
              </div>
            </div>
          </article>

          <article className="rounded-[28px] border border-emerald-950/10 bg-stone-950 p-5 text-stone-50">
            <p className="text-xs uppercase tracking-[0.16em] text-stone-400">Environment</p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
                <span className="text-stone-400">Wallet actor</span>
                <span className="font-medium">{shortAddr(address)}</span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
                <span className="text-stone-400">Latest ledger</span>
                <span className="font-medium">{snapshot?.latestLedger ?? "Loading"}</span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
                <span className="text-stone-400">Base fee</span>
                <span className="font-medium">{snapshot?.baseFee ?? "Loading"}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-stone-400">openEO auth</span>
                <span className="font-medium">{openEO?.authStatus ?? "Loading"}</span>
              </div>
            </div>
          </article>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {checks.map((c) => (
            <article key={c.label} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-stone-500">{c.label}</p>
              <p className={`mt-2 text-sm font-semibold ${c.ok ? "text-emerald-700" : "text-amber-700"}`}>
                {c.ok ? "Healthy" : "Needs setup"}
              </p>
              <p className="mt-1 text-sm text-stone-700">{c.value}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-8 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-[30px] border border-stone-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-stone-900">Future Harvest Marketplace</h2>
            <span className="text-xs uppercase tracking-[0.16em] text-stone-500">Live Listings</span>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((item) => (
              <article key={item.title} className="overflow-hidden rounded-2xl border border-stone-200">
                <Image
                  src={item.image}
                  alt={item.title}
                  width={800}
                  height={400}
                  className="h-36 w-full object-cover"
                />
                <div className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-emerald-700">{item.tag}</p>
                  <h3 className="mt-1 text-sm font-semibold text-stone-900">{item.title}</h3>
                  <p className="mt-2 text-xs text-stone-600">Harvest: {item.harvest}</p>
                  <p className="text-xs text-stone-600">Yield: {item.yield}</p>
                  <p className="mt-2 text-sm font-semibold text-stone-900">{item.price}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-[30px] bg-gradient-to-b from-emerald-950 to-emerald-900 p-6 text-emerald-50">
          <p className="text-xs uppercase tracking-[0.16em] text-emerald-200">Parcel Intelligence</p>
          <h2 className="mt-2 text-2xl font-semibold">Central Valley Parcel A</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-emerald-100/20 bg-emerald-900/40 p-3">
              <p className="text-xs text-emerald-200">Soil Moisture</p>
              <p className="mt-1 text-lg font-semibold">64%</p>
            </div>
            <div className="rounded-xl border border-emerald-100/20 bg-emerald-900/40 p-3">
              <p className="text-xs text-emerald-200">NDVI</p>
              <p className="mt-1 text-lg font-semibold">0.72</p>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-emerald-100/20">
            <iframe
              title="Parcel map"
              className="h-64 w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src="https://maps.google.com/maps?q=15.7342,120.9307&z=10&output=embed"
            />
          </div>
          <p className="mt-2 text-xs text-emerald-200">
            Parcel verification is operational from the dedicated parcel route, including bbox
            picking and oracle-signed attestation recording.
          </p>
          <Link
            href="/parcel"
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-950"
          >
            Open verification workspace
          </Link>
        </div>
      </section>

      <section className="mt-8 rounded-[30px] border border-stone-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-stone-500">Transaction Walkthrough</p>
            <h2 className="mt-2 text-2xl font-semibold text-stone-900">Run every settlement step</h2>
            <p className="mt-2 max-w-2xl text-sm text-stone-600">
              Each action now signs with the connected wallet and submits to the Stellar testnet.
              Admin-only steps still require the correct privileged wallet to succeed.
            </p>
          </div>
          <button
            className="rounded-full border border-emerald-700/30 px-4 py-2 text-xs font-semibold text-emerald-800"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            Back to top
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {steps.map((step) => (
            <article key={step.key} className="rounded-xl border border-stone-200 p-4">
              <p className="text-sm font-semibold text-stone-900">{step.label}</p>
              <p className="mt-1 text-xs leading-5 text-stone-600">{step.description}</p>
              <button
                onClick={() => runStep(step.key)}
                disabled={demoStatus === "running"}
                className="mt-3 min-h-10 w-full rounded-full bg-emerald-900 px-3 text-xs font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
              >
                {demoStatus === "running" && activeStep === step.key ? "Running..." : "Execute"}
              </button>
            </article>
          ))}
        </div>

        <div className="mt-5 rounded-2xl bg-stone-950 p-4 text-stone-100">
          <p className="text-xs uppercase tracking-[0.15em] text-stone-400">Execution Log</p>
          <p className="mt-2 text-sm">
            Status: <span className="font-semibold">{demoStatus}</span>
          </p>
          {error && <p className="mt-1 text-sm text-rose-300">{error}</p>}
          {lastTx && (
            <div className="mt-3 space-y-1 text-xs text-stone-300">
              <p>Method: {lastTx.method}</p>
              <p>Contract: {lastTx.contractId}</p>
              <p>Hash: {lastTx.hash}</p>
            </div>
          )}
          {submission ? (
            <div className="mt-3 space-y-1 border-t border-white/10 pt-3 text-xs text-emerald-200">
              <p>Submitted hash: {submission.hash}</p>
              <p>Network status: {submission.status}</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="mt-8 grid gap-8 lg:grid-cols-2">
        <article className="rounded-[30px] border border-stone-200 bg-white p-6">
          <p className="text-xs uppercase tracking-[0.16em] text-stone-500">Demand Insights</p>
          <h3 className="mt-2 text-xl font-semibold text-stone-900">Market pressure and liquidity view</h3>
          <div className="mt-5 rounded-2xl border border-stone-200 p-4">
            <svg viewBox="0 0 500 160" className="h-40 w-full">
              <path d="M10 130 C120 120, 180 80, 260 90 C330 100, 380 60, 490 50" fill="none" stroke="#0f5132" strokeWidth="4" />
              <path d="M10 145 H490" stroke="#d6d3d1" strokeWidth="2" />
            </svg>
          </div>
        </article>

        <article className="rounded-[30px] border border-stone-200 bg-white p-6">
          <p className="text-xs uppercase tracking-[0.16em] text-stone-500">openEO + Copernicus</p>
          <h3 className="mt-2 text-xl font-semibold text-stone-900">Processing backend readiness</h3>
          <div className="mt-4 space-y-2 text-sm text-stone-700">
            <p>Endpoint: {openEO?.endpoint ?? "loading"}</p>
            <p>API Version: {openEO?.apiVersion ?? "loading"}</p>
            <p>Collections: {openEO?.collections ?? 0}</p>
            <p>Processes: {openEO?.processes ?? 0}</p>
            <p>Auth: {openEO?.authStatus ?? "unknown"}</p>
            <p>Provider: {openEO?.providerId ?? "unknown"}</p>
          </div>
          <Link
            href="/insights"
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-900 px-5 py-2 text-xs font-semibold text-white"
          >
            Review insights
          </Link>
        </article>
      </section>
    </div>
  );
}
