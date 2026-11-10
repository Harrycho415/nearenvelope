// 봉투 카드 (임시 디자인). 희귀도별 비주얼은 public/designs/{design}/{rarity}.svg 로 교체 예정.
// 소유자: D

import type { EnvelopeView, Rarity } from "@/lib/near";

const RARITY_STYLE: Record<Rarity, string> = {
  Basic: "border-zinc-300 bg-zinc-50",
  Rare: "border-sky-400 bg-sky-50",
  Epic: "border-violet-500 bg-violet-50",
  Legendary: "border-amber-500 bg-amber-50",
};

export function EnvelopeCard({ envelope }: { envelope: EnvelopeView }) {
  return (
    <div className={`rounded-2xl border-2 p-5 ${RARITY_STYLE[envelope.rarity]}`}>
      <div className="text-xs uppercase tracking-wide opacity-60">#{envelope.token_id}</div>
      <div className="mt-2 text-lg font-semibold">
        {envelope.rarity} Envelope +{envelope.level}
      </div>
      <div className="mt-1 text-sm opacity-70">
        티켓 {envelope.enhance_tickets} · 전달 {envelope.history.length}회
      </div>
    </div>
  );
}
