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
    <header className="sticky top-0 z-40 border-b border-line bg-canvas">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-10 px-6 sm:px-16">
        <Link href="/" className="flex items-center gap-2.5 whitespace-nowrap text-xl text-ink">
          <span aria-hidden className="size-3 rounded-full bg-stamp shadow-[inset_0_-1px_0_rgb(0_0_0/0.2)]" />
          NEAR Envelope
        </Link>
        <nav className="hidden flex-1 gap-7 md:flex">
          {/* 동적 라우트에서 usePathname이 prerender를 막지 않도록 Suspense로 감싼다 */}
          <Suspense fallback={<NavLinks pathname={null} />}>
            <ActiveNavLinks />
          </Suspense>
        </nav>
        <div className="ml-auto">
          <ConnectButton />
        </div>
      </div>
      {/* 좁은 화면: 가로로 넘기는 색인 줄 */}
      <nav className="flex gap-6 overflow-x-auto border-t border-dashed border-sketch px-6 md:hidden">
        <Suspense fallback={<NavLinks pathname={null} />}>
          <ActiveNavLinks />
        </Suspense>
      </nav>
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
      aria-current={isActive(href) ? "page" : undefined}
      className={`flex min-h-11 items-center whitespace-nowrap border-b-2 font-mono text-xs uppercase tracking-[0.12em] transition-colors duration-200 ${
        isActive(href) ? "border-brand text-ink" : "border-transparent text-ink-muted hover:text-ink"
      }`}
    >
      {label}
    </Link>
  ));
}
