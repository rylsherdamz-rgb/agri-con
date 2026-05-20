import SidebarShell from "@/components/SidebarShell";
import { getLiveListings } from "@/lib/stellar/live-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function InsightsPage() {
  const listings = await getLiveListings();
  const total = listings.length;
  const buyable = listings.filter((item) => item.buyable).length;
  const avgNdvi =
    listings.filter((item) => item.ndviBps !== null).reduce((sum, item) => sum + (item.ndviBps ?? 0), 0) /
    Math.max(1, listings.filter((item) => item.ndviBps !== null).length);
  return (
    <SidebarShell
      title="Insights"
      subtitle="Real-time verification intelligence and NDVI signals."
    >
      <section className="rounded-[30px] border border-stone-200 bg-white p-6">
          <h1 className="text-2xl font-semibold">Verification Insights</h1>
          <p className="mt-1 text-sm text-stone-600">
            Live NDVI and buyability signals from on-chain attestations.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <article className="rounded-xl border border-stone-200 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-stone-500">Tracked NFTs</p>
              <p className="mt-2 text-xl font-semibold">{total}</p>
            </article>
            <article className="rounded-xl border border-stone-200 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-stone-500">Buyable</p>
              <p className="mt-2 text-xl font-semibold">{buyable}</p>
            </article>
            <article className="rounded-xl border border-stone-200 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-stone-500">Avg NDVI</p>
              <p className="mt-2 text-xl font-semibold">{(avgNdvi / 10000).toFixed(3)}</p>
            </article>
          </div>
          <div className="mt-5 space-y-3">
            {listings.map((item) => (
              <article key={item.nftId} className="rounded-xl border border-stone-200 p-4">
                <p className="text-sm font-semibold">
                  {item.parcelName ?? `NFT #${item.nftId}`}
                </p>
                <p className="text-xs text-stone-600">
                  {item.cropType ?? "Unknown crop"} · {item.buyable ? "Buyable" : "Hold"} · NDVI{" "}
                  {item.ndviBps !== null ? (item.ndviBps / 10000).toFixed(3) : "N/A"}
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  Threshold{" "}
                  {item.minNdviBps !== null ? (item.minNdviBps / 10000).toFixed(2) : "N/A"} · Window{" "}
                  {item.observationWindowDays ?? "N/A"} days
                </p>
              </article>
            ))}
          </div>
      </section>
    </SidebarShell>
  );
}
