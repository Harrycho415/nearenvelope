// My Envelopes 목록과 봉투 상세가 함께 쓰는 표시 헬퍼.
// 소유자: C

import type { ReactNode } from "react";

import { designName } from "@/components/envelope/designs";
import { unitsToUsdc, useNear, yoctoToNear, type EnvelopeView, type VaultBalances } from "@/lib/near";

/** 비동기 결과를 요청 키와 함께 저장해, 키가 바뀌면 이전 결과를 버리고 로딩으로 본다. */
export interface Keyed<T> {
  key: string;
  value: T;
}

export type BalancesResult = VaultBalances | "error";

export const BUTTON_PRIMARY = "btn btn-primary";
export const BUTTON_SECONDARY = "btn btn-secondary";

/** "Golden Envelope" */
export const envelopeName = (e: EnvelopeView) => `${designName(e.design)} Envelope`;

/** "Nov 10, 2026" */
export const formatDate = (ms: number) =>
  new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export const formatUsdc = (b: VaultBalances) => `${unitsToUsdc(b.usdc)} USDC`;
export const formatNear = (b: VaultBalances) => `${yoctoToNear(b.near)} NEAR`;

/** "50 USDC · 2.3 NEAR". 비어 있으면 null */
export function assetsText(b: VaultBalances): string | null {
  const parts = [
    BigInt(b.usdc) > BigInt(0) && formatUsdc(b),
    BigInt(b.near) > BigInt(0) && formatNear(b),
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="note p-6 text-[15px] text-ink-muted">
      {children}
    </div>
  );
}

export function ConnectNotice({ message }: { message: string }) {
  const { signIn, ready } = useNear();
  return (
    <Notice>
      {message}{" "}
      <button onClick={() => signIn()} disabled={!ready} className="link">
        Connect Wallet
      </button>
    </Notice>
  );
}

export function RetryButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="link">
      Try again
    </button>
  );
}
