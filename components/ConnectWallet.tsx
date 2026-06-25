"use client";

import { useWallet } from "@/components/stellar/wallet-context";

function shorten(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export default function ConnectWallet() {
  const { address, connect, disconnect, error, isBusy, selectedWalletId } =
    useWallet();

  if (address) {
    return (
      <div className="flex items-center gap-2">
        <div className="hidden rounded-full border border-emerald-900/10 bg-emerald-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-900 sm:block sm:px-4 sm:tracking-[0.16em]">
          <span className="hidden md:inline">{selectedWalletId ?? "wallet"} · </span>
          {shorten(address)}
        </div>
        <button
          className="inline-flex min-h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-emerald-900 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-800 sm:px-5"
          onClick={() => {
            void disconnect();
          }}
          type="button"
        >
          {isBusy ? "..." : "Disconnect"}
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-end">
      <button
        className="inline-flex min-h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-emerald-900 px-4 py-2 text-sm font-semibold text-emerald-900 transition hover:-translate-y-0.5 hover:bg-emerald-900 hover:text-white sm:px-5"
        onClick={() => {
          void connect();
        }}
        type="button"
      >
        {isBusy ? (
          "Connecting..."
        ) : (
          <>
            <span className="sm:hidden">Connect</span>
            <span className="hidden sm:inline">Connect Wallet</span>
          </>
        )}
      </button>
      {error ? (
        <p className="absolute right-0 top-full z-40 mt-1 max-w-[70vw] break-words rounded-lg bg-rose-50 px-2.5 py-1.5 text-right text-xs text-rose-700 shadow-sm sm:max-w-52">
          {error}
        </p>
      ) : null}
    </div>
  );
}
