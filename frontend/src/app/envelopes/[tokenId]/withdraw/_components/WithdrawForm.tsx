"use client";

// 출금 폼: 자산 선택 → 금액 (최대 = Vault 잔액) → 받는 지갑(연결된 계정, 변경 불가) → 요약 → 확인
// 소유자: C

import Link from "next/link";
import { useState } from "react";

import {
  FT_DECIMALS,
  NEAR_DECIMALS,
  nearToYocto,
  unitsToUsdc,
  usdcToUnits,
  yoctoToNear,
  type VaultBalances,
} from "@/lib/near";

import { assetsText, BUTTON_PRIMARY, BUTTON_SECONDARY } from "../../../_components/shared";

export type Token = "USDC" | "NEAR";

const TOKENS: Record<
  Token,
  {
    key: keyof VaultBalances;
    decimals: number;
    toUnits: (amount: string) => string;
    fromUnits: (units: string, maxFraction?: number) => string;
  }
> = {
  USDC: { key: "usdc", decimals: FT_DECIMALS, toUnits: usdcToUnits, fromUnits: unitsToUsdc },
  NEAR: { key: "near", decimals: NEAR_DECIMALS, toUnits: nearToYocto, fromUnits: yoctoToNear },
};

/** claim_ft 최대 Gas(100 Tgas) 기준 상한. 실제 사용량은 더 적다. */
const FEE_TEXT = "< 0.01 NEAR";

/** 컨트랙트·목업 에러 코드 → 사용자 문구 */
const ERROR_TEXT: Record<string, string> = {
  ERR_NOT_OWNER: "You no longer own this envelope.",
  ERR_TOKEN_NOT_FOUND: "This envelope doesn't exist.",
  ERR_INSUFFICIENT_BALANCE: "There isn't enough inside this envelope.",
};

function errorText(e: unknown) {
  const message = (e as Error)?.message ?? "";
  const code = Object.keys(ERROR_TEXT).find((c) => message.includes(c));
  return code ? ERROR_TEXT[code] : message || "Something went wrong. Please try again.";
}

const FIELD =
  "mt-4 block w-full rounded-xl border border-line bg-surface px-5 py-4 text-xl font-normal outline-none focus:border-brand";

export function WithdrawForm({
  balances,
  accountId,
  cancelHref,
  onConfirm,
}: {
  balances: VaultBalances;
  accountId: string;
  cancelHref: string;
  /** units = 최소 단위 문자열. 실패하면 throw */
  onConfirm: (token: Token, units: string) => Promise<void>;
}) {
  const zero = BigInt(0);
  const [picked, setPicked] = useState<Token | null>(null);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 처음에는 USDC, USDC가 비어 있고 NEAR만 있으면 NEAR
  const token: Token =
    picked ?? (BigInt(balances.usdc) === zero && BigInt(balances.near) > zero ? "NEAR" : "USDC");
  const spec = TOKENS[token];
  const available = BigInt(balances[spec.key]);

  let units: bigint | null = null;
  let amountError: string | null = null;
  if (amount.trim()) {
    try {
      units = BigInt(spec.toUnits(amount));
      if (units === zero) amountError = "Enter an amount greater than 0.";
      else if (units > available) amountError = "More than what's inside this envelope.";
    } catch {
      amountError = `Enter a valid amount (up to ${spec.decimals} decimal places).`;
    }
  }
  const valid = units !== null && amountError === null;
  const withdrawing = valid ? units! : zero;

  const receiveText = `${spec.fromUnits(withdrawing.toString(), spec.decimals)} ${token}`;
  const remaining = { ...balances, [spec.key]: (available - withdrawing).toString() };

  async function confirm() {
    if (!valid) return;
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(token, units!.toString());
    } catch (e) {
      setError(errorText(e));
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
      <label className="block text-[15px] font-medium">
        Asset
        <div className="relative">
          <select
            value={token}
            onChange={(e) => {
              setPicked(e.target.value as Token);
              setAmount("");
              setError(null);
            }}
            disabled={submitting}
            className={`${FIELD} appearance-none`}
          >
            {(Object.keys(TOKENS) as Token[]).map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-5 top-1/2 mt-2 -translate-y-1/2 text-xs" aria-hidden>
            ▼
          </span>
        </div>
      </label>

      <label className="mt-6 block text-[15px] font-medium">
        Amount
        <input
          inputMode="decimal"
          placeholder="0"
          value={amount}
          onChange={(e) => {
            // 숫자와 소수점 하나만 (toUnits는 두 번째 점 이후를 버리므로 입력에서 막는다)
            setAmount(e.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1"));
            setError(null);
          }}
          disabled={submitting}
          aria-invalid={amountError !== null}
          className={FIELD}
        />
      </label>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-[15px] text-ink-muted">
        <span>
          Available inside: {spec.fromUnits(available.toString())} {token}
        </span>
        <span aria-hidden>·</span>
        <button
          type="button"
          onClick={() => setAmount(spec.fromUnits(available.toString(), spec.decimals))}
          disabled={submitting || available === zero}
          className="hover:text-ink disabled:opacity-50 disabled:hover:text-ink-muted"
        >
          Use maximum
        </button>
        {amountError && <span className="basis-full text-red-600">{amountError}</span>}
      </div>

      <label className="mt-6 block text-[15px] font-medium">
        To your connected wallet
        <input readOnly value={accountId} title={accountId} className={`${FIELD} truncate`} />
      </label>

      <div className="mt-4 rounded-2xl border border-line bg-seal/40 p-6">
        <div className="text-2xl font-semibold">You receive: {receiveText}</div>
        <div className="mt-5 text-[17px]">Remaining inside: {assetsText(remaining) ?? "Nothing"}</div>
        <div className="mt-5 text-sm text-ink-muted">Estimated network fee: {FEE_TEXT}</div>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-[15px] text-red-600">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-4">
        <Link href={cancelHref} className={BUTTON_SECONDARY}>
          Cancel
        </Link>
        <button onClick={confirm} disabled={!valid || submitting} className={`${BUTTON_PRIMARY} disabled:opacity-50`}>
          {submitting ? "Withdrawing…" : "Confirm Withdrawal"}
        </button>
      </div>
    </section>
  );
}
