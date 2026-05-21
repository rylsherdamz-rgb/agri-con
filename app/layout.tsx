import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import FloatingAIButton from "@/components/FloatingAIButtont";
import Walkthrough from "@/components/Walkthrough";

export const metadata: Metadata = {
  title: "Agri-Block | HarvestLock",
  description:
    "Agricultural forward contracts on Stellar with crop NFTs, escrow settlement, parcel intelligence, and satellite-gated buyability.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
          <FloatingAIButton />
          <Walkthrough />
        </Providers>
      </body>
    </html>
  );
}