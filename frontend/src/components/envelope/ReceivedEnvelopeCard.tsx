// 홈 "Recently received" 카드.
// 소유자: D

import Link from "next/link";

import { displayName, type EnvelopeView } from "@/lib/near";

import { designName, RARITY_LABEL } from "./designs";
import { EnvelopeIllustration } from "./EnvelopeIllustration";

export function ReceivedEnvelopeCard({ envelope, opened }: { envelope: EnvelopeView; opened: boolean }) {
  const from = envelope.history.at(-1)?.from;

  return (
    <Link
      href={`/envelopes/${envelope.token_id}`}
      className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 transition hover:border-sketch"
    >
      <EnvelopeIllustration className="w-28 shrink-0" />
      <div className="min-w-0">
        <div className="truncate text-[17px] font-semibold">
          {designName(envelope.design)} Envelope +{envelope.level}
        </div>
        <div className="mt-2 text-[13px] font-medium text-brand">{RARITY_LABEL[envelope.rarity]}</div>
        <div className="mt-2 truncate text-sm text-ink-muted">
          {from ? `From ${displayName(from)}` : "Minted by you"} · {opened ? "Opened" : "Unopened"}
        </div>
      </div>
    </Link>
  );
}
