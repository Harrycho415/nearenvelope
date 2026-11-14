"use client";

// 소유자: C

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

import { ConnectButton } from "./ConnectButton";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/send", label: "Send" },
  { href: "/envelopes", label: "My Envelopes" },
  { href: "/missions", label: "Missions" },
  { href: "/wallet", label: "Wallet" },
];

export function SiteHeader() {
  return (
    <header className="bg-surface">
      <div className="mx-auto flex h-20 max-w-[1312px] items-center gap-12 px-6 sm:px-16">
        <Link href="/" className="text-[22px] font-semibold tracking-tight text-ink">
          NEAR Envelope
        </Link>
        <nav className="hidden flex-1 gap-8 md:flex">
          {/* 동적 라우트에서 usePathname이 prerender를 막지 않도록 Suspense로 감싼다 */}
          <Suspense fallback={<NavLinks pathname={null} />}>
            <ActiveNavLinks />
          </Suspense>
        </nav>
        <div className="ml-auto">
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}

function ActiveNavLinks() {
  return <NavLinks pathname={usePathname()} />;
}

function NavLinks({ pathname }: { pathname: string | null }) {
  const isActive = (href: string) =>
    pathname !== null && (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return NAV.map(({ href, label }) => (
    <Link
      key={href}
      href={href}
      className={`text-[15px] transition ${
        isActive(href) ? "font-semibold text-brand" : "text-ink-muted hover:text-ink"
      }`}
    >
      {label}
    </Link>
  ));
}
