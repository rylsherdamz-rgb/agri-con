"use client";

import { ReactNode } from "react";

import { WalletProvider } from "@/components/stellar/wallet-context";
import WalletGate from "@/components/WalletGate";
import { ToastProvider } from "@/components/Toast";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <WalletProvider>
      <WalletGate>
        <ToastProvider>{children}</ToastProvider>
      </WalletGate>
    </WalletProvider>
  );
}
