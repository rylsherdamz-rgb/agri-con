import SidebarShell from "@/components/SidebarShell";
import { getLiveFarmerProfiles, getLiveListings } from "@/lib/stellar/live-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function OverviewPage() {
  const listings = await getLiveListings();
  const profiles = await getLiveFarmerProfiles();
  const total = listings.length;
  const buyable = listings.filter((item) => item.buyable).length;
  const pending = total - buyable;
  const latestObservedAt = listings
    .map((item) => item.observedAt)
    .filter((value): value is number => typeof value === "number")
    .sort((a, b) => b - a)[0];
  return (
    <SidebarShell
      title="Overview"
      subtitle="System status, live listing lifecycle, and settlement visibility."
    >
        <section className="rounded-[30px] border border-stone-200 bg-white p-6">
          <h1 className="text-2xl font-semibold">Overview</h1>
          <p className="mt-1 text-sm text-stone-600">
            Project performance and active agreements.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-2xl border border-stone-200 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-stone-500">
                Tracked NFTs
              </p>
              <p className="mt-2 text-2xl font-semibold">{total}</p>
            </article>
            <article className="rounded-2xl border border-stone-200 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-stone-500">
                Buyable
              </p>
              <p className="mt-2 text-2xl font-semibold">{buyable}</p>
            </article>
            <article className="rounded-2xl border border-stone-200 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-stone-500">
                Hold
              </p>
              <p className="mt-2 text-2xl font-semibold">{pending}</p>
            </article>
            <article className="rounded-2xl border border-stone-200 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-stone-500">
                Latest Observation
              </p>
              <p className="mt-2 text-sm font-semibold">
                {latestObservedAt ? new Date(latestObservedAt * 1000).toLocaleString() : "N/A"}
              </p>
            </article>
          </div>
        </section>

        <section id="profiles" className="mt-6 rounded-[30px] border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-semibold">Live Listing Status</h2>
          <div className="mt-4 space-y-3">
            {listings.map((item) => (
              <article
                key={item.nftId}
                className="flex items-center justify-between rounded-xl border border-stone-200 p-4"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {item.parcelName ?? `NFT #${item.nftId}`}
                  </p>
                  <p className="text-xs text-stone-500">
                    {item.cropType ?? "Unknown crop"} · {item.region ?? "Unknown region"} · Source:{" "}
                    {item.source ?? "No attestation"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{item.buyable ? "Buyable" : "Hold"}</p>
                  <p className="text-xs text-stone-500">
                    {item.minNdviBps !== null ? `Min NDVI ${(item.minNdviBps / 10000).toFixed(2)}` : "No threshold"}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="mt-6 rounded-[30px] border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-semibold">Farmer Profiles (Stellar)</h2>
          <p className="mt-1 text-xs text-stone-500">
            Configure `FARMER_ADDRESSES` in env to load profile rows.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-xs uppercase tracking-[0.12em] text-stone-500">
                  <th className="px-2 py-2">Farmer</th>
                  <th className="px-2 py-2">Name</th>
                  <th className="px-2 py-2">Farm</th>
                  <th className="px-2 py-2">Region</th>
                  <th className="px-2 py-2">Yield (kg)</th>
                  <th className="px-2 py-2">Verified</th>
                  <th className="px-2 py-2">ID Object</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile) => (
                  <tr key={profile.farmer} className="border-b border-stone-100">
                    <td className="px-2 py-2 font-mono text-xs">{profile.farmer.slice(0, 8)}...{profile.farmer.slice(-6)}</td>
                    <td className="px-2 py-2">{profile.fullName || "-"}</td>
                    <td className="px-2 py-2">{profile.farmName || "-"}</td>
                    <td className="px-2 py-2">{profile.region || "-"}</td>
                    <td className="px-2 py-2">{profile.totalYieldKg}</td>
                    <td className="px-2 py-2">{profile.verified ? "Yes" : "No"}</td>
                    <td className="px-2 py-2 font-mono text-xs">{profile.governmentIdObject || "-"}</td>
                  </tr>
                ))}
                {profiles.length === 0 && (
                  <tr>
                    <td className="px-2 py-3 text-stone-500" colSpan={7}>
                      No on-chain profiles found for configured farmer addresses.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
    </SidebarShell>
  );
}
