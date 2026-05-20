import ConnectWallet from "@/components/ConnectWallet";
import Link from "next/link";
import { Leaf } from "lucide-react";

const links = [
  { label: "Home", href: "/" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Explore", href: "/explore" },
  { label: "My Orders", href: "/order" },
  { label: "Dashboard", href: "/dashboard" },
];

export default function NavigationBar() {
  return (
    <header className="sticky top-0 z-20 border-b border-farm-200/60 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-3 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-farm-900 text-white">
            <Leaf size={18} />
          </div>
          <span className="hidden text-base font-bold tracking-tight text-farm-900 sm:block">
            Agri-Block
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-stone-600 transition hover:bg-farm-50 hover:text-farm-800"
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Mobile nav dropdown button */}
          <div className="relative md:hidden">
            <MobileNav />
          </div>
          <ConnectWallet />
        </div>
      </div>
    </header>
  );
}

function MobileNav() {
  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center rounded-lg p-1.5 text-stone-600 hover:bg-farm-50">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </summary>
      <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-stone-200 bg-white py-1 shadow-lg">
        {links.map((link) => (
          <Link
            key={link.href}
            className="block px-4 py-2 text-sm text-stone-700 hover:bg-farm-50 hover:text-farm-800"
            href={link.href}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </details>
  );
}