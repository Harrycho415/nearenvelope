// 보내기 1단계 "Choose an Envelope"의 선택 카드.
// 소유자: D

import type { EnvelopeView } from "@/lib/near";

import { designName, RARITY_LABEL, RARITY_TEXT } from "./designs";
import { EnvelopeIllustration } from "./EnvelopeIllustration";

const formatDate = (ms: number) =>
  new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export function ChooseEnvelopeCard({
  envelope,
  selected,
  onSelect,
}: {
  envelope: EnvelopeView;
  selected: boolean;
  onSelect: () => void;
}) {
  const gifted = envelope.history.length;

  return (
    <div
      className={`rounded-3xl border bg-surface p-6 transition ${
        selected ? "border-2 border-brand" : "border-line hover:border-sketch"
      }`}
    >
      <EnvelopeIllustration design={envelope.design} rarity={envelope.rarity} className="w-full" />
      <h3 className="mt-7 text-2xl font-semibold">
        {designName(envelope.design)} Envelope +{envelope.level}
      </h3>
      <div className={`mt-4 text-xs font-semibold uppercase tracking-wide ${RARITY_TEXT[envelope.rarity]}`}>
        {RARITY_LABEL[envelope.rarity]}
      </div>
      <div className="mt-4 space-y-0.5 text-[15px] text-ink-muted">
        <div>Created {formatDate(envelope.created_at_ms)}</div>
        <div>
          Gifted {gifted} {gifted === 1 ? "time" : "times"}
        </div>
      </div>
      <button
        onClick={onSelect}
        aria-pressed={selected}
        className={`mt-4 rounded-lg px-6 py-3 font-semibold transition ${
          selected
            ? "bg-brand text-on-brand hover:bg-brand-hover"
            : "border border-line bg-surface text-ink hover:border-sketch"
        }`}
      >
        {selected ? "Selected" : "Choose Envelope"}
      </button>
    </div>
  );
}
