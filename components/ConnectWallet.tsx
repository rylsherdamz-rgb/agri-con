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
      <div className="flex items-center gap-3">
        <div className="hidden rounded-full border border-emerald-900/10 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-900 sm:block">
          {selectedWalletId ?? "wallet"} · {shorten(address)}
        </div>
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-900 px-5 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-800"
          onClick={() => {
            void disconnect();
          }}
          type="button"
        >
          {isBusy ? "Disconnecting..." : "Disconnect"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        className="inline-flex min-h-11 items-center justify-center rounded-full border border-emerald-900 px-5 py-2 text-sm font-semibold text-emerald-900 transition hover:-translate-y-0.5 hover:bg-emerald-900 hover:text-white"
        onClick={() => {
          void connect();
        }}
        type="button"
      >
        {isBusy ? "Connecting..." : "Connect Wallet"}
      </button>
      {error ? <p className="max-w-52 text-right text-xs text-rose-700">{error}</p> : null}
    </div>
  );
}
