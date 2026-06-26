"use client";

import { ReactNode } from "react";

import { WalletProvider } from "@/components/stellar/wallet-context";
import WalletGate from "@/components/WalletGate";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <WalletProvider>
      <WalletGate>{children}</WalletGate>
    </WalletProvider>
  );
}
