"use client";

// 채우기 폼: 자산 선택 → 금액 (최대 = 지갑 잔액) → 보내는 지갑(연결된 계정) → 요약 → 확인
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

/** 컨트랙트·목업 에러 코드 → 사용자 문구 */
const ERROR_TEXT: Record<string, string> = {
  ERR_TOKEN_NOT_FOUND: "This envelope doesn't exist.",
  ERR_INSUFFICIENT_DEPOSIT: "Enter an amount greater than 0.",
  ERR_INSUFFICIENT_BALANCE: "There isn't enough in your wallet.",
};

function errorText(e: unknown) {
  const message = (e as Error)?.message ?? "";
  const code = Object.keys(ERROR_TEXT).find((c) => message.includes(c));
  return code ? ERROR_TEXT[code] : message || "Something went wrong. Please try again.";
}

const FIELD =
  "mt-4 block w-full field px-5 py-4 text-xl font-normal";

export function AddForm({
  inside,
  wallet,
  accountId,
  cancelHref,
  onConfirm,
}: {
  /** 지금 봉투 안 자산 */
  inside: VaultBalances;
  /** 지갑에서 쓸 수 있는 잔액 (NEAR는 수수료 여유분 제외) */
  wallet: VaultBalances;
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

  // 처음에는 USDC, 지갑에 USDC가 없고 NEAR만 있으면 NEAR
  const token: Token =
    picked ?? (BigInt(wallet.usdc) === zero && BigInt(wallet.near) > zero ? "NEAR" : "USDC");
  const spec = TOKENS[token];
  const available = BigInt(wallet[spec.key]);

  let units: bigint | null = null;
  let amountError: string | null = null;
  if (amount.trim()) {
    try {
      units = BigInt(spec.toUnits(amount));
      if (units === zero) amountError = "Enter an amount greater than 0.";
      else if (units > available) amountError = "More than what's in your wallet.";
    } catch {
      amountError = `Enter a valid amount (up to ${spec.decimals} decimal places).`;
    }
  }
  const valid = units !== null && amountError === null;
  const adding = valid ? units! : zero;

  const addText = `${spec.fromUnits(adding.toString(), spec.decimals)} ${token}`;
  const after = { ...inside, [spec.key]: (BigInt(inside[spec.key]) + adding).toString() };

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
    <section className="sheet p-6 sm:p-8">
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
          Available in your wallet: {spec.fromUnits(available.toString())} {token}
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
        {available === zero && (
          <Link href="/wallet" className="basis-full link">
            Get test {token} in Wallet
          </Link>
        )}
        {amountError && <span className="basis-full text-danger">{amountError}</span>}
      </div>

      <label className="mt-6 block text-[15px] font-medium">
        From your connected wallet
        <input readOnly value={accountId} title={accountId} className={`${FIELD} truncate`} />
      </label>

      <div className="mt-4 note p-6">
        <div className="text-2xl font-semibold">You add: {addText}</div>
        <div className="mt-5 text-[17px]">Inside after: {assetsText(after) ?? "Nothing"}</div>
        <div className="mt-5 text-sm text-ink-muted">
          {token === "USDC"
            ? "If this envelope hasn't held USDC before, it's also registered with the USDC contract (about 0.00125 NEAR)."
            : "Your wallet shows the network fee before you confirm."}
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-[15px] text-danger">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-4">
        <Link href={cancelHref} className={BUTTON_SECONDARY}>
          Cancel
        </Link>
        <button onClick={confirm} disabled={!valid || submitting} className={`${BUTTON_PRIMARY} disabled:opacity-50`}>
          {submitting ? "Adding…" : "Add to Envelope"}
        </button>
      </div>
    </section>
  );
}
