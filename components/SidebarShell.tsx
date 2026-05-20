"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import ConnectWallet from "@/components/ConnectWallet";

const navItems = [
  { label: "Overview", href: "/overview" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Parcel", href: "/parcel" },
  { label: "Insights", href: "/insights" },
];

const quickItems = [
  { label: "+ Farmer Profile", href: "/overview#profiles" },
  { label: "+ Parcel Verify", href: "/parcel" },
  { label: "+ Marketplace", href: "/marketplace" },
];

type Props = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export default function SidebarShell({ title, subtitle, children }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f4f5f1] text-stone-900">
      <div className="mx-auto flex w-full max-w-[1500px]">
        {open ? (
          <button
            type="button"
            aria-label="Close navigation"
            className="fixed inset-0 z-30 bg-stone-950/30 lg:hidden"
            onClick={() => setOpen(false)}
          />
        ) : null}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-emerald-950/10 bg-white p-5 shadow-[0_12px_40px_rgba(15,41,30,0.08)] transition-transform lg:static lg:translate-x-0 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-900 text-sm font-bold text-lime-100">
              AB
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-900">
                HarvestLock
              </p>
              <p className="text-xs text-stone-500">Agriculture settlement network</p>
            </div>
          </Link>

          <nav className="mt-8 space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex min-h-11 items-center rounded-xl px-4 text-sm font-medium transition ${
                    active
                      ? "bg-emerald-900 text-white"
                      : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 rounded-2xl border border-emerald-900/10 bg-emerald-50/70 p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-emerald-800">Session</p>
            <div className="mt-3">
              <ConnectWallet />
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 lg:pl-0">
          <header className="sticky top-0 z-30 border-b border-emerald-950/10 bg-[#f4f5f1]/90 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-stone-500">Dashboard</p>
                <h1 className="text-xl font-semibold text-stone-900 sm:text-2xl">{title}</h1>
                <p className="text-xs text-stone-600 sm:text-sm">{subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="inline-flex min-h-11 items-center rounded-full border border-stone-300 bg-white px-4 text-sm font-semibold lg:hidden"
              >
                Menu
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-emerald-950/10 pt-3">
              {quickItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex min-h-9 items-center rounded-full border border-emerald-900/20 bg-white px-3 text-xs font-semibold text-emerald-900 transition hover:bg-emerald-900 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </header>

          <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
