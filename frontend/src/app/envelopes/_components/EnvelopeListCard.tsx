// My Envelopes 목록 카드. 받고 아직 안 열어 본 봉투는 받기 화면(/open)으로 보내 홈과 같은 열기 흐름을 탄다.
// 소유자: C

import Link from "next/link";

import { EnvelopeIllustration } from "@/components/envelope/EnvelopeIllustration";
import { RARITY_LABEL, RARITY_TEXT } from "@/components/envelope/designs";
import { displayName, type EnvelopeView } from "@/lib/near";

import { assetsText, BUTTON_PRIMARY, BUTTON_SECONDARY, envelopeName, type BalancesResult } from "./shared";

export function EnvelopeListCard({
  envelope,
  balances,
  unopened,
}: {
  envelope: EnvelopeView;
  /** null = 로딩 중 */
  balances: BalancesResult | null;
  /** 나에게 전달됐고 이 브라우저에서 아직 열어 보지 않음 (lib/opened.ts) */
  unopened: boolean;
}) {
  const from = envelope.history.at(-1)?.from;
  const contains =
    balances === null ? "…" : balances === "error" ? "Unavailable" : (assetsText(balances) ?? "No assets inside");

  return (
    <article className="lift flex flex-col sheet p-6">
      <EnvelopeIllustration design={envelope.design} rarity={envelope.rarity} className="w-full" />
      <h2 className="mt-7 text-2xl font-semibold">
        {envelopeName(envelope)} +{envelope.level}
      </h2>
      <div className={`mt-4 label ${RARITY_TEXT[envelope.rarity]}`}>
        {RARITY_LABEL[envelope.rarity]}
      </div>
      <div className="mt-4 truncate text-[15px] text-ink-muted" title={from}>
        {from ? `From ${displayName(from)}` : "Created by you"}
      </div>
      <div className="mt-4 text-[17px]">Contains: {contains}</div>
      {unopened ? (
        <Link href={`/envelopes/${envelope.token_id}/open`} className={`${BUTTON_PRIMARY} mt-5 self-start`}>
          Open Envelope
        </Link>
      ) : (
        <Link href={`/envelopes/${envelope.token_id}`} className={`${BUTTON_SECONDARY} mt-5 self-start`}>
          View Envelope
        </Link>
      )}
    </article>
  );
}
