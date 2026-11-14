"use client";

// Meteor 지갑 연결. 연결되면 계정 주소(긴 주소는 줄임)를 보여 주고, 누르면 연결 해제 메뉴가 열린다.
// 소유자: C

import { useState } from "react";

import { shortAccount, useNear } from "@/lib/near";

export function ConnectButton() {
  const { accountId, ready, signIn, signOut } = useNear();
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!accountId) {
    return (
      <div className="flex flex-col items-end">
        <button
          onClick={() => {
            setError(null);
            signIn().catch((e: Error) => setError(e.message || "연결에 실패했습니다"));
          }}
          disabled={!ready}
          className="btn btn-primary"
        >
          Connect Wallet
        </button>
        {error && <span className="mt-1 text-xs text-danger">{error}</span>}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen((o) => !o)}
        title={accountId}
        aria-expanded={menuOpen}
        className="flex min-h-11 items-center gap-2 font-mono text-xs tracking-[0.06em] text-ink transition-colors duration-200 hover:text-brand"
      >
        <span aria-hidden className="size-2 rounded-full bg-ok" />
        {shortAccount(accountId)}
      </button>
      {menuOpen && (
        <div className="sheet rise absolute right-0 mt-1 w-44 p-1 shadow-lift">
          <button
            onClick={() => {
              setMenuOpen(false);
              signOut();
            }}
            className="min-h-11 w-full rounded-xs px-3 text-left font-mono text-xs uppercase tracking-[0.1em] hover:bg-seal"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
