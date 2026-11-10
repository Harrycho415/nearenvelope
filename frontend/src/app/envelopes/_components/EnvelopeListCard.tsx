// My Envelopes 목록 카드
// 소유자: C

import Link from "next/link";

import { EnvelopeIllustration } from "@/components/envelope/EnvelopeIllustration";
import { RARITY_LABEL } from "@/components/envelope/designs";
import { displayName, type EnvelopeView } from "@/lib/near";

import { assetsText, BUTTON_SECONDARY, envelopeName, type BalancesResult } from "./shared";

export function EnvelopeListCard({
  envelope,
  balances,
}: {
  envelope: EnvelopeView;
  /** null = 로딩 중 */
  balances: BalancesResult | null;
}) {
  const from = envelope.history.at(-1)?.from;
  const contains =
    balances === null ? "…" : balances === "error" ? "Unavailable" : (assetsText(balances) ?? "No assets inside");

  return (
    <article className="flex flex-col rounded-2xl border border-line bg-surface p-6">
      <EnvelopeIllustration className="w-full" />
      <h3 className="mt-7 text-2xl font-semibold">
        {envelopeName(envelope)} +{envelope.level}
      </h3>
      <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-brand">
        {RARITY_LABEL[envelope.rarity]}
      </div>
      <div className="mt-4 truncate text-[15px] text-ink-muted" title={from}>
        {from ? `From ${displayName(from)}` : "Created by you"}
      </div>
      <div className="mt-4 text-[17px]">Contains: {contains}</div>
      <Link href={`/envelopes/${envelope.token_id}`} className={`${BUTTON_SECONDARY} mt-5 self-start`}>
        View Envelope
      </Link>
    </article>
  );
}
