"use client";

// 보내기 2단계: 넣을 자산 (USDC / NEAR)
// 소유자: C

import { EnvelopeIllustration } from "@/components/envelope/EnvelopeIllustration";
import { Tilt, sheenForLevel } from "@/components/envelope/Tilt";
import { RARITY_LABEL, RARITY_TEXT } from "@/components/envelope/designs";
import type { EnvelopeView, VaultBalances } from "@/lib/near";

import {
  balanceOf,
  envelopeTitle,
  formatAssets,
  formatToken,
  parseAmount,
  StepHeader,
  TOKENS,
  type AssetRow,
  type Token,
} from "./shared";

export function AssetsStep({
  envelope,
  inside,
  wallet,
  rows,
  setRows,
  total,
  onBack,
  onContinue,
}: {
  envelope: EnvelopeView;
  inside: VaultBalances;
  wallet: VaultBalances;
  rows: AssetRow[];
  setRows: (rows: AssetRow[]) => void;
  /** 기존 + 추가 합계 */
  total: VaultBalances;
  onBack: () => void;
  onContinue: () => void;
}) {
  const errors = rows.map((row) => {
    const units = parseAmount(row);
    if (units === null) return "Enter a valid amount.";
    if (units > balanceOf(wallet, row.token)) return "More than your available balance.";
    return null;
  });
  const totalText = formatAssets(total);
  const canContinue = errors.every((e) => e === null) && totalText !== null;
  const gifted = envelope.history.length;

  const update = (key: number, patch: Partial<AssetRow>) =>
    setRows(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const unusedToken = TOKENS.find((t) => !rows.some((r) => r.token === t));

  return (
    <>
      <StepHeader
        title="Put something inside"
        subtitle="Choose what to give. The assets will belong to whoever owns this envelope."
      />

      <div className="mt-9 grid items-start gap-10 lg:grid-cols-[360px_1fr]">
        <div className="sheet p-6">
          <Tilt sheen={sheenForLevel(envelope.level)} className="rise">
            <EnvelopeIllustration design={envelope.design} rarity={envelope.rarity} className="w-full" />
          </Tilt>
          <h2 className="mt-6 text-2xl font-semibold">{envelopeTitle(envelope)}</h2>
          <div className="mt-4 text-[13px] font-medium text-ink-muted">
            <span className={RARITY_TEXT[envelope.rarity]}>{RARITY_LABEL[envelope.rarity].toUpperCase()}</span> · Gifted{" "}
            {gifted} {gifted === 1 ? "time" : "times"}
          </div>
          <div className="mt-4 text-[15px] text-ink-muted">Assets inside now: {formatAssets(inside) ?? "None"}</div>
        </div>

        <div className="sheet p-8">
          <h2 className="text-2xl">Add an asset</h2>

          {rows.map((row, i) => (
            <div key={row.key} className="mt-5">
              <div className="grid grid-cols-[1fr_auto] gap-5 sm:grid-cols-[1fr_240px]">
                <label className="text-[15px] font-medium">
                  Amount
                  <input
                    inputMode="decimal"
                    placeholder="0"
                    value={row.amount}
                    onChange={(e) => update(row.key, { amount: e.target.value.replace(/[^\d.]/g, "") })}
                    className="mt-4 block w-full field px-5 py-4 text-2xl font-normal"
                  />
                </label>
                <label className="text-[15px] font-medium">
                  Token
                  <div className="relative mt-4">
                    <select
                      value={row.token}
                      onChange={(e) => update(row.key, { token: e.target.value as Token, amount: "" })}
                      className="block w-full appearance-none field px-5 py-4 text-xl font-normal"
                    >
                      {TOKENS.filter((t) => t === row.token || !rows.some((r) => r.token === t)).map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-xs">▼</span>
                  </div>
                </label>
              </div>
              <div className="mt-4 flex items-center gap-4 text-[15px]">
                <span className="text-ink-muted">
                  Available: {formatToken(balanceOf(wallet, row.token), row.token)} {row.token}
                </span>
                {errors[i] && <span className="text-danger">{errors[i]}</span>}
                {rows.length > 1 && (
                  <button
                    onClick={() => setRows(rows.filter((r) => r.key !== row.key))}
                    className="ml-auto text-ink-muted hover:text-ink"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}

          {unusedToken && (
            <button
              onClick={() => setRows([...rows, { key: Date.now(), token: unusedToken, amount: "" }])}
              className="mt-5 btn btn-secondary"
            >
              + Add another asset
            </button>
          )}

          <div className="mt-4 note p-6">
            <div className="text-[15px] text-ink-muted">Inside this envelope</div>
            <div className="mt-5 text-3xl font-semibold">{totalText ?? "Nothing yet"}</div>
            <div className="mt-5 text-sm text-ink-muted">Network fee is shown before you send.</div>
          </div>

          <div className="mt-4 flex gap-4">
            <button
              onClick={onBack}
              className="btn btn-secondary"
            >
              Back
            </button>
            <button
              onClick={onContinue}
              disabled={!canContinue}
              className="btn btn-primary"
            >
              Continue
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 note px-6 py-6 text-[15px]">
        The envelope holds the assets. Sending the envelope also transfers control of everything still inside.
      </div>
    </>
  );
}
