"use client";

import { ReactNode } from "react";

import { WalletProvider } from "@/components/stellar/wallet-context";

export default function Providers({ children }: { children: ReactNode }) {
  return <WalletProvider>{children}</WalletProvider>;
}
