// 보내기 1단계 "Choose an Envelope"의 봉투 카드. Send를 누르면 바로 다음 단계(/send/[tokenId])로 간다.
// 소유자: D

import Link from "next/link";

import type { EnvelopeView } from "@/lib/near";

import { designName, RARITY_LABEL, RARITY_TEXT } from "./designs";
import { EnvelopeIllustration } from "./EnvelopeIllustration";
import { Tilt, sheenForLevel } from "./Tilt";

const formatDate = (ms: number) =>
  new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export function ChooseEnvelopeCard({ envelope }: { envelope: EnvelopeView }) {
  const gifted = envelope.history.length;

  return (
    <div className="sheet p-6 transition hover:border-sketch">
      <Tilt sheen={sheenForLevel(envelope.level)} >
        <EnvelopeIllustration design={envelope.design} rarity={envelope.rarity} className="w-full" />
      </Tilt>
      <h2 className="mt-7 text-2xl font-semibold">
        {designName(envelope.design)} Envelope +{envelope.level}
      </h2>
      <div className={`mt-4 label ${RARITY_TEXT[envelope.rarity]}`}>
        {RARITY_LABEL[envelope.rarity]}
      </div>
      <div className="mt-4 space-y-0.5 text-[15px] text-ink-muted">
        <div>Created {formatDate(envelope.created_at_ms)}</div>
        <div>
          Gifted {gifted} {gifted === 1 ? "time" : "times"}
        </div>
      </div>
      <Link
        href={`/send/${envelope.token_id}`}
        className="mt-4 btn btn-primary"
      >
        Send
      </Link>
    </div>
  );
}
