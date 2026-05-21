"use client";

import ConnectWallet from "@/components/ConnectWallet";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Leaf,
  Home,
  Store,
  Map,
  User,
  List,
  ShieldAlert,
  BarChart3,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

const FARMER_LINKS = [
  { label: "Explore", href: "/explore", icon: Map },
  { label: "My Listings", href: "/mylistings", icon: List },
  { label: "Aid", href: "/aid", icon: ShieldAlert },
  { label: "Profile", href: "/profile", icon: User },
];

const BUYER_LINKS = [
  { label: "Marketplace", href: "/marketplace", icon: Store },
  { label: "Dashboard", href: "/dashboard", icon: BarChart3 },
];

export default function NavigationBar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-30 border-b border-farm-200/40 bg-white/85 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-2.5 sm:px-6">
        {/* Brand */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-farm-900 text-white shadow-sm shadow-farm-900/20 transition group-hover:shadow-md group-hover:shadow-farm-900/30">
            <Leaf size={18} />
          </div>
          <span className="hidden text-base font-bold tracking-tight text-stone-900 sm:block">
            Agri-Block
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden flex-1 items-center justify-center gap-0.5 lg:flex">
          {/* Home */}
          <NavLink href="/" active={isActive("/")}>
            <Home size={15} />
            Home
          </NavLink>

          {/* Divider */}
          <Divider />

          {/* Farmer tools */}
          <span className="mx-1 text-[10px] font-bold uppercase tracking-widest text-stone-300 select-none">
            Grower
          </span>
          {FARMER_LINKS.map(({ label, href, icon: Icon }) => (
            <NavLink key={href} href={href} active={isActive(href)}>
              {label}
            </NavLink>
          ))}

          {/* Divider */}
          <Divider />

          {/* Buyer tools */}
          <span className="mx-1 text-[10px] font-bold uppercase tracking-widest text-stone-300 select-none">
            Market
          </span>
          {BUYER_LINKS.map(({ label, href, icon: Icon }) => (
            <NavLink key={href} href={href} active={isActive(href)}>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-stone-600 hover:bg-stone-100 lg:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <ConnectWallet />
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-20 bg-black/20 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed left-0 right-0 top-[53px] z-20 mx-2 rounded-2xl border border-stone-200 bg-white shadow-xl lg:hidden animate-in slide-in-from-top-2 duration-200">
            <div className="px-4 py-3">
              {/* Home */}
              <MobileLink href="/" active={isActive("/")} icon={Home} onClick={() => setMobileOpen(false)}>
                Home
              </MobileLink>

              <div className="my-2 border-t border-stone-100" />

              <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                Grower
              </p>
              {FARMER_LINKS.map(({ label, href, icon }) => (
                <MobileLink
                  key={href}
                  href={href}
                  active={isActive(href)}
                  icon={icon}
                  onClick={() => setMobileOpen(false)}
                >
                  {label}
                </MobileLink>
              ))}

              <div className="my-2 border-t border-stone-100" />

              <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                Market
              </p>
              {BUYER_LINKS.map(({ label, href, icon }) => (
                <MobileLink
                  key={href}
                  href={href}
                  active={isActive(href)}
                  icon={icon}
                  onClick={() => setMobileOpen(false)}
                >
                  {label}
                </MobileLink>
              ))}
            </div>
          </div>
        </>
      )}
    </header>
  );
}

function Divider() {
  return <div className="mx-1.5 h-5 w-px bg-stone-200" />;
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-farm-50 text-farm-800"
          : "text-stone-500 hover:bg-stone-50 hover:text-stone-800"
      }`}
    >
      {children}
    </Link>
  );
}

function MobileLink({
  href,
  active,
  icon: Icon,
  children,
  onClick,
}: {
  href: string;
  active: boolean;
  icon: React.ElementType;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-farm-50 text-farm-800"
          : "text-stone-700 hover:bg-stone-50"
      }`}
    >
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
          active ? "bg-farm-200 text-farm-800" : "bg-stone-100 text-stone-500"
        }`}
      >
        <Icon size={16} />
      </div>
      {children}
      <ChevronRight size={14} className="ml-auto text-stone-300" />
    </Link>
  );
}
