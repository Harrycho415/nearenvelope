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
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:opacity-50"
        >
          Connect Wallet
        </button>
        {error && <span className="mt-1 text-xs text-red-600">{error}</span>}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen((o) => !o)}
        title={accountId}
        className="text-[15px] font-medium text-ink hover:text-brand"
      >
        {shortAccount(accountId)}
      </button>
      {menuOpen && (
        <div className="absolute right-0 mt-2 w-44 rounded-xl border border-line bg-surface p-1 shadow-sm">
          <button
            onClick={() => {
              setMenuOpen(false);
              signOut();
            }}
            className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-canvas"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
