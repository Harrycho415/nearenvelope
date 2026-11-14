// 홈 "Recently received" 카드. 안 열어 본 봉투는 받기 화면으로 보낸다.
// 소유자: D

import Link from "next/link";

import { displayName, type EnvelopeView } from "@/lib/near";

import { designName, RARITY_LABEL, RARITY_TEXT } from "./designs";
import { EnvelopeIllustration } from "./EnvelopeIllustration";

export function ReceivedEnvelopeCard({ envelope, opened }: { envelope: EnvelopeView; opened: boolean }) {
  const from = envelope.history.at(-1)?.from;

  return (
    <Link
      href={`/envelopes/${envelope.token_id}${opened ? "" : "/open"}`}
      className="flex items-center gap-4 rounded-3xl border border-line bg-surface p-5 transition hover:border-sketch"
    >
      <EnvelopeIllustration design={envelope.design} rarity={envelope.rarity} className="w-28 shrink-0" />
      <div className="min-w-0">
        <div className="truncate text-[17px] font-semibold">
          {designName(envelope.design)} Envelope +{envelope.level}
        </div>
        <div className={`mt-2 text-[13px] font-medium ${RARITY_TEXT[envelope.rarity]}`}>{RARITY_LABEL[envelope.rarity]}</div>
        <div className="mt-2 truncate text-sm text-ink-muted">
          {from ? `From ${displayName(from)}` : "Minted by you"} · {opened ? "Opened" : "Unopened"}
        </div>
      </div>
    </Link>
  );
}
