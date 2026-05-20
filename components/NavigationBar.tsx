import ConnectWallet from "@/components/ConnectWallet";
import Link from "next/link";

const links = [
  { label: "Marketplace", href: "/marketplace" },
  { label: "Order", href: "/order" }, // this will have the order and history
  { label: "DashBoard", href: "/dashboard" },
];

export default function NavigationBar() {
  return (
    <header className="sticky rounded-2xl mt-5 top-0 z-20 border-b border-emerald-950/10 bg-white/75 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-2 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-h-11 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-900 text-sm font-bold text-lime-100">
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-900">
              Agri-Block
            </p>

          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link
              key={link.label}
              className="text-sm font-medium text-stone-600 transition hover:text-emerald-900"
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <ConnectWallet />
      </div>
    </header>
  );
}
