export default function Footer() {
  return (
    <footer className="border-t border-emerald-950/10 bg-stone-950 text-stone-200">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-200">
            Agri-Block
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-stone-300">
            A Soroban-based agricultural reservation model where crop NFTs,
            USDC escrow, and validator proof create a market farmers and buyers
            can audit end to end.
          </p>
        </div>
        <div className="grid gap-3 text-sm text-stone-300 sm:grid-cols-2">
          <a className="transition hover:text-lime-200" href="/dashboard">
            Dashboard
          </a>
          <a className="transition hover:text-lime-200" href="/marketplace">
            Marketplace
          </a>
          <a className="transition hover:text-lime-200" href="/explore">
            Parcel Verification
          </a>
          <a className="transition hover:text-lime-200" href="/profile">
            Profile
          </a>
        </div>
      </div>
    </footer>
  );
}
