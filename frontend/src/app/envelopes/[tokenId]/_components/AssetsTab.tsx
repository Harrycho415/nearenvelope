// Assets 탭: Vault 잔액 (api.vaultBalances).
// Add Assets는 채우기 화면(/envelopes/[tokenId]/add, 누구나), Withdraw는 출금 화면(/envelopes/[tokenId]/withdraw, 소유자만)으로 이동.
// 소유자: C

import Link from "next/link";

import type { VaultBalances } from "@/lib/near";

import {
  BUTTON_SECONDARY,
  formatNear,
  formatUsdc,
  RetryButton,
  type BalancesResult,
} from "../../_components/shared";

const ASSETS: { symbol: string; name: string; format: (b: VaultBalances) => string }[] = [
  { symbol: "USDC", name: "USD Coin", format: formatUsdc },
  { symbol: "NEAR", name: "NEAR Protocol", format: formatNear },
];

export function AssetsTab({
  tokenId,
  balances,
  isOwner,
  onRetry,
}: {
  tokenId: string;
  /** null = 로딩 중 */
  balances: BalancesResult | null;
  isOwner: boolean;
  onRetry: () => void;
}) {
  return (
    <>
      <section className="mt-8 rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-[28px] font-semibold leading-tight">Inside this envelope</h2>
            <p className="mt-3 text-[15px] text-ink-muted">These assets belong to the current envelope owner.</p>
          </div>
          <div className="flex gap-4">
            <Link href={`/envelopes/${tokenId}/add`} className={BUTTON_SECONDARY}>
              Add Assets
            </Link>
            {isOwner && (
              <Link href={`/envelopes/${tokenId}/withdraw`} className={BUTTON_SECONDARY}>
                Withdraw
              </Link>
            )}
          </div>
        </div>

        <table className="mt-6 w-full border-separate border-spacing-0 text-left">
          <thead>
            <tr className="text-[17px] text-ink-muted">
              <th className="rounded-l-xl border-y border-l border-line bg-seal/40 px-4 py-4 font-normal">Asset</th>
              <th className="w-[35%] rounded-r-xl border-y border-r border-line bg-seal/40 px-4 py-4 font-normal">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {balances === "error" ? (
              <tr>
                <td colSpan={2} className="pt-6 text-sm text-ink-muted">
                  We couldn&apos;t load the assets inside this envelope. <RetryButton onClick={onRetry} />
                </td>
              </tr>
            ) : (
              ASSETS.map(({ symbol, name, format }) => (
                <tr key={symbol}>
                  <td className="pt-5">
                    <div className="text-[22px] font-semibold">{symbol}</div>
                    <div className="mt-3 text-sm text-ink-muted">{name}</div>
                  </td>
                  <td className="px-4 pt-5 align-middle">
                    {balances === null ? (
                      <span className="block h-7 w-28 animate-pulse rounded-md bg-line" aria-label="Loading" />
                    ) : (
                      <span className="text-2xl font-semibold sm:text-[26px]">{format(balances)}</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <section className="mt-8 rounded-2xl border border-line bg-seal/40 p-6">
        <h2 className="text-[22px] font-semibold">The gift travels as one.</h2>
        <p className="mt-5 text-[17px] leading-relaxed text-ink-muted">
          Assets remain connected to this envelope until withdrawn. If the envelope is sent to another user, control
          of the remaining assets moves with the envelope.
        </p>
      </section>
    </>
  );
}
