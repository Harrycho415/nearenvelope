"use client";

// 소유자: C
import { useNear } from "@/lib/near";

export function ConnectButton() {
  const { accountId, signIn, signOut } = useNear();

  return accountId ? (
    <button onClick={signOut} className="rounded-full border px-4 py-2 text-sm">
      {accountId}
    </button>
  ) : (
    <button onClick={signIn} className="rounded-full bg-black px-4 py-2 text-sm text-white">
      Connect Wallet
    </button>
  );
}
